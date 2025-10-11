import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import TypesAnimauxList from '../TypesAnimauxList';

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

const mockTypesAnimaux = [
  {
    id: 1,
    nom: 'Bovin',
    description: 'Type bovin',
    races: [
      { id: 1, nom: 'Holstein' },
      { id: 2, nom: 'Montbéliarde' }
    ]
  },
  {
    id: 2,
    nom: 'Caprin',
    description: 'Type caprin',
    races: [
      { id: 3, nom: 'Alpine' }
    ]
  }
];

describe('TypesAnimauxList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTypesAnimaux)
    });
  });

  it('renders the component title', async () => {
    render(<TypesAnimauxList />);

    expect(screen.getByText('Types d\'Animaux et Races')).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    render(<TypesAnimauxList />);

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('displays types and races after loading', async () => {
    render(<TypesAnimauxList />);

    await waitFor(() => {
      expect(screen.getByText('Bovin')).toBeInTheDocument();
      expect(screen.getByText('Caprin')).toBeInTheDocument();
      expect(screen.getByText('Holstein')).toBeInTheDocument();
      expect(screen.getByText('Montbéliarde')).toBeInTheDocument();
      expect(screen.getByText('Alpine')).toBeInTheDocument();
    });
  });

  it('shows add new type button', async () => {
    render(<TypesAnimauxList />);

    await waitFor(() => {
      expect(screen.getByText('+ Nouveau Type')).toBeInTheDocument();
    });
  });

  it('shows add race buttons for each type', async () => {
    render(<TypesAnimauxList />);

    await waitFor(() => {
      const addRaceButtons = screen.getAllByText('+ Ajouter Race');
      expect(addRaceButtons).toHaveLength(2);
    });
  });

  it('shows edit and delete buttons for types', async () => {
    render(<TypesAnimauxList />);

    await waitFor(() => {
      expect(screen.getAllByText('✏️')).toHaveLength(2); // Edit buttons for types
      expect(screen.getAllByText('🗑️')).toHaveLength(5); // Delete buttons for types + races
    });
  });

  it('opens new type form when add button is clicked', async () => {
    render(<TypesAnimauxList />);

    await waitFor(() => {
      const addButton = screen.getByText('+ Nouveau Type');
      fireEvent.click(addButton);
    });

    expect(screen.getByText('Ajouter un Type d\'Animal')).toBeInTheDocument();
  });

  it('opens edit type form when edit button is clicked', async () => {
    render(<TypesAnimauxList />);

    await waitFor(() => {
      const editButtons = screen.getAllByText('✏️');
      fireEvent.click(editButtons[0]);
    });

    expect(screen.getByText('Modifier le Type d\'Animal')).toBeInTheDocument();
  });

  it('opens add race form when add race button is clicked', async () => {
    render(<TypesAnimauxList />);

    await waitFor(() => {
      const addRaceButtons = screen.getAllByText('+ Ajouter Race');
      fireEvent.click(addRaceButtons[0]);
    });

    expect(screen.getByText('Ajouter une Race')).toBeInTheDocument();
  });

  it('handles delete type confirmation', async () => {
    window.confirm = vi.fn(() => true);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Deleted' })
    });

    render(<TypesAnimauxList />);

    await waitFor(() => {
      const deleteButtons = screen.getAllByText('🗑️');
      fireEvent.click(deleteButtons[0]);
    });

    expect(window.confirm).toHaveBeenCalledWith(
      'Êtes-vous sûr de vouloir supprimer ce type d\'animal ? Cela supprimera aussi toutes ses races.'
    );
  });

  it('handles delete race confirmation', async () => {
    window.confirm = vi.fn(() => true);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Deleted' })
    });

    render(<TypesAnimauxList />);

    await waitFor(() => {
      const deleteButtons = screen.getAllByText('🗑️');
      fireEvent.click(deleteButtons[2]); // Third delete button should be for a race
    });

    expect(window.confirm).toHaveBeenCalledWith(
      'Êtes-vous sûr de vouloir supprimer cette race ?'
    );
  });

  it('shows error message when API call fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'));

    render(<TypesAnimauxList />);

    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement des données')).toBeInTheDocument();
    });
  });

  it('closes forms when onClose is called', async () => {
    render(<TypesAnimauxList />);

    await waitFor(() => {
      const addButton = screen.getByText('+ Nouveau Type');
      fireEvent.click(addButton);
    });

    expect(screen.getByText('Ajouter un Type d\'Animal')).toBeInTheDocument();

    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);

    expect(screen.queryByText('Ajouter un Type d\'Animal')).not.toBeInTheDocument();
  });

  it('refreshes data after form submission', async () => {
    render(<TypesAnimauxList />);

    await waitFor(() => {
      const addButton = screen.getByText('+ Nouveau Type');
      fireEvent.click(addButton);
    });

    const nameInput = screen.getByLabelText('Nom du type');
    fireEvent.change(nameInput, { target: { value: 'Nouveau Type' } });

    const submitButton = screen.getByText('Ajouter');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/types-animaux'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });
});