import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider } from './contexts/AuthContext';
import { vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

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

// Mock authenticated user
export const mockAuthenticatedUser = {
  id: 1,
  nom: 'Test User',
  email: 'test@example.com',
  role: 2
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
    ]
  };

  const allResponses = { ...defaultResponses, ...responses };

  (global.fetch as any).mockImplementation((url: string, options?: any) => {
    for (const [endpoint, response] of Object.entries(allResponses)) {
      if (url.includes(endpoint)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(response)
        });
      }
    }

    return Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ message: 'Not found' })
    });
  });
};

// Clear all mocks helper
export const clearAllMocks = () => {
  vi.clearAllMocks();
  mockSessionStorage();
  setupFetchMock();
};