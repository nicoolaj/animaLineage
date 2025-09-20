<?php
/*
 * Copyright 2025 - Nicolas Jalibert
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
require_once __DIR__ . '/../config/database.php';

class UpdateAnimauxStructure {
    private $conn;
    private $database;

    public function __construct() {
        $this->database = new Database();
        $this->conn = $this->database->getConnection();
    }

    public function up() {
        try {
            $this->updateAnimauxTable();
            echo "Structure de la table animaux mise à jour avec succès!\n";
        } catch (PDOException $e) {
            echo "Erreur lors de la mise à jour de la table: " . $e->getMessage() . "\n";
        }
    }

    private function updateAnimauxTable() {
        $driver = $this->database->getDriver();

        // Ajouter les colonnes manquantes selon les spécifications
        $alterQueries = [];

        switch ($driver) {
            case 'sqlite':
                // SQLite ne supporte pas ALTER COLUMN, nous devons recréer la table
                $this->recreateTableSQLite();
                return;

            case 'mysql':
                // Modifier la colonne nom pour qu'elle soit optionnelle
                $alterQueries[] = "ALTER TABLE animaux MODIFY COLUMN nom VARCHAR(100) NULL";

                // Renommer numero_identification en identifiant_officiel
                $alterQueries[] = "ALTER TABLE animaux CHANGE numero_identification identifiant_officiel VARCHAR(50) NOT NULL";

                // Ajouter les nouvelles colonnes
                $alterQueries[] = "ALTER TABLE animaux ADD COLUMN date_bouclage DATE NULL AFTER date_naissance";
                $alterQueries[] = "ALTER TABLE animaux ADD COLUMN date_deces DATE NULL AFTER date_bouclage";

                // Modifier le statut pour gérer automatiquement la mort
                $alterQueries[] = "ALTER TABLE animaux MODIFY COLUMN statut ENUM('vivant', 'mort') DEFAULT 'vivant'";

                // Supprimer les colonnes non nécessaires selon les specs
                $alterQueries[] = "ALTER TABLE animaux DROP COLUMN poids";
                $alterQueries[] = "ALTER TABLE animaux DROP COLUMN couleur";
                break;

            case 'pgsql':
                // Modifier la colonne nom pour qu'elle soit optionnelle
                $alterQueries[] = "ALTER TABLE animaux ALTER COLUMN nom DROP NOT NULL";

                // Renommer numero_identification en identifiant_officiel
                $alterQueries[] = "ALTER TABLE animaux RENAME COLUMN numero_identification TO identifiant_officiel";
                $alterQueries[] = "ALTER TABLE animaux ALTER COLUMN identifiant_officiel SET NOT NULL";

                // Ajouter les nouvelles colonnes
                $alterQueries[] = "ALTER TABLE animaux ADD COLUMN date_bouclage DATE";
                $alterQueries[] = "ALTER TABLE animaux ADD COLUMN date_deces DATE";

                // Modifier le statut
                $alterQueries[] = "ALTER TABLE animaux DROP CONSTRAINT IF EXISTS animaux_statut_check";
                $alterQueries[] = "ALTER TABLE animaux ADD CONSTRAINT animaux_statut_check CHECK (statut IN ('vivant', 'mort'))";

                // Supprimer les colonnes non nécessaires
                $alterQueries[] = "ALTER TABLE animaux DROP COLUMN IF EXISTS poids";
                $alterQueries[] = "ALTER TABLE animaux DROP COLUMN IF EXISTS couleur";
                break;

            default:
                throw new Exception("Driver de base de données non supporté: " . $driver);
        }

        // Exécuter les requêtes
        foreach ($alterQueries as $query) {
            try {
                $stmt = $this->conn->prepare($query);
                $stmt->execute();
            } catch (PDOException $e) {
                // Ignorer les erreurs de colonnes déjà existantes ou inexistantes
                if (strpos($e->getMessage(), 'already exists') === false &&
                    strpos($e->getMessage(), "doesn't exist") === false) {
                    throw $e;
                }
            }
        }
    }

    private function recreateTableSQLite() {
        // Sauvegarder les données existantes
        $backupQuery = "CREATE TABLE animaux_backup AS SELECT * FROM animaux";
        $this->conn->exec($backupQuery);

        // Supprimer l'ancienne table
        $this->conn->exec("DROP TABLE animaux");

        // Créer la nouvelle table avec la structure mise à jour
        $createQuery = "CREATE TABLE animaux (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            identifiant_officiel VARCHAR(50) NOT NULL UNIQUE,
            nom VARCHAR(100) NULL,
            sexe VARCHAR(1) CHECK (sexe IN ('M', 'F')) NOT NULL,
            pere_id INTEGER,
            mere_id INTEGER,
            race_id INTEGER NOT NULL,
            date_naissance DATE,
            date_bouclage DATE,
            date_deces DATE,
            elevage_id INTEGER,
            statut VARCHAR(10) CHECK (statut IN ('vivant', 'mort')) DEFAULT 'vivant',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (race_id) REFERENCES races(id),
            FOREIGN KEY (pere_id) REFERENCES animaux(id),
            FOREIGN KEY (mere_id) REFERENCES animaux(id),
            FOREIGN KEY (elevage_id) REFERENCES elevages(id) ON DELETE SET NULL
        )";
        $this->conn->exec($createQuery);

        // Restaurer les données compatibles
        $restoreQuery = "INSERT INTO animaux (
            id, identifiant_officiel, nom, sexe, pere_id, mere_id, race_id,
            date_naissance, elevage_id, statut, notes, created_at, updated_at
        ) SELECT
            id,
            COALESCE(numero_identification, 'ID' || id) as identifiant_officiel,
            nom, sexe, pere_id, mere_id, race_id,
            date_naissance, elevage_id,
            CASE WHEN statut = 'mort' THEN 'mort' ELSE 'vivant' END as statut,
            notes, created_at, updated_at
        FROM animaux_backup";

        $this->conn->exec($restoreQuery);

        // Supprimer la table de sauvegarde
        $this->conn->exec("DROP TABLE animaux_backup");
    }

    public function down() {
        // Méthode pour annuler les changements si nécessaire
        echo "Rollback non implémenté pour cette migration.\n";
    }
}

// Exécution si le script est appelé directement
if (basename(__FILE__) == basename($_SERVER["SCRIPT_NAME"])) {
    $migration = new UpdateAnimauxStructure();
    $migration->up();
}
?>
