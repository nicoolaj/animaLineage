<?php

require_once __DIR__ . '/../Helpers/TestCase.php';
require_once __DIR__ . '/../../controllers/AuthController.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

/**
 * Tests fonctionnels complets du workflow d'authentification
 */
class AuthenticationWorkflowTest extends TestCase
{
    private $authController;
    private $authMiddleware;
    private $database;
    private $pdo;

    protected function setUp(): void
    {
        parent::setUp();

        $this->database = new Database();
        $this->pdo = $this->database->getConnection();
        $this->createTestTables($this->pdo);

        $user = new User($this->pdo, $this->database);
        $this->authController = new AuthController($user, $this->database);
        $this->authMiddleware = new AuthMiddleware($this->database);
    }

    /**
     * Test du workflow complet d'inscription et connexion
     */
    public function testCompleteRegistrationAndLoginWorkflow(): void
    {
        // 1. Inscription d'un nouvel utilisateur
        $registrationData = [
            'nom' => 'Test User',
            'email' => 'test@workflow.com',
            'password' => 'SecurePass123!',
            'confirm_password' => 'SecurePass123!'
        ];

        $this->makeRequest('POST', '/api/auth/register', $registrationData);

        ob_start();
        $this->authController->register();
        $registerOutput = ob_get_clean();

        $registerResponse = $this->assertJsonResponse($registerOutput, ['status', 'data']);
        $this->assertEquals(201, $registerResponse['status']);
        $this->assertArrayHasKey('user', $registerResponse['data']);
        $this->assertEquals(0, $registerResponse['data']['user']['status']); // En attente

        $userId = $registerResponse['data']['user']['id'];

        // 2. Tentative de connexion avec compte en attente
        $loginData = [
            'email' => 'test@workflow.com',
            'password' => 'SecurePass123!'
        ];

        $this->makeRequest('POST', '/api/auth/login', $loginData);

        ob_start();
        $this->authController->login();
        $loginOutput = ob_get_clean();

        $loginResponse = $this->assertJsonResponse($loginOutput, ['status', 'message']);
        $this->assertEquals(403, $loginResponse['status']);
        $this->assertStringContainsString('attente', $loginResponse['message']);

        // 3. Validation du compte par un admin
        $stmt = $this->pdo->prepare("UPDATE users SET status = 1 WHERE id = ?");
        $stmt->execute([$userId]);

        // 4. Connexion avec compte validé
        $this->makeRequest('POST', '/api/auth/login', $loginData);

        ob_start();
        $this->authController->login();
        $validLoginOutput = ob_get_clean();

        $validLoginResponse = $this->assertJsonResponse($validLoginOutput, ['status', 'data']);
        $this->assertEquals(200, $validLoginResponse['status']);
        $this->assertArrayHasKey('token', $validLoginResponse['data']);
        $this->assertArrayHasKey('user', $validLoginResponse['data']);

        $token = $validLoginResponse['data']['token'];

        // 5. Utilisation du token pour accéder à une ressource protégée
        $this->makeRequest('GET', '/api/user/profile', [], ['Authorization' => "Bearer $token"]);

        $userData = $this->authMiddleware->getUserFromToken($token);
        $this->assertIsArray($userData);
        $this->assertEquals($userId, $userData['id']);
        $this->assertEquals('test@workflow.com', $userData['email']);

        // 6. Déconnexion
        $this->makeRequest('POST', '/api/auth/logout', [], ['Authorization' => "Bearer $token"]);

        ob_start();
        $this->authController->logout();
        $logoutOutput = ob_get_clean();

        $logoutResponse = $this->assertJsonResponse($logoutOutput, ['status']);
        $this->assertEquals(200, $logoutResponse['status']);
    }

    /**
     * Test de sécurité contre les attaques par force brute
     */
    public function testBruteForceProtection(): void
    {
        $userData = $this->createTestUser($this->pdo, [
            'email' => 'bruteforce@test.com',
            'password' => password_hash('CorrectPassword123!', PASSWORD_DEFAULT),
            'status' => 1
        ]);

        $loginData = [
            'email' => 'bruteforce@test.com',
            'password' => 'WrongPassword'
        ];

        $consecutiveFailures = 0;

        // Simuler plusieurs tentatives de connexion échouées
        for ($i = 0; $i < 6; $i++) {
            $this->makeRequest('POST', '/api/auth/login', $loginData);

            ob_start();
            $this->authController->login();
            $output = ob_get_clean();

            $response = $this->assertJsonResponse($output, ['status']);

            if ($response['status'] === 429) {
                // Rate limiting activé
                $this->assertStringContainsString('tentatives', $response['message']);
                break;
            } else {
                $this->assertEquals(401, $response['status']);
                $consecutiveFailures++;
            }
        }

        // Vérifier que la protection contre la force brute s'active
        $this->assertGreaterThan(0, $consecutiveFailures);
        $this->assertLessThanOrEqual(5, $consecutiveFailures);
    }

    /**
     * Test de renouvellement de token
     */
    public function testTokenRefresh(): void
    {
        $userData = $this->createTestUser($this->pdo, [
            'email' => 'refresh@test.com',
            'password' => password_hash('Password123!', PASSWORD_DEFAULT),
            'status' => 1
        ]);

        // Connexion initiale
        $loginData = [
            'email' => 'refresh@test.com',
            'password' => 'Password123!'
        ];

        $this->makeRequest('POST', '/api/auth/login', $loginData);

        ob_start();
        $this->authController->login();
        $output = ob_get_clean();

        $response = $this->assertJsonResponse($output, ['status', 'data']);
        $originalToken = $response['data']['token'];

        // Attendre un moment (simulation)
        sleep(1);

        // Demande de renouvellement de token
        $this->makeRequest('POST', '/api/auth/refresh', [], ['Authorization' => "Bearer $originalToken"]);

        ob_start();
        $this->authController->refreshToken();
        $refreshOutput = ob_get_clean();

        $refreshResponse = $this->assertJsonResponse($refreshOutput, ['status', 'data']);
        $this->assertEquals(200, $refreshResponse['status']);
        $this->assertArrayHasKey('token', $refreshResponse['data']);

        $newToken = $refreshResponse['data']['token'];
        $this->assertNotEquals($originalToken, $newToken);

        // Vérifier que le nouveau token fonctionne
        $newUserData = $this->authMiddleware->getUserFromToken($newToken);
        $this->assertEquals($userData['id'], $newUserData['id']);
    }

    /**
     * Test de gestion des tokens expirés
     */
    public function testExpiredTokenHandling(): void
    {
        // Créer un token expiré
        $userData = [
            'id' => 999,
            'email' => 'expired@test.com',
            'role' => 'eleveur'
        ];

        $expiredPayload = [
            'iss' => 'animalineage-app',
            'iat' => time() - 7200, // Il y a 2 heures
            'exp' => time() - 3600, // Expiré il y a 1 heure
            'user' => $userData
        ];

        $expiredToken = \Firebase\JWT\JWT::encode(
            $expiredPayload,
            $_ENV['JWT_SECRET'],
            'HS256'
        );

        // Tentative d'utilisation du token expiré
        $this->makeRequest('GET', '/api/user/profile', [], ['Authorization' => "Bearer $expiredToken"]);

        $result = $this->authMiddleware->getUserFromToken($expiredToken);
        $this->assertNull($result, 'Un token expiré ne devrait pas être valide');
    }

    /**
     * Test de changement de mot de passe
     */
    public function testPasswordChangeWorkflow(): void
    {
        $currentPassword = 'CurrentPass123!';
        $newPassword = 'NewSecurePass456!';

        $userData = $this->createTestUser($this->pdo, [
            'email' => 'changepass@test.com',
            'password' => password_hash($currentPassword, PASSWORD_DEFAULT),
            'status' => 1
        ]);

        // Connexion avec l'ancien mot de passe
        $loginData = [
            'email' => 'changepass@test.com',
            'password' => $currentPassword
        ];

        $this->makeRequest('POST', '/api/auth/login', $loginData);

        ob_start();
        $this->authController->login();
        $output = ob_get_clean();

        $response = $this->assertJsonResponse($output, ['status', 'data']);
        $token = $response['data']['token'];

        // Changement de mot de passe
        $changePasswordData = [
            'current_password' => $currentPassword,
            'new_password' => $newPassword,
            'confirm_password' => $newPassword
        ];

        $this->makeRequest('PUT', '/api/auth/change-password', $changePasswordData, ['Authorization' => "Bearer $token"]);

        ob_start();
        $this->authController->changePassword();
        $changeOutput = ob_get_clean();

        $changeResponse = $this->assertJsonResponse($changeOutput, ['status']);
        $this->assertEquals(200, $changeResponse['status']);

        // Vérifier que l'ancien mot de passe ne fonctionne plus
        $this->makeRequest('POST', '/api/auth/login', $loginData);

        ob_start();
        $this->authController->login();
        $oldPasswordOutput = ob_get_clean();

        $oldPasswordResponse = $this->assertJsonResponse($oldPasswordOutput, ['status']);
        $this->assertEquals(401, $oldPasswordResponse['status']);

        // Vérifier que le nouveau mot de passe fonctionne
        $newLoginData = [
            'email' => 'changepass@test.com',
            'password' => $newPassword
        ];

        $this->makeRequest('POST', '/api/auth/login', $newLoginData);

        ob_start();
        $this->authController->login();
        $newPasswordOutput = ob_get_clean();

        $newPasswordResponse = $this->assertJsonResponse($newPasswordOutput, ['status']);
        $this->assertEquals(200, $newPasswordResponse['status']);
    }

    /**
     * Test de réinitialisation de mot de passe
     */
    public function testPasswordResetWorkflow(): void
    {
        $userData = $this->createTestUser($this->pdo, [
            'email' => 'reset@test.com',
            'status' => 1
        ]);

        // 1. Demande de réinitialisation
        $resetRequestData = ['email' => 'reset@test.com'];

        $this->makeRequest('POST', '/api/auth/forgot-password', $resetRequestData);

        ob_start();
        $this->authController->forgotPassword();
        $requestOutput = ob_get_clean();

        $requestResponse = $this->assertJsonResponse($requestOutput, ['status']);
        $this->assertEquals(200, $requestResponse['status']);

        // 2. Récupérer le token de reset de la base de données (simulé)
        $stmt = $this->pdo->prepare("SELECT reset_token FROM users WHERE email = ?");
        $stmt->execute(['reset@test.com']);
        $resetToken = $stmt->fetchColumn();

        $this->assertNotEmpty($resetToken);

        // 3. Réinitialisation avec le token
        $resetData = [
            'token' => $resetToken,
            'new_password' => 'NewResetPass123!',
            'confirm_password' => 'NewResetPass123!'
        ];

        $this->makeRequest('POST', '/api/auth/reset-password', $resetData);

        ob_start();
        $this->authController->resetPassword();
        $resetOutput = ob_get_clean();

        $resetResponse = $this->assertJsonResponse($resetOutput, ['status']);
        $this->assertEquals(200, $resetResponse['status']);

        // 4. Vérifier que le nouveau mot de passe fonctionne
        $loginData = [
            'email' => 'reset@test.com',
            'password' => 'NewResetPass123!'
        ];

        $this->makeRequest('POST', '/api/auth/login', $loginData);

        ob_start();
        $this->authController->login();
        $loginOutput = ob_get_clean();

        $loginResponse = $this->assertJsonResponse($loginOutput, ['status']);
        $this->assertEquals(200, $loginResponse['status']);
    }

    /**
     * Test de vérification des permissions par rôle
     */
    public function testRoleBasedAccess(): void
    {
        // Créer des utilisateurs avec différents rôles
        $adminUser = $this->createTestUser($this->pdo, [
            'email' => 'admin@test.com',
            'role' => 'admin',
            'status' => 1
        ]);

        $eleveurUser = $this->createTestUser($this->pdo, [
            'email' => 'eleveur@test.com',
            'role' => 'eleveur',
            'status' => 1
        ]);

        $consultantUser = $this->createTestUser($this->pdo, [
            'email' => 'consultant@test.com',
            'role' => 'consultant',
            'status' => 1
        ]);

        // Tester l'accès admin
        $this->assertTrue($this->authMiddleware->hasRole('admin', $adminUser));
        $this->assertTrue($this->authMiddleware->hasRole('eleveur', $adminUser));
        $this->assertTrue($this->authMiddleware->hasRole('consultant', $adminUser));

        // Tester l'accès éleveur
        $this->assertFalse($this->authMiddleware->hasRole('admin', $eleveurUser));
        $this->assertTrue($this->authMiddleware->hasRole('eleveur', $eleveurUser));
        $this->assertTrue($this->authMiddleware->hasRole('consultant', $eleveurUser));

        // Tester l'accès consultant
        $this->assertFalse($this->authMiddleware->hasRole('admin', $consultantUser));
        $this->assertFalse($this->authMiddleware->hasRole('eleveur', $consultantUser));
        $this->assertTrue($this->authMiddleware->hasRole('consultant', $consultantUser));
    }
}