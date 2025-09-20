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
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/env.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthMiddleware {
    private $database;
    private $user;
    private $jwtSecret;
    private $jwtExpiry;

    public function __construct($database) {
        $this->database = $database;
        require_once __DIR__ . '/../models/User.php';
        $this->user = new User($database->getConnection(), $database);

        // Load JWT configuration
        $this->jwtSecret = $_ENV['JWT_SECRET'] ?? 'your-super-secret-jwt-key-change-this-in-production-32-chars-min';
        $this->jwtExpiry = $_ENV['JWT_EXPIRY'] ?? 3600;
    }

    /**
     * Check if user has required role or higher
     * @param int $requiredRole - minimum role required (1=admin, 2=moderator, 3=reader)
     * @param array $userData - user data from session/token
     * @return bool
     */
    public function hasRole($requiredRole, $userData) {
        if (!$userData || !isset($userData['role'])) {
            return false;
        }

        // Lower numbers = higher privileges (1=admin, 2=moderator, 3=reader)
        return $userData['role'] <= $requiredRole;
    }

    /**
     * Generate JWT token for user
     * @param array $userData
     * @return string
     */
    public function generateToken($userData) {
        $payload = [
            'iss' => 'animalineage-app',
            'iat' => time(),
            'exp' => time() + $this->jwtExpiry,
            'user' => [
                'id' => $userData['id'],
                'email' => $userData['email'],
                'role' => $userData['role'],
                'name' => $userData['name']
            ]
        ];

        return JWT::encode($payload, $this->jwtSecret, 'HS256');
    }

    /**
     * Verify and decode JWT token
     * @param string $token
     * @return array|false
     */
    public function verifyToken($token) {
        try {
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
            return (array) $decoded->user;
        } catch (Exception $e) {
            error_log("JWT verification failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if user is authenticated and has the required role
     * @param int $requiredRole
     * @return array|false - returns user data if authorized, false otherwise
     */
    public function authorize($requiredRole = User::ROLE_READER) {
        $headers = getallheaders();

        // Check for JWT token in Authorization header
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                $token = $matches[1];
                $userData = $this->verifyToken($token);

                if ($userData && $this->hasRole($requiredRole, $userData)) {
                    return $userData;
                }
            }
        }

        return false;
    }

    /**
     * Middleware function that checks authorization and returns appropriate response
     * @param int $requiredRole
     * @return bool - true if authorized, false if not (sends HTTP response)
     */
    public function requireRole($requiredRole = User::ROLE_READER) {
        $userData = $this->authorize($requiredRole);

        if (!$userData) {
            $this->sendUnauthorizedResponse();
            return false;
        }

        return true;
    }

    /**
     * Check if user is admin
     */
    public function requireAdmin() {
        return $this->requireRole(User::ROLE_ADMIN);
    }

    /**
     * Check if user is moderator or admin
     */
    public function requireModerator() {
        return $this->requireRole(User::ROLE_MODERATOR);
    }

    /**
     * Check if user is reader, moderator or admin (any authenticated user)
     */
    public function requireAuth() {
        return $this->requireRole(User::ROLE_READER);
    }

    /**
     * Get current user data
     */
    public function getCurrentUser() {
        return $this->authorize(User::ROLE_READER);
    }

    /**
     * Refresh JWT token
     * @param string $token
     * @return string|false
     */
    public function refreshToken($token) {
        $userData = $this->verifyToken($token);
        if ($userData) {
            return $this->generateToken($userData);
        }
        return false;
    }

    /**
     * Send unauthorized response
     */
    private function sendUnauthorizedResponse() {
        http_response_code(403);
        echo json_encode([
            'error' => 'Access denied',
            'message' => 'You do not have sufficient permissions to access this resource.'
        ]);
    }

    /**
     * Get role name for display
     */
    public static function getRoleName($roleId) {
        return User::getRoleName($roleId);
    }

    /**
     * Check if one role can manage another
     * @param int $managerRole - role of the user trying to manage
     * @param int $targetRole - role being managed
     * @return bool
     */
    public static function canManageRole($managerRole, $targetRole) {
        // Admins can manage everyone
        if ($managerRole == User::ROLE_ADMIN) {
            return true;
        }

        // Moderators can manage readers but not other moderators or admins
        if ($managerRole == User::ROLE_MODERATOR) {
            return $targetRole == User::ROLE_READER;
        }

        // Readers can't manage anyone
        return false;
    }
}
?>
