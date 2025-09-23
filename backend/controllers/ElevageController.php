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
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../models/Elevage.php';
require_once __DIR__ . '/../models/TypeAnimal.php';
require_once __DIR__ . '/../models/Race.php';

class ElevageController {
    private $elevage;
    private $typeAnimal;
    private $race;
    private $authMiddleware;
    private $database;
    private $db;

    public function __construct($database) {
        $this->database = $database;
        $this->db = $database->getConnection();
        $this->elevage = new Elevage($this->db, $database);
        $this->typeAnimal = new TypeAnimal($this->db, $database);
        $this->race = new Race($this->db, $database);
        $this->authMiddleware = new AuthMiddleware($database);
    }

    // ========== ÉLEVAGES ==========

    // Lister tous les élevages (admin) ou les élevages de l'utilisateur (autres)
    public function getAllElevages() {
        if (!$this->authMiddleware->requireAuth()) {
            return;
        }

        $currentUser = $this->authMiddleware->getCurrentUser();

        try {
            // Admin : voir tous les élevages
            if ($currentUser['role'] == 1) {
                $stmt = $this->elevage->getAll();
            } else {
                // Autres utilisateurs : voir seulement leurs élevages (propriétaire + collaborateur)
                $stmt = $this->getElevagesForUser($currentUser['id']);
            }

            $elevages = array();

            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                // Récupérer les races pour chaque élevage
                $this->elevage->id = $row['id'];
                $racesStmt = $this->elevage->getRaces();
                $races = array();
                while ($race = $racesStmt->fetch(PDO::FETCH_ASSOC)) {
                    $races[] = $race;
                }

                $elevage_item = array(
                    "id" => $row['id'],
                    "nom" => $row['nom'],
                    "adresse" => $row['adresse'],
                    "user_id" => $row['user_id'],
                    "proprietaire_nom" => $row['proprietaire_nom'],
                    "description" => $row['description'],
                    "created_at" => $row['created_at'],
                    "races" => $races
                );
                array_push($elevages, $elevage_item);
            }

            http_response_code(200);
            echo json_encode($elevages);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(array("message" => "Erreur lors de la récupération des élevages.", "error" => $e->getMessage()));
        }
    }

    // Obtenir les élevages pour un utilisateur (propriétaire + collaborateur)
    private function getElevagesForUser($user_id) {
        $query = "SELECT DISTINCT e.*, u.name as proprietaire_nom
                  FROM elevages e
                  LEFT JOIN users u ON e.user_id = u.id
                  WHERE e.user_id = :user_id
                  UNION
                  SELECT DISTINCT e.*, u.name as proprietaire_nom
                  FROM elevages e
                  LEFT JOIN users u ON e.user_id = u.id
                  INNER JOIN elevage_users eu ON e.id = eu.elevage_id
                  WHERE eu.user_id = :user_id2
                  ORDER BY nom ASC";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':user_id2', $user_id);
        $stmt->execute();
        return $stmt;
    }

    // Lister les élevages de l'utilisateur connecté
    public function getMyElevages() {
        if (!$this->authMiddleware->requireAuth()) {
            return;
        }

        $currentUser = $this->authMiddleware->getCurrentUser();

        try {
            $stmt = $this->elevage->getByUserId($currentUser['id']);
            $elevages = array();

            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $this->elevage->id = $row['id'];
                $racesStmt = $this->elevage->getRaces();
                $races = array();
                while ($race = $racesStmt->fetch(PDO::FETCH_ASSOC)) {
                    $races[] = $race;
                }

                $elevage_item = array(
                    "id" => $row['id'],
                    "nom" => $row['nom'],
                    "adresse" => $row['adresse'],
                    "user_id" => $row['user_id'],
                    "proprietaire_nom" => $row['proprietaire_nom'],
                    "description" => $row['description'],
                    "created_at" => $row['created_at'],
                    "races" => $races
                );
                array_push($elevages, $elevage_item);
            }

            http_response_code(200);
            echo json_encode($elevages);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(array("message" => "Erreur lors de la récupération de vos élevages.", "error" => $e->getMessage()));
        }
    }

    // Obtenir un élevage par ID
    public function getElevage($id) {
        if (!$this->authMiddleware->requireAuth()) {
            return;
        }

        try {
            $elevageData = $this->elevage->getById($id);

            if (!$elevageData) {
                http_response_code(404);
                echo json_encode(array("message" => "Élevage non trouvé."));
                return;
            }

            // Récupérer les races
            $this->elevage->id = $id;
            $racesStmt = $this->elevage->getRaces();
            $races = array();
            while ($race = $racesStmt->fetch(PDO::FETCH_ASSOC)) {
                $races[] = $race;
            }

            $elevageData['races'] = $races;

            http_response_code(200);
            echo json_encode($elevageData);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(array("message" => "Erreur lors de la récupération de l'élevage.", "error" => $e->getMessage()));
        }
    }

    // Créer un nouvel élevage
    public function createElevage() {
        if (!$this->authMiddleware->requireAdmin()) {
            return;
        }

        $currentUser = $this->authMiddleware->getCurrentUser();
        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->nom) && !empty($data->adresse) && !empty($data->user_id)) {
            $this->elevage->nom = $data->nom;
            $this->elevage->adresse = $data->adresse;
            $this->elevage->user_id = $data->user_id;
            $this->elevage->description = $data->description ?? '';

            try {
                if ($this->elevage->create()) {
                    // Associer les races si fournies
                    if (!empty($data->races_ids)) {
                        $this->elevage->setRaces($data->races_ids);
                    }

                    http_response_code(201);
                    echo json_encode(array(
                        "message" => "Élevage créé avec succès.",
                        "elevage_id" => $this->elevage->id
                    ));
                } else {
                    http_response_code(500);
                    echo json_encode(array("message" => "Impossible de créer l'élevage."));
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(array("message" => "Erreur lors de la création de l'élevage.", "error" => $e->getMessage()));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Le nom, l'adresse et le propriétaire sont requis."));
        }
    }

    // Mettre à jour un élevage
    public function updateElevage($id) {
        if (!$this->authMiddleware->requireAuth()) {
            return;
        }

        $currentUser = $this->authMiddleware->getCurrentUser();
        $data = json_decode(file_get_contents("php://input"));

        $this->elevage->id = $id;

        // Vérifier les permissions
        if (!$this->elevage->canEdit($currentUser['id'], $currentUser['role'])) {
            http_response_code(403);
            echo json_encode(array("message" => "Vous n'avez pas les permissions pour modifier cet élevage."));
            return;
        }

        if (!empty($data->nom) && !empty($data->adresse) && !empty($data->user_id)) {
            $this->elevage->nom = $data->nom;
            $this->elevage->adresse = $data->adresse;
            $this->elevage->user_id = $data->user_id;
            $this->elevage->description = $data->description ?? '';

            try {
                if ($this->elevage->update()) {
                    // Mettre à jour les races si fournies
                    if (isset($data->races_ids)) {
                        $this->elevage->setRaces($data->races_ids);
                    }

                    http_response_code(200);
                    echo json_encode(array("message" => "Élevage mis à jour avec succès."));
                } else {
                    http_response_code(500);
                    echo json_encode(array("message" => "Impossible de mettre à jour l'élevage."));
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(array("message" => "Erreur lors de la mise à jour de l'élevage.", "error" => $e->getMessage()));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Le nom, l'adresse et le propriétaire sont requis."));
        }
    }

    // Supprimer un élevage
    public function deleteElevage($id) {
        if (!$this->authMiddleware->requireAuth()) {
            return;
        }

        $currentUser = $this->authMiddleware->getCurrentUser();
        $this->elevage->id = $id;

        // Vérifier les permissions
        if (!$this->elevage->canEdit($currentUser['id'], $currentUser['role'])) {
            http_response_code(403);
            echo json_encode(array("message" => "Vous n'avez pas les permissions pour supprimer cet élevage."));
            return;
        }

        try {
            if ($this->elevage->delete()) {
                http_response_code(200);
                echo json_encode(array("message" => "Élevage supprimé avec succès."));
            } else {
                http_response_code(500);
                echo json_encode(array("message" => "Impossible de supprimer l'élevage."));
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(array("message" => "Erreur lors de la suppression de l'élevage.", "error" => $e->getMessage()));
        }
    }

    // ========== TYPES D'ANIMAUX ==========

    // Lister tous les types d'animaux
    public function getTypesAnimaux() {
        if (!$this->authMiddleware->requireAdmin()) {
            return;
        }

        try {
            $stmt = $this->typeAnimal->getAll();
            $types = array();

            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                array_push($types, $row);
            }

            http_response_code(200);
            echo json_encode($types);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(array("message" => "Erreur lors de la récupération des types d'animaux.", "error" => $e->getMessage()));
        }
    }

    // Créer un nouveau type d'animal
    public function createTypeAnimal() {
        if (!$this->authMiddleware->requireAdmin()) {
            return;
        }

        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->nom)) {
            $this->typeAnimal->nom = $data->nom;
            $this->typeAnimal->description = $data->description ?? '';

            // Vérifier si le nom existe déjà
            if ($this->typeAnimal->nomExists()) {
                http_response_code(400);
                echo json_encode(array("message" => "Ce nom de type d'animal existe déjà."));
                return;
            }

            try {
                if ($this->typeAnimal->create()) {
                    http_response_code(201);
                    echo json_encode(array(
                        "message" => "Type d'animal créé avec succès.",
                        "id" => $this->typeAnimal->id
                    ));
                } else {
                    http_response_code(500);
                    echo json_encode(array("message" => "Impossible de créer le type d'animal."));
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(array("message" => "Erreur lors de la création du type d'animal.", "error" => $e->getMessage()));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Le nom est requis."));
        }
    }

    // Mettre à jour un type d'animal
    public function updateTypeAnimal($id) {
        if (!$this->authMiddleware->requireAdmin()) {
            return;
        }

        $data = json_decode(file_get_contents("php://input"));
        $this->typeAnimal->id = $id;

        if (!empty($data->nom)) {
            $this->typeAnimal->nom = $data->nom;
            $this->typeAnimal->description = $data->description ?? '';

            // Vérifier si le nom existe déjà
            if ($this->typeAnimal->nomExists()) {
                http_response_code(400);
                echo json_encode(array("message" => "Ce nom de type d'animal existe déjà."));
                return;
            }

            try {
                if ($this->typeAnimal->update()) {
                    http_response_code(200);
                    echo json_encode(array("message" => "Type d'animal mis à jour avec succès."));
                } else {
                    http_response_code(500);
                    echo json_encode(array("message" => "Impossible de mettre à jour le type d'animal."));
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(array("message" => "Erreur lors de la mise à jour du type d'animal.", "error" => $e->getMessage()));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Le nom est requis."));
        }
    }

    // Supprimer un type d'animal
    public function deleteTypeAnimal($id) {
        if (!$this->authMiddleware->requireAdmin()) {
            return;
        }

        $this->typeAnimal->id = $id;

        try {
            if ($this->typeAnimal->delete()) {
                http_response_code(200);
                echo json_encode(array("message" => "Type d'animal supprimé avec succès."));
            } else {
                http_response_code(500);
                echo json_encode(array("message" => "Impossible de supprimer le type d'animal."));
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(array("message" => "Erreur lors de la suppression du type d'animal.", "error" => $e->getMessage()));
        }
    }

    // ========== RACES ==========

    // Lister toutes les races
    public function getRaces() {
        if (!$this->authMiddleware->requireAdmin()) {
            return;
        }

        try {
            $stmt = $this->race->getAll();
            $races = array();

            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                array_push($races, $row);
            }

            http_response_code(200);
            echo json_encode($races);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(array("message" => "Erreur lors de la récupération des races.", "error" => $e->getMessage()));
        }
    }

    // Lister les races d'un type d'animal
    public function getRacesByType($type_id) {
        if (!$this->authMiddleware->requireAdmin()) {
            return;
        }

        try {
            $stmt = $this->race->getByType($type_id);
            $races = array();

            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                array_push($races, $row);
            }

            http_response_code(200);
            echo json_encode($races);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(array("message" => "Erreur lors de la récupération des races.", "error" => $e->getMessage()));
        }
    }

    // Créer une nouvelle race
    public function createRace() {
        if (!$this->authMiddleware->requireAdmin()) {
            return;
        }

        $data = json_decode(file_get_contents("php://input"));

        // Debug: log des données reçues
        error_log("CreateRace - Data received: " . json_encode($data));

        if (!empty($data->nom) && !empty($data->type_animal_id)) {
            $this->race->nom = $data->nom;
            $this->race->type_animal_id = $data->type_animal_id;
            $this->race->description = $data->description ?? '';

            // Vérifier si le nom existe déjà pour ce type d'animal
            if ($this->race->nomExists()) {
                http_response_code(400);
                echo json_encode(array("message" => "Cette race existe déjà pour ce type d'animal."));
                return;
            }

            try {
                if ($this->race->create()) {
                    http_response_code(201);
                    echo json_encode(array(
                        "message" => "Race créée avec succès.",
                        "id" => $this->race->id
                    ));
                } else {
                    http_response_code(500);
                    echo json_encode(array("message" => "Impossible de créer la race."));
                }
            } catch (Exception $e) {
                error_log("CreateRace - Exception: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(array("message" => "Erreur lors de la création de la race.", "error" => $e->getMessage()));
            }
        } else {
            error_log("CreateRace - Validation failed - nom: " . ($data->nom ?? 'null') . ", type_animal_id: " . ($data->type_animal_id ?? 'null'));
            http_response_code(400);
            echo json_encode(array("message" => "Le nom et le type d'animal sont requis."));
        }
    }

    // Mettre à jour une race
    public function updateRace($id) {
        if (!$this->authMiddleware->requireAdmin()) {
            return;
        }

        $data = json_decode(file_get_contents("php://input"));
        $this->race->id = $id;

        if (!empty($data->nom) && !empty($data->type_animal_id)) {
            $this->race->nom = $data->nom;
            $this->race->type_animal_id = $data->type_animal_id;
            $this->race->description = $data->description ?? '';

            // Vérifier si le nom existe déjà pour ce type d'animal
            if ($this->race->nomExists()) {
                http_response_code(400);
                echo json_encode(array("message" => "Cette race existe déjà pour ce type d'animal."));
                return;
            }

            try {
                if ($this->race->update()) {
                    http_response_code(200);
                    echo json_encode(array("message" => "Race mise à jour avec succès."));
                } else {
                    http_response_code(500);
                    echo json_encode(array("message" => "Impossible de mettre à jour la race."));
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(array("message" => "Erreur lors de la mise à jour de la race.", "error" => $e->getMessage()));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Le nom et le type d'animal sont requis."));
        }
    }

    // Supprimer une race
    public function deleteRace($id) {
        if (!$this->authMiddleware->requireAdmin()) {
            return;
        }

        $this->race->id = $id;

        try {
            if ($this->race->delete()) {
                http_response_code(200);
                echo json_encode(array("message" => "Race supprimée avec succès."));
            } else {
                http_response_code(500);
                echo json_encode(array("message" => "Impossible de supprimer la race."));
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(array("message" => "Erreur lors de la suppression de la race.", "error" => $e->getMessage()));
        }
    }

    // ========== GESTION UTILISATEURS ÉLEVAGE ==========

    // Obtenir la liste des utilisateurs d'un élevage
    public function getElevageUsers($elevage_id) {
        if (!$this->authMiddleware->requireAuth()) {
            return;
        }

        $currentUser = $this->authMiddleware->getCurrentUser();

        try {
            // Vérifier que l'élevage existe
            $elevageData = $this->elevage->getById($elevage_id);
            if (!$elevageData) {
                http_response_code(404);
                echo json_encode(array("message" => "Élevage non trouvé."));
                return;
            }

            // Vérifier les permissions (admin ou propriétaire/modérateur de l'élevage)
            if (!$this->canManageElevageUsers($elevage_id, $currentUser)) {
                http_response_code(403);
                echo json_encode(array("message" => "Accès refusé pour voir les utilisateurs de cet élevage."));
                return;
            }

            // Récupérer les utilisateurs de l'élevage
            $query = "SELECT eu.user_id, eu.role_in_elevage, eu.added_at, u.name as user_name, u.email as user_email
                      FROM elevage_users eu
                      JOIN users u ON eu.user_id = u.id
                      WHERE eu.elevage_id = :elevage_id
                      ORDER BY eu.role_in_elevage = 'owner' DESC, u.name ASC";

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':elevage_id', $elevage_id);
            $stmt->execute();

            $users = array();
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $users[] = $row;
            }

            http_response_code(200);
            echo json_encode($users);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(array("message" => "Erreur lors de la récupération des utilisateurs.", "error" => $e->getMessage()));
        }
    }

    // Ajouter un utilisateur à un élevage
    public function addUserToElevage($elevage_id) {
        if (!$this->authMiddleware->requireAuth()) {
            return;
        }

        $currentUser = $this->authMiddleware->getCurrentUser();
        $data = json_decode(file_get_contents("php://input"));

        try {
            // Vérifier que l'élevage existe
            $elevageData = $this->elevage->getById($elevage_id);
            if (!$elevageData) {
                http_response_code(404);
                echo json_encode(array("message" => "Élevage non trouvé."));
                return;
            }

            // Vérifier les permissions (admin ou propriétaire/modérateur de l'élevage)
            if (!$this->canManageElevageUsers($elevage_id, $currentUser)) {
                http_response_code(403);
                echo json_encode(array("message" => "Accès refusé pour gérer les utilisateurs de cet élevage."));
                return;
            }

            // Valider les données
            if (empty($data->user_id)) {
                http_response_code(400);
                echo json_encode(array("message" => "L'ID utilisateur est requis."));
                return;
            }

            $role_in_elevage = isset($data->role_in_elevage) ? $data->role_in_elevage : 'collaborator';
            if (!in_array($role_in_elevage, ['owner', 'collaborator'])) {
                $role_in_elevage = 'collaborator';
            }

            // Vérifier que l'utilisateur existe et est actif (status = 1)
            $userQuery = "SELECT id, name FROM users WHERE id = :user_id AND status = 1";
            $userStmt = $this->db->prepare($userQuery);
            $userStmt->bindParam(':user_id', $data->user_id);
            $userStmt->execute();
            $userData = $userStmt->fetch(PDO::FETCH_ASSOC);

            if (!$userData) {
                http_response_code(400);
                echo json_encode(array("message" => "Utilisateur non trouvé ou non validé."));
                return;
            }

            // Vérifier que l'utilisateur n'est pas déjà dans l'élevage
            $checkQuery = "SELECT id FROM elevage_users WHERE elevage_id = :elevage_id AND user_id = :user_id";
            $checkStmt = $this->db->prepare($checkQuery);
            $checkStmt->bindParam(':elevage_id', $elevage_id);
            $checkStmt->bindParam(':user_id', $data->user_id);
            $checkStmt->execute();

            if ($checkStmt->fetch()) {
                http_response_code(400);
                echo json_encode(array("message" => "Cet utilisateur est déjà ajouté à l'élevage."));
                return;
            }

            // Ajouter l'utilisateur à l'élevage
            $insertQuery = "INSERT INTO elevage_users (elevage_id, user_id, role_in_elevage, added_by_user_id, added_at)
                           VALUES (:elevage_id, :user_id, :role_in_elevage, :added_by_user_id, datetime('now'))";
            $insertStmt = $this->db->prepare($insertQuery);
            $insertStmt->bindParam(':elevage_id', $elevage_id);
            $insertStmt->bindParam(':user_id', $data->user_id);
            $insertStmt->bindParam(':role_in_elevage', $role_in_elevage);
            $insertStmt->bindParam(':added_by_user_id', $currentUser['id']);

            if ($insertStmt->execute()) {
                http_response_code(201);
                echo json_encode(array(
                    "message" => "Utilisateur ajouté avec succès à l'élevage.",
                    "user_name" => $userData['name']
                ));
            } else {
                http_response_code(500);
                echo json_encode(array("message" => "Impossible d'ajouter l'utilisateur."));
            }

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(array("message" => "Erreur lors de l'ajout de l'utilisateur.", "error" => $e->getMessage()));
        }
    }

    // Retirer un utilisateur d'un élevage
    public function removeUserFromElevage($elevage_id, $user_id) {
        if (!$this->authMiddleware->requireAuth()) {
            return;
        }

        $currentUser = $this->authMiddleware->getCurrentUser();

        try {
            // Vérifier que l'élevage existe
            $elevageData = $this->elevage->getById($elevage_id);
            if (!$elevageData) {
                http_response_code(404);
                echo json_encode(array("message" => "Élevage non trouvé."));
                return;
            }

            // Vérifier les permissions (admin ou propriétaire/modérateur de l'élevage)
            if (!$this->canManageElevageUsers($elevage_id, $currentUser)) {
                http_response_code(403);
                echo json_encode(array("message" => "Accès refusé pour gérer les utilisateurs de cet élevage."));
                return;
            }

            // Vérifier que l'utilisateur est dans l'élevage
            $checkQuery = "SELECT role_in_elevage FROM elevage_users WHERE elevage_id = :elevage_id AND user_id = :user_id";
            $checkStmt = $this->db->prepare($checkQuery);
            $checkStmt->bindParam(':elevage_id', $elevage_id);
            $checkStmt->bindParam(':user_id', $user_id);
            $checkStmt->execute();
            $userElevage = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if (!$userElevage) {
                http_response_code(404);
                echo json_encode(array("message" => "Utilisateur non trouvé dans cet élevage."));
                return;
            }

            // Empêcher la suppression du propriétaire
            if ($userElevage['role_in_elevage'] === 'owner') {
                http_response_code(400);
                echo json_encode(array("message" => "Impossible de retirer le propriétaire de l'élevage."));
                return;
            }

            // Supprimer l'utilisateur de l'élevage
            $deleteQuery = "DELETE FROM elevage_users WHERE elevage_id = :elevage_id AND user_id = :user_id";
            $deleteStmt = $this->db->prepare($deleteQuery);
            $deleteStmt->bindParam(':elevage_id', $elevage_id);
            $deleteStmt->bindParam(':user_id', $user_id);

            if ($deleteStmt->execute()) {
                http_response_code(200);
                echo json_encode(array("message" => "Utilisateur retiré avec succès de l'élevage."));
            } else {
                http_response_code(500);
                echo json_encode(array("message" => "Impossible de retirer l'utilisateur."));
            }

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(array("message" => "Erreur lors de la suppression de l'utilisateur.", "error" => $e->getMessage()));
        }
    }

    // Méthode utilitaire pour vérifier les permissions de gestion des utilisateurs d'élevage
    private function canManageElevageUsers($elevage_id, $currentUser) {
        // Admin peut tout gérer
        if ($currentUser['role'] == 1) {
            return true;
        }

        // Modérateur peut gérer ses élevages (vérifier s'il est propriétaire)
        if ($currentUser['role'] == 2) {
            $ownerQuery = "SELECT id FROM elevage_users WHERE elevage_id = :elevage_id AND user_id = :user_id AND role_in_elevage = 'owner'";
            $ownerStmt = $this->db->prepare($ownerQuery);
            $ownerStmt->bindParam(':elevage_id', $elevage_id);
            $ownerStmt->bindParam(':user_id', $currentUser['id']);
            $ownerStmt->execute();

            return $ownerStmt->fetch() !== false;
        }

        return false;
    }

}
?>
