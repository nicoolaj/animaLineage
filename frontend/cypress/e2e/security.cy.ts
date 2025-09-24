/// <reference types="cypress" />

describe("Tests de sécurité", () => {
  it("devrait protéger contre les injections XSS", () => {
    cy.visit("/");
    
    const maliciousScript = "<script>alert('XSS')</script>";
    
    cy.get("input[type=\"email\"]").type(maliciousScript);
    cy.get("input[type=\"password\"]").type("password");
    
    // Vérifier que le script malveillant n'est pas exécuté
    cy.get("input[type=\"email\"]").should("have.value", maliciousScript);
    cy.window().then((win) => {
      expect(win.document.body.innerHTML).not.to.contain("<script>");
    });
  });

  it("devrait valider les tokens d'authentification", () => {
    // Test avec un token invalide
    cy.intercept("GET", "**/api/elevages", {
      statusCode: 401,
      body: { message: "Token invalide" }
    });

    cy.visit("/");
    
    // Simuler une tentative d'accès avec un token invalide
    cy.window().then((win) => {
      win.localStorage.setItem("token", "invalid-token");
    });
    
    cy.reload();
    
    // Devrait rediriger vers la page de connexion
    cy.contains("Connexion").should("be.visible");
  });

  it("devrait limiter les tentatives de connexion", () => {
    cy.visit("/");
    
    // Simuler plusieurs tentatives échouées
    for (let i = 0; i < 5; i++) {
      cy.get("input[type=\"email\"]").clear().type("test@example.com");
      cy.get("input[type=\"password\"]").clear().type("wrongpassword");
      cy.get("button[type=\"submit\"]").click();
      cy.wait(500);
    }
    
    // Après plusieurs tentatives, devrait afficher un message de limitation
    cy.contains("Trop de tentatives").should("be.visible");
  });
});
