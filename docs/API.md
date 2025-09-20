# Documentation API REST - AnimaLineage

## Vue d'ensemble

L'API AnimaLineage est une API REST complète pour la gestion d'élevages, construite en PHP avec authentification JWT et architecture MVC.

### Informations générales
- **URL de base** : `http://localhost:3001` (développement)
- **Format** : JSON
- **Authentification** : JWT Bearer Token
- **Versioning** : v1 (dans l'URL : `/api/...`)

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
  "status": 200,
  "message": "Connexion réussie",
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
      "id": 1,
      "nom": "Jean Dupont",
      "email": "user@example.com",
      "status": 1,
      "role": "eleveur"
    }
  },
  "timestamp": "2025-09-20T10:30:00+00:00"
}
```

### Inscription
```http
POST /api/auth/register
Content-Type: application/json

{
  "nom": "Jean Dupont",
  "email": "user@example.com",
  "password": "motdepasse",
  "confirm_password": "motdepasse"
}
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

**Réponse :**
```json
{
  "status": 200,
  "data": [
    {
      "id": 1,
      "nom": "Jean Dupont",
      "email": "jean@example.com",
      "status": 1,
      "role": "eleveur",
      "created_at": "2025-09-20T08:00:00+00:00"
    }
  ]
}
```

### Créer un utilisateur
```http
POST /api/users
Content-Type: application/json
Authorization: Bearer {token}

{
  "nom": "Marie Martin",
  "email": "marie@example.com",
  "password": "motdepasse",
  "role": "eleveur"
}
```

### Modifier un utilisateur
```http
PUT /api/users/{id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "nom": "Marie Martin-Dubois",
  "email": "marie.dubois@example.com",
  "status": 1
}
```

### Supprimer un utilisateur
```http
DELETE /api/users/{id}
Authorization: Bearer {token}
```

## Gestion des Élevages

### Lister les élevages
```http
GET /api/elevages
Authorization: Bearer {token}
```

**Paramètres de requête optionnels :**
- `user_id` : Filtrer par utilisateur
- `limit` : Nombre maximum de résultats
- `offset` : Décalage pour pagination

### Créer un élevage
```http
POST /api/elevages
Content-Type: application/json
Authorization: Bearer {token}

{
  "nom": "Élevage des Collines",
  "adresse": "123 Route de la Ferme, 12345 Ruralville",
  "telephone": "01 23 45 67 89",
  "email": "contact@elevage-collines.fr",
  "description": "Élevage spécialisé en bovins"
}
```

### Obtenir un élevage spécifique
```http
GET /api/elevages/{id}
Authorization: Bearer {token}
```

### Modifier un élevage
```http
PUT /api/elevages/{id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "nom": "Élevage des Collines Vertes",
  "adresse": "123 Route de la Ferme, 12345 Ruralville",
  "telephone": "01 23 45 67 89"
}
```

## Gestion des Animaux

### Lister les animaux
```http
GET /api/animals
Authorization: Bearer {token}
```

**Paramètres de requête optionnels :**
- `elevage_id` : Filtrer par élevage
- `race_id` : Filtrer par race
- `type_animal_id` : Filtrer par type d'animal
- `search` : Recherche textuelle (nom, numéro)

### Ajouter un animal
```http
POST /api/animals
Content-Type: application/json
Authorization: Bearer {token}

{
  "nom": "Bella",
  "numero": "FR001234567890",
  "elevage_id": 1,
  "race_id": 3,
  "type_animal_id": 1,
  "date_naissance": "2023-05-15",
  "sexe": "F",
  "mere_id": null,
  "pere_id": null
}
```

### Obtenir un animal spécifique
```http
GET /api/animals/{id}
Authorization: Bearer {token}
```

### Modifier un animal
```http
PUT /api/animals/{id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "nom": "Bella II",
  "numero": "FR001234567890",
  "race_id": 3
}
```

### Supprimer un animal
```http
DELETE /api/animals/{id}
Authorization: Bearer {token}
```

## Référentiels

### Races d'animaux

#### Lister les races
```http
GET /api/races
Authorization: Bearer {token}
```

**Paramètres optionnels :**
- `type_animal_id` : Filtrer par type d'animal

#### Créer une race
```http
POST /api/races
Content-Type: application/json
Authorization: Bearer {token}

{
  "nom": "Limousine",
  "type_animal_id": 1,
  "description": "Race bovine française"
}
```

### Types d'animaux

#### Lister les types
```http
GET /api/types-animaux
Authorization: Bearer {token}
```

#### Créer un type
```http
POST /api/types-animaux
Content-Type: application/json
Authorization: Bearer {token}

{
  "nom": "Bovins",
  "description": "Famille des bovins domestiques"
}
```

## Administration

### Gestion des comptes en attente
```http
GET /api/admin/pending-users
Authorization: Bearer {token}
```

### Valider un compte
```http
PUT /api/admin/users/{id}/approve
Authorization: Bearer {token}
```

### Rejeter un compte
```http
PUT /api/admin/users/{id}/reject
Authorization: Bearer {token}
```

## Codes de Statut HTTP

### Succès
- `200 OK` : Requête réussie
- `201 Created` : Ressource créée avec succès
- `204 No Content` : Suppression réussie

### Erreurs Client
- `400 Bad Request` : Données invalides
- `401 Unauthorized` : Token manquant ou invalide
- `403 Forbidden` : Accès refusé
- `404 Not Found` : Ressource non trouvée
- `422 Unprocessable Entity` : Erreurs de validation

### Erreurs Serveur
- `500 Internal Server Error` : Erreur serveur

## Format des Réponses

### Réponse de succès
```json
{
  "status": 200,
  "message": "Opération réussie",
  "data": { /* données */ },
  "timestamp": "2025-09-20T10:30:00+00:00"
}
```

### Réponse d'erreur
```json
{
  "status": 400,
  "message": "Données invalides",
  "errors": {
    "email": ["L'email est requis"],
    "password": ["Le mot de passe doit contenir au moins 8 caractères"]
  },
  "timestamp": "2025-09-20T10:30:00+00:00"
}
```

## Pagination

Pour les listes importantes, utilisez les paramètres :
- `limit` : Nombre d'éléments par page (défaut: 50, max: 100)
- `offset` : Décalage (défaut: 0)

**Exemple :**
```http
GET /api/animals?limit=20&offset=40
```

**Réponse avec métadonnées :**
```json
{
  "status": 200,
  "data": [ /* animaux */ ],
  "meta": {
    "total": 150,
    "limit": 20,
    "offset": 40,
    "has_more": true
  }
}
```

## Filtrage et Recherche

### Opérateurs de filtrage
- `search` : Recherche textuelle
- `date_from` / `date_to` : Plage de dates
- `status` : Filtrage par statut

**Exemples :**
```http
GET /api/animals?search=bella&date_from=2023-01-01&date_to=2023-12-31
GET /api/users?status=1&limit=10
```

## Gestion des Erreurs

### Validation des données
```json
{
  "status": 422,
  "message": "Erreurs de validation",
  "errors": {
    "nom": ["Le nom est requis"],
    "email": ["L'email doit être valide", "Cet email est déjà utilisé"],
    "date_naissance": ["La date doit être antérieure à aujourd'hui"]
  }
}
```

### Erreurs d'authentification
```json
{
  "status": 401,
  "message": "Token JWT invalide ou expiré"
}
```

### Erreurs d'autorisation
```json
{
  "status": 403,
  "message": "Accès refusé : privilèges insuffisants"
}
```

## Exemples d'utilisation

### JavaScript / Fetch API
```javascript
// Connexion
const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'motdepasse'
  })
});

const { data } = await loginResponse.json();
const token = data.token;

// Utilisation du token
const animalsResponse = await fetch('http://localhost:3001/api/animals', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const animals = await animalsResponse.json();
```

### cURL
```bash
# Connexion
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"motdepasse"}'

# Utilisation avec token
curl -X GET http://localhost:3001/api/animals \
  -H "Authorization: Bearer {token}"
```

## Limites et Quotas

### Limites de taux
- **Non authentifié** : 60 requêtes/heure
- **Authentifié** : 1000 requêtes/heure
- **Admin** : 5000 requêtes/heure

### Taille des requêtes
- **Taille maximale** : 10 MB
- **Timeout** : 30 secondes

## Sécurité

### Bonnes pratiques
- Toujours utiliser HTTPS en production
- Stocker les tokens de manière sécurisée
- Implémenter un refresh token pour les applications long-terme
- Valider toutes les entrées côté client ET serveur
- Ne jamais exposer d'informations sensibles dans les logs

### Headers de sécurité recommandés
```http
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```