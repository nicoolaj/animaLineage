import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app with authentication form', () => {
  render(<App />);
  const heading = screen.getByRole('heading', { name: /react \+ php web app/i });
  expect(heading).toBeInTheDocument();

  const loginTitle = screen.getByRole('heading', { name: /connexion/i });
  expect(loginTitle).toBeInTheDocument();
});
