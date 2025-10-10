import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock fetch
global.fetch = vi.fn();

// Test component to access context
const TestComponent = () => {
  const auth = useAuth();

  return (
    <div>
      <div data-testid="user">{auth.user ? auth.user.name : 'No user'}</div>
      <div data-testid="authenticated">{auth.isAuthenticated ? 'true' : 'false'}</div>
      <div data-testid="loading">{auth.loading ? 'true' : 'false'}</div>
      <button onClick={() => auth.login('test@example.com', 'password')}>Login</button>
      <button onClick={() => auth.logout()}>Logout</button>
      <button onClick={() => auth.register('Test User', 'test@example.com', 'password')}>Register</button>
    </div>
  );
};

const renderWithProvider = () => {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  test('provides initial state', () => {
    const { getByTestId } = renderWithProvider();

    expect(getByTestId('user')).toHaveTextContent('No user');
    expect(getByTestId('authenticated')).toHaveTextContent('false');
    expect(getByTestId('loading')).toHaveTextContent('false');
  });

  test('restores user from localStorage on mount', () => {
    const storedUser = { id: 1, name: 'Test User', email: 'test@example.com' };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(storedUser));

    const { getByTestId } = renderWithProvider();

    expect(getByTestId('user')).toHaveTextContent('Test User');
    expect(getByTestId('authenticated')).toHaveTextContent('true');
  });

  test('handles corrupted localStorage data', () => {
    localStorageMock.getItem.mockReturnValue('invalid-json');

    const { getByTestId } = renderWithProvider();

    expect(getByTestId('user')).toHaveTextContent('No user');
    expect(getByTestId('authenticated')).toHaveTextContent('false');
  });

  test('successful login', async () => {
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };

    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ user: mockUser, token: 'mock-token' })
    });

    const { getByTestId, getByText } = renderWithProvider();

    await act(async () => {
      getByText('Login').click();
    });

    await waitFor(() => {
      expect(getByTestId('user')).toHaveTextContent('Test User');
      expect(getByTestId('authenticated')).toHaveTextContent('true');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'mock-token');
  });

  test('failed login', async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Invalid credentials' })
    });

    const { getByTestId, getByText } = renderWithProvider();

    await act(async () => {
      getByText('Login').click();
    });

    await waitFor(() => {
      expect(getByTestId('user')).toHaveTextContent('No user');
      expect(getByTestId('authenticated')).toHaveTextContent('false');
    });

    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  test('network error during login', async () => {
    (fetch as any).mockRejectedValue(new Error('Network error'));

    const { getByTestId, getByText } = renderWithProvider();

    await act(async () => {
      getByText('Login').click();
    });

    await waitFor(() => {
      expect(getByTestId('user')).toHaveTextContent('No user');
      expect(getByTestId('authenticated')).toHaveTextContent('false');
    });
  });

  test('successful registration', async () => {
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };

    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ user: mockUser, token: 'mock-token' })
    });

    const { getByTestId, getByText } = renderWithProvider();

    await act(async () => {
      getByText('Register').click();
    });

    await waitFor(() => {
      expect(getByTestId('user')).toHaveTextContent('Test User');
      expect(getByTestId('authenticated')).toHaveTextContent('true');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'mock-token');
  });

  test('failed registration', async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'User already exists' })
    });

    const { getByTestId, getByText } = renderWithProvider();

    await act(async () => {
      getByText('Register').click();
    });

    await waitFor(() => {
      expect(getByTestId('user')).toHaveTextContent('No user');
      expect(getByTestId('authenticated')).toHaveTextContent('false');
    });
  });

  test('logout clears user and token', async () => {
    // Set initial user
    const storedUser = { id: 1, name: 'Test User', email: 'test@example.com' };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(storedUser));

    const { getByTestId, getByText } = renderWithProvider();

    // Verify user is logged in
    expect(getByTestId('authenticated')).toHaveTextContent('true');

    await act(async () => {
      getByText('Logout').click();
    });

    expect(getByTestId('user')).toHaveTextContent('No user');
    expect(getByTestId('authenticated')).toHaveTextContent('false');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
  });

  test('getAuthHeaders returns correct headers when authenticated', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return 'mock-token';
      if (key === 'user') return JSON.stringify({ id: 1, name: 'Test User' });
      return null;
    });

    const { getByTestId } = renderWithProvider();

    // Access auth context through a custom hook test
    let authHeaders: any;

    const HeaderTestComponent = () => {
      const auth = useAuth();
      authHeaders = auth.getAuthHeaders();
      return <div data-testid="headers-test">Headers tested</div>;
    };

    render(
      <AuthProvider>
        <HeaderTestComponent />
      </AuthProvider>
    );

    expect(authHeaders).toEqual({
      'Authorization': 'Bearer mock-token',
      'Content-Type': 'application/json'
    });
  });

  test('getAuthHeaders returns basic headers when not authenticated', () => {
    let authHeaders: any;

    const HeaderTestComponent = () => {
      const auth = useAuth();
      authHeaders = auth.getAuthHeaders();
      return <div>Headers tested</div>;
    };

    render(
      <AuthProvider>
        <HeaderTestComponent />
      </AuthProvider>
    );

    expect(authHeaders).toEqual({
      'Content-Type': 'application/json'
    });
  });

  test('shows loading state during authentication', async () => {
    (fetch as any).mockImplementation(() =>
      new Promise(resolve =>
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ user: { id: 1, name: 'Test' }, token: 'token' })
        }), 100)
      )
    );

    const { getByTestId, getByText } = renderWithProvider();

    act(() => {
      getByText('Login').click();
    });

    expect(getByTestId('loading')).toHaveTextContent('true');

    await waitFor(() => {
      expect(getByTestId('loading')).toHaveTextContent('false');
    }, { timeout: 200 });
  });
});