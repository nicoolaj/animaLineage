import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import LandingPage from '../LandingPage';

// Mock fetch globally
global.fetch = vi.fn();

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
    render(<LandingPage />);
    expect(screen.getByText(/AnimaLineage/i)).toBeInTheDocument();
  });

  it('renders hero section with main message', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Gérez votre élevage avec précision/i)).toBeInTheDocument();
  });

  it('displays login button', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Se connecter/i)).toBeInTheDocument();
  });

  it('displays register button', () => {
    render(<LandingPage />);
    expect(screen.getByText(/S'inscrire/i)).toBeInTheDocument();
  });

  it('shows features section', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Fonctionnalités principales/i)).toBeInTheDocument();
  });

  it('displays genealogy feature', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Arbre généalogique/i)).toBeInTheDocument();
    expect(screen.getByText(/Visualisez les relations familiales/i)).toBeInTheDocument();
  });

  it('displays animal management feature', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Gestion des animaux/i)).toBeInTheDocument();
    expect(screen.getByText(/Suivez tous vos animaux/i)).toBeInTheDocument();
  });

  it('displays statistics feature', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Statistiques/i)).toBeInTheDocument();
    expect(screen.getByText(/Analysez les performances/i)).toBeInTheDocument();
  });

  it('opens login form when login button is clicked', async () => {
    const user = userEvent.setup();
    render(<LandingPage />);

    const loginButton = screen.getByText(/Se connecter/i);
    await user.click(loginButton);

    expect(screen.getByText(/Connexion/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mot de passe/i)).toBeInTheDocument();
  });

  it('opens registration form when register button is clicked', async () => {
    const user = userEvent.setup();
    render(<LandingPage />);

    const registerButton = screen.getByText(/S'inscrire/i);
    await user.click(registerButton);

    expect(screen.getByText(/Inscription/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mot de passe/i)).toBeInTheDocument();
  });

  it('displays application logo', () => {
    render(<LandingPage />);
    const logo = screen.getByAltText(/AnimaLineage/i);
    expect(logo).toBeInTheDocument();
  });

  it('renders responsive layout', () => {
    render(<LandingPage />);
    const container = screen.getByRole('main');
    expect(container).toHaveClass('min-h-screen');
  });

  it('shows benefits section', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Pourquoi choisir AnimaLineage/i)).toBeInTheDocument();
  });

  it('displays security benefit', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Sécurisé/i)).toBeInTheDocument();
    expect(screen.getByText(/Vos données sont protégées/i)).toBeInTheDocument();
  });

  it('displays ease of use benefit', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Facile à utiliser/i)).toBeInTheDocument();
    expect(screen.getByText(/Interface intuitive/i)).toBeInTheDocument();
  });

  it('displays multi-species support benefit', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Multi-espèces/i)).toBeInTheDocument();
    expect(screen.getByText(/Gérez différents types d'animaux/i)).toBeInTheDocument();
  });

  it('shows footer with links', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Mentions légales/i)).toBeInTheDocument();
    expect(screen.getByText(/Politique de confidentialité/i)).toBeInTheDocument();
  });

  it('closes auth modal when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<LandingPage />);

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
    render(<LandingPage />);
    expect(screen.getByText(/Commencez dès aujourd'hui/i)).toBeInTheDocument();
    expect(screen.getByText(/Créez votre compte gratuitement/i)).toBeInTheDocument();
  });

  it('shows testimonials section', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Ce que disent nos utilisateurs/i)).toBeInTheDocument();
  });

  it('displays feature icons', () => {
    render(<LandingPage />);
    expect(screen.getByText('🌳')).toBeInTheDocument(); // Genealogy icon
    expect(screen.getByText('🦕')).toBeInTheDocument(); // Animal icon
    expect(screen.getByText('📊')).toBeInTheDocument(); // Statistics icon
  });

  it('includes contact information', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Contact/i)).toBeInTheDocument();
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<LandingPage />);

    const loginButton = screen.getByText(/Se connecter/i);

    // Test tab navigation
    await user.tab();
    expect(loginButton).toHaveFocus();

    // Test enter key
    await user.keyboard('{Enter}');
    expect(screen.getByText(/Connexion/i)).toBeInTheDocument();
  });
});