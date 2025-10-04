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
require_once __DIR__ . '/../models/Animal.php';
require_once __DIR__ . '/../models/Race.php';
require_once __DIR__ . '/../models/Elevage.php';

class AnimalController {
    private $conn;
    private $database;
    private $animal;
    private $race;
    private $elevage;

    public function __construct($db, $database) {
        $this->conn = $db;
        $this->database = $database;
        $this->animal = new Animal($db, $database);
        $this->race = new Race($db, $database);
        $this->elevage = new Elevage($db, $database);
    }

    /**
     * Corriger le statut d'un animal basé sur sa date de décès
     */
    private function fixAnimalStatus(&$animal) {
        // Si l'animal a une date de décès, il doit être marqué comme mort
        if (!empty($animal['date_deces']) && $animal['statut'] !== 'mort') {
            $animal['statut'] = 'mort';
        }
        // Si l'animal n'a pas de date de décès mais est marqué mort, le corriger
        elseif (empty($animal['date_deces']) && $animal['statut'] === 'mort') {
            $animal['statut'] = 'vivant';
        }
        return $animal;
    }

    /**
     * Vérifier si un animal existe avec cet identifiant officiel
     */
    private function checkAnimalByIdentifiant($identifiant) {
        try {
            $query = "SELECT a.id, a.nom, a.identifiant_officiel, e.nom as elevage_nom
                      FROM animaux a
                      LEFT JOIN elevages e ON a.elevage_id = e.id
                      WHERE a.identifiant_officiel = :identifiant";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':identifiant', $identifiant);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            return false;
        }
    }

    // Lister tous les animaux (admin) ou par élevage (utilisateur)
    public function getAnimaux($user_id, $user_role) {
        try {
            $elevage_id = isset($_GET['elevage_id']) ? $_GET['elevage_id'] : null;

            if ($elevage_id) {
                // Filtrer par élevage spécifique (admin ou utilisateur)
                if ($user_role == 1) {
                    // Admin : peut voir n'importe quel élevage
                    $stmt = $this->animal->getByElevageId($elevage_id);
                } else {
                    // Utilisateur : vérifier qu'il peut accéder à cet élevage (propriétaire ou collaborateur)
                    $this->elevage->id = $elevage_id;
                    if (!$this->elevage->canEdit($user_id, $user_role)) {
                        http_response_code(403);
                        echo json_encode(['message' => 'Accès non autorisé à cet élevage']);
                        return;
                    }
                    $stmt = $this->animal->getByElevageId($elevage_id);
                }
            } else {
                // Pas d'élevage spécifique
                if ($user_role == 1) {
                    // Admin : voir tous les animaux
                    $stmt = $this->animal->getAll();
                } else {
                    // Récupérer tous les animaux des élevages de l'utilisateur
                    $elevagesStmt = $this->elevage->getByUserId($user_id);
                    $animaux = [];
                    while ($elevage_row = $elevagesStmt->fetch(PDO::FETCH_ASSOC)) {
                        $animalStmt = $this->animal->getByElevageId($elevage_row['id']);
                        while ($animal_row = $animalStmt->fetch(PDO::FETCH_ASSOC)) {
                            $this->fixAnimalStatus($animal_row);
                            $animaux[] = $animal_row;
                        }
                    }
                    echo json_encode($animaux);
                    return;
                }
            }

            $animaux = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $this->fixAnimalStatus($row);
                $animaux[] = $row;
            }

            echo json_encode($animaux);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Erreur serveur: ' . $e->getMessage()]);
        }
    }

    // Récupérer un animal par ID
    public function getAnimal($id, $user_id, $user_role) {
        try {
            $animal = $this->animal->getById($id);

            if (!$animal) {
                http_response_code(404);
                echo json_encode(['message' => 'Animal non trouvé']);
                return;
            }

            // Vérifier les droits d'accès
            if ($user_role != 1) { // Si pas admin
                if ($animal['elevage_id']) {
                    $this->elevage->id = $animal['elevage_id'];
                    if (!$this->elevage->canEdit($user_id, $user_role)) {
                        http_response_code(403);
                        echo json_encode(['message' => 'Accès non autorisé']);
                        return;
                    }
                } else {
                    http_response_code(403);
                    echo json_encode(['message' => 'Accès non autorisé']);
                    return;
                }
            }

            $this->fixAnimalStatus($animal);
            echo json_encode($animal);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Erreur serveur: ' . $e->getMessage()]);
        }
    }

    // Créer un nouvel animal
    public function createAnimal($data, $user_id, $user_role) {
        try {
            // Validation des données requises
            if (empty($data['identifiant_officiel'])) {
                http_response_code(400);
                echo json_encode(['message' => 'L\'identifiant officiel est requis']);
                return;
            }

            // Vérifier l'unicité de l'identifiant officiel
            $existingAnimal = $this->checkAnimalByIdentifiant($data['identifiant_officiel']);
            if ($existingAnimal) {
                http_response_code(409);
                echo json_encode([
                    'message' => 'Un animal avec cet identifiant officiel existe déjà',
                    'field' => 'identifiant_officiel',
                    'existing_animal' => [
                        'id' => $existingAnimal['id'],
                        'nom' => $existingAnimal['nom'],
                        'elevage_nom' => $existingAnimal['elevage_nom']
                    ]
                ]);
                return;
            }

            if (empty($data['sexe']) || !in_array($data['sexe'], ['M', 'F'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Le sexe doit être M ou F']);
                return;
            }

            if (empty($data['race_id'])) {
                http_response_code(400);
                echo json_encode(['message' => 'La race est requise']);
                return;
            }

            // Vérifier que la race existe
            $race_data = $this->race->getById($data['race_id']);
            if (!$race_data) {
                http_response_code(400);
                echo json_encode(['message' => 'Race non trouvée']);
                return;
            }

            // Si un élevage est spécifié, vérifier les droits
            if (!empty($data['elevage_id'])) {
                $elevage_data = $this->elevage->getById($data['elevage_id']);
                if (!$elevage_data) {
                    http_response_code(400);
                    echo json_encode(['message' => 'Élevage non trouvé']);
                    return;
                }

                // Vérifier les permissions pour cet élevage (admin, propriétaire ou collaborateur)
                $this->elevage->id = $elevage_data['id'];
                if ($user_role != 1 && !$this->elevage->canEdit($user_id, $user_role)) {
                    http_response_code(403);
                    echo json_encode(['message' => 'Accès non autorisé à cet élevage']);
                    return;
                }
            }

            // Vérifier l'unicité de l'identifiant officiel
            $this->animal->identifiant_officiel = $data['identifiant_officiel'];
            if ($this->animal->identifiantExists()) {
                http_response_code(400);
                echo json_encode(['message' => 'Cet identifiant officiel existe déjà']);
                return;
            }

            // Valider les parents si spécifiés
            if (!empty($data['pere_id'])) {
                $pere = $this->animal->getById($data['pere_id']);
                if (!$pere || $pere['sexe'] != 'M') {
                    http_response_code(400);
                    echo json_encode(['message' => 'Le père spécifié n\'est pas valide']);
                    return;
                }
            }

            if (!empty($data['mere_id'])) {
                $mere = $this->animal->getById($data['mere_id']);
                if (!$mere || $mere['sexe'] != 'F') {
                    http_response_code(400);
                    echo json_encode(['message' => 'La mère spécifiée n\'est pas valide']);
                    return;
                }
            }

            // Remplir les propriétés de l'animal
            $this->animal->identifiant_officiel = $data['identifiant_officiel'];
            $this->animal->nom = $data['nom'] ?? null;
            $this->animal->sexe = $data['sexe'];
            $this->animal->pere_id = $data['pere_id'] ?? null;
            $this->animal->mere_id = $data['mere_id'] ?? null;
            $this->animal->race_id = $data['race_id'];
            $this->animal->date_naissance = $data['date_naissance'] ?? null;
            $this->animal->date_bouclage = $data['date_bouclage'] ?? null;
            $this->animal->elevage_id = $data['elevage_id'] ?? null;
            $this->animal->notes = $data['notes'] ?? null;

            if ($this->animal->create()) {
                http_response_code(201);
                $created_animal = $this->animal->getById($this->animal->id);
                echo json_encode([
                    'message' => 'Animal créé avec succès',
                    'animal' => $created_animal
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['message' => 'Erreur lors de la création de l\'animal']);
            }

        } catch (Exception $e) {
            // Gestion spécifique des erreurs de contrainte d'unicité
            if (strpos($e->getMessage(), 'UNIQUE constraint failed: animaux.identifiant_officiel') !== false) {
                http_response_code(409);
                echo json_encode([
                    'message' => 'Un animal avec cet identifiant officiel existe déjà',
                    'field' => 'identifiant_officiel'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['message' => 'Erreur serveur: ' . $e->getMessage()]);
            }
        }
    }

    // Mettre à jour un animal
    public function updateAnimal($id, $data, $user_id, $user_role) {
        try {
            $animal_data = $this->animal->getById($id);

            if (!$animal_data) {
                http_response_code(404);
                echo json_encode(['message' => 'Animal non trouvé']);
                return;
            }

            // Vérifier les droits de modification
            $this->animal->id = $id;
            if (!$this->animal->canEdit($user_id, $user_role)) {
                http_response_code(403);
                echo json_encode(['message' => 'Accès non autorisé']);
                return;
            }

            // Validation des données
            if (isset($data['sexe']) && !in_array($data['sexe'], ['M', 'F'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Le sexe doit être M ou F']);
                return;
            }

            if (isset($data['race_id'])) {
                $race_data = $this->race->getById($data['race_id']);
                if (!$race_data) {
                    http_response_code(400);
                    echo json_encode(['message' => 'Race non trouvée']);
                    return;
                }
            }

            // Vérifier l'unicité de l'identifiant officiel si modifié
            if (isset($data['identifiant_officiel']) && $data['identifiant_officiel'] != $animal_data['identifiant_officiel']) {
                $this->animal->identifiant_officiel = $data['identifiant_officiel'];
                if ($this->animal->identifiantExists()) {
                    http_response_code(400);
                    echo json_encode(['message' => 'Cet identifiant officiel existe déjà']);
                    return;
                }
            }

            // Mettre à jour les propriétés
            $this->animal->id = $id;
            $this->animal->identifiant_officiel = $data['identifiant_officiel'] ?? $animal_data['identifiant_officiel'];
            $this->animal->nom = $data['nom'] ?? $animal_data['nom'];
            $this->animal->sexe = $data['sexe'] ?? $animal_data['sexe'];
            $this->animal->pere_id = $data['pere_id'] ?? $animal_data['pere_id'];
            $this->animal->mere_id = $data['mere_id'] ?? $animal_data['mere_id'];
            $this->animal->race_id = $data['race_id'] ?? $animal_data['race_id'];
            $this->animal->date_naissance = $data['date_naissance'] ?? $animal_data['date_naissance'];
            $this->animal->date_bouclage = $data['date_bouclage'] ?? $animal_data['date_bouclage'];
            $this->animal->date_deces = $data['date_deces'] ?? $animal_data['date_deces'];
            $this->animal->elevage_id = $data['elevage_id'] ?? $animal_data['elevage_id'];
            $this->animal->notes = $data['notes'] ?? $animal_data['notes'];

            // Gérer automatiquement le statut et l'élevage en cas de décès
            if (!empty($data['date_deces'])) {
                $this->animal->statut = 'mort';
                $this->animal->elevage_id = null;
            } else {
                $this->animal->statut = $data['statut'] ?? $animal_data['statut'];
            }

            if ($this->animal->update()) {
                $updated_animal = $this->animal->getById($id);
                echo json_encode([
                    'message' => 'Animal mis à jour avec succès',
                    'animal' => $updated_animal
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['message' => 'Erreur lors de la mise à jour']);
            }

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Erreur serveur: ' . $e->getMessage()]);
        }
    }

    // Marquer un animal comme décédé
    public function marquerDeces($id, $data, $user_id, $user_role) {
        try {
            $animal_data = $this->animal->getById($id);

            if (!$animal_data) {
                http_response_code(404);
                echo json_encode(['message' => 'Animal non trouvé']);
                return;
            }

            // Vérifier les droits
            $this->animal->id = $id;
            if (!$this->animal->canEdit($user_id, $user_role)) {
                http_response_code(403);
                echo json_encode(['message' => 'Accès non autorisé']);
                return;
            }

            if (empty($data['date_deces'])) {
                http_response_code(400);
                echo json_encode(['message' => 'La date de décès est requise']);
                return;
            }

            if ($this->animal->marquerDeces($data['date_deces'])) {
                $updated_animal = $this->animal->getById($id);
                echo json_encode([
                    'message' => 'Animal marqué comme décédé avec succès',
                    'animal' => $updated_animal
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['message' => 'Erreur lors de la mise à jour']);
            }

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Erreur serveur: ' . $e->getMessage()]);
        }
    }

    // Supprimer un animal
    public function deleteAnimal($id, $user_id, $user_role) {
        try {
            $animal_data = $this->animal->getById($id);

            if (!$animal_data) {
                http_response_code(404);
                echo json_encode(['message' => 'Animal non trouvé']);
                return;
            }

            // Vérifier les droits
            $this->animal->id = $id;
            if (!$this->animal->canEdit($user_id, $user_role)) {
                http_response_code(403);
                echo json_encode(['message' => 'Accès non autorisé']);
                return;
            }

            // Vérifier s'il y a des descendants
            $descendants = $this->animal->getDescendants();
            if ($descendants->rowCount() > 0) {
                http_response_code(400);
                echo json_encode(['message' => 'Impossible de supprimer un animal qui a des descendants']);
                return;
            }

            if ($this->animal->delete()) {
                echo json_encode(['message' => 'Animal supprimé avec succès']);
            } else {
                http_response_code(500);
                echo json_encode(['message' => 'Erreur lors de la suppression']);
            }

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Erreur serveur: ' . $e->getMessage()]);
        }
    }

    // Obtenir les descendants d'un animal
    public function getDescendants($id, $user_id, $user_role) {
        try {
            $animal_data = $this->animal->getById($id);

            if (!$animal_data) {
                http_response_code(404);
                echo json_encode(['message' => 'Animal non trouvé']);
                return;
            }

            // Vérifier les droits d'accès
            if ($user_role != 1) {
                if ($animal_data['elevage_id']) {
                    $this->elevage->id = $animal_data['elevage_id'];
                    if (!$this->elevage->canEdit($user_id, $user_role)) {
                        http_response_code(403);
                        echo json_encode(['message' => 'Accès non autorisé']);
                        return;
                    }
                }
            }

            $this->animal->id = $id;
            $stmt = $this->animal->getDescendants();

            $descendants = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $this->fixAnimalStatus($row);
                $descendants[] = $row;
            }

            echo json_encode($descendants);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Erreur serveur: ' . $e->getMessage()]);
        }
    }

    // Obtenir les statistiques de reproduction d'un animal
    public function getStatsReproduction($id, $user_id, $user_role) {
        try {
            $animal_data = $this->animal->getById($id);

            if (!$animal_data) {
                http_response_code(404);
                echo json_encode(['message' => 'Animal non trouvé']);
                return;
            }

            // Vérifier les droits d'accès
            if ($user_role != 1) {
                if ($animal_data['elevage_id']) {
                    $this->elevage->id = $animal_data['elevage_id'];
                    if (!$this->elevage->canEdit($user_id, $user_role)) {
                        http_response_code(403);
                        echo json_encode(['message' => 'Accès non autorisé']);
                        return;
                    }
                }
            }

            $this->animal->id = $id;
            $stats = $this->animal->getStatsReproduction();

            echo json_encode($stats);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Erreur serveur: ' . $e->getMessage()]);
        }
    }

    // Vérifier l'existence d'un animal par identifiant officiel
    public function checkAnimalExists($identifiant_officiel, $user_id, $user_role) {
        try {
            $animal_data = $this->animal->getByIdentifiant($identifiant_officiel);

            if (!$animal_data) {
                echo json_encode([
                    'exists' => false,
                    'message' => 'Animal non trouvé'
                ]);
                return;
            }

            // Récupérer les informations de l'élevage
            $elevage_data = null;
            if ($animal_data['elevage_id']) {
                $elevage_data = $this->elevage->getById($animal_data['elevage_id']);
            }

            echo json_encode([
                'exists' => true,
                'animal' => [
                    'id' => $animal_data['id'],
                    'identifiant_officiel' => $animal_data['identifiant_officiel'],
                    'nom' => $animal_data['nom'],
                    'elevage_id' => $animal_data['elevage_id'],
                    'elevage_nom' => $elevage_data ? $elevage_data['nom'] : null,
                    'can_transfer' => $this->animal->canTransfer($animal_data['id'], $user_id, $user_role)
                ]
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Erreur serveur: ' . $e->getMessage()]);
        }
    }
}
?>
