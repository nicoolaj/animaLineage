<?php

require_once __DIR__ . '/../Helpers/TestCase.php';
require_once __DIR__ . '/../../controllers/UserController.php';
require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../../config/database.php';

/**
 * Tests d'intégration pour UserController
 */
class UserControllerTest extends TestCase
{
    private $controller;
    private $database;
    private $pdo;

    protected function setUp(): void
    {
        parent::setUp();

        // Créer une vraie instance de Database en mode test
        $this->database = new Database();
        $this->pdo = $this->database->getConnection();

        // Créer les tables
        $this->createTestTables($this->pdo);

        // Créer le contrôleur
        $user = new User($this->pdo, $this->database);
        $this->controller = new UserController($user, $this->database);
    }

    /**
     * Test de création d'utilisateur via API
     */
    public function testCreateUserAPI(): void
    {
        $userData = [
            'nom' => 'Jean Dupont',
            'email' => 'jean.dupont@example.com',
            'password' => 'Password123!',
            'confirm_password' => 'Password123!'
        ];

        $this->makeRequest('POST', '/api/users', $userData);

        ob_start();
        $this->controller->createUser();
        $output = ob_get_clean();

        $response = $this->assertJsonResponse($output, ['status', 'data']);

        $this->assertEquals(201, $response['status']);
        $this->assertArrayHasKey('id', $response['data']);
        $this->assertArrayHasKey('nom', $response['data']);
        $this->assertEquals($userData['nom'], $response['data']['nom']);
        $this->assertEquals($userData['email'], $response['data']['email']);

        // Vérifier que le mot de passe n'est pas retourné
        $this->assertArrayNotHasKey('password', $response['data']);
    }

    /**
     * Test de création d'utilisateur avec données invalides
     */
    public function testCreateUserWithInvalidData(): void
    {
        $invalidData = [
            'nom' => '',  // Nom vide
            'email' => 'invalid-email',  // Email invalide
            'password' => '123',  // Mot de passe faible
            'confirm_password' => '456'  // Confirmation différente
        ];

        $this->makeRequest('POST', '/api/users', $invalidData);

        ob_start();
        $this->controller->createUser();
        $output = ob_get_clean();

        $response = $this->assertJsonResponse($output, ['status', 'errors']);

        $this->assertEquals(422, $response['status']);
        $this->assertArrayHasKey('errors', $response);
        $this->assertArrayHasKey('nom', $response['errors']);
        $this->assertArrayHasKey('email', $response['errors']);
        $this->assertArrayHasKey('password', $response['errors']);
    }

    /**
     * Test de récupération de la liste des utilisateurs
     */
    public function testGetUsersAPI(): void
    {
        // Créer quelques utilisateurs de test
        $this->createTestUser($this->pdo, ['email' => 'user1@test.com', 'nom' => 'User 1']);
        $this->createTestUser($this->pdo, ['email' => 'user2@test.com', 'nom' => 'User 2']);
        $this->createTestUser($this->pdo, ['email' => 'user3@test.com', 'nom' => 'User 3']);

        $this->makeRequest('GET', '/api/users');

        ob_start();
        $this->controller->getUsers();
        $output = ob_get_clean();

        $response = $this->assertJsonResponse($output, ['status', 'data']);

        $this->assertEquals(200, $response['status']);
        $this->assertIsArray($response['data']);
        $this->assertCount(3, $response['data']);

        // Vérifier que les mots de passe ne sont pas retournés
        foreach ($response['data'] as $user) {
            $this->assertArrayNotHasKey('password', $user);
            $this->assertArrayHasKey('id', $user);
            $this->assertArrayHasKey('nom', $user);
            $this->assertArrayHasKey('email', $user);
        }
    }

    /**
     * Test de mise à jour de statut utilisateur
     */
    public function testUpdateUserStatus(): void
    {
        $userData = $this->createTestUser($this->pdo, ['status' => 0]);

        $updateData = ['status' => 1];
        $this->makeRequest('PUT', "/api/users/{$userData['id']}/status", $updateData);

        ob_start();
        $this->controller->updateUserStatus($userData['id']);
        $output = ob_get_clean();

        $response = $this->assertJsonResponse($output, ['status', 'data']);

        $this->assertEquals(200, $response['status']);
        $this->assertEquals(1, $response['data']['status']);

        // Vérifier en base de données
        $stmt = $this->pdo->prepare("SELECT status FROM users WHERE id = ?");
        $stmt->execute([$userData['id']]);
        $updatedStatus = $stmt->fetchColumn();
        $this->assertEquals(1, $updatedStatus);
    }

    /**
     * Test d'authentification avec identifiants valides
     */
    public function testLoginWithValidCredentials(): void
    {
        $password = 'Password123!';
        $userData = $this->createTestUser($this->pdo, [
            'email' => 'test@login.com',
            'password' => password_hash($password, PASSWORD_DEFAULT),
            'status' => 1
        ]);

        $loginData = [
            'email' => 'test@login.com',
            'password' => $password
        ];

        $this->makeRequest('POST', '/api/auth/login', $loginData);

        ob_start();
        $this->controller->login();
        $output = ob_get_clean();

        $response = $this->assertJsonResponse($output, ['status', 'data']);

        $this->assertEquals(200, $response['status']);
        $this->assertArrayHasKey('token', $response['data']);
        $this->assertArrayHasKey('user', $response['data']);
        $this->assertEquals($userData['email'], $response['data']['user']['email']);
    }

    /**
     * Test d'authentification avec identifiants invalides
     */
    public function testLoginWithInvalidCredentials(): void
    {
        $this->createTestUser($this->pdo, [
            'email' => 'test@login.com',
            'password' => password_hash('Password123!', PASSWORD_DEFAULT)
        ]);

        $loginData = [
            'email' => 'test@login.com',
            'password' => 'WrongPassword'
        ];

        $this->makeRequest('POST', '/api/auth/login', $loginData);

        ob_start();
        $this->controller->login();
        $output = ob_get_clean();

        $response = $this->assertJsonResponse($output, ['status', 'message']);

        $this->assertEquals(401, $response['status']);
        $this->assertStringContainsString('Identifiants', $response['message']);
    }

    /**
     * Test de suppression d'utilisateur
     */
    public function testDeleteUser(): void
    {
        $userData = $this->createTestUser($this->pdo);

        $this->makeRequest('DELETE', "/api/users/{$userData['id']}");

        ob_start();
        $this->controller->deleteUser($userData['id']);
        $output = ob_get_clean();

        $response = $this->assertJsonResponse($output, ['status']);

        $this->assertEquals(200, $response['status']);

        // Vérifier que l'utilisateur n'existe plus
        $stmt = $this->pdo->prepare("SELECT id FROM users WHERE id = ?");
        $stmt->execute([$userData['id']]);
        $deletedUser = $stmt->fetch();
        $this->assertFalse($deletedUser);
    }

    /**
     * Test de gestion des erreurs serveur
     */
    public function testServerErrorHandling(): void
    {
        // Simuler une erreur en fermant la connexion PDO
        $this->pdo = null;

        $this->makeRequest('GET', '/api/users');

        ob_start();
        try {
            $this->controller->getUsers();
            $output = ob_get_clean();

            $response = $this->assertJsonResponse($output, ['status', 'message']);
            $this->assertEquals(500, $response['status']);
        } catch (Exception $e) {
            ob_get_clean();
            $this->assertInstanceOf(Exception::class, $e);
        }
    }

    /**
     * Test de pagination
     */
    public function testGetUsersWithPagination(): void
    {
        // Créer 25 utilisateurs de test
        for ($i = 1; $i <= 25; $i++) {
            $this->createTestUser($this->pdo, [
                'email' => "user$i@test.com",
                'nom' => "User $i"
            ]);
        }

        // Test avec limite et offset
        $this->makeRequest('GET', '/api/users', ['limit' => 10, 'offset' => 0]);

        ob_start();
        $this->controller->getUsers();
        $output = ob_get_clean();

        $response = $this->assertJsonResponse($output, ['status', 'data', 'meta']);

        $this->assertEquals(200, $response['status']);
        $this->assertCount(10, $response['data']);
        $this->assertEquals(25, $response['meta']['total']);
        $this->assertEquals(10, $response['meta']['limit']);
        $this->assertEquals(0, $response['meta']['offset']);
        $this->assertTrue($response['meta']['has_more']);
    }

    /**
     * Test de filtrage par statut
     */
    public function testGetUsersByStatus(): void
    {
        // Créer des utilisateurs avec différents statuts
        $this->createTestUser($this->pdo, ['email' => 'pending1@test.com', 'status' => 0]);
        $this->createTestUser($this->pdo, ['email' => 'pending2@test.com', 'status' => 0]);
        $this->createTestUser($this->pdo, ['email' => 'active1@test.com', 'status' => 1]);
        $this->createTestUser($this->pdo, ['email' => 'rejected1@test.com', 'status' => 2]);

        // Filtrer par statut pending (0)
        $this->makeRequest('GET', '/api/users', ['status' => 0]);

        ob_start();
        $this->controller->getUsers();
        $output = ob_get_clean();

        $response = $this->assertJsonResponse($output, ['status', 'data']);

        $this->assertEquals(200, $response['status']);
        $this->assertCount(2, $response['data']);

        foreach ($response['data'] as $user) {
            $this->assertEquals(0, $user['status']);
        }
    }
}