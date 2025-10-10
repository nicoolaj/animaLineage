import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../contexts/AuthContext';
import LandingPage from '../LandingPage';

// Mock fetch globally
global.fetch = vi.fn();

const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <AuthProvider>{component}</AuthProvider>
  );
};

describe('LandingPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock authentication
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/auth/me')) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Not authenticated' })
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
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      writable: true
    });
  });

  it('renders main heading', () => {
    renderWithAuth(<LandingPage />);
    expect(screen.getByText(/AnimaLineage/i)).toBeInTheDocument();
  });

  it('renders hero section with main message', () => {
    renderWithAuth(<LandingPage />);
    expect(screen.getByText(/Gérez votre élevage avec précision/i)).toBeInTheDocument();
  });

  it('displays login button', () => {
    renderWithAuth(<LandingPage />);
    expect(screen.getByText(/Se connecter/i)).toBeInTheDocument();
  });

  it('displays register button', () => {
    renderWithAuth(<LandingPage />);
    expect(screen.getByText(/S'inscrire/i)).toBeInTheDocument();
  });

  it('shows features section', () => {
    renderWithAuth(<LandingPage />);
    expect(screen.getByText(/Fonctionnalités principales/i)).toBeInTheDocument();
  });

  it('displays genealogy feature', () => {
    renderWithAuth(<LandingPage />);
    expect(screen.getByText(/Arbre généalogique/i)).toBeInTheDocument();
    expect(screen.getByText(/Visualisez les relations familiales/i)).toBeInTheDocument();
  });

  it('displays animal management feature', () => {
    renderWithAuth(<LandingPage />);
    expect(screen.getByText(/Gestion des animaux/i)).toBeInTheDocument();
    expect(screen.getByText(/Suivez tous vos animaux/i)).toBeInTheDocument();
  });

  it('displays statistics feature', () => {
    renderWithAuth(<LandingPage />);
    expect(screen.getByText(/Statistiques/i)).toBeInTheDocument();
    expect(screen.getByText(/Analysez les performances/i)).toBeInTheDocument();
  });

  it('opens login form when login button is clicked', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LandingPage />);

    const loginButton = screen.getByText(/Se connecter/i);
    await user.click(loginButton);

    expect(screen.getByText(/Connexion/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mot de passe/i)).toBeInTheDocument();
  });

  it('opens registration form when register button is clicked', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LandingPage />);

    const registerButton = screen.getByText(/S'inscrire/i);
    await user.click(registerButton);

    expect(screen.getByText(/Inscription/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mot de passe/i)).toBeInTheDocument();
  });

  it('displays application logo', () => {
    renderWithAuth(<LandingPage />);
    const logo = screen.getByAltText(/AnimaLineage/i);
    expect(logo).toBeInTheDocument();
  });

  it('renders responsive layout', () => {
    renderWithAuth(<LandingPage />);
    const container = screen.getByRole('main');
    expect(container).toHaveClass('min-h-screen');
  });

  it('shows benefits section', () => {
    renderWithAuth(<LandingPage />);
    expect(screen.getByText(/Pourquoi choisir AnimaLineage/i)).toBeInTheDocument();
  });

  it('displays security benefit', () => {
    renderWithAuth(<LandingPage />);
    expect(screen.getByText(/Sécurisé/i)).toBeInTheDocument();
    expect(screen.getByText(/Vos données sont protégées/i)).toBeInTheDocument();
  });

  it('displays ease of use benefit', () => {
    renderWithAuth(<LandingPage />);
    expect(screen.getByText(/Facile à utiliser/i)).toBeInTheDocument();
    expect(screen.getByText(/Interface intuitive/i)).toBeInTheDocument();
  });

  it('displays multi-species support benefit', () => {
    renderWithAuth(<LandingPage />);
    expect(screen.getByText(/Multi-espèces/i)).toBeInTheDocument();
    expect(screen.getByText(/Gérez différents types d'animaux/i)).toBeInTheDocument();
  });

  it('shows footer with links', () => {
    renderWithAuth(<LandingPage />);
    expect(screen.getByText(/Mentions légales/i)).toBeInTheDocument();
    expect(screen.getByText(/Politique de confidentialité/i)).toBeInTheDocument();
  });

  it('closes auth modal when cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LandingPage />);

    // Open login form
    const loginButton = screen.getByText(/Se connecter/i);
    await user.click(loginButton);

    expect(screen.getByText(/Connexion/i)).toBeInTheDocument();

    // Close modal
    const cancelButton = screen.getByText(/Retour à l'accueil/i);
    await user.click(cancelButton);

    expect(screen.queryByText(/Connexion/i)).not.toBeInTheDocument();
  });

  it('displays call-to-action section', () => {
    renderWithAuth(<LandingPage />);
    expect(screen.getByText(/Commencez dès aujourd'hui/i)).toBeInTheDocument();
    expect(screen.getByText(/Créez votre compte gratuitement/i)).toBeInTheDocument();
  });

  it('shows testimonials section', () => {
    renderWithAuth(<LandingPage />);
    expect(screen.getByText(/Ce que disent nos utilisateurs/i)).toBeInTheDocument();
  });

  it('displays feature icons', () => {
    renderWithAuth(<LandingPage />);
    expect(screen.getByText('🌳')).toBeInTheDocument(); // Genealogy icon
    expect(screen.getByText('🐄')).toBeInTheDocument(); // Animal icon
    expect(screen.getByText('📊')).toBeInTheDocument(); // Statistics icon
  });

  it('includes contact information', () => {
    renderWithAuth(<LandingPage />);
    expect(screen.getByText(/Contact/i)).toBeInTheDocument();
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LandingPage />);

    const loginButton = screen.getByText(/Se connecter/i);

    // Test tab navigation
    await user.tab();
    expect(loginButton).toHaveFocus();

    // Test enter key
    await user.keyboard('{Enter}');
    expect(screen.getByText(/Connexion/i)).toBeInTheDocument();
  });
});