<?php
/*
 * Script de vérification et migration automatique pour AnimaLineage
 * Ce script vérifie et crée les tables manquantes lors du déploiement
 */

require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    echo "🔍 Vérification de la base de données...\n";

    // Vérifier si la table health_log existe
    $driver = $database->getDriver();

    if ($driver === 'sqlite') {
        $stmt = $db->prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='health_log'");
    } else {
        $stmt = $db->prepare("SHOW TABLES LIKE 'health_log'");
    }

    $stmt->execute();
    $exists = $stmt->fetch();

    if (!$exists) {
        echo "⚠️ Table health_log manquante, création en cours...\n";

        // Exécuter la migration
        $migrationFile = __DIR__ . '/create_health_log.sql';
        if (file_exists($migrationFile)) {
            $sql = file_get_contents($migrationFile);
            $db->exec($sql);
            echo "✅ Table health_log créée avec succès\n";
        } else {
            echo "❌ Fichier de migration introuvable: $migrationFile\n";
            exit(1);
        }
    } else {
        echo "✅ Table health_log déjà présente\n";
    }

    // Vérifier que la table contient bien les colonnes attendues
    if ($driver === 'sqlite') {
        $stmt = $db->prepare("PRAGMA table_info(health_log)");
    } else {
        $stmt = $db->prepare("DESCRIBE health_log");
    }

    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $expectedColumns = ['id', 'animal_id', 'user_id', 'event_type', 'title', 'description', 'severity', 'event_date', 'created_at', 'updated_at'];
    $foundColumns = array_column($columns, $driver === 'sqlite' ? 'name' : 'Field');

    $missingColumns = array_diff($expectedColumns, $foundColumns);
    if (empty($missingColumns)) {
        echo "✅ Structure de la table health_log correcte\n";
    } else {
        echo "⚠️ Colonnes manquantes dans health_log: " . implode(', ', $missingColumns) . "\n";
    }

    echo "🎉 Vérification terminée avec succès\n";

} catch (Exception $e) {
    echo "❌ Erreur lors de la vérification: " . $e->getMessage() . "\n";
    exit(1);
}
?>