import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PendingAccountDashboard from '../PendingAccountDashboard';

// Mock the API
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(() => 'mock-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

const mockPendingUsers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    created_at: '2023-01-15T10:30:00Z',
    elevage_requested: 'Élevage Dupont'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    created_at: '2023-01-14T10:30:00Z',
    elevage_requested: 'Ferme Martin'
  }
];

describe('PendingAccountDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPendingUsers)
    });
  });

  it('renders the component title', async () => {
    render(<PendingAccountDashboard />);

    expect(screen.getByText('Comptes en Attente de Validation')).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    render(<PendingAccountDashboard />);

    expect(screen.getByText('Chargement des comptes...')).toBeInTheDocument();
  });

  it('displays pending users after loading', async () => {
    render(<PendingAccountDashboard />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('Élevage Dupont')).toBeInTheDocument();
    });
  });

  it('shows approval and rejection buttons', async () => {
    render(<PendingAccountDashboard />);

    await waitFor(() => {
      expect(screen.getAllByText('Approuver')).toHaveLength(2);
      expect(screen.getAllByText('Rejeter')).toHaveLength(2);
    });
  });

  it('displays user registration dates', async () => {
    render(<PendingAccountDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/15\/01\/2023/)).toBeInTheDocument();
      expect(screen.getByText(/14\/01\/2023/)).toBeInTheDocument();
    });
  });

  it('handles user approval', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'User approved' })
    });

    render(<PendingAccountDashboard />);

    await waitFor(() => {
      const approveButtons = screen.getAllByText('Approuver');
      fireEvent.click(approveButtons[0]);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/users/1/approve'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-token'
        })
      })
    );
  });

  it('handles user rejection with confirmation', async () => {
    window.confirm = jest.fn(() => true);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'User rejected' })
    });

    render(<PendingAccountDashboard />);

    await waitFor(() => {
      const rejectButtons = screen.getAllByText('Rejeter');
      fireEvent.click(rejectButtons[0]);
    });

    expect(window.confirm).toHaveBeenCalledWith(
      'Êtes-vous sûr de vouloir rejeter cette demande ? Cette action est irréversible.'
    );

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/users/1/reject'),
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-token'
        })
      })
    );
  });

  it('does not reject when confirmation is cancelled', async () => {
    window.confirm = jest.fn(() => false);

    render(<PendingAccountDashboard />);

    await waitFor(() => {
      const rejectButtons = screen.getAllByText('Rejeter');
      fireEvent.click(rejectButtons[0]);
    });

    expect(window.confirm).toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/reject'),
      expect.any(Object)
    );
  });

  it('shows loading state during approval', async () => {
    mockFetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<PendingAccountDashboard />);

    await waitFor(() => {
      const approveButtons = screen.getAllByText('Approuver');
      fireEvent.click(approveButtons[0]);
    });

    expect(screen.getByText('Approbation en cours...')).toBeInTheDocument();
  });

  it('shows loading state during rejection', async () => {
    window.confirm = jest.fn(() => true);
    mockFetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<PendingAccountDashboard />);

    await waitFor(() => {
      const rejectButtons = screen.getAllByText('Rejeter');
      fireEvent.click(rejectButtons[0]);
    });

    expect(screen.getByText('Rejet en cours...')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'));

    render(<PendingAccountDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement des comptes')).toBeInTheDocument();
    });
  });

  it('shows empty state when no pending users', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    });

    render(<PendingAccountDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Aucun compte en attente')).toBeInTheDocument();
    });
  });

  it('displays user count', async () => {
    render(<PendingAccountDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/2 compte/)).toBeInTheDocument();
    });
  });

  it('refreshes list after approval', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Approved' })
    });

    render(<PendingAccountDashboard />);

    await waitFor(() => {
      const approveButtons = screen.getAllByText('Approuver');
      fireEvent.click(approveButtons[0]);
    });

    await waitFor(() => {
      // Should make additional API call to refresh list
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/pending-users'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  it('refreshes list after rejection', async () => {
    window.confirm = jest.fn(() => true);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Rejected' })
    });

    render(<PendingAccountDashboard />);

    await waitFor(() => {
      const rejectButtons = screen.getAllByText('Rejeter');
      fireEvent.click(rejectButtons[0]);
    });

    await waitFor(() => {
      // Should refresh the list after rejection
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/pending-users'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  it('displays user cards with proper styling', async () => {
    render(<PendingAccountDashboard />);

    await waitFor(() => {
      const userCards = screen.getAllByText('John Doe')[0].closest('div');
      expect(userCards).toHaveClass('bg-white', 'border', 'rounded-lg');
    });
  });

  it('shows requested elevage information', async () => {
    render(<PendingAccountDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Élevage demandé:')).toBeInTheDocument();
      expect(screen.getByText('Élevage Dupont')).toBeInTheDocument();
      expect(screen.getByText('Ferme Martin')).toBeInTheDocument();
    });
  });

  it('handles approval errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Approval failed'));

    render(<PendingAccountDashboard />);

    await waitFor(() => {
      const approveButtons = screen.getAllByText('Approuver');
      fireEvent.click(approveButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText('Erreur lors de l\'approbation')).toBeInTheDocument();
    });
  });

  it('handles rejection errors', async () => {
    window.confirm = jest.fn(() => true);
    mockFetch.mockRejectedValueOnce(new Error('Rejection failed'));

    render(<PendingAccountDashboard />);

    await waitFor(() => {
      const rejectButtons = screen.getAllByText('Rejeter');
      fireEvent.click(rejectButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText('Erreur lors du rejet')).toBeInTheDocument();
    });
  });
});