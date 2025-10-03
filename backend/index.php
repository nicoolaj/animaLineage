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

// Load environment variables
require_once 'config/env.php';
EnvLoader::load(__DIR__ . '/.env');

// CORS configuration from environment
$allowedOrigins = $_ENV['CORS_ALLOWED_ORIGINS'] ?? 'http://localhost:3002';
header('Access-Control-Allow-Origin: ' . $allowedOrigins);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-User-Data');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config/database.php';
require_once 'models/User.php';
require_once 'controllers/UserController.php';
require_once 'controllers/AuthController.php';
require_once 'controllers/AdminController.php';
require_once 'controllers/SimpleAdminController.php';
require_once 'controllers/ElevageController.php';
require_once 'controllers/AnimalController.php';
require_once 'controllers/TransferRequestController.php';
require_once 'controllers/ConfigController.php';
require_once 'middleware/AuthMiddleware.php';

$database = new Database();
$db = $database->getConnection();

$user = new User($db, $database);
$userController = new UserController($user, $database);
$authController = new AuthController($user, $database);
$adminController = new AdminController($user, $database);
$simpleAdminController = new SimpleAdminController($user, $database);
$elevageController = new ElevageController($database);
$animalController = new AnimalController($db, $database);
$transferRequestController = new TransferRequestController($db, $database);
$configController = new ConfigController();
$authMiddleware = new AuthMiddleware($database);

$request_method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path_parts = explode('/', trim($path, '/'));

if (isset($path_parts[0]) && $path_parts[0] === 'api') {
    // Test endpoint: /api/ping
    if (isset($path_parts[1]) && $path_parts[1] === 'ping') {
        if ($request_method === 'GET') {
            http_response_code(200);
            echo json_encode([
                'status' => 'success',
                'message' => 'pong',
                'timestamp' => date('c'),
                'server' => $_SERVER['SERVER_NAME'] ?? 'unknown'
            ]);
        } else {
            http_response_code(405);
            echo json_encode(['message' => 'Method not allowed']);
        }
    } elseif (isset($path_parts[1]) && $path_parts[1] === 'users') {
        switch ($request_method) {
            case 'GET':
                $userController->getUsers();
                break;
            case 'POST':
                $userController->createUser();
                break;
            default:
                http_response_code(405);
                echo json_encode(['message' => 'Method not allowed']);
                break;
        }
    } elseif (isset($path_parts[1]) && $path_parts[1] === 'auth') {
        if (isset($path_parts[2])) {
            switch ($path_parts[2]) {
                case 'login':
                    if ($request_method === 'POST') {
                        $authController->login();
                    } else {
                        http_response_code(405);
                        echo json_encode(['message' => 'Method not allowed']);
                    }
                    break;
                case 'register':
                    if ($request_method === 'POST') {
                        $authController->register();
                    } else {
                        http_response_code(405);
                        echo json_encode(['message' => 'Method not allowed']);
                    }
                    break;
                case 'me':
                    if ($request_method === 'GET') {
                        $authController->getCurrentUser();
                    } else {
                        http_response_code(405);
                        echo json_encode(['message' => 'Method not allowed']);
                    }
                    break;
                default:
                    http_response_code(404);
                    echo json_encode(['message' => 'Auth endpoint not found']);
                    break;
            }
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Auth endpoint not specified']);
        }
    } elseif (isset($path_parts[1]) && $path_parts[1] === 'config') {
        if (isset($path_parts[2])) {
            switch ($path_parts[2]) {
                case 'advertising':
                    if ($request_method === 'GET') {
                        $configController->getAdvertisingConfig();
                    } else {
                        http_response_code(405);
                        echo json_encode(['message' => 'Method not allowed']);
                    }
                    break;
                case 'public':
                    if ($request_method === 'GET') {
                        $configController->getPublicConfig();
                    } else {
                        http_response_code(405);
                        echo json_encode(['message' => 'Method not allowed']);
                    }
                    break;
                default:
                    http_response_code(404);
                    echo json_encode(['message' => 'Config endpoint not found']);
                    break;
            }
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Config endpoint not specified']);
        }
    } elseif (isset($path_parts[1]) && $path_parts[1] === 'admin') {
        if (isset($path_parts[2])) {
            switch ($path_parts[2]) {
                case 'users':
                    if ($request_method === 'GET') {
                        $adminController->getAllUsers();
                    } else {
                        http_response_code(405);
                        echo json_encode(['message' => 'Method not allowed']);
                    }
                    break;
                case 'update-role':
                    if ($request_method === 'POST') {
                        $adminController->updateUserRole();
                    } else {
                        http_response_code(405);
                        echo json_encode(['message' => 'Method not allowed']);
                    }
                    break;
                case 'roles':
                    if ($request_method === 'GET') {
                        $adminController->getRoles();
                    } else {
                        http_response_code(405);
                        echo json_encode(['message' => 'Method not allowed']);
                    }
                    break;
                case 'delete-user':
                    if ($request_method === 'DELETE') {
                        $adminController->deleteUser();
                    } else {
                        http_response_code(405);
                        echo json_encode(['message' => 'Method not allowed']);
                    }
                    break;
                default:
                    http_response_code(404);
                    echo json_encode(['message' => 'Admin endpoint not found']);
                    break;
            }
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Admin endpoint not specified']);
        }
    } elseif (isset($path_parts[1]) && $path_parts[1] === 'simple-admin') {
        if (isset($path_parts[2])) {
            switch ($path_parts[2]) {
                case 'users':
                    if ($request_method === 'GET') {
                        $simpleAdminController->getAllUsersSimple();
                    } else {
                        http_response_code(405);
                        echo json_encode(['message' => 'Method not allowed']);
                    }
                    break;
                case 'update-role':
                    if ($request_method === 'POST') {
                        $simpleAdminController->updateUserRoleSimple();
                    } else {
                        http_response_code(405);
                        echo json_encode(['message' => 'Method not allowed']);
                    }
                    break;
                case 'roles':
                    if ($request_method === 'GET') {
                        $simpleAdminController->getRolesSimple();
                    } else {
                        http_response_code(405);
                        echo json_encode(['message' => 'Method not allowed']);
                    }
                    break;
                case 'delete-user':
                    if ($request_method === 'DELETE') {
                        $simpleAdminController->deleteUserSimple();
                    } else {
                        http_response_code(405);
                        echo json_encode(['message' => 'Method not allowed']);
                    }
                    break;
                case 'pending-users':
                    if ($request_method === 'GET') {
                        $simpleAdminController->getPendingUsers();
                    } else {
                        http_response_code(405);
                        echo json_encode(['message' => 'Method not allowed']);
                    }
                    break;
                case 'validate-user':
                    if ($request_method === 'POST') {
                        $simpleAdminController->validateUser();
                    } else {
                        http_response_code(405);
                        echo json_encode(['message' => 'Method not allowed']);
                    }
                    break;
                default:
                    http_response_code(404);
                    echo json_encode(['message' => 'Simple admin endpoint not found']);
                    break;
            }
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Simple admin endpoint not specified']);
        }
    } elseif (isset($path_parts[1]) && $path_parts[1] === 'elevages') {
        // Routes pour les élevages
        if (isset($path_parts[2])) {
            $elevage_id = $path_parts[2];

            // Routes pour la gestion des utilisateurs d'un élevage
            if (isset($path_parts[3]) && $path_parts[3] === 'users') {
                if (isset($path_parts[4])) {
                    // DELETE /api/elevages/{id}/users/{userId}
                    $user_id = $path_parts[4];
                    switch ($request_method) {
                        case 'DELETE':
                            $elevageController->removeUserFromElevage($elevage_id, $user_id);
                            break;
                        default:
                            http_response_code(405);
                            echo json_encode(['message' => 'Method not allowed']);
                            break;
                    }
                } else {
                    // GET/POST /api/elevages/{id}/users
                    switch ($request_method) {
                        case 'GET':
                            $elevageController->getElevageUsers($elevage_id);
                            break;
                        case 'POST':
                            $elevageController->addUserToElevage($elevage_id);
                            break;
                        default:
                            http_response_code(405);
                            echo json_encode(['message' => 'Method not allowed']);
                            break;
                    }
                }
            } else {
                // Routes CRUD standards pour les élevages
                switch ($request_method) {
                    case 'GET':
                        $elevageController->getElevage($elevage_id);
                        break;
                    case 'PUT':
                        $elevageController->updateElevage($elevage_id);
                        break;
                    case 'DELETE':
                        $elevageController->deleteElevage($elevage_id);
                        break;
                    default:
                        http_response_code(405);
                        echo json_encode(['message' => 'Method not allowed']);
                        break;
                }
            }
        } else {
            switch ($request_method) {
                case 'GET':
                    // Paramètre pour récupérer seulement ses élevages
                    if (isset($_GET['my']) && $_GET['my'] === 'true') {
                        $elevageController->getMyElevages();
                    } else {
                        $elevageController->getAllElevages();
                    }
                    break;
                case 'POST':
                    $elevageController->createElevage();
                    break;
                default:
                    http_response_code(405);
                    echo json_encode(['message' => 'Method not allowed']);
                    break;
            }
        }
    } elseif (isset($path_parts[1]) && $path_parts[1] === 'types-animaux') {
        // Routes pour les types d'animaux - nécessitent authentification Admin
        $currentUser = $authMiddleware->getCurrentUser();
        if (!$currentUser) {
            http_response_code(401);
            echo json_encode(['message' => 'Authentification requise']);
            return;
        }

        if ($currentUser['role'] !== 1) {
            http_response_code(403);
            echo json_encode(['message' => 'Accès réservé aux administrateurs']);
            return;
        }

        if (isset($path_parts[2])) {
            $type_id = $path_parts[2];
            switch ($request_method) {
                case 'PUT':
                    $elevageController->updateTypeAnimal($type_id);
                    break;
                case 'DELETE':
                    $elevageController->deleteTypeAnimal($type_id);
                    break;
                default:
                    http_response_code(405);
                    echo json_encode(['message' => 'Method not allowed']);
                    break;
            }
        } else {
            switch ($request_method) {
                case 'GET':
                    $elevageController->getTypesAnimaux();
                    break;
                case 'POST':
                    $elevageController->createTypeAnimal();
                    break;
                default:
                    http_response_code(405);
                    echo json_encode(['message' => 'Method not allowed']);
                    break;
            }
        }
    } elseif (isset($path_parts[1]) && $path_parts[1] === 'races') {
        // Routes pour les races - nécessitent authentification Admin
        $currentUser = $authMiddleware->getCurrentUser();
        if (!$currentUser) {
            http_response_code(401);
            echo json_encode(['message' => 'Authentification requise']);
            return;
        }

        if ($currentUser['role'] !== 1) {
            http_response_code(403);
            echo json_encode(['message' => 'Accès réservé aux administrateurs']);
            return;
        }

        if (isset($path_parts[2])) {
            $race_id = $path_parts[2];
            switch ($request_method) {
                case 'PUT':
                    $elevageController->updateRace($race_id);
                    break;
                case 'DELETE':
                    $elevageController->deleteRace($race_id);
                    break;
                default:
                    http_response_code(405);
                    echo json_encode(['message' => 'Method not allowed']);
                    break;
            }
        } else {
            switch ($request_method) {
                case 'GET':
                    if (isset($_GET['type_id'])) {
                        $elevageController->getRacesByType($_GET['type_id']);
                    } else {
                        $elevageController->getRaces();
                    }
                    break;
                case 'POST':
                    $elevageController->createRace();
                    break;
                default:
                    http_response_code(405);
                    echo json_encode(['message' => 'Method not allowed']);
                    break;
            }
        }
    } elseif (isset($path_parts[1]) && $path_parts[1] === 'animaux') {
        // Routes pour les animaux - nécessitent une authentification
        $currentUser = $authMiddleware->getCurrentUser();
        if (!$currentUser) {
            http_response_code(401);
            echo json_encode(['message' => 'Authentification requise']);
            return;
        }

        $user_id = $currentUser['id'];
        $user_role = $currentUser['role'];

        if (isset($path_parts[2])) {
            $animal_id = $path_parts[2];

            if (isset($path_parts[3])) {
                // Routes spéciales pour un animal
                switch ($path_parts[3]) {
                    case 'descendants':
                        if ($request_method === 'GET') {
                            $animalController->getDescendants($animal_id, $user_id, $user_role);
                        } else {
                            http_response_code(405);
                            echo json_encode(['message' => 'Method not allowed']);
                        }
                        break;
                    case 'stats-reproduction':
                        if ($request_method === 'GET') {
                            $animalController->getStatsReproduction($animal_id, $user_id, $user_role);
                        } else {
                            http_response_code(405);
                            echo json_encode(['message' => 'Method not allowed']);
                        }
                        break;
                    case 'deces':
                        if ($request_method === 'POST') {
                            $data = json_decode(file_get_contents('php://input'), true);
                            $animalController->marquerDeces($animal_id, $data, $user_id, $user_role);
                        } else {
                            http_response_code(405);
                            echo json_encode(['message' => 'Method not allowed']);
                        }
                        break;
                    default:
                        http_response_code(404);
                        echo json_encode(['message' => 'Animal endpoint not found']);
                        break;
                }
            } else {
                // CRUD pour un animal spécifique
                switch ($request_method) {
                    case 'GET':
                        $animalController->getAnimal($animal_id, $user_id, $user_role);
                        break;
                    case 'PUT':
                        $data = json_decode(file_get_contents('php://input'), true);
                        $animalController->updateAnimal($animal_id, $data, $user_id, $user_role);
                        break;
                    case 'DELETE':
                        $animalController->deleteAnimal($animal_id, $user_id, $user_role);
                        break;
                    default:
                        http_response_code(405);
                        echo json_encode(['message' => 'Method not allowed']);
                        break;
                }
            }
        } else {
            // Routes générales pour les animaux
            // Vérifier si c'est la route de vérification
            if (isset($_GET['check']) && isset($_GET['identifiant'])) {
                if ($request_method === 'GET') {
                    $animalController->checkAnimalExists($_GET['identifiant'], $user_id, $user_role);
                } else {
                    http_response_code(405);
                    echo json_encode(['message' => 'Method not allowed']);
                }
                return;
            }

            switch ($request_method) {
                case 'GET':
                    $animalController->getAnimaux($user_id, $user_role);
                    break;
                case 'POST':
                    $data = json_decode(file_get_contents('php://input'), true);
                    $animalController->createAnimal($data, $user_id, $user_role);
                    break;
                default:
                    http_response_code(405);
                    echo json_encode(['message' => 'Method not allowed']);
                    break;
            }
        }
    } elseif (isset($path_parts[1]) && $path_parts[1] === 'transfer-requests') {
        // Routes pour les demandes de transfert - nécessitent une authentification
        $currentUser = $authMiddleware->getCurrentUser();
        if (!$currentUser) {
            http_response_code(401);
            echo json_encode(['message' => 'Authentification requise']);
            return;
        }

        $user_id = $currentUser['id'];
        $user_role = $currentUser['role'];

        if (isset($path_parts[2])) {
            $request_id = $path_parts[2];

            // Traiter une demande spécifique
            switch ($request_method) {
                case 'PUT':
                    $data = json_decode(file_get_contents('php://input'), true);
                    $transferRequestController->processTransferRequest($request_id, $data, $user_id, $user_role);
                    break;
                default:
                    http_response_code(405);
                    echo json_encode(['message' => 'Method not allowed']);
                    break;
            }
        } else {
            // Routes générales pour les demandes de transfert
            switch ($request_method) {
                case 'GET':
                    $transferRequestController->getTransferRequests($user_id, $user_role);
                    break;
                case 'POST':
                    $data = json_decode(file_get_contents('php://input'), true);
                    $transferRequestController->createTransferRequest($data, $user_id, $user_role);
                    break;
                default:
                    http_response_code(405);
                    echo json_encode(['message' => 'Method not allowed']);
                    break;
            }
        }
    } else {
        http_response_code(404);
        echo json_encode(['message' => 'Endpoint not found']);
    }
} else {
    http_response_code(404);
    echo json_encode(['message' => 'API endpoint not found']);
}
?>
