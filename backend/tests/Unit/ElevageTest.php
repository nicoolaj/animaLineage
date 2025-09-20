<?php

require_once __DIR__ . '/../Helpers/TestCase.php';
require_once __DIR__ . '/../../models/Elevage.php';

/**
 * Tests unitaires du modèle Elevage
 */
class ElevageTest extends TestCase
{
    private $pdo;
    private $mockDatabase;
    private $elevage;
    private $testUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->pdo = $this->createTestDatabase();
        $this->mockDatabase = $this->createMock(Database::class);
        $this->mockDatabase->method('getConnection')->willReturn($this->pdo);
        $this->mockDatabase->method('getDriver')->willReturn('sqlite');

        $this->elevage = new Elevage($this->pdo, $this->mockDatabase);
        $this->testUser = $this->createTestUser($this->pdo);
    }

    /**
     * Test de création d'élevage avec données valides
     */
    public function testCreateElevageWithValidData(): void
    {
        $elevageData = [
            'nom' => 'Élevage des Collines',
            'adresse' => '123 Route de la Ferme, 12345 Ruralville',
            'user_id' => $this->testUser['id'],
            'telephone' => '01 23 45 67 89',
            'email' => 'contact@elevage-collines.fr',
            'description' => 'Élevage spécialisé en bovins laitiers'
        ];

        $elevageId = $this->elevage->create($elevageData);

        $this->assertIsInt($elevageId);
        $this->assertGreaterThan(0, $elevageId);

        // Vérifier en base de données
        $stmt = $this->pdo->prepare("SELECT * FROM elevages WHERE id = ?");
        $stmt->execute([$elevageId]);
        $createdElevage = $stmt->fetch(PDO::FETCH_ASSOC);

        $this->assertNotFalse($createdElevage);
        $this->assertEquals($elevageData['nom'], $createdElevage['nom']);
        $this->assertEquals($elevageData['adresse'], $createdElevage['adresse']);
        $this->assertEquals($elevageData['user_id'], $createdElevage['user_id']);
    }

    /**
     * Test de création d'élevage avec données manquantes
     */
    public function testCreateElevageWithMissingData(): void
    {
        $incompleteData = [
            'nom' => 'Élevage Incomplet'
            // Manque adresse et user_id
        ];

        $this->expectException(Exception::class);
        $this->elevage->create($incompleteData);
    }

    /**
     * Test de récupération d'élevage par ID
     */
    public function testGetElevageById(): void
    {
        $elevageData = $this->createTestElevage($this->pdo, $this->testUser['id']);

        $retrievedElevage = $this->elevage->getById($elevageData['id']);

        $this->assertIsArray($retrievedElevage);
        $this->assertEquals($elevageData['id'], $retrievedElevage['id']);
        $this->assertEquals($elevageData['nom'], $retrievedElevage['nom']);
        $this->assertEquals($elevageData['adresse'], $retrievedElevage['adresse']);
    }

    /**
     * Test de récupération d'élevages par utilisateur
     */
    public function testGetElevagesByUser(): void
    {
        // Créer plusieurs élevages pour le même utilisateur
        $this->createTestElevage($this->pdo, $this->testUser['id'], ['nom' => 'Élevage 1']);
        $this->createTestElevage($this->pdo, $this->testUser['id'], ['nom' => 'Élevage 2']);
        $this->createTestElevage($this->pdo, $this->testUser['id'], ['nom' => 'Élevage 3']);

        $elevages = $this->elevage->getByUserId($this->testUser['id']);

        $this->assertIsArray($elevages);
        $this->assertCount(3, $elevages);

        // Vérifier que tous appartiennent au bon utilisateur
        foreach ($elevages as $elevage) {
            $this->assertEquals($this->testUser['id'], $elevage['user_id']);
        }
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

        $result = $this->elevage->update($elevageData['id'], $updateData);
        $this->assertTrue($result);

        // Vérifier la mise à jour
        $updatedElevage = $this->elevage->getById($elevageData['id']);
        $this->assertEquals($updateData['nom'], $updatedElevage['nom']);
        $this->assertEquals($updateData['telephone'], $updatedElevage['telephone']);
        $this->assertEquals($updateData['description'], $updatedElevage['description']);

        // Vérifier que les autres champs n'ont pas changé
        $this->assertEquals($elevageData['adresse'], $updatedElevage['adresse']);
        $this->assertEquals($elevageData['user_id'], $updatedElevage['user_id']);
    }

    /**
     * Test de suppression d'élevage
     */
    public function testDeleteElevage(): void
    {
        $elevageData = $this->createTestElevage($this->pdo, $this->testUser['id']);

        $result = $this->elevage->delete($elevageData['id']);
        $this->assertTrue($result);

        // Vérifier que l'élevage n'existe plus
        $deletedElevage = $this->elevage->getById($elevageData['id']);
        $this->assertNull($deletedElevage);
    }

    /**
     * Test de validation des données d'élevage
     */
    public function testValidateElevageData(): void
    {
        $validData = [
            'nom' => 'Élevage Valide',
            'adresse' => '123 Rue Valide',
            'user_id' => $this->testUser['id'],
            'telephone' => '01 23 45 67 89',
            'email' => 'valid@elevage.com'
        ];

        $isValid = $this->elevage->validateData($validData);
        $this->assertTrue($isValid);
    }

    /**
     * Test de validation avec données invalides
     */
    public function testValidateInvalidElevageData(): void
    {
        $invalidDataSets = [
            // Nom trop court
            [
                'nom' => 'Ab',
                'adresse' => '123 Rue Test',
                'user_id' => $this->testUser['id']
            ],
            // Email invalide
            [
                'nom' => 'Élevage Test',
                'adresse' => '123 Rue Test',
                'user_id' => $this->testUser['id'],
                'email' => 'email-invalide'
            ],
            // Téléphone invalide
            [
                'nom' => 'Élevage Test',
                'adresse' => '123 Rue Test',
                'user_id' => $this->testUser['id'],
                'telephone' => 'numero-invalide'
            ]
        ];

        foreach ($invalidDataSets as $invalidData) {
            $isValid = $this->elevage->validateData($invalidData);
            $this->assertFalse($isValid, 'Les données invalides devraient être rejetées');
        }
    }

    /**
     * Test de recherche d'élevages
     */
    public function testSearchElevages(): void
    {
        // Créer des élevages avec différents noms
        $this->createTestElevage($this->pdo, $this->testUser['id'], ['nom' => 'Élevage Bovin de la Vallée']);
        $this->createTestElevage($this->pdo, $this->testUser['id'], ['nom' => 'Ferme Ovine des Montagnes']);
        $this->createTestElevage($this->pdo, $this->testUser['id'], ['nom' => 'Élevage Caprin du Sud']);

        // Recherche par terme
        $results = $this->elevage->search('Élevage');
        $this->assertCount(2, $results); // Devrait trouver "Élevage Bovin" et "Élevage Caprin"

        $results = $this->elevage->search('Vallée');
        $this->assertCount(1, $results); // Devrait trouver "Élevage Bovin de la Vallée"

        $results = $this->elevage->search('Inexistant');
        $this->assertCount(0, $results); // Aucun résultat
    }

    /**
     * Test de comptage d'animaux par élevage
     */
    public function testGetAnimalsCount(): void
    {
        $elevageData = $this->createTestElevage($this->pdo, $this->testUser['id']);

        // Ajouter quelques animaux de test
        for ($i = 0; $i < 5; $i++) {
            $this->pdo->prepare("INSERT INTO animals (nom, elevage_id) VALUES (?, ?)")
                     ->execute(["Animal $i", $elevageData['id']]);
        }

        $count = $this->elevage->getAnimalsCount($elevageData['id']);
        $this->assertEquals(5, $count);
    }

    /**
     * Test de vérification des droits d'accès
     */
    public function testCheckUserAccess(): void
    {
        $elevageData = $this->createTestElevage($this->pdo, $this->testUser['id']);
        $otherUser = $this->createTestUser($this->pdo, ['email' => 'other@test.com']);

        // Le propriétaire devrait avoir accès
        $hasAccess = $this->elevage->checkUserAccess($elevageData['id'], $this->testUser['id']);
        $this->assertTrue($hasAccess);

        // Un autre utilisateur ne devrait pas avoir accès
        $hasAccess = $this->elevage->checkUserAccess($elevageData['id'], $otherUser['id']);
        $this->assertFalse($hasAccess);
    }

    /**
     * Test de récupération des statistiques d'élevage
     */
    public function testGetElevageStats(): void
    {
        $elevageData = $this->createTestElevage($this->pdo, $this->testUser['id']);

        // Ajouter des données de test
        $this->pdo->prepare("INSERT INTO animals (nom, elevage_id, sexe) VALUES (?, ?, ?)")
                 ->execute(['Vache 1', $elevageData['id'], 'F']);
        $this->pdo->prepare("INSERT INTO animals (nom, elevage_id, sexe) VALUES (?, ?, ?)")
                 ->execute(['Taureau 1', $elevageData['id'], 'M']);
        $this->pdo->prepare("INSERT INTO animals (nom, elevage_id, sexe) VALUES (?, ?, ?)")
                 ->execute(['Vache 2', $elevageData['id'], 'F']);

        $stats = $this->elevage->getStats($elevageData['id']);

        $this->assertIsArray($stats);
        $this->assertEquals(3, $stats['total_animals']);
        $this->assertEquals(2, $stats['females']);
        $this->assertEquals(1, $stats['males']);
    }
}