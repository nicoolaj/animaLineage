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
// Migration script to add password column to existing users table

require_once __DIR__ . '/../config/database.php';

class AddPasswordColumnMigration {
    private $conn;
    private $database;

    public function __construct() {
        $this->database = new Database();
        $this->conn = $this->database->getConnection();
    }

    public function run() {
        echo "Starting migration: Adding password column to users table...\n";

        try {
            // Check if password column already exists
            if ($this->columnExists('password')) {
                echo "Password column already exists. Migration skipped.\n";
                return true;
            }

            // Add password column based on database driver
            $driver = $this->database->getDriver();
            $success = false;

            switch ($driver) {
                case 'sqlite':
                    $success = $this->addPasswordColumnSQLite();
                    break;
                case 'mysql':
                    $success = $this->addPasswordColumnMySQL();
                    break;
                case 'pgsql':
                    $success = $this->addPasswordColumnPostgreSQL();
                    break;
                default:
                    throw new Exception("Unsupported database driver: " . $driver);
            }

            if ($success) {
                echo "Migration completed successfully!\n";
                echo "Password column added to users table.\n";
                return true;
            } else {
                echo "Migration failed.\n";
                return false;
            }

        } catch (Exception $e) {
            echo "Migration error: " . $e->getMessage() . "\n";
            return false;
        }
    }

    private function columnExists($columnName) {
        $driver = $this->database->getDriver();

        try {
            switch ($driver) {
                case 'sqlite':
                    $stmt = $this->conn->prepare("PRAGMA table_info(users)");
                    $stmt->execute();
                    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    foreach ($columns as $column) {
                        if ($column['name'] === $columnName) {
                            return true;
                        }
                    }
                    return false;

                case 'mysql':
                    $stmt = $this->conn->prepare("SHOW COLUMNS FROM users LIKE ?");
                    $stmt->execute([$columnName]);
                    return $stmt->rowCount() > 0;

                case 'pgsql':
                    $stmt = $this->conn->prepare("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = ?");
                    $stmt->execute([$columnName]);
                    return $stmt->rowCount() > 0;

                default:
                    return false;
            }
        } catch (Exception $e) {
            return false;
        }
    }

    private function addPasswordColumnSQLite() {
        $query = "ALTER TABLE users ADD COLUMN password TEXT";
        return $this->conn->exec($query) !== false;
    }

    private function addPasswordColumnMySQL() {
        $query = "ALTER TABLE users ADD COLUMN password VARCHAR(255)";
        return $this->conn->exec($query) !== false;
    }

    private function addPasswordColumnPostgreSQL() {
        $query = "ALTER TABLE users ADD COLUMN password VARCHAR(255)";
        return $this->conn->exec($query) !== false;
    }
}

// Run migration if called directly
if (basename(__FILE__) === basename($_SERVER['SCRIPT_NAME'])) {
    $migration = new AddPasswordColumnMigration();
    $success = $migration->run();
    exit($success ? 0 : 1);
}
?>
