// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';
import 'cypress-axe';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add global types
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Connexion avec un utilisateur test
       * @param email - Email de l'utilisateur
       * @param password - Mot de passe
       */
      login(email?: string, password?: string): Chainable<void>;

      /**
       * Déconnexion de l'utilisateur
       */
      logout(): Chainable<void>;

      /**
       * Création d'un utilisateur test
       */
      createTestUser(): Chainable<void>;

      /**
       * Nettoyage des données de test
       */
      cleanupTestData(): Chainable<void>;

      /**
       * Attendre que la page soit chargée
       */
      waitForPageLoad(): Chainable<void>;

      /**
       * Mock de l'API backend
       */
      mockApiCalls(): Chainable<void>;
    }
  }
}

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignorer certaines erreurs connues qui ne doivent pas faire échouer les tests
  if (err.message.includes('ChunkLoadError')) {
    return false;
  }
  if (err.message.includes('Loading chunk')) {
    return false;
  }
  return true;
});

// Configuration des cookies et localStorage
beforeEach(() => {
  // Préserver les cookies d'authentification entre les tests
  Cypress.Cookies.preserveOnce('token', 'user');

  // Vider localStorage avant chaque test (sauf si préservation explicite)
  cy.clearLocalStorage();
});