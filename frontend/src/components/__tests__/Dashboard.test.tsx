import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../Dashboard';
import { useAuth } from '../../contexts/AuthContext';

// Mock du contexte d'authentification
jest.mock('../../contexts/AuthContext');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock des composants enfants
jest.mock('../AdminPanel', () => {
  const React = require('react');
  const AdminPanel = React.forwardRef<{ refreshUsers: () => void }, { onUserDeleted: () => void }>((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      refreshUsers: jest.fn()
    }));
    return React.createElement('div', { 'data-testid': 'admin-panel' }, 'AdminPanel Component');
  });
  AdminPanel.displayName = 'AdminPanel';
  return AdminPanel;
});

jest.mock('../PendingUsers', () => {
  const React = require('react');
  const PendingUsers = React.forwardRef<{ refreshUsers: () => void }, { onUserValidated: () => void }>((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      refreshUsers: jest.fn()
    }));
    return React.createElement('div', { 'data-testid': 'pending-users' }, 'PendingUsers Component');
  });
  PendingUsers.displayName = 'PendingUsers';
  return PendingUsers;
});

describe('Dashboard Component', () => {

  const mockLogout = jest.fn();
  const mockCanModerate = jest.fn();
  const mockCanAdministrate = jest.fn();

  const defaultAuthData = {
    user: {
      id: 1,
      name: 'Jean Dupont',
      email: 'jean@example.com',
      role: 2,
      role_name: 'Modérateur'
    },
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: jest.fn(),
    register: jest.fn(),
    logout: mockLogout,
    clearError: jest.fn(),
    getAuthHeaders: jest.fn(),
    isAdmin: jest.fn(),
    canModerate: mockCanModerate,
    canAdministrate: mockCanAdministrate
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCanModerate.mockReturnValue(true);
    mockCanAdministrate.mockReturnValue(false);
    mockUseAuth.mockReturnValue(defaultAuthData);
  });

  describe('Rendu du composant', () => {
    test('affiche le titre principal', () => {
      render(<Dashboard />);

      expect(screen.getByRole('heading', { name: /tableau de bord/i })).toBeInTheDocument();
    });

    test('affiche les informations utilisateur', () => {
      render(<Dashboard />);

      expect(screen.getByText(/bienvenue, jean dupont!/i)).toBeInTheDocument();
      expect(screen.getByText(/\(modérateur\)/i)).toBeInTheDocument();
    });

    test('affiche le bouton de déconnexion', () => {
      render(<Dashboard />);

      expect(screen.getByRole('button', { name: /déconnexion/i })).toBeInTheDocument();
    });
  });

  describe('Gestion des permissions', () => {
    test('affiche la section admin pour les modérateurs', () => {
      render(<Dashboard />);

      expect(screen.getByText(/🛡️ panel d'administration/i)).toBeInTheDocument();
      expect(screen.getByText(/vous avez accès aux fonctionnalités de modération/i)).toBeInTheDocument();
    });

    test('affiche la notice admin pour les administrateurs', () => {
      mockCanAdministrate.mockReturnValue(true);

      render(<Dashboard />);

      expect(screen.getByText(/👑 vous êtes administrateur/i)).toBeInTheDocument();
      expect(screen.getByText(/accès complet au système/i)).toBeInTheDocument();
    });

    test('cache la section admin pour les utilisateurs normaux', () => {
      mockCanModerate.mockReturnValue(false);

      render(<Dashboard />);

      expect(screen.queryByText(/🛡️ panel d'administration/i)).not.toBeInTheDocument();
      expect(screen.queryByTestId('admin-panel')).not.toBeInTheDocument();
      expect(screen.queryByTestId('pending-users')).not.toBeInTheDocument();
    });

    test('affiche AdminPanel et PendingUsers pour les modérateurs', () => {
      render(<Dashboard />);

      expect(screen.getByTestId('admin-panel')).toBeInTheDocument();
      expect(screen.getByTestId('pending-users')).toBeInTheDocument();
    });

    test('cache AdminPanel et PendingUsers pour les utilisateurs normaux', () => {
      mockCanModerate.mockReturnValue(false);

      render(<Dashboard />);

      expect(screen.queryByTestId('admin-panel')).not.toBeInTheDocument();
      expect(screen.queryByTestId('pending-users')).not.toBeInTheDocument();
    });
  });

  describe('Fonctionnalité de déconnexion', () => {
    test('appelle logout lors du clic sur déconnexion', async () => {
      render(<Dashboard />);

      const logoutButton = screen.getByRole('button', { name: /déconnexion/i });
      await userEvent.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('Gestion des utilisateurs sans données complètes', () => {
    test('gère un utilisateur sans nom', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthData,
        user: {
          ...defaultAuthData.user!,
          name: undefined as any
        }
      });

      render(<Dashboard />);

      expect(screen.getByText(/bienvenue,/i)).toBeInTheDocument();
    });

    test('gère un utilisateur sans role_name', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthData,
        user: {
          ...defaultAuthData.user!,
          role_name: undefined as any
        }
      });

      render(<Dashboard />);

      expect(screen.getByText(/bienvenue, jean dupont!/i)).toBeInTheDocument();
    });

    test('gère l\'absence d\'utilisateur', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthData,
        user: null
      });

      render(<Dashboard />);

      expect(screen.getByText(/bienvenue,/i)).toBeInTheDocument();
    });
  });

  describe('Communication entre composants', () => {
    test('gère les références des composants enfants', () => {
      render(<Dashboard />);

      // Vérifier que les composants sont rendus (les refs sont gérées en interne)
      expect(screen.getByTestId('admin-panel')).toBeInTheDocument();
      expect(screen.getByTestId('pending-users')).toBeInTheDocument();
    });
  });

  describe('Structure HTML et accessibilité', () => {
    test('utilise les éléments sémantiques appropriés', () => {
      render(<Dashboard />);

      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      expect(screen.getByRole('main')).toBeInTheDocument(); // main
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    test('a des IDs uniques pour les éléments principaux', () => {
      render(<Dashboard />);

      expect(document.querySelector('#dashboard-container')).toBeInTheDocument();
      expect(document.querySelector('#dashboard-header')).toBeInTheDocument();
      expect(document.querySelector('#dashboard-content')).toBeInTheDocument();
      expect(document.querySelector('#dashboard-user-info')).toBeInTheDocument();
    });

    test('structure les informations utilisateur correctement', () => {
      render(<Dashboard />);

      const userInfo = screen.getByText(/bienvenue, jean dupont!/i).closest('.user-details');
      expect(userInfo).toBeInTheDocument();

      const roleInfo = screen.getByText(/\(modérateur\)/i);
      expect(roleInfo).toHaveClass('user-role');
    });
  });

  describe('Différents rôles d\'utilisateur', () => {
    test('affiche correctement pour un administrateur', () => {
      mockCanAdministrate.mockReturnValue(true);
      mockUseAuth.mockReturnValue({
        ...defaultAuthData,
        user: {
          ...defaultAuthData.user!,
          role: 1,
          role_name: 'Administrateur'
        }
      });

      render(<Dashboard />);

      expect(screen.getByText(/\(administrateur\)/i)).toBeInTheDocument();
      expect(screen.getByText(/👑 vous êtes administrateur/i)).toBeInTheDocument();
      expect(screen.getByTestId('admin-panel')).toBeInTheDocument();
      expect(screen.getByTestId('pending-users')).toBeInTheDocument();
    });

    test('affiche correctement pour un modérateur', () => {
      render(<Dashboard />);

      expect(screen.getByText(/\(modérateur\)/i)).toBeInTheDocument();
      expect(screen.getByText(/🛡️ panel d'administration/i)).toBeInTheDocument();
      expect(screen.queryByText(/👑 vous êtes administrateur/i)).not.toBeInTheDocument();
      expect(screen.getByTestId('admin-panel')).toBeInTheDocument();
      expect(screen.getByTestId('pending-users')).toBeInTheDocument();
    });

    test('affiche correctement pour un utilisateur standard', () => {
      mockCanModerate.mockReturnValue(false);
      mockUseAuth.mockReturnValue({
        ...defaultAuthData,
        user: {
          ...defaultAuthData.user!,
          role: 3,
          role_name: 'Utilisateur'
        }
      });

      render(<Dashboard />);

      expect(screen.getByText(/\(utilisateur\)/i)).toBeInTheDocument();
      expect(screen.queryByText(/🛡️ panel d'administration/i)).not.toBeInTheDocument();
      expect(screen.queryByTestId('admin-panel')).not.toBeInTheDocument();
      expect(screen.queryByTestId('pending-users')).not.toBeInTheDocument();
    });
  });

  describe('Classes CSS', () => {
    test('applique les classes CSS correctes', () => {
      render(<Dashboard />);

      expect(document.querySelector('.dashboard')).toBeInTheDocument();
      expect(document.querySelector('.dashboard-header')).toBeInTheDocument();
      expect(document.querySelector('.dashboard-content')).toBeInTheDocument();
      expect(document.querySelector('.user-info')).toBeInTheDocument();
      expect(document.querySelector('.user-details')).toBeInTheDocument();
      expect(document.querySelector('.logout-button')).toBeInTheDocument();
    });

    test('applique les classes spécifiques aux sections admin', () => {
      render(<Dashboard />);

      expect(document.querySelector('.admin-section')).toBeInTheDocument();
    });

    test('applique la classe admin-notice pour les administrateurs', () => {
      mockCanAdministrate.mockReturnValue(true);

      render(<Dashboard />);

      expect(document.querySelector('.admin-notice')).toBeInTheDocument();
    });
  });
});