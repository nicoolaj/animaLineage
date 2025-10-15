<?php
/*
 * Script de debug pour le health-log
 * À utiliser temporairement en production pour diagnostiquer le problème
 */

// Activer l'affichage des erreurs pour le debug
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "🔍 Debug Health Log API\n\n";

try {
    // Vérifier que les fichiers existent
    $files = [
        'config/database.php',
        'models/HealthLog.php',
        'controllers/HealthLogController.php'
    ];

    foreach ($files as $file) {
        if (file_exists($file)) {
            echo "✅ $file - OK\n";
        } else {
            echo "❌ $file - MANQUANT\n";
        }
    }

    echo "\n";

    // Tester la connection base de données
    require_once 'config/database.php';
    $database = new Database();
    $db = $database->getConnection();
    echo "✅ Connexion base de données - OK\n";

    // Vérifier la table health_log
    $driver = $database->getDriver();
    if ($driver === 'sqlite') {
        $stmt = $db->prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='health_log'");
    } else {
        $stmt = $db->prepare("SHOW TABLES LIKE 'health_log'");
    }

    $stmt->execute();
    $exists = $stmt->fetch();

    if ($exists) {
        echo "✅ Table health_log - EXISTE\n";
    } else {
        echo "❌ Table health_log - MANQUANTE\n";
        echo "📝 Exécution de la migration...\n";

        if (file_exists('migrations/create_health_log.sql')) {
            $sql = file_get_contents('migrations/create_health_log.sql');
            $db->exec($sql);
            echo "✅ Migration exécutée\n";
        } else {
            echo "❌ Fichier de migration introuvable\n";
        }
    }

    // Vérifier que l'animal existe
    $animal_id = 39;
    $stmt = $db->prepare("SELECT id, identifiant_officiel, nom FROM animaux WHERE id = :id");
    $stmt->bindParam(':id', $animal_id, PDO::PARAM_INT);
    $stmt->execute();
    $animal = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($animal) {
        echo "✅ Animal ID $animal_id - EXISTE ({$animal['identifiant_officiel']})\n";
    } else {
        echo "❌ Animal ID $animal_id - INTROUVABLE\n";
    }

    // Tester le modèle HealthLog
    require_once 'models/HealthLog.php';
    $healthLog = new HealthLog($db);
    echo "✅ Modèle HealthLog - OK\n";

    // Tester une requête simple
    $events = $healthLog->getByAnimalId($animal_id, 5, 0);
    echo "✅ Requête getByAnimalId - OK (" . count($events) . " événements)\n";

    // Tester le contrôleur
    require_once 'controllers/HealthLogController.php';
    $controller = new HealthLogController();
    echo "✅ Contrôleur HealthLogController - OK\n";

    echo "\n🎉 Tous les tests sont passés !\n";

} catch (Exception $e) {
    echo "❌ ERREUR: " . $e->getMessage() . "\n";
    echo "📍 Fichier: " . $e->getFile() . " ligne " . $e->getLine() . "\n";
    if ($e->getPrevious()) {
        echo "🔗 Cause: " . $e->getPrevious()->getMessage() . "\n";
    }
}
?>