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

// Mock sessionStorage
export const mockSessionStorage = () => {
  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: vi.fn((key: string) => {
        if (key === 'token') return 'mock-token';
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

// Mock fetch responses
export const setupFetchMock = (responses: Record<string, any> = {}) => {
  const defaultResponses = {
    '/auth/me': { user: mockAuthenticatedUser },
    '/animaux': [],
    '/elevages': [],
    '/races': [],
    '/types-animaux': []
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
};