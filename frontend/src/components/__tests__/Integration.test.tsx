import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Import components for integration testing
import MainDashboard from '../MainDashboard';
import AnimalList from '../AnimalList';
import ElevageList from '../ElevageList';
import FamilyTree from '../FamilyTree';

// Mock the Auth context
const mockAuthContext = {
  user: {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 1,
    role_name: 'Admin'
  },
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  loading: false,
  error: null
};

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(() => 'mock-token'),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
});

// Mock data
const mockElevages = [
  {
    id: 1,
    nom: 'Élevage Test',
    description: 'Description test',
    user_id: 1,
    users: [{ id: 1, name: 'Test User' }],
    animaux_count: 5
  }
];

const mockAnimaux = [
  {
    id: 1,
    identifiant_officiel: 'TEST001',
    nom: 'Animal Test',
    sexe: 'M',
    race_nom: 'Holstein',
    statut: 'vivant',
    elevage_id: 1
  },
  {
    id: 2,
    identifiant_officiel: 'TEST002',
    nom: 'Animal Test 2',
    sexe: 'F',
    race_nom: 'Montbéliarde',
    statut: 'vivant',
    elevage_id: 1
  }
];

const mockTreeData = {
  animal: mockAnimaux[0],
  level: 0,
  enfants: []
};

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    });
  });

  describe('MainDashboard Integration', () => {
    it('should load and display dashboard sections correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockElevages)
      });

      render(<MainDashboard />);

      expect(screen.getByText('Tableau de Bord')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should handle navigation between sections', async () => {
      render(<MainDashboard />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });

      // Should be able to click navigation items
      const navButtons = screen.getAllByRole('button');
      if (navButtons.length > 0) {
        fireEvent.click(navButtons[0]);
        // Navigation should work without errors
      }
    });
  });

  describe('ElevageList to AnimalList Integration', () => {
    it('should load elevages and allow viewing animals', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockElevages)
      });

      const mockOnViewAnimaux = vi.fn();
      render(<ElevageList onViewAnimaux={mockOnViewAnimaux} />);

      await waitFor(() => {
        expect(screen.getByText('Élevage Test')).toBeInTheDocument();
      });

      // Should have action buttons
      const actionButtons = screen.getAllByRole('button');
      expect(actionButtons.length).toBeGreaterThan(0);
    });

    it('should display animal count for each elevage', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockElevages)
      });

      render(<ElevageList />);

      await waitFor(() => {
        expect(screen.getByText(/5 animaux/)).toBeInTheDocument();
      });
    });
  });

  describe('AnimalList Integration', () => {
    it('should load and display animals with proper actions', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAnimaux)
      });

      render(<AnimalList elevageId={1} />);

      await waitFor(() => {
        expect(screen.getByText('TEST001')).toBeInTheDocument();
        expect(screen.getByText('Animal Test')).toBeInTheDocument();
      });
    });

    it('should handle search and filtering', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAnimaux)
      });

      const user = userEvent.setup();
      render(<AnimalList elevageId={1} />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/rechercher/i);
        expect(searchInput).toBeInTheDocument();
      });

      // Should be able to type in search
      const searchInput = screen.getByPlaceholderText(/rechercher/i);
      await user.type(searchInput, 'TEST001');
      expect(searchInput).toHaveValue('TEST001');
    });
  });

  describe('FamilyTree Integration', () => {
    it('should load and display family tree', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTreeData)
      });

      render(<FamilyTree animalId={1} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText(/arbre généalogique/i)).toBeInTheDocument();
      });
    });

    it('should handle view mode switching', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTreeData)
      });

      render(<FamilyTree animalId={1} onClose={vi.fn()} />);

      await waitFor(() => {
        const viewSelector = screen.getByRole('combobox');
        expect(viewSelector).toBeInTheDocument();
      });

      // Should be able to change view
      const viewSelector = screen.getByRole('combobox');
      fireEvent.change(viewSelector, { target: { value: 'list' } });
      expect(viewSelector).toHaveValue('list');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle API errors gracefully across components', async () => {
      mockFetch.mockRejectedValue(new Error('API Error'));

      render(<ElevageList />);

      await waitFor(() => {
        expect(screen.getByText(/erreur/i)).toBeInTheDocument();
      });
    });

    it('should handle network timeouts', async () => {
      mockFetch.mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      render(<AnimalList elevageId={1} />);

      await waitFor(() => {
        expect(screen.getByText(/erreur/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Form Integration', () => {
    it('should handle form submission workflows', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockElevages)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: 'Success' })
        });

      render(<ElevageList />);

      await waitFor(() => {
        const addButton = screen.getByText(/nouveau/i);
        fireEvent.click(addButton);
      });

      // Form should appear
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('should handle form validation and submission', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' })
      });

      render(<ElevageList />);

      await waitFor(() => {
        const addButton = screen.getByText(/nouveau/i);
        fireEvent.click(addButton);
      });

      // Should be able to fill and submit form
      const nameInput = screen.getByLabelText(/nom/i);
      fireEvent.change(nameInput, { target: { value: 'Test Elevage' } });
      expect(nameInput).toHaveValue('Test Elevage');
    });
  });

  describe('Data Flow Integration', () => {
    it('should maintain data consistency across components', async () => {
      const responseData = mockElevages;
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseData)
      });

      render(<ElevageList />);

      await waitFor(() => {
        expect(screen.getByText('Élevage Test')).toBeInTheDocument();
      });

      // Data should be consistent across re-renders
      expect(screen.getByText('Description test')).toBeInTheDocument();
    });

    it('should handle real-time data updates', async () => {
      let responseData = mockElevages;
      mockFetch.mockImplementation(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(responseData)
      }));

      const { rerender } = render(<ElevageList />);

      await waitFor(() => {
        expect(screen.getByText('Élevage Test')).toBeInTheDocument();
      });

      // Simulate data update
      responseData = [...mockElevages, {
        id: 2,
        nom: 'Nouvel Élevage',
        description: 'Nouvelle description',
        user_id: 1,
        users: [],
        animaux_count: 0
      }];

      rerender(<ElevageList />);

      // Component should handle data updates
      expect(screen.getByText('Élevage Test')).toBeInTheDocument();
    });
  });

  describe('Performance Integration', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        identifiant_officiel: `TEST${String(i + 1).padStart(3, '0')}`,
        nom: `Animal ${i + 1}`,
        sexe: i % 2 === 0 ? 'M' : 'F',
        race_nom: 'Holstein',
        statut: 'vivant',
        elevage_id: 1
      }));

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(largeDataset)
      });

      const startTime = performance.now();
      render(<AnimalList elevageId={1} />);

      await waitFor(() => {
        expect(screen.getByText('TEST001')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render in reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000);
    });

    it('should handle rapid user interactions', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAnimaux)
      });

      const user = userEvent.setup();
      render(<AnimalList elevageId={1} />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/rechercher/i);
        expect(searchInput).toBeInTheDocument();
      });

      // Rapid typing should not break the component
      const searchInput = screen.getByPlaceholderText(/rechercher/i);
      await user.type(searchInput, 'abcdefghijklmnop', { delay: 10 });

      expect(searchInput).toHaveValue('abcdefghijklmnop');
    });
  });
});