# Changelog - AnimaLineage

## Version 2.1.2 - 2025-09-21 (Fonctionnalité)

### 🆕 Nouvelle Fonctionnalité : Gestion des Utilisateurs d'Élevage

#### Système de Permissions
- **Administrateurs (rôle=1)** : Gestion complète de tous les élevages
  - Peuvent ajouter/supprimer des utilisateurs à n'importe quel élevage
  - Accès universel aux fonctionnalités de gestion
- **Modérateurs (rôle=2)** : Gestion limitée à leurs élevages
  - Peuvent gérer uniquement les élevages dont ils sont propriétaires
  - `moderator@test.com` peut maintenant gérer "Les prés du haut"
- **Utilisateurs (rôle=3)** : Aucun accès aux fonctions de gestion

#### API REST Complète
- **GET `/api/elevages/{id}/users`** : Liste des utilisateurs d'un élevage
- **POST `/api/elevages/{id}/users`** : Ajout d'utilisateur avec validation
- **DELETE `/api/elevages/{id}/users/{userId}`** : Suppression d'utilisateur

#### Sécurité & Validation
- ✅ **Validation utilisateurs actifs** : Seuls les utilisateurs `status=1` peuvent être ajoutés
- ✅ **Protection propriétaires** : Impossible de supprimer le propriétaire d'un élevage
- ✅ **Prévention doublons** : Vérification d'unicité utilisateur/élevage
- ✅ **Authentification JWT** : Toutes les routes protégées

#### Base de Données
```sql
CREATE TABLE elevage_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    elevage_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role_in_elevage VARCHAR(20) DEFAULT 'collaborator',
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    added_by_user_id INTEGER,
    FOREIGN KEY (elevage_id) REFERENCES elevages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(elevage_id, user_id)
);
```

#### Tests de Validation
- ✅ `moderator@test.com` ajoute `read@test.com` à "Les prés du haut"
- ✅ `admin@test.com` gère n'importe quel élevage
- ✅ `read@test.com` accès refusé pour la gestion
- ✅ Suppression et ajout d'utilisateurs fonctionnels

#### Frontend Prêt
- Component `ElevageUsersManagement.tsx` compatible
- Interface complète pour la gestion visuelle
- Permissions dynamiques dans l'UI

---

## Version 2.1.1 - 2025-09-21 (Patch)

### 🐛 Corrections Critiques

#### Filtrage Animaux par Élevage
- **Problème résolu** : Les administrateurs voyaient tous les animaux lors de la consultation d'un élevage spécifique
- **Cause** : `AnimalController::getAnimaux()` ignorait le paramètre `elevage_id` pour les admins
- **Solution** : Refactoring pour respecter le filtre `elevage_id` pour tous les utilisateurs
- **Impact** : L'interface ElevageDetail affiche maintenant correctement uniquement les animaux de l'élevage consulté

#### Code modifié
```php
// backend/controllers/AnimalController.php:37-61
public function getAnimaux($user_id, $user_role) {
    $elevage_id = isset($_GET['elevage_id']) ? $_GET['elevage_id'] : null;

    if ($elevage_id) {
        // Filtrer par élevage spécifique (admin ou utilisateur)
        if ($user_role == 1) {
            $stmt = $this->animal->getByElevageId($elevage_id); // ✅ Fixé
        } else {
            // Vérification des droits utilisateur + filtre elevage_id
        }
    }
    // ...
}
```

#### Tests de validation
- ✅ `/api/animaux` → Tous les animaux (comportement inchangé)
- ✅ `/api/animaux?elevage_id=2` → Seulement animaux élevage 2
- ✅ `/api/animaux?elevage_id=3` → Seulement animaux élevage 3

---

## Version 2.1.0 - 2025-09-21

### 🎨 Interface Utilisateur

#### Migration vers Tailwind CSS
- **Refactoring complet** des composants animaux (AnimalDashboard, AnimalForm, AnimalList)
- **Configuration Tailwind v3.4.0** avec PostCSS et Autoprefixer
- **Thème sombre harmonisé** avec palette de couleurs cohérente :
  - Arrière-plan principal : `#282c34`
  - Conteneurs : `#374151`
  - Accents sombres : `#1f2937`
- **Classes utilitaires créées** pour boutons, formulaires et badges de statut

#### Améliorations Design
- **Logo intégré** : Remplacement du titre h1 par `/logo_full.svg` dans MainDashboard
- **Formulaires optimisés** : Meilleure UX pour la sélection des propriétaires d'élevage
- **Interface responsive** conservée avec Tailwind

### 🔐 Sécurité et Contrôles d'Accès

#### Restrictions par Rôle
- **Types & Races** : Accès restreint aux Administrateurs uniquement (rôle 1)
  - Frontend : Onglet masqué pour les non-administrateurs
  - Backend : Vérification de rôle sur toutes les routes `/api/types-animaux` et `/api/races`

#### Validation Utilisateurs
- **Filtrage automatique** : Seuls les utilisateurs validés (status = 1) apparaissent dans les formulaires
- **Correction UserController** : Migration de `$this->user->database` vers `$this->database`
- **Authentification cohérente** : Migration localStorage → sessionStorage partout

### 🐄 Fonctionnalités Métier

#### Gestion Intelligente des Parents
- **Validation par espèce** : Sélection des parents limitée à la même espèce (type d'animal)
- **Croisement autorisé** : Races différentes mais même espèce (ex: Chèvre Alpine × Chèvre Saanen ✅)
- **Croisement interdit** : Espèces différentes (ex: Chèvre × Mouton ❌)
- **Mise à jour dynamique** : Liste des parents se recharge automatiquement à la sélection de race

#### Système de Transferts
- **Nouveau contrôleur** : `TransferRequestController.php` pour la gestion complète
- **Nouveau modèle** : `TransferRequest.php` avec statuts et validations
- **Interface frontend** : `TransferRequestManager.tsx` pour gérer les demandes
- **Workflows complets** : Création, validation, rejet des demandes de transfert

#### Infrastructure Multi-langues
- **i18n configuré** : Structure `react-i18next` mise en place
- **Sélecteur de langue** : `LanguageSelector.tsx` créé
- **Store Redux** : Architecture centralisée pour l'état global

### 🛠️ Corrections Techniques

#### Fixes Backend
- **Serveur PHP** : Configuration `php -S 0.0.0.0:3001` pour éviter les erreurs de connexion
- **UserController** : Correction accès propriété privée `database`
- **Routes sécurisées** : Validation d'authentification sur toutes les nouvelles routes

#### Fixes Frontend
- **Boucles infinies** : Optimisation des dépendances useCallback dans AnimalForm
- **Types TypeScript** : Correction erreurs de syntaxe JSX
- **Performance** : Réduction des re-renders inutiles

#### Fixes Critiques
- **Filtrage animaux par élevage** : Correction majeure dans AnimalController.php
  - **Problème** : Les administrateurs voyaient tous les animaux même en consultant un élevage spécifique
  - **Solution** : Respect du paramètre `elevage_id` pour tous les utilisateurs (admin et non-admin)
  - **Impact** : Affichage correct des animaux par élevage dans ElevageDetail

#### Tests Unitaires
- **ElevageList.test.tsx** : Tests de la liste des élevages
- **MainDashboard.test.tsx** : Tests du tableau de bord principal
- **AuthContext.test.tsx** : Tests du contexte d'authentification
- **Utilitaires de test** : `test-helpers.tsx` pour les mocks

### 📁 Nouveaux Fichiers

#### Frontend
```
src/
├── components/
│   ├── TransferRequestManager.tsx    # Gestion demandes transfert
│   ├── LanguageSelector.tsx          # Sélecteur de langue
│   ├── ElevageUsersManagement.tsx    # Gestion utilisateurs élevage
│   └── TransferRequestDialog.tsx     # Dialog de demande transfert
├── i18n/                            # Infrastructure internationalisation
├── store/                           # Store Redux configuré
├── hooks/                           # Hooks personnalisés
└── utils/
    ├── errorHandler.ts              # Gestion centralisée erreurs
    └── errorCodes.ts                # Codes d'erreur standardisés
```

#### Backend
```
backend/
├── controllers/
│   ├── SimpleAdminController.php    # Admin simplifié
│   └── TransferRequestController.php # Demandes transfert
├── models/
│   └── TransferRequest.php          # Modèle transfert
└── PHP_8.4_MIGRATION.md            # Guide migration PHP
```

#### Configuration
```
frontend/
├── tailwind.config.js               # Configuration Tailwind
├── postcss.config.js                # Configuration PostCSS
└── public/logo_full.svg             # Logo application
```

### 🔧 Améliorations Techniques

#### Filtrage et API
- **AnimalController.php** : Refactoring majeur de la méthode `getAnimaux()`
  ```php
  // Avant (bug) : Admin voit tous les animaux ignorant elevage_id
  if ($user_role == 1) {
      $stmt = $this->animal->getAll(); // ❌
  }

  // Après (fix) : Respect du filtre elevage_id pour tous
  if ($elevage_id) {
      if ($user_role == 1) {
          $stmt = $this->animal->getByElevageId($elevage_id); // ✅
      }
  }
  ```
- **Tests API validés** :
  - `/api/animaux` → Tous les animaux (5 total)
  - `/api/animaux?elevage_id=2` → Animaux élevage 2 uniquement (3 animaux)
  - `/api/animaux?elevage_id=3` → Animaux élevage 3 uniquement (1 animal)

#### CSS & Styling
- **Tailwind CSS v3.4.0** : Migration complète des composants animaux
- **PostCSS configuré** : Pipeline de build optimisé
- **Classes utilitaires** : Réutilisabilité maximisée
- **Thème cohérent** : Palette de couleurs standardisée

#### Architecture
- **Store Redux** : Gestion d'état centralisée
- **Hooks personnalisés** : Logique réutilisable
- **Contrôleurs séparés** : Administration simple vs complète
- **Validation robuste** : Côté client et serveur

#### Performance
- **useCallback optimisé** : Réduction des re-renders
- **Lazy loading** : Composants chargés à la demande
- **Memoization** : Calculs coûteux mis en cache

### 🚀 Prochaines Étapes

#### Fonctionnalités à Développer
- [ ] Système de notifications en temps réel
- [ ] Export de données (PDF, Excel)
- [ ] Rapports et statistiques avancés
- [ ] API mobile pour application native

#### Améliorations Techniques
- [ ] Tests E2E avec Cypress
- [ ] Documentation API avec Swagger
- [ ] CI/CD avec GitHub Actions
- [ ] Monitoring et logs centralisés

---

**Statut** : Production Ready ✅
**Version précédente** : 2.0.0
**Compatibilité** : PHP 8.4+, Node.js 18+, React 19+