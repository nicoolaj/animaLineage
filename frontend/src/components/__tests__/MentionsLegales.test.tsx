import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MentionsLegales from '../MentionsLegales';

describe('MentionsLegales', () => {
  it('renders the legal notices title', () => {
    render(<MentionsLegales />);

    expect(screen.getByText('Mentions Légales')).toBeInTheDocument();
  });

  it('displays the last update date', () => {
    render(<MentionsLegales />);

    expect(screen.getByText(/Dernière mise à jour :/)).toBeInTheDocument();
  });

  it('contains editor information section', () => {
    render(<MentionsLegales />);

    expect(screen.getByText('1. Éditeur du site')).toBeInTheDocument();
  });

  it('contains hosting information section', () => {
    render(<MentionsLegales />);

    expect(screen.getByText('2. Hébergement')).toBeInTheDocument();
  });

  it('contains intellectual property section', () => {
    render(<MentionsLegales />);

    expect(screen.getByText('3. Propriété intellectuelle')).toBeInTheDocument();
  });

  it('contains liability section', () => {
    render(<MentionsLegales />);

    expect(screen.getByText('4. Responsabilité')).toBeInTheDocument();
  });

  it('contains applicable law section', () => {
    render(<MentionsLegales />);

    expect(screen.getByText('5. Droit applicable')).toBeInTheDocument();
  });

  it('displays company or individual information', () => {
    render(<MentionsLegales />);

    // Should contain some form of identification (company name, SIRET, etc.)
    expect(
      screen.getByText(/société|entreprise|nom|siret|siren/i)
    ).toBeInTheDocument();
  });

  it('displays contact information', () => {
    render(<MentionsLegales />);

    expect(
      screen.getByText(/contact|adresse|téléphone|email/i)
    ).toBeInTheDocument();
  });

  it('contains hosting provider information', () => {
    render(<MentionsLegales />);

    expect(screen.getByText(/hébergeur|serveur|hosting/i)).toBeInTheDocument();
  });

  it('has proper document structure with headers', () => {
    render(<MentionsLegales />);

    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(5);
  });

  it('contains copyright information', () => {
    render(<MentionsLegales />);

    expect(screen.getByText(/copyright|droit d'auteur|propriété/i)).toBeInTheDocument();
  });

  it('contains disclaimer information', () => {
    render(<MentionsLegales />);

    expect(screen.getByText(/responsabilité|garantie|disclaimer/i)).toBeInTheDocument();
  });

  it('has proper styling and layout', () => {
    render(<MentionsLegales />);

    const mainContainer = screen.getByText('Mentions Légales').closest('div');
    expect(mainContainer).toHaveClass('max-w-4xl', 'mx-auto', 'p-6');
  });

  it('displays French law compliance', () => {
    render(<MentionsLegales />);

    expect(screen.getByText(/français|france|droit français/i)).toBeInTheDocument();
  });

  it('contains terms of use reference', () => {
    render(<MentionsLegales />);

    expect(
      screen.getByText(/utilisation|conditions|règlement/i)
    ).toBeInTheDocument();
  });

  it('displays publication director information', () => {
    render(<MentionsLegales />);

    expect(
      screen.getByText(/directeur|responsable|publication/i)
    ).toBeInTheDocument();
  });
});