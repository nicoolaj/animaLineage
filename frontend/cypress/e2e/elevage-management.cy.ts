/// <reference types="cypress" />

describe("Tests de gestion des élevages", () => {
  beforeEach(() => {
    // Mock de l'authentification
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

    // Mock des élevages
    cy.intercept("GET", "**/api/elevages", {
      statusCode: 200,
      body: [
        {
          id: 1,
          nom: "Élevage Test",
          adresse: "123 Rue Test",
          proprietaire_nom: "Test User",
          description: "Description test",
          created_at: "2024-01-01",
          races: []
        }
      ]
    });

    cy.visit("/");
    cy.get("input[type=\"email\"]").type("admin@example.com");
    cy.get("input[type=\"password\"]").type("password123");
    cy.get("button[type=\"submit\"]").click();
  });

  it("devrait afficher la liste des élevages", () => {
    cy.contains("Élevage Test").should("be.visible");
    cy.contains("123 Rue Test").should("be.visible");
  });

  it("devrait permettre de créer un nouvel élevage", () => {
    cy.intercept("POST", "**/api/elevages", {
      statusCode: 201,
      body: {
        id: 2,
        nom: "Nouvel Élevage",
        adresse: "456 Rue Nouvelle",
        proprietaire_nom: "Test User"
      }
    });

    cy.contains("Nouveau élevage").click();
    cy.get("input[name=\"nom\"]").type("Nouvel Élevage");
    cy.get("input[name=\"adresse\"]").type("456 Rue Nouvelle");
    cy.get("button[type=\"submit\"]").click();

    cy.contains("Élevage créé avec succès").should("be.visible");
  });
});
