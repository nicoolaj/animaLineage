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

class UserController {
    private $user;
    private $authMiddleware;

    public function __construct(User $user, $database = null) {
        $this->user = $user;
        if ($database) {
            $this->authMiddleware = new AuthMiddleware($database);
        }
    }

    public function getUsers() {
        // Require authentication to view users
        if ($this->authMiddleware && !$this->authMiddleware->requireAuth()) {
            return;
        }

        $stmt = $this->user->getAll();
        $users = array();

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $user_item = array(
                "id" => $row['id'],
                "name" => $row['name'],
                "email" => $row['email'],
                "created_at" => $row['created_at']
            );
            array_push($users, $user_item);
        }

        http_response_code(200);
        echo json_encode($users);
    }

    public function createUser() {
        // Require admin role to create users
        if ($this->authMiddleware && !$this->authMiddleware->requireAdmin()) {
            return;
        }

        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->name) && !empty($data->email)) {
            if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(array("message" => "Invalid email format."));
                return;
            }

            $this->user->name = $data->name;
            $this->user->email = $data->email;

            if ($this->user->emailExists()) {
                http_response_code(409);
                echo json_encode(array("message" => "Email already exists."));
                return;
            }

            if ($this->user->create()) {
                http_response_code(201);
                echo json_encode(array(
                    "message" => "User created successfully.",
                    "user" => array(
                        "id" => $this->user->id,
                        "name" => $this->user->name,
                        "email" => $this->user->email
                    )
                ));
            } else {
                http_response_code(500);
                echo json_encode(array("message" => "Unable to create user."));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Name and email are required."));
        }
    }
}
?>
