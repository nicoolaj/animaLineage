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

require_once 'config/database.php';
require_once 'models/User.php';

class UserPermissionController {
    private $db;
    private $user;
    private $database;

    public function __construct() {
        $this->database = new Database();
        $this->db = $this->database->getConnection();
        $this->user = new User($this->db, $this->database);
    }

    /**
     * Retourne les permissions de l'utilisateur authentifié via JWT
     */
    public function getUserPermissions($user_id, $user_role) {
        try {
            error_log("getUserPermissions called with user_id=$user_id, user_role=$user_role");

            // Récupérer les informations utilisateur depuis la base (sécurisé)
            error_log("About to call user->getById($user_id)");
            $userInfo = $this->user->getById($user_id);
            error_log("getById returned: " . json_encode($userInfo));

            if (!$userInfo) {
                error_log("User not found in database for user_id=$user_id");
                http_response_code(404);
                echo json_encode(['message' => 'Utilisateur non trouvé']);
                return;
            }

            // Définir les permissions basées sur le rôle réel en base
            $permissions = [
                'user_id' => intval($userInfo['id']),
                'role' => intval($userInfo['role']),
                'role_name' => $this->getRoleName($userInfo['role']),
                'can_read_health_log' => true, // Tous peuvent lire
                'can_write_health_log' => $this->canWriteHealthLog($userInfo['role']),
                'can_edit_health_log' => $this->canEditHealthLog($userInfo['role']),
                'can_delete_health_log' => $this->canDeleteHealthLog($userInfo['role']),
            ];

            echo json_encode([
                'permissions' => $permissions
            ]);

        } catch (Exception $e) {
            error_log("ERREUR dans getUserPermissions: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            http_response_code(500);
            echo json_encode([
                'message' => 'Erreur interne du serveur',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
        }
    }

    /**
     * Vérifier les permissions pour une action spécifique sur un animal
     */
    public function checkAnimalPermissions($animal_id, $user_id, $user_role, $action) {
        try {
            // Vérifier que l'animal existe
            $stmt = $this->db->prepare("SELECT elevage_id FROM animaux WHERE id = :animal_id");
            $stmt->bindParam(':animal_id', $animal_id, PDO::PARAM_INT);
            $stmt->execute();
            $animal = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$animal) {
                http_response_code(404);
                echo json_encode(['message' => 'Animal non trouvé']);
                return;
            }

            // Vérifier l'accès à l'élevage
            if (!$this->hasAccessToElevage($animal['elevage_id'], $user_id, $user_role)) {
                http_response_code(403);
                echo json_encode(['message' => 'Accès non autorisé à cet animal']);
                return;
            }

            // Vérifier les permissions selon l'action
            $hasPermission = false;
            switch ($action) {
                case 'read_health_log':
                    $hasPermission = true; // Tous peuvent lire
                    break;
                case 'write_health_log':
                    $hasPermission = $this->canWriteHealthLog($user_role);
                    break;
                case 'edit_health_log':
                    $hasPermission = $this->canEditHealthLog($user_role);
                    break;
                case 'delete_health_log':
                    $hasPermission = $this->canDeleteHealthLog($user_role);
                    break;
            }

            echo json_encode([
                'has_permission' => $hasPermission,
                'action' => $action,
                'animal_id' => intval($animal_id)
            ]);

        } catch (Exception $e) {
            error_log("Erreur lors de la vérification des permissions animal: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['message' => 'Erreur interne du serveur']);
        }
    }

    /**
     * Vérifier l'accès à un élevage
     */
    private function hasAccessToElevage($elevage_id, $user_id, $user_role) {
        // Admin peut tout voir
        if ($user_role == 1) {
            return true;
        }

        try {
            $query = "SELECT e.id
                      FROM elevages e
                      LEFT JOIN elevage_users eu ON e.id = eu.elevage_id
                      WHERE e.id = :elevage_id
                      AND (e.user_id = :user_id OR eu.user_id = :user_id)";

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':elevage_id', $elevage_id, PDO::PARAM_INT);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            error_log("Erreur lors de la vérification d'accès à l'élevage: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Peut écrire dans le health log (Admin ou Modérateur)
     */
    private function canWriteHealthLog($role) {
        return $role == 1 || $role == 2; // Admin ou Modérateur
    }

    /**
     * Peut éditer le health log (Admin ou Modérateur)
     */
    private function canEditHealthLog($role) {
        return $role == 1 || $role == 2; // Admin ou Modérateur
    }

    /**
     * Peut supprimer du health log (Admin seulement)
     */
    private function canDeleteHealthLog($role) {
        return $role == 1; // Admin seulement
    }

    /**
     * Obtenir le nom du rôle
     */
    private function getRoleName($role) {
        switch ($role) {
            case 1:
                return 'Administrateur';
            case 2:
                return 'Modérateur';
            case 3:
                return 'Utilisateur';
            default:
                return 'Inconnu';
        }
    }
}
?>