<?php
/*
 * Script pour valider un utilisateur par email
 * Usage: php validate_user.php email@example.com
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/env.php';

// Charger les variables d'environnement
EnvLoader::load(__DIR__ . '/../.env');

if ($argc < 2) {
    echo "Usage: php validate_user.php <email>\n";
    exit(1);
}

$email = $argv[1];

try {
    $database = new Database();
    $db = $database->getConnection();

    // Chercher l'utilisateur
    $query = "SELECT id, name, email, status FROM users WHERE email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo "❌ Utilisateur avec l'email '$email' non trouvé.\n";
        exit(1);
    }

    echo "👤 Utilisateur trouvé:\n";
    echo "   ID: {$user['id']}\n";
    echo "   Nom: {$user['name']}\n";
    echo "   Email: {$user['email']}\n";
    echo "   Statut actuel: {$user['status']} ";

    switch ($user['status']) {
        case 0:
            echo "(En attente)\n";
            break;
        case 1:
            echo "(Validé)\n";
            break;
        case 2:
            echo "(Rejeté)\n";
            break;
        default:
            echo "(Inconnu)\n";
    }

    if ($user['status'] == 1) {
        echo "✅ L'utilisateur est déjà validé.\n";
        exit(0);
    }

    // Valider l'utilisateur
    $updateQuery = "UPDATE users SET status = 1 WHERE id = :id";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':id', $user['id']);

    if ($updateStmt->execute()) {
        echo "✅ Utilisateur validé avec succès !\n";
    } else {
        echo "❌ Erreur lors de la validation.\n";
        exit(1);
    }

} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    exit(1);
}
?>