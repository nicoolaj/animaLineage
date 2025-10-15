# Architecture du Système - AnimaLineage

## Vue d'ensemble

AnimaLineage est une application web full-stack moderne suivant une architecture en 3 tiers pour la gestion d'élevages. Elle sépare clairement la présentation (React + TypeScript), la logique métier (PHP 8.4) et la persistance des données (SQLite/MySQL/PostgreSQL).

## Architecture générale

```
┌─────────────────┐    HTTP/REST    ┌─────────────────┐    PDO    ┌─────────────────┐
│   Frontend      │◄────────────────│    Backend      │◄──────────│   Base de       │
│   React + TS    │                 │    PHP 8.4      │           │   données       │
│   Port 5173     │                 │    Port 3001    │           │   Multi-SGBD    │
└─────────────────┘                 └─────────────────┘           └─────────────────┘
```

## Frontend (React 19 + TypeScript)

### Structure des composants

```
frontend/src/
├── components/              # Composants UI réutilisables
│   ├── Auth.tsx            # Authentification utilisateur
│   ├── Dashboard.tsx       # Tableau de bord principal
│   ├── AdminPanel.tsx      # Interface d'administration
│   ├── ElevageDetail.tsx   # Détail et gestion d'élevage
│   ├── AnimalForm.tsx      # Formulaire d'animal avec photos
│   ├── AnimalList.tsx      # Liste et filtrage d'animaux
│   ├── HealthLogbook.tsx   # Logbook de santé (nouveau)
│   ├── PhotoUpload.tsx     # Upload et gestion des photos
│   └── TransferRequestDialog.tsx # Gestion des transferts
├── store/                  # Gestion d'état Redux Toolkit
│   ├── slices/            # Redux slices par domaine
│   │   ├── authSlice.ts   # Authentification
│   │   ├── elevageSlice.ts # Gestion des élevages
│   │   └── animalSlice.ts # Gestion des animaux
│   └── store.ts           # Configuration du store
├── utils/                  # Fonctions utilitaires
│   ├── auth.ts            # Utilitaires d'authentification
│   └── validation.ts      # Validation côté client
├── config/                # Configuration
│   ├── api.ts             # Configuration API
│   └── i18n.ts            # Internationalisation
└── App.tsx                # Composant racine avec routing
```

### Technologies Frontend

- **React 19** avec hooks modernes et Concurrent Features
- **TypeScript** strict pour la sécurité du typage
- **Redux Toolkit** pour la gestion d'état globale
- **Tailwind CSS** pour le design responsive et moderne
- **Vite** comme bundler rapide avec HMR
- **i18next** pour l'internationalisation (FR/EN)
- **Vitest** pour les tests unitaires
- **Cypress** pour les tests E2E

### Gestion d'état

- **Redux Toolkit** pour l'état global complexe
- **React Query** pour la mise en cache des données API (à implémenter)
- **State local** pour l'état des composants simples
- **Context API** pour les données partagées légers

### Communication API

- **Fetch API** natif pour les appels HTTP
- **JSON** comme format d'échange standardisé
- **Gestion d'erreurs** centralisée avec intercepteurs
- **Tokens JWT** dans les headers Authorization

## Backend (PHP 8.4)

### Architecture MVC Moderne

```
backend/
├── controllers/            # Contrôleurs (logique de traitement)
│   ├── AuthController.php         # Authentification JWT
│   ├── UserController.php         # Gestion des utilisateurs
│   ├── ElevageController.php      # Gestion des élevages
│   ├── AnimalController.php       # Gestion des animaux
│   ├── HealthLogController.php    # Logbook de santé (nouveau)
│   ├── TransferRequestController.php # Transferts d'animaux
│   └── AdminController.php        # Administration système
├── models/                # Modèles (entités métier)
│   ├── User.php           # Utilisateur avec rôles
│   ├── Elevage.php        # Élevage et permissions
│   ├── Animal.php         # Animal avec généalogie
│   ├── HealthLog.php      # Événements de santé (nouveau)
│   ├── Race.php           # Races d'animaux
│   ├── TypeAnimal.php     # Types (Ovin, Bovin, etc.)
│   └── TransferRequest.php # Demandes de transfert
├── middleware/            # Middleware (authentification)
│   └── AuthMiddleware.php # Validation JWT et permissions
├── config/               # Configuration système
│   ├── database.php      # Abstraction multi-SGBD
│   ├── config.php        # Variables d'environnement
│   └── env.php           # Chargement .env
├── migrations/           # Scripts de migration BDD
│   ├── create_users.sql
│   ├── create_animaux.sql
│   └── create_health_log.sql # Migration logbook (nouveau)
├── database/            # Base SQLite de développement
│   └── animalignage.db
└── index.php            # Point d'entrée et routeur REST
```

### Fonctionnalités Backend

#### Authentification & Autorisation
- **JWT (JSON Web Tokens)** pour l'authentification stateless
- **Rôles utilisateur** : Admin (1), Modérateur (2), Utilisateur (3)
- **Middleware de sécurité** sur tous les endpoints protégés
- **Validation des permissions** par ressource

#### Gestion des Données
- **Architecture Repository Pattern** pour l'accès aux données
- **PDO avec prepared statements** pour la sécurité SQL
- **Support multi-SGBD** : SQLite (dev), MySQL/PostgreSQL (prod)
- **Migrations automatiques** au premier démarrage

#### Nouveau : Logbook de Santé
- **Événements médicaux** : Vaccinations, traitements, consultations
- **Niveaux de sévérité** : Info, Warning, Critical
- **Permissions** : Lecture tous, écriture Admin/Modérateur
- **Pagination** et filtrage des événements

### API REST Complète

| Endpoint | Méthode | Description | Permissions |
|----------|---------|-------------|-------------|
| `/api/auth/login` | POST | Connexion utilisateur | Public |
| `/api/auth/register` | POST | Inscription | Public |
| `/api/users` | GET/POST/PUT/DELETE | Gestion utilisateurs | Admin |
| `/api/elevages` | GET/POST/PUT | Gestion élevages | Propriétaire+ |
| `/api/animaux` | GET/POST/PUT | Gestion animaux | Membre élevage+ |
| `/api/animaux/{id}/photos` | POST/DELETE | Upload photos | Membre élevage+ |
| `/api/animaux/{id}/health-log` | GET/POST/PUT/DELETE | Logbook santé | Lecture: Tous, Écriture: Admin/Mod |
| `/api/races` | GET/POST | Races d'animaux | Lecture: Tous, Écriture: Admin |
| `/api/types-animaux` | GET/POST | Types d'animaux | Lecture: Tous, Écriture: Admin |

## Base de Données

### Schéma Principal

```sql
-- Utilisateurs avec rôles
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    role INTEGER DEFAULT 3, -- 1=Admin, 2=Modérateur, 3=Utilisateur
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Élevages
CREATE TABLE elevages (
    id INTEGER PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    adresse TEXT,
    user_id INTEGER, -- Propriétaire
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Animaux avec généalogie
CREATE TABLE animaux (
    id INTEGER PRIMARY KEY,
    identifiant_officiel VARCHAR(50) UNIQUE,
    nom VARCHAR(100),
    sexe VARCHAR(1) CHECK (sexe IN ('M', 'F')),
    pere_id INTEGER,
    mere_id INTEGER,
    race_id INTEGER,
    elevage_id INTEGER,
    date_naissance DATE,
    statut VARCHAR(10) DEFAULT 'vivant',
    FOREIGN KEY (pere_id) REFERENCES animaux(id),
    FOREIGN KEY (mere_id) REFERENCES animaux(id),
    FOREIGN KEY (race_id) REFERENCES races(id),
    FOREIGN KEY (elevage_id) REFERENCES elevages(id)
);

-- Nouveau : Logbook de santé
CREATE TABLE health_log (
    id INTEGER PRIMARY KEY,
    animal_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    severity VARCHAR(10) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    event_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animaux(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Configuration Multi-SGBD

```php
// Configuration automatique selon l'environnement
class Database {
    public function getConnection() {
        $driver = Config::get('DB_DRIVER', 'sqlite');

        switch ($driver) {
            case 'sqlite':
                return new PDO("sqlite:" . __DIR__ . '/../database/animalignage.db');
            case 'mysql':
                return new PDO("mysql:host={$host};dbname={$db}", $user, $pass);
            case 'pgsql':
                return new PDO("pgsql:host={$host};dbname={$db}", $user, $pass);
        }
    }
}
```

## Sécurité

### Authentification
- **JWT avec expiration** (24h par défaut)
- **Refresh tokens** pour le renouvellement
- **Validation des tokens** à chaque requête API
- **Logout côté serveur** avec blacklist des tokens

### Autorisation
- **RBAC (Role-Based Access Control)**
- **Permissions granulaires** par ressource
- **Isolation des données** par élevage
- **Validation des propriétaires** pour les opérations sensibles

### Protection des Données
- **Prepared statements PDO** contre l'injection SQL
- **Validation et échappement** des entrées utilisateur
- **HTTPS obligatoire** en production
- **Headers de sécurité** (CORS, CSP, etc.)

## Flux de Données

### Authentification Complète
```
1. Utilisateur → Formulaire Login (React)
2. Form → POST /api/auth/login (validation côté client)
3. Backend → Validation credentials (Model User)
4. Database → Vérification hash password
5. Backend → Génération JWT + refresh token
6. Frontend → Stockage tokens (localStorage sécurisé)
7. Redux → Mise à jour state auth global
8. Interface → Redirection tableau de bord
```

### Opérations CRUD avec Permissions
```
1. Composant React → Appel API avec JWT header
2. AuthMiddleware → Validation token + extraction user
3. Controller → Vérification permissions spécifiques
4. Model → Requête database avec filtres sécurité
5. Database → Exécution requête avec prepared statements
6. Response → Données JSON formatées
7. Frontend → Mise à jour Redux store
8. UI → Re-render automatique des composants
```

### Nouveau : Workflow Logbook de Santé
```
1. Vétérinaire/Admin → Création événement santé
2. HealthLogController → Validation permissions (Admin/Mod uniquement)
3. HealthLog Model → Insertion avec validation métier
4. Database → Sauvegarde avec relations (animal, user)
5. Frontend → Mise à jour temps réel du logbook
6. Notifications → Alerte si événement critique
```

## Performance et Optimisation

### Frontend
- **Code splitting** avec React.lazy pour les gros composants
- **Memoization** React.memo pour éviter les re-renders
- **Virtual scrolling** pour les listes d'animaux longues
- **Image lazy loading** pour les photos d'animaux
- **Bundle optimization** avec Vite et tree-shaking

### Backend
- **Requêtes SQL optimisées** avec index appropriés
- **Pagination** systématique sur les listes
- **Cache des métadonnées** (races, types) en mémoire
- **Compression gzip** des réponses JSON
- **Connection pooling** pour les bases de données

### Base de Données
```sql
-- Index pour performance
CREATE INDEX idx_animaux_elevage ON animaux(elevage_id);
CREATE INDEX idx_health_log_animal ON health_log(animal_id);
CREATE INDEX idx_health_log_date ON health_log(event_date DESC);
CREATE INDEX idx_animaux_parents ON animaux(pere_id, mere_id);
```

## Déploiement et Environnements

### Développement
- **SQLite** : Base de données fichier locale
- **Vite dev server** : Hot reload instantané
- **PHP built-in server** : Pas de configuration Apache
- **Ports** : Frontend 5173, Backend 3001

### Production
- **MySQL/PostgreSQL** : Base de données robuste
- **Apache/Nginx** : Serveur web optimisé
- **HTTPS** : Certificat SSL obligatoire
- **Monitoring** : Logs et métriques de performance

### CI/CD GitHub Actions
```yaml
# Pipeline automatisé complet
name: Tests Complets
on: [push, pull_request]
jobs:
  frontend-tests:    # Tests React + TypeScript
  backend-tests:     # Tests PHP + PHPUnit
  e2e-tests:         # Tests Cypress multi-navigateurs
  security-audit:    # Audit npm/composer
  performance-tests: # Lighthouse CI
```

## Évolutivité

### Horizontale
- **API stateless** avec JWT (pas de sessions serveur)
- **Frontend SPA** déployable sur CDN
- **Base de données** avec réplication possible
- **Microservices** : Séparation possible par domaine métier

### Verticale
- **Architecture modulaire** avec interfaces claires
- **Dependency injection** pour les services
- **Configuration flexible** via variables d'environnement
- **Tests automatisés** pour la non-régression

## Monitoring et Observabilité

### Logs
- **Frontend** : Erreurs JavaScript avec source maps
- **Backend** : Logs PHP structurés par niveau
- **Database** : Requêtes lentes et erreurs de contraintes
- **Performance** : Métriques Core Web Vitals

### Métriques Clés
- **Temps de réponse API** : < 200ms pour 95% des requêtes
- **Taille des bundles** : < 500KB frontend initial
- **Coverage tests** : > 80% pour le code métier
- **Lighthouse Score** : > 90 pour Performance et Accessibilité

Cette architecture moderne garantit une application robuste, sécurisée et évolutive pour la gestion professionnelle d'élevages.