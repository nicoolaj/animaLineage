import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import TypeAnimalForm from '../TypeAnimalForm';

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
  onSave: vi.fn()
};

const mockTypeAnimal = {
  id: 1,
  nom: 'Bovin',
  description: 'Type bovin'
};

describe('TypeAnimalForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Success' })
    });
  });

  it('renders form fields correctly for new type', () => {
    render(<TypeAnimalForm {...mockProps} />);

    expect(screen.getByText('Ajouter un Type d\'Animal')).toBeInTheDocument();
    expect(screen.getByLabelText('Nom du type')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByText('Ajouter')).toBeInTheDocument();
    expect(screen.getByText('Annuler')).toBeInTheDocument();
  });

  it('renders form fields correctly for editing type', () => {
    render(<TypeAnimalForm {...mockProps} typeAnimal={mockTypeAnimal} />);

    expect(screen.getByText('Modifier le Type d\'Animal')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bovin')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Type bovin')).toBeInTheDocument();
    expect(screen.getByText('Modifier')).toBeInTheDocument();
  });

  it('handles input changes correctly', () => {
    render(<TypeAnimalForm {...mockProps} />);

    const nameInput = screen.getByLabelText('Nom du type');
    const descriptionInput = screen.getByLabelText('Description');

    fireEvent.change(nameInput, { target: { value: 'Nouveau Type' } });
    fireEvent.change(descriptionInput, { target: { value: 'Nouvelle Description' } });

    expect(nameInput).toHaveValue('Nouveau Type');
    expect(descriptionInput).toHaveValue('Nouvelle Description');
  });

  it('shows validation error for empty name', async () => {
    render(<TypeAnimalForm {...mockProps} />);

    const submitButton = screen.getByText('Ajouter');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Le nom est requis')).toBeInTheDocument();
    });
  });

  it('submits form with correct data for new type', async () => {
    render(<TypeAnimalForm {...mockProps} />);

    const nameInput = screen.getByLabelText('Nom du type');
    const descriptionInput = screen.getByLabelText('Description');

    fireEvent.change(nameInput, { target: { value: 'Caprin' } });
    fireEvent.change(descriptionInput, { target: { value: 'Type caprin' } });

    const submitButton = screen.getByText('Ajouter');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/types-animaux'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          }),
          body: JSON.stringify({
            nom: 'Caprin',
            description: 'Type caprin'
          })
        })
      );
    });
  });

  it('submits form with correct data for editing type', async () => {
    render(<TypeAnimalForm {...mockProps} typeAnimal={mockTypeAnimal} />);

    const nameInput = screen.getByDisplayValue('Bovin');
    fireEvent.change(nameInput, { target: { value: 'Bovin Modifié' } });

    const submitButton = screen.getByText('Modifier');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/types-animaux/1'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          }),
          body: JSON.stringify({
            nom: 'Bovin Modifié',
            description: 'Type bovin'
          })
        })
      );
    });
  });

  it('calls onSave and onClose after successful submission', async () => {
    render(<TypeAnimalForm {...mockProps} />);

    const nameInput = screen.getByLabelText('Nom du type');
    fireEvent.change(nameInput, { target: { value: 'Nouveau Type' } });

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

    render(<TypeAnimalForm {...mockProps} />);

    const nameInput = screen.getByLabelText('Nom du type');
    fireEvent.change(nameInput, { target: { value: 'Nouveau Type' } });

    const submitButton = screen.getByText('Ajouter');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Erreur lors de la sauvegarde')).toBeInTheDocument();
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<TypeAnimalForm {...mockProps} />);

    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });
});