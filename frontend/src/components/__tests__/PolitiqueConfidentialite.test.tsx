import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PolitiqueConfidentialite from '../PolitiqueConfidentialite';

describe('PolitiqueConfidentialite', () => {
  it('renders the privacy policy title', () => {
    render(<PolitiqueConfidentialite />);

    expect(screen.getByText('Politique de Confidentialité')).toBeInTheDocument();
  });

  it('displays the last update date', () => {
    render(<PolitiqueConfidentialite />);

    expect(screen.getByText(/Dernière mise à jour :/)).toBeInTheDocument();
  });

  it('contains data collection section', () => {
    render(<PolitiqueConfidentialite />);

    expect(screen.getByText('1. Collecte des données')).toBeInTheDocument();
    expect(
      screen.getByText(/Nous collectons les informations suivantes/)
    ).toBeInTheDocument();
  });

  it('contains data usage section', () => {
    render(<PolitiqueConfidentialite />);

    expect(screen.getByText('2. Utilisation des données')).toBeInTheDocument();
  });

  it('contains data sharing section', () => {
    render(<PolitiqueConfidentialite />);

    expect(screen.getByText('3. Partage des données')).toBeInTheDocument();
  });

  it('contains user rights section', () => {
    render(<PolitiqueConfidentialite />);

    expect(screen.getByText('4. Vos droits')).toBeInTheDocument();
  });

  it('contains contact information section', () => {
    render(<PolitiqueConfidentialite />);

    expect(screen.getByText('5. Contact')).toBeInTheDocument();
  });

  it('displays GDPR compliance information', () => {
    render(<PolitiqueConfidentialite />);

    expect(screen.getByText(/RGPD|GDPR/)).toBeInTheDocument();
  });

  it('has proper document structure with headers', () => {
    render(<PolitiqueConfidentialite />);

    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(5);
  });

  it('contains data retention information', () => {
    render(<PolitiqueConfidentialite />);

    expect(screen.getByText(/conservation|rétention|durée/i)).toBeInTheDocument();
  });

  it('contains security measures information', () => {
    render(<PolitiqueConfidentialite />);

    expect(screen.getByText(/sécurité|protection|mesures/i)).toBeInTheDocument();
  });

  it('contains cookie policy information', () => {
    render(<PolitiqueConfidentialite />);

    expect(screen.getByText(/cookies/i)).toBeInTheDocument();
  });

  it('has proper styling and layout', () => {
    render(<PolitiqueConfidentialite />);

    const mainContainer = screen.getByText('Politique de Confidentialité').closest('div');
    expect(mainContainer).toHaveClass('max-w-4xl', 'mx-auto', 'p-6');
  });

  it('displays contact email or form', () => {
    render(<PolitiqueConfidentialite />);

    // Should contain either an email address or contact information
    expect(
      screen.getByText(/@/) || screen.getByText(/contact/i)
    ).toBeInTheDocument();
  });

  it('contains information about third-party services', () => {
    render(<PolitiqueConfidentialite />);

    expect(screen.getByText(/tiers|partenaires|services externes/i)).toBeInTheDocument();
  });

  it('displays policy update procedures', () => {
    render(<PolitiqueConfidentialite />);

    expect(screen.getByText(/modification|mise à jour|changement/i)).toBeInTheDocument();
  });
});