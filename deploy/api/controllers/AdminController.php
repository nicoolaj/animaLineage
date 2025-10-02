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

class AdminController {
    private $user;
    private $authMiddleware;
    private $conn;

    public function __construct(User $user, $database) {
        $this->user = $user;
        $this->conn = $database->getConnection();
        $this->authMiddleware = new AuthMiddleware($database);
    }

    public function getAllUsers() {
        // Require moderator role or higher
        if (!$this->authMiddleware->requireModerator()) {
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
                    "created_at" => $row['created_at']
                );
                array_push($users, $user_item);
            }

            http_response_code(200);
            echo json_encode($users);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(array("message" => "Error fetching users."));
        }
    }

    public function updateUserRole() {
        // Require admin role
        if (!$this->authMiddleware->requireAdmin()) {
            return;
        }

        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->user_id) && isset($data->new_role)) {
            // Validate role
            if (!in_array($data->new_role, [User::ROLE_ADMIN, User::ROLE_MODERATOR, User::ROLE_READER])) {
                http_response_code(400);
                echo json_encode(array("message" => "Invalid role specified."));
                return;
            }

            try {
                // Get the target user
                $query = "SELECT id, name, email, role FROM users WHERE id = :id";
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':id', $data->user_id);
                $stmt->execute();
                $targetUser = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$targetUser) {
                    http_response_code(404);
                    echo json_encode(array("message" => "User not found."));
                    return;
                }

                // Update role
                $updateQuery = "UPDATE users SET role = :role WHERE id = :id";
                $updateStmt = $this->conn->prepare($updateQuery);
                $updateStmt->bindParam(':role', $data->new_role);
                $updateStmt->bindParam(':id', $data->user_id);

                if ($updateStmt->execute()) {
                    http_response_code(200);
                    echo json_encode(array(
                        "message" => "User role updated successfully.",
                        "user" => array(
                            "id" => $targetUser['id'],
                            "name" => $targetUser['name'],
                            "email" => $targetUser['email'],
                            "role" => $data->new_role,
                            "role_name" => User::getRoleName($data->new_role)
                        )
                    ));
                } else {
                    http_response_code(500);
                    echo json_encode(array("message" => "Failed to update user role."));
                }

            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(array("message" => "Error updating user role."));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "User ID and new role are required."));
        }
    }

    public function getRoles() {
        // Require moderator role or higher
        if (!$this->authMiddleware->requireModerator()) {
            return;
        }

        $roles = User::getAllRoles();
        http_response_code(200);
        echo json_encode($roles);
    }

    public function deleteUser() {
        // Require admin role
        if (!$this->authMiddleware->requireAdmin()) {
            return;
        }

        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->user_id)) {
            try {
                $currentUser = $this->authMiddleware->getCurrentUser();

                // Prevent admin from deleting themselves
                if ($currentUser && $currentUser['id'] == $data->user_id) {
                    http_response_code(400);
                    echo json_encode(array("message" => "You cannot delete your own account."));
                    return;
                }

                $query = "DELETE FROM users WHERE id = :id";
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':id', $data->user_id);

                if ($stmt->execute() && $stmt->rowCount() > 0) {
                    http_response_code(200);
                    echo json_encode(array("message" => "User deleted successfully."));
                } else {
                    http_response_code(404);
                    echo json_encode(array("message" => "User not found."));
                }

            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(array("message" => "Error deleting user."));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "User ID is required."));
        }
    }
}
?>
