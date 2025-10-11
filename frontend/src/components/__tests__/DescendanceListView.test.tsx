import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DescendanceListView from '../DescendanceListView';

// Mock data for testing
const mockTreeData = {
  animal: {
    id: 1,
    identifiant_officiel: 'TEST001',
    nom: 'Test Animal',
    sexe: 'M' as const,
    race_nom: 'Test Race',
    date_naissance: '2020-01-01',
    statut: 'vivant' as const,
    pere_id: undefined,
    mere_id: undefined
  },
  level: 0,
  enfants: [
    {
      animal: {
        id: 2,
        identifiant_officiel: 'TEST002',
        nom: 'Test Child',
        sexe: 'F' as const,
        race_nom: 'Test Race',
        date_naissance: '2021-01-01',
        statut: 'vivant' as const,
        pere_id: 1,
        mere_id: undefined
      },
      level: -1,
      enfants: []
    }
  ]
};

const mockTreeDataNoDescendants = {
  animal: {
    id: 1,
    identifiant_officiel: 'TEST001',
    nom: 'Test Animal',
    sexe: 'M' as const,
    race_nom: 'Test Race',
    statut: 'vivant' as const,
    pere_id: undefined,
    mere_id: undefined
  },
  level: 0,
  enfants: []
};

describe('DescendanceListView', () => {
  it('renders the component title with animal information', () => {
    render(<DescendanceListView treeData={mockTreeData} />);

    expect(screen.getByText(/Vue Liste - Descendance de TEST001/)).toBeInTheDocument();
    expect(screen.getByText(/"Test Animal"/)).toBeInTheDocument();
  });

  it('displays message when no descendants are found', () => {
    render(<DescendanceListView treeData={mockTreeDataNoDescendants} />);

    expect(screen.getByText('🌱')).toBeInTheDocument();
    expect(screen.getByText('Aucune descendance répertoriée pour cet animal.')).toBeInTheDocument();
  });

  it('displays descendants grouped by generation', () => {
    render(<DescendanceListView treeData={mockTreeData} />);

    expect(screen.getByText('Génération 1')).toBeInTheDocument();
    expect(screen.getByText('TEST002')).toBeInTheDocument();
    expect(screen.getByText('"Test Child"')).toBeInTheDocument();
  });

  it('displays correct sex symbols', () => {
    render(<DescendanceListView treeData={mockTreeData} />);

    expect(screen.getByText('♀️')).toBeInTheDocument();
  });

  it('displays animal details correctly', () => {
    render(<DescendanceListView treeData={mockTreeData} />);

    expect(screen.getByText('Race:')).toBeInTheDocument();
    expect(screen.getByText('Test Race')).toBeInTheDocument();
    expect(screen.getByText('Né le:')).toBeInTheDocument();
  });

  it('displays statistics section', () => {
    render(<DescendanceListView treeData={mockTreeData} />);

    expect(screen.getByText('📊 Statistiques de descendance')).toBeInTheDocument();
    expect(screen.getByText('Mâles')).toBeInTheDocument();
    expect(screen.getByText('Femelles')).toBeInTheDocument();
    expect(screen.getByText('Vivants')).toBeInTheDocument();
    expect(screen.getByText('Décédés')).toBeInTheDocument();
  });

  it('shows correct count of descendants', () => {
    render(<DescendanceListView treeData={mockTreeData} />);

    expect(screen.getByText(/1 descendant sur 1 génération/)).toBeInTheDocument();
  });

  it('applies correct styling for living animals', () => {
    render(<DescendanceListView treeData={mockTreeData} />);

    const statusBadge = screen.getByText('Vivant');
    expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800');
  });
});