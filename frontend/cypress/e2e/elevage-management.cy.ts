describe('Gestion des Élevages E2E', () => {
  beforeEach(() => {
    cy.cleanupTestData();
    cy.login();
    cy.mockApiCalls();
  });

  describe('Liste des élevages', () => {
    it('affiche la liste des élevages', () => {
      // Naviguer vers l'onglet élevages (peut être déjà actif)
      cy.contains(/élevages/i).click();

      // Attendre le chargement des données
      cy.wait('@getElevages');

      // Vérifier l'affichage des élevages
      cy.contains(/gestion des élevages/i).should('be.visible');
      cy.contains('Élevage Test E2E').should('be.visible');
      cy.contains('Ferme de Test').should('be.visible');

      // Vérifier les informations affichées
      cy.contains('123 Rue de Test').should('be.visible');
      cy.contains('Utilisateur Test').should('be.visible');
      cy.contains('Brebis Lacaune').should('be.visible');
    });

    it('permet de filtrer les élevages par propriétaire', () => {
      cy.contains(/élevages/i).click();
      cy.wait('@getElevages');

      // Activer le filtre "mes élevages"
      cy.get('input[type="checkbox"]').check();

      // Vérifier que seuls les élevages de l'utilisateur sont affichés
      cy.contains('Élevage Test E2E').should('be.visible');
      cy.contains('Ferme de Test').should('not.exist');

      // Désactiver le filtre
      cy.get('input[type="checkbox"]').uncheck();

      // Vérifier que tous les élevages sont de nouveau visibles
      cy.contains('Élevage Test E2E').should('be.visible');
      cy.contains('Ferme de Test').should('be.visible');
    });

    it('affiche les actions appropriées selon les permissions', () => {
      cy.contains(/élevages/i).click();
      cy.wait('@getElevages');

      // Vérifier la présence des boutons d'action
      cy.get('[title="Voir les animaux"]').should('exist');
      cy.get('[title="Modifier"]').should('exist');
      cy.get('[title="Supprimer"]').should('exist');
    });
  });

  describe('Création d\'élevage', () => {
    it('permet de créer un nouvel élevage', () => {
      // Aller vers la création d'élevage (suppose un bouton admin)
      cy.login('admin@example.com', 'admin123');
      cy.contains(/élevages/i).click();

      // Cliquer sur nouveau élevage (si visible pour les admins)
      cy.get('button').contains(/nouveau élevage/i).click();

      // Remplir le formulaire
      cy.get('input[name="nom"]').type('Nouvel Élevage E2E');
      cy.get('input[name="adresse"]').type('789 Avenue des Tests');
      cy.get('input[name="telephone"]').type('01 23 45 67 89');
      cy.get('input[name="email"]').type('nouveau@elevage.com');
      cy.get('textarea[name="description"]').type('Description du nouvel élevage');

      // Intercepter la création
      cy.intercept('POST', '**/api/elevages', {
        statusCode: 201,
        body: {
          id: 3,
          nom: 'Nouvel Élevage E2E',
          adresse: '789 Avenue des Tests',
          description: 'Description du nouvel élevage'
        }
      }).as('createElevage');

      // Soumettre le formulaire
      cy.get('button[type="submit"]').contains(/créer|sauvegarder/i).click();

      // Vérifier la création
      cy.wait('@createElevage');

      // Vérifier le retour à la liste
      cy.contains(/gestion des élevages/i).should('be.visible');
    });

    it('valide les champs requis lors de la création', () => {
      cy.login('admin@example.com', 'admin123');
      cy.contains(/élevages/i).click();
      cy.get('button').contains(/nouveau élevage/i).click();

      // Essayer de soumettre sans remplir les champs requis
      cy.get('button[type="submit"]').contains(/créer/i).click();

      // Vérifier les messages d'erreur
      cy.contains(/nom requis/i).should('be.visible');
      cy.contains(/adresse requise/i).should('be.visible');
    });

    it('valide le format de l\'email et du téléphone', () => {
      cy.login('admin@example.com', 'admin123');
      cy.contains(/élevages/i).click();
      cy.get('button').contains(/nouveau élevage/i).click();

      // Remplir avec des données invalides
      cy.get('input[name="nom"]').type('Test Élevage');
      cy.get('input[name="adresse"]').type('Adresse Test');
      cy.get('input[name="email"]').type('email-invalide');
      cy.get('input[name="telephone"]').type('telephone-invalide');

      cy.get('button[type="submit"]').contains(/créer/i).click();

      // Vérifier les erreurs de validation
      cy.contains(/email invalide/i).should('be.visible');
      cy.contains(/format de téléphone invalide/i).should('be.visible');
    });
  });

  describe('Modification d\'élevage', () => {
    it('permet de modifier un élevage existant', () => {
      cy.contains(/élevages/i).click();
      cy.wait('@getElevages');

      // Cliquer sur modifier pour le premier élevage
      cy.get('[title="Modifier"]').first().click();

      // Vérifier que nous sommes en mode édition
      cy.contains(/modifier l'élevage/i).should('be.visible');

      // Modifier les informations
      cy.get('input[name="nom"]').clear().type('Élevage Modifié E2E');
      cy.get('input[name="description"]').clear().type('Description modifiée');

      // Intercepter la modification
      cy.intercept('PUT', '**/api/elevages/*', {
        statusCode: 200,
        body: {
          id: 1,
          nom: 'Élevage Modifié E2E',
          description: 'Description modifiée'
        }
      }).as('updateElevage');

      // Soumettre les modifications
      cy.get('button[type="submit"]').contains(/modifier|sauvegarder/i).click();

      // Vérifier la modification
      cy.wait('@updateElevage');

      // Vérifier le retour à la liste
      cy.contains(/gestion des élevages/i).should('be.visible');
    });

    it('permet d\'annuler les modifications', () => {
      cy.contains(/élevages/i).click();
      cy.wait('@getElevages');

      cy.get('[title="Modifier"]').first().click();

      // Modifier quelque chose
      cy.get('input[name="nom"]').clear().type('Modification annulée');

      // Annuler
      cy.get('button').contains(/annuler/i).click();

      // Vérifier le retour à la liste sans modification
      cy.contains(/gestion des élevages/i).should('be.visible');
      cy.contains('Élevage Test E2E').should('be.visible'); // Nom original
    });
  });

  describe('Suppression d\'élevage', () => {
    it('permet de supprimer un élevage avec confirmation', () => {
      cy.contains(/élevages/i).click();
      cy.wait('@getElevages');

      // Intercepter la confirmation
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true);
      });

      // Intercepter la suppression
      cy.intercept('DELETE', '**/api/elevages/*', {
        statusCode: 200,
        body: { message: 'Élevage supprimé avec succès' }
      }).as('deleteElevage');

      // Cliquer sur supprimer
      cy.get('[title="Supprimer"]').first().click();

      // Vérifier la suppression
      cy.wait('@deleteElevage');

      // L'élevage ne devrait plus être visible
      cy.contains('Élevage Test E2E').should('not.exist');
    });

    it('annule la suppression si l\'utilisateur refuse', () => {
      cy.contains(/élevages/i).click();
      cy.wait('@getElevages');

      // Simuler le refus de confirmation
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(false);
      });

      // Cliquer sur supprimer
      cy.get('[title="Supprimer"]').first().click();

      // L'élevage devrait toujours être visible
      cy.contains('Élevage Test E2E').should('be.visible');
    });

    it('gère les erreurs de suppression', () => {
      cy.contains(/élevages/i).click();
      cy.wait('@getElevages');

      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true);
      });

      // Simuler une erreur de suppression
      cy.intercept('DELETE', '**/api/elevages/*', {
        statusCode: 500,
        body: { message: 'Erreur lors de la suppression' }
      }).as('deleteError');

      cy.get('[title="Supprimer"]').first().click();

      cy.wait('@deleteError');

      // Vérifier l'affichage de l'erreur
      cy.contains(/erreur lors de la suppression/i).should('be.visible');
    });
  });

  describe('Navigation vers les animaux', () => {
    it('permet de voir les animaux d\'un élevage', () => {
      cy.contains(/élevages/i).click();
      cy.wait('@getElevages');

      // Cliquer sur voir les animaux
      cy.get('[title="Voir les animaux"]').first().click();

      // Vérifier la navigation vers le détail de l'élevage
      cy.contains(/animaux/i).should('be.visible');
      // Ou selon l'implémentation, vérifier l'URL ou le contenu approprié
    });
  });

  describe('Gestion des erreurs', () => {
    it('gère les erreurs de chargement de la liste', () => {
      // Simuler une erreur de chargement
      cy.intercept('GET', '**/api/elevages', {
        statusCode: 500,
        body: { message: 'Erreur serveur' }
      }).as('loadError');

      cy.contains(/élevages/i).click();
      cy.wait('@loadError');

      // Vérifier l'affichage de l'erreur
      cy.contains(/erreur/i).should('be.visible');
    });

    it('gère les erreurs d\'autorisation (403)', () => {
      cy.intercept('GET', '**/api/elevages', {
        statusCode: 403,
        body: { message: 'Accès refusé' }
      }).as('authError');

      cy.contains(/élevages/i).click();
      cy.wait('@authError');

      cy.contains(/accès refusé/i).should('be.visible');
    });
  });

  describe('Responsivité', () => {
    it('affiche correctement la liste sur mobile', () => {
      cy.viewport('iphone-6');

      cy.contains(/élevages/i).click();
      cy.wait('@getElevages');

      // Vérifier que les éléments principaux sont visibles
      cy.contains(/gestion des élevages/i).should('be.visible');
      cy.contains('Élevage Test E2E').should('be.visible');

      // Vérifier que les boutons d'action sont accessibles
      cy.get('[title="Voir les animaux"]').should('be.visible');
    });

    it('adapte le formulaire sur tablette', () => {
      cy.viewport('ipad-2');

      cy.login('admin@example.com', 'admin123');
      cy.contains(/élevages/i).click();
      cy.get('button').contains(/nouveau élevage/i).click();

      // Vérifier que le formulaire est bien affiché
      cy.get('input[name="nom"]').should('be.visible');
      cy.get('input[name="adresse"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });
  });
});