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
require_once __DIR__ . '/../models/TransferRequest.php';
require_once __DIR__ . '/../models/Animal.php';
require_once __DIR__ . '/../models/Elevage.php';

class TransferRequestController {
    private $conn;
    private $database;
    private $transferRequest;
    private $animal;
    private $elevage;

    public function __construct($db, $database) {
        $this->conn = $db;
        $this->database = $database;
        $this->transferRequest = new TransferRequest($db, $database);
        $this->animal = new Animal($db, $database);
        $this->elevage = new Elevage($db, $database);
    }

    // Créer une demande de transfert
    public function createTransferRequest($data, $user_id, $user_role) {
        try {
            // Validation des données
            if (!isset($data['animal_id']) || !isset($data['to_elevage_id'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Animal ID et élevage de destination requis']);
                return;
            }

            // Vérifier que l'animal existe
            $animal_data = $this->animal->getById($data['animal_id']);
            if (!$animal_data) {
                http_response_code(404);
                echo json_encode(['message' => 'Animal non trouvé']);
                return;
            }

            // Vérifier que l'élevage de destination existe
            $elevage_data = $this->elevage->getById($data['to_elevage_id']);
            if (!$elevage_data) {
                http_response_code(404);
                echo json_encode(['message' => 'Élevage de destination non trouvé']);
                return;
            }

            // Vérifier qu'il n'y a pas déjà une demande en attente
            if ($this->transferRequest->similarRequestExists($data['animal_id'], $data['to_elevage_id'])) {
                http_response_code(409);
                echo json_encode(['message' => 'Une demande de transfert similaire est déjà en attente']);
                return;
            }

            // Créer la demande
            $this->transferRequest->animal_id = $data['animal_id'];
            $this->transferRequest->from_elevage_id = $animal_data['elevage_id'];
            $this->transferRequest->to_elevage_id = $data['to_elevage_id'];
            $this->transferRequest->requested_by = $user_id;
            $this->transferRequest->message = $data['message'] ?? '';

            if ($this->transferRequest->create()) {
                http_response_code(201);
                echo json_encode([
                    'message' => 'Demande de transfert créée avec succès',
                    'request_id' => $this->transferRequest->id
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['message' => 'Erreur lors de la création de la demande']);
            }

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Erreur serveur: ' . $e->getMessage()]);
        }
    }

    // Obtenir toutes les demandes de transfert
    public function getTransferRequests($user_id, $user_role) {
        try {
            $stmt = $this->transferRequest->getByUser($user_id, $user_role);
            $requests = [];

            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $requests[] = $row;
            }

            echo json_encode($requests);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Erreur serveur: ' . $e->getMessage()]);
        }
    }

    // Traiter une demande de transfert (approuver/rejeter)
    public function processTransferRequest($request_id, $data, $user_id, $user_role) {
        try {
            // Validation des données
            if (!isset($data['status']) || !in_array($data['status'], ['approved', 'rejected'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Statut invalide (approved ou rejected requis)']);
                return;
            }

            // Obtenir la demande
            $request_data = $this->transferRequest->getById($request_id);
            if (!$request_data) {
                http_response_code(404);
                echo json_encode(['message' => 'Demande de transfert non trouvée']);
                return;
            }

            // Vérifier les permissions
            if ($user_role != 1) { // Pas admin
                // Vérifier que l'utilisateur est propriétaire de l'élevage source ou destination
                $from_elevage = $this->elevage->getById($request_data['from_elevage_id']);
                $to_elevage = $this->elevage->getById($request_data['to_elevage_id']);

                if ((!$from_elevage || $from_elevage['user_id'] != $user_id) &&
                    (!$to_elevage || $to_elevage['user_id'] != $user_id)) {
                    http_response_code(403);
                    echo json_encode(['message' => 'Accès non autorisé']);
                    return;
                }
            }

            // Traiter la demande
            $response_message = $data['response_message'] ?? '';
            if ($this->transferRequest->process($request_id, $data['status'], $response_message, $user_id)) {

                // Si approuvé, effectuer le transfert
                if ($data['status'] === 'approved') {
                    $this->animal->id = $request_data['animal_id'];
                    $this->animal->elevage_id = $request_data['to_elevage_id'];
                    $this->animal->update();
                }

                http_response_code(200);
                echo json_encode(['message' => 'Demande traitée avec succès']);
            } else {
                http_response_code(500);
                echo json_encode(['message' => 'Erreur lors du traitement de la demande']);
            }

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Erreur serveur: ' . $e->getMessage()]);
        }
    }
}
?>