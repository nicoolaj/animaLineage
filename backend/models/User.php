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
class User {
    private $conn;
    private $database;
    private $table_name = "users";

    // Role constants
    const ROLE_ADMIN = 1;
    const ROLE_MODERATOR = 2;
    const ROLE_READER = 3;

    public $id;
    public $name;
    public $email;
    public $password;
    public $role;
    public $created_at;

    public function __construct($db, $database = null) {
        $this->conn = $db;
        $this->database = $database;
        $this->createTableIfNotExists();
        $this->migratePasswordColumn();
    }

    private function createTableIfNotExists() {
        $driver = $this->database ? $this->database->getDriver() : 'sqlite';

        switch ($driver) {
            case 'sqlite':
                $query = "CREATE TABLE IF NOT EXISTS " . $this->table_name . " (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    password TEXT,
                    role INTEGER DEFAULT 3,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )";
                break;

            case 'mysql':
                $query = "CREATE TABLE IF NOT EXISTS " . $this->table_name . " (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) NOT NULL UNIQUE,
                    password VARCHAR(255),
                    role TINYINT DEFAULT 3 COMMENT '1=admin, 2=moderator, 3=reader',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
                break;

            case 'pgsql':
                $query = "CREATE TABLE IF NOT EXISTS " . $this->table_name . " (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) NOT NULL UNIQUE,
                    password VARCHAR(255),
                    role SMALLINT DEFAULT 3,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )";
                break;

            default:
                throw new Exception("Unsupported database driver for table creation: " . $driver);
        }

        try {
            $this->conn->exec($query);
        } catch(PDOException $exception) {
            error_log("Table creation failed: " . $exception->getMessage());
        }
    }

    public function getAll() {
        $query = "SELECT id, name, email, role, created_at, status FROM " . $this->table_name . " ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " (name, email) VALUES (:name, :email)";
        $stmt = $this->conn->prepare($query);

        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->email = htmlspecialchars(strip_tags($this->email));

        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":email", $this->email);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    public function emailExists() {
        try {
            $query = "SELECT id FROM " . $this->table_name . " WHERE email = :email LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':email', $this->email);
            $stmt->execute();

            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Error checking email existence: " . $e->getMessage());
            return false; // On error, assume email doesn't exist to let the create method handle the duplicate
        }
    }

    public function createWithPassword() {
        try {
            $query = "INSERT INTO " . $this->table_name . " (name, email, password, status) VALUES (:name, :email, :password, 0)";
            $stmt = $this->conn->prepare($query);

            $this->name = htmlspecialchars(strip_tags($this->name));
            $this->email = htmlspecialchars(strip_tags($this->email));

            $stmt->bindParam(":name", $this->name);
            $stmt->bindParam(":email", $this->email);
            $stmt->bindParam(":password", $this->password);

            if ($stmt->execute()) {
                $this->id = $this->conn->lastInsertId();
                return true;
            }

            return false;
        } catch (PDOException $e) {
            // Re-throw the exception to be handled by the controller
            throw $e;
        }
    }

    public function getUserByEmail() {
        try {
            $query = "SELECT id, name, email, password, role, status FROM " . $this->table_name . " WHERE email = :email LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':email', $this->email);
            $stmt->execute();

            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($result) {
                return $result;
            }

            return false;
        } catch (PDOException $e) {
            error_log("getUserByEmail - Error: " . $e->getMessage());
            return false;
        }
    }

    private function migratePasswordColumn() {
        // Check if password column exists, if not add it
        if (!$this->columnExists('password')) {
            $this->addPasswordColumn();
        }

        // Check if role column exists, if not add it
        if (!$this->columnExists('role')) {
            $this->addRoleColumn();
        }
    }

    private function columnExists($columnName) {
        $driver = $this->database ? $this->database->getDriver() : 'sqlite';

        try {
            switch ($driver) {
                case 'sqlite':
                    $stmt = $this->conn->prepare("PRAGMA table_info(" . $this->table_name . ")");
                    $stmt->execute();
                    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    foreach ($columns as $column) {
                        if ($column['name'] === $columnName) {
                            return true;
                        }
                    }
                    return false;

                case 'mysql':
                    $stmt = $this->conn->prepare("SHOW COLUMNS FROM " . $this->table_name . " LIKE ?");
                    $stmt->execute([$columnName]);
                    return $stmt->rowCount() > 0;

                case 'pgsql':
                    $stmt = $this->conn->prepare("SELECT column_name FROM information_schema.columns WHERE table_name = ? AND column_name = ?");
                    $stmt->execute([$this->table_name, $columnName]);
                    return $stmt->rowCount() > 0;

                default:
                    return false;
            }
        } catch (Exception $e) {
            error_log("Error checking column existence: " . $e->getMessage());
            return false;
        }
    }

    private function addPasswordColumn() {
        $driver = $this->database ? $this->database->getDriver() : 'sqlite';

        try {
            switch ($driver) {
                case 'sqlite':
                    $query = "ALTER TABLE " . $this->table_name . " ADD COLUMN password TEXT";
                    break;
                case 'mysql':
                    $query = "ALTER TABLE " . $this->table_name . " ADD COLUMN password VARCHAR(255)";
                    break;
                case 'pgsql':
                    $query = "ALTER TABLE " . $this->table_name . " ADD COLUMN password VARCHAR(255)";
                    break;
                default:
                    throw new Exception("Unsupported database driver for migration: " . $driver);
            }

            $this->conn->exec($query);
            error_log("Password column added successfully to " . $this->table_name . " table");

        } catch (Exception $e) {
            error_log("Error adding password column: " . $e->getMessage());
        }
    }

    private function addRoleColumn() {
        $driver = $this->database ? $this->database->getDriver() : 'sqlite';

        try {
            switch ($driver) {
                case 'sqlite':
                    $query = "ALTER TABLE " . $this->table_name . " ADD COLUMN role INTEGER DEFAULT 3";
                    break;
                case 'mysql':
                    $query = "ALTER TABLE " . $this->table_name . " ADD COLUMN role TINYINT DEFAULT 3 COMMENT '1=admin, 2=moderator, 3=reader'";
                    break;
                case 'pgsql':
                    $query = "ALTER TABLE " . $this->table_name . " ADD COLUMN role SMALLINT DEFAULT 3";
                    break;
                default:
                    throw new Exception("Unsupported database driver for role migration: " . $driver);
            }

            $this->conn->exec($query);

            // Set default role for existing users
            $updateQuery = "UPDATE " . $this->table_name . " SET role = 3 WHERE role IS NULL";
            $this->conn->exec($updateQuery);

            error_log("Role column added successfully to " . $this->table_name . " table");

        } catch (Exception $e) {
            error_log("Error adding role column: " . $e->getMessage());
        }
    }

    // Role utility methods
    public static function getRoleName($roleId) {
        switch ($roleId) {
            case self::ROLE_ADMIN:
                return 'Administrateur';
            case self::ROLE_MODERATOR:
                return 'Modérateur';
            case self::ROLE_READER:
                return 'Lecteur';
            default:
                return 'Inconnu';
        }
    }

    public static function getAllRoles() {
        return [
            self::ROLE_ADMIN => 'Administrateur',
            self::ROLE_MODERATOR => 'Modérateur',
            self::ROLE_READER => 'Lecteur'
        ];
    }

    public function isAdmin() {
        return $this->role == self::ROLE_ADMIN;
    }

    public function isModerator() {
        return $this->role == self::ROLE_MODERATOR;
    }

    public function isReader() {
        return $this->role == self::ROLE_READER;
    }

    public function canModerate() {
        return $this->role <= self::ROLE_MODERATOR; // Admin and Moderator
    }

    public function canAdministrate() {
        return $this->role == self::ROLE_ADMIN;
    }

    public function updateRole($newRole) {
        if (!in_array($newRole, [self::ROLE_ADMIN, self::ROLE_MODERATOR, self::ROLE_READER])) {
            return false;
        }

        try {
            $query = "UPDATE " . $this->table_name . " SET role = :role WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':role', $newRole);
            $stmt->bindParam(':id', $this->id);

            if ($stmt->execute()) {
                $this->role = $newRole;
                return true;
            }
            return false;
        } catch (PDOException $e) {
            error_log("Error updating user role: " . $e->getMessage());
            return false;
        }
    }
}
?>
