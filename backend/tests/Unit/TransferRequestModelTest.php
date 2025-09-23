<?php

require_once __DIR__ . '/../../models/TransferRequest.php';
require_once __DIR__ . '/../../config/database.php';

use PHPUnit\Framework\TestCase;

/**
 * Tests unitaires pour le modèle TransferRequest
 */
class TransferRequestModelTest extends TestCase
{
    private $pdo;
    private $database;
    private $transferRequest;

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

        // Créer l'instance TransferRequest
        $this->transferRequest = new TransferRequest($this->pdo, $this->database);
    }

    private function createTestTables()
    {
        // Table users
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            role INTEGER DEFAULT 3,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        // Table elevages
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS elevages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT NOT NULL,
            adresse TEXT,
            user_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )");

        // Table types_animaux
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS types_animaux (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        // Table races
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS races (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT NOT NULL,
            type_animal_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (type_animal_id) REFERENCES types_animaux(id)
        )");

        // Table animaux
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS animaux (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            identifiant_officiel TEXT UNIQUE,
            nom TEXT,
            sexe TEXT CHECK(sexe IN ('M', 'F')),
            race_id INTEGER,
            elevage_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (race_id) REFERENCES races(id),
            FOREIGN KEY (elevage_id) REFERENCES elevages(id)
        )");

        // Insérer des données de test
        $this->insertTestData();
    }

    private function insertTestData()
    {
        // Utilisateurs de test
        $this->pdo->exec("INSERT INTO users (id, name, email, role) VALUES
            (1, 'Admin User', 'admin@test.com', 1),
            (2, 'Moderator User', 'mod@test.com', 2),
            (3, 'Regular User', 'user@test.com', 3)");

        // Élevages de test
        $this->pdo->exec("INSERT INTO elevages (id, nom, user_id) VALUES
            (1, 'Élevage Source', 2),
            (2, 'Élevage Destination', 3)");

        // Types et races de test
        $this->pdo->exec("INSERT INTO types_animaux (id, nom) VALUES (1, 'Bovin')");
        $this->pdo->exec("INSERT INTO races (id, nom, type_animal_id) VALUES (1, 'Holstein', 1)");

        // Animaux de test
        $this->pdo->exec("INSERT INTO animaux (id, identifiant_officiel, nom, sexe, race_id, elevage_id) VALUES
            (1, 'FR001', 'Bella', 'F', 1, 1),
            (2, 'FR002', 'Taureau', 'M', 1, 1)");
    }

    public function testConstructor()
    {
        $this->assertInstanceOf(TransferRequest::class, $this->transferRequest);
    }

    public function testTableCreation()
    {
        // Vérifier que la table transfer_requests a été créée
        $stmt = $this->pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='transfer_requests'");
        $result = $stmt->fetch();

        $this->assertNotFalse($result);
        $this->assertEquals('transfer_requests', $result['name']);
    }

    public function testTransferRequestProperties()
    {
        $this->transferRequest->animal_id = 1;
        $this->transferRequest->from_elevage_id = 1;
        $this->transferRequest->to_elevage_id = 2;
        $this->transferRequest->requested_by = 2;
        $this->transferRequest->message = 'Test message';

        $this->assertEquals(1, $this->transferRequest->animal_id);
        $this->assertEquals(1, $this->transferRequest->from_elevage_id);
        $this->assertEquals(2, $this->transferRequest->to_elevage_id);
        $this->assertEquals(2, $this->transferRequest->requested_by);
        $this->assertEquals('Test message', $this->transferRequest->message);
    }

    public function testCreate()
    {
        $this->transferRequest->animal_id = 1;
        $this->transferRequest->from_elevage_id = 1;
        $this->transferRequest->to_elevage_id = 2;
        $this->transferRequest->requested_by = 2;
        $this->transferRequest->message = 'Demande de transfert test';

        $result = $this->transferRequest->create();
        $this->assertTrue($result);
        $this->assertNotNull($this->transferRequest->id);

        // Vérifier que la demande a été créée
        $created = $this->transferRequest->getById($this->transferRequest->id);
        $this->assertEquals(1, $created['animal_id']);
        $this->assertEquals('Demande de transfert test', $created['message']);
        $this->assertEquals('pending', $created['status']);
    }

    public function testCreateWithNullFromElevage()
    {
        // Test avec from_elevage_id null (animal sans élevage)
        $this->transferRequest->animal_id = 1;
        $this->transferRequest->from_elevage_id = null;
        $this->transferRequest->to_elevage_id = 2;
        $this->transferRequest->requested_by = 3;
        $this->transferRequest->message = 'Animal sans élevage';

        $result = $this->transferRequest->create();
        $this->assertTrue($result);

        $created = $this->transferRequest->getById($this->transferRequest->id);
        $this->assertNull($created['from_elevage_id']);
        $this->assertEquals(2, $created['to_elevage_id']);
    }

    public function testGetById()
    {
        // Créer une demande de test
        $this->transferRequest->animal_id = 1;
        $this->transferRequest->from_elevage_id = 1;
        $this->transferRequest->to_elevage_id = 2;
        $this->transferRequest->requested_by = 2;
        $this->transferRequest->message = 'Test getById';
        $this->transferRequest->create();

        $request = $this->transferRequest->getById($this->transferRequest->id);

        $this->assertIsArray($request);
        $this->assertEquals('FR001', $request['identifiant_officiel']);
        $this->assertEquals('Bella', $request['animal_nom']);
        $this->assertEquals('Élevage Source', $request['from_elevage_nom']);
        $this->assertEquals('Élevage Destination', $request['to_elevage_nom']);
        $this->assertEquals('Moderator User', $request['requested_by_name']);
    }

    public function testGetByIdInvalid()
    {
        $request = $this->transferRequest->getById(999);
        $this->assertFalse($request);
    }

    public function testGetByUserAsAdmin()
    {
        // Créer quelques demandes de test
        $this->createTestRequests();

        $stmt = $this->transferRequest->getByUser(1, 1); // Admin
        $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Admin devrait voir toutes les demandes
        $this->assertGreaterThan(0, count($requests));
    }

    public function testGetByUserAsModerator()
    {
        // Créer quelques demandes de test
        $this->createTestRequests();

        $stmt = $this->transferRequest->getByUser(2, 2); // Modérateur
        $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Modérateur devrait voir les demandes liées à ses élevages
        $this->assertGreaterThan(0, count($requests));
    }

    public function testProcess()
    {
        // Créer une demande de test
        $this->transferRequest->animal_id = 1;
        $this->transferRequest->from_elevage_id = 1;
        $this->transferRequest->to_elevage_id = 2;
        $this->transferRequest->requested_by = 2;
        $this->transferRequest->message = 'Test process';
        $this->transferRequest->create();

        $requestId = $this->transferRequest->id;

        // Traiter la demande
        $result = $this->transferRequest->process($requestId, 'approved', 'Demande approuvée', 1);
        $this->assertTrue($result);

        // Vérifier que la demande a été mise à jour
        $processed = $this->transferRequest->getById($requestId);
        $this->assertEquals('approved', $processed['status']);
        $this->assertEquals('Demande approuvée', $processed['response_message']);
        $this->assertEquals(1, $processed['processed_by']);
    }

    public function testProcessReject()
    {
        // Créer une demande de test
        $this->transferRequest->animal_id = 2;
        $this->transferRequest->from_elevage_id = 1;
        $this->transferRequest->to_elevage_id = 2;
        $this->transferRequest->requested_by = 3;
        $this->transferRequest->message = 'Test reject';
        $this->transferRequest->create();

        $requestId = $this->transferRequest->id;

        // Rejeter la demande
        $result = $this->transferRequest->process($requestId, 'rejected', 'Demande rejetée', 2);
        $this->assertTrue($result);

        // Vérifier que la demande a été rejetée
        $processed = $this->transferRequest->getById($requestId);
        $this->assertEquals('rejected', $processed['status']);
        $this->assertEquals('Demande rejetée', $processed['response_message']);
    }

    public function testSimilarRequestExists()
    {
        // Créer une demande existante
        $this->transferRequest->animal_id = 1;
        $this->transferRequest->from_elevage_id = 1;
        $this->transferRequest->to_elevage_id = 2;
        $this->transferRequest->requested_by = 2;
        $this->transferRequest->message = 'Première demande';
        $this->transferRequest->create();

        // Vérifier qu'une demande similaire existe
        $exists = $this->transferRequest->similarRequestExists(1, 2);
        $this->assertTrue($exists);

        // Vérifier qu'une demande différente n'existe pas
        $notExists = $this->transferRequest->similarRequestExists(1, 1);
        $this->assertFalse($notExists);

        // Vérifier qu'une demande pour un autre animal n'existe pas
        $notExists2 = $this->transferRequest->similarRequestExists(2, 2);
        $this->assertFalse($notExists2);
    }

    public function testSimilarRequestExistsProcessed()
    {
        // Créer une demande et la traiter
        $this->transferRequest->animal_id = 1;
        $this->transferRequest->from_elevage_id = 1;
        $this->transferRequest->to_elevage_id = 2;
        $this->transferRequest->requested_by = 2;
        $this->transferRequest->message = 'Demande traitée';
        $this->transferRequest->create();

        $requestId = $this->transferRequest->id;
        $this->transferRequest->process($requestId, 'approved', 'Approuvée', 1);

        // Vérifier qu'aucune demande similaire en attente n'existe
        $exists = $this->transferRequest->similarRequestExists(1, 2);
        $this->assertFalse($exists);
    }

    public function testDefaultStatus()
    {
        $this->transferRequest->animal_id = 1;
        $this->transferRequest->from_elevage_id = 1;
        $this->transferRequest->to_elevage_id = 2;
        $this->transferRequest->requested_by = 2;
        $this->transferRequest->message = 'Test status';
        $this->transferRequest->create();

        $created = $this->transferRequest->getById($this->transferRequest->id);
        $this->assertEquals('pending', $created['status']);
    }

    public function testForeignKeyRelationships()
    {
        $this->transferRequest->animal_id = 1;
        $this->transferRequest->from_elevage_id = 1;
        $this->transferRequest->to_elevage_id = 2;
        $this->transferRequest->requested_by = 2;
        $this->transferRequest->message = 'Test FK';
        $this->transferRequest->create();

        $created = $this->transferRequest->getById($this->transferRequest->id);

        // Vérifier toutes les relations
        $this->assertEquals('FR001', $created['identifiant_officiel']);
        $this->assertEquals('Bella', $created['animal_nom']);
        $this->assertEquals('Élevage Source', $created['from_elevage_nom']);
        $this->assertEquals('Élevage Destination', $created['to_elevage_nom']);
        $this->assertEquals('Moderator User', $created['requested_by_name']);
    }

    public function testDatabaseConnection()
    {
        $this->assertInstanceOf(PDO::class, $this->pdo);
        $this->assertInstanceOf(Database::class, $this->database);
    }

    public function testQueryExecution()
    {
        // Test qu'une requête basique fonctionne
        $stmt = $this->pdo->query("SELECT COUNT(*) as count FROM transfer_requests");
        $result = $stmt->fetch();

        $this->assertIsNumeric($result['count']);
    }

    private function createTestRequests()
    {
        // Créer plusieurs demandes de test
        $requests = [
            [1, 1, 2, 2, 'Première demande'],
            [2, 1, 2, 3, 'Deuxième demande'],
        ];

        foreach ($requests as $req) {
            $tr = new TransferRequest($this->pdo, $this->database);
            $tr->animal_id = $req[0];
            $tr->from_elevage_id = $req[1];
            $tr->to_elevage_id = $req[2];
            $tr->requested_by = $req[3];
            $tr->message = $req[4];
            $tr->create();
        }
    }

    protected function tearDown(): void
    {
        $this->pdo = null;
        $this->database = null;
        $this->transferRequest = null;
    }
}