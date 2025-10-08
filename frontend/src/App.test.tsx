import React from 'react';
import { render, screen, waitFor } from './test-utils/test-helpers';
import { vi } from 'vitest';
import App from './App';

// Mock the API health hook to simulate successful connection
vi.mock('./hooks/useApiHealthWithRedux', () => ({
  useApiHealthWithRedux: () => ({
    isHealthy: true,
    isChecking: false,
    error: null,
    recheckHealth: vi.fn()
  })
}));

test('renders app with authentication form', async () => {
  render(<App />);

  // Wait for the loading state to complete
  await waitFor(() => {
    // Avec les mocks d'AuthContext, l'utilisateur est connecté et voit le dashboard
    const logo = screen.getByRole('img', { name: /animalineage/i });
    expect(logo).toBeInTheDocument();

    const welcomeMessage = screen.getByText(/welcome, test user!/i);
    expect(welcomeMessage).toBeInTheDocument();
  });
});
