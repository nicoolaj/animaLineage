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

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class BackupController {
    private $database;
    private $auth;

    public function __construct() {
        $this->database = new Database();
        $this->auth = new AuthMiddleware();
    }

    public function createBackup() {
        // Vérifier l'authentification et les droits admin
        $user = $this->auth->checkAuth();
        if (!$user || $user['role'] > 1) { // Seuls les admin (role = 1) peuvent faire des sauvegardes
            http_response_code(403);
            echo json_encode(['message' => 'Accès refusé. Seuls les administrateurs peuvent créer des sauvegardes.']);
            return;
        }

        try {
            // Récupérer le type de base de données
            $driver = $this->database->getDriver();

            // Générer le nom de fichier avec timestamp
            $timestamp = time();
            $date = date('Y-m-d', $timestamp);

            $backupResult = $this->createBackupByDriver($driver, $date, $timestamp);

            if ($backupResult['success']) {
                // Enregistrer l'action dans les logs
                error_log("Sauvegarde créée avec succès par l'utilisateur {$user['id']}: {$backupResult['filename']}");

                echo json_encode([
                    'success' => true,
                    'message' => 'Sauvegarde créée avec succès',
                    'filename' => $backupResult['filename'],
                    'size' => $this->formatFileSize($backupResult['fileSize']),
                    'path' => $backupResult['path'],
                    'type' => $driver
                ]);
            } else {
                throw new Exception($backupResult['error']);
            }

        } catch (Exception $e) {
            error_log("Erreur lors de la création de la sauvegarde: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erreur lors de la création de la sauvegarde: ' . $e->getMessage()
            ]);
        }
    }

    private function createBackupByDriver($driver, $date, $timestamp) {
        switch ($driver) {
            case 'sqlite':
                return $this->createSQLiteBackup($date, $timestamp);

            case 'mysql':
                return $this->createMySQLBackup($date, $timestamp);

            case 'pgsql':
                return $this->createPostgreSQLBackup($date, $timestamp);

            default:
                throw new Exception("Type de base de données non supporté: " . $driver);
        }
    }

    private function createSQLiteBackup($date, $timestamp) {
        require_once __DIR__ . '/../config/config.php';
        Config::load();

        $dbPath = Config::get('DB_PATH', 'database/animalineage.db');
        $sourcePath = dirname(__DIR__) . '/' . $dbPath;

        if (!file_exists($sourcePath)) {
            return ['success' => false, 'error' => 'Fichier de base de données SQLite introuvable'];
        }

        $filename = "{$date}.{$timestamp}.db";
        $backupDir = dirname(__DIR__, 2) . '/sqlsave';

        // Créer le répertoire s'il n'existe pas
        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        $backupPath = $backupDir . '/' . $filename;

        // Copie simple pour SQLite
        if (copy($sourcePath, $backupPath)) {
            $fileSize = filesize($backupPath);
            return [
                'success' => true,
                'filename' => $filename,
                'path' => $backupPath,
                'fileSize' => $fileSize
            ];
        } else {
            return ['success' => false, 'error' => 'Échec de la copie du fichier SQLite'];
        }
    }

    private function createMySQLBackup($date, $timestamp) {
        require_once __DIR__ . '/../config/config.php';
        Config::load();

        $host = Config::get('DB_HOST', 'localhost');
        $dbname = Config::get('DB_NAME', 'webapp_db');
        $username = Config::get('DB_USER', 'root');
        $password = Config::get('DB_PASS', '');

        $filename = "{$date}.{$timestamp}.sql";
        $backupDir = dirname(__DIR__, 2) . '/sqlsave';

        // Créer le répertoire s'il n'existe pas
        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        $backupPath = $backupDir . '/' . $filename;

        // Construire la commande mysqldump
        $command = sprintf(
            'mysqldump --single-transaction --routines --triggers --host=%s --user=%s --password=%s %s > %s 2>&1',
            escapeshellarg($host),
            escapeshellarg($username),
            escapeshellarg($password),
            escapeshellarg($dbname),
            escapeshellarg($backupPath)
        );

        // Exécuter la commande
        $output = [];
        $returnCode = 0;
        exec($command, $output, $returnCode);

        if ($returnCode === 0 && file_exists($backupPath)) {
            $fileSize = filesize($backupPath);
            if ($fileSize > 0) {
                return [
                    'success' => true,
                    'filename' => $filename,
                    'path' => $backupPath,
                    'fileSize' => $fileSize
                ];
            } else {
                unlink($backupPath);
                return ['success' => false, 'error' => 'Le fichier de sauvegarde MySQL est vide'];
            }
        } else {
            $errorMessage = implode("\n", $output);
            return ['success' => false, 'error' => "Échec mysqldump: " . $errorMessage];
        }
    }

    private function createPostgreSQLBackup($date, $timestamp) {
        require_once __DIR__ . '/../config/config.php';
        Config::load();

        $host = Config::get('DB_HOST', 'localhost');
        $port = Config::get('DB_PORT', '5432');
        $dbname = Config::get('DB_NAME', 'webapp_db');
        $username = Config::get('DB_USER', 'postgres');
        $password = Config::get('DB_PASS', '');

        $filename = "{$date}.{$timestamp}.sql";
        $backupDir = dirname(__DIR__, 2) . '/sqlsave';

        // Créer le répertoire s'il n'existe pas
        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        $backupPath = $backupDir . '/' . $filename;

        // Définir les variables d'environnement pour PostgreSQL
        $envVars = [
            'PGPASSWORD' => $password
        ];

        $envString = '';
        foreach ($envVars as $key => $value) {
            $envString .= $key . '=' . escapeshellarg($value) . ' ';
        }

        // Construire la commande pg_dump
        $command = sprintf(
            '%spg_dump --host=%s --port=%s --username=%s --dbname=%s --verbose --clean --no-owner --no-acl --format=plain > %s 2>&1',
            $envString,
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            escapeshellarg($dbname),
            escapeshellarg($backupPath)
        );

        // Exécuter la commande
        $output = [];
        $returnCode = 0;
        exec($command, $output, $returnCode);

        if ($returnCode === 0 && file_exists($backupPath)) {
            $fileSize = filesize($backupPath);
            if ($fileSize > 0) {
                return [
                    'success' => true,
                    'filename' => $filename,
                    'path' => $backupPath,
                    'fileSize' => $fileSize
                ];
            } else {
                unlink($backupPath);
                return ['success' => false, 'error' => 'Le fichier de sauvegarde PostgreSQL est vide'];
            }
        } else {
            $errorMessage = implode("\n", $output);
            return ['success' => false, 'error' => "Échec pg_dump: " . $errorMessage];
        }
    }

    public function listBackups() {
        // Vérifier l'authentification et les droits admin
        $user = $this->auth->checkAuth();
        if (!$user || $user['role'] > 1) {
            http_response_code(403);
            echo json_encode(['message' => 'Accès refusé']);
            return;
        }

        try {
            $backupDir = dirname(__DIR__, 2) . '/sqlsave';
            $backups = [];

            // Créer le répertoire s'il n'existe pas
            if (!is_dir($backupDir)) {
                mkdir($backupDir, 0755, true);
            }

            // Rechercher les fichiers de sauvegarde SQL (MySQL/PostgreSQL)
            $sqlFiles = glob($backupDir . '/*.sql');

            // Rechercher les fichiers de sauvegarde SQLite
            $dbFiles = glob($backupDir . '/*.db');

            // Traiter tous les fichiers
            $allFiles = array_merge($sqlFiles, $dbFiles);

            foreach ($allFiles as $file) {
                $filename = basename($file);
                $extension = pathinfo($filename, PATHINFO_EXTENSION);

                // Vérifier si le nom correspond au format attendu
                if (preg_match('/^(\d{4}-\d{2}-\d{2})\.(\d+)\.(sql|db)$/', $filename, $matches)) {
                    $type = '';
                    switch ($extension) {
                        case 'sql':
                            $type = 'MySQL/PostgreSQL';
                            break;
                        case 'db':
                            $type = 'SQLite';
                            break;
                    }

                    $backups[] = [
                        'filename' => $filename,
                        'date' => $matches[1],
                        'timestamp' => $matches[2],
                        'extension' => $extension,
                        'type' => $type,
                        'size' => $this->formatFileSize(filesize($file)),
                        'created_at' => date('Y-m-d H:i:s', $matches[2])
                    ];
                }
            }

            // Trier par timestamp décroissant (plus récent en premier)
            usort($backups, function($a, $b) {
                return $b['timestamp'] - $a['timestamp'];
            });

            echo json_encode([
                'success' => true,
                'backups' => $backups
            ]);

        } catch (Exception $e) {
            error_log("Erreur lors de la liste des sauvegardes: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erreur lors de la récupération des sauvegardes'
            ]);
        }
    }

    private function formatFileSize($bytes) {
        if ($bytes >= 1073741824) {
            return round($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            return round($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return round($bytes / 1024, 2) . ' KB';
        } else {
            return $bytes . ' B';
        }
    }
}

// Gestion des routes
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $controller = new BackupController();
    $controller->createBackup();
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $controller = new BackupController();
    $controller->listBackups();
} else {
    http_response_code(405);
    echo json_encode(['message' => 'Méthode non autorisée']);
}
?>