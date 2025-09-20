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

class CreateElevageTables {
    private $database;
    private $conn;

    public function __construct() {
        $this->database = new Database();
        $this->conn = $this->database->getConnection();
    }

    public function createTables() {
        try {
            // Table types_animaux
            $this->createTypesAnimauxTable();

            // Table races
            $this->createRacesTable();

            // Table elevages
            $this->createElevagesTable();

            // Table de liaison elevage_types
            $this->createElevageTypesTable();

            // Insérer des données de base
            $this->insertBasicData();

            echo "Tables d'élevage créées avec succès!\n";

        } catch (PDOException $e) {
            echo "Erreur lors de la création des tables: " . $e->getMessage() . "\n";
        }
    }

    private function createTypesAnimauxTable() {
        $driver = $this->database->getDriver();

        switch ($driver) {
            case 'sqlite':
                $query = "CREATE TABLE IF NOT EXISTS types_animaux (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nom VARCHAR(100) NOT NULL UNIQUE,
                    description TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )";
                break;

            case 'mysql':
                $query = "CREATE TABLE IF NOT EXISTS types_animaux (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nom VARCHAR(100) NOT NULL UNIQUE,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
                break;

            case 'pgsql':
                $query = "CREATE TABLE IF NOT EXISTS types_animaux (
                    id SERIAL PRIMARY KEY,
                    nom VARCHAR(100) NOT NULL UNIQUE,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )";
                break;

            default:
                throw new Exception("Driver de base de données non supporté: " . $driver);
        }

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
    }

    private function createRacesTable() {
        $driver = $this->database->getDriver();

        switch ($driver) {
            case 'sqlite':
                $query = "CREATE TABLE IF NOT EXISTS races (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nom VARCHAR(100) NOT NULL,
                    type_animal_id INTEGER NOT NULL,
                    description TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (type_animal_id) REFERENCES types_animaux(id) ON DELETE CASCADE,
                    UNIQUE(nom, type_animal_id)
                )";
                break;

            case 'mysql':
                $query = "CREATE TABLE IF NOT EXISTS races (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nom VARCHAR(100) NOT NULL,
                    type_animal_id INT NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (type_animal_id) REFERENCES types_animaux(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_race_type (nom, type_animal_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
                break;

            case 'pgsql':
                $query = "CREATE TABLE IF NOT EXISTS races (
                    id SERIAL PRIMARY KEY,
                    nom VARCHAR(100) NOT NULL,
                    type_animal_id INTEGER NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (type_animal_id) REFERENCES types_animaux(id) ON DELETE CASCADE,
                    UNIQUE(nom, type_animal_id)
                )";
                break;
        }

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
    }

    private function createElevagesTable() {
        $driver = $this->database->getDriver();

        switch ($driver) {
            case 'sqlite':
                $query = "CREATE TABLE IF NOT EXISTS elevages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nom VARCHAR(200) NOT NULL,
                    adresse TEXT NOT NULL,
                    user_id INTEGER NOT NULL,
                    telephone VARCHAR(20),
                    email VARCHAR(255),
                    description TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )";
                break;

            case 'mysql':
                $query = "CREATE TABLE IF NOT EXISTS elevages (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nom VARCHAR(200) NOT NULL,
                    adresse TEXT NOT NULL,
                    user_id INT NOT NULL,
                    telephone VARCHAR(20),
                    email VARCHAR(255),
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
                break;

            case 'pgsql':
                $query = "CREATE TABLE IF NOT EXISTS elevages (
                    id SERIAL PRIMARY KEY,
                    nom VARCHAR(200) NOT NULL,
                    adresse TEXT NOT NULL,
                    user_id INTEGER NOT NULL,
                    telephone VARCHAR(20),
                    email VARCHAR(255),
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )";
                break;
        }

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
    }

    private function createElevageTypesTable() {
        $driver = $this->database->getDriver();

        switch ($driver) {
            case 'sqlite':
                $query = "CREATE TABLE IF NOT EXISTS elevage_types (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    elevage_id INTEGER NOT NULL,
                    type_animal_id INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (elevage_id) REFERENCES elevages(id) ON DELETE CASCADE,
                    FOREIGN KEY (type_animal_id) REFERENCES types_animaux(id) ON DELETE CASCADE,
                    UNIQUE(elevage_id, type_animal_id)
                )";
                break;

            case 'mysql':
                $query = "CREATE TABLE IF NOT EXISTS elevage_types (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    elevage_id INT NOT NULL,
                    type_animal_id INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (elevage_id) REFERENCES elevages(id) ON DELETE CASCADE,
                    FOREIGN KEY (type_animal_id) REFERENCES types_animaux(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_elevage_type (elevage_id, type_animal_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
                break;

            case 'pgsql':
                $query = "CREATE TABLE IF NOT EXISTS elevage_types (
                    id SERIAL PRIMARY KEY,
                    elevage_id INTEGER NOT NULL,
                    type_animal_id INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (elevage_id) REFERENCES elevages(id) ON DELETE CASCADE,
                    FOREIGN KEY (type_animal_id) REFERENCES types_animaux(id) ON DELETE CASCADE,
                    UNIQUE(elevage_id, type_animal_id)
                )";
                break;
        }

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
    }

    private function insertBasicData() {
        // Insérer les types d'animaux de base
        $typesAnimaux = [
            ['nom' => 'Bovin', 'description' => 'Bovins (vaches, taureaux, veaux)'],
            ['nom' => 'Ovin', 'description' => 'Ovins (moutons, brebis, agneaux)'],
            ['nom' => 'Caprin', 'description' => 'Caprins (chèvres, boucs, chevreaux)'],
            ['nom' => 'Porcin', 'description' => 'Porcins (porcs, truies, porcelets)'],
            ['nom' => 'Équin', 'description' => 'Équins (chevaux, juments, poulains)'],
            ['nom' => 'Volaille', 'description' => 'Volailles (poules, coqs, canards, oies)']
        ];

        foreach ($typesAnimaux as $type) {
            $query = "INSERT OR IGNORE INTO types_animaux (nom, description) VALUES (:nom, :description)";
            if ($this->database->getDriver() === 'mysql') {
                $query = "INSERT IGNORE INTO types_animaux (nom, description) VALUES (:nom, :description)";
            } elseif ($this->database->getDriver() === 'pgsql') {
                $query = "INSERT INTO types_animaux (nom, description) VALUES (:nom, :description) ON CONFLICT (nom) DO NOTHING";
            }

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':nom', $type['nom']);
            $stmt->bindParam(':description', $type['description']);
            $stmt->execute();
        }

        // Insérer quelques races de base
        $races = [
            // Bovins
            ['nom' => 'Holstein', 'type' => 'Bovin', 'description' => 'Race laitière performante'],
            ['nom' => 'Charolaise', 'type' => 'Bovin', 'description' => 'Race à viande française'],
            ['nom' => 'Limousine', 'type' => 'Bovin', 'description' => 'Race à viande rustique'],

            // Ovins
            ['nom' => 'Lacaune', 'type' => 'Ovin', 'description' => 'Race laitière pour fromage'],
            ['nom' => 'Mérinos', 'type' => 'Ovin', 'description' => 'Race à laine fine'],
            ['nom' => 'Suffolk', 'type' => 'Ovin', 'description' => 'Race à viande britannique'],

            // Caprins
            ['nom' => 'Alpine', 'type' => 'Caprin', 'description' => 'Race laitière des Alpes'],
            ['nom' => 'Saanen', 'type' => 'Caprin', 'description' => 'Race laitière suisse'],

            // Porcins
            ['nom' => 'Large White', 'type' => 'Porcin', 'description' => 'Race prolique anglaise'],
            ['nom' => 'Duroc', 'type' => 'Porcin', 'description' => 'Race américaine rustique'],

            // Équins
            ['nom' => 'Pur-sang', 'type' => 'Équin', 'description' => 'Race de course'],
            ['nom' => 'Percheron', 'type' => 'Équin', 'description' => 'Race de trait française'],

            // Volailles
            ['nom' => 'Poule Rhode Island', 'type' => 'Volaille', 'description' => 'Race pondeuse rustique'],
            ['nom' => 'Canard de Barbarie', 'type' => 'Volaille', 'description' => 'Canard à chair ferme']
        ];

        foreach ($races as $race) {
            // Récupérer l'ID du type d'animal
            $queryType = "SELECT id FROM types_animaux WHERE nom = :type";
            $stmtType = $this->conn->prepare($queryType);
            $stmtType->bindParam(':type', $race['type']);
            $stmtType->execute();
            $typeResult = $stmtType->fetch(PDO::FETCH_ASSOC);

            if ($typeResult) {
                $query = "INSERT OR IGNORE INTO races (nom, type_animal_id, description) VALUES (:nom, :type_animal_id, :description)";
                if ($this->database->getDriver() === 'mysql') {
                    $query = "INSERT IGNORE INTO races (nom, type_animal_id, description) VALUES (:nom, :type_animal_id, :description)";
                } elseif ($this->database->getDriver() === 'pgsql') {
                    $query = "INSERT INTO races (nom, type_animal_id, description) VALUES (:nom, :type_animal_id, :description) ON CONFLICT (nom, type_animal_id) DO NOTHING";
                }

                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':nom', $race['nom']);
                $stmt->bindParam(':type_animal_id', $typeResult['id']);
                $stmt->bindParam(':description', $race['description']);
                $stmt->execute();
            }
        }
    }
}

// Exécuter la migration si le script est appelé directement
if (basename(__FILE__) == basename($_SERVER['SCRIPT_NAME'])) {
    require_once __DIR__ . '/../config/env.php';
    EnvLoader::load(__DIR__ . '/../.env');

    $migration = new CreateElevageTables();
    $migration->createTables();
}
?>
