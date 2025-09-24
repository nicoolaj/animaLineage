import React from 'react';
import { render, screen } from './test-utils/test-helpers';
import App from './App';

test('renders app with authentication form', () => {
  render(<App />);

  // Avec les mocks d'AuthContext, l'utilisateur est connecté et voit le dashboard
  const logo = screen.getByRole('img', { name: /animalineage/i });
  expect(logo).toBeInTheDocument();

  const welcomeMessage = screen.getByText(/welcome, test user!/i);
  expect(welcomeMessage).toBeInTheDocument();
});
