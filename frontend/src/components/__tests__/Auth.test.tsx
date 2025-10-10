import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import Auth from '../Auth';
import { AuthContext } from '../../contexts/AuthContext';
import { LanguageContext } from '../../contexts/LanguageContext';

// Mock the contexts
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockT = vi.fn((key: string) => key);

const mockAuthContext = {
  user: null,
  login: mockLogin,
  register: mockRegister,
  logout: vi.fn(),
  getAuthHeaders: vi.fn(),
  isAuthenticated: false,
  loading: false
};

const mockLanguageContext = {
  language: 'fr',
  setLanguage: vi.fn(),
  t: mockT,
  availableLanguages: [{ code: 'fr', name: 'Français' }]
};

const renderWithProviders = (ui: React.ReactElement, { onBackToLanding }: { onBackToLanding?: () => void } = {}) => {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <LanguageContext.Provider value={mockLanguageContext}>
        {React.cloneElement(ui, { onBackToLanding })}
      </LanguageContext.Provider>
    </AuthContext.Provider>
  );
};

describe('Auth Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders login form by default', () => {
    renderWithProviders(<Auth />);

    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Mot de passe (min. 6 caractères)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
  });

  test('switches to registration form', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Auth />);

    await user.click(screen.getByText(/créer un compte/i));

    expect(screen.getByPlaceholderText('Nom complet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /s'enregistrer/i })).toBeInTheDocument();
  });

  test('shows back to landing button when provided', () => {
    const mockOnBackToLanding = vi.fn();
    renderWithProviders(<Auth />, { onBackToLanding: mockOnBackToLanding });

    const backButton = screen.getByText('← Retour à l\'accueil');
    expect(backButton).toBeInTheDocument();

    fireEvent.click(backButton);
    expect(mockOnBackToLanding).toHaveBeenCalled();
  });

  test('handles login form submission', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(true);

    renderWithProviders(<Auth />);

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Mot de passe (min. 6 caractères)'), 'password123');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  test('handles registration form submission', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue(true);

    renderWithProviders(<Auth />);

    // Switch to registration
    await user.click(screen.getByText(/créer un compte/i));

    await user.type(screen.getByPlaceholderText('Nom complet'), 'Test User');
    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Mot de passe (min. 6 caractères)'), 'password123');
    await user.click(screen.getByRole('button', { name: /s'enregistrer/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('Test User', 'test@example.com', 'password123');
    });
  });

  test('shows error message on login failure', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(false);

    renderWithProviders(<Auth />);

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Mot de passe (min. 6 caractères)'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(screen.getByText('Email ou mot de passe incorrect')).toBeInTheDocument();
    });
  });

  test('validates required name field in registration', async () => {
    const user = userEvent.setup();

    renderWithProviders(<Auth />);

    // Switch to registration
    await user.click(screen.getByText(/créer un compte/i));

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Mot de passe (min. 6 caractères)'), 'password123');
    await user.click(screen.getByRole('button', { name: /s'enregistrer/i }));

    await waitFor(() => {
      expect(screen.getByText('Le nom est requis')).toBeInTheDocument();
    });

    expect(mockRegister).not.toHaveBeenCalled();
  });

  test('shows loading state during form submission', async () => {
    const user = userEvent.setup();
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));

    renderWithProviders(<Auth />);

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Mot de passe (min. 6 caractères)'), 'password123');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(screen.getByText('⏳ Chargement...')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    }, { timeout: 200 });
  });

  test('disables toggle button during loading', async () => {
    const user = userEvent.setup();
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));

    renderWithProviders(<Auth />);

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Mot de passe (min. 6 caractères)'), 'password123');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    const toggleButton = screen.getByText(/créer un compte/i);
    expect(toggleButton).toBeDisabled();
  });
});