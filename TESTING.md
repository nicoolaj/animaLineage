# Guide de Tests - AnimaLineage

Ce document détaille l'architecture de tests, les patterns utilisés, et les améliorations apportées au système de tests de l'application AnimaLineage.

## 📊 État Actuel des Tests

### Frontend (Jest + React Testing Library)
- **Redux Slices**: ✅ **159/159 tests passent** (100% succès)
- **Build TypeScript**: ✅ **Compilation réussie**
- **Tests de composants**: ⚠️ **Problèmes MSW en cours de résolution**

### Backend (PHPUnit)
- **Tests PHP**: 🔄 **À configurer**

## 🏗️ Architecture de Tests Frontend

### Tests Redux - Approche d'Isolation Pure

Nous utilisons une **approche d'isolation pure** pour tous les tests Redux, évitant les dépendances réseau et les mocks complexes.

#### Pattern de Test Utilisé
```typescript
describe('sliceName', () => {
  const initialState = { /* état initial */ };

  describe('extraReducers', () => {
    describe('asyncAction', () => {
      it('should handle pending', () => {
        const action = { type: asyncAction.pending.type };
        const state = reducer(initialState, action);
        expect(state.isLoading).toBe(true);
      });

      it('should handle fulfilled', () => {
        const action = { type: asyncAction.fulfilled.type, payload: mockData };
        const state = reducer(initialState, action);
        expect(state.data).toEqual(mockData);
      });

      it('should handle rejected with null payload', () => {
        const action = { type: asyncAction.rejected.type, payload: null };
        const state = reducer(initialState, action);
        expect(state.error).toEqual({
          code: ERROR_CODES.SYS_010,
          message: 'Default error message'
        });
      });
    });
  });
});
```

#### Avantages de cette Approche
- ✅ **Tests rapides** - Pas de réseau ni d'I/O
- ✅ **Tests fiables** - Pas d'effets de bord
- ✅ **Tests isolés** - Chaque test est indépendant
- ✅ **Couverture complète** - Tous les cas d'usage testés

### Tests par Slice Redux

#### 1. authSlice.test.ts (38 tests)
```bash
npm test -- src/store/slices/__tests__/authSlice.test.ts
```
- Tests d'authentification (login, register, initialize)
- Tests des sélecteurs de rôles (admin, moderator)
- Tests de transition d'état
- Gestion des erreurs uniformisée

#### 2. userSlice.test.ts (24 tests)
```bash
npm test -- src/store/slices/__tests__/userSlice.test.ts
```
- Tests de gestion des utilisateurs
- Tests de fetch des utilisateurs disponibles
- Tests de gestion des races
- Cas d'usage complets

#### 3. elevageSlice.test.ts (43 tests)
```bash
npm test -- src/store/slices/__tests__/elevageSlice.test.ts
```
- Tests CRUD complets des élevages
- Tests de gestion des utilisateurs d'élevage
- Tests de filtrage (showMyOnly)
- Gestion d'état complexe

#### 4. animalSlice.test.ts (41 tests)
```bash
npm test -- src/store/slices/__tests__/animalSlice.test.ts
```
- Tests CRUD des animaux
- Tests de marquage de décès
- Tests de gestion des descendants
- Cas d'erreur complets

#### 5. languageSlice.test.ts (13 tests)
```bash
npm test -- src/store/slices/__tests__/languageSlice.test.ts
```
- Tests d'internationalisation
- Tests de sauvegarde localStorage
- Tests de fallback de langue

## 🔧 Corrections Apportées

### 1. Uniformisation de la Gestion d'Erreurs

**Problème identifié**: Les slices géraient les payloads null de façon incohérente.

**Solution**: Standardisation avec l'opérateur nullish coalescing (`??`)

```typescript
// Avant (incohérent)
state.error = action.payload || null;  // Dans certains slices
state.error = action.payload ?? defaultError;  // Dans d'autres

// Après (uniformisé)
state.error = action.payload ?? {
  code: ERROR_CODES.SYS_010,
  message: 'Message d\'erreur spécifique au contexte'
};
```

### 2. Correction des Erreurs AuthContext

**Problème**: Tests utilisant `AuthContext` directement, mais non exporté.

**Solution**: Mocking correct via `useAuth` hook
```typescript
// Avant (cassé)
import { AuthContext } from '../../contexts/AuthContext';
<AuthContext.Provider value={mockContext}>

// Après (correct)
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ /* mock values */ }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));
```

### 3. Correction userEvent.setup()

**Problème**: Tests utilisant l'API v14 alors que le projet a v13.5.0.

**Solution**: Migration vers l'API v13
```typescript
// Avant (v14 - cassé)
const user = userEvent.setup();
await user.click(button);

// Après (v13 - correct)
await userEvent.click(button);
```

## 🚀 Patterns de Test Recommandés

### Pour les Tests Redux
1. **Tests d'isolation pure** - Pas de mocks réseau
2. **Tests de tous les états** - pending, fulfilled, rejected
3. **Tests avec payload null** - Vérifier les erreurs par défaut
4. **Tests de sélecteurs** - Valider la logique de sélection

### Pour les Tests de Composants
1. **Mocking AuthContext** via `useAuth` hook
2. **userEvent v13** - Utilisation directe sans setup
3. **Éviter MSW** - Préférer les mocks fetch simples
4. **Tests d'isolation** - Un composant à la fois

## 🔧 GitHub Actions - Workflow de Tests

### Configuration CI/CD
Le projet utilise un **workflow GitHub Actions complet** (`.github/workflows/comprehensive-testing.yml`) qui exécute :

#### 🐘 Tests PHP Backend
- **PHPUnit** avec PHP 8.4
- **Couverture de code** avec Codecov
- **Tests unitaires et d'intégration**

#### ⚛️ Tests React Frontend
- **Jest** avec Node.js 18 et 20
- **Tests Redux** (159 tests passants)
- **Couverture frontend** avec Codecov

#### 🔒 Tests de Sécurité
- **Audit npm** des dépendances frontend
- **Vérification Composer** backend
- **Rapports de sécurité** automatisés

#### 🔄 Tests End-to-End
- **Cypress** avec Chrome et Firefox
- **Tests d'authentification**
- **Tests de gestion d'élevage**
- **Tests d'accessibilité**

#### ⚡ Tests de Performance
- **Lighthouse** pour performance web
- **Métriques d'accessibilité**
- **Rapports automatiques** sur les PR

### Déclenchement Automatique
- **Push** sur branches `master` et `develop`
- **Pull Requests** vers ces branches
- **Tests nocturnes** quotidiens à 3h

### Corrections Appliquées
✅ **Branches** : `main/develop` → `master/develop`
✅ **Backend** : Suppression commandes Laravel inexistantes
✅ **Ports** : Alignement sur 3001 (backend) / 3002 (frontend)
✅ **Base de données** : Utilisation de `migrate.php` au lieu d'Artisan
✅ **Composer audit** : Remplacement par commande compatible

## 🐛 Problèmes Connus et Solutions

### Problèmes MSW (Mock Service Worker)

**Symptômes**:
```
response.clone is not a function
Warning: captured a request without a matching request handler
```

**Solutions en cours**:
1. **Option 1**: Configuration MSW propre avec handlers complets
2. **Option 2**: Remplacement par fetch mocking simple
3. **Option 3**: Tests d'isolation complète sans réseau

### Problèmes de Mémoire

**Symptômes**:
```
FATAL ERROR: Ineffective mark-compacts near heap limit
```

**Solutions**:
1. **Limitation des tests** avec `--maxFailures`
2. **Tests par batch** plutôt qu'exécution complète
3. **Optimisation Jest** avec cleanup approprié

## 📋 Commandes de Test Utiles

### Tests Redux (Tous fonctionnels)
```bash
# Tous les tests Redux
npm test -- src/store/slices/__tests__/

# Test spécifique
npm test -- src/store/slices/__tests__/authSlice.test.ts

# Tests avec couverture
npm test -- --coverage src/store/slices/__tests__/
```

### Tests CI/CD et GitHub Actions
```bash
# Tests complets (comme dans CI)
npm run test:all

# Tests CI spécifiques
npm run test:ci

# Tests E2E locaux
npm run test:e2e

# Tests de performance
npm run test:performance

# Audit de sécurité
npm run test:audit
```

### Tests de Composants (En cours de résolution)
```bash
# Tests de composants spécifiques
npm test -- src/components/__tests__/ElevageForm.test.tsx

# Tests avec limitation d'échecs
npm test -- --maxFailures=3 src/components/__tests__/
```

### Build et Vérifications
```bash
# Build TypeScript (vérifie la santé du code)
npm run build

# Lint (vérifications qualité)
npm run lint
```

## 📈 Métriques de Qualité

### Couverture de Tests Redux
- **authSlice**: 100% des actions et sélecteurs
- **userSlice**: 100% des cas d'usage
- **elevageSlice**: 100% CRUD + gestion utilisateurs
- **animalSlice**: 100% CRUD + cas métier spécifiques
- **languageSlice**: 100% i18n et localStorage

### Standards de Qualité
- ✅ **Build sans erreurs TypeScript**
- ✅ **Tests Redux 100% passants**
- ✅ **Gestion d'erreurs uniformisée**
- ✅ **Patterns de test documentés**
- ⚠️ **Tests composants en amélioration**

## 🔄 Roadmap Tests

### Phase 1 - ✅ Complétée
- [x] Tests Redux complets avec isolation
- [x] Uniformisation gestion d'erreurs
- [x] Correction AuthContext et userEvent
- [x] Documentation patterns

### Phase 2 - 🔄 En cours
- [ ] Résolution problèmes MSW
- [ ] Tests composants stables
- [ ] Optimisation mémoire
- [ ] Couverture de code complète

### Phase 3 - ✅ CI/CD Configuré
- [x] **CI/CD GitHub Actions** configuré avec workflow complet
- [x] **Tests automatiques** sur push/PR vers master/develop
- [x] **Tests E2E Cypress** avec Chrome et Firefox
- [x] **Tests de sécurité** et audit des dépendances
- [x] **Tests de performance** Lighthouse intégrés
- [ ] Optimisation couverture des tests composants

## 💡 Conseils pour Ajouter de Nouveaux Tests

### 1. Tests Redux
```typescript
// Template pour nouveau slice
import sliceReducer, { actionName, selectorName } from '../newSlice';
import { ERROR_CODES } from '../../../utils/errorCodes';

describe('newSlice', () => {
  const initialState = { /* état initial */ };

  // Test des reducers
  // Test des extraReducers (async)
  // Test des selectors
  // Test des transitions d'état
  // Test des cas d'erreur
});
```

### 2. Tests de Composants
```typescript
// Template pour composant
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ComponentName from '../ComponentName';

// Mock useAuth si nécessaire
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ /* mock auth */ }),
}));

describe('ComponentName', () => {
  // Tests de rendu
  // Tests d'interactions
  // Tests de props
  // Tests d'états
});
```

## 🆘 Dépannage

### Si les tests Redux échouent
1. Vérifier les imports des ERROR_CODES
2. Vérifier la structure initialState
3. Vérifier les types d'actions Redux

### Si les tests de composants échouent
1. Vérifier le mocking AuthContext
2. Utiliser userEvent v13 sans setup
3. Éviter les appels réseau réels

### Si build échoue
1. Vérifier les types TypeScript
2. Corriger les imports/exports
3. Vérifier la cohérence des interfaces

---

📝 **Note**: Ce guide est mis à jour régulièrement. Pour toute question ou amélioration, consulter l'équipe de développement.