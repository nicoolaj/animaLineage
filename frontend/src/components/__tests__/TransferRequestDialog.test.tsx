import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TransferRequestDialog from '../TransferRequestDialog';

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

const mockProps = {
  isOpen: true,
  onClose: jest.fn(),
  animalId: 1,
  currentElevageId: 1
};

const mockElevages = [
  {
    id: 2,
    nom: 'Élevage Dupont',
    description: 'Élevage de bovins',
    users: [{ id: 3, name: 'Marie Dupont' }]
  },
  {
    id: 3,
    nom: 'Ferme Martin',
    description: 'Élevage mixte',
    users: [{ id: 4, name: 'Paul Martin' }]
  }
];

const mockAnimal = {
  id: 1,
  identifiant_officiel: 'TEST001',
  nom: 'Test Animal',
  sexe: 'M',
  race_nom: 'Holstein'
};

describe('TransferRequestDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockElevages)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAnimal)
      });
  });

  it('renders dialog when open', async () => {
    render(<TransferRequestDialog {...mockProps} />);

    expect(screen.getByText('Demande de Transfert')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<TransferRequestDialog {...mockProps} isOpen={false} />);

    expect(screen.queryByText('Demande de Transfert')).not.toBeInTheDocument();
  });

  it('displays animal information', async () => {
    render(<TransferRequestDialog {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('TEST001')).toBeInTheDocument();
      expect(screen.getByText('Test Animal')).toBeInTheDocument();
      expect(screen.getByText('Holstein')).toBeInTheDocument();
    });
  });

  it('displays available elevages', async () => {
    render(<TransferRequestDialog {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Élevage Dupont')).toBeInTheDocument();
      expect(screen.getByText('Ferme Martin')).toBeInTheDocument();
    });
  });

  it('handles elevage selection', async () => {
    render(<TransferRequestDialog {...mockProps} />);

    await waitFor(() => {
      const elevageOption = screen.getByText('Élevage Dupont');
      fireEvent.click(elevageOption);
    });

    expect(screen.getByText('Élevage sélectionné')).toBeInTheDocument();
  });

  it('requires reason for transfer', async () => {
    render(<TransferRequestDialog {...mockProps} />);

    await waitFor(() => {
      const submitButton = screen.getByText('Envoyer la demande');
      fireEvent.click(submitButton);
    });

    expect(screen.getByText('Veuillez sélectionner un élevage et saisir une raison')).toBeInTheDocument();
  });

  it('submits transfer request with valid data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Transfer request sent' })
    });

    render(<TransferRequestDialog {...mockProps} />);

    await waitFor(() => {
      // Select elevage
      const elevageOption = screen.getByText('Élevage Dupont');
      fireEvent.click(elevageOption);

      // Enter reason
      const reasonInput = screen.getByLabelText('Raison du transfert');
      fireEvent.change(reasonInput, { target: { value: 'Raison du transfert' } });

      // Submit
      const submitButton = screen.getByText('Envoyer la demande');
      fireEvent.click(submitButton);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/transfer-requests'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        }),
        body: JSON.stringify({
          animal_id: 1,
          from_elevage_id: 1,
          to_elevage_id: 2,
          reason: 'Raison du transfert'
        })
      })
    );
  });

  it('shows loading state during submission', async () => {
    mockFetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<TransferRequestDialog {...mockProps} />);

    await waitFor(() => {
      // Select elevage and enter reason
      const elevageOption = screen.getByText('Élevage Dupont');
      fireEvent.click(elevageOption);

      const reasonInput = screen.getByLabelText('Raison du transfert');
      fireEvent.change(reasonInput, { target: { value: 'Test reason' } });

      const submitButton = screen.getByText('Envoyer la demande');
      fireEvent.click(submitButton);
    });

    expect(screen.getByText('Envoi en cours...')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'));

    render(<TransferRequestDialog {...mockProps} />);

    await waitFor(() => {
      // Select elevage and enter reason
      const elevageOption = screen.getByText('Élevage Dupont');
      fireEvent.click(elevageOption);

      const reasonInput = screen.getByLabelText('Raison du transfert');
      fireEvent.change(reasonInput, { target: { value: 'Test reason' } });

      const submitButton = screen.getByText('Envoyer la demande');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Erreur lors de l\'envoi de la demande')).toBeInTheDocument();
    });
  });

  it('calls onClose when cancel button is clicked', async () => {
    render(<TransferRequestDialog {...mockProps} />);

    await waitFor(() => {
      const cancelButton = screen.getByText('Annuler');
      fireEvent.click(cancelButton);
    });

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when dialog backdrop is clicked', async () => {
    render(<TransferRequestDialog {...mockProps} />);

    await waitFor(() => {
      const backdrop = screen.getByTestId('dialog-backdrop');
      fireEvent.click(backdrop);
    });

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('displays elevage descriptions', async () => {
    render(<TransferRequestDialog {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Élevage de bovins')).toBeInTheDocument();
      expect(screen.getByText('Élevage mixte')).toBeInTheDocument();
    });
  });

  it('shows owner information for each elevage', async () => {
    render(<TransferRequestDialog {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Marie Dupont')).toBeInTheDocument();
      expect(screen.getByText('Paul Martin')).toBeInTheDocument();
    });
  });

  it('filters out current elevage from options', async () => {
    const elevagesWithCurrent = [...mockElevages, {
      id: 1,
      nom: 'Current Elevage',
      description: 'Current elevage',
      users: []
    }];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(elevagesWithCurrent)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAnimal)
      });

    render(<TransferRequestDialog {...mockProps} />);

    await waitFor(() => {
      expect(screen.queryByText('Current Elevage')).not.toBeInTheDocument();
      expect(screen.getByText('Élevage Dupont')).toBeInTheDocument();
    });
  });

  it('validates reason length', async () => {
    render(<TransferRequestDialog {...mockProps} />);

    await waitFor(() => {
      const elevageOption = screen.getByText('Élevage Dupont');
      fireEvent.click(elevageOption);

      const reasonInput = screen.getByLabelText('Raison du transfert');
      fireEvent.change(reasonInput, { target: { value: 'ab' } }); // Too short

      const submitButton = screen.getByText('Envoyer la demande');
      fireEvent.click(submitButton);
    });

    expect(screen.getByText('La raison doit contenir au moins 10 caractères')).toBeInTheDocument();
  });

  it('closes and calls onClose after successful submission', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Success' })
    });

    render(<TransferRequestDialog {...mockProps} />);

    await waitFor(() => {
      // Complete form and submit
      const elevageOption = screen.getByText('Élevage Dupont');
      fireEvent.click(elevageOption);

      const reasonInput = screen.getByLabelText('Raison du transfert');
      fireEvent.change(reasonInput, { target: { value: 'Valid reason for transfer' } });

      const submitButton = screen.getByText('Envoyer la demande');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });
});