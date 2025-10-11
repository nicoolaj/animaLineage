import React from 'react';
import { render, RenderOptions, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { vi } from 'vitest';
import authReducer from './store/slices/authSlice';
import elevageReducer from './store/slices/elevageSlice';
import animalReducer from './store/slices/animalSlice';
import userReducer from './store/slices/userSlice';
import languageReducer from './store/slices/languageSlice';
import apiHealthReducer from './store/slices/apiHealthSlice';

// Mock fetch globally
global.fetch = vi.fn();

// Mock authenticated user (admin role for tests)
export const mockAuthenticatedUser = {
  id: 1,
  nom: 'Test User',
  email: 'test@example.com',
  role: 1, // Admin role
  role_name: 'Admin'
};

// Create a test store
export const createTestStore = (preloadedState?: any) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      elevage: elevageReducer,
      animal: animalReducer,
      user: userReducer,
      language: languageReducer,
      apiHealth: apiHealthReducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST'],
        },
      }),
  });
};

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const testStore = createTestStore({
    auth: {
      user: mockAuthenticatedUser,
      isAuthenticated: true,
      loading: false,
      error: null
    },
    language: {
      currentLanguage: 'fr'
    }
  });

  return (
    <Provider store={testStore}>
      <LanguageProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </LanguageProvider>
    </Provider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Async rendering helper to reduce act() warnings
export const renderAsync = async (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  let result;
  await act(async () => {
    result = customRender(ui, options);
  });

  // Wait for any pending updates
  await waitFor(() => {
    // This gives components time to finish loading
  });

  return result;
};

// Create a valid JWT token for testing
const createMockJWT = (payload: any) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = 'mock-signature';
  return `${header}.${body}.${signature}`;
};

// Mock sessionStorage
export const mockSessionStorage = () => {
  const mockToken = createMockJWT({ id: 1, nom: 'Test User', role: 2, elevages: [1] });

  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: vi.fn((key: string) => {
        if (key === 'token') return mockToken;
        if (key === 'user') return JSON.stringify({ id: 1, nom: 'Test User', role: 2 });
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    },
    writable: true
  });
};

// Mock admin user
export const mockAdminUser = {
  id: 1,
  nom: 'Admin User',
  email: 'admin@example.com',
  role: 1
};

// Mock animal data
export const mockAnimals = [
  {
    id: 1,
    identifiant_officiel: 'TEST001',
    nom: 'Belle',
    sexe: 'F',
    race_nom: 'Holstein',
    date_naissance: '2020-01-01',
    statut: 'vivant',
    elevage_id: 1
  },
  {
    id: 2,
    identifiant_officiel: 'TEST002',
    nom: 'Thor',
    sexe: 'M',
    race_nom: 'Simmental',
    date_naissance: '2019-05-15',
    statut: 'vivant',
    elevage_id: 1
  }
];

// Mock elevage data
export const mockElevages = [
  {
    id: 1,
    nom: 'Ferme Test',
    description: 'Elevage de test',
    user_id: 1,
    users: [],
    animaux_count: 2
  }
];

// Mock pending users data
export const mockPendingUsers = [
  {
    id: 1,
    nom: 'Jean Dupont',
    email: 'jean@test.com',
    statut: 'en_attente',
    created_at: '2025-01-01T10:00:00Z'
  },
  {
    id: 2,
    nom: 'Marie Martin',
    email: 'marie@test.com',
    statut: 'en_attente',
    created_at: '2025-01-02T10:00:00Z'
  }
];

// Mock fetch responses
export const setupFetchMock = (responses: Record<string, any> = {}) => {
  const defaultResponses = {
    '/auth/me': { user: mockAuthenticatedUser },
    '/animaux': mockAnimals,
    '/elevages': mockElevages,
    '/races': [
      { id: 1, nom: 'Holstein', description: 'Race laitière' },
      { id: 2, nom: 'Simmental', description: 'Race mixte' }
    ],
    '/types-animaux': [
      { id: 1, nom: 'Bovin', description: 'Bovins' }
    ],
    '/simple-admin/pending-users': mockPendingUsers,
    '/simple-admin/validate-user': { message: 'Utilisateur validé' },
    '/simple-admin/reject-user': { message: 'Utilisateur rejeté' },
    '/simple-admin/users': [],
    '/backup': [],
    '/transfer-requests': []
  };

  const allResponses = { ...defaultResponses, ...responses };

  (global.fetch as any).mockImplementation((url: string, options?: any) => {
    // Handle specific cases first
    for (const [endpoint, response] of Object.entries(allResponses)) {
      if (url.includes(endpoint)) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(response),
          text: () => Promise.resolve(JSON.stringify(response)),
          headers: new Headers({ 'content-type': 'application/json' })
        });
      }
    }

    // Default successful empty response for any unmatched endpoint
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
      text: () => Promise.resolve('[]'),
      headers: new Headers({ 'content-type': 'application/json' })
    });
  });
};

// Clear all mocks helper
export const clearAllMocks = () => {
  vi.clearAllMocks();
  mockSessionStorage();
  setupFetchMock();
};