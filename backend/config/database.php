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
require_once __DIR__ . '/config.php';

class Database {
    private $conn;

    public function getConnection() {
        if ($this->conn !== null) {
            return $this->conn;
        }

        Config::load();
        $driver = Config::get('DB_DRIVER', 'sqlite');

        try {
            switch ($driver) {
                case 'sqlite':
                    $this->conn = $this->getSQLiteConnection();
                    break;

                case 'mysql':
                    $this->conn = $this->getMySQLConnection();
                    break;

                case 'pgsql':
                    $this->conn = $this->getPostgreSQLConnection();
                    break;

                default:
                    throw new Exception("Unsupported database driver: " . $driver);
            }

            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        } catch(PDOException $exception) {
            echo json_encode(['error' => 'Connection failed: ' . $exception->getMessage()]);
            exit();
        } catch(Exception $exception) {
            echo json_encode(['error' => 'Configuration error: ' . $exception->getMessage()]);
            exit();
        }

        return $this->conn;
    }

    private function getSQLiteConnection() {
        $dbPath = Config::get('DB_PATH', 'database/animalineage.db');

        // Create database directory if it doesn't exist
        $dbDir = dirname(__DIR__ . '/' . $dbPath);
        if (!is_dir($dbDir)) {
            mkdir($dbDir, 0755, true);
        }

        $fullPath = __DIR__ . '/../' . $dbPath;
        return new PDO("sqlite:" . $fullPath);
    }

    private function getMySQLConnection() {
        $host = Config::get('DB_HOST', 'localhost');
        $dbname = Config::get('DB_NAME', 'webapp_db');
        $username = Config::get('DB_USER', 'root');
        $password = Config::get('DB_PASS', '');

        $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
        return new PDO($dsn, $username, $password);
    }

    private function getPostgreSQLConnection() {
        $host = Config::get('DB_HOST', 'localhost');
        $port = Config::get('DB_PORT', '5432');
        $dbname = Config::get('DB_NAME', 'webapp_db');
        $username = Config::get('DB_USER', 'postgres');
        $password = Config::get('DB_PASS', '');

        $dsn = "pgsql:host={$host};port={$port};dbname={$dbname}";
        return new PDO($dsn, $username, $password);
    }

    public function getDriver() {
        return Config::get('DB_DRIVER', 'sqlite');
    }
}
?>
