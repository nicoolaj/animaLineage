# AnimaLineage - Application de Gestion d'Élevage

Application web full-stack moderne pour la gestion professionnelle d'élevages avec interface React/TypeScript et API PHP robuste.

## Architecture du Projet

```
AnimaLineage/
├── frontend/           # Application React TypeScript (port 3002)
│   ├── src/
│   │   ├── components/     # Composants React modulaires
│   │   ├── contexts/       # Gestion d'état (AuthContext)
│   │   └── utils/          # Fonctions utilitaires
│   └── package.json        # Dépendances Node.js
├── backend/            # API REST PHP (port 3001)
│   ├── controllers/    # Contrôleurs MVC
│   ├── models/         # Modèles de données
│   ├── middleware/     # Authentification JWT
│   ├── config/         # Configuration système
│   ├── migrations/     # Migrations BDD
│   └── database/       # Base SQLite (dev)
├── docs/               # Documentation complète
│   ├── ARCHITECTURE.md # Architecture système
│   └── CONVENTIONS.md  # Conventions de code
└── scripts/            # Scripts utilitaires
```

## Prérequis Techniques

### Environnement de Développement
- **Node.js** v18+ (voir .nvmrc pour la version recommandée)
- **PHP** v7.4+ avec extensions :
  - PDO SQLite (développement)
  - PDO MySQL/PostgreSQL (production)
  - JSON
- **Composer** pour les dépendances PHP

### Environnement de Production
- **Serveur web** : Apache/Nginx avec support PHP
- **Base de données** : MySQL/MariaDB ou PostgreSQL
- **HTTPS** obligatoire pour la sécurité JWT

## Setup Instructions

### Database Setup

The application uses **SQLite by default in development mode** and supports MySQL/MariaDB or PostgreSQL for production.

#### Development (SQLite - Default)
No setup required! The SQLite database file will be created automatically in `backend/database/webapp.db`

#### Production (MySQL/MariaDB)
1. Create a MySQL database named `webapp_db`
2. Copy `backend/.env.prod.example` to `backend/.env`
3. Update the MySQL configuration in `.env`:
   ```env
   APP_ENV=production
   DB_DRIVER=mysql
   DB_HOST=localhost
   DB_NAME=webapp_db
   DB_USER=your_username
   DB_PASS=your_password
   ```

#### Production (PostgreSQL)
1. Create a PostgreSQL database named `webapp_db`
2. Copy `backend/.env.prod.example` to `backend/.env`
3. Update the PostgreSQL configuration in `.env`:
   ```env
   APP_ENV=production
   DB_DRIVER=pgsql
   DB_HOST=localhost
   DB_NAME=webapp_db
   DB_USER=postgres
   DB_PASS=your_password
   DB_PORT=5432
   ```

The application will automatically create the required `users` table for all database types.

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Start PHP development server:
   ```bash
   php -S localhost:3001
   ```

   Or configure your web server to serve the backend directory on port 3001.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

   The React app will run on http://localhost:3002

## Fonctionnalités Principales

### Gestion d'Authentification
- **Système JWT** avec tokens sécurisés
- **Rôles utilisateur** : administrateur, éleveur, consultant
- **Comptes en attente** avec validation par administrateur
- **Middleware d'authentification** sur toutes les routes protégées

### Gestion d'Élevage
- **CRUD complet** pour élevages, animaux, races et types
- **Interface intuitive** avec formulaires validés
- **Tableau de bord** avec vue d'ensemble des données
- **Recherche et filtrage** avancés

### Administration
- **Panel d'administration** pour la gestion des utilisateurs
- **Validation des nouveaux comptes**
- **Gestion des permissions** et rôles
- **Monitoring** des activités utilisateur

### Technique
- **Interface responsive** pour tous les appareils
- **Validation double** côté client et serveur
- **Gestion d'erreurs** robuste avec messages informatifs
- **Performance optimisée** avec lazy loading

## API REST

### Authentification
- `POST /api/auth/login` - Connexion utilisateur
- `POST /api/auth/register` - Inscription utilisateur
- `POST /api/auth/logout` - Déconnexion

### Gestion des Utilisateurs
- `GET /api/users` - Liste des utilisateurs
- `POST /api/users` - Création d'utilisateur
- `PUT /api/users/{id}` - Modification d'utilisateur
- `DELETE /api/users/{id}` - Suppression d'utilisateur

### Gestion des Élevages
- `GET /api/elevages` - Liste des élevages
- `POST /api/elevages` - Création d'élevage
- `GET /api/elevages/{id}` - Détail d'un élevage
- `PUT /api/elevages/{id}` - Modification d'élevage

### Gestion des Animaux
- `GET /api/animals` - Liste des animaux
- `POST /api/animals` - Ajout d'animal
- `GET /api/animals/{id}` - Détail d'un animal
- `PUT /api/animals/{id}` - Modification d'animal

### Référentiels
- `GET /api/races` - Liste des races
- `POST /api/races` - Création de race
- `GET /api/types-animaux` - Types d'animaux

## Documentation Complète

### Guides Techniques
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Architecture détaillée du système
- **[CONVENTIONS.md](docs/CONVENTIONS.md)** - Conventions de code et bonnes pratiques
- **[DATABASE.md](backend/DATABASE.md)** - Configuration et gestion de la base de données

### Configuration Base de Données
L'application détecte automatiquement l'environnement :

- **Développement** : SQLite automatique (aucune configuration)
- **Production** : MySQL/PostgreSQL via fichier `.env`

Voir `DATABASE.md` pour les détails de configuration.

### Tests
```bash
# Tests frontend
cd frontend
npm test

# Tests backend (PHPUnit - à configurer)
cd backend
composer test
```

### Maintenance
```bash
# Audit des dépendances
npm audit
composer audit

# Mise à jour des dépendances
npm update
composer update
```

## Development

### Frontend Development
- Built with React and TypeScript
- Uses functional components with hooks
- Styled with CSS modules

### Backend Development
- RESTful API built with PHP
- Object-oriented architecture
- PDO for database operations
- CORS enabled for frontend communication

## Démarrage Rapide

### 1. Préparation de l'Environnement
```bash
# Cloner le dépôt
git clone <repository-url> mouton2
cd mouton2

# Utiliser la version Node.js recommandée
nvm use
```

### 2. Configuration du Backend
```bash
cd backend

# Installer les dépendances PHP
composer install

# Configurer l'environnement (optionnel en dev)
cp .env.dev.example .env

# Démarrer le serveur PHP
php -S localhost:3001
```

### 3. Configuration du Frontend
```bash
cd frontend

# Installer les dépendances Node.js
npm install

# Démarrer l'application React
npm start
```

### 4. Accès à l'Application
- **Frontend** : http://localhost:3002
- **API Backend** : http://localhost:3001
- **Base de données** : Créée automatiquement en SQLite

## Déploiement en Production

### 1. Préparation de l'Application
```bash
# Build du frontend
cd frontend
npm run build

# Installation des dépendances PHP (production)
cd ../backend
composer install --no-dev --optimize-autoloader
```

### 2. Configuration de Production
```bash
# Copier et configurer les variables d'environnement
cp .env.prod.example .env

# Éditer le fichier .env avec vos paramètres
# APP_ENV=production
# DB_DRIVER=mysql (ou pgsql)
# DB_HOST=votre_host
# DB_NAME=votre_base
# DB_USER=votre_utilisateur
# DB_PASS=votre_mot_de_passe
```

### 3. Configuration Serveur Web

#### Apache (.htaccess inclus)
```apache
# Pointer DocumentRoot vers le dossier backend/
# Le frontend build/ doit être accessible via le serveur web
```

#### Nginx
```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    root /path/to/animaLignage/backend;

    location /api/ {
        try_files $uri $uri/ /index.php$is_args$args;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
    }
}
```

### 4. Sécurité de Production
- **HTTPS obligatoire** pour la sécurité JWT
- **Fichier .env** jamais accessible publiquement
- **Permissions** restrictives sur les fichiers
- **Firewall** configuré pour limiter l'accès