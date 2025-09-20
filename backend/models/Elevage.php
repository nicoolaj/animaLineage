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
class Elevage {
    private $conn;
    private $database;
    private $table_name = "elevages";

    public $id;
    public $nom;
    public $adresse;
    public $user_id;
    public $telephone;
    public $email;
    public $description;
    public $created_at;

    public function __construct($db, $database) {
        $this->conn = $db;
        $this->database = $database;
    }

    // Lire tous les élevages
    public function getAll() {
        $query = "SELECT e.*, u.name as proprietaire_nom
                  FROM " . $this->table_name . " e
                  LEFT JOIN users u ON e.user_id = u.id
                  ORDER BY e.nom ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Lire les élevages d'un utilisateur
    public function getByUserId($user_id) {
        $query = "SELECT e.*, u.name as proprietaire_nom
                  FROM " . $this->table_name . " e
                  LEFT JOIN users u ON e.user_id = u.id
                  WHERE e.user_id = :user_id
                  ORDER BY e.nom ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
        return $stmt;
    }

    // Lire un élevage par ID
    public function getById($id) {
        $query = "SELECT e.*, u.name as proprietaire_nom
                  FROM " . $this->table_name . " e
                  LEFT JOIN users u ON e.user_id = u.id
                  WHERE e.id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Créer un nouvel élevage
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " (nom, adresse, user_id, description)
                  VALUES (:nom, :adresse, :user_id, :description)";

        $stmt = $this->conn->prepare($query);

        // Nettoyer les données
        $this->nom = htmlspecialchars(strip_tags($this->nom));
        $this->adresse = htmlspecialchars(strip_tags($this->adresse));
        $this->user_id = htmlspecialchars(strip_tags($this->user_id));
        $this->description = htmlspecialchars(strip_tags($this->description));

        // Lier les valeurs
        $stmt->bindParam(':nom', $this->nom);
        $stmt->bindParam(':adresse', $this->adresse);
        $stmt->bindParam(':user_id', $this->user_id);
        $stmt->bindParam(':description', $this->description);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    // Mettre à jour un élevage
    public function update() {
        $query = "UPDATE " . $this->table_name . "
                  SET nom = :nom, adresse = :adresse, user_id = :user_id, description = :description
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        // Nettoyer les données
        $this->nom = htmlspecialchars(strip_tags($this->nom));
        $this->adresse = htmlspecialchars(strip_tags($this->adresse));
        $this->user_id = htmlspecialchars(strip_tags($this->user_id));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->id = htmlspecialchars(strip_tags($this->id));

        // Lier les valeurs
        $stmt->bindParam(':nom', $this->nom);
        $stmt->bindParam(':adresse', $this->adresse);
        $stmt->bindParam(':user_id', $this->user_id);
        $stmt->bindParam(':description', $this->description);
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }

    // Supprimer un élevage
    public function delete() {
        // Supprimer d'abord les associations de types
        $query1 = "DELETE FROM elevage_types WHERE elevage_id = :id";
        $stmt1 = $this->conn->prepare($query1);
        $stmt1->bindParam(':id', $this->id);
        $stmt1->execute();

        // Supprimer l'élevage
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);

        $this->id = htmlspecialchars(strip_tags($this->id));
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }

    // Vérifier si l'utilisateur peut modifier cet élevage
    public function canEdit($user_id, $user_role) {
        // Les admins peuvent tout modifier
        if ($user_role == 1) {
            return true;
        }

        // Les propriétaires peuvent modifier leurs élevages
        $elevage = $this->getById($this->id);
        return $elevage && $elevage['user_id'] == $user_id;
    }

    // Associer des races à l'élevage
    public function setRaces($races_ids) {
        // Supprimer les associations existantes
        $query = "DELETE FROM elevage_races WHERE elevage_id = :elevage_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':elevage_id', $this->id);
        $stmt->execute();

        // Ajouter les nouvelles associations
        if (!empty($races_ids)) {
            $query = "INSERT INTO elevage_races (elevage_id, race_id) VALUES (:elevage_id, :race_id)";
            $stmt = $this->conn->prepare($query);

            foreach ($races_ids as $race_id) {
                $stmt->bindParam(':elevage_id', $this->id);
                $stmt->bindParam(':race_id', $race_id);
                $stmt->execute();
            }
        }

        return true;
    }

    // Obtenir les races associées à l'élevage
    public function getRaces() {
        $query = "SELECT r.*, ta.nom as type_animal_nom, er.created_at as association_date
                  FROM races r
                  INNER JOIN elevage_races er ON r.id = er.race_id
                  LEFT JOIN types_animaux ta ON r.type_animal_id = ta.id
                  WHERE er.elevage_id = :elevage_id
                  ORDER BY ta.nom ASC, r.nom ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':elevage_id', $this->id);
        $stmt->execute();
        return $stmt;
    }

    // Obtenir les statistiques d'un élevage
    public function getStats() {
        $stats = [
            'nb_types_animaux' => 0,
            'types_liste' => []
        ];

        $query = "SELECT COUNT(*) as count FROM elevage_types WHERE elevage_id = :elevage_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':elevage_id', $this->id);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['nb_types_animaux'] = $result['count'];

        $typesStmt = $this->getTypes();
        while ($row = $typesStmt->fetch(PDO::FETCH_ASSOC)) {
            $stats['types_liste'][] = $row['nom'];
        }

        return $stats;
    }
}
?>
