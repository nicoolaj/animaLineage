import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import AdminPanel from '../AdminPanel';

// Mock fetch globally
global.fetch = vi.fn();

const mockAdminUser = {
  id: 1,
  nom: 'Admin User',
  email: 'admin@example.com',
  role: 1 // Admin role
};

const mockUsers = [
  {
    id: 1,
    nom: 'Admin User',
    email: 'admin@example.com',
    role: 1,
    statut: 'valide'
  },
  {
    id: 2,
    nom: 'Regular User',
    email: 'user@example.com',
    role: 2,
    statut: 'valide'
  },
  {
    id: 3,
    nom: 'Pending User',
    email: 'pending@example.com',
    role: 2,
    statut: 'en_attente'
  }
];

const mockRoles = [
  { id: 1, nom: 'Administrateur' },
  { id: 2, nom: 'Utilisateur' },
  { id: 3, nom: 'Éleveur' }
];

const mockTypesAnimaux = [
  { id: 1, nom: 'Bovins' },
  { id: 2, nom: 'Ovins' }
];

const mockRaces = [
  { id: 1, nom: 'Holstein', type_animal_id: 1 },
  { id: 2, nom: 'Limousine', type_animal_id: 1 }
];

// Using enhanced render from test-utils

describe('AdminPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful authentication and admin data
    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: mockAdminUser })
        });
      }
      if (url.includes('/admin/users')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUsers)
        });
      }
      if (url.includes('/admin/roles')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRoles)
        });
      }
      if (url.includes('/types-animaux')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTypesAnimaux)
        });
      }
      if (url.includes('/races')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRaces)
        });
      }
      if (url.includes('/admin/update-role') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Rôle mis à jour avec succès' })
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Not found' })
      });
    });

    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn((key) => key === 'token' ? 'admin-token' : null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      writable: true
    });
  });

  it('renders admin panel title', async () => {
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Panel d'administration/i)).toBeInTheDocument();
    });
  });

  it('displays users management section', async () => {
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Gestion des utilisateurs/i)).toBeInTheDocument();
    });
  });

  it('shows list of users', async () => {
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('Regular User')).toBeInTheDocument();
      expect(screen.getByText('Pending User')).toBeInTheDocument();
    });
  });

  it('displays user email addresses', async () => {
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
      expect(screen.getByText('pending@example.com')).toBeInTheDocument();
    });
  });

  it('shows user roles', async () => {
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Administrateur/i)).toBeInTheDocument();
      expect(screen.getByText(/Utilisateur/i)).toBeInTheDocument();
    });
  });

  it('displays user status', async () => {
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText(/valide/i)).toBeInTheDocument();
      expect(screen.getByText(/en_attente/i)).toBeInTheDocument();
    });
  });

  it('allows changing user roles', async () => {
    const user = userEvent.setup();
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText('Regular User')).toBeInTheDocument();
    });

    // Find role select for Regular User
    const roleSelects = screen.getAllByRole('combobox');
    const userRoleSelect = roleSelects[1]; // Second user

    await user.selectOptions(userRoleSelect, '3'); // Change to Éleveur

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/update-role'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer admin-token'
          }),
          body: expect.stringContaining('"user_id":2')
        })
      );
    });
  });

  it('shows types animaux management section', async () => {
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Gestion des types d'animaux/i)).toBeInTheDocument();
    });
  });

  it('displays list of animal types', async () => {
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText('Bovins')).toBeInTheDocument();
      expect(screen.getByText('Ovins')).toBeInTheDocument();
    });
  });

  it('shows races management section', async () => {
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Gestion des races/i)).toBeInTheDocument();
    });
  });

  it('displays list of races', async () => {
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText('Holstein')).toBeInTheDocument();
      expect(screen.getByText('Limousine')).toBeInTheDocument();
    });
  });

  it('allows adding new animal type', async () => {
    const user = userEvent.setup();
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Gestion des types d'animaux/i)).toBeInTheDocument();
    });

    const addTypeButton = screen.getByText(/Ajouter un type/i);
    await user.click(addTypeButton);

    expect(screen.getByText(/Nouveau type d'animal/i)).toBeInTheDocument();
  });

  it('allows adding new race', async () => {
    const user = userEvent.setup();
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Gestion des races/i)).toBeInTheDocument();
    });

    const addRaceButton = screen.getByText(/Ajouter une race/i);
    await user.click(addRaceButton);

    expect(screen.getByText(/Nouvelle race/i)).toBeInTheDocument();
  });

  it('handles loading state', () => {
    render(<AdminPanel />);
    expect(screen.getByText(/Chargement/i)).toBeInTheDocument();
  });

  it('handles error state for unauthorized access', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { ...mockAdminUser, role: 2 } }) // Non-admin user
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Unauthorized' })
      });
    });

    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Accès non autorisé/i)).toBeInTheDocument();
    });
  });

  it('shows statistics section', async () => {
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Statistiques/i)).toBeInTheDocument();
    });
  });

  it('displays user count statistics', async () => {
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Nombre d'utilisateurs/i)).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Total users
    });
  });

  it('shows pending users count', async () => {
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Utilisateurs en attente/i)).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Pending users
    });
  });

  it('allows deleting users', async () => {
    const user = userEvent.setup();

    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: mockAdminUser })
        });
      }
      if (url.includes('/admin/users')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUsers)
        });
      }
      if (url.includes('/admin/delete-user') && options?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Utilisateur supprimé' })
        });
      }
      return Promise.resolve({ ok: false });
    });

    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText('Regular User')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText(/Supprimer/i);
    await user.click(deleteButtons[0]);

    // Confirm deletion
    const confirmButton = screen.getByText(/Confirmer/i);
    await user.click(confirmButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/delete-user'),
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });
  });

  it('shows backup management section', async () => {
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Sauvegarde/i)).toBeInTheDocument();
    });
  });

  it('allows creating backups', async () => {
    const user = userEvent.setup();

    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: mockAdminUser })
        });
      }
      if (url.includes('/backup') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Sauvegarde créée', filename: 'backup_2025.sql' })
        });
      }
      return Promise.resolve({ ok: false });
    });

    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Sauvegarde/i)).toBeInTheDocument();
    });

    const backupButton = screen.getByText(/Créer une sauvegarde/i);
    await user.click(backupButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/backup'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
  });
});