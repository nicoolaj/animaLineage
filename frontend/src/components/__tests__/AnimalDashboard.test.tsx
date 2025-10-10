import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../contexts/AuthContext';
import AnimalDashboard from '../AnimalDashboard';

// Mock fetch globally
global.fetch = vi.fn();

const mockAnimal = {
  id: 1,
  identifiant_officiel: 'FR001',
  nom: 'Belle',
  sexe: 'F',
  race_nom: 'Holstein',
  date_naissance: '2020-01-15',
  statut: 'vivant',
  elevage_nom: 'Ferme Test',
  pere_identifiant: 'FR100',
  mere_identifiant: 'FR200'
};

const mockStats = {
  nb_descendants: 5,
  descendants_vivants: 4,
  descendants_morts: 1
};

const mockDescendants = [
  {
    id: 2,
    identifiant_officiel: 'FR002',
    nom: 'Petit Belle',
    sexe: 'F',
    race_nom: 'Holstein',
    date_naissance: '2021-03-10',
    statut: 'vivant'
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

describe('AnimalDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful authentication and API calls
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: mockUser })
        });
      }
      if (url.includes('/animaux/1/stats-reproduction')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStats)
        });
      }
      if (url.includes('/animaux/1/descendants')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDescendants)
        });
      }
      if (url.includes('/animaux/1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAnimal)
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

  it('renders animal information correctly', async () => {
    renderWithAuth(<AnimalDashboard animalId={1} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Belle')).toBeInTheDocument();
      expect(screen.getByText('FR001')).toBeInTheDocument();
      expect(screen.getByText('Holstein')).toBeInTheDocument();
      expect(screen.getByText('Ferme Test')).toBeInTheDocument();
    });
  });

  it('displays reproduction statistics', async () => {
    renderWithAuth(<AnimalDashboard animalId={1} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // nb_descendants
      expect(screen.getByText('4')).toBeInTheDocument(); // descendants_vivants
      expect(screen.getByText('1')).toBeInTheDocument(); // descendants_morts
    });
  });

  it('shows descendants list', async () => {
    renderWithAuth(<AnimalDashboard animalId={1} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Petit Belle')).toBeInTheDocument();
      expect(screen.getByText('FR002')).toBeInTheDocument();
    });
  });

  it('displays parent information when available', async () => {
    renderWithAuth(<AnimalDashboard animalId={1} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('FR100')).toBeInTheDocument(); // père
      expect(screen.getByText('FR200')).toBeInTheDocument(); // mère
    });
  });

  it('opens family tree when button is clicked', async () => {
    const user = userEvent.setup();
    renderWithAuth(<AnimalDashboard animalId={1} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Belle')).toBeInTheDocument();
    });

    const treeButton = screen.getByText(/Arbre généalogique/i);
    await user.click(treeButton);

    expect(screen.getByText(/Arbre Généalogique/i)).toBeInTheDocument();
  });

  it('opens edit form when edit button is clicked', async () => {
    const user = userEvent.setup();
    renderWithAuth(<AnimalDashboard animalId={1} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Belle')).toBeInTheDocument();
    });

    const editButton = screen.getByText(/Modifier/i);
    await user.click(editButton);

    expect(screen.getByText(/Modifier l'animal/i)).toBeInTheDocument();
  });

  it('handles loading state', () => {
    renderWithAuth(<AnimalDashboard animalId={1} onClose={() => {}} />);
    expect(screen.getByText(/Chargement/i)).toBeInTheDocument();
  });

  it('handles error state for animal not found', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: mockUser })
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Animal non trouvé' })
      });
    });

    renderWithAuth(<AnimalDashboard animalId={999} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/Animal non trouvé/i)).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    const mockOnClose = vi.fn();
    const user = userEvent.setup();

    renderWithAuth(<AnimalDashboard animalId={1} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Belle')).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText(/Fermer/i);
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('displays sex icon correctly', async () => {
    renderWithAuth(<AnimalDashboard animalId={1} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('♀️')).toBeInTheDocument(); // Femelle
    });
  });

  it('handles animal with no descendants', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: mockUser })
        });
      }
      if (url.includes('/animaux/1/descendants')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      if (url.includes('/animaux/1/stats-reproduction')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ nb_descendants: 0, descendants_vivants: 0, descendants_morts: 0 })
        });
      }
      if (url.includes('/animaux/1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAnimal)
        });
      }
      return Promise.resolve({ ok: false });
    });

    renderWithAuth(<AnimalDashboard animalId={1} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/Aucun descendant/i)).toBeInTheDocument();
    });
  });
});