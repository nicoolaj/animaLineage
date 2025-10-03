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

declare(strict_types=1);

require_once __DIR__ . '/../middleware/AuthMiddleware.php';

readonly class LoginRequest
{
    public function __construct(
        public string $email,
        public string $password
    ) {}
}

readonly class RegisterRequest
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password
    ) {}
}

class AuthController
{
    private readonly User $user;
    private readonly ?AuthMiddleware $authMiddleware;

    public function __construct(User $user, ?object $database = null)
    {
        $this->user = $user;
        $this->authMiddleware = $database ? new AuthMiddleware($database) : null;
    }

    public function login(): void
    {
        $data = json_decode(file_get_contents("php://input"));

        try {
            $request = new LoginRequest(
                email: $data->email ?? '',
                password: $data->password ?? ''
            );

            if (empty($request->email) || empty($request->password)) {
                throw new InvalidArgumentException("Email and password are required.");
            }
            $this->user->email = $data->email;
            $userData = $this->user->getUserByEmail();

            if ($userData && !empty($userData['password'])) {
                if (password_verify($data->password, $userData['password'])) {
                    // Generate JWT token
                    $token = $this->authMiddleware ? $this->authMiddleware->generateToken($userData) : null;

                    http_response_code(200);
                    echo json_encode(array(
                        "message" => "Login successful.",
                        "token" => $token,
                        "user" => array(
                            "id" => $userData['id'],
                            "name" => $userData['name'],
                            "email" => $userData['email'],
                            "role" => $userData['role'],
                            "role_name" => User::getRoleName($userData['role']),
                            "status" => $userData['status'] ?? 1
                        )
                    ));
                } else {
                    http_response_code(401);
                    echo json_encode(array("message" => "Invalid email or password."));
                }
            } else {
                http_response_code(401);
                echo json_encode(array("message" => "Invalid email or password."));
            }
        } catch (InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(array("message" => $e->getMessage()));
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(array("message" => "An error occurred during login."));
        }
    }

    public function register() {
        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->name) && !empty($data->email) && !empty($data->password)) {
            if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(array("message" => "Invalid email format."));
                return;
            }

            if (strlen($data->password) < 6) {
                http_response_code(400);
                echo json_encode(array("message" => "Password must be at least 6 characters long."));
                return;
            }

            $this->user->name = $data->name;
            $this->user->email = $data->email;
            $this->user->password = password_hash($data->password, PASSWORD_DEFAULT);

            if ($this->user->emailExists()) {
                http_response_code(409);
                echo json_encode(array("message" => "Email already exists."));
                return;
            }

            try {
                if ($this->user->createWithPassword()) {
                    // Get the created user with role information
                    $this->user->email = $data->email;
                    $userData = $this->user->getUserByEmail();

                    // Generate JWT token
                    $token = $this->authMiddleware ? $this->authMiddleware->generateToken($userData) : null;

                    http_response_code(201);
                    echo json_encode(array(
                        "message" => "User registered successfully.",
                        "token" => $token,
                        "user" => array(
                            "id" => $userData['id'],
                            "name" => $userData['name'],
                            "email" => $userData['email'],
                            "role" => $userData['role'],
                            "role_name" => User::getRoleName($userData['role']),
                            "status" => $userData['status'] ?? 0
                        )
                    ));
                } else {
                    http_response_code(500);
                    echo json_encode(array("message" => "Unable to register user."));
                }
            } catch (PDOException $e) {
                // Handle specific database errors
                if (strpos($e->getMessage(), 'UNIQUE constraint failed') !== false ||
                    strpos($e->getMessage(), 'Duplicate entry') !== false) {
                    http_response_code(409);
                    echo json_encode(array("message" => "Email already exists."));
                } else {
                    http_response_code(500);
                    echo json_encode(array("message" => "Database error occurred."));
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(array("message" => "An error occurred during registration."));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Name, email and password are required."));
        }
    }

    public function getCurrentUser() {
        $authMiddleware = new AuthMiddleware($this->database);
        $userData = $authMiddleware->authorize(User::ROLE_READER);

        if (!$userData) {
            http_response_code(401);
            echo json_encode(['message' => 'Non authentifié']);
            return;
        }

        // Récupérer les données complètes de l'utilisateur depuis la base de données
        $this->user->id = $userData['id'];
        $fullUserData = $this->user->readOne();

        if ($fullUserData) {
            http_response_code(200);
            echo json_encode([
                'status' => 'success',
                'user' => [
                    'id' => $fullUserData['id'],
                    'name' => $fullUserData['name'],
                    'email' => $fullUserData['email'],
                    'role' => $fullUserData['role'],
                    'role_name' => User::getRoleName($fullUserData['role']),
                    'status' => $fullUserData['status'] ?? 0,
                    'created_at' => $fullUserData['created_at']
                ]
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Utilisateur non trouvé']);
        }
    }
}
?>
