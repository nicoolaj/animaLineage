<?php

require_once __DIR__ . '/../../controllers/ElevageController.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

use PHPUnit\Framework\TestCase;

/**
 * Tests unitaires pour le filtrage des élevages
 */
class ElevageFilteringTest extends TestCase
{
    private $pdo;
    private $database;
    private $controller;

    protected function setUp(): void
    {
        // Créer une base de données SQLite en mémoire
        $this->pdo = new PDO('sqlite::memory:');
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Créer l'instance database
        $this->database = new Database();
        $reflector = new ReflectionClass($this->database);
        $property = $reflector->getProperty('conn');
        $property->setAccessible(true);
        $property->setValue($this->database, $this->pdo);

        // Créer les tables nécessaires
        $this->createTestTables();

        // Créer l'instance ElevageController
        $this->controller = new ElevageController($this->database);
    }

    private function createTestTables()
    {
        // Table users
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            role INTEGER DEFAULT 3,
            status INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        // Table elevages
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS elevages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT NOT NULL,
            adresse TEXT,
            user_id INTEGER,
            telephone TEXT,
            email TEXT,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )");

        // Table elevage_users
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS elevage_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            elevage_id INTEGER,
            user_id INTEGER,
            role_in_elevage TEXT DEFAULT 'collaborator',
            added_by_user_id INTEGER,
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (elevage_id) REFERENCES elevages(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )");

        // Table types_animaux (pour les relations)
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS types_animaux (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        // Table elevage_types (pour les relations)
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS elevage_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            elevage_id INTEGER,
            type_animal_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (elevage_id) REFERENCES elevages(id),
            FOREIGN KEY (type_animal_id) REFERENCES types_animaux(id)
        )");

        // Table races (pour les relations)
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS races (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT NOT NULL,
            type_animal_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (type_animal_id) REFERENCES types_animaux(id)
        )");

        // Table elevage_races (pour les relations)
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS elevage_races (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            elevage_id INTEGER,
            race_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (elevage_id) REFERENCES elevages(id),
            FOREIGN KEY (race_id) REFERENCES races(id)
        )");

        // Insérer des données de test
        $this->insertTestData();
    }

    private function insertTestData()
    {
        // Utilisateurs de test
        $this->pdo->exec("INSERT INTO users (id, name, email, role, status) VALUES
            (1, 'Admin User', 'admin@test.com', 1, 1),
            (2, 'Moderator User', 'mod@test.com', 2, 1),
            (3, 'Regular User', 'user@test.com', 3, 1),
            (4, 'Another User', 'another@test.com', 3, 1)");

        // Élevages de test
        $this->pdo->exec("INSERT INTO elevages (id, nom, adresse, user_id, description) VALUES
            (1, 'Élevage Admin', '123 Admin Street', 1, 'Élevage propriété admin'),
            (2, 'Élevage Mod', '456 Mod Avenue', 2, 'Élevage propriété modérateur'),
            (3, 'Élevage User', '789 User Road', 3, 'Élevage propriété utilisateur'),
            (4, 'Élevage Another', '012 Another Lane', 4, 'Élevage propriété autre utilisateur')");

        // Collaborations de test
        $this->pdo->exec("INSERT INTO elevage_users (elevage_id, user_id, role_in_elevage, added_by_user_id) VALUES
            (1, 2, 'owner', 1),
            (2, 3, 'collaborator', 2),
            (3, 2, 'collaborator', 3)");
    }

    public function testGetElevagesForUserMethod()
    {
        // Utiliser la réflexion pour accéder à la méthode privée
        $reflection = new ReflectionClass($this->controller);
        $method = $reflection->getMethod('getElevagesForUser');
        $method->setAccessible(true);

        // Test pour l'utilisateur 2 (modérateur)
        $stmt = $method->invoke($this->controller, 2);
        $elevages = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // L'utilisateur 2 devrait voir :
        // - Élevage 1 (propriétaire via elevage_users)
        // - Élevage 2 (propriétaire via elevages.user_id)
        // - Élevage 3 (collaborateur via elevage_users)
        $this->assertCount(3, $elevages);

        $elevageNames = array_column($elevages, 'nom');
        $this->assertContains('Élevage Admin', $elevageNames);
        $this->assertContains('Élevage Mod', $elevageNames);
        $this->assertContains('Élevage User', $elevageNames);
        $this->assertNotContains('Élevage Another', $elevageNames);
    }

    public function testGetElevagesForRegularUser()
    {
        // Utiliser la réflexion pour accéder à la méthode privée
        $reflection = new ReflectionClass($this->controller);
        $method = $reflection->getMethod('getElevagesForUser');
        $method->setAccessible(true);

        // Test pour l'utilisateur 3 (utilisateur régulier)
        $stmt = $method->invoke($this->controller, 3);
        $elevages = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // L'utilisateur 3 devrait voir :
        // - Élevage 3 (propriétaire via elevages.user_id)
        // - Élevage 2 (collaborateur via elevage_users)
        $this->assertCount(2, $elevages);

        $elevageNames = array_column($elevages, 'nom');
        $this->assertContains('Élevage User', $elevageNames);
        $this->assertContains('Élevage Mod', $elevageNames);
        $this->assertNotContains('Élevage Admin', $elevageNames);
        $this->assertNotContains('Élevage Another', $elevageNames);
    }

    public function testGetElevagesForUserWithoutCollaboration()
    {
        // Utiliser la réflexion pour accéder à la méthode privée
        $reflection = new ReflectionClass($this->controller);
        $method = $reflection->getMethod('getElevagesForUser');
        $method->setAccessible(true);

        // Test pour l'utilisateur 4 (aucune collaboration)
        $stmt = $method->invoke($this->controller, 4);
        $elevages = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // L'utilisateur 4 devrait voir seulement :
        // - Élevage 4 (propriétaire via elevages.user_id)
        $this->assertCount(1, $elevages);

        $elevageNames = array_column($elevages, 'nom');
        $this->assertContains('Élevage Another', $elevageNames);
        $this->assertNotContains('Élevage Admin', $elevageNames);
        $this->assertNotContains('Élevage Mod', $elevageNames);
        $this->assertNotContains('Élevage User', $elevageNames);
    }

    public function testQueryStructure()
    {
        // Vérifier que la requête UNION fonctionne correctement
        $query = "SELECT DISTINCT e.*, u.name as proprietaire_nom
                  FROM elevages e
                  LEFT JOIN users u ON e.user_id = u.id
                  WHERE e.user_id = :user_id
                  UNION
                  SELECT DISTINCT e.*, u.name as proprietaire_nom
                  FROM elevages e
                  LEFT JOIN users u ON e.user_id = u.id
                  INNER JOIN elevage_users eu ON e.id = eu.elevage_id
                  WHERE eu.user_id = :user_id2
                  ORDER BY nom ASC";

        $stmt = $this->pdo->prepare($query);
        $stmt->bindValue(':user_id', 2);
        $stmt->bindValue(':user_id2', 2);
        $stmt->execute();

        $elevages = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Vérifier que le résultat contient les bonnes colonnes
        $this->assertArrayHasKey('id', $elevages[0]);
        $this->assertArrayHasKey('nom', $elevages[0]);
        $this->assertArrayHasKey('proprietaire_nom', $elevages[0]);

        // Vérifier que les résultats sont ordonnés par nom
        $names = array_column($elevages, 'nom');
        $sortedNames = $names;
        sort($sortedNames);
        $this->assertEquals($sortedNames, $names);
    }

    protected function tearDown(): void
    {
        $this->pdo = null;
        $this->database = null;
        $this->controller = null;
    }
}