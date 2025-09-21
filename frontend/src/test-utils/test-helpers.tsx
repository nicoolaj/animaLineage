import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';

// Mock fetch globally for tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([])
  } as Response)
);

const mockAuthContext = {
  user: {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 1,
    role_name: 'Admin',
    status: 1
  },
  token: 'test-token',
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: true,
  isLoading: false,
  isAdmin: () => true,
  isModerator: () => true,
  isReader: () => true,
  canModerate: () => true,
  canAdministrate: () => true,
  getAuthHeaders: () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer test-token`
  })
};

// Mock AuthContext
jest.mock('../contexts/AuthContext', () => ({
  ...jest.requireActual('../contexts/AuthContext'),
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Custom render function that includes providers
const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
export { mockAuthContext };