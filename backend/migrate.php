<?php
// Manual migration script
// Usage: php migrate.php

echo "=== Database Migration Tool ===\n";
echo "Adding password column to users table...\n\n";

require_once 'migrations/add_password_column.php';

$migration = new AddPasswordColumnMigration();
$success = $migration->run();

if ($success) {
    echo "\n✅ Migration completed successfully!\n";
    echo "You can now use the authentication features.\n";
} else {
    echo "\n❌ Migration failed!\n";
    echo "Please check the error messages above.\n";
}

echo "\n=== End Migration ===\n";
?>