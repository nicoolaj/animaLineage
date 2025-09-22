import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ElevageUsersManagement from '../ElevageUsersManagement';

// Mock fetch global
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock données pour les tests
const mockElevageUsers = [
  {
    user_id: 101,
    user_name: 'moderator',
    user_email: 'moderator@test.com',
    role_in_elevage: 'owner',
    added_at: '2025-09-20 16:44:21'
  },
  {
    user_id: 100,
    user_name: 'User readonly',
    user_email: 'read@test.com',
    role_in_elevage: 'collaborator',
    added_at: '2025-09-21 16:26:31'
  }
];

const mockAvailableUsers = [
  {
    id: 103,
    name: 'New User',
    email: 'newuser@test.com',
    role: 3,
    role_name: 'Lecteur',
    status: 1
  }
];

// Mock du contexte d'authentification - Admin par défaut
const mockAuthContextAdmin = {
  user: { id: 102, name: 'Admin', email: 'admin@test.com', role: 1, role_name: 'Administrateur', status: 1 },
  token: 'mock-token',
  isAuthenticated: true,
  isAdmin: () => true,
  canModerate: () => true,
  getAuthHeaders: () => ({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer mock-token'
  })
};

// Mock du contexte d'authentification - Modérateur propriétaire
const mockAuthContextModerator = {
  user: { id: 101, name: 'moderator', email: 'moderator@test.com', role: 2, role_name: 'Modérateur', status: 1 },
  token: 'mock-token',
  isAuthenticated: true,
  isAdmin: () => false,
  canModerate: () => true,
  getAuthHeaders: () => ({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer mock-token'
  })
};

// Mock du contexte d'authentification - Utilisateur simple
const mockAuthContextUser = {
  user: { id: 100, name: 'User readonly', email: 'read@test.com', role: 3, role_name: 'Lecteur', status: 1 },
  token: 'mock-token',
  isAuthenticated: true,
  isAdmin: () => false,
  canModerate: () => false,
  getAuthHeaders: () => ({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer mock-token'
  })
};

// Mock du contexte d'authentification
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

const { useAuth } = require('../../contexts/AuthContext');

describe('ElevageUsersManagement Component', () => {
  const defaultProps = {
    elevageId: 2,
    elevageName: 'Les prés du haut',
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    // Par défaut, utiliser le contexte admin
    useAuth.mockReturnValue(mockAuthContextAdmin);
  });

  describe('Rendu du composant', () => {
    test('affiche le titre avec le nom de l\'élevage', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockElevageUsers)
      });

      render(<ElevageUsersManagement {...defaultProps} />);

      expect(screen.getByText(/gestion des utilisateurs - les prés du haut/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /✕/i })).toBeInTheDocument();
    });

    test('affiche le badge administrateur pour les admins', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockElevageUsers)
      });

      render(<ElevageUsersManagement {...defaultProps} />);

      expect(screen.getByText(/👑 accès administrateur/i)).toBeInTheDocument();
    });

    test('n\'affiche pas le badge administrateur pour les non-admins', async () => {
      useAuth.mockReturnValue(mockAuthContextModerator);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockElevageUsers)
      });

      render(<ElevageUsersManagement {...defaultProps} />);

      expect(screen.queryByText(/👑 accès administrateur/i)).not.toBeInTheDocument();
    });

    test('ferme le composant lors du clic sur le bouton fermer', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockElevageUsers)
      });

      render(<ElevageUsersManagement {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /✕/i }));

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Chargement des utilisateurs d\'élevage', () => {
    test('affiche la liste des utilisateurs après chargement réussi', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockElevageUsers)
      });

      render(<ElevageUsersManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('moderator')).toBeInTheDocument();
        expect(screen.getByText('User readonly')).toBeInTheDocument();
        expect(screen.getByText('👑 Propriétaire')).toBeInTheDocument();
        expect(screen.getByText('🤝 Collaborateur')).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/elevages/2/users',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );
    });

    test('affiche un message d\'erreur en cas d\'échec de chargement', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      render(<ElevageUsersManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/erreur lors du chargement des utilisateurs de l'élevage/i)).toBeInTheDocument();
      });
    });

    test('affiche un message d\'accès refusé (403)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403
      });

      render(<ElevageUsersManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/accès refusé pour voir les utilisateurs de cet élevage/i)).toBeInTheDocument();
      });
    });

    test('gère les erreurs de réseau', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<ElevageUsersManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/erreur de connexion lors du chargement/i)).toBeInTheDocument();
      });
    });

    test('affiche un message quand aucun utilisateur n\'est trouvé', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      });

      render(<ElevageUsersManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/aucun utilisateur trouvé pour cet élevage/i)).toBeInTheDocument();
      });
    });
  });

  describe('Permissions de gestion', () => {
    test('affiche les contrôles de gestion pour les administrateurs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockElevageUsers)
      });

      render(<ElevageUsersManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /➕ ajouter un utilisateur/i })).toBeInTheDocument();
      });
    });

    test('affiche les contrôles de gestion pour les modérateurs propriétaires', async () => {
      useAuth.mockReturnValue(mockAuthContextModerator);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockElevageUsers)
      });

      render(<ElevageUsersManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /➕ ajouter un utilisateur/i })).toBeInTheDocument();
      });
    });

    test('affiche un message de permissions insuffisantes pour les utilisateurs simples', async () => {
      useAuth.mockReturnValue(mockAuthContextUser);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockElevageUsers)
      });

      render(<ElevageUsersManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/👁️ vous pouvez uniquement consulter les utilisateurs de cet élevage/i)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /➕ ajouter un utilisateur/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Ajout d\'utilisateurs', () => {
    test('ouvre le formulaire d\'ajout d\'utilisateur', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockElevageUsers)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAvailableUsers)
        });

      render(<ElevageUsersManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /➕ ajouter un utilisateur/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /➕ ajouter un utilisateur/i }));

      await waitFor(() => {
        expect(screen.getByText(/ajouter un utilisateur/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/rechercher un utilisateur par nom ou email/i)).toBeInTheDocument();
      });
    });

    test('affiche les utilisateurs disponibles dans le formulaire', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockElevageUsers)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAvailableUsers)
        });

      render(<ElevageUsersManagement {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /➕ ajouter un utilisateur/i }));
      });

      await waitFor(() => {
        expect(screen.getByText('New User')).toBeInTheDocument();
        expect(screen.getByText('newuser@test.com')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /➕ ajouter/i })).toBeInTheDocument();
      });
    });

    test('filtre les utilisateurs par nom et email', async () => {
      // userEvent v13 doesn't need setup
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockElevageUsers)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([
            ...mockAvailableUsers,
            { id: 104, name: 'Another User', email: 'another@test.com', role: 3, role_name: 'Lecteur', status: 1 }
          ])
        });

      render(<ElevageUsersManagement {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /➕ ajouter un utilisateur/i }));
      });

      const searchInput = screen.getByPlaceholderText(/rechercher un utilisateur par nom ou email/i);

      await userEvent.type(searchInput, 'new');

      await waitFor(() => {
        expect(screen.getByText('New User')).toBeInTheDocument();
        expect(screen.queryByText('Another User')).not.toBeInTheDocument();
      });
    });

    test('ajoute un utilisateur avec succès', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockElevageUsers)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAvailableUsers)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: 'Utilisateur ajouté avec succès', user_name: 'New User' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([...mockElevageUsers, {
            user_id: 103,
            user_name: 'New User',
            user_email: 'newuser@test.com',
            role_in_elevage: 'collaborator',
            added_at: '2025-09-21 18:00:00'
          }])
        });

      render(<ElevageUsersManagement {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /➕ ajouter un utilisateur/i }));
      });

      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /➕ ajouter/i });
        fireEvent.click(addButton);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/elevages/2/users',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          }),
          body: JSON.stringify({
            user_id: 103,
            role_in_elevage: 'collaborator'
          })
        })
      );
    });

    test('gère les erreurs lors de l\'ajout d\'utilisateur', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockElevageUsers)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAvailableUsers)
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ message: 'Utilisateur déjà ajouté' })
        });

      render(<ElevageUsersManagement {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /➕ ajouter un utilisateur/i }));
      });

      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /➕ ajouter/i });
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/utilisateur déjà ajouté/i)).toBeInTheDocument();
      });
    });

    test('annule l\'ajout d\'utilisateur', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockElevageUsers)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAvailableUsers)
        });

      render(<ElevageUsersManagement {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /➕ ajouter un utilisateur/i }));
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /annuler/i }));
      });

      expect(screen.queryByText(/ajouter un utilisateur/i)).not.toBeInTheDocument();
    });
  });

  describe('Suppression d\'utilisateurs', () => {
    test('affiche le bouton de suppression pour les collaborateurs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockElevageUsers)
      });

      render(<ElevageUsersManagement {...defaultProps} />);

      await waitFor(() => {
        // Le propriétaire ne doit pas avoir de bouton suppression
        const ownerRow = screen.getByText('moderator').closest('.user-item');
        expect(ownerRow?.querySelector('button[title="Retirer cet utilisateur"]')).not.toBeInTheDocument();

        // Le collaborateur doit avoir un bouton suppression
        const collaboratorRow = screen.getByText('User readonly').closest('.user-item');
        expect(collaboratorRow?.querySelector('button[title="Retirer cet utilisateur"]')).toBeInTheDocument();
      });
    });

    test('supprime un utilisateur avec confirmation', async () => {
      // Mock window.confirm
      const originalConfirm = window.confirm;
      window.confirm = jest.fn(() => true);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockElevageUsers)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: 'Utilisateur retiré avec succès' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockElevageUsers[0]]) // Seul le propriétaire reste
        });

      render(<ElevageUsersManagement {...defaultProps} />);

      await waitFor(() => {
        const collaboratorRow = screen.getByText('User readonly').closest('.user-item');
        const deleteButton = collaboratorRow?.querySelector('button[title="Retirer cet utilisateur"]') as HTMLButtonElement;
        fireEvent.click(deleteButton);
      });

      expect(window.confirm).toHaveBeenCalledWith('Êtes-vous sûr de vouloir retirer User readonly de cet élevage ?');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/elevages/2/users/100',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );

      // Restore window.confirm
      window.confirm = originalConfirm;
    });

    test('annule la suppression si l\'utilisateur refuse la confirmation', async () => {
      // Mock window.confirm pour retourner false
      const originalConfirm = window.confirm;
      window.confirm = jest.fn(() => false);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockElevageUsers)
      });

      render(<ElevageUsersManagement {...defaultProps} />);

      await waitFor(() => {
        const collaboratorRow = screen.getByText('User readonly').closest('.user-item');
        const deleteButton = collaboratorRow?.querySelector('button[title="Retirer cet utilisateur"]') as HTMLButtonElement;
        fireEvent.click(deleteButton);
      });

      expect(window.confirm).toHaveBeenCalled();

      // Vérifier qu'aucune requête DELETE n'a été faite
      expect(mockFetch).toHaveBeenCalledTimes(1); // Seul le GET initial

      // Restore window.confirm
      window.confirm = originalConfirm;
    });
  });
});