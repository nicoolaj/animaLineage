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
require_once __DIR__ . '/../utils/ImageOptimizer.php';
class Animal {
    private $conn;
    private $database;
    private $table_name = "animaux";

    public $id;
    public $identifiant_officiel;
    public $nom;
    public $sexe;
    public $pere_id;
    public $mere_id;
    public $race_id;
    public $date_naissance;
    public $date_bouclage;
    public $date_deces;
    public $elevage_id;
    public $statut;
    public $notes;
    public $created_at;
    public $updated_at;

    public function __construct($db, $database) {
        $this->conn = $db;
        $this->database = $database;
    }

    // Lire tous les animaux
    public function getAll() {
        $query = "SELECT a.*, r.nom as race_nom, e.nom as elevage_nom, ta.nom as type_animal_nom,
                         p.identifiant_officiel as pere_identifiant, p.nom as pere_nom,
                         m.identifiant_officiel as mere_identifiant, m.nom as mere_nom
                  FROM " . $this->table_name . " a
                  LEFT JOIN races r ON a.race_id = r.id
                  LEFT JOIN types_animaux ta ON r.type_animal_id = ta.id
                  LEFT JOIN elevages e ON a.elevage_id = e.id
                  LEFT JOIN animaux p ON a.pere_id = p.id
                  LEFT JOIN animaux m ON a.mere_id = m.id
                  ORDER BY a.identifiant_officiel ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Lire les animaux par élevage
    public function getByElevageId($elevage_id) {
        $query = "SELECT a.*, r.nom as race_nom, ta.nom as type_animal_nom,
                         p.identifiant_officiel as pere_identifiant, p.nom as pere_nom,
                         m.identifiant_officiel as mere_identifiant, m.nom as mere_nom
                  FROM " . $this->table_name . " a
                  LEFT JOIN races r ON a.race_id = r.id
                  LEFT JOIN types_animaux ta ON r.type_animal_id = ta.id
                  LEFT JOIN animaux p ON a.pere_id = p.id
                  LEFT JOIN animaux m ON a.mere_id = m.id
                  WHERE a.elevage_id = :elevage_id
                  ORDER BY a.identifiant_officiel ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':elevage_id', $elevage_id);
        $stmt->execute();
        return $stmt;
    }

    // Lire les animaux vivants par élevage
    public function getVivantsByElevageId($elevage_id) {
        $query = "SELECT a.*, r.nom as race_nom, ta.nom as type_animal_nom,
                         p.identifiant_officiel as pere_identifiant, p.nom as pere_nom,
                         m.identifiant_officiel as mere_identifiant, m.nom as mere_nom
                  FROM " . $this->table_name . " a
                  LEFT JOIN races r ON a.race_id = r.id
                  LEFT JOIN types_animaux ta ON r.type_animal_id = ta.id
                  LEFT JOIN animaux p ON a.pere_id = p.id
                  LEFT JOIN animaux m ON a.mere_id = m.id
                  WHERE a.elevage_id = :elevage_id AND a.statut = 'vivant'
                  ORDER BY a.identifiant_officiel ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':elevage_id', $elevage_id);
        $stmt->execute();
        return $stmt;
    }

    // Lire un animal par ID
    public function getById($id) {
        $query = "SELECT a.*, r.nom as race_nom, e.nom as elevage_nom, ta.nom as type_animal_nom,
                         p.identifiant_officiel as pere_identifiant, p.nom as pere_nom,
                         m.identifiant_officiel as mere_identifiant, m.nom as mere_nom
                  FROM " . $this->table_name . " a
                  LEFT JOIN races r ON a.race_id = r.id
                  LEFT JOIN types_animaux ta ON r.type_animal_id = ta.id
                  LEFT JOIN elevages e ON a.elevage_id = e.id
                  LEFT JOIN animaux p ON a.pere_id = p.id
                  LEFT JOIN animaux m ON a.mere_id = m.id
                  WHERE a.id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Lire un animal par identifiant officiel
    public function getByIdentifiant($identifiant_officiel) {
        $query = "SELECT a.*, r.nom as race_nom, e.nom as elevage_nom, ta.nom as type_animal_nom,
                         p.identifiant_officiel as pere_identifiant, p.nom as pere_nom,
                         m.identifiant_officiel as mere_identifiant, m.nom as mere_nom
                  FROM " . $this->table_name . " a
                  LEFT JOIN races r ON a.race_id = r.id
                  LEFT JOIN types_animaux ta ON r.type_animal_id = ta.id
                  LEFT JOIN elevages e ON a.elevage_id = e.id
                  LEFT JOIN animaux p ON a.pere_id = p.id
                  LEFT JOIN animaux m ON a.mere_id = m.id
                  WHERE a.identifiant_officiel = :identifiant_officiel";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':identifiant_officiel', $identifiant_officiel);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Créer un nouvel animal
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " (
                    identifiant_officiel, nom, sexe, pere_id, mere_id, race_id,
                    date_naissance, date_bouclage, elevage_id, notes
                  ) VALUES (
                    :identifiant_officiel, :nom, :sexe, :pere_id, :mere_id, :race_id,
                    :date_naissance, :date_bouclage, :elevage_id, :notes
                  )";

        $stmt = $this->conn->prepare($query);

        // Nettoyer les données
        $this->identifiant_officiel = htmlspecialchars(strip_tags($this->identifiant_officiel));
        $this->nom = $this->nom ? htmlspecialchars(strip_tags($this->nom)) : null;
        $this->sexe = htmlspecialchars(strip_tags($this->sexe));
        $this->pere_id = $this->pere_id ?: null;
        $this->mere_id = $this->mere_id ?: null;
        $this->race_id = htmlspecialchars(strip_tags($this->race_id));
        $this->date_naissance = $this->date_naissance ?: null;
        $this->date_bouclage = $this->date_bouclage ?: null;
        $this->elevage_id = $this->elevage_id ?: null;
        $this->notes = $this->notes ? htmlspecialchars(strip_tags($this->notes)) : null;

        // Lier les valeurs
        $stmt->bindParam(':identifiant_officiel', $this->identifiant_officiel);
        $stmt->bindParam(':nom', $this->nom);
        $stmt->bindParam(':sexe', $this->sexe);
        $stmt->bindParam(':pere_id', $this->pere_id);
        $stmt->bindParam(':mere_id', $this->mere_id);
        $stmt->bindParam(':race_id', $this->race_id);
        $stmt->bindParam(':date_naissance', $this->date_naissance);
        $stmt->bindParam(':date_bouclage', $this->date_bouclage);
        $stmt->bindParam(':elevage_id', $this->elevage_id);
        $stmt->bindParam(':notes', $this->notes);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    // Mettre à jour un animal
    public function update() {
        $query = "UPDATE " . $this->table_name . "
                  SET identifiant_officiel = :identifiant_officiel,
                      nom = :nom,
                      sexe = :sexe,
                      pere_id = :pere_id,
                      mere_id = :mere_id,
                      race_id = :race_id,
                      date_naissance = :date_naissance,
                      date_bouclage = :date_bouclage,
                      date_deces = :date_deces,
                      elevage_id = :elevage_id,
                      statut = :statut,
                      notes = :notes,
                      updated_at = CURRENT_TIMESTAMP
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        // Nettoyer les données
        $this->identifiant_officiel = htmlspecialchars(strip_tags($this->identifiant_officiel));
        $this->nom = $this->nom ? htmlspecialchars(strip_tags($this->nom)) : null;
        $this->sexe = htmlspecialchars(strip_tags($this->sexe));
        $this->pere_id = $this->pere_id ?: null;
        $this->mere_id = $this->mere_id ?: null;
        $this->race_id = htmlspecialchars(strip_tags($this->race_id));
        $this->date_naissance = $this->date_naissance ?: null;
        $this->date_bouclage = $this->date_bouclage ?: null;
        $this->date_deces = $this->date_deces ?: null;
        $this->elevage_id = $this->elevage_id ?: null;
        $this->statut = htmlspecialchars(strip_tags($this->statut));
        $this->notes = $this->notes ? htmlspecialchars(strip_tags($this->notes)) : null;
        $this->id = htmlspecialchars(strip_tags($this->id));

        // Lier les valeurs
        $stmt->bindParam(':identifiant_officiel', $this->identifiant_officiel);
        $stmt->bindParam(':nom', $this->nom);
        $stmt->bindParam(':sexe', $this->sexe);
        $stmt->bindParam(':pere_id', $this->pere_id);
        $stmt->bindParam(':mere_id', $this->mere_id);
        $stmt->bindParam(':race_id', $this->race_id);
        $stmt->bindParam(':date_naissance', $this->date_naissance);
        $stmt->bindParam(':date_bouclage', $this->date_bouclage);
        $stmt->bindParam(':date_deces', $this->date_deces);
        $stmt->bindParam(':elevage_id', $this->elevage_id);
        $stmt->bindParam(':statut', $this->statut);
        $stmt->bindParam(':notes', $this->notes);
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }

    // Marquer un animal comme décédé
    public function marquerDeces($date_deces) {
        $this->date_deces = $date_deces;
        $this->statut = 'mort';
        // Ne plus retirer l'animal de l'élevage pour conserver les statistiques

        $query = "UPDATE " . $this->table_name . "
                  SET date_deces = :date_deces,
                      statut = 'mort',
                      updated_at = CURRENT_TIMESTAMP
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':date_deces', $this->date_deces);
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }

    // Supprimer un animal
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);

        $this->id = htmlspecialchars(strip_tags($this->id));
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }

    // Vérifier si l'identifiant officiel existe déjà
    public function identifiantExists() {
        $query = "SELECT id FROM " . $this->table_name . "
                  WHERE identifiant_officiel = :identifiant_officiel";

        if (isset($this->id)) {
            $query .= " AND id != :id";
        }

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':identifiant_officiel', $this->identifiant_officiel);

        if (isset($this->id)) {
            $stmt->bindParam(':id', $this->id);
        }

        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    // Obtenir les descendants d'un animal
    public function getDescendants() {
        $query = "SELECT a.*, r.nom as race_nom, ta.nom as type_animal_nom
                  FROM " . $this->table_name . " a
                  LEFT JOIN races r ON a.race_id = r.id
                  LEFT JOIN types_animaux ta ON r.type_animal_id = ta.id
                  WHERE a.pere_id = :animal_id OR a.mere_id = :animal_id
                  ORDER BY a.date_naissance DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':animal_id', $this->id);
        $stmt->execute();
        return $stmt;
    }

    // Obtenir les statistiques d'un animal reproducteur
    public function getStatsReproduction() {
        $stats = [
            'nb_descendants' => 0,
            'descendants_vivants' => 0,
            'descendants_morts' => 0
        ];

        // Compter tous les descendants
        $query = "SELECT COUNT(*) as count FROM " . $this->table_name . "
                  WHERE pere_id = :animal_id OR mere_id = :animal_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':animal_id', $this->id);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['nb_descendants'] = $result['count'];

        // Compter les descendants vivants
        $query = "SELECT COUNT(*) as count FROM " . $this->table_name . "
                  WHERE (pere_id = :animal_id OR mere_id = :animal_id) AND statut = 'vivant'";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':animal_id', $this->id);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['descendants_vivants'] = $result['count'];

        // Compter les descendants morts
        $stats['descendants_morts'] = $stats['nb_descendants'] - $stats['descendants_vivants'];

        return $stats;
    }

    // Vérifier si l'utilisateur peut voir un animal
    public function canView($animal_id, $user_id, $user_role) {
        // Les admins peuvent tout voir
        if ($user_role == 1) {
            return true;
        }

        // Charger les données de l'animal
        $animal_data = $this->getById($animal_id);
        if (!$animal_data) {
            return false;
        }

        // Pour l'instant, tous les utilisateurs connectés peuvent voir les animaux
        // (à adapter selon les règles métier)
        return true;
    }

    // Vérifier si l'utilisateur peut modifier un animal
    public function canEdit($animal_id, $user_id, $user_role) {
        // Les admins peuvent tout modifier
        if ($user_role == 1) {
            return true;
        }

        // Charger les données de l'animal
        $animal_data = $this->getById($animal_id);
        if (!$animal_data) {
            return false;
        }

        // Vérifier si l'utilisateur est propriétaire de l'élevage
        if ($animal_data['elevage_id']) {
            $query = "SELECT user_id FROM elevages WHERE id = :elevage_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':elevage_id', $animal_data['elevage_id']);
            $stmt->execute();
            $elevage = $stmt->fetch(PDO::FETCH_ASSOC);
            return $elevage && $elevage['user_id'] == $user_id;
        }

        return false;
    }

    // Version legacy pour compatibilité
    public function canEditLegacy($user_id, $user_role) {
        // Les admins peuvent tout modifier
        if ($user_role == 1) {
            return true;
        }

        // Vérifier si l'utilisateur est propriétaire de l'élevage
        if ($this->elevage_id) {
            $query = "SELECT user_id FROM elevages WHERE id = :elevage_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':elevage_id', $this->elevage_id);
            $stmt->execute();
            $elevage = $stmt->fetch(PDO::FETCH_ASSOC);
            return $elevage && $elevage['user_id'] == $user_id;
        }

        return false;
    }

    // Vérifier si un utilisateur peut transférer un animal
    public function canTransfer($animal_id, $user_id, $user_role) {
        // Les admins peuvent tout transférer
        if ($user_role == 1) {
            return true;
        }

        // Charger les données de l'animal
        $animal_data = $this->getById($animal_id);
        if (!$animal_data) {
            return false;
        }

        // Vérifier si l'utilisateur est propriétaire de l'élevage actuel
        if ($animal_data['elevage_id']) {
            $query = "SELECT user_id FROM elevages WHERE id = :elevage_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':elevage_id', $animal_data['elevage_id']);
            $stmt->execute();
            $elevage = $stmt->fetch(PDO::FETCH_ASSOC);
            return $elevage && $elevage['user_id'] == $user_id;
        }

        return false;
    }

    // Obtenir l'arbre généalogique d'un animal
    public function getFamilyTree($maxLevels = 3, $includeChildren = false) {
        return $this->buildFamilyTreeNode($this->id, 0, $maxLevels, $includeChildren);
    }

    // Construire récursivement un nœud de l'arbre généalogique
    private function buildFamilyTreeNode($animalId, $currentLevel, $maxLevels, $includeChildren = false, &$visited = []) {
        // Éviter la récursion infinie
        if (in_array($animalId, $visited)) {
            return null;
        }
        $visited[] = $animalId;

        // Obtenir les données de l'animal
        $animalData = $this->getById($animalId);
        if (!$animalData) {
            return null;
        }

        // Structure du nœud
        $node = [
            'animal' => [
                'id' => (int)$animalData['id'],
                'identifiant_officiel' => $animalData['identifiant_officiel'],
                'nom' => $animalData['nom'],
                'sexe' => $animalData['sexe'],
                'race_nom' => $animalData['race_nom'],
                'date_naissance' => $animalData['date_naissance'],
                'date_deces' => $animalData['date_deces'],
                'statut' => $animalData['statut'],
                'pere_id' => $animalData['pere_id'] ? (int)$animalData['pere_id'] : null,
                'mere_id' => $animalData['mere_id'] ? (int)$animalData['mere_id'] : null
            ],
            'level' => $currentLevel
        ];

        // Si nous n'avons pas atteint le niveau maximum, récupérer les parents
        if ($currentLevel < $maxLevels) {
            // Récupérer le père
            if ($animalData['pere_id'] && !in_array($animalData['pere_id'], $visited)) {
                $node['pere'] = $this->buildFamilyTreeNode($animalData['pere_id'], $currentLevel + 1, $maxLevels, $includeChildren, $visited);
            }

            // Récupérer la mère
            if ($animalData['mere_id'] && !in_array($animalData['mere_id'], $visited)) {
                $node['mere'] = $this->buildFamilyTreeNode($animalData['mere_id'], $currentLevel + 1, $maxLevels, $includeChildren, $visited);
            }
        }

        // Si includeChildren est activé et nous sommes au niveau 0 ou descendant, récupérer les enfants
        if ($includeChildren && $currentLevel <= 0 && $currentLevel > -$maxLevels) {
            $children = $this->getChildrenOfAnimal($animalId);
            if (!empty($children)) {
                $node['enfants'] = [];
                foreach ($children as $child) {
                    if (!in_array($child['id'], $visited)) {
                        $childNode = $this->buildFamilyTreeNode($child['id'], $currentLevel - 1, $maxLevels, $includeChildren, $visited);
                        if ($childNode) {
                            $node['enfants'][] = $childNode;
                        }
                    }
                }
            }
        }

        return $node;
    }

    // Obtenir les enfants directs d'un animal
    private function getChildrenOfAnimal($animalId) {
        $query = "SELECT a.*, r.nom as race_nom, ta.nom as type_animal_nom
                  FROM " . $this->table_name . " a
                  LEFT JOIN races r ON a.race_id = r.id
                  LEFT JOIN types_animaux ta ON r.type_animal_id = ta.id
                  WHERE a.pere_id = :animal_id OR a.mere_id = :animal_id
                  ORDER BY a.date_naissance ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':animal_id', $animalId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Récupérer toutes les photos d'un animal
     */
    public function getPhotos($animal_id) {
        $query = "SELECT id, original_name, file_size, mime_type, width, height, is_main, created_at, updated_at
                  FROM animal_photos
                  WHERE animal_id = :animal_id
                  ORDER BY is_main DESC, created_at ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':animal_id', $animal_id);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Récupérer les données binaires d'une photo
     */
    public function getPhotoData($animal_id, $photo_id) {
        $query = "SELECT photo_data, mime_type, file_size
                  FROM animal_photos
                  WHERE id = :photo_id AND animal_id = :animal_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':photo_id', $photo_id);
        $stmt->bindParam(':animal_id', $animal_id);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Ajouter une photo à un animal
     */
    public function addPhoto($animal_id, $photo_data) {
        // Valider le fichier image
        $this->validateImageFile($photo_data);

        try {
            // Initialiser l'optimiseur d'images (1000x1000px max, qualité 85%)
            $optimizer = new ImageOptimizer(1000, 1000, 85);

            // Optimiser l'image
            $optimized = $optimizer->optimizeFromPath($photo_data['tmp_name'], $photo_data['mime_type']);

            error_log("Image optimisée: {$photo_data['original_name']} - " .
                     "Taille originale: {$photo_data['file_size']} bytes, " .
                     "Taille optimisée: {$optimized['file_size']} bytes, " .
                     "Dimensions: {$optimized['original_width']}x{$optimized['original_height']} -> {$optimized['width']}x{$optimized['height']}");

            // Vérifier s'il s'agit de la première photo (sera automatiquement principale)
            $count_query = "SELECT COUNT(*) as count FROM animal_photos WHERE animal_id = :animal_id";
            $count_stmt = $this->conn->prepare($count_query);
            $count_stmt->bindParam(':animal_id', $animal_id);
            $count_stmt->execute();
            $count_result = $count_stmt->fetch(PDO::FETCH_ASSOC);
            $is_main = $count_result['count'] == 0 ? 1 : 0;

            // Insérer la photo optimisée en base
            $query = "INSERT INTO animal_photos
                      (animal_id, original_name, file_size, mime_type, width, height, photo_data, is_main)
                      VALUES (:animal_id, :original_name, :file_size, :mime_type, :width, :height, :photo_data, :is_main)";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':animal_id', $animal_id);
            $stmt->bindParam(':original_name', $photo_data['original_name']);
            $stmt->bindParam(':file_size', $optimized['file_size']); // Utiliser la taille optimisée
            $stmt->bindParam(':mime_type', $photo_data['mime_type']);
            $stmt->bindParam(':width', $optimized['width']); // Utiliser les dimensions optimisées
            $stmt->bindParam(':height', $optimized['height']);
            $stmt->bindParam(':photo_data', $optimized['data'], PDO::PARAM_LOB); // Utiliser les données optimisées
            $stmt->bindParam(':is_main', $is_main);

            if (!$stmt->execute()) {
                throw new Exception("Erreur lors de l'enregistrement de la photo");
            }

            return $this->conn->lastInsertId();

        } catch (Exception $e) {
            error_log("Erreur lors de l'optimisation de l'image {$photo_data['original_name']}: " . $e->getMessage());
            throw new Exception("Erreur lors du traitement de l'image: " . $e->getMessage());
        }
    }

    /**
     * Supprimer une photo d'un animal
     */
    public function deletePhoto($animal_id, $photo_id) {
        // Vérifier que la photo existe et appartient à cet animal
        $check_query = "SELECT is_main FROM animal_photos WHERE id = :photo_id AND animal_id = :animal_id";
        $check_stmt = $this->conn->prepare($check_query);
        $check_stmt->bindParam(':photo_id', $photo_id);
        $check_stmt->bindParam(':animal_id', $animal_id);
        $check_stmt->execute();
        $photo = $check_stmt->fetch(PDO::FETCH_ASSOC);

        if (!$photo) {
            return false;
        }

        $was_main = $photo['is_main'];

        // Supprimer la photo
        $delete_query = "DELETE FROM animal_photos WHERE id = :photo_id AND animal_id = :animal_id";
        $delete_stmt = $this->conn->prepare($delete_query);
        $delete_stmt->bindParam(':photo_id', $photo_id);
        $delete_stmt->bindParam(':animal_id', $animal_id);
        $success = $delete_stmt->execute();

        // Si c'était la photo principale, définir une autre photo comme principale
        if ($success && $was_main) {
            $this->assignNewMainPhoto($animal_id);
        }

        return $success;
    }

    /**
     * Définir une photo comme photo principale
     */
    public function setMainPhoto($animal_id, $photo_id) {
        // Vérifier que la photo existe et appartient à cet animal
        $check_query = "SELECT id FROM animal_photos WHERE id = :photo_id AND animal_id = :animal_id";
        $check_stmt = $this->conn->prepare($check_query);
        $check_stmt->bindParam(':photo_id', $photo_id);
        $check_stmt->bindParam(':animal_id', $animal_id);
        $check_stmt->execute();

        if (!$check_stmt->fetch()) {
            return false;
        }

        // Retirer le statut principal de toutes les autres photos
        $reset_query = "UPDATE animal_photos SET is_main = 0 WHERE animal_id = :animal_id";
        $reset_stmt = $this->conn->prepare($reset_query);
        $reset_stmt->bindParam(':animal_id', $animal_id);
        $reset_stmt->execute();

        // Définir cette photo comme principale
        $main_query = "UPDATE animal_photos SET is_main = 1 WHERE id = :photo_id AND animal_id = :animal_id";
        $main_stmt = $this->conn->prepare($main_query);
        $main_stmt->bindParam(':photo_id', $photo_id);
        $main_stmt->bindParam(':animal_id', $animal_id);

        return $main_stmt->execute();
    }

    /**
     * Valider un fichier image
     */
    private function validateImageFile($photo_data) {
        // Vérifier la taille du fichier (limite à 10MB avant optimisation)
        $max_size = 10 * 1024 * 1024; // 10MB (plus généreux car l'image sera optimisée)
        if ($photo_data['file_size'] > $max_size) {
            throw new Exception("Fichier trop volumineux. Limite: 10MB");
        }

        // Vérifier le type MIME avec l'optimiseur
        if (!ImageOptimizer::isSupportedMimeType($photo_data['mime_type'])) {
            throw new Exception("Type de fichier non autorisé. Types acceptés: JPEG, PNG, GIF, WebP");
        }

        // Vérifier que le fichier est vraiment une image
        $image_info = getimagesize($photo_data['tmp_name']);
        if ($image_info === false) {
            throw new Exception("Le fichier n'est pas une image valide");
        }

        return true;
    }

    /**
     * Assigner une nouvelle photo principale quand l'actuelle est supprimée
     */
    private function assignNewMainPhoto($animal_id) {
        // Approche compatible SQLite : d'abord trouver l'ID, puis mettre à jour
        $select_query = "SELECT id FROM animal_photos
                         WHERE animal_id = :animal_id
                         ORDER BY created_at ASC
                         LIMIT 1";

        $select_stmt = $this->conn->prepare($select_query);
        $select_stmt->bindParam(':animal_id', $animal_id);
        $select_stmt->execute();
        $first_photo = $select_stmt->fetch(PDO::FETCH_ASSOC);

        if ($first_photo) {
            $update_query = "UPDATE animal_photos
                            SET is_main = 1
                            WHERE id = :photo_id";

            $update_stmt = $this->conn->prepare($update_query);
            $update_stmt->bindParam(':photo_id', $first_photo['id']);
            $update_stmt->execute();
        }
    }
}
?>
