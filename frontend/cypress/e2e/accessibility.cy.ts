import 'cypress-axe';

describe('Tests d\'Accessibilité E2E', () => {
  beforeEach(() => {
    cy.cleanupTestData();
    cy.injectAxe(); // Injecter axe-core pour les tests d'accessibilité
  });

  describe('Page de connexion', () => {
    it('respecte les standards d\'accessibilité WCAG 2.1', () => {
      cy.visit('/');
      cy.waitForPageLoad();

      // Vérifier l'accessibilité avec axe-core
      cy.checkA11y(null, {
        rules: {
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'focus-management': { enabled: true },
          'aria-labels': { enabled: true }
        }
      });
    });

    it('permet la navigation au clavier', () => {
      cy.visit('/');

      // Tester la navigation avec Tab
      cy.get('body').tab();
      cy.focused().should('have.attr', 'type', 'email');

      cy.focused().tab();
      cy.focused().should('have.attr', 'type', 'password');

      cy.focused().tab();
      cy.focused().should('contain.text', /se connecter/i);

      // Tester l'activation avec Entrée
      cy.get('input[type="email"]').focus().type('test@example.com');
      cy.get('input[type="password"]').focus().type('password123');
      cy.focused().tab().type('{enter}');
    });

    it('a des labels appropriés pour les lecteurs d\'écran', () => {
      cy.visit('/');

      // Vérifier les attributs d'accessibilité
      cy.get('input[type="email"]')
        .should('have.attr', 'placeholder')
        .and('not.be.empty');

      cy.get('input[type="password"]')
        .should('have.attr', 'placeholder')
        .and('not.be.empty');

      // Vérifier les rôles ARIA si présents
      cy.get('button[type="submit"]')
        .should('have.attr', 'type', 'submit')
        .and('contain.text', /se connecter/i);
    });

    it('a un contraste de couleurs suffisant', () => {
      cy.visit('/');

      // Vérifier spécifiquement le contraste des couleurs
      cy.checkA11y(null, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
    });

    it('gère correctement le focus', () => {
      cy.visit('/');

      // Vérifier que le focus est visible
      cy.get('input[type="email"]').focus();
      cy.focused().should('have.css', 'outline').and('not.equal', 'none');

      cy.get('input[type="password"]').focus();
      cy.focused().should('have.css', 'outline').and('not.equal', 'none');

      cy.get('button[type="submit"]').focus();
      cy.focused().should('have.css', 'outline').and('not.equal', 'none');
    });
  });

  describe('Dashboard principal', () => {
    beforeEach(() => {
      cy.login();
      cy.mockApiCalls();
    });

    it('respecte les standards d\'accessibilité dans le dashboard', () => {
      cy.checkA11y(null, {
        rules: {
          'landmark-one-main': { enabled: true },
          'page-has-heading-one': { enabled: true },
          'heading-order': { enabled: true }
        }
      });
    });

    it('a une structure de titres cohérente', () => {
      // Vérifier la hiérarchie des titres
      cy.get('h1').should('exist').and('be.visible');
      cy.get('h1').should('contain.text', /tableau de bord|dashboard/i);

      // Vérifier qu'il n'y a qu'un seul H1
      cy.get('h1').should('have.length', 1);

      // Vérifier la présence de titres H2 ou H3 pour les sections
      cy.get('h2, h3').should('exist');
    });

    it('utilise des landmarks ARIA appropriés', () => {
      // Vérifier la présence des landmarks
      cy.get('header, [role="banner"]').should('exist');
      cy.get('main, [role="main"]').should('exist');
      cy.get('nav, [role="navigation"]').should('exist');

      // Vérifier qu'il n'y a qu'un seul main
      cy.get('main, [role="main"]').should('have.length', 1);
    });

    it('permet la navigation au clavier dans les onglets', () => {
      // Tester la navigation entre les onglets
      cy.get('[role="tab"], .nav-tab').first().focus();

      // Utiliser les flèches pour naviguer entre les onglets
      cy.focused().type('{rightarrow}');
      cy.focused().should('not.be', cy.get('[role="tab"], .nav-tab').first());

      // Tester l'activation avec Entrée ou Espace
      cy.focused().type('{enter}');
      cy.focused().should('have.class', 'active').or('have.attr', 'aria-selected', 'true');
    });
  });

  describe('Formulaires', () => {
    beforeEach(() => {
      cy.login('admin@example.com', 'admin123');
      cy.mockApiCalls();
    });

    it('respecte l\'accessibilité dans le formulaire d\'élevage', () => {
      cy.contains(/élevages/i).click();
      cy.get('button').contains(/nouveau élevage/i).click();

      cy.checkA11y(null, {
        rules: {
          'label': { enabled: true },
          'form-field-multiple-labels': { enabled: true },
          'duplicate-id': { enabled: true }
        }
      });
    });

    it('associe correctement les labels aux champs', () => {
      cy.contains(/élevages/i).click();
      cy.get('button').contains(/nouveau élevage/i).click();

      // Vérifier que chaque input a un label ou aria-label
      cy.get('input, select, textarea').each(($el) => {
        const id = $el.attr('id');
        const ariaLabel = $el.attr('aria-label');
        const ariaLabelledby = $el.attr('aria-labelledby');

        // Au moins une de ces conditions doit être vraie
        const hasLabel = id && cy.get(`label[for="${id}"]`).should('exist');
        const hasAriaLabel = ariaLabel && ariaLabel.trim().length > 0;
        const hasAriaLabelledby = ariaLabelledby && ariaLabelledby.trim().length > 0;

        expect(hasLabel || hasAriaLabel || hasAriaLabelledby).to.be.true;
      });
    });

    it('indique clairement les champs requis', () => {
      cy.contains(/élevages/i).click();
      cy.get('button').contains(/nouveau élevage/i).click();

      // Vérifier que les champs requis sont marqués
      cy.get('input[required], select[required]').each(($el) => {
        const label = $el.closest('label') || cy.get(`label[for="${$el.attr('id')}"]`);

        // Le label devrait contenir un astérisque ou aria-required
        expect($el.attr('aria-required')).to.equal('true')
          .or.expect($el.attr('required')).to.exist
          .or.expect(label.text()).to.include('*');
      });
    });

    it('affiche les erreurs de manière accessible', () => {
      cy.contains(/élevages/i).click();
      cy.get('button').contains(/nouveau élevage/i).click();

      // Soumettre le formulaire vide pour déclencher les erreurs
      cy.get('button[type="submit"]').click();

      // Vérifier que les erreurs sont liées aux champs
      cy.get('.error, [role="alert"], .invalid')
        .should('exist')
        .and('be.visible');

      // Vérifier l'accessibilité avec les erreurs affichées
      cy.checkA11y(null, {
        rules: {
          'aria-valid-attr-value': { enabled: true },
          'aria-describedby': { enabled: true }
        }
      });
    });
  });

  describe('Listes et tableaux', () => {
    beforeEach(() => {
      cy.login();
      cy.mockApiCalls();
    });

    it('structure correctement les listes d\'élevages', () => {
      cy.contains(/élevages/i).click();
      cy.wait('@getElevages');

      // Vérifier la structure des listes
      cy.checkA11y('.elevages-grid, .elevage-list', {
        rules: {
          'list': { enabled: true },
          'listitem': { enabled: true },
          'definition-list': { enabled: true }
        }
      });
    });

    it('fournit des alternatives textuelles pour les icônes', () => {
      cy.contains(/élevages/i).click();
      cy.wait('@getElevages');

      // Vérifier que les boutons avec icônes ont des labels
      cy.get('button[title], .btn[title]').each(($btn) => {
        const title = $btn.attr('title');
        const ariaLabel = $btn.attr('aria-label');
        const text = $btn.text().trim();

        expect(title || ariaLabel || text).to.not.be.empty;
      });
    });
  });

  describe('Navigation et orientation', () => {
    beforeEach(() => {
      cy.login();
      cy.mockApiCalls();
    });

    it('indique clairement la page actuelle', () => {
      // Vérifier que l'onglet actif est marqué
      cy.get('.nav-tab.active, [aria-selected="true"], [aria-current]')
        .should('exist')
        .and('be.visible');
    });

    it('fournit un fil d\'Ariane ou indication de navigation', () => {
      cy.contains(/élevages/i).click();

      // Aller vers un détail d'élevage
      cy.get('[title="Voir les animaux"]').first().click();

      // Vérifier qu'il y a un moyen de revenir (bouton retour, breadcrumb, etc.)
      cy.get('button, a').contains(/retour|back/i).should('exist');
    });
  });

  describe('Responsivité et accessibilité mobile', () => {
    it('reste accessible sur mobile', () => {
      cy.viewport('iphone-6');
      cy.login();

      // Vérifier l'accessibilité sur mobile
      cy.checkA11y(null, {
        rules: {
          'target-size': { enabled: true }, // Taille des zones de clic
          'scrollable-region-focusable': { enabled: true }
        }
      });
    });

    it('a des zones de clic suffisamment grandes sur mobile', () => {
      cy.viewport('iphone-6');
      cy.login();
      cy.mockApiCalls();

      cy.contains(/élevages/i).click();

      // Vérifier que les boutons sont assez grands (minimum 44px)
      cy.get('button, a, input[type="button"], input[type="submit"]').each(($el) => {
        cy.wrap($el).then(($el) => {
          const rect = $el[0].getBoundingClientRect();
          expect(rect.width).to.be.at.least(44);
          expect(rect.height).to.be.at.least(44);
        });
      });
    });
  });

  describe('Personnalisation et préférences', () => {
    it('respecte les préférences de mouvement réduit', () => {
      cy.visit('/', {
        onBeforeLoad: (win) => {
          // Simuler prefers-reduced-motion
          Object.defineProperty(win, 'matchMedia', {
            writable: true,
            value: jest.fn().mockImplementation(query => ({
              matches: query === '(prefers-reduced-motion: reduce)',
              media: query,
              onchange: null,
              addListener: jest.fn(),
              removeListener: jest.fn(),
              addEventListener: jest.fn(),
              removeEventListener: jest.fn(),
              dispatchEvent: jest.fn(),
            })),
          });
        },
      });

      // Vérifier qu'aucune animation ne se déclenche si non nécessaire
      cy.get('*').should('not.have.css', 'animation-duration', 'infinite');
    });

    it('fonctionne avec les lecteurs d\'écran', () => {
      cy.visit('/');

      // Vérifier la présence d'attributs ARIA pour les lecteurs d'écran
      cy.get('[aria-live], [aria-atomic], [role="status"], [role="alert"]')
        .should('exist');

      // Vérifier que les zones interactives sont bien décrites
      cy.get('button, a, input').each(($el) => {
        const accessibleName = $el.attr('aria-label') ||
                             $el.attr('title') ||
                             $el.text().trim() ||
                             $el.attr('alt');

        expect(accessibleName).to.not.be.empty;
      });
    });
  });
});