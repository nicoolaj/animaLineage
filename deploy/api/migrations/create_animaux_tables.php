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

class CreateAnimauxTables {
    private $conn;
    private $database;

    public function __construct() {
        $this->database = new Database();
        $this->conn = $this->database->getConnection();
    }

    public function up() {
        try {
            $this->createAnimauxTable();
            $this->createElevageAnimauxTable();
            $this->createDemandesEchangeTable();
            echo "Tables des animaux créées avec succès!\n";
        } catch (PDOException $e) {
            echo "Erreur lors de la création des tables: " . $e->getMessage() . "\n";
        }
    }

    private function createAnimauxTable() {
        $driver = $this->database->getDriver();

        switch ($driver) {
            case 'sqlite':
                $query = "CREATE TABLE IF NOT EXISTS animaux (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nom VARCHAR(100) NOT NULL,
                    numero_identification VARCHAR(50) UNIQUE,
                    race_id INTEGER NOT NULL,
                    sexe VARCHAR(1) CHECK (sexe IN ('M', 'F')) NOT NULL,
                    date_naissance DATE,
                    poids DECIMAL(6,2),
                    couleur VARCHAR(50),
                    pere_id INTEGER,
                    mere_id INTEGER,
                    statut VARCHAR(10) CHECK (statut IN ('vivant', 'vendu', 'mort')) DEFAULT 'vivant',
                    notes TEXT,
                    elevage_id INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (race_id) REFERENCES races(id),
                    FOREIGN KEY (pere_id) REFERENCES animaux(id),
                    FOREIGN KEY (mere_id) REFERENCES animaux(id),
                    FOREIGN KEY (elevage_id) REFERENCES elevages(id) ON DELETE CASCADE
                )";
                break;

            case 'mysql':
                $query = "CREATE TABLE IF NOT EXISTS animaux (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nom VARCHAR(100) NOT NULL,
                    numero_identification VARCHAR(50) UNIQUE,
                    race_id INT NOT NULL,
                    sexe ENUM('M', 'F') NOT NULL,
                    date_naissance DATE,
                    poids DECIMAL(6,2),
                    couleur VARCHAR(50),
                    pere_id INT,
                    mere_id INT,
                    statut ENUM('vivant', 'vendu', 'mort') DEFAULT 'vivant',
                    notes TEXT,
                    elevage_id INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (race_id) REFERENCES races(id),
                    FOREIGN KEY (pere_id) REFERENCES animaux(id),
                    FOREIGN KEY (mere_id) REFERENCES animaux(id),
                    FOREIGN KEY (elevage_id) REFERENCES elevages(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
                break;

            case 'pgsql':
                $query = "CREATE TABLE IF NOT EXISTS animaux (
                    id SERIAL PRIMARY KEY,
                    nom VARCHAR(100) NOT NULL,
                    numero_identification VARCHAR(50) UNIQUE,
                    race_id INTEGER NOT NULL,
                    sexe VARCHAR(1) CHECK (sexe IN ('M', 'F')) NOT NULL,
                    date_naissance DATE,
                    poids DECIMAL(6,2),
                    couleur VARCHAR(50),
                    pere_id INTEGER,
                    mere_id INTEGER,
                    statut VARCHAR(10) CHECK (statut IN ('vivant', 'vendu', 'mort')) DEFAULT 'vivant',
                    notes TEXT,
                    elevage_id INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (race_id) REFERENCES races(id),
                    FOREIGN KEY (pere_id) REFERENCES animaux(id),
                    FOREIGN KEY (mere_id) REFERENCES animaux(id),
                    FOREIGN KEY (elevage_id) REFERENCES elevages(id) ON DELETE CASCADE
                )";
                break;

            default:
                throw new Exception("Driver de base de données non supporté: " . $driver);
        }

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
    }

    private function createElevageAnimauxTable() {
        $driver = $this->database->getDriver();

        switch ($driver) {
            case 'sqlite':
                $query = "CREATE TABLE IF NOT EXISTS elevage_animaux (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    elevage_id INTEGER NOT NULL,
                    animal_id INTEGER NOT NULL,
                    date_arrivee DATE DEFAULT (DATE('now')),
                    date_depart DATE,
                    statut VARCHAR(10) CHECK (statut IN ('present', 'prete', 'vendu', 'echange')) DEFAULT 'present',
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (elevage_id) REFERENCES elevages(id) ON DELETE CASCADE,
                    FOREIGN KEY (animal_id) REFERENCES animaux(id) ON DELETE CASCADE,
                    UNIQUE(elevage_id, animal_id, date_arrivee)
                )";
                break;

            case 'mysql':
                $query = "CREATE TABLE IF NOT EXISTS elevage_animaux (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    elevage_id INT NOT NULL,
                    animal_id INT NOT NULL,
                    date_arrivee DATE DEFAULT (CURDATE()),
                    date_depart DATE,
                    statut ENUM('present', 'prete', 'vendu', 'echange') DEFAULT 'present',
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (elevage_id) REFERENCES elevages(id) ON DELETE CASCADE,
                    FOREIGN KEY (animal_id) REFERENCES animaux(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_elevage_animal_date (elevage_id, animal_id, date_arrivee)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
                break;

            case 'pgsql':
                $query = "CREATE TABLE IF NOT EXISTS elevage_animaux (
                    id SERIAL PRIMARY KEY,
                    elevage_id INTEGER NOT NULL,
                    animal_id INTEGER NOT NULL,
                    date_arrivee DATE DEFAULT CURRENT_DATE,
                    date_depart DATE,
                    statut VARCHAR(10) CHECK (statut IN ('present', 'prete', 'vendu', 'echange')) DEFAULT 'present',
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (elevage_id) REFERENCES elevages(id) ON DELETE CASCADE,
                    FOREIGN KEY (animal_id) REFERENCES animaux(id) ON DELETE CASCADE,
                    UNIQUE(elevage_id, animal_id, date_arrivee)
                )";
                break;
        }

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
    }

    private function createDemandesEchangeTable() {
        $driver = $this->database->getDriver();

        switch ($driver) {
            case 'sqlite':
                $query = "CREATE TABLE IF NOT EXISTS demandes_echange (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    animal_id INTEGER NOT NULL,
                    elevage_demandeur_id INTEGER NOT NULL,
                    elevage_proprietaire_id INTEGER NOT NULL,
                    type_demande VARCHAR(10) CHECK (type_demande IN ('achat', 'pret', 'echange')) NOT NULL,
                    message TEXT,
                    statut VARCHAR(12) CHECK (statut IN ('en_attente', 'acceptee', 'refusee', 'annulee')) DEFAULT 'en_attente',
                    prix_propose DECIMAL(10,2),
                    duree_pret_jours INTEGER,
                    animal_propose_id INTEGER,
                    reponse_message TEXT,
                    date_debut_pret DATE,
                    date_fin_pret DATE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (animal_id) REFERENCES animaux(id),
                    FOREIGN KEY (elevage_demandeur_id) REFERENCES elevages(id),
                    FOREIGN KEY (elevage_proprietaire_id) REFERENCES elevages(id),
                    FOREIGN KEY (animal_propose_id) REFERENCES animaux(id)
                )";
                break;

            case 'mysql':
                $query = "CREATE TABLE IF NOT EXISTS demandes_echange (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    animal_id INT NOT NULL,
                    elevage_demandeur_id INT NOT NULL,
                    elevage_proprietaire_id INT NOT NULL,
                    type_demande ENUM('achat', 'pret', 'echange') NOT NULL,
                    message TEXT,
                    statut ENUM('en_attente', 'acceptee', 'refusee', 'annulee') DEFAULT 'en_attente',
                    prix_propose DECIMAL(10,2),
                    duree_pret_jours INT,
                    animal_propose_id INT,
                    reponse_message TEXT,
                    date_debut_pret DATE,
                    date_fin_pret DATE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (animal_id) REFERENCES animaux(id),
                    FOREIGN KEY (elevage_demandeur_id) REFERENCES elevages(id),
                    FOREIGN KEY (elevage_proprietaire_id) REFERENCES elevages(id),
                    FOREIGN KEY (animal_propose_id) REFERENCES animaux(id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
                break;

            case 'pgsql':
                $query = "CREATE TABLE IF NOT EXISTS demandes_echange (
                    id SERIAL PRIMARY KEY,
                    animal_id INTEGER NOT NULL,
                    elevage_demandeur_id INTEGER NOT NULL,
                    elevage_proprietaire_id INTEGER NOT NULL,
                    type_demande VARCHAR(10) CHECK (type_demande IN ('achat', 'pret', 'echange')) NOT NULL,
                    message TEXT,
                    statut VARCHAR(12) CHECK (statut IN ('en_attente', 'acceptee', 'refusee', 'annulee')) DEFAULT 'en_attente',
                    prix_propose DECIMAL(10,2),
                    duree_pret_jours INTEGER,
                    animal_propose_id INTEGER,
                    reponse_message TEXT,
                    date_debut_pret DATE,
                    date_fin_pret DATE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (animal_id) REFERENCES animaux(id),
                    FOREIGN KEY (elevage_demandeur_id) REFERENCES elevages(id),
                    FOREIGN KEY (elevage_proprietaire_id) REFERENCES elevages(id),
                    FOREIGN KEY (animal_propose_id) REFERENCES animaux(id)
                )";
                break;
        }

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
    }
}

// Exécution si le script est appelé directement
if (basename(__FILE__) == basename($_SERVER["SCRIPT_NAME"])) {
    $migration = new CreateAnimauxTables();
    $migration->up();
}
?>
