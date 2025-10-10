import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../contexts/AuthContext';
import AnimalList from '../AnimalList';

// Mock fetch globally
global.fetch = vi.fn();

const mockAnimals = [
  {
    id: 1,
    identifiant_officiel: 'FR001',
    nom: 'Belle',
    sexe: 'F',
    race_nom: 'Holstein',
    date_naissance: '2020-01-15',
    statut: 'vivant',
    elevage_nom: 'Ferme Test'
  },
  {
    id: 2,
    identifiant_officiel: 'FR002',
    nom: 'Rex',
    sexe: 'M',
    race_nom: 'Holstein',
    date_naissance: '2019-12-10',
    statut: 'vivant',
    elevage_nom: 'Ferme Test'
  }
];

const mockUser = {
  id: 1,
  nom: 'Test User',
  email: 'test@example.com',
  role: 2
};

const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <AuthProvider>{component}</AuthProvider>
  );
};

describe('AnimalList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful authentication
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: mockUser })
        });
      }
      if (url.includes('/animaux')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAnimals)
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
        getItem: vi.fn((key) => key === 'token' ? 'mock-token' : null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      writable: true
    });
  });

  it('renders loading state initially', () => {
    renderWithAuth(<AnimalList />);
    expect(screen.getByText(/Chargement des animaux/i)).toBeInTheDocument();
  });

  it('displays animals list after loading', async () => {
    renderWithAuth(<AnimalList />);

    await waitFor(() => {
      expect(screen.getByText('Belle')).toBeInTheDocument();
      expect(screen.getByText('Rex')).toBeInTheDocument();
    });
  });

  it('displays animal details correctly', async () => {
    renderWithAuth(<AnimalList />);

    await waitFor(() => {
      expect(screen.getByText('FR001')).toBeInTheDocument();
      expect(screen.getByText('Holstein')).toBeInTheDocument();
      expect(screen.getByText('Ferme Test')).toBeInTheDocument();
    });
  });

  it('filters animals by search term', async () => {
    const user = userEvent.setup();
    renderWithAuth(<AnimalList />);

    await waitFor(() => {
      expect(screen.getByText('Belle')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Rechercher/i);
    await user.type(searchInput, 'Belle');

    expect(screen.getByText('Belle')).toBeInTheDocument();
    expect(screen.queryByText('Rex')).not.toBeInTheDocument();
  });

  it('handles error state', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: mockUser })
        });
      }
      if (url.includes('/animaux')) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Server error' })
        });
      }
      return Promise.resolve({ ok: false });
    });

    renderWithAuth(<AnimalList />);

    await waitFor(() => {
      expect(screen.getByText(/Erreur lors du chargement/i)).toBeInTheDocument();
    });
  });

  it('shows add animal button for authenticated users', async () => {
    renderWithAuth(<AnimalList />);

    await waitFor(() => {
      expect(screen.getByText(/Ajouter un animal/i)).toBeInTheDocument();
    });
  });

  it('opens animal form when add button is clicked', async () => {
    const user = userEvent.setup();
    renderWithAuth(<AnimalList />);

    await waitFor(() => {
      expect(screen.getByText(/Ajouter un animal/i)).toBeInTheDocument();
    });

    const addButton = screen.getByText(/Ajouter un animal/i);
    await user.click(addButton);

    expect(screen.getByText(/Nouvel Animal/i)).toBeInTheDocument();
  });

  it('displays correct animal count', async () => {
    renderWithAuth(<AnimalList />);

    await waitFor(() => {
      expect(screen.getByText(/2 animaux/i)).toBeInTheDocument();
    });
  });

  it('handles empty animal list', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: mockUser })
        });
      }
      if (url.includes('/animaux')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      return Promise.resolve({ ok: false });
    });

    renderWithAuth(<AnimalList />);

    await waitFor(() => {
      expect(screen.getByText(/Aucun animal trouvé/i)).toBeInTheDocument();
    });
  });

  it('refreshes data when refresh button is clicked', async () => {
    const user = userEvent.setup();
    renderWithAuth(<AnimalList />);

    await waitFor(() => {
      expect(screen.getByText('Belle')).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText(/Actualiser/i);
    await user.click(refreshButton);

    expect(global.fetch).toHaveBeenCalledTimes(4); // Initial auth + animals + refresh calls
  });
});