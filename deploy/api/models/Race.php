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
class Race {
    private $conn;
    private $database;
    private $table_name = "races";

    public $id;
    public $nom;
    public $type_animal_id;
    public $description;
    public $created_at;

    public function __construct($db, $database) {
        $this->conn = $db;
        $this->database = $database;
    }

    // Lire toutes les races
    public function getAll() {
        $query = "SELECT r.*, ta.nom as type_animal_nom
                  FROM " . $this->table_name . " r
                  LEFT JOIN types_animaux ta ON r.type_animal_id = ta.id
                  ORDER BY ta.nom ASC, r.nom ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Lire les races par type d'animal
    public function getByType($type_animal_id) {
        $query = "SELECT * FROM " . $this->table_name . "
                  WHERE type_animal_id = :type_animal_id
                  ORDER BY nom ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':type_animal_id', $type_animal_id);
        $stmt->execute();
        return $stmt;
    }

    // Lire une race par ID
    public function getById($id) {
        $query = "SELECT r.*, ta.nom as type_animal_nom
                  FROM " . $this->table_name . " r
                  LEFT JOIN types_animaux ta ON r.type_animal_id = ta.id
                  WHERE r.id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Créer une nouvelle race
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " (nom, type_animal_id, description)
                  VALUES (:nom, :type_animal_id, :description)";

        $stmt = $this->conn->prepare($query);

        // Nettoyer les données
        $this->nom = htmlspecialchars(strip_tags($this->nom));
        $this->type_animal_id = htmlspecialchars(strip_tags($this->type_animal_id));
        $this->description = htmlspecialchars(strip_tags($this->description));

        // Lier les valeurs
        $stmt->bindParam(':nom', $this->nom);
        $stmt->bindParam(':type_animal_id', $this->type_animal_id);
        $stmt->bindParam(':description', $this->description);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    // Mettre à jour une race
    public function update() {
        $query = "UPDATE " . $this->table_name . "
                  SET nom = :nom, type_animal_id = :type_animal_id, description = :description
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        // Nettoyer les données
        $this->nom = htmlspecialchars(strip_tags($this->nom));
        $this->type_animal_id = htmlspecialchars(strip_tags($this->type_animal_id));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->id = htmlspecialchars(strip_tags($this->id));

        // Lier les valeurs
        $stmt->bindParam(':nom', $this->nom);
        $stmt->bindParam(':type_animal_id', $this->type_animal_id);
        $stmt->bindParam(':description', $this->description);
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }

    // Supprimer une race
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);

        $this->id = htmlspecialchars(strip_tags($this->id));
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }

    // Vérifier si le nom existe déjà pour ce type d'animal
    public function nomExists() {
        $query = "SELECT id FROM " . $this->table_name . "
                  WHERE nom = :nom AND type_animal_id = :type_animal_id";

        if (isset($this->id)) {
            $query .= " AND id != :id";
        }

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':nom', $this->nom);
        $stmt->bindParam(':type_animal_id', $this->type_animal_id);

        if (isset($this->id)) {
            $stmt->bindParam(':id', $this->id);
        }

        $stmt->execute();
        return $stmt->rowCount() > 0;
    }
}
?>
