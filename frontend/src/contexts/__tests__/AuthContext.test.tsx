import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock fetch pour les tests
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock de la fonction isTokenExpired
jest.mock('../../utils/auth', () => ({
  isTokenExpired: jest.fn(() => false) // Par défaut, les tokens ne sont pas expirés
}));

// Mock localStorage et sessionStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

// Wrapper pour le provider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockSessionStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockClear();
    mockSessionStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    mockSessionStorage.removeItem.mockClear();
  });

  describe('État initial', () => {
    test('initialise avec les valeurs par défaut', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    test('charge l\'utilisateur depuis le localStorage au démarrage', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 2,
        role_name: 'Admin',
        status: 1
      };

      mockSessionStorage.getItem.mockImplementation((key: string) => {
        if (key === 'user') return JSON.stringify(mockUser);
        if (key === 'token') return 'mock-token';
        return null;
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.token).toBe('mock-token');
      });
    });

    test('ignore les données corrompues du sessionStorage', async () => {
      mockSessionStorage.getItem.mockImplementation((key: string) => {
        if (key === 'user') return 'invalid-json';
        if (key === 'token') return 'mock-token';
        return null;
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
      });
    });
  });

  describe('Fonction login', () => {
    test('connecte l\'utilisateur avec des identifiants valides', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 2,
        role_name: 'Admin',
        status: 1
      };

      const mockResponse = {
        token: 'mock-jwt-token',
        user: mockUser
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const success = await result.current.login('test@example.com', 'password123');
        expect(success).toBe(true);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe('mock-jwt-token');

      // Vérifier que les données sont sauvegardées
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('token', 'mock-jwt-token');
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
    });

    test('gère les erreurs de connexion', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Invalid credentials' })
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const success = await result.current.login('wrong@example.com', 'wrongpassword');
        expect(success).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });

    test('gère les erreurs réseau', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const success = await result.current.login('test@example.com', 'password123');
        expect(success).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Fonction register', () => {
    test('inscrit un nouvel utilisateur avec des données valides', async () => {
      const mockUser = {
        id: 1,
        name: 'New User',
        email: 'newuser@example.com',
        role: 3,
        role_name: 'User',
        status: 0
      };

      const mockResponse = {
        token: 'mock-jwt-token',
        user: mockUser
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const success = await result.current.register('New User', 'newuser@example.com', 'password123');
        expect(success).toBe(true);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe('mock-jwt-token');
    });

    test('gère les erreurs d\'inscription', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Email already exists' })
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const success = await result.current.register('New User', 'existing@example.com', 'password123');
        expect(success).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Fonction logout', () => {
    test('déconnecte l\'utilisateur', async () => {
      // D'abord connecter l'utilisateur
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 2,
        role_name: 'Admin',
        status: 1
      };

      mockSessionStorage.getItem.mockImplementation((key: string) => {
        if (key === 'user') return JSON.stringify(mockUser);
        if (key === 'token') return 'mock-token';
        return null;
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Maintenant déconnecter
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);

      // Vérifier que le sessionStorage est nettoyé
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });

  describe('Fonctions de rôle', () => {
    test('isAdmin retourne true pour les administrateurs', async () => {
      const mockAdmin = {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 1,
        role_name: 'Admin',
        status: 1
      };

      mockSessionStorage.getItem.mockImplementation((key: string) => {
        if (key === 'user') return JSON.stringify(mockAdmin);
        if (key === 'token') return 'mock-token';
        return null;
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAdmin()).toBe(true);
      });
    });

    test('isModerator retourne true pour les modérateurs', async () => {
      const mockModerator = {
        id: 1,
        name: 'Moderator User',
        email: 'mod@example.com',
        role: 2,
        role_name: 'Moderator',
        status: 1
      };

      mockSessionStorage.getItem.mockImplementation((key: string) => {
        if (key === 'user') return JSON.stringify(mockModerator);
        if (key === 'token') return 'mock-token';
        return null;
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isModerator()).toBe(true);
      });
    });

    test('canModerate retourne true pour les admins et modérateurs', async () => {
      const mockModerator = {
        id: 1,
        name: 'Moderator User',
        email: 'mod@example.com',
        role: 2,
        role_name: 'Moderator',
        status: 1
      };

      mockSessionStorage.getItem.mockImplementation((key: string) => {
        if (key === 'user') return JSON.stringify(mockModerator);
        if (key === 'token') return 'mock-token';
        return null;
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.canModerate()).toBe(true);
      });
    });
  });

  describe('getAuthHeaders', () => {
    test('retourne les headers d\'authentification', async () => {
      mockSessionStorage.getItem.mockImplementation((key: string) => {
        if (key === 'token') return 'mock-token';
        return null;
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        const headers = result.current.getAuthHeaders();
        expect(headers).toEqual({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        });
      });
    });

    test('retourne les headers de base sans token', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const headers = result.current.getAuthHeaders();
      expect(headers).toEqual({
        'Content-Type': 'application/json'
      });
    });
  });

  describe('Gestion des erreurs', () => {
    test('gère les tokens expirés', async () => {
      const expiredToken = 'expired-token';

      mockSessionStorage.getItem.mockImplementation((key: string) => {
        if (key === 'token') return expiredToken;
        return null;
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Le composant devrait détecter le token expiré et déconnecter l'utilisateur
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });
    });
  });
});