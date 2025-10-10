import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, clearAllMocks, setupFetchMock } from '../../test-utils';
import TransferRequestManager from '../TransferRequestManager';

const mockTransferRequests = [
  {
    id: 1,
    animal_identifiant: 'FR001',
    animal_nom: 'Belle',
    from_elevage_nom: 'Ferme Source',
    to_elevage_nom: 'Ferme Destination',
    statut: 'en_attente',
    created_at: '2025-01-01T10:00:00Z',
    notes: 'Transfert de qualité'
  },
  {
    id: 2,
    animal_identifiant: 'FR002',
    animal_nom: 'Rex',
    from_elevage_nom: 'Ferme A',
    to_elevage_nom: 'Ferme B',
    statut: 'accepte',
    created_at: '2025-01-02T10:00:00Z'
  }
];

describe('TransferRequestManager Component', () => {
  beforeEach(() => {
    clearAllMocks();
    setupFetchMock({
      '/transfer-requests': mockTransferRequests
    });
  });

  it('renders transfer requests title', async () => {
    render(<TransferRequestManager />);

    await waitFor(() => {
      expect(screen.getByText(/Demandes de transfert/i)).toBeInTheDocument();
    });
  });

  it('displays list of transfer requests', async () => {
    render(<TransferRequestManager />);

    await waitFor(() => {
      expect(screen.getByText('Belle (FR001)')).toBeInTheDocument();
      expect(screen.getByText('Rex (FR002)')).toBeInTheDocument();
    });
  });

  it('shows transfer request details', async () => {
    render(<TransferRequestManager />);

    await waitFor(() => {
      expect(screen.getByText('Ferme Source')).toBeInTheDocument();
      expect(screen.getByText('Ferme Destination')).toBeInTheDocument();
      expect(screen.getByText('Transfert de qualité')).toBeInTheDocument();
    });
  });

  it('displays request status', async () => {
    render(<TransferRequestManager />);

    await waitFor(() => {
      expect(screen.getByText(/en_attente/i)).toBeInTheDocument();
      expect(screen.getByText(/accepte/i)).toBeInTheDocument();
    });
  });

  it('shows request creation date', async () => {
    render(<TransferRequestManager />);

    await waitFor(() => {
      expect(screen.getByText(/01\/01\/2025/i)).toBeInTheDocument();
      expect(screen.getByText(/02\/01\/2025/i)).toBeInTheDocument();
    });
  });

  it('allows accepting a pending request', async () => {
    const user = userEvent.setup();

    setupFetchMock({
      '/transfer-requests': mockTransferRequests,
      '/transfer-requests/1': { message: 'Demande acceptée' }
    });

    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/transfer-requests') && !url.includes('/transfer-requests/1') && !options?.method) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTransferRequests)
        });
      }
      if (url.includes('/transfer-requests/1') && options?.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Demande acceptée' })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: { id: 1, nom: 'Test', role: 2 } })
      });
    });

    render(<TransferRequestManager />);

    await waitFor(() => {
      expect(screen.getByText('Belle (FR001)')).toBeInTheDocument();
    });

    const acceptButton = screen.getByText(/Accepter/i);
    await user.click(acceptButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/transfer-requests/1'),
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"statut":"accepte"')
        })
      );
    });
  });

  it('allows rejecting a pending request', async () => {
    const user = userEvent.setup();

    setupFetchMock({
      '/transfer-requests': mockTransferRequests,
      '/transfer-requests/1': { message: 'Demande rejetée' }
    });

    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/transfer-requests') && !url.includes('/transfer-requests/1') && !options?.method) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTransferRequests)
        });
      }
      if (url.includes('/transfer-requests/1') && options?.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Demande rejetée' })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: { id: 1, nom: 'Test', role: 2 } })
      });
    });

    render(<TransferRequestManager />);

    await waitFor(() => {
      expect(screen.getByText('Belle (FR001)')).toBeInTheDocument();
    });

    const rejectButton = screen.getByText(/Rejeter/i);
    await user.click(rejectButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/transfer-requests/1'),
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"statut":"rejete"')
        })
      );
    });
  });

  it('filters requests by status', async () => {
    const user = userEvent.setup();
    render(<TransferRequestManager />);

    await waitFor(() => {
      expect(screen.getByText('Belle (FR001)')).toBeInTheDocument();
      expect(screen.getByText('Rex (FR002)')).toBeInTheDocument();
    });

    const statusFilter = screen.getByLabelText(/Filtrer par statut/i);
    await user.selectOptions(statusFilter, 'en_attente');

    expect(screen.getByText('Belle (FR001)')).toBeInTheDocument();
    expect(screen.queryByText('Rex (FR002)')).not.toBeInTheDocument();
  });

  it('searches requests by animal name', async () => {
    const user = userEvent.setup();
    render(<TransferRequestManager />);

    await waitFor(() => {
      expect(screen.getByText('Belle (FR001)')).toBeInTheDocument();
      expect(screen.getByText('Rex (FR002)')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Rechercher/i);
    await user.type(searchInput, 'Belle');

    expect(screen.getByText('Belle (FR001)')).toBeInTheDocument();
    expect(screen.queryByText('Rex (FR002)')).not.toBeInTheDocument();
  });

  it('handles empty requests list', async () => {
    setupFetchMock({
      '/transfer-requests': []
    });

    render(<TransferRequestManager />);

    await waitFor(() => {
      expect(screen.getByText(/Aucune demande de transfert/i)).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<TransferRequestManager />);
    expect(screen.getByText(/Chargement/i)).toBeInTheDocument();
  });

  it('handles error state', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 1, nom: 'Test', role: 2 } })
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Server error' })
      });
    });

    render(<TransferRequestManager />);

    await waitFor(() => {
      expect(screen.getByText(/Erreur lors du chargement/i)).toBeInTheDocument();
    });
  });

  it('displays request notes when available', async () => {
    render(<TransferRequestManager />);

    await waitFor(() => {
      expect(screen.getByText('Transfert de qualité')).toBeInTheDocument();
    });
  });

  it('shows different styles for different statuses', async () => {
    render(<TransferRequestManager />);

    await waitFor(() => {
      const pendingStatus = screen.getByText(/en_attente/i);
      const acceptedStatus = screen.getByText(/accepte/i);

      expect(pendingStatus).toHaveClass('bg-yellow-100');
      expect(acceptedStatus).toHaveClass('bg-green-100');
    });
  });

  it('allows opening transfer request details', async () => {
    const user = userEvent.setup();
    render(<TransferRequestManager />);

    await waitFor(() => {
      expect(screen.getByText('Belle (FR001)')).toBeInTheDocument();
    });

    const detailsButton = screen.getByText(/Voir détails/i);
    await user.click(detailsButton);

    expect(screen.getByText(/Détails de la demande/i)).toBeInTheDocument();
  });

  it('refreshes data when refresh button is clicked', async () => {
    const user = userEvent.setup();
    render(<TransferRequestManager />);

    await waitFor(() => {
      expect(screen.getByText('Belle (FR001)')).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText(/Actualiser/i);
    await user.click(refreshButton);

    expect(global.fetch).toHaveBeenCalledTimes(3); // Initial auth + requests + refresh
  });

  it('shows confirmation dialog before processing request', async () => {
    const user = userEvent.setup();
    render(<TransferRequestManager />);

    await waitFor(() => {
      expect(screen.getByText('Belle (FR001)')).toBeInTheDocument();
    });

    const acceptButton = screen.getByText(/Accepter/i);
    await user.click(acceptButton);

    expect(screen.getByText(/Confirmer l'acceptation/i)).toBeInTheDocument();
  });
});