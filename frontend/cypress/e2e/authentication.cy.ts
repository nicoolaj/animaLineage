/// <reference types="cypress" />

describe("Tests d'authentification", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("devrait afficher la page de connexion", () => {
    cy.contains("Connexion").should("be.visible");
    cy.get("input[type=\"email\"]").should("be.visible");
    cy.get("input[type=\"password\"]").should("be.visible");
  });

  it("devrait afficher une erreur avec des identifiants invalides", () => {
    cy.get("input[type=\"email\"]").type("invalid@example.com");
    cy.get("input[type=\"password\"]").type("wrongpassword");
    cy.get("button[type=\"submit\"]").click();

    cy.contains("Identifiants invalides").should("be.visible");
  });

  it("devrait permettre la connexion avec des identifiants valides", () => {
    // Test avec des données mockées
    cy.intercept("POST", "**/api/login", {
      statusCode: 200,
      body: {
        user: {
          id: 1,
          name: "Test User",
          email: "test@example.com",
          role: 1,
          role_name: "Admin"
        },
        token: "test-token"
      }
    });

    cy.get("input[type=\"email\"]").type("admin@example.com");
    cy.get("input[type=\"password\"]").type("password123");
    cy.get("button[type=\"submit\"]").click();

    cy.url().should("not.include", "/login");
    cy.contains("Bienvenue").should("be.visible");
  });
});
