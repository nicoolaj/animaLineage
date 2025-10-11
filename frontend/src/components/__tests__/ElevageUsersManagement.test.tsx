import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import ElevageUsersManagement from '../ElevageUsersManagement';

// Mock the API
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(() => 'mock-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

const mockProps = {
  elevageId: 1,
  onClose: vi.fn()
};

const mockUsers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 2,
    role_name: 'Modérateur',
    status: 1
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 3,
    role_name: 'Utilisateur',
    status: 1
  }
];

const mockAvailableUsers = [
  {
    id: 3,
    name: 'Bob Wilson',
    email: 'bob@example.com',
    role: 3,
    role_name: 'Utilisateur',
    status: 1
  }
];

describe('ElevageUsersManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsers)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAvailableUsers)
      });
  });

  it('renders the component title', async () => {
    render(<ElevageUsersManagement {...mockProps} />);

    expect(screen.getByText('Gestion des Utilisateurs')).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    render(<ElevageUsersManagement {...mockProps} />);

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('displays current users after loading', async () => {
    render(<ElevageUsersManagement {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Utilisateurs actuels')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('Modérateur')).toBeInTheDocument();
    });
  });

  it('shows add user section', async () => {
    render(<ElevageUsersManagement {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Ajouter un utilisateur')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });
  });

  it('handles adding a user to elevage', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'User added' })
    });

    render(<ElevageUsersManagement {...mockProps} />);

    await waitFor(() => {
      const addButtons = screen.getAllByText('Ajouter');
      fireEvent.click(addButtons[0]);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/elevages/1/users'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        }),
        body: JSON.stringify({ user_id: 3 })
      })
    );
  });

  it('handles removing a user from elevage', async () => {
    window.confirm = vi.fn(() => true);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'User removed' })
    });

    render(<ElevageUsersManagement {...mockProps} />);

    await waitFor(() => {
      const removeButtons = screen.getAllByText('Retirer');
      fireEvent.click(removeButtons[0]);
    });

    expect(window.confirm).toHaveBeenCalledWith(
      'Êtes-vous sûr de vouloir retirer cet utilisateur de l\'élevage ?'
    );

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/elevages/1/users/1'),
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-token'
        })
      })
    );
  });

  it('shows user roles correctly', async () => {
    render(<ElevageUsersManagement {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Modérateur')).toBeInTheDocument();
      expect(screen.getByText('Utilisateur')).toBeInTheDocument();
    });
  });

  it('displays user emails', async () => {
    render(<ElevageUsersManagement {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'));

    render(<ElevageUsersManagement {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement')).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    render(<ElevageUsersManagement {...mockProps} />);

    await waitFor(() => {
      const closeButton = screen.getByText('Fermer');
      fireEvent.click(closeButton);
    });

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('shows empty state when no available users', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsers)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      });

    render(<ElevageUsersManagement {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Aucun utilisateur disponible')).toBeInTheDocument();
    });
  });

  it('refreshes data after adding user', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'User added' })
    });

    render(<ElevageUsersManagement {...mockProps} />);

    await waitFor(() => {
      const addButtons = screen.getAllByText('Ajouter');
      fireEvent.click(addButtons[0]);
    });

    await waitFor(() => {
      // Should make additional API calls to refresh data
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/elevages/1/users'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  it('shows user count', async () => {
    render(<ElevageUsersManagement {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText(/2 utilisateur/)).toBeInTheDocument();
    });
  });

  it('handles permission-based actions', async () => {
    render(<ElevageUsersManagement {...mockProps} />);

    await waitFor(() => {
      // Should show action buttons based on user permissions
      expect(screen.getAllByText('Retirer')).toHaveLength(2);
      expect(screen.getAllByText('Ajouter')).toHaveLength(1);
    });
  });
});