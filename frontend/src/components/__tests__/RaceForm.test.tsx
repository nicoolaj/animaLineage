import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import RaceForm from '../RaceForm';

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
  onClose: vi.fn(),
  onSave: vi.fn(),
  typeAnimalId: 1
};

const mockRace = {
  id: 1,
  nom: 'Test Race',
  description: 'Test Description',
  type_animal_id: 1
};

describe('RaceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Success' })
    });
  });

  it('renders form fields correctly for new race', () => {
    render(<RaceForm {...mockProps} />);

    expect(screen.getByText('Ajouter une Race')).toBeInTheDocument();
    expect(screen.getByLabelText('Nom de la race')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByText('Ajouter')).toBeInTheDocument();
    expect(screen.getByText('Annuler')).toBeInTheDocument();
  });

  it('renders form fields correctly for editing race', () => {
    render(<RaceForm {...mockProps} race={mockRace} />);

    expect(screen.getByText('Modifier la Race')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Race')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Modifier')).toBeInTheDocument();
  });

  it('handles input changes correctly', () => {
    render(<RaceForm {...mockProps} />);

    const nameInput = screen.getByLabelText('Nom de la race');
    const descriptionInput = screen.getByLabelText('Description');

    fireEvent.change(nameInput, { target: { value: 'New Race Name' } });
    fireEvent.change(descriptionInput, { target: { value: 'New Description' } });

    expect(nameInput).toHaveValue('New Race Name');
    expect(descriptionInput).toHaveValue('New Description');
  });

  it('shows validation error for empty name', async () => {
    render(<RaceForm {...mockProps} />);

    const submitButton = screen.getByText('Ajouter');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Le nom est requis')).toBeInTheDocument();
    });
  });

  it('submits form with correct data for new race', async () => {
    render(<RaceForm {...mockProps} />);

    const nameInput = screen.getByLabelText('Nom de la race');
    const descriptionInput = screen.getByLabelText('Description');

    fireEvent.change(nameInput, { target: { value: 'New Race' } });
    fireEvent.change(descriptionInput, { target: { value: 'New Description' } });

    const submitButton = screen.getByText('Ajouter');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/races'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          }),
          body: JSON.stringify({
            nom: 'New Race',
            description: 'New Description',
            type_animal_id: 1
          })
        })
      );
    });
  });

  it('submits form with correct data for editing race', async () => {
    render(<RaceForm {...mockProps} race={mockRace} />);

    const nameInput = screen.getByDisplayValue('Test Race');
    fireEvent.change(nameInput, { target: { value: 'Updated Race' } });

    const submitButton = screen.getByText('Modifier');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/races/1'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          }),
          body: JSON.stringify({
            nom: 'Updated Race',
            description: 'Test Description',
            type_animal_id: 1
          })
        })
      );
    });
  });

  it('calls onSave and onClose after successful submission', async () => {
    render(<RaceForm {...mockProps} />);

    const nameInput = screen.getByLabelText('Nom de la race');
    fireEvent.change(nameInput, { target: { value: 'New Race' } });

    const submitButton = screen.getByText('Ajouter');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockProps.onSave).toHaveBeenCalled();
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  it('handles API error correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'API Error' })
    });

    render(<RaceForm {...mockProps} />);

    const nameInput = screen.getByLabelText('Nom de la race');
    fireEvent.change(nameInput, { target: { value: 'New Race' } });

    const submitButton = screen.getByText('Ajouter');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Erreur lors de la sauvegarde')).toBeInTheDocument();
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<RaceForm {...mockProps} />);

    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    mockFetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<RaceForm {...mockProps} />);

    const nameInput = screen.getByLabelText('Nom de la race');
    fireEvent.change(nameInput, { target: { value: 'New Race' } });

    const submitButton = screen.getByText('Ajouter');
    fireEvent.click(submitButton);

    // Should show loading state
    expect(submitButton).toBeDisabled();
  });
});