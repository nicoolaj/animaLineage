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
class Config {
    private static $config = null;

    public static function load() {
        if (self::$config === null) {
            self::$config = [];

            // Load .env file if it exists
            $envFile = __DIR__ . '/../.env';
            if (file_exists($envFile)) {
                $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                foreach ($lines as $line) {
                    if (strpos(trim($line), '#') === 0) {
                        continue; // Skip comments
                    }

                    list($name, $value) = explode('=', $line, 2);
                    $name = trim($name);
                    $value = trim($value);

                    // Remove quotes if present
                    if (preg_match('/^["\'](.*)["\']\z/', $value, $matches)) {
                        $value = $matches[1];
                    }

                    self::$config[$name] = $value;
                }
            }
        }

        return self::$config;
    }

    public static function get($key, $default = null) {
        $config = self::load();
        return isset($config[$key]) ? $config[$key] : $default;
    }

    public static function isDevelopment() {
        return self::get('APP_ENV', 'development') === 'development';
    }

    public static function isProduction() {
        return self::get('APP_ENV', 'development') === 'production';
    }
}
?>
