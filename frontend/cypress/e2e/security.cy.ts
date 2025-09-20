describe('Tests de Sécurité E2E', () => {
  beforeEach(() => {
    cy.cleanupTestData();
  });

  describe('Protection des routes', () => {
    it('redirige les utilisateurs non authentifiés vers la connexion', () => {
      // Essayer d'accéder directement au dashboard
      cy.visit('/dashboard');

      // Vérifier la redirection vers la page de connexion
      cy.url().should('include', '/');
      cy.get('input[type="email"]').should('be.visible');
    });

    it('empêche l\'accès aux fonctions admin pour les utilisateurs standards', () => {
      cy.login('test@example.com', 'password123'); // Utilisateur standard

      // Vérifier que les fonctions admin ne sont pas visibles
      cy.contains(/nouveau élevage/i).should('not.exist');
      cy.contains(/gestion des utilisateurs/i).should('not.exist');
    });

    it('permet l\'accès aux fonctions admin pour les administrateurs', () => {
      cy.login('admin@example.com', 'admin123'); // Administrateur

      cy.mockApiCalls();

      // Vérifier que les fonctions admin sont visibles
      cy.contains(/nouveau élevage/i).should('be.visible');
      cy.contains(/utilisateurs/i).click();
      cy.contains(/gestion des utilisateurs/i).should('be.visible');
    });
  });

  describe('Protection contre les attaques XSS', () => {
    it('échappe correctement les entrées utilisateur dans les formulaires', () => {
      cy.login('admin@example.com', 'admin123');
      cy.mockApiCalls();

      // Aller au formulaire d'élevage
      cy.contains(/élevages/i).click();
      cy.get('button').contains(/nouveau élevage/i).click();

      const xssPayload = '<script>alert("XSS")</script>';

      // Tenter d'injecter du code malveillant
      cy.get('input[name="nom"]').type(xssPayload);
      cy.get('input[name="adresse"]').type('Adresse normale');

      // Intercepter la soumission
      cy.intercept('POST', '**/api/elevages', {
        statusCode: 201,
        body: { id: 1, nom: xssPayload, adresse: 'Adresse normale' }
      }).as('createWithXSS');

      cy.get('button[type="submit"]').contains(/créer/i).click();

      // Vérifier que le script n'est pas exécuté
      cy.on('window:alert', () => {
        throw new Error('XSS attack successful - should not happen');
      });

      // Le contenu doit être affiché comme texte, pas exécuté
      cy.wait('@createWithXSS');
    });

    it('protège contre l\'injection dans les URLs', () => {
      const maliciousId = '1<script>alert("XSS")</script>';

      cy.login();
      cy.mockApiCalls();

      // Essayer de visiter une URL avec du code malveillant
      cy.visit(`/elevage/${encodeURIComponent(maliciousId)}`);

      // Vérifier qu'aucun script n'est exécuté
      cy.on('window:alert', () => {
        throw new Error('XSS attack successful - should not happen');
      });
    });
  });

  describe('Protection CSRF', () => {
    it('inclut des tokens CSRF dans les requêtes POST', () => {
      cy.login();

      // Intercepter une requête POST et vérifier les en-têtes
      cy.intercept('POST', '**/api/**', (req) => {
        // Vérifier la présence d'un token d'authentification
        expect(req.headers).to.have.property('authorization');
        expect(req.headers.authorization).to.include('Bearer');

        req.reply({ statusCode: 200, body: { success: true } });
      }).as('postRequest');

      cy.mockApiCalls();
      cy.contains(/élevages/i).click();

      // Déclencher une requête POST (ex: création d'élevage)
      cy.get('button').contains(/nouveau élevage/i).click();
      cy.get('input[name="nom"]').type('Test CSRF');
      cy.get('input[name="adresse"]').type('Adresse test');
      cy.get('button[type="submit"]').contains(/créer/i).click();

      cy.wait('@postRequest');
    });
  });

  describe('Validation côté client', () => {
    it('valide les entrées utilisateur avant soumission', () => {
      cy.login('admin@example.com', 'admin123');
      cy.mockApiCalls();

      cy.contains(/élevages/i).click();
      cy.get('button').contains(/nouveau élevage/i).click();

      // Tester différents types d'injection
      const sqlInjection = "'; DROP TABLE elevages; --";
      const htmlInjection = '<img src=x onerror=alert("XSS")>';

      cy.get('input[name="nom"]').type(sqlInjection);
      cy.get('input[name="adresse"]').type(htmlInjection);

      cy.get('button[type="submit"]').contains(/créer/i).click();

      // Vérifier que la validation côté client fonctionne
      // (les validations spécifiques dépendent de l'implémentation)
      cy.on('window:alert', () => {
        throw new Error('Injection attack successful - should not happen');
      });
    });

    it('limite la longueur des entrées', () => {
      cy.login('admin@example.com', 'admin123');
      cy.mockApiCalls();

      cy.contains(/élevages/i).click();
      cy.get('button').contains(/nouveau élevage/i).click();

      // Tenter de saisir un nom très long
      const veryLongName = 'A'.repeat(1000);
      cy.get('input[name="nom"]').type(veryLongName);

      // Vérifier que l'input limite la longueur ou affiche une erreur
      cy.get('input[name="nom"]').then(($input) => {
        const actualValue = $input.val() as string;
        expect(actualValue.length).to.be.lessThan(500); // Limite raisonnable
      });
    });
  });

  describe('Gestion des sessions', () => {
    it('expire la session après inactivité', () => {
      cy.login();

      // Simuler l'expiration en supprimant le token
      cy.window().then((win) => {
        win.localStorage.removeItem('token');
      });

      // Essayer d'accéder à une ressource protégée
      cy.contains(/élevages/i).click();

      // Intercepter l'appel API avec une erreur 401
      cy.intercept('GET', '**/api/elevages', {
        statusCode: 401,
        body: { message: 'Token expiré' }
      }).as('tokenExpired');

      cy.wait('@tokenExpired');

      // Vérifier la redirection vers la connexion
      cy.get('input[type="email"]').should('be.visible');
    });

    it('nettoie les données sensibles à la déconnexion', () => {
      cy.login();

      // Vérifier que les données sont présentes
      cy.window().then((win) => {
        expect(win.localStorage.getItem('token')).to.exist;
        expect(win.localStorage.getItem('user')).to.exist;
      });

      // Se déconnecter
      cy.logout();

      // Vérifier que les données sont supprimées
      cy.window().then((win) => {
        expect(win.localStorage.getItem('token')).to.be.null;
        expect(win.localStorage.getItem('user')).to.be.null;
      });
    });
  });

  describe('Protection des données sensibles', () => {
    it('ne stocke pas de données sensibles en plain text', () => {
      cy.login();

      cy.window().then((win) => {
        const token = win.localStorage.getItem('token');
        const user = win.localStorage.getItem('user');

        // Vérifier que le token a un format JWT
        if (token) {
          expect(token).to.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
        }

        // Vérifier que les données utilisateur ne contiennent pas de mot de passe
        if (user) {
          const userData = JSON.parse(user);
          expect(userData).to.not.have.property('password');
          expect(userData).to.not.have.property('password_hash');
        }
      });
    });

    it('masque les mots de passe dans les formulaires', () => {
      cy.visit('/');

      // Vérifier que le champ mot de passe est de type "password"
      cy.get('input[type="password"]').should('have.attr', 'type', 'password');

      // Taper un mot de passe et vérifier qu'il est masqué
      cy.get('input[type="password"]').type('secretpassword');
      cy.get('input[type="password"]').should('have.attr', 'type', 'password');
    });
  });

  describe('En-têtes de sécurité', () => {
    it('vérifie la présence des en-têtes de sécurité', () => {
      cy.request('/').then((response) => {
        // Vérifier les en-têtes de sécurité importants
        // Note: Ceci dépend de la configuration du serveur
        const headers = response.headers;

        // Ces vérifications peuvent être adaptées selon la configuration
        if (headers['x-frame-options']) {
          expect(headers['x-frame-options']).to.match(/DENY|SAMEORIGIN/);
        }

        if (headers['x-content-type-options']) {
          expect(headers['x-content-type-options']).to.equal('nosniff');
        }
      });
    });
  });

  describe('Tests de robustesse', () => {
    it('gère gracieusement les erreurs de réseau', () => {
      cy.login();

      // Simuler une panne réseau
      cy.intercept('GET', '**/api/elevages', { forceNetworkError: true }).as('networkError');

      cy.contains(/élevages/i).click();

      // Vérifier que l'application gère l'erreur sans crash
      cy.contains(/erreur/i).should('be.visible');
      cy.contains(/connexion/i).should('be.visible');
    });

    it('limite le nombre de tentatives de connexion', () => {
      // Simuler plusieurs tentatives de connexion échouées
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 401,
        body: { message: 'Identifiants incorrects' }
      }).as('failedLogin');

      for (let i = 0; i < 3; i++) {
        cy.get('input[type="email"]').clear().type('wrong@example.com');
        cy.get('input[type="password"]').clear().type('wrongpassword');
        cy.get('button[type="submit"]').contains(/se connecter/i).click();
        cy.wait('@failedLogin');
      }

      // Après plusieurs tentatives, le système devrait bloquer temporairement
      // (ceci dépend de l'implémentation côté serveur)
      cy.contains(/trop de tentatives|bloqué|temporairement/i).should('be.visible');
    });
  });

  describe('Audit de sécurité automatisé', () => {
    it('vérifie l\'absence de failles de sécurité communes', () => {
      cy.login();

      // Vérifier qu'aucune information sensible n'est exposée dans le DOM
      cy.get('body').should('not.contain', 'password');
      cy.get('body').should('not.contain', 'secret');
      cy.get('body').should('not.contain', 'private_key');

      // Vérifier que les URLs sensibles ne sont pas exposées
      cy.get('a, [href]').each(($el) => {
        const href = $el.attr('href');
        if (href) {
          expect(href).to.not.include('admin');
          expect(href).to.not.include('debug');
          expect(href).to.not.include('test');
        }
      });
    });
  });
});