<?php

require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/User.php';

use PHPUnit\Framework\TestCase;

/**
 * Tests d'intégration pour le middleware d'authentification
 */
class AuthMiddlewareIntegrationTest extends TestCase
{
    private $pdo;
    private $database;
    private $authMiddleware;
    private $testUsers;

    protected function setUp(): void
    {
        // Configuration de l'environnement de test
        $_ENV['JWT_SECRET'] = 'test_secret_key_for_testing_only_32_chars_min';
        $_ENV['JWT_EXPIRY'] = '3600';

        // Créer une base de données SQLite en mémoire
        $this->pdo = new PDO('sqlite::memory:');
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Créer l'instance database
        $this->database = new Database();
        $reflector = new ReflectionClass($this->database);
        $property = $reflector->getProperty('conn');
        $property->setAccessible(true);
        $property->setValue($this->database, $this->pdo);

        // Créer la table users pour les tests
        $this->pdo->exec("
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE,
                role INTEGER DEFAULT 3,
                status INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ");

        // Créer le middleware
        $this->authMiddleware = new AuthMiddleware($this->database);

        // Données de test pour différents rôles
        $this->testUsers = [
            'admin' => [
                'id' => 1,
                'name' => 'Admin User',
                'email' => 'admin@example.com',
                'role' => User::ROLE_ADMIN
            ],
            'moderator' => [
                'id' => 2,
                'name' => 'Moderator User',
                'email' => 'moderator@example.com',
                'role' => User::ROLE_MODERATOR
            ],
            'reader' => [
                'id' => 3,
                'name' => 'Reader User',
                'email' => 'reader@example.com',
                'role' => User::ROLE_READER
            ]
        ];

        // Insérer les utilisateurs de test dans la base de données
        foreach ($this->testUsers as $user) {
            $stmt = $this->pdo->prepare("INSERT INTO users (id, name, email, role, status) VALUES (?, ?, ?, ?, 1)");
            $stmt->execute([$user['id'], $user['name'], $user['email'], $user['role']]);
        }
    }

    public function testFullAuthenticationWorkflow()
    {
        $user = $this->testUsers['moderator'];

        // 1. Générer un token
        $token = $this->authMiddleware->generateToken($user);
        $this->assertIsString($token);

        // 2. Vérifier le token
        $decodedUser = $this->authMiddleware->verifyToken($token);
        $this->assertIsArray($decodedUser);
        $this->assertEquals($user['id'], $decodedUser['id']);

        // 3. Autoriser avec le token
        $this->simulateAuthorizationHeader("Bearer $token");
        $authorizedUser = $this->authMiddleware->authorize(User::ROLE_READER);
        $this->assertIsArray($authorizedUser);
        $this->assertEquals($user['email'], $authorizedUser['email']);

        // 4. Tester différents niveaux d'accès
        $this->assertTrue($this->authMiddleware->hasRole(User::ROLE_MODERATOR, $decodedUser));
        $this->assertTrue($this->authMiddleware->hasRole(User::ROLE_READER, $decodedUser));
        $this->assertFalse($this->authMiddleware->hasRole(User::ROLE_ADMIN, $decodedUser));
    }

    public function testTokenRefreshWorkflow()
    {
        $user = $this->testUsers['admin'];

        // Générer token initial
        $originalToken = $this->authMiddleware->generateToken($user);

        // Attendre un peu pour s'assurer que le timestamp change
        sleep(1);

        // Rafraîchir le token
        $refreshedToken = $this->authMiddleware->refreshToken($originalToken);

        $this->assertIsString($refreshedToken);
        $this->assertNotEquals($originalToken, $refreshedToken);

        // Vérifier que les deux tokens contiennent les mêmes données utilisateur
        $originalData = $this->authMiddleware->verifyToken($originalToken);
        $refreshedData = $this->authMiddleware->verifyToken($refreshedToken);

        $this->assertEquals($originalData['id'], $refreshedData['id']);
        $this->assertEquals($originalData['email'], $refreshedData['email']);
        $this->assertEquals($originalData['role'], $refreshedData['role']);
    }

    public function testRoleBasedAccessControl()
    {
        $adminToken = $this->authMiddleware->generateToken($this->testUsers['admin']);
        $moderatorToken = $this->authMiddleware->generateToken($this->testUsers['moderator']);
        $readerToken = $this->authMiddleware->generateToken($this->testUsers['reader']);

        // Test accès admin
        $this->simulateAuthorizationHeader("Bearer $adminToken");
        $this->assertIsArray($this->authMiddleware->authorize(User::ROLE_ADMIN));
        $this->assertIsArray($this->authMiddleware->authorize(User::ROLE_MODERATOR));
        $this->assertIsArray($this->authMiddleware->authorize(User::ROLE_READER));

        // Test accès modérateur
        $this->simulateAuthorizationHeader("Bearer $moderatorToken");
        $this->assertFalse($this->authMiddleware->authorize(User::ROLE_ADMIN));
        $this->assertIsArray($this->authMiddleware->authorize(User::ROLE_MODERATOR));
        $this->assertIsArray($this->authMiddleware->authorize(User::ROLE_READER));

        // Test accès reader
        $this->simulateAuthorizationHeader("Bearer $readerToken");
        $this->assertFalse($this->authMiddleware->authorize(User::ROLE_ADMIN));
        $this->assertFalse($this->authMiddleware->authorize(User::ROLE_MODERATOR));
        $this->assertIsArray($this->authMiddleware->authorize(User::ROLE_READER));
    }

    public function testInvalidAuthorizationHeaders()
    {
        // Test sans header
        $this->clearAuthorizationHeader();
        $this->assertFalse($this->authMiddleware->authorize());

        // Test avec header malformé
        $this->simulateAuthorizationHeader("InvalidFormat token");
        $this->assertFalse($this->authMiddleware->authorize());

        // Test avec token invalide
        $this->simulateAuthorizationHeader("Bearer invalid.token.here");
        $this->assertFalse($this->authMiddleware->authorize());

        // Test avec Bearer vide
        $this->simulateAuthorizationHeader("Bearer ");
        $this->assertFalse($this->authMiddleware->authorize());
    }

    public function testGetCurrentUser()
    {
        $user = $this->testUsers['admin'];
        $token = $this->authMiddleware->generateToken($user);

        // Avec token valide
        $this->simulateAuthorizationHeader("Bearer $token");
        $currentUser = $this->authMiddleware->getCurrentUser();
        $this->assertIsArray($currentUser);
        $this->assertEquals($user['id'], $currentUser['id']);

        // Sans token
        $this->clearAuthorizationHeader();
        $this->assertFalse($this->authMiddleware->getCurrentUser());
    }

    public function testRoleManagementScenarios()
    {
        // Admin peut gérer tout le monde
        $this->assertTrue(AuthMiddleware::canManageRole(User::ROLE_ADMIN, User::ROLE_ADMIN));
        $this->assertTrue(AuthMiddleware::canManageRole(User::ROLE_ADMIN, User::ROLE_MODERATOR));
        $this->assertTrue(AuthMiddleware::canManageRole(User::ROLE_ADMIN, User::ROLE_READER));

        // Modérateur peut seulement gérer les readers
        $this->assertFalse(AuthMiddleware::canManageRole(User::ROLE_MODERATOR, User::ROLE_ADMIN));
        $this->assertFalse(AuthMiddleware::canManageRole(User::ROLE_MODERATOR, User::ROLE_MODERATOR));
        $this->assertTrue(AuthMiddleware::canManageRole(User::ROLE_MODERATOR, User::ROLE_READER));

        // Reader ne peut gérer personne
        $this->assertFalse(AuthMiddleware::canManageRole(User::ROLE_READER, User::ROLE_ADMIN));
        $this->assertFalse(AuthMiddleware::canManageRole(User::ROLE_READER, User::ROLE_MODERATOR));
        $this->assertFalse(AuthMiddleware::canManageRole(User::ROLE_READER, User::ROLE_READER));
    }

    public function testSecurityEdgeCases()
    {
        // Test avec JWT secret différent
        $originalSecret = $_ENV['JWT_SECRET'];
        $_ENV['JWT_SECRET'] = 'different_secret_key_32_chars_min_x';

        $differentMiddleware = new AuthMiddleware($this->database);
        $tokenWithDifferentSecret = $differentMiddleware->generateToken($this->testUsers['admin']);

        // Restaurer le secret original
        $_ENV['JWT_SECRET'] = $originalSecret;

        // Le token créé avec un secret différent ne doit pas être validé
        $this->assertFalse($this->authMiddleware->verifyToken($tokenWithDifferentSecret));

        // Test avec token malformé
        $this->assertFalse($this->authMiddleware->verifyToken('not.a.jwt'));
        $this->assertFalse($this->authMiddleware->verifyToken(''));
        $this->assertFalse($this->authMiddleware->verifyToken(null));
    }

    /**
     * Simule un header Authorization pour les tests
     */
    private function simulateAuthorizationHeader($header)
    {
        // Simulation simple - dans un vrai test d'intégration,
        // on utiliserait des outils comme Guzzle ou des mocks plus sophistiqués
        $_SERVER['HTTP_AUTHORIZATION'] = $header;
    }

    /**
     * Supprime le header Authorization
     */
    private function clearAuthorizationHeader()
    {
        unset($_SERVER['HTTP_AUTHORIZATION']);
    }

    protected function tearDown(): void
    {
        $this->clearAuthorizationHeader();
        $this->pdo = null;
        $this->database = null;
        $this->authMiddleware = null;
    }
}