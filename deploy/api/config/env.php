<?php
/**
 * Simple .env file loader
 */
class EnvLoader {
    public static function load($path) {
        if (!file_exists($path)) {
            return false;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        foreach ($lines as $line) {
            // Skip comments
            if (strpos(trim($line), '#') === 0) {
                continue;
            }

            // Parse key=value
            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);

                // Remove quotes if present
                if (preg_match('/^"(.*)"$/', $value, $matches)) {
                    $value = $matches[1];
                } elseif (preg_match("/^'(.*)'$/", $value, $matches)) {
                    $value = $matches[1];
                }

                // Set in $_ENV
                $_ENV[$key] = $value;
                putenv("$key=$value");
            }
        }

        return true;
    }

    public static function loadArray($envArray) {
        foreach ($envArray as $key => $value) {
            $_ENV[$key] = $value;
            putenv("$key=$value");
        }
        return true;
    }
}
?>