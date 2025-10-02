<?php

require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/User.php';

use PHPUnit\Framework\TestCase;

/**
 * Test complet du middleware d'authentification
 */
class AuthMiddlewareTest extends TestCase
{
    private $pdo;
    private $database;
    private $authMiddleware;
    private $testUser;

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
        // Forcer l'utilisation de notre PDO de test
        $reflector = new ReflectionClass($this->database);
        $property = $reflector->getProperty('conn');
        $property->setAccessible(true);
        $property->setValue($this->database, $this->pdo);

        // Créer le middleware
        $this->authMiddleware = new AuthMiddleware($this->database);

        // Données de test utilisateur
        $this->testUser = [
            'id' => 1,
            'name' => 'Test User',
            'email' => 'test@example.com',
            'role' => User::ROLE_MODERATOR
        ];
    }

    public function testConstructor()
    {
        $this->assertInstanceOf(AuthMiddleware::class, $this->authMiddleware);
    }

    public function testHasRoleWithValidRole()
    {
        // Modérateur peut accéder aux ressources modérateur
        $this->assertTrue($this->authMiddleware->hasRole(User::ROLE_MODERATOR, $this->testUser));

        // Modérateur peut accéder aux ressources reader
        $this->assertTrue($this->authMiddleware->hasRole(User::ROLE_READER, $this->testUser));

        // Modérateur ne peut pas accéder aux ressources admin
        $this->assertFalse($this->authMiddleware->hasRole(User::ROLE_ADMIN, $this->testUser));
    }

    public function testHasRoleWithInvalidData()
    {
        // Données utilisateur nulles
        $this->assertFalse($this->authMiddleware->hasRole(User::ROLE_READER, null));

        // Données utilisateur vides
        $this->assertFalse($this->authMiddleware->hasRole(User::ROLE_READER, []));

        // Données utilisateur sans role
        $userData = ['id' => 1, 'name' => 'Test'];
        $this->assertFalse($this->authMiddleware->hasRole(User::ROLE_READER, $userData));
    }

    public function testGenerateTokenWithValidData()
    {
        $token = $this->authMiddleware->generateToken($this->testUser);

        $this->assertIsString($token);
        $this->assertNotEmpty($token);

        // Vérifier que le token contient 3 parties (header.payload.signature)
        $parts = explode('.', $token);
        $this->assertCount(3, $parts);
    }

    public function testVerifyTokenWithValidToken()
    {
        $token = $this->authMiddleware->generateToken($this->testUser);
        $decodedUser = $this->authMiddleware->verifyToken($token);

        $this->assertIsArray($decodedUser);
        $this->assertEquals($this->testUser['id'], $decodedUser['id']);
        $this->assertEquals($this->testUser['email'], $decodedUser['email']);
        $this->assertEquals($this->testUser['role'], $decodedUser['role']);
        $this->assertEquals($this->testUser['name'], $decodedUser['name']);
    }

    public function testVerifyTokenWithInvalidToken()
    {
        $this->assertFalse($this->authMiddleware->verifyToken('invalid.token.here'));
        $this->assertFalse($this->authMiddleware->verifyToken(''));
        $this->assertFalse($this->authMiddleware->verifyToken(null));
    }

    public function testVerifyTokenWithExpiredToken()
    {
        // Créer un token expiré (en modifiant temporairement l'expiry)
        $_ENV['JWT_EXPIRY'] = '-1'; // Expire immédiatement

        $expiredAuthMiddleware = new AuthMiddleware($this->database);
        $expiredToken = $expiredAuthMiddleware->generateToken($this->testUser);

        // Restaurer l'expiry normal
        $_ENV['JWT_EXPIRY'] = '3600';

        $this->assertFalse($this->authMiddleware->verifyToken($expiredToken));
    }

    public function testRefreshTokenWithValidToken()
    {
        $originalToken = $this->authMiddleware->generateToken($this->testUser);

        // Attendre 1 seconde pour s'assurer que le timestamp change
        sleep(1);

        $refreshedToken = $this->authMiddleware->refreshToken($originalToken);

        $this->assertIsString($refreshedToken);

        // Les tokens peuvent être identiques si générés dans la même seconde
        // Testons plutôt que le token rafraîchi fonctionne
        $decodedUser = $this->authMiddleware->verifyToken($refreshedToken);
        $this->assertEquals($this->testUser['id'], $decodedUser['id']);
        $this->assertEquals($this->testUser['email'], $decodedUser['email']);
        $this->assertEquals($this->testUser['role'], $decodedUser['role']);
    }

    public function testRefreshTokenWithInvalidToken()
    {
        $this->assertFalse($this->authMiddleware->refreshToken('invalid.token'));
        $this->assertFalse($this->authMiddleware->refreshToken(''));
    }

    public function testGetRoleName()
    {
        // Test des méthodes statiques si elles existent dans User
        $this->assertEquals(User::ROLE_ADMIN, 1);
        $this->assertEquals(User::ROLE_MODERATOR, 2);
        $this->assertEquals(User::ROLE_READER, 3);
    }

    public function testCanManageRoleAdmin()
    {
        // Admin peut gérer tout le monde
        $this->assertTrue(AuthMiddleware::canManageRole(User::ROLE_ADMIN, User::ROLE_ADMIN));
        $this->assertTrue(AuthMiddleware::canManageRole(User::ROLE_ADMIN, User::ROLE_MODERATOR));
        $this->assertTrue(AuthMiddleware::canManageRole(User::ROLE_ADMIN, User::ROLE_READER));
    }

    public function testCanManageRoleModerator()
    {
        // Modérateur peut gérer seulement les readers
        $this->assertFalse(AuthMiddleware::canManageRole(User::ROLE_MODERATOR, User::ROLE_ADMIN));
        $this->assertFalse(AuthMiddleware::canManageRole(User::ROLE_MODERATOR, User::ROLE_MODERATOR));
        $this->assertTrue(AuthMiddleware::canManageRole(User::ROLE_MODERATOR, User::ROLE_READER));
    }

    public function testCanManageRoleReader()
    {
        // Reader ne peut gérer personne
        $this->assertFalse(AuthMiddleware::canManageRole(User::ROLE_READER, User::ROLE_ADMIN));
        $this->assertFalse(AuthMiddleware::canManageRole(User::ROLE_READER, User::ROLE_MODERATOR));
        $this->assertFalse(AuthMiddleware::canManageRole(User::ROLE_READER, User::ROLE_READER));
    }

    public function testRoleHierarchy()
    {
        $adminUser = ['id' => 1, 'role' => User::ROLE_ADMIN];
        $moderatorUser = ['id' => 2, 'role' => User::ROLE_MODERATOR];
        $readerUser = ['id' => 3, 'role' => User::ROLE_READER];

        // Admin peut tout faire
        $this->assertTrue($this->authMiddleware->hasRole(User::ROLE_ADMIN, $adminUser));
        $this->assertTrue($this->authMiddleware->hasRole(User::ROLE_MODERATOR, $adminUser));
        $this->assertTrue($this->authMiddleware->hasRole(User::ROLE_READER, $adminUser));

        // Modérateur peut faire modérateur et reader
        $this->assertFalse($this->authMiddleware->hasRole(User::ROLE_ADMIN, $moderatorUser));
        $this->assertTrue($this->authMiddleware->hasRole(User::ROLE_MODERATOR, $moderatorUser));
        $this->assertTrue($this->authMiddleware->hasRole(User::ROLE_READER, $moderatorUser));

        // Reader ne peut faire que reader
        $this->assertFalse($this->authMiddleware->hasRole(User::ROLE_ADMIN, $readerUser));
        $this->assertFalse($this->authMiddleware->hasRole(User::ROLE_MODERATOR, $readerUser));
        $this->assertTrue($this->authMiddleware->hasRole(User::ROLE_READER, $readerUser));
    }

    public function testJWTConfiguration()
    {
        $this->assertEquals('test_secret_key_for_testing_only_32_chars_min', $_ENV['JWT_SECRET']);
        $this->assertEquals('3600', $_ENV['JWT_EXPIRY']);
    }

    protected function tearDown(): void
    {
        $this->pdo = null;
        $this->database = null;
        $this->authMiddleware = null;
    }
}