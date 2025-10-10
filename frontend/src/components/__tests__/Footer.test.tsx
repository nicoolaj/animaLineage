import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Footer from '../Footer';

describe('Footer Component', () => {
  it('renders footer with correct text', () => {
    render(<Footer />);
    expect(screen.getByText(/© 2025 AnimaLineage/i)).toBeInTheDocument();
  });

  it('displays mentions légales link', () => {
    render(<Footer />);
    const mentionsLink = screen.getByText(/Mentions légales/i);
    expect(mentionsLink).toBeInTheDocument();
    expect(mentionsLink).toHaveAttribute('href', '/mentions-legales');
  });

  it('displays politique de confidentialité link', () => {
    render(<Footer />);
    const politiqueLink = screen.getByText(/Politique de confidentialité/i);
    expect(politiqueLink).toBeInTheDocument();
    expect(politiqueLink).toHaveAttribute('href', '/politique-confidentialite');
  });

  it('displays contact link', () => {
    render(<Footer />);
    const contactLink = screen.getByText(/Contact/i);
    expect(contactLink).toBeInTheDocument();
    expect(contactLink).toHaveAttribute('href', 'mailto:contact@animalineage.com');
  });

  it('has proper footer styling', () => {
    render(<Footer />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('bg-gray-800');
    expect(footer).toHaveClass('text-white');
  });

  it('renders version information', () => {
    render(<Footer />);
    expect(screen.getByText(/v1.0.0/i)).toBeInTheDocument();
  });

  it('displays social media links', () => {
    render(<Footer />);

    // Check if social media section exists
    expect(screen.getByText(/Suivez-nous/i)).toBeInTheDocument();
  });

  it('shows responsive layout classes', () => {
    const { container } = render(<Footer />);
    const footerElement = container.firstChild;
    expect(footerElement).toHaveClass('py-8');
    expect(footerElement).toHaveClass('px-4');
  });

  it('displays company information', () => {
    render(<Footer />);
    expect(screen.getByText(/Tous droits réservés/i)).toBeInTheDocument();
  });

  it('renders links with proper accessibility', () => {
    render(<Footer />);

    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveAttribute('href');
    });
  });

  it('handles link clicks without errors', async () => {
    const user = userEvent.setup();
    render(<Footer />);

    const mentionsLink = screen.getByText(/Mentions légales/i);

    // Test that clicking doesn't throw errors
    await user.click(mentionsLink);
    expect(mentionsLink).toBeInTheDocument();
  });

  it('displays footer navigation', () => {
    render(<Footer />);

    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('shows legal compliance text', () => {
    render(<Footer />);
    expect(screen.getByText(/Développé avec/i)).toBeInTheDocument();
    expect(screen.getByText(/React/i)).toBeInTheDocument();
  });

  it('includes accessibility statement', () => {
    render(<Footer />);
    expect(screen.getByText(/Accessibilité/i)).toBeInTheDocument();
  });

  it('displays proper footer structure', () => {
    render(<Footer />);

    // Check main footer container
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();

    // Check footer content sections
    expect(screen.getByText(/AnimaLineage/i)).toBeInTheDocument();
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<Footer />);

    const firstLink = screen.getByText(/Mentions légales/i);

    // Test tab navigation
    await user.tab();
    expect(firstLink).toHaveFocus();
  });

  it('displays correct footer layout on mobile', () => {
    // Mock window.innerWidth for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(<Footer />);

    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('px-4');
  });

  it('shows footer divider', () => {
    render(<Footer />);

    // Check for visual separator
    const footerContent = screen.getByRole('contentinfo');
    expect(footerContent).toHaveClass('border-t');
  });

  it('displays footer grid layout', () => {
    render(<Footer />);

    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('grid');
  });

  it('includes GDPR compliance link', () => {
    render(<Footer />);
    expect(screen.getByText(/RGPD/i)).toBeInTheDocument();
  });

  it('shows footer background styling', () => {
    render(<Footer />);

    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('bg-gray-800');
  });

  it('displays footer text color', () => {
    render(<Footer />);

    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('text-white');
  });
});