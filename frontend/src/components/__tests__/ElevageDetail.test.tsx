import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, clearAllMocks, setupFetchMock } from '../../test-utils';
import ElevageDetail from '../ElevageDetail';

const mockElevage = {
  id: 1,
  nom: 'Ferme Test',
  description: 'Une ferme de test',
  adresse: '123 Rue Test',
  code_postal: '12345',
  ville: 'Test City',
  telephone: '0123456789',
  email: 'ferme@test.com',
  user_nom: 'Propriétaire Test',
  created_at: '2025-01-01T10:00:00Z'
};

const mockAnimaux = [
  {
    id: 1,
    identifiant_officiel: 'FR001',
    nom: 'Belle',
    sexe: 'F',
    race_nom: 'Holstein',
    statut: 'vivant'
  },
  {
    id: 2,
    identifiant_officiel: 'FR002',
    nom: 'Rex',
    sexe: 'M',
    race_nom: 'Holstein',
    statut: 'vivant'
  }
];

const mockUsers = [
  {
    id: 1,
    nom: 'Propriétaire Test',
    email: 'prop@test.com'
  },
  {
    id: 2,
    nom: 'Collaborateur Test',
    email: 'collab@test.com'
  }
];

describe('ElevageDetail Component', () => {
  beforeEach(() => {
    clearAllMocks();
    setupFetchMock({
      '/elevages/1': mockElevage,
      '/animaux?elevage_id=1': mockAnimaux,
      '/elevages/1/users': mockUsers
    });
  });

  it('renders elevage information', async () => {
    render(<ElevageDetail elevageId={1} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Ferme Test')).toBeInTheDocument();
      expect(screen.getByText('Une ferme de test')).toBeInTheDocument();
      expect(screen.getByText('123 Rue Test')).toBeInTheDocument();
      expect(screen.getByText('12345 Test City')).toBeInTheDocument();
    });
  });

  it('displays contact information', async () => {
    render(<ElevageDetail elevageId={1} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('0123456789')).toBeInTheDocument();
      expect(screen.getByText('ferme@test.com')).toBeInTheDocument();
    });
  });

  it('shows elevage owner', async () => {
    render(<ElevageDetail elevageId={1} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Propriétaire Test')).toBeInTheDocument();
    });
  });

  it('displays creation date', async () => {
    render(<ElevageDetail elevageId={1} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/Créé le/i)).toBeInTheDocument();
      expect(screen.getByText(/01\/01\/2025/i)).toBeInTheDocument();
    });
  });

  it('shows animals list', async () => {
    render(<ElevageDetail elevageId={1} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/Animaux de l'élevage/i)).toBeInTheDocument();
      expect(screen.getByText('Belle')).toBeInTheDocument();
      expect(screen.getByText('Rex')).toBeInTheDocument();
      expect(screen.getByText('FR001')).toBeInTheDocument();
      expect(screen.getByText('FR002')).toBeInTheDocument();
    });
  });

  it('displays animal count', async () => {
    render(<ElevageDetail elevageId={1} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/2 animaux/i)).toBeInTheDocument();
    });
  });

  it('shows users management section', async () => {
    render(<ElevageDetail elevageId={1} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/Utilisateurs/i)).toBeInTheDocument();
      expect(screen.getByText('Propriétaire Test')).toBeInTheDocument();
      expect(screen.getByText('Collaborateur Test')).toBeInTheDocument();
    });
  });

  it('allows editing elevage when user has permissions', async () => {
    const user = userEvent.setup();
    render(<ElevageDetail elevageId={1} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Ferme Test')).toBeInTheDocument();
    });

    const editButton = screen.getByText(/Modifier/i);
    await user.click(editButton);

    expect(screen.getByText(/Modifier l'élevage/i)).toBeInTheDocument();
  });

  it('shows add animal button for authorized users', async () => {
    render(<ElevageDetail elevageId={1} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/Ajouter un animal/i)).toBeInTheDocument();
    });
  });

  it('opens animal form when add animal is clicked', async () => {
    const user = userEvent.setup();
    render(<ElevageDetail elevageId={1} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/Ajouter un animal/i)).toBeInTheDocument();
    });

    const addButton = screen.getByText(/Ajouter un animal/i);
    await user.click(addButton);

    expect(screen.getByText(/Nouvel Animal/i)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const mockOnClose = vi.fn();
    const user = userEvent.setup();

    render(<ElevageDetail elevageId={1} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Ferme Test')).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText(/Fermer/i);
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('handles loading state', () => {
    render(<ElevageDetail elevageId={1} onClose={() => {}} />);
    expect(screen.getByText(/Chargement/i)).toBeInTheDocument();
  });

  it('handles error state for elevage not found', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 1, nom: 'Test User', role: 2 } })
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Élevage non trouvé' })
      });
    });

    render(<ElevageDetail elevageId={999} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/Élevage non trouvé/i)).toBeInTheDocument();
    });
  });

  it('displays statistics section', async () => {
    render(<ElevageDetail elevageId={1} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/Statistiques/i)).toBeInTheDocument();
    });
  });

  it('shows animal count by sex', async () => {
    render(<ElevageDetail elevageId={1} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/Mâles/i)).toBeInTheDocument();
      expect(screen.getByText(/Femelles/i)).toBeInTheDocument();
    });
  });

  it('handles empty animals list', async () => {
    setupFetchMock({
      '/elevages/1': mockElevage,
      '/animaux?elevage_id=1': [],
      '/elevages/1/users': mockUsers
    });

    render(<ElevageDetail elevageId={1} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/Aucun animal/i)).toBeInTheDocument();
    });
  });

  it('allows managing users when user is owner', async () => {
    const user = userEvent.setup();
    render(<ElevageDetail elevageId={1} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/Gérer les utilisateurs/i)).toBeInTheDocument();
    });

    const manageButton = screen.getByText(/Gérer les utilisateurs/i);
    await user.click(manageButton);

    expect(screen.getByText(/Gestion des utilisateurs/i)).toBeInTheDocument();
  });

  it('shows animal details when animal card is clicked', async () => {
    const user = userEvent.setup();
    render(<ElevageDetail elevageId={1} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Belle')).toBeInTheDocument();
    });

    const animalCard = screen.getByText('Belle').closest('div');
    if (animalCard) {
      await user.click(animalCard);
      expect(screen.getByText(/Détails de l'animal/i)).toBeInTheDocument();
    }
  });

  it('filters animals by search term', async () => {
    const user = userEvent.setup();
    render(<ElevageDetail elevageId={1} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Belle')).toBeInTheDocument();
      expect(screen.getByText('Rex')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Rechercher/i);
    await user.type(searchInput, 'Belle');

    expect(screen.getByText('Belle')).toBeInTheDocument();
    expect(screen.queryByText('Rex')).not.toBeInTheDocument();
  });

  it('refreshes data when refresh button is clicked', async () => {
    const user = userEvent.setup();
    render(<ElevageDetail elevageId={1} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Ferme Test')).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText(/Actualiser/i);
    await user.click(refreshButton);

    expect(global.fetch).toHaveBeenCalledTimes(8); // Initial + refresh calls
  });
});