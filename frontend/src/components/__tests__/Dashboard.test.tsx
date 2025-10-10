import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, clearAllMocks, setupFetchMock, mockAuthenticatedUser } from '../../test-utils';
import Dashboard from '../Dashboard';

const mockElevages = [
  {
    id: 1,
    nom: 'Ferme Test',
    description: 'Une ferme de test',
    animaux_count: 25
  }
];

const mockAnimaux = [
  {
    id: 1,
    identifiant_officiel: 'FR001',
    nom: 'Belle',
    sexe: 'F',
    race_nom: 'Holstein'
  }
];

describe('Dashboard Component', () => {
  beforeEach(() => {
    clearAllMocks();
    setupFetchMock({
      '/elevages?my=true': mockElevages,
      '/animaux': mockAnimaux
    });
  });

  it('renders dashboard title', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Tableau de bord/i)).toBeInTheDocument();
    });
  });

  it('displays user welcome message', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Bonjour, Test User/i)).toBeInTheDocument();
    });
  });

  it('shows elevages section', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Mes élevages/i)).toBeInTheDocument();
    });
  });

  it('displays list of elevages', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Ferme Test')).toBeInTheDocument();
      expect(screen.getByText('25 animaux')).toBeInTheDocument();
    });
  });

  it('shows animals section', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Mes animaux/i)).toBeInTheDocument();
    });
  });

  it('displays recent animals', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Belle')).toBeInTheDocument();
      expect(screen.getByText('FR001')).toBeInTheDocument();
    });
  });

  it('shows quick actions', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Actions rapides/i)).toBeInTheDocument();
      expect(screen.getByText(/Ajouter un animal/i)).toBeInTheDocument();
      expect(screen.getByText(/Nouvel élevage/i)).toBeInTheDocument();
    });
  });

  it('opens animal form when add animal is clicked', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Ajouter un animal/i)).toBeInTheDocument();
    });

    const addAnimalButton = screen.getByText(/Ajouter un animal/i);
    await user.click(addAnimalButton);

    expect(screen.getByText(/Nouvel Animal/i)).toBeInTheDocument();
  });

  it('opens elevage form when new elevage is clicked', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Nouvel élevage/i)).toBeInTheDocument();
    });

    const newElevageButton = screen.getByText(/Nouvel élevage/i);
    await user.click(newElevageButton);

    expect(screen.getByText(/Nouvel Élevage/i)).toBeInTheDocument();
  });

  it('displays statistics cards', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Statistiques/i)).toBeInTheDocument();
    });
  });

  it('shows total animals count', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Total animaux/i)).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('displays total elevages count', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Total élevages/i)).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('handles empty elevages list', async () => {
    setupFetchMock({
      '/elevages?my=true': [],
      '/animaux': mockAnimaux
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Aucun élevage trouvé/i)).toBeInTheDocument();
    });
  });

  it('handles empty animals list', async () => {
    setupFetchMock({
      '/elevages?my=true': mockElevages,
      '/animaux': []
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Aucun animal trouvé/i)).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<Dashboard />);
    expect(screen.getByText(/Chargement/i)).toBeInTheDocument();
  });

  it('handles error state', async () => {
    setupFetchMock({
      '/elevages?my=true': null,
      '/animaux': null
    });

    (global.fetch as any).mockImplementation(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Server error' })
      })
    );

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Erreur lors du chargement/i)).toBeInTheDocument();
    });
  });
});