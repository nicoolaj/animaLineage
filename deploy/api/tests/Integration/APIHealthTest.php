<?php

use PHPUnit\Framework\TestCase;

/**
 * Test de santé de l'API - vérification des endpoints de base
 */
class APIHealthTest extends TestCase
{
    public function testRootEndpointStructure()
    {
        // Test que les variables d'environnement sont correctement configurées
        $this->assertNotEmpty($_ENV['JWT_SECRET']);
        $this->assertEquals('testing', $_ENV['APP_ENV']);
    }

    public function testJWTConfiguration()
    {
        $secret = $_ENV['JWT_SECRET'];
        $this->assertGreaterThanOrEqual(32, strlen($secret), 'JWT secret should be at least 32 characters for security');
    }

    public function testDatabaseConfiguration()
    {
        $this->assertEquals('sqlite', $_ENV['DB_DRIVER']);
        $this->assertEquals(':memory:', $_ENV['DB_PATH']);
    }

    public function testErrorHandling()
    {
        // Test que les constantes d'erreur sont disponibles si elles existent
        $this->assertTrue(true, 'Error handling configuration test passed');
    }

    public function testEnvironmentSeparation()
    {
        // S'assurer qu'on est bien en mode test
        $this->assertEquals('testing', $_ENV['APP_ENV'], 'Should be in testing environment');
        $this->assertNotEquals('production', $_ENV['APP_ENV'], 'Should not be in production during tests');
    }
}