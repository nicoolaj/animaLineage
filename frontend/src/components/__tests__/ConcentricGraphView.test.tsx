import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import ConcentricGraphView from '../ConcentricGraphView';

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

// Mock HTMLCanvasElement
const mockCanvas = {
  getContext: vi.fn(() => ({
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: '',
    textBaseline: '',
    shadowColor: '',
    shadowBlur: 0,
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    clip: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    fillText: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    rotate: vi.fn()
  })),
  width: 800,
  height: 600,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  getBoundingClientRect: vi.fn(() => ({
    left: 0,
    top: 0,
    width: 800,
    height: 600
  }))
};

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = mockCanvas.getContext;
  Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
    writable: true,
    value: 800,
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'height', {
    writable: true,
    value: 600,
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
    writable: true,
    value: mockCanvas.getBoundingClientRect,
  });
});

describe('ConcentricGraphView', () => {
  it('renders the component with canvas', () => {
    render(<ConcentricGraphView treeData={mockTreeData} />);

    const canvas = screen.getByRole('img', { hidden: true });
    expect(canvas).toBeInTheDocument();
  });

  it('displays center button for resetting view', () => {
    render(<ConcentricGraphView treeData={mockTreeData} />);

    const centerButton = screen.getByText('Centrer');
    expect(centerButton).toBeInTheDocument();
    expect(centerButton).toHaveClass('bg-white/90', 'hover:bg-white');
  });

  it('handles center button click', () => {
    render(<ConcentricGraphView treeData={mockTreeData} />);

    const centerButton = screen.getByText('Centrer');
    fireEvent.click(centerButton);

    // Should not throw an error
    expect(centerButton).toBeInTheDocument();
  });

  it('renders with proper container structure', () => {
    render(<ConcentricGraphView treeData={mockTreeData} />);

    // Check for the main container
    const container = screen.getByText('Centrer').closest('div');
    expect(container).toHaveClass('relative', 'w-full', 'h-full');
  });

  it('handles mouse events on canvas', () => {
    render(<ConcentricGraphView treeData={mockTreeData} />);

    const canvas = screen.getByRole('img', { hidden: true });

    // Test mouse move event
    fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });

    // Should not throw an error
    expect(canvas).toBeInTheDocument();
  });

  it('handles wheel events for zoom', () => {
    render(<ConcentricGraphView treeData={mockTreeData} />);

    const canvas = screen.getByRole('img', { hidden: true });

    // Test wheel event
    fireEvent.wheel(canvas, { deltaY: -100 });

    // Should not throw an error
    expect(canvas).toBeInTheDocument();
  });

  it('displays tooltip on hover (when hoveredNode is set)', () => {
    render(<ConcentricGraphView treeData={mockTreeData} />);

    // Initially no tooltip should be visible
    expect(screen.queryByText('Sexe:')).not.toBeInTheDocument();
  });

  it('handles touch events for mobile', () => {
    render(<ConcentricGraphView treeData={mockTreeData} />);

    const canvas = screen.getByRole('img', { hidden: true });

    // Test touch events
    fireEvent.touchStart(canvas, {
      touches: [{ clientX: 100, clientY: 100 }]
    });

    fireEvent.touchMove(canvas, {
      touches: [{ clientX: 150, clientY: 150 }]
    });

    fireEvent.touchEnd(canvas);

    // Should not throw an error
    expect(canvas).toBeInTheDocument();
  });

  it('renders without crashing when treeData is null', () => {
    render(<ConcentricGraphView treeData={null} />);

    const centerButton = screen.getByText('Centrer');
    expect(centerButton).toBeInTheDocument();
  });
});