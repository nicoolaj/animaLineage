# Migration vers PHP 8.4

## 🚀 Mise à jour vers PHP 8.4

Ce document décrit la migration du backend AnimaLineage vers PHP 8.4.

### ⚡ Nouvelles fonctionnalités utilisées

#### 1. Classes readonly (RFC)
```php
readonly class LoginRequest
{
    public function __construct(
        public string $email,
        public string $password
    ) {}
}
```

#### 2. Types strictes déclarés
```php
declare(strict_types=1);
```

#### 3. Propriétés typées et readonly
```php
class AuthController
{
    private readonly User $user;
    private readonly ?AuthMiddleware $authMiddleware;
}
```

### 📋 Changements apportés

#### Backend
- ✅ **composer.json** : Requis PHP ^8.4
- ✅ **PHPUnit** : Mis à jour vers v11.0
- ✅ **AuthController.php** : Modernisé avec types stricts et classes readonly
- ✅ **GitHub Actions** : Tests sur PHP 8.4

### 🔧 Installation et configuration

#### Prérequis
```bash
# Vérifier la version PHP
php --version
# PHP 8.4.12 (cli) requis

# Mettre à jour les dépendances
cd backend
composer update
```

#### Variables d'environnement
Aucun changement requis dans les fichiers `.env`.

### 🧪 Tests

Les tests GitHub Actions ont été mis à jour pour utiliser PHP 8.4 :
- Tests unitaires PHPUnit
- Tests de sécurité
- Tests end-to-end
- Tests de performance

### ⚠️ Compatibilité

#### Fonctionnalités dépréciées supprimées
- PHP 8.4 supprime certaines fonctions dépréciées de PHP 8.0-8.3
- Le code a été vérifié pour la compatibilité

#### Extensions requises
- `pdo`
- `pdo_sqlite`
- `mbstring`
- `json`
- `openssl` (pour JWT)

### 📦 Dépendances mises à jour

```json
{
  "require": {
    "php": "^8.4",
    "firebase/php-jwt": "^6.11"
  },
  "require-dev": {
    "phpunit/phpunit": "^11.0",
    "mockery/mockery": "^1.6",
    "fakerphp/faker": "^1.23"
  }
}
```

### 🚀 Déploiement

1. **Serveur de production** : S'assurer que PHP 8.4 est installé
2. **Composer** : Exécuter `composer install --no-dev --optimize-autoloader`
3. **Tests** : Vérifier que tous les tests passent
4. **Monitoring** : Surveiller les logs après déploiement

### 🔗 Ressources

- [PHP 8.4 Release Notes](https://www.php.net/releases/8.4/en.php)
- [Migration Guide](https://www.php.net/manual/en/migration84.php)
- [New Features](https://www.php.net/manual/en/migration84.new-features.php)

---

**Date de migration** : $(date '+%Y-%m-%d')
**Version PHP** : 8.4.12
**Statut** : ✅ Complété