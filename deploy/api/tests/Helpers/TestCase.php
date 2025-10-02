<?php

use PHPUnit\Framework\TestCase as BaseTestCase;
use Mockery;

/**
 * Classe de base pour tous les tests
 */
abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->setupTestEnvironment();
    }

    protected function tearDown(): void
    {
        $this->cleanupTestEnvironment();
        Mockery::close();
        parent::tearDown();
    }

    /**
     * Configure l'environnement de test
     */
    protected function setupTestEnvironment(): void
    {
        // Nettoyage des variables globales
        $_POST = [];
        $_GET = [];
        $_FILES = [];
        $_SESSION = [];

        // Configuration des headers de test
        if (!headers_sent()) {
            header('Content-Type: application/json');
        }
    }

    /**
     * Nettoie l'environnement après chaque test
     */
    protected function cleanupTestEnvironment(): void
    {
        // Nettoyage des variables globales
        $_POST = [];
        $_GET = [];
        $_FILES = [];

        if (session_status() === PHP_SESSION_ACTIVE) {
            session_unset();
        }
    }

    /**
     * Crée une base de données SQLite en mémoire pour les tests
     */
    protected function createTestDatabase(): PDO
    {
        $pdo = new PDO('sqlite::memory:');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Création des tables de test
        $this->createTestTables($pdo);

        return $pdo;
    }

    /**
     * Crée les tables nécessaires pour les tests
     */
    protected function createTestTables(PDO $pdo): void
    {
        // Table users
        $pdo->exec("
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nom VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                status INTEGER DEFAULT 0,
                role VARCHAR(50) DEFAULT 'eleveur',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ");

        // Table elevages
        $pdo->exec("
            CREATE TABLE elevages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nom VARCHAR(200) NOT NULL,
                adresse TEXT NOT NULL,
                user_id INTEGER NOT NULL,
                telephone VARCHAR(20),
                email VARCHAR(255),
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ");

        // Table types_animaux
        $pdo->exec("
            CREATE TABLE types_animaux (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nom VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ");

        // Table races
        $pdo->exec("
            CREATE TABLE races (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nom VARCHAR(100) NOT NULL,
                type_animal_id INTEGER NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (type_animal_id) REFERENCES types_animaux(id),
                UNIQUE(nom, type_animal_id)
            )
        ");

        // Table animals
        $pdo->exec("
            CREATE TABLE animals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nom VARCHAR(255) NOT NULL,
                numero VARCHAR(50),
                elevage_id INTEGER NOT NULL,
                race_id INTEGER,
                type_animal_id INTEGER,
                date_naissance DATE,
                sexe CHAR(1),
                mere_id INTEGER,
                pere_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (elevage_id) REFERENCES elevages(id),
                FOREIGN KEY (race_id) REFERENCES races(id),
                FOREIGN KEY (type_animal_id) REFERENCES types_animaux(id)
            )
        ");
    }

    /**
     * Crée un utilisateur de test
     */
    protected function createTestUser(PDO $pdo, array $data = []): array
    {
        $userData = array_merge([
            'nom' => 'Test User',
            'email' => 'test@example.com',
            'password' => password_hash('password123', PASSWORD_DEFAULT),
            'status' => 1,
            'role' => 'eleveur'
        ], $data);

        $stmt = $pdo->prepare("
            INSERT INTO users (nom, email, password, status, role)
            VALUES (:nom, :email, :password, :status, :role)
        ");

        $stmt->execute($userData);
        $userData['id'] = $pdo->lastInsertId();

        return $userData;
    }

    /**
     * Crée un élevage de test
     */
    protected function createTestElevage(PDO $pdo, int $userId, array $data = []): array
    {
        $elevageData = array_merge([
            'nom' => 'Élevage Test',
            'adresse' => '123 Rue de Test',
            'user_id' => $userId,
            'telephone' => '01 23 45 67 89',
            'email' => 'elevage@test.com'
        ], $data);

        $stmt = $pdo->prepare("
            INSERT INTO elevages (nom, adresse, user_id, telephone, email)
            VALUES (:nom, :adresse, :user_id, :telephone, :email)
        ");

        $stmt->execute($elevageData);
        $elevageData['id'] = $pdo->lastInsertId();

        return $elevageData;
    }

    /**
     * Asserte qu'une réponse JSON contient les clés attendues
     */
    protected function assertJsonResponse(string $jsonString, array $expectedKeys = []): array
    {
        $this->assertJson($jsonString, 'La réponse doit être un JSON valide');

        $data = json_decode($jsonString, true);
        $this->assertIsArray($data, 'Le JSON doit être décodable en array');

        foreach ($expectedKeys as $key) {
            $this->assertArrayHasKey($key, $data, "La clé '$key' doit être présente dans la réponse");
        }

        return $data;
    }

    /**
     * Simule une requête HTTP
     */
    protected function makeRequest(string $method, string $uri, array $data = [], array $headers = []): void
    {
        $_SERVER['REQUEST_METHOD'] = $method;
        $_SERVER['REQUEST_URI'] = $uri;

        // Headers
        foreach ($headers as $key => $value) {
            $_SERVER['HTTP_' . strtoupper(str_replace('-', '_', $key))] = $value;
        }

        // Données
        if ($method === 'POST' || $method === 'PUT') {
            $_POST = $data;
        } else {
            $_GET = $data;
        }
    }
}