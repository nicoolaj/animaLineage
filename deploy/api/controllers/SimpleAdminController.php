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

class SimpleAdminController {
    private $user;
    private $conn;
    private $authMiddleware;

    public function __construct(User $user, $database) {
        $this->user = $user;
        $this->conn = $database->getConnection();
        $this->authMiddleware = new AuthMiddleware($database);
    }

    // Simple check - for demo purposes only
    private function isAdmin($userData) {
        return $userData && isset($userData['role']) && $userData['role'] == 1;
    }

    public function getAllUsersSimple() {
        // Check authentication with JWT
        if (!$this->authMiddleware->requireAuth()) {
            return;
        }

        $userData = $this->authMiddleware->getCurrentUser();
        if (!$userData || $userData['role'] > 2) {
            http_response_code(403);
            echo json_encode(['error' => 'Access denied']);
            return;
        }

        try {
            $stmt = $this->user->getAll();
            $users = array();

            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $user_item = array(
                    "id" => $row['id'],
                    "name" => $row['name'],
                    "email" => $row['email'],
                    "role" => $row['role'],
                    "role_name" => User::getRoleName($row['role']),
                    "created_at" => $row['created_at'],
                    "status" => $row['status'] ?? 1
                );
                array_push($users, $user_item);
            }

            http_response_code(200);
            echo json_encode($users);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(array("message" => "Error fetching users.", "error" => $e->getMessage()));
        }
    }

    public function updateUserRoleSimple() {
        // Check admin authentication with JWT
        if (!$this->authMiddleware->requireAdmin()) {
            return;
        }

        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->user_id) && isset($data->new_role)) {
            if (!in_array($data->new_role, [User::ROLE_ADMIN, User::ROLE_MODERATOR, User::ROLE_READER])) {
                http_response_code(400);
                echo json_encode(array("message" => "Invalid role specified."));
                return;
            }

            try {
                $query = "UPDATE users SET role = :role WHERE id = :id";
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':role', $data->new_role);
                $stmt->bindParam(':id', $data->user_id);

                if ($stmt->execute()) {
                    http_response_code(200);
                    echo json_encode(array(
                        "message" => "User role updated successfully.",
                        "user_id" => $data->user_id,
                        "new_role" => $data->new_role,
                        "role_name" => User::getRoleName($data->new_role)
                    ));
                } else {
                    http_response_code(500);
                    echo json_encode(array("message" => "Unable to update user role."));
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(array("message" => "Error updating user role.", "error" => $e->getMessage()));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "User ID and new role are required."));
        }
    }

    public function deleteUserSimple() {
        // Check admin authentication with JWT
        if (!$this->authMiddleware->requireAdmin()) {
            return;
        }

        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->user_id)) {
            try {
                // Get current user to prevent self-deletion
                $currentUser = $this->authMiddleware->getCurrentUser();
                if ($currentUser && $currentUser['id'] == $data->user_id) {
                    http_response_code(400);
                    echo json_encode(array("message" => "You cannot delete your own account."));
                    return;
                }

                $query = "DELETE FROM users WHERE id = :id";
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':id', $data->user_id);

                if ($stmt->execute()) {
                    if ($stmt->rowCount() > 0) {
                        http_response_code(200);
                        echo json_encode(array("message" => "User deleted successfully."));
                    } else {
                        http_response_code(404);
                        echo json_encode(array("message" => "User not found."));
                    }
                } else {
                    http_response_code(500);
                    echo json_encode(array("message" => "Unable to delete user."));
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(array("message" => "Error deleting user.", "error" => $e->getMessage()));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "User ID is required."));
        }
    }

    public function getRolesSimple() {
        // Check authentication with JWT
        if (!$this->authMiddleware->requireAuth()) {
            return;
        }

        $userData = $this->authMiddleware->getCurrentUser();
        if (!$userData || $userData['role'] > 2) {
            http_response_code(403);
            echo json_encode(['error' => 'Access denied']);
            return;
        }

        try {
            $roles = User::getAllRoles();
            http_response_code(200);
            echo json_encode($roles);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(array("message" => "Error fetching roles.", "error" => $e->getMessage()));
        }
    }

    public function getPendingUsers() {
        // Check authentication with JWT (moderators and admins)
        if (!$this->authMiddleware->requireModerator()) {
            return;
        }

        try {
            $query = "SELECT id, name, email, created_at FROM users WHERE status = 0 ORDER BY created_at DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();

            $users = array();
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                array_push($users, $row);
            }

            http_response_code(200);
            echo json_encode($users);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(array("message" => "Error fetching pending users.", "error" => $e->getMessage()));
        }
    }

    public function validateUser() {
        // Check authentication with JWT (moderators and admins)
        if (!$this->authMiddleware->requireModerator()) {
            return;
        }

        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->user_id) && !empty($data->action)) {
            try {
                $status = ($data->action === 'validate') ? 1 : 2; // 1 = validated, 2 = rejected

                $query = "UPDATE users SET status = :status WHERE id = :id";
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':status', $status);
                $stmt->bindParam(':id', $data->user_id);

                if ($stmt->execute()) {
                    if ($stmt->rowCount() > 0) {
                        $message = ($data->action === 'validate') ? 'User validated successfully.' : 'User rejected successfully.';
                        http_response_code(200);
                        echo json_encode(array("message" => $message));
                    } else {
                        http_response_code(404);
                        echo json_encode(array("message" => "User not found."));
                    }
                } else {
                    http_response_code(500);
                    echo json_encode(array("message" => "Unable to update user status."));
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(array("message" => "Error updating user status.", "error" => $e->getMessage()));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "User ID and action are required."));
        }
    }
}
?>
