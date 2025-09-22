import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnimalList from '../AnimalList';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

// Mock fetch global
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock window.confirm
global.confirm = jest.fn();

// Mock window.prompt
global.prompt = jest.fn();

// Mock window.alert
global.alert = jest.fn();

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
const mockAnimals = [
  {
    id: 1,
    identifiant_officiel: 'FR001',
    nom: 'Belle',
    sexe: 'F' as const,
    race_id: 1,
    pere_id: 3,
    mere_id: null,
    pere_identifiant: 'FR003',
    pere_nom: 'Taureau',
    mere_identifiant: null,
    mere_nom: null,
    race_nom: 'Holstein',
    date_naissance: '2023-01-15',
    date_bouclage: '2023-01-20',
    date_deces: null,
    elevage_id: 1,
    elevage_nom: 'Ferme du Test',
    statut: 'vivant' as const,
    notes: 'Animal en bonne santé',
    created_at: '2023-01-15T10:00:00Z'
  },
  {
    id: 2,
    identifiant_officiel: 'FR002',
    nom: 'Rex',
    sexe: 'M' as const,
    race_id: 1,
    pere_id: null,
    mere_id: null,
    pere_identifiant: null,
    pere_nom: null,
    mere_identifiant: null,
    mere_nom: null,
    race_nom: 'Holstein',
    date_naissance: '2022-06-10',
    date_bouclage: '2022-06-15',
    date_deces: '2023-12-25',
    elevage_id: null,
    elevage_nom: null,
    statut: 'mort' as const,
    notes: null,
    created_at: '2022-06-10T10:00:00Z'
  },
  {
    id: 3,
    identifiant_officiel: 'FR003',
    nom: 'Taureau',
    sexe: 'M' as const,
    race_id: 2,
    pere_id: null,
    mere_id: null,
    pere_identifiant: null,
    pere_nom: null,
    mere_identifiant: null,
    mere_nom: null,
    race_nom: 'Lacaune',
    date_naissance: '2021-03-20',
    date_bouclage: '2021-03-25',
    date_deces: null,
    elevage_id: 2,
    elevage_nom: 'Élevage Bio',
    statut: 'vivant' as const,
    notes: 'Reproducteur principal',
    created_at: '2021-03-20T10:00:00Z'
  }
];

describe('AnimalList Component', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnViewDescendants = jest.fn();
  const mockOnMarkDead = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();

    // Setup default successful fetch response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnimals)
    });
  });

  const renderWithAuth = (component: React.ReactElement) => {
    return render(component);
  };

  describe('Rendu du composant', () => {
    test('affiche la liste des animaux avec les données correctes', async () => {
      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      // Attendre que les données soient chargées
      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (3)')).toBeInTheDocument();
      });

      // Vérifier que les animaux sont affichés
      expect(screen.getByText('FR001')).toBeInTheDocument();
      expect(screen.getByText('Belle')).toBeInTheDocument();
      expect(screen.getByText('FR002')).toBeInTheDocument();
      expect(screen.getByText('Rex')).toBeInTheDocument();
      expect(screen.getByText('FR003')).toBeInTheDocument();
      expect(screen.getByText('Taureau')).toBeInTheDocument();
    });

    test('affiche le message de chargement pendant le chargement', () => {
      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      expect(screen.getByText('Chargement des animaux...')).toBeInTheDocument();
    });

    test('affiche les en-têtes de colonnes corrects', async () => {
      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (3)')).toBeInTheDocument();
      });

      expect(screen.getByText(/identifiant/i)).toBeInTheDocument();
      expect(screen.getByText(/nom/i)).toBeInTheDocument();
      expect(screen.getByText(/sexe/i)).toBeInTheDocument();
      expect(screen.getByText(/race/i)).toBeInTheDocument();
      expect(screen.getByText(/parents/i)).toBeInTheDocument();
      expect(screen.getByText(/naissance/i)).toBeInTheDocument();
      expect(screen.getByText(/élevage/i)).toBeInTheDocument();
      expect(screen.getByText(/statut/i)).toBeInTheDocument();
      expect(screen.getByText(/actions/i)).toBeInTheDocument();
    });

    test('affiche les informations des parents correctement', async () => {
      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('♂️ FR003 (Taureau)')).toBeInTheDocument();
      });
    });

    test('affiche le statut des animaux correctement', async () => {
      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('✅ Vivant')).toBeInTheDocument();
        expect(screen.getByText(/💀 Décédé/)).toBeInTheDocument();
      });
    });
  });

  describe('Filtrage', () => {
    test('filtre par statut vivant', async () => {
      // userEvent v13 doesn't need setup

      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (3)')).toBeInTheDocument();
      });

      const statutFilter = screen.getByLabelText('Statut:');
      await userEvent.selectOptions(statutFilter, 'vivant');

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (2)')).toBeInTheDocument();
      });

      expect(screen.getByText('Belle')).toBeInTheDocument();
      expect(screen.getByText('Taureau')).toBeInTheDocument();
      expect(screen.queryByText('Rex')).not.toBeInTheDocument();
    });

    test('filtre par statut décédé', async () => {
      // userEvent v13 doesn't need setup

      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (3)')).toBeInTheDocument();
      });

      const statutFilter = screen.getByLabelText('Statut:');
      await userEvent.selectOptions(statutFilter, 'mort');

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (1)')).toBeInTheDocument();
      });

      expect(screen.getByText('Rex')).toBeInTheDocument();
      expect(screen.queryByText('Belle')).not.toBeInTheDocument();
      expect(screen.queryByText('Taureau')).not.toBeInTheDocument();
    });

    test('filtre par sexe mâle', async () => {
      // userEvent v13 doesn't need setup

      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (3)')).toBeInTheDocument();
      });

      const sexeFilter = screen.getByLabelText('Sexe:');
      await userEvent.selectOptions(sexeFilter, 'M');

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (2)')).toBeInTheDocument();
      });

      expect(screen.getByText('Rex')).toBeInTheDocument();
      expect(screen.getByText('Taureau')).toBeInTheDocument();
      expect(screen.queryByText('Belle')).not.toBeInTheDocument();
    });

    test('filtre par sexe femelle', async () => {
      // userEvent v13 doesn't need setup

      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (3)')).toBeInTheDocument();
      });

      const sexeFilter = screen.getByLabelText('Sexe:');
      await userEvent.selectOptions(sexeFilter, 'F');

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (1)')).toBeInTheDocument();
      });

      expect(screen.getByText('Belle')).toBeInTheDocument();
      expect(screen.queryByText('Rex')).not.toBeInTheDocument();
      expect(screen.queryByText('Taureau')).not.toBeInTheDocument();
    });

    test('filtre par élevage', async () => {
      // userEvent v13 doesn't need setup

      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (3)')).toBeInTheDocument();
      });

      const elevageFilter = screen.getByPlaceholderText('Filtrer par élevage');
      await userEvent.type(elevageFilter, 'Bio');

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (1)')).toBeInTheDocument();
      });

      expect(screen.getByText('Taureau')).toBeInTheDocument();
      expect(screen.queryByText('Belle')).not.toBeInTheDocument();
      expect(screen.queryByText('Rex')).not.toBeInTheDocument();
    });

    test('filtre par race', async () => {
      // userEvent v13 doesn't need setup

      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (3)')).toBeInTheDocument();
      });

      const raceFilter = screen.getByPlaceholderText('Filtrer par race');
      await userEvent.type(raceFilter, 'Holstein');

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (2)')).toBeInTheDocument();
      });

      expect(screen.getByText('Belle')).toBeInTheDocument();
      expect(screen.getByText('Rex')).toBeInTheDocument();
      expect(screen.queryByText('Taureau')).not.toBeInTheDocument();
    });

    test('combine plusieurs filtres', async () => {
      // userEvent v13 doesn't need setup

      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (3)')).toBeInTheDocument();
      });

      // Filtrer par statut vivant ET sexe mâle
      const statutFilter = screen.getByLabelText('Statut:');
      await userEvent.selectOptions(statutFilter, 'vivant');

      const sexeFilter = screen.getByLabelText('Sexe:');
      await userEvent.selectOptions(sexeFilter, 'M');

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (1)')).toBeInTheDocument();
      });

      expect(screen.getByText('Taureau')).toBeInTheDocument();
      expect(screen.queryByText('Belle')).not.toBeInTheDocument();
      expect(screen.queryByText('Rex')).not.toBeInTheDocument();
    });
  });

  describe('Tri', () => {
    test('trie par identifiant en ordre croissant par défaut', async () => {
      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (3)')).toBeInTheDocument();
      });

      const rows = screen.getAllByRole('row');
      // Ignorer l'en-tête, vérifier les lignes de données
      expect(rows[1]).toHaveTextContent('FR001');
      expect(rows[2]).toHaveTextContent('FR002');
      expect(rows[3]).toHaveTextContent('FR003');
    });

    test('change l\'ordre de tri lors du clic sur l\'en-tête', async () => {
      // userEvent v13 doesn't need setup

      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (3)')).toBeInTheDocument();
      });

      // Cliquer sur l'en-tête identifiant pour inverser l'ordre
      const identifiantHeader = screen.getByText(/identifiant/i);
      await userEvent.click(identifiantHeader);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(rows[1]).toHaveTextContent('FR003');
        expect(rows[2]).toHaveTextContent('FR002');
        expect(rows[3]).toHaveTextContent('FR001');
      });
    });

    test('trie par nom', async () => {
      // userEvent v13 doesn't need setup

      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (3)')).toBeInTheDocument();
      });

      const nomHeader = screen.getByText(/nom/i);
      await userEvent.click(nomHeader);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(rows[1]).toHaveTextContent('Belle');
        expect(rows[2]).toHaveTextContent('Rex');
        expect(rows[3]).toHaveTextContent('Taureau');
      });
    });
  });

  describe('Actions sur les animaux', () => {
    test('appelle onEdit lors du clic sur modifier', async () => {
      // userEvent v13 doesn't need setup

      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (3)')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Modifier');
      await userEvent.click(editButtons[0]);

      expect(mockOnEdit).toHaveBeenCalledWith(mockAnimals[0]);
    });

    test('appelle onViewDescendants lors du clic sur voir descendants', async () => {
      // userEvent v13 doesn't need setup

      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (3)')).toBeInTheDocument();
      });

      const descendantsButtons = screen.getAllByTitle('Voir descendants');
      await userEvent.click(descendantsButtons[0]);

      expect(mockOnViewDescendants).toHaveBeenCalledWith(1);
    });

    test('supprime un animal avec confirmation', async () => {
      // userEvent v13 doesn't need setup
      (global.confirm as jest.Mock).mockReturnValue(true);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAnimals)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: 'Animal supprimé' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAnimals.slice(1))
        });

      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (3)')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Supprimer');
      await userEvent.click(deleteButtons[0]);

      expect(global.confirm).toHaveBeenCalledWith('Êtes-vous sûr de vouloir supprimer l\'animal FR001 ?');

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/animaux/1',
          expect.objectContaining({
            method: 'DELETE'
          })
        );
      });

      expect(mockOnDelete).toHaveBeenCalledWith(1);
    });

    test('annule la suppression si l\'utilisateur refuse', async () => {
      // userEvent v13 doesn't need setup
      (global.confirm as jest.Mock).mockReturnValue(false);

      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (3)')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Supprimer');
      await userEvent.click(deleteButtons[0]);

      expect(global.confirm).toHaveBeenCalled();
      expect(mockOnDelete).not.toHaveBeenCalled();
    });

    test('marque un animal comme décédé', async () => {
      // userEvent v13 doesn't need setup
      (global.prompt as jest.Mock).mockReturnValue('2023-12-25');
      (global.confirm as jest.Mock).mockReturnValue(true);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAnimals)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: 'Animal marqué comme décédé' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAnimals)
        });

      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (3)')).toBeInTheDocument();
      });

      const markDeadButtons = screen.getAllByTitle('Marquer comme décédé');
      await userEvent.click(markDeadButtons[0]);

      expect(global.prompt).toHaveBeenCalledWith(
        'Date de décès (YYYY-MM-DD):',
        expect.any(String)
      );
      expect(global.confirm).toHaveBeenCalledWith('Marquer FR001 comme décédé le 2023-12-25 ?');

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/animaux/1/deces',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ date_deces: '2023-12-25' })
          })
        );
      });

      expect(mockOnMarkDead).toHaveBeenCalledWith(1);
    });

    test('n\'affiche pas le bouton marquer comme décédé pour les animaux morts', async () => {
      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (3)')).toBeInTheDocument();
      });

      const markDeadButtons = screen.getAllByTitle('Marquer comme décédé');
      // Il devrait y avoir 2 boutons (pour les 2 animaux vivants)
      expect(markDeadButtons).toHaveLength(2);
    });
  });

  describe('Actualisation', () => {
    test('actualise la liste lors du clic sur le bouton actualiser', async () => {
      // userEvent v13 doesn't need setup

      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (3)')).toBeInTheDocument();
      });

      const refreshButton = screen.getByText('Actualiser');
      await userEvent.click(refreshButton);

      // Vérifier que l'API a été appelée à nouveau
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    test('recharge la liste quand refreshTrigger change', async () => {
      const { rerender } = renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
          refreshTrigger={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (3)')).toBeInTheDocument();
      });

      // Changer refreshTrigger
      rerender(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
          refreshTrigger={2}
        />
      );

      // Vérifier que l'API a été appelée à nouveau
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Gestion des erreurs', () => {
    test('affiche un message d\'erreur lors de l\'échec du chargement', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Erreur réseau'));

      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Erreur réseau')).toBeInTheDocument();
      });
    });

    test('affiche un message d\'erreur HTTP', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Erreur serveur' })
      });

      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Erreur serveur')).toBeInTheDocument();
      });
    });

    test('gère les erreurs de suppression', async () => {
      // userEvent v13 doesn't need setup
      (global.confirm as jest.Mock).mockReturnValue(true);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAnimals)
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ message: 'Impossible de supprimer' })
        });

      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (3)')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Supprimer');
      await userEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Erreur lors de la suppression: Impossible de supprimer');
      });
    });

    test('gère les erreurs lors du marquage comme décédé', async () => {
      // userEvent v13 doesn't need setup
      (global.prompt as jest.Mock).mockReturnValue('2023-12-25');
      (global.confirm as jest.Mock).mockReturnValue(true);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAnimals)
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ message: 'Erreur de mise à jour' })
        });

      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (3)')).toBeInTheDocument();
      });

      const markDeadButtons = screen.getAllByTitle('Marquer comme décédé');
      await userEvent.click(markDeadButtons[0]);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Erreur lors de la mise à jour: Erreur de mise à jour');
      });
    });
  });

  describe('Affichage des données', () => {
    test('affiche "Aucun animal trouvé" quand la liste est vide', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      });

      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Aucun animal trouvé.')).toBeInTheDocument();
      });
    });

    test('formate les dates correctement', async () => {
      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('15/01/2023')).toBeInTheDocument();
        expect(screen.getByText('10/06/2022')).toBeInTheDocument();
        expect(screen.getByText('20/03/2021')).toBeInTheDocument();
      });
    });

    test('affiche "-" pour les champs vides', async () => {
      renderWithAuth(
        <AnimalList
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onViewDescendants={mockOnViewDescendants}
          onMarkDead={mockOnMarkDead}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Liste des animaux (3)')).toBeInTheDocument();
      });

      // L'animal FR003 n'a pas de parents
      const rows = screen.getAllByRole('row');
      const taureauxRow = rows.find(row => row.textContent?.includes('FR003'));
      expect(taureauxRow).toHaveTextContent('-'); // Pour les parents
    });
  });
});