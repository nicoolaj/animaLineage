import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ElevageForm from '../ElevageForm';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

// Mock fetch global
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock console.log and console.error to avoid noise in tests
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

// Mock useAuth hook
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test User', email: 'test@test.com', role: 1, role_name: 'Admin', status: 1 },
    token: 'mock-token',
    isAuthenticated: true,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
    getAuthHeaders: jest.fn(() => ({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer mock-token'
    })),
    isAdmin: jest.fn(() => true),
    isModerator: jest.fn(() => false),
    isReader: jest.fn(() => false),
    canModerate: jest.fn(() => true),
    canAdministrate: jest.fn(() => true),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock data
const mockRaces = [
  {
    id: 1,
    nom: 'Holstein',
    type_animal_id: 1,
    type_animal_nom: 'Bovin',
    description: 'Race laitière'
  },
  {
    id: 2,
    nom: 'Lacaune',
    type_animal_id: 2,
    type_animal_nom: 'Ovin',
    description: 'Race à lait et viande'
  },
  {
    id: 3,
    nom: 'Alpine',
    type_animal_id: 3,
    type_animal_nom: 'Caprin',
    description: 'Chèvre de montagne'
  }
];

const mockUsers = [
  {
    id: 1,
    name: 'Jean Dupont',
    email: 'jean.dupont@example.com'
  },
  {
    id: 2,
    name: 'Marie Martin',
    email: 'marie.martin@example.com'
  },
  {
    id: 3,
    name: 'Pierre Bernard',
    email: 'pierre.bernard@example.com'
  }
];

const mockElevage = {
  id: '1',
  nom: 'Ferme du Test',
  adresse: '123 Rue de la Ferme, 12345 Ville',
  user_id: 2,
  description: 'Élevage de test pour les moutons et chèvres',
  races: [
    { id: 2, nom: 'Lacaune', type_animal_nom: 'Ovin' },
    { id: 3, nom: 'Alpine', type_animal_nom: 'Caprin' }
  ]
};

describe('ElevageForm Component', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();

    // Setup default fetch responses for races and users
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRaces)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsers)
      });
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  const renderWithAuth = (component: React.ReactElement) => {
    return render(component);
  };

  describe('Rendu du composant', () => {
    test('affiche le formulaire de création', async () => {
      renderWithAuth(
        <ElevageForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Nouveau élevage')).toBeInTheDocument();
      expect(screen.getByLabelText(/nom de l'élevage/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/adresse/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/propriétaire/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByText(/races d'animaux/i)).toBeInTheDocument();
    });

    test('affiche les boutons d\'action', async () => {
      renderWithAuth(
        <ElevageForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /créer/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
    });

    test('charge et affiche les races disponibles', async () => {
      renderWithAuth(
        <ElevageForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Holstein')).toBeInTheDocument();
        expect(screen.getByText('Lacaune')).toBeInTheDocument();
        expect(screen.getByText('Alpine')).toBeInTheDocument();
      });

      expect(screen.getByText('(Bovin)')).toBeInTheDocument();
      expect(screen.getByText('(Ovin)')).toBeInTheDocument();
      expect(screen.getByText('(Caprin)')).toBeInTheDocument();
    });

    test('charge et affiche les utilisateurs disponibles', async () => {
      renderWithAuth(
        <ElevageForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Jean Dupont (jean.dupont@example.com)')).toBeInTheDocument();
        expect(screen.getByText('Marie Martin (marie.martin@example.com)')).toBeInTheDocument();
        expect(screen.getByText('Pierre Bernard (pierre.bernard@example.com)')).toBeInTheDocument();
      });
    });

    test('affiche les champs requis avec des astérisques', () => {
      renderWithAuth(
        <ElevageForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const requiredLabels = screen.getAllByText('*');
      expect(requiredLabels).toHaveLength(3); // nom, adresse, propriétaire
    });
  });

  describe('Mode édition', () => {
    test('affiche le titre correct en mode édition', async () => {
      // Setup fetch for edit mode
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRaces)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockElevage)
        });

      renderWithAuth(
        <ElevageForm
          elevageId="1"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Modifier l\'élevage')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /modifier/i })).toBeInTheDocument();
    });

    test('pré-remplit les champs avec les données de l\'élevage', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRaces)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockElevage)
        });

      renderWithAuth(
        <ElevageForm
          elevageId="1"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Ferme du Test')).toBeInTheDocument();
        expect(screen.getByDisplayValue('123 Rue de la Ferme, 12345 Ville')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Élevage de test pour les moutons et chèvres')).toBeInTheDocument();
      });

      // Vérifier que le propriétaire correct est sélectionné
      const proprietaireSelect = screen.getByLabelText(/propriétaire/i);
      expect(proprietaireSelect).toHaveValue('2');

      // Vérifier que les bonnes races sont cochées
      await waitFor(() => {
        const lacauneCheckbox = screen.getByRole('checkbox', { name: /lacaune/i });
        const alpineCheckbox = screen.getByRole('checkbox', { name: /alpine/i });
        const holsteinCheckbox = screen.getByRole('checkbox', { name: /holstein/i });

        expect(lacauneCheckbox).toBeChecked();
        expect(alpineCheckbox).toBeChecked();
        expect(holsteinCheckbox).not.toBeChecked();
      });
    });
  });

  describe('Interactions utilisateur', () => {
    test('met à jour le nom lors de la saisie', async () => {
      // userEvent v13 doesn't need setup

      renderWithAuth(
        <ElevageForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const nomInput = screen.getByLabelText(/nom de l'élevage/i);
      await userEvent.type(nomInput, 'Nouvel Élevage');

      expect(nomInput).toHaveValue('Nouvel Élevage');
    });

    test('met à jour l\'adresse lors de la saisie', async () => {
      // userEvent v13 doesn't need setup

      renderWithAuth(
        <ElevageForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const adresseInput = screen.getByLabelText(/adresse/i);
      await userEvent.type(adresseInput, '456 Avenue Test');

      expect(adresseInput).toHaveValue('456 Avenue Test');
    });

    test('met à jour la description lors de la saisie', async () => {
      // userEvent v13 doesn't need setup

      renderWithAuth(
        <ElevageForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const descriptionInput = screen.getByLabelText(/description/i);
      await userEvent.type(descriptionInput, 'Description de test');

      expect(descriptionInput).toHaveValue('Description de test');
    });

    test('sélectionne un propriétaire', async () => {
      // userEvent v13 doesn't need setup

      renderWithAuth(
        <ElevageForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Jean Dupont (jean.dupont@example.com)')).toBeInTheDocument();
      });

      const proprietaireSelect = screen.getByLabelText(/propriétaire/i);
      await userEvent.selectOptions(proprietaireSelect, '2');

      expect(proprietaireSelect).toHaveValue('2');
    });

    test('coche et décoche des races', async () => {
      // userEvent v13 doesn't need setup

      renderWithAuth(
        <ElevageForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Holstein')).toBeInTheDocument();
      });

      const holsteinCheckbox = screen.getByRole('checkbox', { name: /holstein/i });
      const lacauneCheckbox = screen.getByRole('checkbox', { name: /lacaune/i });

      // Cocher Holstein
      await userEvent.click(holsteinCheckbox);
      expect(holsteinCheckbox).toBeChecked();

      // Cocher Lacaune
      await userEvent.click(lacauneCheckbox);
      expect(lacauneCheckbox).toBeChecked();

      // Décocher Holstein
      await userEvent.click(holsteinCheckbox);
      expect(holsteinCheckbox).not.toBeChecked();
    });

    test('appelle onCancel lors du clic sur annuler', async () => {
      // userEvent v13 doesn't need setup

      renderWithAuth(
        <ElevageForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /annuler/i });
      await userEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Validation du formulaire', () => {
    test('affiche une erreur si le nom est manquant', async () => {
      // userEvent v13 doesn't need setup

      renderWithAuth(
        <ElevageForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /créer/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/le nom, l'adresse et le propriétaire sont requis/i)).toBeInTheDocument();
      });
    });

    test('affiche une erreur si l\'adresse est manquante', async () => {
      // userEvent v13 doesn't need setup

      renderWithAuth(
        <ElevageForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const nomInput = screen.getByLabelText(/nom de l'élevage/i);
      await userEvent.type(nomInput, 'Test Élevage');

      const submitButton = screen.getByRole('button', { name: /créer/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/le nom, l'adresse et le propriétaire sont requis/i)).toBeInTheDocument();
      });
    });

    test('affiche une erreur si le propriétaire est manquant', async () => {
      // userEvent v13 doesn't need setup

      renderWithAuth(
        <ElevageForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const nomInput = screen.getByLabelText(/nom de l'élevage/i);
      await userEvent.type(nomInput, 'Test Élevage');

      const adresseInput = screen.getByLabelText(/adresse/i);
      await userEvent.type(adresseInput, '123 Rue Test');

      const submitButton = screen.getByRole('button', { name: /créer/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/le nom, l'adresse et le propriétaire sont requis/i)).toBeInTheDocument();
      });
    });

    test('soumet le formulaire avec des données valides', async () => {
      // userEvent v13 doesn't need setup

      // Mock pour la soumission réussie
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, message: 'Élevage créé avec succès' })
      });

      renderWithAuth(
        <ElevageForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Attendre que les données soient chargées
      await waitFor(() => {
        expect(screen.getByText('Holstein')).toBeInTheDocument();
      });

      // Remplir le formulaire
      const nomInput = screen.getByLabelText(/nom de l'élevage/i);
      await userEvent.type(nomInput, 'Élevage Test');

      const adresseInput = screen.getByLabelText(/adresse/i);
      await userEvent.type(adresseInput, '123 Rue Test');

      const proprietaireSelect = screen.getByLabelText(/propriétaire/i);
      await userEvent.selectOptions(proprietaireSelect, '2');

      const descriptionInput = screen.getByLabelText(/description/i);
      await userEvent.type(descriptionInput, 'Description test');

      // Sélectionner une race
      const holsteinCheckbox = screen.getByRole('checkbox', { name: /holstein/i });
      await userEvent.click(holsteinCheckbox);

      const submitButton = screen.getByRole('button', { name: /créer/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/elevages',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              nom: 'Élevage Test',
              adresse: '123 Rue Test',
              user_id: 2,
              description: 'Description test',
              races_ids: [1]
            })
          })
        );
      });

      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });

    test('soumet une modification avec PUT', async () => {
      // userEvent v13 doesn't need setup

      // Setup pour le mode édition
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRaces)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockElevage)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: 'Élevage modifié avec succès' })
        });

      renderWithAuth(
        <ElevageForm
          elevageId="1"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Attendre que les données soient chargées
      await waitFor(() => {
        expect(screen.getByDisplayValue('Ferme du Test')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /modifier/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/elevages/1',
          expect.objectContaining({
            method: 'PUT'
          })
        );
      });

      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('Gestion des erreurs', () => {
    test('gère les erreurs de chargement des races', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Erreur réseau'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers)
        });

      renderWithAuth(
        <ElevageForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Error fetching races:', expect.any(Error));
      });
    });

    test('gère les erreurs de chargement des utilisateurs', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRaces)
        })
        .mockRejectedValueOnce(new Error('Erreur réseau'));

      renderWithAuth(
        <ElevageForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Error fetching users:', expect.any(Error));
      });
    });

    test('gère les erreurs de chargement de l\'élevage en mode édition', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRaces)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers)
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ message: 'Élevage non trouvé' })
        });

      renderWithAuth(
        <ElevageForm
          elevageId="999"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/erreur lors du chargement de l'élevage/i)).toBeInTheDocument();
      });
    });

    test('gère les erreurs de soumission', async () => {
      // userEvent v13 doesn't need setup

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Erreur de validation' })
      });

      renderWithAuth(
        <ElevageForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Attendre que les données soient chargées
      await waitFor(() => {
        expect(screen.getByText('Holstein')).toBeInTheDocument();
      });

      // Remplir le formulaire
      const nomInput = screen.getByLabelText(/nom de l'élevage/i);
      await userEvent.type(nomInput, 'Test');

      const adresseInput = screen.getByLabelText(/adresse/i);
      await userEvent.type(adresseInput, 'Test');

      const proprietaireSelect = screen.getByLabelText(/propriétaire/i);
      await userEvent.selectOptions(proprietaireSelect, '1');

      const submitButton = screen.getByRole('button', { name: /créer/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Erreur de validation')).toBeInTheDocument();
      });
    });
  });

  describe('État de chargement', () => {
    test('désactive les boutons pendant la soumission', async () => {
      // userEvent v13 doesn't need setup

      // Mock pour simuler une soumission lente
      let resolveSubmit: any;
      const slowSubmit = new Promise((resolve) => {
        resolveSubmit = resolve;
      });

      mockFetch.mockReturnValueOnce(slowSubmit);

      renderWithAuth(
        <ElevageForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Attendre que les données soient chargées
      await waitFor(() => {
        expect(screen.getByText('Holstein')).toBeInTheDocument();
      });

      // Remplir le formulaire rapidement
      const nomInput = screen.getByLabelText(/nom de l'élevage/i);
      await userEvent.type(nomInput, 'Test');

      const adresseInput = screen.getByLabelText(/adresse/i);
      await userEvent.type(adresseInput, 'Test');

      const proprietaireSelect = screen.getByLabelText(/propriétaire/i);
      await userEvent.selectOptions(proprietaireSelect, '1');

      const submitButton = screen.getByRole('button', { name: /créer/i });
      await userEvent.click(submitButton);

      // Vérifier que les boutons sont désactivés
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sauvegarde/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /annuler/i })).toBeDisabled();
      });

      // Résoudre la soumission
      resolveSubmit({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' })
      });
    });
  });

  describe('Accessibilité', () => {
    test('les champs ont des labels appropriés', async () => {
      renderWithAuth(
        <ElevageForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/nom de l'élevage/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/adresse/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/propriétaire/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    test('les champs requis sont marqués comme tels', () => {
      renderWithAuth(
        <ElevageForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/nom de l'élevage/i)).toBeRequired();
      expect(screen.getByLabelText(/adresse/i)).toBeRequired();
      expect(screen.getByLabelText(/propriétaire/i)).toBeRequired();
    });

    test('les races ont des descriptions appropriées', async () => {
      renderWithAuth(
        <ElevageForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Race laitière')).toBeInTheDocument();
        expect(screen.getByText('Race à lait et viande')).toBeInTheDocument();
        expect(screen.getByText('Chèvre de montagne')).toBeInTheDocument();
      });
    });
  });
});