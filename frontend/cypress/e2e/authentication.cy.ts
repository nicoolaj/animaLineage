describe('Authentification E2E', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.cleanupTestData();
  });

  describe('Processus de connexion', () => {
    it('permet à un utilisateur de se connecter avec des identifiants valides', () => {
      cy.mockApiCalls();

      // Saisir les identifiants
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('password123');

      // Cliquer sur connexion
      cy.get('button[type="submit"]').contains(/se connecter/i).click();

      // Vérifier la redirection vers le dashboard
      cy.url().should('not.include', '/login');
      cy.contains(/tableau de bord|dashboard/i).should('be.visible');
      cy.contains(/bienvenue/i).should('be.visible');
    });

    it('affiche une erreur avec des identifiants invalides', () => {
      // Saisir des identifiants incorrects
      cy.get('input[type="email"]').type('wrong@example.com');
      cy.get('input[type="password"]').type('wrongpassword');

      // Intercepter l'appel API avec une erreur
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 401,
        body: { message: 'Identifiants incorrects' }
      }).as('loginError');

      // Cliquer sur connexion
      cy.get('button[type="submit"]').contains(/se connecter/i).click();

      // Vérifier l'affichage de l'erreur
      cy.wait('@loginError');
      cy.contains(/identifiants incorrects/i).should('be.visible');
      cy.url().should('include', '/');
    });

    it('valide les champs requis', () => {
      // Essayer de se connecter sans remplir les champs
      cy.get('button[type="submit"]').contains(/se connecter/i).click();

      // Vérifier les messages d'erreur de validation
      cy.contains(/email requis/i).should('be.visible');
      cy.contains(/mot de passe requis/i).should('be.visible');
    });

    it('valide le format de l\'email', () => {
      cy.get('input[type="email"]').type('email-invalide');
      cy.get('input[type="password"]').type('password123');

      cy.get('button[type="submit"]').contains(/se connecter/i).click();

      cy.contains(/email invalide/i).should('be.visible');
    });
  });

  describe('Processus d\'inscription', () => {
    it('permet à un nouvel utilisateur de s\'inscrire', () => {
      // Aller vers le formulaire d'inscription
      cy.contains(/créer un compte/i).click();

      // Vérifier que nous sommes sur le formulaire d'inscription
      cy.contains(/inscription/i).should('be.visible');

      // Remplir le formulaire
      cy.get('input[placeholder*="nom"]').type('Nouvel Utilisateur');
      cy.get('input[type="email"]').type('nouveau@example.com');
      cy.get('input[placeholder*="Mot de passe"]:first').type('password123');
      cy.get('input[placeholder*="Confirmer"]').type('password123');

      // Intercepter l'appel d'inscription
      cy.intercept('POST', '**/api/auth/register', {
        statusCode: 201,
        body: { message: 'Utilisateur créé avec succès' }
      }).as('registerSuccess');

      // Soumettre le formulaire
      cy.get('button[type="submit"]').contains(/s'inscrire/i).click();

      // Vérifier le succès
      cy.wait('@registerSuccess');
      cy.contains(/succès|créé/i).should('be.visible');
    });

    it('valide la correspondance des mots de passe', () => {
      cy.contains(/créer un compte/i).click();

      cy.get('input[placeholder*="nom"]').type('Test User');
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[placeholder*="Mot de passe"]:first').type('password123');
      cy.get('input[placeholder*="Confirmer"]').type('differentpassword');

      cy.get('button[type="submit"]').contains(/s'inscrire/i).click();

      cy.contains(/mots de passe ne correspondent pas/i).should('be.visible');
    });

    it('bascule entre connexion et inscription', () => {
      // Aller vers l'inscription
      cy.contains(/créer un compte/i).click();
      cy.contains(/inscription/i).should('be.visible');

      // Retourner à la connexion
      cy.contains(/déjà un compte/i).click();
      cy.contains(/connexion/i).should('be.visible');
    });
  });

  describe('Déconnexion', () => {
    it('permet à un utilisateur connecté de se déconnecter', () => {
      // Se connecter d'abord
      cy.login();

      // Se déconnecter
      cy.logout();

      // Vérifier que nous sommes revenus à la page de connexion
      cy.url().should('include', '/');
      cy.get('input[type="email"]').should('be.visible');
    });
  });

  describe('Sécurité et sessions', () => {
    it('persiste la session après rechargement de page', () => {
      cy.login();

      // Recharger la page
      cy.reload();

      // Vérifier que l'utilisateur reste connecté
      cy.contains(/tableau de bord|dashboard/i).should('be.visible');
    });

    it('redirige vers la connexion si le token expire', () => {
      cy.login();

      // Simuler l'expiration du token
      cy.window().then((win) => {
        win.localStorage.removeItem('token');
        win.localStorage.removeItem('user');
      });

      // Recharger la page
      cy.reload();

      // Vérifier la redirection vers la connexion
      cy.get('input[type="email"]').should('be.visible');
    });

    it('protège contre les attaques XSS dans les champs de saisie', () => {
      const xssPayload = '<script>alert("XSS")</script>';

      cy.get('input[type="email"]').type(xssPayload);
      cy.get('input[type="password"]').type('password123');

      cy.get('button[type="submit"]').contains(/se connecter/i).click();

      // Vérifier que le script n'est pas exécuté
      cy.on('window:alert', () => {
        throw new Error('XSS attack successful - should not happen');
      });

      // Le payload doit être traité comme du texte
      cy.contains(/email invalide/i).should('be.visible');
    });
  });

  describe('Accessibilité', () => {
    it('respecte les standards d\'accessibilité', () => {
      cy.checkA11y();

      // Vérifier la navigation au clavier
      cy.get('input[type="email"]').focus().tab();
      cy.get('input[type="password"]').should('be.focused');

      cy.tab();
      cy.get('button[type="submit"]').should('be.focused');
    });

    it('a des labels appropriés pour les lecteurs d\'écran', () => {
      cy.get('input[type="email"]').should('have.attr', 'placeholder');
      cy.get('input[type="password"]').should('have.attr', 'placeholder');

      // Vérifier les types d'input appropriés
      cy.get('input[type="email"]').should('have.attr', 'type', 'email');
      cy.get('input[type="password"]').should('have.attr', 'type', 'password');
    });
  });

  describe('Responsive Design', () => {
    it('fonctionne correctement sur mobile', () => {
      cy.viewport('iphone-6');

      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');

      // Tester la connexion sur mobile
      cy.login();
      cy.contains(/tableau de bord|dashboard/i).should('be.visible');
    });

    it('fonctionne correctement sur tablette', () => {
      cy.viewport('ipad-2');

      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });
  });
});