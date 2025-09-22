<?php

require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../../config/database.php';

use PHPUnit\Framework\TestCase;

/**
 * Test du modèle User avec les méthodes réelles
 */
class UserModelTest extends TestCase
{
    private $pdo;
    private $database;
    private $user;

    protected function setUp(): void
    {
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

        // Créer l'instance User qui créera automatiquement la table
        $this->user = new User($this->pdo, $this->database);
    }

    public function testUserTableCreation()
    {
        // Vérifier que la table users existe
        $stmt = $this->pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
        $result = $stmt->fetch();

        $this->assertNotFalse($result, 'Users table should exist');
        $this->assertEquals('users', $result['name']);
    }

    public function testUserConstants()
    {
        $this->assertEquals(1, User::ROLE_ADMIN);
        $this->assertEquals(2, User::ROLE_MODERATOR);
        $this->assertEquals(3, User::ROLE_READER);
    }

    public function testUserProperties()
    {
        $this->user->name = 'Test User';
        $this->user->email = 'test@example.com';
        $this->user->role = User::ROLE_READER;

        $this->assertEquals('Test User', $this->user->name);
        $this->assertEquals('test@example.com', $this->user->email);
        $this->assertEquals(User::ROLE_READER, $this->user->role);
    }

    public function testDatabaseConnection()
    {
        $this->assertInstanceOf(PDO::class, $this->pdo);
        $this->assertInstanceOf(User::class, $this->user);
    }

    public function testPasswordHashing()
    {
        $password = 'testpassword123';
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        $this->assertNotEquals($password, $hashedPassword);
        $this->assertTrue(password_verify($password, $hashedPassword));
    }

    protected function tearDown(): void
    {
        $this->pdo = null;
        $this->database = null;
        $this->user = null;
    }
}