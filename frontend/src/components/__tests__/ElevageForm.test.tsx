import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../contexts/AuthContext';
import ElevageForm from '../ElevageForm';

// Mock fetch globally
global.fetch = vi.fn();

const mockUser = {
  id: 1,
  nom: 'Test User',
  email: 'test@example.com',
  role: 2
};

const mockElevage = {
  id: 1,
  nom: 'Ferme Test',
  description: 'Une ferme de test',
  adresse: '123 Rue Test',
  code_postal: '12345',
  ville: 'Test City',
  telephone: '0123456789',
  email: 'ferme@test.com'
};

const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <AuthProvider>{component}</AuthProvider>
  );
};

describe('ElevageForm Component', () => {
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
      if (url.includes('/elevages') && url.includes('POST')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Élevage créé avec succès', elevage: mockElevage })
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

  it('renders form with all required fields', () => {
    renderWithAuth(<ElevageForm onSuccess={() => {}} onCancel={() => {}} />);

    expect(screen.getByLabelText(/Nom de l'élevage/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Adresse/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Code postal/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ville/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Téléphone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
  });

  it('renders create form title by default', () => {
    renderWithAuth(<ElevageForm onSuccess={() => {}} onCancel={() => {}} />);
    expect(screen.getByText(/Nouvel Élevage/i)).toBeInTheDocument();
  });

  it('renders edit form title when editing', () => {
    renderWithAuth(<ElevageForm elevage={mockElevage} onSuccess={() => {}} onCancel={() => {}} />);
    expect(screen.getByText(/Modifier l'élevage/i)).toBeInTheDocument();
  });

  it('populates form fields when editing existing elevage', () => {
    renderWithAuth(<ElevageForm elevage={mockElevage} onSuccess={() => {}} onCancel={() => {}} />);

    expect(screen.getByDisplayValue('Ferme Test')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Une ferme de test')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123 Rue Test')).toBeInTheDocument();
    expect(screen.getByDisplayValue('12345')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test City')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0123456789')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ferme@test.com')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderWithAuth(<ElevageForm onSuccess={() => {}} onCancel={() => {}} />);

    const submitButton = screen.getByText(/Créer l'élevage/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Le nom est requis/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    renderWithAuth(<ElevageForm onSuccess={() => {}} onCancel={() => {}} />);

    const emailInput = screen.getByLabelText(/Email/i);
    await user.type(emailInput, 'invalid-email');

    const submitButton = screen.getByText(/Créer l'élevage/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Format d'email invalide/i)).toBeInTheDocument();
    });
  });

  it('validates phone number format', async () => {
    const user = userEvent.setup();
    renderWithAuth(<ElevageForm onSuccess={() => {}} onCancel={() => {}} />);

    const phoneInput = screen.getByLabelText(/Téléphone/i);
    await user.type(phoneInput, 'invalid-phone');

    const submitButton = screen.getByText(/Créer l'élevage/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Format de téléphone invalide/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const mockOnSuccess = vi.fn();
    const user = userEvent.setup();

    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: mockUser })
        });
      }
      if (url.includes('/elevages') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Élevage créé avec succès', elevage: mockElevage })
        });
      }
      return Promise.resolve({ ok: false });
    });

    renderWithAuth(<ElevageForm onSuccess={mockOnSuccess} onCancel={() => {}} />);

    await user.type(screen.getByLabelText(/Nom de l'élevage/i), 'Nouvelle Ferme');
    await user.type(screen.getByLabelText(/Description/i), 'Description test');
    await user.type(screen.getByLabelText(/Adresse/i), '456 Rue Nouvelle');
    await user.type(screen.getByLabelText(/Code postal/i), '54321');
    await user.type(screen.getByLabelText(/Ville/i), 'Nouvelle Ville');
    await user.type(screen.getByLabelText(/Téléphone/i), '0987654321');
    await user.type(screen.getByLabelText(/Email/i), 'nouvelle@ferme.com');

    const submitButton = screen.getByText(/Créer l'élevage/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('handles server error during submission', async () => {
    const user = userEvent.setup();

    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: mockUser })
        });
      }
      if (url.includes('/elevages') && options?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Erreur serveur' })
        });
      }
      return Promise.resolve({ ok: false });
    });

    renderWithAuth(<ElevageForm onSuccess={() => {}} onCancel={() => {}} />);

    await user.type(screen.getByLabelText(/Nom de l'élevage/i), 'Nouvelle Ferme');
    await user.type(screen.getByLabelText(/Email/i), 'nouvelle@ferme.com');

    const submitButton = screen.getByText(/Créer l'élevage/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Erreur serveur/i)).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const mockOnCancel = vi.fn();
    const user = userEvent.setup();

    renderWithAuth(<ElevageForm onSuccess={() => {}} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByText(/Annuler/i);
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();

    // Mock slow API response
    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: mockUser })
        });
      }
      if (url.includes('/elevages') && options?.method === 'POST') {
        return new Promise(resolve =>
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Succès', elevage: mockElevage })
          }), 100)
        );
      }
      return Promise.resolve({ ok: false });
    });

    renderWithAuth(<ElevageForm onSuccess={() => {}} onCancel={() => {}} />);

    await user.type(screen.getByLabelText(/Nom de l'élevage/i), 'Nouvelle Ferme');
    await user.type(screen.getByLabelText(/Email/i), 'nouvelle@ferme.com');

    const submitButton = screen.getByText(/Créer l'élevage/i);
    await user.click(submitButton);

    expect(screen.getByText(/Création en cours/i)).toBeInTheDocument();
  });

  it('updates existing elevage when in edit mode', async () => {
    const mockOnSuccess = vi.fn();
    const user = userEvent.setup();

    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: mockUser })
        });
      }
      if (url.includes('/elevages/1') && options?.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Élevage modifié avec succès', elevage: mockElevage })
        });
      }
      return Promise.resolve({ ok: false });
    });

    renderWithAuth(<ElevageForm elevage={mockElevage} onSuccess={mockOnSuccess} onCancel={() => {}} />);

    const nameInput = screen.getByDisplayValue('Ferme Test');
    await user.clear(nameInput);
    await user.type(nameInput, 'Ferme Modifiée');

    const submitButton = screen.getByText(/Modifier l'élevage/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
  });
});