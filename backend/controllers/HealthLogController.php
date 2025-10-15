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

require_once 'models/HealthLog.php';

class HealthLogController {
    private $db;
    private $healthLog;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->healthLog = new HealthLog($this->db);
    }

    /**
     * Récupère les événements de santé pour un animal
     */
    public function getHealthLog($animal_id, $user_id, $user_role) {
        try {
            // Vérifier les permissions de lecture
            if (!$this->canViewHealthLog($animal_id, $user_id, $user_role)) {
                http_response_code(403);
                echo json_encode(['message' => 'Accès non autorisé']);
                return;
            }

            $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
            $limit = isset($_GET['limit']) ? min(100, max(1, intval($_GET['limit']))) : 20;
            $offset = ($page - 1) * $limit;

            $events = $this->healthLog->getByAnimalId($animal_id, $limit, $offset);
            $total = $this->healthLog->countByAnimalId($animal_id);

            // Formater les événements
            $formattedEvents = array_map(function($event) {
                return [
                    'id' => intval($event['id']),
                    'event_type' => $event['event_type'],
                    'title' => $event['title'],
                    'description' => $event['description'],
                    'severity' => $event['severity'],
                    'event_date' => $event['event_date'],
                    'created_at' => $event['created_at'],
                    'updated_at' => $event['updated_at'],
                    'author' => [
                        'id' => intval($event['user_id']),
                        'username' => $event['username'],
                        'nom' => $event['nom'],
                        'prenom' => $event['prenom']
                    ]
                ];
            }, $events);

            echo json_encode([
                'events' => $formattedEvents,
                'pagination' => [
                    'current_page' => $page,
                    'total_pages' => ceil($total / $limit),
                    'total_items' => intval($total),
                    'items_per_page' => $limit
                ]
            ]);

        } catch (Exception $e) {
            error_log("Erreur lors de la récupération du logbook: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['message' => 'Erreur interne du serveur']);
        }
    }

    /**
     * Crée un nouvel événement de santé
     */
    public function createHealthEvent($animal_id, $user_id, $user_role) {
        try {
            // Vérifier les permissions d'écriture (Admin ou Modérateur uniquement)
            if (!$this->canWriteHealthLog($animal_id, $user_id, $user_role)) {
                http_response_code(403);
                echo json_encode(['message' => 'Seuls les administrateurs et modérateurs peuvent créer des événements de santé']);
                return;
            }

            $data = json_decode(file_get_contents("php://input"), true);

            // Validation des données
            if (empty($data['event_type']) || empty($data['title']) || empty($data['event_date'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Les champs event_type, title et event_date sont requis']);
                return;
            }

            // Valider la date
            $eventDate = DateTime::createFromFormat('Y-m-d', $data['event_date']);
            if (!$eventDate) {
                http_response_code(400);
                echo json_encode(['message' => 'Format de date invalide (YYYY-MM-DD attendu)']);
                return;
            }

            // Créer l'événement
            $this->healthLog->animal_id = $animal_id;
            $this->healthLog->user_id = $user_id;
            $this->healthLog->event_type = $data['event_type'];
            $this->healthLog->title = $data['title'];
            $this->healthLog->description = $data['description'] ?? '';
            $this->healthLog->severity = $data['severity'] ?? 'info';
            $this->healthLog->event_date = $data['event_date'];

            if ($this->healthLog->create()) {
                // Récupérer l'événement créé avec les infos de l'auteur
                $createdEvent = $this->healthLog->getById($this->healthLog->id);

                echo json_encode([
                    'message' => 'Événement de santé créé avec succès',
                    'event' => [
                        'id' => intval($createdEvent['id']),
                        'event_type' => $createdEvent['event_type'],
                        'title' => $createdEvent['title'],
                        'description' => $createdEvent['description'],
                        'severity' => $createdEvent['severity'],
                        'event_date' => $createdEvent['event_date'],
                        'created_at' => $createdEvent['created_at'],
                        'author' => [
                            'id' => intval($createdEvent['user_id']),
                            'username' => $createdEvent['username'],
                            'nom' => $createdEvent['nom'],
                            'prenom' => $createdEvent['prenom']
                        ]
                    ]
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['message' => 'Erreur lors de la création de l\'événement']);
            }

        } catch (Exception $e) {
            error_log("Erreur lors de la création d'un événement de santé: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['message' => 'Erreur interne du serveur']);
        }
    }

    /**
     * Met à jour un événement de santé
     */
    public function updateHealthEvent($event_id, $user_id, $user_role) {
        try {
            // Récupérer l'événement existant
            $existingEvent = $this->healthLog->getById($event_id);
            if (!$existingEvent) {
                http_response_code(404);
                echo json_encode(['message' => 'Événement non trouvé']);
                return;
            }

            // Vérifier les permissions (Admin/Modérateur et accès à l'animal)
            if (!$this->canWriteHealthLog($existingEvent['animal_id'], $user_id, $user_role)) {
                http_response_code(403);
                echo json_encode(['message' => 'Accès non autorisé']);
                return;
            }

            $data = json_decode(file_get_contents("php://input"), true);

            // Validation des données
            if (empty($data['event_type']) || empty($data['title']) || empty($data['event_date'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Les champs event_type, title et event_date sont requis']);
                return;
            }

            // Valider la date
            $eventDate = DateTime::createFromFormat('Y-m-d', $data['event_date']);
            if (!$eventDate) {
                http_response_code(400);
                echo json_encode(['message' => 'Format de date invalide (YYYY-MM-DD attendu)']);
                return;
            }

            // Mettre à jour l'événement
            $this->healthLog->id = $event_id;
            $this->healthLog->event_type = $data['event_type'];
            $this->healthLog->title = $data['title'];
            $this->healthLog->description = $data['description'] ?? '';
            $this->healthLog->severity = $data['severity'] ?? 'info';
            $this->healthLog->event_date = $data['event_date'];

            if ($this->healthLog->update()) {
                // Récupérer l'événement mis à jour
                $updatedEvent = $this->healthLog->getById($event_id);

                echo json_encode([
                    'message' => 'Événement mis à jour avec succès',
                    'event' => [
                        'id' => intval($updatedEvent['id']),
                        'event_type' => $updatedEvent['event_type'],
                        'title' => $updatedEvent['title'],
                        'description' => $updatedEvent['description'],
                        'severity' => $updatedEvent['severity'],
                        'event_date' => $updatedEvent['event_date'],
                        'created_at' => $updatedEvent['created_at'],
                        'updated_at' => $updatedEvent['updated_at'],
                        'author' => [
                            'id' => intval($updatedEvent['user_id']),
                            'username' => $updatedEvent['username'],
                            'nom' => $updatedEvent['nom'],
                            'prenom' => $updatedEvent['prenom']
                        ]
                    ]
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['message' => 'Erreur lors de la mise à jour']);
            }

        } catch (Exception $e) {
            error_log("Erreur lors de la mise à jour d'un événement de santé: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['message' => 'Erreur interne du serveur']);
        }
    }

    /**
     * Supprime un événement de santé
     */
    public function deleteHealthEvent($event_id, $user_id, $user_role) {
        try {
            // Récupérer l'événement existant
            $existingEvent = $this->healthLog->getById($event_id);
            if (!$existingEvent) {
                http_response_code(404);
                echo json_encode(['message' => 'Événement non trouvé']);
                return;
            }

            // Vérifier les permissions (Admin/Modérateur et accès à l'animal)
            if (!$this->canWriteHealthLog($existingEvent['animal_id'], $user_id, $user_role)) {
                http_response_code(403);
                echo json_encode(['message' => 'Accès non autorisé']);
                return;
            }

            if ($this->healthLog->delete($event_id)) {
                echo json_encode(['message' => 'Événement supprimé avec succès']);
            } else {
                http_response_code(500);
                echo json_encode(['message' => 'Erreur lors de la suppression']);
            }

        } catch (Exception $e) {
            error_log("Erreur lors de la suppression d'un événement de santé: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['message' => 'Erreur interne du serveur']);
        }
    }

    /**
     * Récupère les types d'événements les plus utilisés
     */
    public function getEventTypes() {
        try {
            $types = $this->healthLog->getEventTypes();
            echo json_encode(['event_types' => $types]);
        } catch (Exception $e) {
            error_log("Erreur lors de la récupération des types d'événements: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['message' => 'Erreur interne du serveur']);
        }
    }

    /**
     * Vérifie si l'utilisateur peut lire le logbook de santé
     */
    private function canViewHealthLog($animal_id, $user_id, $user_role) {
        // Admin et modérateur peuvent tout voir
        if ($user_role == 1 || $user_role == 2) {
            return true;
        }

        // Pour les autres utilisateurs, vérifier l'accès à l'animal via une requête directe
        return $this->checkAnimalAccess($animal_id, $user_id, $user_role);
    }

    /**
     * Vérifie si l'utilisateur peut écrire dans le logbook de santé
     */
    private function canWriteHealthLog($animal_id, $user_id, $user_role) {
        // Seuls Admin et Modérateur peuvent écrire
        if ($user_role != 1 && $user_role != 2) {
            return false;
        }

        // Vérifier aussi l'accès à l'animal
        return $this->checkAnimalAccess($animal_id, $user_id, $user_role);
    }

    /**
     * Vérifie l'accès à un animal via une requête directe
     */
    private function checkAnimalAccess($animal_id, $user_id, $user_role) {
        // Admin peut tout voir
        if ($user_role == 1) {
            return true;
        }

        try {
            $query = "SELECT a.elevage_id
                      FROM animaux a
                      LEFT JOIN elevages e ON a.elevage_id = e.id
                      LEFT JOIN elevage_members em ON e.id = em.elevage_id
                      WHERE a.id = :animal_id
                      AND (e.user_id = :user_id OR em.user_id = :user_id)";

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':animal_id', $animal_id, PDO::PARAM_INT);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            error_log("Erreur lors de la vérification d'accès à l'animal: " . $e->getMessage());
            return false;
        }
    }
}
?>