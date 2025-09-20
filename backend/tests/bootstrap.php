<?php
/**
 * PHPUnit Bootstrap file
 * Initialise l'environnement de test pour AnimaLineage
 */

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/env.php';

// Configuration d'environnement de test
$_ENV['APP_ENV'] = 'testing';
$_ENV['DB_DRIVER'] = 'sqlite';
$_ENV['DB_PATH'] = ':memory:';
$_ENV['JWT_SECRET'] = 'test_secret_key_for_testing_only_32_chars_min';
$_ENV['JWT_EXPIRY'] = '3600';

// Chargement des variables d'environnement
EnvLoader::loadArray($_ENV);

// Démarrage de session pour les tests
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Autoloader pour les helpers de test
spl_autoload_register(function ($class) {
    $testFile = __DIR__ . '/Helpers/' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($testFile)) {
        require_once $testFile;
    }
});

// Nettoyage global après chaque test
function cleanupTestEnvironment() {
    // Nettoyage des sessions
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_unset();
    }

    // Nettoyage des variables globales
    unset($_POST, $_GET, $_FILES);
    $_POST = [];
    $_GET = [];
    $_FILES = [];
}

// Hook de nettoyage automatique
register_shutdown_function('cleanupTestEnvironment');