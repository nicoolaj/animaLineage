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
require_once '../config/database.php';

class AddUserStatusMigration {
    public function up() {
        $database = new Database();
        $conn = $database->getConnection();

        // Déterminer le driver depuis la configuration
        require_once '../config/config.php';
        Config::load();
        $driver = Config::get('DB_DRIVER', 'sqlite');

        try {
            echo "Ajout du champ 'status' à la table users...\n";

            switch ($driver) {
                case 'sqlite':
                    // SQLite ne supporte pas ALTER TABLE ADD COLUMN avec DEFAULT
                    // On doit faire une migration en plusieurs étapes
                    $queries = [
                        "ALTER TABLE users ADD COLUMN status INTEGER DEFAULT 1",
                        "UPDATE users SET status = 1 WHERE status IS NULL"
                    ];
                    break;

                case 'mysql':
                    $queries = [
                        "ALTER TABLE users ADD COLUMN status TINYINT DEFAULT 1 COMMENT '0=pending, 1=validated, 2=rejected'",
                        "UPDATE users SET status = 1 WHERE status IS NULL"
                    ];
                    break;

                case 'pgsql':
                    $queries = [
                        "ALTER TABLE users ADD COLUMN status SMALLINT DEFAULT 1",
                        "COMMENT ON COLUMN users.status IS '0=pending, 1=validated, 2=rejected'",
                        "UPDATE users SET status = 1 WHERE status IS NULL"
                    ];
                    break;

                default:
                    throw new Exception("Driver de base de données non supporté: " . $driver);
            }

            foreach ($queries as $query) {
                $stmt = $conn->prepare($query);
                $stmt->execute();
                echo "Requête exécutée: " . $query . "\n";
            }

            echo "Migration réussie ! Champ 'status' ajouté à la table users.\n";
            echo "Status: 0=en attente, 1=validé, 2=rejeté\n";
            echo "Tous les utilisateurs existants ont été marqués comme validés (status=1).\n";

        } catch (Exception $e) {
            echo "Erreur lors de la migration: " . $e->getMessage() . "\n";
            return false;
        }

        return true;
    }

    public function down() {
        $database = new Database();
        $conn = $database->getConnection();

        // Déterminer le driver depuis la configuration
        require_once '../config/config.php';
        Config::load();
        $driver = Config::get('DB_DRIVER', 'sqlite');

        try {
            echo "Suppression du champ 'status' de la table users...\n";

            switch ($driver) {
                case 'sqlite':
                    echo "SQLite ne supporte pas DROP COLUMN. Migration inverse non disponible.\n";
                    return false;

                case 'mysql':
                case 'pgsql':
                    $query = "ALTER TABLE users DROP COLUMN status";
                    $stmt = $conn->prepare($query);
                    $stmt->execute();
                    echo "Champ 'status' supprimé avec succès.\n";
                    break;
            }

        } catch (Exception $e) {
            echo "Erreur lors de la migration inverse: " . $e->getMessage() . "\n";
            return false;
        }

        return true;
    }
}

// Exécution si appelé directement
if (basename(__FILE__) == basename($_SERVER['SCRIPT_NAME'])) {
    $migration = new AddUserStatusMigration();

    $action = $argv[1] ?? 'up';

    if ($action === 'up') {
        $migration->up();
    } elseif ($action === 'down') {
        $migration->down();
    } else {
        echo "Usage: php add_user_status.php [up|down]\n";
        echo "  up   - Ajouter le champ status\n";
        echo "  down - Supprimer le champ status\n";
    }
}
