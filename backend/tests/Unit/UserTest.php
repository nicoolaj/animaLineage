<?php

require_once __DIR__ . '/../Helpers/TestCase.php';
require_once __DIR__ . '/../../models/User.php';

/**
 * Tests unitaires du modèle User
 */
class UserTest extends TestCase
{
    private $pdo;
    private $mockDatabase;
    private $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->pdo = $this->createTestDatabase();
        $this->mockDatabase = $this->createMock(Database::class);
        $this->mockDatabase->method('getConnection')->willReturn($this->pdo);
        $this->mockDatabase->method('getDriver')->willReturn('sqlite');

        $this->user = new User($this->pdo, $this->mockDatabase);
    }

    /**
     * Test de validation d'email valide
     */
    public function testValidateEmailWithValidEmails(): void
    {
        $validEmails = [
            'test@example.com',
            'user.name@domain.co.uk',
            'user+tag@example.org',
            'firstname.lastname@company.com'
        ];

        foreach ($validEmails as $email) {
            $this->assertTrue(
                $this->user->validateEmail($email),
                "L'email '$email' devrait être valide"
            );
        }
    }

    /**
     * Test de validation d'email invalide
     */
    public function testValidateEmailWithInvalidEmails(): void
    {
        $invalidEmails = [
            'invalid.email',
            '@domain.com',
            'user@',
            'user name@domain.com',
            'user..double.dot@domain.com',
            '',
            'user@domain',
            'user@.domain.com'
        ];

        foreach ($invalidEmails as $email) {
            $this->assertFalse(
                $this->user->validateEmail($email),
                "L'email '$email' devrait être invalide"
            );
        }
    }

    /**
     * Test de création d'utilisateur avec données valides
     */
    public function testCreateUserWithValidData(): void
    {
        $userData = [
            'nom' => 'Jean Dupont',
            'email' => 'jean.dupont@example.com',
            'password' => 'Password123!',
            'status' => 0,
            'role' => 'eleveur'
        ];

        $userId = $this->user->create($userData);

        $this->assertIsInt($userId);
        $this->assertGreaterThan(0, $userId);

        // Vérifier que l'utilisateur a été créé en base
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $createdUser = $stmt->fetch(PDO::FETCH_ASSOC);

        $this->assertNotFalse($createdUser);
        $this->assertEquals($userData['nom'], $createdUser['nom']);
        $this->assertEquals($userData['email'], $createdUser['email']);
        $this->assertEquals($userData['status'], $createdUser['status']);
        $this->assertTrue(password_verify($userData['password'], $createdUser['password']));
    }

    /**
     * Test de création d'utilisateur avec email déjà existant
     */
    public function testCreateUserWithDuplicateEmail(): void
    {
        $userData = [
            'nom' => 'User 1',
            'email' => 'duplicate@example.com',
            'password' => 'Password123!'
        ];

        // Créer le premier utilisateur
        $this->user->create($userData);

        // Tenter de créer un second utilisateur avec le même email
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('Email déjà utilisé');

        $userData['nom'] = 'User 2';
        $this->user->create($userData);
    }

    /**
     * Test de validation de mot de passe fort
     */
    public function testValidateStrongPassword(): void
    {
        $strongPasswords = [
            'Password123!',
            'MyS3cur3P@ssw0rd',
            'Complex!Pass123',
            'An0th3r$tr0ngP@ss'
        ];

        foreach ($strongPasswords as $password) {
            $this->assertTrue(
                $this->user->isStrongPassword($password),
                "Le mot de passe '$password' devrait être considéré comme fort"
            );
        }
    }

    /**
     * Test de validation de mot de passe faible
     */
    public function testValidateWeakPassword(): void
    {
        $weakPasswords = [
            'password',      // Trop commun
            '123456',        // Trop simple
            'abc123',        // Trop court
            'PASSWORD',      // Pas de minuscule/chiffre
            'password123',   // Pas de majuscule/caractère spécial
            'Password123',   // Pas de caractère spécial
            '',              // Vide
            'azerty'         // Trop commun
        ];

        foreach ($weakPasswords as $password) {
            $this->assertFalse(
                $this->user->isStrongPassword($password),
                "Le mot de passe '$password' devrait être considéré comme faible"
            );
        }
    }

    /**
     * Test de récupération d'utilisateur par ID
     */
    public function testGetUserById(): void
    {
        $userData = $this->createTestUser($this->pdo);

        $retrievedUser = $this->user->getUserById($userData['id']);

        $this->assertIsArray($retrievedUser);
        $this->assertEquals($userData['id'], $retrievedUser['id']);
        $this->assertEquals($userData['nom'], $retrievedUser['nom']);
        $this->assertEquals($userData['email'], $retrievedUser['email']);
    }

    /**
     * Test de récupération d'utilisateur inexistant
     */
    public function testGetUserByIdNotFound(): void
    {
        $retrievedUser = $this->user->getUserById(999);
        $this->assertNull($retrievedUser);
    }

    /**
     * Test de récupération d'utilisateur par email
     */
    public function testGetUserByEmail(): void
    {
        $userData = $this->createTestUser($this->pdo);

        $retrievedUser = $this->user->getUserByEmail($userData['email']);

        $this->assertIsArray($retrievedUser);
        $this->assertEquals($userData['email'], $retrievedUser['email']);
        $this->assertEquals($userData['nom'], $retrievedUser['nom']);
    }

    /**
     * Test de vérification de mot de passe
     */
    public function testVerifyPassword(): void
    {
        $password = 'TestPassword123!';
        $hash = password_hash($password, PASSWORD_DEFAULT);

        $this->assertTrue($this->user->verifyPassword($password, $hash));
        $this->assertFalse($this->user->verifyPassword('WrongPassword', $hash));
    }

    /**
     * Test de mise à jour du statut utilisateur
     */
    public function testUpdateUserStatus(): void
    {
        $userData = $this->createTestUser($this->pdo, ['status' => 0]);

        $result = $this->user->updateStatus($userData['id'], 1);
        $this->assertTrue($result);

        // Vérifier la mise à jour en base
        $updatedUser = $this->user->getUserById($userData['id']);
        $this->assertEquals(1, $updatedUser['status']);
    }

    /**
     * Test de suppression d'utilisateur
     */
    public function testDeleteUser(): void
    {
        $userData = $this->createTestUser($this->pdo);

        $result = $this->user->delete($userData['id']);
        $this->assertTrue($result);

        // Vérifier que l'utilisateur n'existe plus
        $deletedUser = $this->user->getUserById($userData['id']);
        $this->assertNull($deletedUser);
    }

    /**
     * Test de liste des utilisateurs
     */
    public function testGetAllUsers(): void
    {
        // Créer plusieurs utilisateurs de test
        $this->createTestUser($this->pdo, ['email' => 'user1@test.com']);
        $this->createTestUser($this->pdo, ['email' => 'user2@test.com']);
        $this->createTestUser($this->pdo, ['email' => 'user3@test.com']);

        $users = $this->user->getAllUsers();

        $this->assertIsArray($users);
        $this->assertCount(3, $users);

        // Vérifier que les utilisateurs sont triés par nom
        $this->assertEquals('user1@test.com', $users[0]['email']);
    }

    /**
     * Test de validation des données d'entrée
     */
    public function testValidateUserDataWithInvalidData(): void
    {
        $invalidData = [
            'nom' => '',  // Nom vide
            'email' => 'invalid-email',  // Email invalide
            'password' => '123'  // Mot de passe trop faible
        ];

        $this->expectException(Exception::class);
        $this->user->create($invalidData);
    }
}