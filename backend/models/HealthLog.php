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

class HealthLog {
    private $conn;
    private $table_name = "health_log";

    public $id;
    public $animal_id;
    public $user_id;
    public $event_type;
    public $title;
    public $description;
    public $severity;
    public $event_date;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Récupère tous les événements de santé pour un animal
     */
    public function getByAnimalId($animal_id, $limit = 50, $offset = 0) {
        $query = "SELECT hl.*, u.name as username, u.name as nom, '' as prenom
                  FROM " . $this->table_name . " hl
                  LEFT JOIN users u ON hl.user_id = u.id
                  WHERE hl.animal_id = :animal_id
                  ORDER BY hl.event_date DESC, hl.created_at DESC
                  LIMIT :limit OFFSET :offset";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':animal_id', $animal_id, PDO::PARAM_INT);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Compte le nombre total d'événements pour un animal
     */
    public function countByAnimalId($animal_id) {
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name . " WHERE animal_id = :animal_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':animal_id', $animal_id, PDO::PARAM_INT);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['total'];
    }

    /**
     * Crée un nouvel événement de santé
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  (animal_id, user_id, event_type, title, description, severity, event_date)
                  VALUES (:animal_id, :user_id, :event_type, :title, :description, :severity, :event_date)";

        $stmt = $this->conn->prepare($query);

        // Nettoyer les données
        $this->animal_id = htmlspecialchars(strip_tags($this->animal_id));
        $this->user_id = htmlspecialchars(strip_tags($this->user_id));
        $this->event_type = htmlspecialchars(strip_tags($this->event_type));
        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->severity = htmlspecialchars(strip_tags($this->severity));
        $this->event_date = htmlspecialchars(strip_tags($this->event_date));

        // Validation de la sévérité
        if (!in_array($this->severity, ['info', 'warning', 'critical'])) {
            $this->severity = 'info';
        }

        // Lier les paramètres
        $stmt->bindParam(':animal_id', $this->animal_id);
        $stmt->bindParam(':user_id', $this->user_id);
        $stmt->bindParam(':event_type', $this->event_type);
        $stmt->bindParam(':title', $this->title);
        $stmt->bindParam(':description', $this->description);
        $stmt->bindParam(':severity', $this->severity);
        $stmt->bindParam(':event_date', $this->event_date);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    /**
     * Récupère un événement par son ID
     */
    public function getById($id) {
        $query = "SELECT hl.*, u.name as username, u.name as nom, '' as prenom
                  FROM " . $this->table_name . " hl
                  LEFT JOIN users u ON hl.user_id = u.id
                  WHERE hl.id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Met à jour un événement de santé
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . "
                  SET event_type = :event_type,
                      title = :title,
                      description = :description,
                      severity = :severity,
                      event_date = :event_date,
                      updated_at = CURRENT_TIMESTAMP
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        // Nettoyer les données
        $this->event_type = htmlspecialchars(strip_tags($this->event_type));
        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->severity = htmlspecialchars(strip_tags($this->severity));
        $this->event_date = htmlspecialchars(strip_tags($this->event_date));
        $this->id = htmlspecialchars(strip_tags($this->id));

        // Validation de la sévérité
        if (!in_array($this->severity, ['info', 'warning', 'critical'])) {
            $this->severity = 'info';
        }

        // Lier les paramètres
        $stmt->bindParam(':event_type', $this->event_type);
        $stmt->bindParam(':title', $this->title);
        $stmt->bindParam(':description', $this->description);
        $stmt->bindParam(':severity', $this->severity);
        $stmt->bindParam(':event_date', $this->event_date);
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }

    /**
     * Supprime un événement de santé
     */
    public function delete($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * Récupère les types d'événements les plus utilisés
     */
    public function getEventTypes($limit = 10) {
        $query = "SELECT event_type, COUNT(*) as count
                  FROM " . $this->table_name . "
                  GROUP BY event_type
                  ORDER BY count DESC
                  LIMIT :limit";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Récupère les événements récents pour un élevage
     */
    public function getRecentByElevage($elevage_id, $limit = 20) {
        $query = "SELECT hl.*, u.name as username, u.name as nom, '' as prenom, a.nom as animal_nom, a.identifiant_officiel
                  FROM " . $this->table_name . " hl
                  LEFT JOIN users u ON hl.user_id = u.id
                  LEFT JOIN animaux a ON hl.animal_id = a.id
                  WHERE a.elevage_id = :elevage_id
                  ORDER BY hl.event_date DESC, hl.created_at DESC
                  LIMIT :limit";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':elevage_id', $elevage_id, PDO::PARAM_INT);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>