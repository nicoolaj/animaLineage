import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import RacesList from '../RacesList';

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

const mockRaces = [
  {
    id: 1,
    nom: 'Holstein',
    description: 'Race Holstein',
    type_animal_id: 1,
    type_animal_nom: 'Bovin'
  },
  {
    id: 2,
    nom: 'Montbéliarde',
    description: 'Race Montbéliarde',
    type_animal_id: 1,
    type_animal_nom: 'Bovin'
  },
  {
    id: 3,
    nom: 'Alpine',
    description: 'Race Alpine',
    type_animal_id: 2,
    type_animal_nom: 'Caprin'
  }
];

const mockTypesAnimaux = [
  { id: 1, nom: 'Bovin' },
  { id: 2, nom: 'Caprin' }
];

const mockProps = {
  typeAnimalId: 1
};

describe('RacesList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRaces)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTypesAnimaux)
      });
  });

  it('renders the component title', async () => {
    render(<RacesList {...mockProps} />);

    expect(screen.getByText('Races')).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    render(<RacesList {...mockProps} />);

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('displays races after loading', async () => {
    render(<RacesList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Holstein')).toBeInTheDocument();
      expect(screen.getByText('Montbéliarde')).toBeInTheDocument();
      expect(screen.queryByText('Alpine')).not.toBeInTheDocument(); // Should be filtered by typeAnimalId
    });
  });

  it('shows add new race button', async () => {
    render(<RacesList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('+ Nouvelle Race')).toBeInTheDocument();
    });
  });

  it('shows edit and delete buttons for races', async () => {
    render(<RacesList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getAllByText('✏️')).toHaveLength(2); // Edit buttons
      expect(screen.getAllByText('🗑️')).toHaveLength(2); // Delete buttons
    });
  });

  it('filters races by type when typeAnimalId is provided', async () => {
    render(<RacesList typeAnimalId={2} />);

    await waitFor(() => {
      expect(screen.queryByText('Holstein')).not.toBeInTheDocument();
      expect(screen.queryByText('Montbéliarde')).not.toBeInTheDocument();
      expect(screen.getByText('Alpine')).toBeInTheDocument();
    });
  });

  it('shows all races when no typeAnimalId is provided', async () => {
    render(<RacesList />);

    await waitFor(() => {
      expect(screen.getByText('Holstein')).toBeInTheDocument();
      expect(screen.getByText('Montbéliarde')).toBeInTheDocument();
      expect(screen.getByText('Alpine')).toBeInTheDocument();
    });
  });

  it('opens new race form when add button is clicked', async () => {
    render(<RacesList {...mockProps} />);

    await waitFor(() => {
      const addButton = screen.getByText('+ Nouvelle Race');
      fireEvent.click(addButton);
    });

    expect(screen.getByText('Ajouter une Race')).toBeInTheDocument();
  });

  it('opens edit race form when edit button is clicked', async () => {
    render(<RacesList {...mockProps} />);

    await waitFor(() => {
      const editButtons = screen.getAllByText('✏️');
      fireEvent.click(editButtons[0]);
    });

    expect(screen.getByText('Modifier la Race')).toBeInTheDocument();
  });

  it('handles delete confirmation', async () => {
    window.confirm = vi.fn(() => true);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Deleted' })
    });

    render(<RacesList {...mockProps} />);

    await waitFor(() => {
      const deleteButtons = screen.getAllByText('🗑️');
      fireEvent.click(deleteButtons[0]);
    });

    expect(window.confirm).toHaveBeenCalledWith(
      'Êtes-vous sûr de vouloir supprimer cette race ?'
    );
  });

  it('shows error message when API call fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'));

    render(<RacesList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement des races')).toBeInTheDocument();
    });
  });

  it('displays race descriptions', async () => {
    render(<RacesList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Race Holstein')).toBeInTheDocument();
      expect(screen.getByText('Race Montbéliarde')).toBeInTheDocument();
    });
  });

  it('displays type information for each race', async () => {
    render(<RacesList />);

    await waitFor(() => {
      expect(screen.getAllByText('Bovin')).toHaveLength(2);
      expect(screen.getByText('Caprin')).toBeInTheDocument();
    });
  });

  it('closes forms when onClose is called', async () => {
    render(<RacesList {...mockProps} />);

    await waitFor(() => {
      const addButton = screen.getByText('+ Nouvelle Race');
      fireEvent.click(addButton);
    });

    expect(screen.getByText('Ajouter une Race')).toBeInTheDocument();

    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);

    expect(screen.queryByText('Ajouter une Race')).not.toBeInTheDocument();
  });

  it('refreshes data after form submission', async () => {
    render(<RacesList {...mockProps} />);

    await waitFor(() => {
      const addButton = screen.getByText('+ Nouvelle Race');
      fireEvent.click(addButton);
    });

    const nameInput = screen.getByLabelText('Nom de la race');
    fireEvent.change(nameInput, { target: { value: 'Nouvelle Race' } });

    const submitButton = screen.getByText('Ajouter');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/races'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });
});