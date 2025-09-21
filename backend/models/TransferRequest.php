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

class TransferRequest {
    private $conn;
    private $table_name = "transfer_requests";

    public $id;
    public $animal_id;
    public $from_elevage_id;
    public $to_elevage_id;
    public $requested_by;
    public $status; // 'pending', 'approved', 'rejected'
    public $message;
    public $created_at;
    public $updated_at;
    public $processed_by;
    public $response_message;

    public function __construct($db, $database = null) {
        $this->conn = $db;

        // Créer la table si elle n'existe pas
        $this->createTable();
    }

    private function createTable() {
        $query = "CREATE TABLE IF NOT EXISTS " . $this->table_name . " (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            animal_id INTEGER NOT NULL,
            from_elevage_id INTEGER,
            to_elevage_id INTEGER NOT NULL,
            requested_by INTEGER NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            processed_by INTEGER,
            response_message TEXT,
            FOREIGN KEY (animal_id) REFERENCES animaux(id),
            FOREIGN KEY (from_elevage_id) REFERENCES elevages(id),
            FOREIGN KEY (to_elevage_id) REFERENCES elevages(id),
            FOREIGN KEY (requested_by) REFERENCES users(id),
            FOREIGN KEY (processed_by) REFERENCES users(id)
        )";

        $this->conn->exec($query);
    }

    // Créer une demande de transfert
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  (animal_id, from_elevage_id, to_elevage_id, requested_by, message)
                  VALUES (:animal_id, :from_elevage_id, :to_elevage_id, :requested_by, :message)";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(':animal_id', $this->animal_id);
        $stmt->bindParam(':from_elevage_id', $this->from_elevage_id);
        $stmt->bindParam(':to_elevage_id', $this->to_elevage_id);
        $stmt->bindParam(':requested_by', $this->requested_by);
        $stmt->bindParam(':message', $this->message);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    // Obtenir toutes les demandes pour un utilisateur
    public function getByUser($user_id, $user_role) {
        if ($user_role == 1) {
            // Admin : voir toutes les demandes
            $query = "SELECT tr.*,
                            a.identifiant_officiel, a.nom as animal_nom,
                            e1.nom as from_elevage_nom,
                            e2.nom as to_elevage_nom,
                            u1.name as requested_by_name,
                            u2.name as processed_by_name
                      FROM " . $this->table_name . " tr
                      LEFT JOIN animaux a ON tr.animal_id = a.id
                      LEFT JOIN elevages e1 ON tr.from_elevage_id = e1.id
                      LEFT JOIN elevages e2 ON tr.to_elevage_id = e2.id
                      LEFT JOIN users u1 ON tr.requested_by = u1.id
                      LEFT JOIN users u2 ON tr.processed_by = u2.id
                      ORDER BY tr.created_at DESC";
            $stmt = $this->conn->prepare($query);
        } else {
            // Modérateur : voir les demandes concernant ses élevages
            $query = "SELECT tr.*,
                            a.identifiant_officiel, a.nom as animal_nom,
                            e1.nom as from_elevage_nom,
                            e2.nom as to_elevage_nom,
                            u1.name as requested_by_name,
                            u2.name as processed_by_name
                      FROM " . $this->table_name . " tr
                      LEFT JOIN animaux a ON tr.animal_id = a.id
                      LEFT JOIN elevages e1 ON tr.from_elevage_id = e1.id
                      LEFT JOIN elevages e2 ON tr.to_elevage_id = e2.id
                      LEFT JOIN users u1 ON tr.requested_by = u1.id
                      LEFT JOIN users u2 ON tr.processed_by = u2.id
                      WHERE e1.user_id = :user_id OR e2.user_id = :user_id OR tr.requested_by = :user_id
                      ORDER BY tr.created_at DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
        }

        $stmt->execute();
        return $stmt;
    }

    // Traiter une demande (approuver/rejeter)
    public function process($request_id, $status, $response_message, $processed_by) {
        $query = "UPDATE " . $this->table_name . "
                  SET status = :status, response_message = :response_message,
                      processed_by = :processed_by, updated_at = CURRENT_TIMESTAMP
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(':id', $request_id);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':response_message', $response_message);
        $stmt->bindParam(':processed_by', $processed_by);

        return $stmt->execute();
    }

    // Obtenir une demande par ID
    public function getById($id) {
        $query = "SELECT tr.*,
                        a.identifiant_officiel, a.nom as animal_nom,
                        e1.nom as from_elevage_nom,
                        e2.nom as to_elevage_nom,
                        u1.name as requested_by_name
                  FROM " . $this->table_name . " tr
                  LEFT JOIN animaux a ON tr.animal_id = a.id
                  LEFT JOIN elevages e1 ON tr.from_elevage_id = e1.id
                  LEFT JOIN elevages e2 ON tr.to_elevage_id = e2.id
                  LEFT JOIN users u1 ON tr.requested_by = u1.id
                  WHERE tr.id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Vérifier si une demande similaire existe déjà
    public function similarRequestExists($animal_id, $to_elevage_id) {
        $query = "SELECT COUNT(*) as count FROM " . $this->table_name . "
                  WHERE animal_id = :animal_id AND to_elevage_id = :to_elevage_id
                  AND status = 'pending'";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':animal_id', $animal_id);
        $stmt->bindParam(':to_elevage_id', $to_elevage_id);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['count'] > 0;
    }
}
?>