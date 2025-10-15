# Documentation API REST - AnimaLineage

## Vue d'ensemble

L'API AnimaLineage est une API REST moderne pour la gestion d'élevages, construite en PHP 8.4 avec authentification JWT et architecture MVC robuste.

### Informations générales
- **URL de base** : `http://localhost:3001` (développement) / `https://votre-domaine.com/api` (production)
- **Format** : JSON uniquement
- **Authentification** : JWT Bearer Token
- **Versioning** : v1 (dans l'URL : `/api/...`)
- **CORS** : Configuré pour les domaines autorisés

## Authentification

### Connexion
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "motdepasse"
}
```

**Réponse de succès :**
```json
{
  "message": "Connexion réussie",
  "user": {
    "id": 1,
    "username": "jdupont",
    "nom": "Jean",
    "prenom": "Dupont",
    "email": "user@example.com",
    "role": 2,
    "role_name": "Modérateur"
  },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Inscription
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "jdupont",
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "user@example.com",
  "password": "motdepasse",
  "confirm_password": "motdepasse"
}
```

**Réponse :**
```json
{
  "message": "Compte créé avec succès. En attente de validation par un administrateur.",
  "user": {
    "id": 2,
    "username": "jdupont",
    "email": "user@example.com",
    "role": 3,
    "status": "pending"
  }
}
```

### Déconnexion
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

### Utilisation du Token
Toutes les requêtes protégées doivent inclure le header :
```http
Authorization: Bearer {token}
```

## Gestion des Utilisateurs

### Lister les utilisateurs
```http
GET /api/users
Authorization: Bearer {token}
```

**Permissions** : Administrateur uniquement

**Paramètres optionnels :**
- `page` : Numéro de page (défaut: 1)
- `limit` : Éléments par page (défaut: 20, max: 100)
- `search` : Recherche par nom/email

### Créer un utilisateur
```http
POST /api/users
Content-Type: application/json
Authorization: Bearer {token}

{
  "username": "mmartinr",
  "nom": "Martin",
  "prenom": "Marie",
  "email": "marie@example.com",
  "password": "motdepasse",
  "role": 3
}
```

**Permissions** : Administrateur uniquement

### Modifier un utilisateur
```http
PUT /api/users/{id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "nom": "Martin-Dubois",
  "email": "marie.dubois@example.com",
  "role": 2
}
```

### Supprimer un utilisateur
```http
DELETE /api/users/{id}
Authorization: Bearer {token}
```

**Permissions** : Administrateur uniquement

## Gestion des Élevages

### Lister les élevages
```http
GET /api/elevages
Authorization: Bearer {token}
```

**Paramètres optionnels :**
- `user_id` : Filtrer par propriétaire
- `search` : Recherche textuelle
- `page` : Pagination

**Réponse :**
```json
{
  "elevages": [
    {
      "id": 1,
      "nom": "Élevage des Collines",
      "adresse": "123 Route de la Ferme",
      "code_postal": "12345",
      "ville": "Ruralville",
      "user_id": 1,
      "user_name": "Jean Dupont",
      "nombre_animaux": 25,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_items": 12,
    "items_per_page": 20
  }
}
```

### Créer un élevage
```http
POST /api/elevages
Content-Type: application/json
Authorization: Bearer {token}

{
  "nom": "Élevage des Collines Vertes",
  "adresse": "123 Route de la Ferme",
  "code_postal": "12345",
  "ville": "Ruralville",
  "telephone": "01 23 45 67 89",
  "email": "contact@elevage-collines.fr",
  "description": "Élevage spécialisé en bovins Limousins"
}
```

### Obtenir un élevage spécifique
```http
GET /api/elevages/{id}
Authorization: Bearer {token}
```

**Réponse détaillée :**
```json
{
  "elevage": {
    "id": 1,
    "nom": "Élevage des Collines",
    "adresse": "123 Route de la Ferme",
    "code_postal": "12345",
    "ville": "Ruralville",
    "telephone": "01 23 45 67 89",
    "email": "contact@elevage.fr",
    "description": "Élevage familial depuis 1950",
    "user_id": 1,
    "proprietaire": {
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean@example.com"
    },
    "statistiques": {
      "total_animaux": 25,
      "animaux_vivants": 23,
      "males": 8,
      "femelles": 15,
      "races": ["Limousine", "Charolaise"]
    }
  }
}
```

## Gestion des Animaux

### Lister les animaux
```http
GET /api/animaux
Authorization: Bearer {token}
```

**Paramètres optionnels :**
- `elevage_id` : Filtrer par élevage
- `race_id` : Filtrer par race
- `sexe` : Filtrer par sexe (M/F)
- `statut` : Filtrer par statut (vivant/mort)
- `search` : Recherche par nom/identifiant
- `page` : Pagination

### Ajouter un animal
```http
POST /api/animaux
Content-Type: application/json
Authorization: Bearer {token}

{
  "identifiant_officiel": "FR001234567890",
  "nom": "Bella",
  "elevage_id": 1,
  "race_id": 3,
  "date_naissance": "2023-05-15",
  "date_bouclage": "2023-05-17",
  "sexe": "F",
  "pere_id": 12,
  "mere_id": 8,
  "notes": "Animal prometteur pour la reproduction"
}
```

### Obtenir un animal spécifique
```http
GET /api/animaux/{id}
Authorization: Bearer {token}
```

**Réponse complète :**
```json
{
  "animal": {
    "id": 15,
    "identifiant_officiel": "FR001234567890",
    "nom": "Bella",
    "sexe": "F",
    "date_naissance": "2023-05-15",
    "date_bouclage": "2023-05-17",
    "statut": "vivant",
    "race": {
      "id": 3,
      "nom": "Limousine",
      "type_animal": "Bovin"
    },
    "elevage": {
      "id": 1,
      "nom": "Élevage des Collines"
    },
    "genealogie": {
      "pere": {
        "id": 12,
        "nom": "Taureau Champion",
        "identifiant_officiel": "FR987654321098"
      },
      "mere": {
        "id": 8,
        "nom": "Vache Dorée",
        "identifiant_officiel": "FR567890123456"
      },
      "descendants": [
        {
          "id": 20,
          "nom": "Bella Junior",
          "date_naissance": "2024-03-10"
        }
      ]
    },
    "photos": [
      {
        "id": 1,
        "filename": "bella_profil.jpg",
        "description": "Photo de profil",
        "uploaded_at": "2023-06-01T14:30:00Z"
      }
    ]
  }
}
```

### Upload de photos
```http
POST /api/animaux/{id}/photos
Content-Type: multipart/form-data
Authorization: Bearer {token}

file: [fichier image]
description: "Photo de profil de l'animal"
```

**Formats acceptés** : JPG, PNG, WEBP (max 5MB)

### Supprimer une photo
```http
DELETE /api/animaux/{animal_id}/photos/{photo_id}
Authorization: Bearer {token}
```

## Logbook de Santé (Nouveau)

### Consulter le logbook d'un animal
```http
GET /api/animaux/{id}/health-log
Authorization: Bearer {token}
```

**Paramètres optionnels :**
- `page` : Pagination (défaut: 1)
- `limit` : Éléments par page (défaut: 20)

**Réponse :**
```json
{
  "events": [
    {
      "id": 5,
      "event_type": "Vaccination",
      "title": "Vaccination annuelle",
      "description": "Vaccination contre la fièvre aphteuse et la BVD",
      "severity": "info",
      "event_date": "2024-03-15",
      "created_at": "2024-03-15T09:30:00Z",
      "updated_at": "2024-03-15T09:30:00Z",
      "author": {
        "id": 2,
        "username": "veterinaire",
        "nom": "Martin",
        "prenom": "Dr. Sophie"
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 2,
    "total_items": 8,
    "items_per_page": 20
  }
}
```

### Ajouter un événement de santé
```http
POST /api/animaux/{id}/health-log
Content-Type: application/json
Authorization: Bearer {token}

{
  "event_type": "Vaccination",
  "title": "Vaccination annuelle",
  "description": "Vaccination contre la fièvre aphteuse et la BVD",
  "severity": "info",
  "event_date": "2024-03-15"
}
```

**Permissions** : Administrateur ou Modérateur uniquement

**Niveaux de sévérité :**
- `info` : Information générale
- `warning` : Attention requise
- `critical` : Situation critique

**Types d'événements courants :**
- Vaccination
- Vermifugation
- Consultation vétérinaire
- Blessure
- Maladie
- Traitement médical
- Examen médical
- Chirurgie
- Soins préventifs
- Comportement anormal

### Modifier un événement de santé
```http
PUT /api/animaux/{animal_id}/health-log/{event_id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Vaccination annuelle complète",
  "description": "Vaccination contre la fièvre aphteuse, BVD et IBR",
  "severity": "info"
}
```

### Supprimer un événement de santé
```http
DELETE /api/animaux/{animal_id}/health-log/{event_id}
Authorization: Bearer {token}
```

## Gestion des Transferts

### Lister les demandes de transfert
```http
GET /api/transfer-requests
Authorization: Bearer {token}
```

**Paramètres optionnels :**
- `status` : Filtrer par statut (pending/approved/rejected)
- `animal_id` : Filtrer par animal
- `from_elevage_id` : Filtrer par élevage source
- `to_elevage_id` : Filtrer par élevage destination

### Créer une demande de transfert
```http
POST /api/transfer-requests
Content-Type: application/json
Authorization: Bearer {token}

{
  "animal_id": 15,
  "to_elevage_id": 3,
  "reason": "Vente d'animal reproducteur",
  "notes": "Animal en excellente santé, pedigree complet disponible"
}
```

### Approuver/Rejeter une demande
```http
PUT /api/transfer-requests/{id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "status": "approved",
  "admin_notes": "Transfert approuvé après vérification des documents"
}
```

**Permissions** : Administrateur uniquement

## Référentiels

### Races d'animaux

#### Lister les races
```http
GET /api/races
Authorization: Bearer {token}
```

**Paramètres optionnels :**
- `type_animal_id` : Filtrer par type d'animal

**Réponse :**
```json
{
  "races": [
    {
      "id": 1,
      "nom": "Limousine",
      "type_animal_id": 1,
      "type_animal_nom": "Bovin",
      "description": "Race bovine française originaire du Limousin",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Créer une race
```http
POST /api/races
Content-Type: application/json
Authorization: Bearer {token}

{
  "nom": "Charolaise",
  "type_animal_id": 1,
  "description": "Race bovine française de grande taille"
}
```

**Permissions** : Administrateur uniquement

### Types d'animaux

#### Lister les types
```http
GET /api/types-animaux
Authorization: Bearer {token}
```

**Réponse :**
```json
{
  "types": [
    {
      "id": 1,
      "nom": "Bovin",
      "description": "Famille des bovins domestiques",
      "nombre_races": 15,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Créer un type
```http
POST /api/types-animaux
Content-Type: application/json
Authorization: Bearer {token}

{
  "nom": "Ovin",
  "description": "Famille des ovins domestiques (moutons)"
}
```

**Permissions** : Administrateur uniquement

## Administration

### Comptes en attente
```http
GET /api/admin/pending-users
Authorization: Bearer {token}
```

**Permissions** : Administrateur uniquement

### Valider un compte
```http
PUT /api/admin/users/{id}/approve
Authorization: Bearer {token}
```

### Rejeter un compte
```http
PUT /api/admin/users/{id}/reject
Content-Type: application/json
Authorization: Bearer {token}

{
  "reason": "Informations incomplètes"
}
```

### Statistiques globales
```http
GET /api/admin/stats
Authorization: Bearer {token}
```

**Réponse :**
```json
{
  "stats": {
    "total_users": 45,
    "pending_users": 3,
    "total_elevages": 12,
    "total_animaux": 356,
    "animaux_vivants": 342,
    "health_events_last_month": 28,
    "last_updated": "2024-10-15T10:30:00Z"
  }
}
```

## Codes de Statut HTTP

### Succès
- `200 OK` : Requête réussie
- `201 Created` : Ressource créée avec succès
- `204 No Content` : Suppression réussie

### Erreurs Client
- `400 Bad Request` : Données invalides ou malformées
- `401 Unauthorized` : Token manquant, invalide ou expiré
- `403 Forbidden` : Accès refusé (permissions insuffisantes)
- `404 Not Found` : Ressource non trouvée
- `409 Conflict` : Conflit (ex: email déjà utilisé)
- `422 Unprocessable Entity` : Erreurs de validation métier

### Erreurs Serveur
- `500 Internal Server Error` : Erreur serveur interne
- `503 Service Unavailable` : Service temporairement indisponible

## Format des Réponses

### Réponse de succès standard
```json
{
  "message": "Opération réussie",
  "data": { /* données */ }
}
```

### Réponse avec pagination
```json
{
  "animals": [ /* données */ ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 87,
    "items_per_page": 20
  }
}
```

### Réponse d'erreur
```json
{
  "message": "Erreurs de validation",
  "errors": {
    "email": ["L'email est requis", "L'email doit être valide"],
    "password": ["Le mot de passe doit contenir au moins 8 caractères"]
  }
}
```

## Gestion des Erreurs

### Erreurs d'authentification
```json
{
  "message": "Token JWT invalide ou expiré"
}
```

### Erreurs d'autorisation
```json
{
  "message": "Accès refusé. Privilèges administrateur requis."
}
```

### Erreurs de validation
```json
{
  "message": "Erreurs de validation",
  "errors": {
    "identifiant_officiel": ["L'identifiant officiel est requis"],
    "date_naissance": ["La date de naissance ne peut pas être dans le futur"],
    "elevage_id": ["L'élevage spécifié n'existe pas"]
  }
}
```

## Exemples d'utilisation

### JavaScript / Fetch API
```javascript
// Configuration de base
const API_BASE_URL = 'http://localhost:3001/api';
const token = localStorage.getItem('authToken');

// Connexion
async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    return data;
  }
  throw new Error('Connexion échouée');
}

// Récupérer les animaux avec authentification
async function getAnimals(elevageId = null) {
  const url = elevageId
    ? `${API_BASE_URL}/animaux?elevage_id=${elevageId}`
    : `${API_BASE_URL}/animaux`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return response.json();
}

// Ajouter un événement de santé
async function addHealthEvent(animalId, eventData) {
  const response = await fetch(`${API_BASE_URL}/animaux/${animalId}/health-log`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventData)
  });

  return response.json();
}
```

### cURL Examples
```bash
# Connexion
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"motdepasse"}'

# Récupérer les animaux
curl -X GET http://localhost:3001/api/animaux \
  -H "Authorization: Bearer {token}"

# Ajouter un événement de santé
curl -X POST http://localhost:3001/api/animaux/15/health-log \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "Vaccination",
    "title": "Vaccination annuelle",
    "description": "Vaccination contre la fièvre aphteuse",
    "severity": "info",
    "event_date": "2024-03-15"
  }'

# Upload d'une photo
curl -X POST http://localhost:3001/api/animaux/15/photos \
  -H "Authorization: Bearer {token}" \
  -F "file=@animal_photo.jpg" \
  -F "description=Photo de profil"
```

## Sécurité et Bonnes Pratiques

### Authentification
- **Tokens JWT** avec expiration (24h par défaut)
- **Validation stricte** des permissions par endpoint
- **Logout côté serveur** recommandé pour invalider les tokens

### Validation des Données
- **Validation double** : côté client pour l'UX, côté serveur pour la sécurité
- **Échappement** de toutes les entrées utilisateur
- **Limite de taille** pour les uploads (5MB par fichier)

### Bonnes Pratiques d'Utilisation
1. **Toujours utiliser HTTPS** en production
2. **Stocker les tokens de manière sécurisée** (pas dans localStorage en production)
3. **Implémenter un refresh token** pour les applications long-terme
4. **Gérer les erreurs** de manière appropriée côté client
5. **Respecter les limites de taux** pour éviter le throttling
6. **Utiliser la pagination** pour les grandes listes

### Headers de Sécurité Recommandés
```http
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

Cette API offre une solution complète et sécurisée pour la gestion d'élevages avec toutes les fonctionnalités modernes attendues.