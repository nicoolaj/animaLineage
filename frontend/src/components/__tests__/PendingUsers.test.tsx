import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, clearAllMocks, setupFetchMock } from '../../test-utils';
import PendingUsers from '../PendingUsers';

const mockPendingUsers = [
  {
    id: 1,
    nom: 'Jean Dupont',
    email: 'jean@test.com',
    statut: 'en_attente',
    created_at: '2025-01-01T10:00:00Z'
  },
  {
    id: 2,
    nom: 'Marie Martin',
    email: 'marie@test.com',
    statut: 'en_attente',
    created_at: '2025-01-02T10:00:00Z'
  }
];

describe('PendingUsers Component', () => {
  beforeEach(() => {
    clearAllMocks();
    setupFetchMock({
      '/simple-admin/pending-users': mockPendingUsers
    });
  });

  it('renders pending users title', async () => {
    render(<PendingUsers />);

    await waitFor(() => {
      expect(screen.getByText(/Utilisateurs en attente/i)).toBeInTheDocument();
    });
  });

  it('displays list of pending users', async () => {
    render(<PendingUsers />);

    await waitFor(() => {
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
      expect(screen.getByText('Marie Martin')).toBeInTheDocument();
    });
  });

  it('shows user email addresses', async () => {
    render(<PendingUsers />);

    await waitFor(() => {
      expect(screen.getByText('jean@test.com')).toBeInTheDocument();
      expect(screen.getByText('marie@test.com')).toBeInTheDocument();
    });
  });

  it('displays registration dates', async () => {
    render(<PendingUsers />);

    await waitFor(() => {
      expect(screen.getByText(/01\/01\/2025/i)).toBeInTheDocument();
      expect(screen.getByText(/02\/01\/2025/i)).toBeInTheDocument();
    });
  });

  it('shows pending status', async () => {
    render(<PendingUsers />);

    await waitFor(() => {
      expect(screen.getAllByText(/en_attente/i)).toHaveLength(2);
    });
  });

  it('allows validating a user', async () => {
    const user = userEvent.setup();

    setupFetchMock({
      '/simple-admin/pending-users': mockPendingUsers,
      '/simple-admin/validate-user': { message: 'Utilisateur validé' }
    });

    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/simple-admin/pending-users') && !options?.method) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPendingUsers)
        });
      }
      if (url.includes('/simple-admin/validate-user') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Utilisateur validé' })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: { id: 1, nom: 'Admin', role: 1 } })
      });
    });

    render(<PendingUsers />);

    await waitFor(() => {
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    });

    const validateButtons = screen.getAllByText(/Valider/i);
    await user.click(validateButtons[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/simple-admin/validate-user'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"user_id":1')
        })
      );
    });
  });

  it('allows rejecting a user', async () => {
    const user = userEvent.setup();

    setupFetchMock({
      '/simple-admin/pending-users': mockPendingUsers,
      '/simple-admin/delete-user': { message: 'Utilisateur rejeté' }
    });

    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/simple-admin/pending-users') && !options?.method) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPendingUsers)
        });
      }
      if (url.includes('/simple-admin/delete-user') && options?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Utilisateur rejeté' })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: { id: 1, nom: 'Admin', role: 1 } })
      });
    });

    render(<PendingUsers />);

    await waitFor(() => {
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    });

    const rejectButtons = screen.getAllByText(/Rejeter/i);
    await user.click(rejectButtons[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/simple-admin/delete-user'),
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });
  });

  it('shows confirmation dialog before validation', async () => {
    const user = userEvent.setup();
    render(<PendingUsers />);

    await waitFor(() => {
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    });

    const validateButton = screen.getAllByText(/Valider/i)[0];
    await user.click(validateButton);

    expect(screen.getByText(/Confirmer la validation/i)).toBeInTheDocument();
  });

  it('shows confirmation dialog before rejection', async () => {
    const user = userEvent.setup();
    render(<PendingUsers />);

    await waitFor(() => {
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    });

    const rejectButton = screen.getAllByText(/Rejeter/i)[0];
    await user.click(rejectButton);

    expect(screen.getByText(/Confirmer le rejet/i)).toBeInTheDocument();
  });

  it('filters users by search term', async () => {
    const user = userEvent.setup();
    render(<PendingUsers />);

    await waitFor(() => {
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
      expect(screen.getByText('Marie Martin')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Rechercher/i);
    await user.type(searchInput, 'Jean');

    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    expect(screen.queryByText('Marie Martin')).not.toBeInTheDocument();
  });

  it('handles empty pending users list', async () => {
    setupFetchMock({
      '/simple-admin/pending-users': []
    });

    render(<PendingUsers />);

    await waitFor(() => {
      expect(screen.getByText(/Aucun utilisateur en attente/i)).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<PendingUsers />);
    expect(screen.getByText(/Chargement/i)).toBeInTheDocument();
  });

  it('handles error state', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 1, nom: 'Admin', role: 1 } })
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Server error' })
      });
    });

    render(<PendingUsers />);

    await waitFor(() => {
      expect(screen.getByText(/Erreur lors du chargement/i)).toBeInTheDocument();
    });
  });

  it('displays user count', async () => {
    render(<PendingUsers />);

    await waitFor(() => {
      expect(screen.getByText(/2 utilisateurs en attente/i)).toBeInTheDocument();
    });
  });

  it('refreshes data when refresh button is clicked', async () => {
    const user = userEvent.setup();
    render(<PendingUsers />);

    await waitFor(() => {
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText(/Actualiser/i);
    await user.click(refreshButton);

    expect(global.fetch).toHaveBeenCalledTimes(3); // Initial auth + users + refresh
  });

  it('shows success message after validation', async () => {
    const user = userEvent.setup();

    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/simple-admin/pending-users') && !options?.method) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPendingUsers)
        });
      }
      if (url.includes('/simple-admin/validate-user') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Utilisateur validé avec succès' })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: { id: 1, nom: 'Admin', role: 1 } })
      });
    });

    render(<PendingUsers />);

    await waitFor(() => {
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    });

    const validateButton = screen.getAllByText(/Valider/i)[0];
    await user.click(validateButton);

    const confirmButton = screen.getByText(/Confirmer/i);
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/Utilisateur validé avec succès/i)).toBeInTheDocument();
    });
  });

  it('shows error message when validation fails', async () => {
    const user = userEvent.setup();

    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/simple-admin/pending-users') && !options?.method) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPendingUsers)
        });
      }
      if (url.includes('/simple-admin/validate-user') && options?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Erreur de validation' })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: { id: 1, nom: 'Admin', role: 1 } })
      });
    });

    render(<PendingUsers />);

    await waitFor(() => {
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    });

    const validateButton = screen.getAllByText(/Valider/i)[0];
    await user.click(validateButton);

    const confirmButton = screen.getByText(/Confirmer/i);
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/Erreur de validation/i)).toBeInTheDocument();
    });
  });

  it('sorts users by registration date', async () => {
    render(<PendingUsers />);

    await waitFor(() => {
      const userElements = screen.getAllByText(/jean@test.com|marie@test.com/i);
      expect(userElements[0]).toHaveTextContent('jean@test.com'); // Older first
      expect(userElements[1]).toHaveTextContent('marie@test.com');
    });
  });
});