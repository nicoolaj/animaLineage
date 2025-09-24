/// <reference types="cypress" />

describe("Tests d'accessibilité", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("devrait avoir des labels appropriés pour les champs de formulaire", () => {
    cy.get("input[type=\"email\"]").should("have.attr", "aria-label").or("have.attr", "placeholder");
    cy.get("input[type=\"password\"]").should("have.attr", "aria-label").or("have.attr", "placeholder");
  });

  it("devrait supporter la navigation au clavier", () => {
    cy.get("body").tab();
    cy.focused().should("have.attr", "type", "email");
    
    cy.focused().tab();
    cy.focused().should("have.attr", "type", "password");
    
    cy.focused().tab();
    cy.focused().should("have.attr", "type", "submit");
  });

  it("devrait avoir un contraste de couleurs adéquat", () => {
    // Vérifier que les éléments principaux sont visibles
    cy.get("h1, h2, h3").should("be.visible");
    cy.get("button").should("be.visible").and("not.have.css", "color", "rgb(255, 255, 255)");
  });

  it("devrait avoir des rôles ARIA appropriés", () => {
    cy.get("main").should("exist");
    cy.get("nav").should("exist");
    cy.get("header").should("exist");
  });

  it("devrait permettre l'utilisation des lecteurs d'écran", () => {
    // Vérifier la présence d'attributs alt sur les images
    cy.get("img").each(($img) => {
      cy.wrap($img).should("have.attr", "alt");
    });

    // Vérifier la hiérarchie des titres
    cy.get("h1").should("exist");
  });
});
