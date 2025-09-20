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

class CreateElevageRacesTable {
    private $conn;
    private $database;

    public function __construct() {
        $this->database = new Database();
        $this->conn = $this->database->getConnection();
    }

    public function up() {
        try {
            $this->createElevageRacesTable();
            echo "Table elevage_races créée avec succès!\n";
        } catch (PDOException $e) {
            echo "Erreur lors de la création de la table: " . $e->getMessage() . "\n";
        }
    }

    private function createElevageRacesTable() {
        $driver = $this->database->getDriver();

        switch ($driver) {
            case 'sqlite':
                $query = "CREATE TABLE IF NOT EXISTS elevage_races (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    elevage_id INTEGER NOT NULL,
                    race_id INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (elevage_id) REFERENCES elevages(id) ON DELETE CASCADE,
                    FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE,
                    UNIQUE(elevage_id, race_id)
                )";
                break;

            case 'mysql':
                $query = "CREATE TABLE IF NOT EXISTS elevage_races (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    elevage_id INT NOT NULL,
                    race_id INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (elevage_id) REFERENCES elevages(id) ON DELETE CASCADE,
                    FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_elevage_race (elevage_id, race_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
                break;

            case 'pgsql':
                $query = "CREATE TABLE IF NOT EXISTS elevage_races (
                    id SERIAL PRIMARY KEY,
                    elevage_id INTEGER NOT NULL,
                    race_id INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (elevage_id) REFERENCES elevages(id) ON DELETE CASCADE,
                    FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE,
                    UNIQUE(elevage_id, race_id)
                )";
                break;

            default:
                throw new Exception("Driver de base de données non supporté: " . $driver);
        }

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
    }
}

// Exécution si le script est appelé directement
if (basename(__FILE__) == basename($_SERVER["SCRIPT_NAME"])) {
    $migration = new CreateElevageRacesTable();
    $migration->up();
}
?>
