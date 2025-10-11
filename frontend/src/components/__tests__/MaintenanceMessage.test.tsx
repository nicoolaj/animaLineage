import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MaintenanceMessage from '../MaintenanceMessage';

describe('MaintenanceMessage', () => {
  it('renders the maintenance message', () => {
    render(<MaintenanceMessage />);

    expect(screen.getByText('🚧')).toBeInTheDocument();
    expect(screen.getByText('Maintenance en cours')).toBeInTheDocument();
    expect(
      screen.getByText('L\'application est temporairement indisponible pour maintenance.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Veuillez réessayer dans quelques minutes.')
    ).toBeInTheDocument();
  });

  it('has proper styling classes', () => {
    render(<MaintenanceMessage />);

    const container = screen.getByText('Maintenance en cours').closest('div');
    expect(container).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center');
  });

  it('displays maintenance icon', () => {
    render(<MaintenanceMessage />);

    const icon = screen.getByText('🚧');
    expect(icon).toBeInTheDocument();
  });

  it('displays maintenance title with correct styling', () => {
    render(<MaintenanceMessage />);

    const title = screen.getByText('Maintenance en cours');
    expect(title).toHaveClass('text-2xl', 'font-bold', 'text-gray-800');
  });

  it('displays maintenance description', () => {
    render(<MaintenanceMessage />);

    const description = screen.getByText(
      'L\'application est temporairement indisponible pour maintenance.'
    );
    expect(description).toHaveClass('text-gray-600');
  });

  it('displays retry instruction', () => {
    render(<MaintenanceMessage />);

    const retryText = screen.getByText('Veuillez réessayer dans quelques minutes.');
    expect(retryText).toHaveClass('text-gray-600');
  });

  it('renders as a full-screen centered message', () => {
    render(<MaintenanceMessage />);

    const mainContainer = screen.getByText('🚧').closest('div').parentElement;
    expect(mainContainer).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center');
  });

  it('has a white background card', () => {
    render(<MaintenanceMessage />);

    const card = screen.getByText('Maintenance en cours').closest('div');
    expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-lg');
  });
});