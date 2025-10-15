# AnimaLineage - Application de Gestion d'Élevage

> Application web moderne pour la gestion professionnelle d'élevages avec interface React/TypeScript et API PHP robuste.

## 🚀 Aperçu du Projet

AnimaLineage est une solution complète de gestion d'élevage qui permet de :
- **Gérer les animaux** avec généalogie complète et suivi sanitaire
- **Organiser les élevages** avec gestion des membres et permissions
- **Suivre la santé** avec logbook médical détaillé
- **Gérer les transferts** d'animaux entre élevages
- **Administrer** les utilisateurs et données de référence

## 📋 Table des Matières

- [🔧 Installation Rapide](#-installation-rapide)
- [🏗️ Architecture](#️-architecture)
- [✨ Fonctionnalités](#-fonctionnalités)
- [🛠️ Technologies](#️-technologies)
- [📚 API REST](#-api-rest)
- [🚀 Déploiement](#-déploiement)
- [🧪 Tests](#-tests)
- [📖 Documentation](#-documentation)

## 🔧 Installation Rapide

### Prérequis
- **Node.js** 18+ (voir `.nvmrc`)
- **PHP** 8.4+ avec extensions : PDO SQLite, JSON, OpenSSL, mbstring
- **Composer** pour les dépendances PHP

### Démarrage en 3 étapes

```bash
# 1. Backend (Terminal 1)
cd backend
composer install
php -S 0.0.0.0:3001 index.php

# 2. Frontend (Terminal 2)
cd frontend
npm install
npm run dev

# 3. Accès
# Frontend: http://localhost:5173
# API: http://localhost:3001
```

> ⚠️ **Important** : Utilisez `0.0.0.0:3001` pour éviter les erreurs CORS

## 🏗️ Architecture

```
AnimaLineage/
├── 🎨 frontend/           # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/    # Composants React modulaires
│   │   ├── store/         # Redux Toolkit (gestion d'état)
│   │   ├── utils/         # Fonctions utilitaires
│   │   └── config/        # Configuration (API, i18n)
│   ├── public/            # Assets statiques
│   └── package.json       # Dépendances Node.js
├── 🔧 backend/            # API REST PHP
│   ├── controllers/       # Logique métier (MVC)
│   ├── models/           # Entités et accès données
│   ├── middleware/       # Authentification JWT
│   ├── config/          # Configuration base de données
│   ├── migrations/      # Scripts SQL
│   └── database/        # Base SQLite (dev)
├── 📁 deploy/            # Build de production
├── 📚 docs/              # Documentation détaillée
└── 🚀 deploy.sh          # Script de déploiement automatisé
```

## ✨ Fonctionnalités

### 🔐 Gestion des Utilisateurs
- **Authentification JWT** sécurisée
- **Rôles** : Administrateur, Modérateur, Utilisateur
- **Comptes en attente** avec validation administrative

### 🐄 Gestion d'Élevage
- **CRUD complet** pour élevages et animaux
- **Généalogie** avec arbres père/mère
- **Races et types** d'animaux configurables
- **Upload de photos** pour les animaux

### 📋 Logbook de Santé
- **Événements médicaux** : Vaccinations, traitements, consultations
- **Niveaux de sévérité** : Info, Attention, Critique
- **Historique complet** avec auteur et dates
- **Permissions** : Lecture pour tous, écriture Admin/Modérateur

### 🔄 Transferts d'Animaux
- **Demandes de transfert** entre élevages
- **Workflow de validation** par les administrateurs
- **Suivi des états** : En attente, Accepté, Refusé

### 🌍 Internationalisation
- **Support multilingue** : Français, Anglais
- **Interface adaptable** selon la langue du navigateur
- **Messages d'erreur** traduits

## 🛠️ Technologies

### Frontend
- **React 19** avec hooks modernes
- **TypeScript** pour la sécurité du typage
- **Redux Toolkit** pour la gestion d'état
- **Tailwind CSS** pour le design responsive
- **Vite** comme bundler moderne
- **i18next** pour l'internationalisation

### Backend
- **PHP 8.4** avec programmation orientée objet
- **Architecture MVC** claire et modulaire
- **PDO** avec support multi-SGBD (SQLite/MySQL/PostgreSQL)
- **JWT** pour l'authentification stateless
- **Intervention/Image** pour le traitement d'images

### Base de Données
- **SQLite** par défaut (développement)
- **MySQL/PostgreSQL** pour la production
- **Migrations automatiques** pour la cohérence du schéma

## 📚 API REST

### Authentification
```http
POST /api/auth/login      # Connexion utilisateur
POST /api/auth/register   # Inscription
POST /api/auth/logout     # Déconnexion
```

### Utilisateurs
```http
GET    /api/users         # Liste des utilisateurs
POST   /api/users         # Création
PUT    /api/users/{id}    # Modification
DELETE /api/users/{id}    # Suppression
```

### Élevages
```http
GET    /api/elevages      # Liste des élevages
POST   /api/elevages      # Création
GET    /api/elevages/{id} # Détail
PUT    /api/elevages/{id} # Modification
```

### Animaux
```http
GET    /api/animaux       # Liste des animaux
POST   /api/animaux       # Ajout
GET    /api/animaux/{id}  # Détail
PUT    /api/animaux/{id}  # Modification
POST   /api/animaux/{id}/photos  # Upload photo
```

### Logbook de Santé
```http
GET    /api/animaux/{id}/health-log           # Événements
POST   /api/animaux/{id}/health-log           # Nouvel événement
PUT    /api/animaux/{id}/health-log/{eventId} # Modification
DELETE /api/animaux/{id}/health-log/{eventId} # Suppression
```

### Référentiels
```http
GET /api/races           # Races d'animaux
GET /api/types-animaux   # Types d'animaux (Ovin, Bovin, etc.)
```

## 🚀 Déploiement

### Déploiement Automatisé

```bash
# 1. Exécuter le script de déploiement
./deploy.sh

# 2. Uploader le contenu de deploy/ vers votre serveur web
# 3. Configurer le fichier .env en production
```

### Configuration Production

```env
# api/.env
APP_ENV=production
DB_DRIVER=mysql
DB_HOST=localhost
DB_NAME=animalignage_prod
DB_USER=votre_utilisateur
DB_PASS=votre_mot_de_passe
JWT_SECRET=clé_très_sécurisée_256_bits
CORS_ALLOWED_ORIGINS=https://votre-domaine.com
```

### Prérequis Serveur
- **PHP 8.4+** avec extensions requises
- **Serveur web** Apache/Nginx avec mod_rewrite
- **HTTPS** obligatoire pour la sécurité JWT
- **Base de données** MySQL/PostgreSQL

## 🧪 Tests

### Frontend (Jest + Vitest)
```bash
cd frontend

# Tests unitaires
npm test

# Tests avec couverture
npm run test:coverage

# Tests E2E (Cypress)
npm run test:e2e

# Build de production
npm run build
```

### Backend (PHPUnit)
```bash
cd backend

# Tests PHP
composer test

# Avec couverture
composer run test-coverage
```

### CI/CD GitHub Actions
- ✅ **Tests automatiques** sur push/PR
- ✅ **Couverture de code** avec rapports
- ✅ **Tests E2E** multi-navigateurs
- ✅ **Audit de sécurité** des dépendances
- ✅ **Tests de performance** Lighthouse

## 📖 Documentation

### Guides Techniques
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Architecture détaillée du système
- **[DEPLOIEMENT.md](docs/DEPLOIEMENT.md)** - Guide de déploiement complet
- **[CONVENTIONS.md](docs/CONVENTIONS.md)** - Standards de code
- **[DATABASE.md](backend/DATABASE.md)** - Configuration base de données
- **[SECURITY.md](docs/SECURITY.md)** - Bonnes pratiques sécurité

### Fonctionnalités Détaillées
- **[API.md](docs/API.md)** - Documentation complète de l'API
- **[TESTS.md](docs/TESTS.md)** - Guide des tests et patterns

## 🤝 Contribution

### Standards de Code
- **TypeScript** strict pour le frontend
- **PSR-12** pour le code PHP
- **Tests obligatoires** pour les nouvelles fonctionnalités
- **Documentation** à jour pour les API

### Workflow Git
```bash
# 1. Fork et branche feature
git checkout -b feature/nouvelle-fonctionnalite

# 2. Développement avec tests
npm test && composer test

# 3. Pull Request avec description détaillée
```

## 📝 License

Ce projet est sous licence Apache 2.0 - voir le fichier LICENSE pour plus de détails.

## 👤 Auteur

**Nicolas Jalibert**

---

> 🔧 **Version actuelle** : 2.1.1
> 📅 **Dernière mise à jour** : Octobre 2025
> 🌟 **Fonctionnalité récente** : Logbook de santé pour animaux