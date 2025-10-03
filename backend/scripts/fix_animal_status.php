<?php
/*
 * Script pour corriger le statut des animaux ayant une date de décès
 */

require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();

    echo "🔧 Correction du statut des animaux...\n";

    // Trouver tous les animaux avec une date de décès mais statut 'vivant'
    $query = "SELECT id, identifiant_officiel, date_deces, statut
              FROM animaux
              WHERE date_deces IS NOT NULL AND statut != 'mort'";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $animaux = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "📊 Trouvé " . count($animaux) . " animaux avec date de décès mais statut incorrect.\n";

    if (count($animaux) > 0) {
        // Corriger le statut
        $updateQuery = "UPDATE animaux
                       SET statut = 'mort'
                       WHERE date_deces IS NOT NULL AND statut != 'mort'";
        $updateStmt = $conn->prepare($updateQuery);
        $result = $updateStmt->execute();

        if ($result) {
            $rowsAffected = $updateStmt->rowCount();
            echo "✅ Corrigé le statut de $rowsAffected animaux.\n";

            // Afficher les animaux corrigés
            foreach ($animaux as $animal) {
                echo "  - {$animal['identifiant_officiel']} (décédé le {$animal['date_deces']})\n";
            }
        } else {
            echo "❌ Erreur lors de la correction.\n";
        }
    } else {
        echo "✅ Tous les statuts sont corrects.\n";
    }

    // Statistiques finales
    $statsQuery = "SELECT
                      COUNT(*) as total,
                      SUM(CASE WHEN statut = 'vivant' THEN 1 ELSE 0 END) as vivants,
                      SUM(CASE WHEN statut = 'mort' THEN 1 ELSE 0 END) as morts,
                      SUM(CASE WHEN date_deces IS NOT NULL THEN 1 ELSE 0 END) as avec_date_deces
                   FROM animaux";
    $statsStmt = $conn->prepare($statsQuery);
    $statsStmt->execute();
    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

    echo "\n📈 Statistiques finales :\n";
    echo "  - Total animaux : {$stats['total']}\n";
    echo "  - Vivants : {$stats['vivants']}\n";
    echo "  - Morts : {$stats['morts']}\n";
    echo "  - Avec date de décès : {$stats['avec_date_deces']}\n";

} catch (Exception $e) {
    echo "❌ Erreur : " . $e->getMessage() . "\n";
}
?>