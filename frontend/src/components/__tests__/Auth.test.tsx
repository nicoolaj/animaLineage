import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Auth from '../Auth';

// Mock du contexte d'authentification
const mockLogin = jest.fn();
const mockRegister = jest.fn();

// Mock du useAuth hook
jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
    isLoading: false,
    error: null,
    isAuthenticated: false
  })
}));

describe('Auth Component', () => {
  beforeEach(() => {
    mockLogin.mockClear();
    mockRegister.mockClear();
    mockLogin.mockResolvedValue(false);
    mockRegister.mockResolvedValue(false);
  });

  describe('Rendu du composant', () => {
    test('affiche le formulaire de connexion par défaut', () => {
      render(<Auth />);

      expect(screen.getByRole('heading', { name: /connexion/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/mot de passe/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
    });

    test('permet de basculer vers le formulaire d\'inscription', async () => {
      render(<Auth />);

      const switchButton = screen.getByText(/créer un compte/i);
      await userEvent.click(switchButton);

      expect(screen.getByRole('heading', { name: /créer un compte/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/nom complet/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /s'enregistrer/i })).toBeInTheDocument();
    });
  });

  describe('Soumission du formulaire de connexion', () => {
    test('appelle la fonction login avec des données valides', async () => {
      mockLogin.mockResolvedValue(true);
      render(<Auth />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/mot de passe/i);
      const submitButton = screen.getByRole('button', { name: /se connecter/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    test('affiche une erreur pour des identifiants incorrects', async () => {
      mockLogin.mockResolvedValue(false);
      render(<Auth />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/mot de passe/i);
      const submitButton = screen.getByRole('button', { name: /se connecter/i });

      await userEvent.type(emailInput, 'wrong@example.com');
      await userEvent.type(passwordInput, 'wrongpassword');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email ou mot de passe incorrect/i)).toBeInTheDocument();
      });
    });
  });

  describe('Soumission du formulaire d\'inscription', () => {
    test('appelle la fonction register avec des données valides', async () => {
      mockRegister.mockResolvedValue(true);
      render(<Auth />);

      // Basculer vers l'inscription
      const switchButton = screen.getByText(/créer un compte/i);
      await userEvent.click(switchButton);

      const nameInput = screen.getByPlaceholderText(/nom complet/i);
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/mot de passe/i);
      const submitButton = screen.getByRole('button', { name: /s'enregistrer/i });

      await userEvent.type(nameInput, 'Jean Dupont');
      await userEvent.type(emailInput, 'jean@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith('Jean Dupont', 'jean@example.com', 'password123');
      });
    });

    test('affiche une erreur si le nom est vide', async () => {
      render(<Auth />);

      // Basculer vers l'inscription
      const switchButton = screen.getByText(/créer un compte/i);
      await userEvent.click(switchButton);

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/mot de passe/i);
      const submitButton = screen.getByRole('button', { name: /s'enregistrer/i });

      await userEvent.type(emailInput, 'jean@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/le nom est requis/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation entre les formulaires', () => {
    test('bascule entre connexion et inscription', async () => {
      render(<Auth />);

      // Vérifier l'état initial (connexion)
      expect(screen.getByRole('heading', { name: /connexion/i })).toBeInTheDocument();

      // Basculer vers l'inscription
      await userEvent.click(screen.getByText(/créer un compte/i));
      expect(screen.getByRole('heading', { name: /créer un compte/i })).toBeInTheDocument();

      // Retour à la connexion
      await userEvent.click(screen.getByText(/se connecter/i));
      expect(screen.getByRole('heading', { name: /connexion/i })).toBeInTheDocument();
    });

    test('réinitialise les champs et erreurs lors du changement de formulaire', async () => {
      render(<Auth />);

      // Saisir des données dans le formulaire de connexion
      const emailInput = screen.getByPlaceholderText(/email/i);
      await userEvent.type(emailInput, 'test@example.com');

      // Déclencher une erreur
      const submitButton = screen.getByRole('button', { name: /se connecter/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email ou mot de passe incorrect/i)).toBeInTheDocument();
      });

      // Basculer vers l'inscription
      await userEvent.click(screen.getByText(/créer un compte/i));

      // Vérifier que les champs sont réinitialisés
      const newEmailInput = screen.getByPlaceholderText(/email/i);
      expect(newEmailInput).toHaveValue('');

      // Vérifier que l'erreur a disparu
      expect(screen.queryByText(/email ou mot de passe incorrect/i)).not.toBeInTheDocument();
    });
  });

  describe('État de chargement', () => {
    test('désactive le bouton et affiche le texte de chargement', async () => {
      // Mock pour simuler un délai
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));

      render(<Auth />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/mot de passe/i);
      const submitButton = screen.getByRole('button', { name: /se connecter/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(submitButton);

      // Vérifier l'état de chargement
      expect(screen.getByRole('button', { name: /chargement/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /chargement/i })).toBeDisabled();
    });
  });

  describe('Accessibilité', () => {
    test('les champs ont des placeholders appropriés', () => {
      render(<Auth />);

      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/mot de passe/i)).toBeInTheDocument();
    });

    test('utilise des types d\'input appropriés', () => {
      render(<Auth />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/mot de passe/i);

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('a des attributs requis sur les champs obligatoires', () => {
      render(<Auth />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/mot de passe/i);

      expect(emailInput).toBeRequired();
      expect(passwordInput).toBeRequired();
    });
  });
});