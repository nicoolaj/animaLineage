<?php

use PHPUnit\Framework\TestCase;

/**
 * Test de base pour vérifier que l'infrastructure fonctionne
 */
class BasicTest extends TestCase
{
    public function testPHPVersion()
    {
        $this->assertGreaterThanOrEqual('7.4', PHP_VERSION, 'PHP version should be 7.4 or higher');
    }

    public function testEnvironmentVariables()
    {
        $this->assertEquals('testing', $_ENV['APP_ENV']);
        $this->assertEquals('sqlite', $_ENV['DB_DRIVER']);
        $this->assertEquals(':memory:', $_ENV['DB_PATH']);
    }

    public function testAutoloader()
    {
        $this->assertTrue(class_exists('EnvLoader'), 'EnvLoader class should be available');
    }

    public function testDatabaseConnection()
    {
        try {
            $pdo = new PDO('sqlite::memory:');
            $this->assertInstanceOf(PDO::class, $pdo);
        } catch (PDOException $e) {
            $this->fail('Should be able to create SQLite in-memory database: ' . $e->getMessage());
        }
    }

    public function testJWTSecret()
    {
        $this->assertNotEmpty($_ENV['JWT_SECRET']);
        $this->assertGreaterThanOrEqual(32, strlen($_ENV['JWT_SECRET']), 'JWT secret should be at least 32 characters');
    }
}