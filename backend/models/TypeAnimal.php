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
class TypeAnimal {
    private $conn;
    private $database;
    private $table_name = "types_animaux";

    public $id;
    public $nom;
    public $description;
    public $created_at;

    public function __construct($db, $database) {
        $this->conn = $db;
        $this->database = $database;
    }

    // Lire tous les types d'animaux
    public function getAll() {
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY nom ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Lire un type d'animal par ID
    public function getById($id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Créer un nouveau type d'animal
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " (nom, description)
                  VALUES (:nom, :description)";

        $stmt = $this->conn->prepare($query);

        // Nettoyer les données
        $this->nom = htmlspecialchars(strip_tags($this->nom));
        $this->description = htmlspecialchars(strip_tags($this->description));

        // Lier les valeurs
        $stmt->bindParam(':nom', $this->nom);
        $stmt->bindParam(':description', $this->description);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    // Mettre à jour un type d'animal
    public function update() {
        $query = "UPDATE " . $this->table_name . "
                  SET nom = :nom, description = :description
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        // Nettoyer les données
        $this->nom = htmlspecialchars(strip_tags($this->nom));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->id = htmlspecialchars(strip_tags($this->id));

        // Lier les valeurs
        $stmt->bindParam(':nom', $this->nom);
        $stmt->bindParam(':description', $this->description);
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }

    // Supprimer un type d'animal
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);

        $this->id = htmlspecialchars(strip_tags($this->id));
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }

    // Vérifier si le nom existe déjà
    public function nomExists() {
        $query = "SELECT id FROM " . $this->table_name . " WHERE nom = :nom";

        if (isset($this->id)) {
            $query .= " AND id != :id";
        }

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':nom', $this->nom);

        if (isset($this->id)) {
            $stmt->bindParam(':id', $this->id);
        }

        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    // Obtenir les races associées à ce type
    public function getRaces() {
        $query = "SELECT * FROM races WHERE type_animal_id = :type_animal_id ORDER BY nom ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':type_animal_id', $this->id);
        $stmt->execute();
        return $stmt;
    }
}
?>
