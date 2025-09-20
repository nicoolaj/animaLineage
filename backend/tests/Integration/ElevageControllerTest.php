<?php

require_once __DIR__ . '/../Helpers/TestCase.php';
require_once __DIR__ . '/../../controllers/ElevageController.php';
require_once __DIR__ . '/../../config/database.php';

/**
 * Tests d'intégration pour ElevageController
 */
class ElevageControllerTest extends TestCase
{
    private $controller;
    private $database;
    private $pdo;
    private $testUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->database = new Database();
        $this->pdo = $this->database->getConnection();
        $this->createTestTables($this->pdo);

        $this->controller = new ElevageController($this->database);
        $this->testUser = $this->createTestUser($this->pdo);

        // Simuler un utilisateur connecté
        $_SESSION['user_id'] = $this->testUser['id'];
        $_SESSION['user_role'] = 'eleveur';
    }

    protected function tearDown(): void
    {
        unset($_SESSION['user_id'], $_SESSION['user_role']);
        parent::tearDown();
    }

    /**
     * Test de création d'élevage via API
     */
    public function testCreateElevageAPI(): void
    {
        $elevageData = [
            'nom' => 'Élevage des Tests',
            'adresse' => '123 Route de Test, 12345 Testville',
            'telephone' => '01 23 45 67 89',
            'email' => 'contact@elevage-test.fr',
            'description' => 'Élevage de test pour les tests unitaires'
        ];

        $this->makeRequest('POST', '/api/elevages', $elevageData);

        ob_start();
        $this->controller->createElevage();
        $output = ob_get_clean();

        $response = $this->assertJsonResponse($output, ['status', 'data']);

        $this->assertEquals(201, $response['status']);
        $this->assertArrayHasKey('id', $response['data']);
        $this->assertEquals($elevageData['nom'], $response['data']['nom']);
        $this->assertEquals($elevageData['adresse'], $response['data']['adresse']);
        $this->assertEquals($this->testUser['id'], $response['data']['user_id']);
    }

    /**
     * Test de récupération d'élevages par utilisateur
     */
    public function testGetElevagesByUser(): void
    {
        // Créer plusieurs élevages pour l'utilisateur test
        $this->createTestElevage($this->pdo, $this->testUser['id'], ['nom' => 'Élevage 1']);
        $this->createTestElevage($this->pdo, $this->testUser['id'], ['nom' => 'Élevage 2']);
        $this->createTestElevage($this->pdo, $this->testUser['id'], ['nom' => 'Élevage 3']);

        // Créer un élevage pour un autre utilisateur
        $otherUser = $this->createTestUser($this->pdo, ['email' => 'other@test.com']);
        $this->createTestElevage($this->pdo, $otherUser['id'], ['nom' => 'Élevage Autre']);

        $this->makeRequest('GET', '/api/elevages');

        ob_start();
        $this->controller->getElevages();
        $output = ob_get_clean();

        $response = $this->assertJsonResponse($output, ['status', 'data']);

        $this->assertEquals(200, $response['status']);
        $this->assertCount(3, $response['data']); // Seulement les élevages de l'utilisateur connecté

        foreach ($response['data'] as $elevage) {
            $this->assertEquals($this->testUser['id'], $elevage['user_id']);
        }
    }

    /**
     * Test de récupération d'un élevage spécifique
     */
    public function testGetElevageById(): void
    {
        $elevageData = $this->createTestElevage($this->pdo, $this->testUser['id']);

        $this->makeRequest('GET', "/api/elevages/{$elevageData['id']}");

        ob_start();
        $this->controller->getElevageById($elevageData['id']);
        $output = ob_get_clean();

        $response = $this->assertJsonResponse($output, ['status', 'data']);

        $this->assertEquals(200, $response['status']);
        $this->assertEquals($elevageData['id'], $response['data']['id']);
        $this->assertEquals($elevageData['nom'], $response['data']['nom']);
        $this->assertEquals($elevageData['adresse'], $response['data']['adresse']);
    }

    /**
     * Test d'accès refusé à un élevage d'un autre utilisateur
     */
    public function testGetElevageByIdAccessDenied(): void
    {
        $otherUser = $this->createTestUser($this->pdo, ['email' => 'other@test.com']);
        $elevageData = $this->createTestElevage($this->pdo, $otherUser['id']);

        $this->makeRequest('GET', "/api/elevages/{$elevageData['id']}");

        ob_start();
        $this->controller->getElevageById($elevageData['id']);
        $output = ob_get_clean();

        $response = $this->assertJsonResponse($output, ['status', 'message']);

        $this->assertEquals(403, $response['status']);
        $this->assertStringContainsString('accès', strtolower($response['message']));
    }

    /**
     * Test de mise à jour d'élevage
     */
    public function testUpdateElevage(): void
    {
        $elevageData = $this->createTestElevage($this->pdo, $this->testUser['id']);

        $updateData = [
            'nom' => 'Élevage Modifié',
            'telephone' => '01 98 76 54 32',
            'description' => 'Description mise à jour'
        ];

        $this->makeRequest('PUT', "/api/elevages/{$elevageData['id']}", $updateData);

        ob_start();
        $this->controller->updateElevage($elevageData['id']);
        $output = ob_get_clean();

        $response = $this->assertJsonResponse($output, ['status', 'data']);

        $this->assertEquals(200, $response['status']);
        $this->assertEquals($updateData['nom'], $response['data']['nom']);
        $this->assertEquals($updateData['telephone'], $response['data']['telephone']);
        $this->assertEquals($updateData['description'], $response['data']['description']);

        // Vérifier que l'adresse n'a pas changé
        $this->assertEquals($elevageData['adresse'], $response['data']['adresse']);
    }

    /**
     * Test de suppression d'élevage
     */
    public function testDeleteElevage(): void
    {
        $elevageData = $this->createTestElevage($this->pdo, $this->testUser['id']);

        $this->makeRequest('DELETE', "/api/elevages/{$elevageData['id']}");

        ob_start();
        $this->controller->deleteElevage($elevageData['id']);
        $output = ob_get_clean();

        $response = $this->assertJsonResponse($output, ['status']);

        $this->assertEquals(200, $response['status']);

        // Vérifier que l'élevage n'existe plus
        $stmt = $this->pdo->prepare("SELECT id FROM elevages WHERE id = ?");
        $stmt->execute([$elevageData['id']]);
        $deletedElevage = $stmt->fetch();
        $this->assertFalse($deletedElevage);
    }

    /**
     * Test de validation des données d'élevage
     */
    public function testCreateElevageWithInvalidData(): void
    {
        $invalidData = [
            'nom' => '', // Nom vide
            'adresse' => '', // Adresse vide
            'email' => 'email-invalide' // Email invalide
        ];

        $this->makeRequest('POST', '/api/elevages', $invalidData);

        ob_start();
        $this->controller->createElevage();
        $output = ob_get_clean();

        $response = $this->assertJsonResponse($output, ['status', 'errors']);

        $this->assertEquals(422, $response['status']);
        $this->assertArrayHasKey('errors', $response);
        $this->assertArrayHasKey('nom', $response['errors']);
        $this->assertArrayHasKey('adresse', $response['errors']);
    }

    /**
     * Test de recherche d'élevages
     */
    public function testSearchElevages(): void
    {
        // Créer des élevages avec différents noms
        $this->createTestElevage($this->pdo, $this->testUser['id'], [
            'nom' => 'Ferme Bovine de la Vallée',
            'adresse' => '123 Vallée Verte'
        ]);
        $this->createTestElevage($this->pdo, $this->testUser['id'], [
            'nom' => 'Élevage Ovin des Montagnes',
            'adresse' => '456 Route Montagne'
        ]);
        $this->createTestElevage($this->pdo, $this->testUser['id'], [
            'nom' => 'Ranch Équin du Sud',
            'adresse' => '789 Chemin du Sud'
        ]);

        // Recherche par nom
        $this->makeRequest('GET', '/api/elevages', ['search' => 'Ovin']);

        ob_start();
        $this->controller->getElevages();
        $output = ob_get_clean();

        $response = $this->assertJsonResponse($output, ['status', 'data']);

        $this->assertEquals(200, $response['status']);
        $this->assertCount(1, $response['data']);
        $this->assertStringContainsString('Ovin', $response['data'][0]['nom']);
    }

    /**
     * Test de récupération des statistiques d'élevage
     */
    public function testGetElevageStats(): void
    {
        $elevageData = $this->createTestElevage($this->pdo, $this->testUser['id']);

        // Ajouter quelques animaux de test
        for ($i = 0; $i < 10; $i++) {
            $sexe = ($i % 2 === 0) ? 'F' : 'M';
            $this->pdo->prepare("INSERT INTO animals (nom, elevage_id, sexe) VALUES (?, ?, ?)")
                     ->execute(["Animal $i", $elevageData['id'], $sexe]);
        }

        $this->makeRequest('GET', "/api/elevages/{$elevageData['id']}/stats");

        ob_start();
        $this->controller->getElevageStats($elevageData['id']);
        $output = ob_get_clean();

        $response = $this->assertJsonResponse($output, ['status', 'data']);

        $this->assertEquals(200, $response['status']);
        $this->assertEquals(10, $response['data']['total_animals']);
        $this->assertEquals(5, $response['data']['females']);
        $this->assertEquals(5, $response['data']['males']);
    }

    /**
     * Test d'authentification requise
     */
    public function testAuthenticationRequired(): void
    {
        // Supprimer l'utilisateur de la session
        unset($_SESSION['user_id']);

        $this->makeRequest('GET', '/api/elevages');

        ob_start();
        $this->controller->getElevages();
        $output = ob_get_clean();

        $response = $this->assertJsonResponse($output, ['status', 'message']);

        $this->assertEquals(401, $response['status']);
        $this->assertStringContainsString('authentification', strtolower($response['message']));
    }

    /**
     * Test de gestion de l'autorisation admin
     */
    public function testAdminAccess(): void
    {
        // Créer un utilisateur admin
        $adminUser = $this->createTestUser($this->pdo, [
            'email' => 'admin@test.com',
            'role' => 'admin'
        ]);

        $_SESSION['user_id'] = $adminUser['id'];
        $_SESSION['user_role'] = 'admin';

        // Créer un élevage d'un autre utilisateur
        $otherUser = $this->createTestUser($this->pdo, ['email' => 'other@test.com']);
        $elevageData = $this->createTestElevage($this->pdo, $otherUser['id']);

        $this->makeRequest('GET', "/api/elevages/{$elevageData['id']}");

        ob_start();
        $this->controller->getElevageById($elevageData['id']);
        $output = ob_get_clean();

        $response = $this->assertJsonResponse($output, ['status', 'data']);

        // L'admin devrait pouvoir accéder à tous les élevages
        $this->assertEquals(200, $response['status']);
        $this->assertEquals($elevageData['id'], $response['data']['id']);
    }

    /**
     * Test de pagination des élevages
     */
    public function testGetElevagesWithPagination(): void
    {
        // Créer 15 élevages
        for ($i = 1; $i <= 15; $i++) {
            $this->createTestElevage($this->pdo, $this->testUser['id'], [
                'nom' => "Élevage $i"
            ]);
        }

        $this->makeRequest('GET', '/api/elevages', ['limit' => 5, 'offset' => 0]);

        ob_start();
        $this->controller->getElevages();
        $output = ob_get_clean();

        $response = $this->assertJsonResponse($output, ['status', 'data', 'meta']);

        $this->assertEquals(200, $response['status']);
        $this->assertCount(5, $response['data']);
        $this->assertEquals(15, $response['meta']['total']);
        $this->assertEquals(5, $response['meta']['limit']);
        $this->assertTrue($response['meta']['has_more']);
    }
}