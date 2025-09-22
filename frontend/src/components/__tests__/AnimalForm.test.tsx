import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnimalForm from '../AnimalForm';

// Mock fetch global
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

// Mock atob for JWT decoding
global.atob = jest.fn().mockImplementation((str) => {
  try {
    return JSON.stringify({
      user: { id: 1, role: 1 }
    });
  } catch {
    return '{}';
  }
});

// Mock données pour les tests
const mockRaces = [
  {
    id: 1,
    nom: 'Holstein',
    type_animal_nom: 'Bovin'
  },
  {
    id: 2,
    nom: 'Lacaune',
    type_animal_nom: 'Ovin'
  }
];

const mockElevages = [
  {
    id: 1,
    nom: 'Ferme du Test'
  },
  {
    id: 2,
    nom: 'Élevage Bio'
  }
];

const mockAnimals = [
  {
    id: 10,
    identifiant_officiel: 'FR001',
    nom: 'Taureau Alpha',
    sexe: 'M' as const,
    race_id: 1,
    elevage_id: 1
  },
  {
    id: 11,
    identifiant_officiel: 'FR002',
    nom: 'Vache Beta',
    sexe: 'F' as const,
    race_id: 1,
    elevage_id: 1
  }
];

const mockAnimal = {
  id: 1,
  identifiant_officiel: 'FR123',
  nom: 'Test Animal',
  sexe: 'M' as const,
  race_id: 1,
  date_naissance: '2023-01-15',
  elevage_id: 1
};

describe('AnimalForm Component', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockSessionStorage.getItem.mockReturnValue('mock-token');

    // Setup default fetch responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRaces)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockElevages)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAnimals)
      });
  });

  describe('Rendu du composant', () => {
    test('affiche le formulaire de création d\'animal', async () => {
      render(
        <AnimalForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Nouvel animal')).toBeInTheDocument();
      expect(screen.getByLabelText(/identifiant officiel/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nom de l'animal/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sexe de l'animal/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/race/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /créer/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
    });

    test('affiche le formulaire de modification d\'animal', async () => {
      render(
        <AnimalForm
          animal={mockAnimal}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Modifier l\'animal')).toBeInTheDocument();
      expect(screen.getByDisplayValue('FR123')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Animal')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /modifier/i })).toBeInTheDocument();
    });

    test('charge les races depuis l\'API', async () => {
      render(
        <AnimalForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/races',
          expect.objectContaining({
            headers: {
              'Authorization': 'Bearer mock-token'
            }
          })
        );
      });
    });

    test('charge les élevages depuis l\'API', async () => {
      render(
        <AnimalForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/elevages',
          expect.objectContaining({
            headers: {
              'Authorization': 'Bearer mock-token'
            }
          })
        );
      });
    });
  });

  describe('Gestion des champs de formulaire', () => {
    test('met à jour l\'identifiant officiel', async () => {
      // userEvent v13 doesn't need setup

      render(
        <AnimalForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const identifiantInput = screen.getByLabelText(/identifiant officiel/i);
      await userEvent.clear(identifiantInput);
      await userEvent.type(identifiantInput, 'FR999');

      expect(identifiantInput).toHaveValue('FR999');
    });

    test('met à jour le nom de l\'animal', async () => {
      // userEvent v13 doesn't need setup

      render(
        <AnimalForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nomInput = screen.getByLabelText(/nom de l'animal/i);
      await userEvent.type(nomInput, 'Nouveau Nom');

      expect(nomInput).toHaveValue('Nouveau Nom');
    });

    test('met à jour le sexe de l\'animal', async () => {
      // userEvent v13 doesn't need setup

      render(
        <AnimalForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const sexeSelect = screen.getByLabelText(/sexe de l'animal/i);
      await userEvent.selectOptions(sexeSelect, 'F');

      expect(sexeSelect).toHaveValue('F');
    });

    test('met à jour les notes', async () => {
      // userEvent v13 doesn't need setup

      render(
        <AnimalForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const notesTextarea = screen.getByLabelText(/notes et observations/i);
      await userEvent.type(notesTextarea, 'Animal très docile');

      expect(notesTextarea).toHaveValue('Animal très docile');
    });
  });

  describe('Validation du formulaire', () => {
    test('affiche une erreur si l\'identifiant est manquant', async () => {
      // userEvent v13 doesn't need setup

      render(
        <AnimalForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /créer/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('L\'identifiant officiel est requis')).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test('affiche une erreur si la race est manquante', async () => {
      // userEvent v13 doesn't need setup

      render(
        <AnimalForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const identifiantInput = screen.getByLabelText(/identifiant officiel/i);
      await userEvent.type(identifiantInput, 'FR123');

      const submitButton = screen.getByRole('button', { name: /créer/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('La race est requise')).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test('affiche une erreur si l\'élevage est manquant pour un animal vivant', async () => {
      // userEvent v13 doesn't need setup

      render(
        <AnimalForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const identifiantInput = screen.getByLabelText(/identifiant officiel/i);
      await userEvent.type(identifiantInput, 'FR123');

      // Attendre que les races soient chargées
      await waitFor(() => {
        const raceSelect = screen.getByLabelText(/race/i);
        expect(raceSelect.children.length).toBeGreaterThan(1);
      });

      const raceSelect = screen.getByLabelText(/race/i);
      await userEvent.selectOptions(raceSelect, '1');

      const submitButton = screen.getByRole('button', { name: /créer/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Un animal vivant doit être associé à un élevage')).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test('soumet le formulaire avec des données valides', async () => {
      // userEvent v13 doesn't need setup

      render(
        <AnimalForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Remplir le formulaire
      const identifiantInput = screen.getByLabelText(/identifiant officiel/i);
      await userEvent.type(identifiantInput, 'FR123');

      const nomInput = screen.getByLabelText(/nom de l'animal/i);
      await userEvent.type(nomInput, 'Test Animal');

      // Attendre que les races soient chargées
      await waitFor(() => {
        const raceSelect = screen.getByLabelText(/race/i);
        expect(raceSelect.children.length).toBeGreaterThan(1);
      });

      const raceSelect = screen.getByLabelText(/race/i);
      await userEvent.selectOptions(raceSelect, '1');

      // Attendre que les élevages soient chargés
      await waitFor(() => {
        const elevageSelect = screen.getByLabelText(/élevage d'appartenance/i);
        expect(elevageSelect.children.length).toBeGreaterThan(1);
      });

      const elevageSelect = screen.getByLabelText(/élevage d'appartenance/i);
      await userEvent.selectOptions(elevageSelect, '1');

      const submitButton = screen.getByRole('button', { name: /créer/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
          identifiant_officiel: 'FR123',
          nom: 'Test Animal',
          race_id: '1',
          elevage_id: '1'
        }));
      });
    });
  });

  describe('Vérification d\'existence d\'animal', () => {
    test('vérifie l\'existence d\'un animal lors de la saisie de l\'identifiant', async () => {
      // userEvent v13 doesn't need setup

      // Mock pour la vérification d'existence
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ exists: false })
      });

      render(
        <AnimalForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const identifiantInput = screen.getByLabelText(/identifiant officiel/i);
      await userEvent.type(identifiantInput, 'FR999');

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/animaux?check=1&identifiant=FR999',
          expect.objectContaining({
            headers: {
              'Authorization': 'Bearer mock-token'
            }
          })
        );
      });
    });

    test('affiche un avertissement si l\'animal existe déjà', async () => {
      // userEvent v13 doesn't need setup

      // Mock pour un animal existant
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          exists: true,
          animal: {
            id: 999,
            elevage_nom: 'Autre Élevage',
            can_transfer: true
          }
        })
      });

      render(
        <AnimalForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const identifiantInput = screen.getByLabelText(/identifiant officiel/i);
      await userEvent.type(identifiantInput, 'FR999');

      await waitFor(() => {
        expect(screen.getByText(/cet animal existe déjà/i)).toBeInTheDocument();
        expect(screen.getByText(/demander un transfert/i)).toBeInTheDocument();
      });
    });

    test('affiche le message de vérification en cours', async () => {
      // userEvent v13 doesn't need setup

      // Mock pour simuler une vérification lente
      let resolvePromise: any;
      const slowPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(slowPromise);

      render(
        <AnimalForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const identifiantInput = screen.getByLabelText(/identifiant officiel/i);
      await userEvent.type(identifiantInput, 'FR999');

      // Vérifier que le message de vérification s'affiche
      await waitFor(() => {
        expect(screen.getByText(/vérification en cours/i)).toBeInTheDocument();
      });

      // Résoudre la promesse
      resolvePromise({
        ok: true,
        json: () => Promise.resolve({ exists: false })
      });
    });
  });

  describe('Gestion des parents', () => {
    test('charge les parents potentiels quand une race est sélectionnée', async () => {
      // userEvent v13 doesn't need setup

      render(
        <AnimalForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Attendre que les races soient chargées
      await waitFor(() => {
        const raceSelect = screen.getByLabelText(/race/i);
        expect(raceSelect.children.length).toBeGreaterThan(1);
      });

      const raceSelect = screen.getByLabelText(/race/i);
      await userEvent.selectOptions(raceSelect, '1');

      // Vérifier que l'API des animaux est appelée pour charger les parents
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/animaux',
          expect.objectContaining({
            headers: {
              'Authorization': 'Bearer mock-token'
            }
          })
        );
      });
    });

    test('vide les listes de parents si aucune race n\'est sélectionnée', async () => {
      // userEvent v13 doesn't need setup

      render(
        <AnimalForm
          animal={mockAnimal}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Attendre que les races soient chargées
      await waitFor(() => {
        const raceSelect = screen.getByLabelText(/race/i);
        expect(raceSelect.children.length).toBeGreaterThan(1);
      });

      const raceSelect = screen.getByLabelText(/race/i);
      await userEvent.selectOptions(raceSelect, '');

      // Les selects de parents devraient être vides
      const pereSelect = screen.getByLabelText(/père géniteur/i);
      const mereSelect = screen.getByLabelText(/mère génitrice/i);

      expect(pereSelect.children.length).toBe(1); // Seulement l'option par défaut
      expect(mereSelect.children.length).toBe(1); // Seulement l'option par défaut
    });
  });

  describe('Gestion des élevages', () => {
    test('charge tous les élevages pour un administrateur', async () => {
      global.atob = jest.fn().mockReturnValue(JSON.stringify({
        user: { role: 1 } // Administrateur
      }));

      render(
        <AnimalForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/elevages',
          expect.any(Object)
        );
      });
    });

    test('charge seulement les élevages de l\'utilisateur pour un non-administrateur', async () => {
      global.atob = jest.fn().mockReturnValue(JSON.stringify({
        user: { role: 2 } // Non-administrateur
      }));

      render(
        <AnimalForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/elevages?my=true',
          expect.any(Object)
        );
      });
    });

    test('désactive le champ élevage si l\'animal est décédé', async () => {
      // userEvent v13 doesn't need setup

      render(
        <AnimalForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const dateDeces = screen.getByLabelText(/date de décès/i);
      await userEvent.type(dateDeces, '2023-12-31');

      const elevageSelect = screen.getByLabelText(/élevage d'appartenance/i);
      expect(elevageSelect).toBeDisabled();
    });
  });

  describe('Actions du formulaire', () => {
    test('appelle onCancel lors du clic sur annuler', async () => {
      // userEvent v13 doesn't need setup

      render(
        <AnimalForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /annuler/i });
      await userEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    test('désactive les boutons pendant le chargement', async () => {
      // userEvent v13 doesn't need setup

      // Mock pour simuler une soumission lente
      let resolveSubmit: any;
      const slowSubmit = jest.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          resolveSubmit = resolve;
        });
      });

      render(
        <AnimalForm
          onSubmit={slowSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Remplir le formulaire rapidement
      const identifiantInput = screen.getByLabelText(/identifiant officiel/i);
      await userEvent.type(identifiantInput, 'FR123');

      await waitFor(() => {
        const raceSelect = screen.getByLabelText(/race/i);
        expect(raceSelect.children.length).toBeGreaterThan(1);
      });

      const raceSelect = screen.getByLabelText(/race/i);
      await userEvent.selectOptions(raceSelect, '1');

      await waitFor(() => {
        const elevageSelect = screen.getByLabelText(/élevage d'appartenance/i);
        expect(elevageSelect.children.length).toBeGreaterThan(1);
      });

      const elevageSelect = screen.getByLabelText(/élevage d'appartenance/i);
      await userEvent.selectOptions(elevageSelect, '1');

      const submitButton = screen.getByRole('button', { name: /créer/i });
      await userEvent.click(submitButton);

      // Vérifier que les boutons sont désactivés
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /enregistrement/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /annuler/i })).toBeDisabled();
      });

      // Résoudre la soumission
      resolveSubmit();
    });
  });

  describe('Gestion des erreurs', () => {
    test('gère les erreurs de chargement des races', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <AnimalForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Erreur lors du chargement des races:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    test('gère les erreurs HTTP lors du chargement des races', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server error')
      });

      render(
        <AnimalForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Erreur lors du chargement des races:',
          500,
          'Server error'
        );
      });

      consoleSpy.mockRestore();
    });

    test('gère l\'absence de token', async () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      render(
        <AnimalForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Le composant devrait gérer l'absence de token sans planter
      expect(screen.getByText('Nouvel animal')).toBeInTheDocument();
    });
  });

  describe('Accessibilité et UX', () => {
    test('affiche des labels appropriés pour tous les champs', () => {
      render(
        <AnimalForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/identifiant officiel/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nom de l'animal/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sexe de l'animal/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/race/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/père géniteur/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/mère génitrice/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date de naissance/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date de bouclage/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date de décès/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/élevage d'appartenance/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes et observations/i)).toBeInTheDocument();
    });

    test('affiche des placeholders appropriés', () => {
      render(
        <AnimalForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByPlaceholderText(/FR123456789/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Bella, Rex/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/santé fragile/i)).toBeInTheDocument();
    });

    test('affiche des informations d\'aide pour les champs', () => {
      render(
        <AnimalForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/numéro unique d'identification/i)).toBeInTheDocument();
      expect(screen.getByText(/nom donné à l'animal/i)).toBeInTheDocument();
      expect(screen.getByText(/sexe biologique/i)).toBeInTheDocument();
      expect(screen.getByText(/race et type d'animal/i)).toBeInTheDocument();
    });
  });
});