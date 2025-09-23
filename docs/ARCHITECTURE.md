# Architecture du Système

## Vue d'ensemble

L'application Mouton2 est une application web full-stack suivant une architecture en 3 tiers pour la gestion d'élevages. Elle sépare clairement la présentation (React), la logique métier (PHP) et la persistance des données (SQLite/MySQL/PostgreSQL).

## Architecture générale

```
┌─────────────────┐    HTTP/REST    ┌─────────────────┐    PDO    ┌─────────────────┐
│   Frontend      │◄────────────────│    Backend      │◄──────────│   Base de       │
│   (React)       │                 │    (PHP)        │           │   données       │
│   Port 3002     │                 │    Port 3001    │           │   SQLite/MySQL  │
└─────────────────┘                 └─────────────────┘           └─────────────────┘
```

## Frontend (React/TypeScript)

### Structure des composants

```
src/
├── components/          # Composants UI réutilisables
│   ├── Auth.tsx        # Authentification
│   ├── Dashboard.tsx   # Tableau de bord principal
│   ├── AdminPanel.tsx  # Interface d'administration
│   ├── ElevageForm.tsx # Formulaire d'élevage
│   ├── AnimalForm.tsx  # Formulaire d'animal
│   └── ...
├── contexts/           # Gestion d'état global
│   └── AuthContext.tsx # Contexte d'authentification
├── utils/              # Fonctions utilitaires
│   └── auth.ts         # Utilitaires d'authentification
└── App.tsx             # Composant racine
```

### Gestion d'état
- **React Context API** pour l'état global (authentification)
- **State local** pour l'état des composants
- **Props drilling** évité grâce aux contextes

### Communication API
- **Fetch API** pour les appels HTTP
- **JSON** comme format d'échange
- **Gestion d'erreurs** centralisée

## Backend (PHP)

### Architecture MVC

```
backend/
├── controllers/        # Contrôleurs (logique de traitement)
│   ├── UserController.php
│   ├── ElevageController.php
│   └── AdminController.php
├── models/            # Modèles (entités métier)
│   ├── User.php
│   ├── Elevage.php
│   ├── Animal.php
│   └── Race.php
├── middleware/        # Middleware (authentification)
│   └── AuthMiddleware.php
├── config/           # Configuration
│   ├── database.php  # Configuration BDD
│   └── env.php       # Variables d'environnement
└── index.php         # Point d'entrée et routeur
```

### Couche de données

#### Modèles
Chaque modèle hérite d'une classe de base et implémente :
- **CRUD operations** (Create, Read, Update, Delete)
- **Validation des données**
- **Relations entre entités**

#### Base de données
- **Abstraction PDO** pour la portabilité multi-SGBD
- **Migrations automatiques** pour la gestion du schéma
- **Configuration environnementale** (dev/prod)

### API REST

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/users` | GET | Liste des utilisateurs |
| `/api/users` | POST | Création d'utilisateur |
| `/api/elevages` | GET | Liste des élevages |
| `/api/elevages` | POST | Création d'élevage |
| `/api/animals` | GET | Liste des animaux |
| `/api/animals` | POST | Ajout d'animal |
| `/api/races` | GET | Liste des races |

## Sécurité

### Authentification
- **JWT (JSON Web Tokens)** pour l'authentification stateless
- **Middleware d'autorisation** sur les endpoints protégés
- **Validation des tokens** à chaque requête

### Autorisation
- **Rôles utilisateur** : admin, éleveur, compte en attente
- **Contrôle d'accès** basé sur les rôles (RBAC)
- **Isolation des données** par utilisateur

### Validation
- **Validation côté client** (React forms)
- **Validation côté serveur** (modèles PHP)
- **Échappement des données** (PDO prepared statements)

## Flux de données

### Authentification
```
1. Utilisateur → Login Form (React)
2. Form → API /auth/login (PHP)
3. API → Validation credentials (Model)
4. Model → Database query (PDO)
5. API → JWT token generation
6. React → Token storage (localStorage)
7. React → Auth context update
```

### Opérations CRUD
```
1. Composant React → API call (fetch)
2. Middleware → JWT validation
3. Controller → Business logic
4. Model → Database operations
5. Response → JSON data
6. React → State update
7. UI → Re-render
```

## Gestion des erreurs

### Frontend
- **Try-catch** pour les appels API
- **États de loading** et d'erreur
- **Messages utilisateur** informatifs

### Backend
- **Exceptions PHP** capturées
- **Codes de statut HTTP** appropriés
- **Messages d'erreur** standardisés
- **Logging** des erreurs serveur

## Performance

### Frontend
- **Code splitting** via React.lazy (à implémenter)
- **Memoization** des composants (React.memo)
- **Optimisation des re-renders**

### Backend
- **Requêtes SQL optimisées**
- **Index de base de données**
- **Cache d'authentification JWT**

## Déploiement

### Environnements
- **Développement** : SQLite, ports 3001/3002
- **Production** : MySQL/PostgreSQL, serveur web

### CI/CD GitHub Actions
- **Tests automatiques** sur push/PR (master/develop)
- **Pipeline complet** : PHP + React + E2E + Performance
- **Rapports de couverture** Codecov intégrés
- **Tests nocturnes** quotidiens programmés

### Configuration
- **Variables d'environnement** (fichiers .env)
- **Build de production** (npm run build)
- **Migrations automatiques** au démarrage
- **Workflow GitHub Actions** (`.github/workflows/comprehensive-testing.yml`)

## Évolutivité

### Horizontal
- **API stateless** (JWT)
- **Séparation frontend/backend**
- **Base de données relationnelle**

### Vertical
- **Architecture modulaire**
- **Interfaces standardisées**
- **Configuration flexible**