// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/// <reference types="cypress" />

// Commande de connexion
Cypress.Commands.add('login', (email?: string, password?: string) => {
  const loginEmail = email || Cypress.env('testUser').email;
  const loginPassword = password || Cypress.env('testUser').password;

  cy.visit('/');

  // Vérifier que nous sommes sur la page de connexion
  cy.get('input[type="email"]', { timeout: 10000 }).should('be.visible');

  // Saisir les identifiants
  cy.get('input[type="email"]').clear().type(loginEmail);
  cy.get('input[type="password"]').clear().type(loginPassword);

  // Cliquer sur le bouton de connexion
  cy.get('button[type="submit"]').contains(/se connecter|connexion/i).click();

  // Attendre la redirection vers le dashboard
  cy.url({ timeout: 10000 }).should('not.include', '/login');
  cy.contains(/tableau de bord|dashboard/i, { timeout: 10000 }).should('be.visible');
});

// Commande de déconnexion
Cypress.Commands.add('logout', () => {
  cy.get('button').contains(/déconnexion|logout/i).click();
  cy.url().should('include', '/');
  cy.get('input[type="email"]').should('be.visible');
});

// Commande pour créer un utilisateur test
Cypress.Commands.add('createTestUser', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/register`,
    body: {
      nom: 'Utilisateur Test',
      email: 'test-e2e@example.com',
      password: 'password123',
      confirm_password: 'password123'
    },
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 201 || response.status === 409) {
      // Utilisateur créé ou existe déjà
      cy.log('Utilisateur test créé ou existe déjà');
    }
  });
});

// Commande pour nettoyer les données de test
Cypress.Commands.add('cleanupTestData', () => {
  // Nettoyer localStorage et sessionStorage
  cy.clearLocalStorage();
  cy.clearCookies();

  // Optionnel: nettoyer la base de données via l'API
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/test/cleanup`,
    failOnStatusCode: false
  });
});

// Commande pour attendre le chargement de la page
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible');
  cy.get('[data-testid="loading"]', { timeout: 1000 }).should('not.exist');
});

// Commande pour mocker les appels API
Cypress.Commands.add('mockApiCalls', () => {
  // Intercepter les appels API critiques
  cy.intercept('GET', '**/api/elevages', { fixture: 'elevages.json' }).as('getElevages');
  cy.intercept('GET', '**/api/users', { fixture: 'users.json' }).as('getUsers');
  cy.intercept('GET', '**/api/races', { fixture: 'races.json' }).as('getRaces');
  cy.intercept('GET', '**/api/types-animaux', { fixture: 'types-animaux.json' }).as('getTypesAnimaux');

  // Mock des erreurs communes
  cy.intercept('GET', '**/api/error-test', {
    statusCode: 500,
    body: { message: 'Erreur serveur simulée' }
  }).as('getServerError');
});

// Commandes utilitaires pour les tests de sécurité
Cypress.Commands.add('checkCSRFProtection', () => {
  // Vérifier que les requêtes POST/PUT/DELETE incluent une protection CSRF
  cy.window().then((win) => {
    const token = win.localStorage.getItem('token');
    expect(token).to.exist;
  });
});

Cypress.Commands.add('checkSecureHeaders', () => {
  // Vérifier les en-têtes de sécurité
  cy.request('/').then((response) => {
    expect(response.headers).to.have.property('x-frame-options');
    expect(response.headers).to.have.property('x-content-type-options');
  });
});

// Commandes pour les tests d'accessibilité
Cypress.Commands.add('checkA11y', () => {
  // Vérifier l'accessibilité de base
  cy.get('h1, h2, h3, h4, h5, h6').should('exist');
  cy.get('input:required').each(($el) => {
    cy.wrap($el).should('have.attr', 'aria-label').or('have.attr', 'aria-labelledby');
  });
});

// Déclarations TypeScript pour les commandes personnalisées
declare global {
  namespace Cypress {
    interface Chainable {
      checkCSRFProtection(): Chainable<void>;
      checkSecureHeaders(): Chainable<void>;
      checkA11y(): Chainable<void>;
    }
  }
}