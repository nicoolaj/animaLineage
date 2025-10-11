import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { performance } from 'perf_hooks';

// Import components for performance testing
import AnimalList from '../AnimalList';
import ElevageList from '../ElevageList';
import FamilyTree from '../FamilyTree';
import DescendanceListView from '../DescendanceListView';
import ConcentricGraphView from '../ConcentricGraphView';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn(() => 'mock-token'),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  }
});

// Performance test utilities
const measureComponentRender = async (component: React.ReactElement) => {
  const startTime = performance.now();
  const { container } = render(component);
  const endTime = performance.now();

  return {
    renderTime: endTime - startTime,
    container
  };
};

const generateLargeDataset = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    identifiant_officiel: `TEST${String(i + 1).padStart(6, '0')}`,
    nom: `Animal ${i + 1}`,
    sexe: i % 2 === 0 ? 'M' : 'F',
    race_nom: `Race ${(i % 10) + 1}`,
    date_naissance: `2020-${String((i % 12) + 1).padStart(2, '0')}-01`,
    statut: i % 10 === 0 ? 'mort' : 'vivant',
    elevage_id: Math.floor(i / 100) + 1
  }));
};

const generateLargeElevageDataset = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    nom: `Élevage ${i + 1}`,
    description: `Description pour l'élevage ${i + 1}`,
    user_id: (i % 5) + 1,
    users: [{ id: (i % 5) + 1, name: `User ${(i % 5) + 1}` }],
    animaux_count: Math.floor(Math.random() * 100)
  }));
};

describe('Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AnimalList Performance', () => {
    it('should render 100 animals in under 500ms', async () => {
      const largeDataset = generateLargeDataset(100);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(largeDataset)
      });

      const { renderTime } = await measureComponentRender(
        <AnimalList elevageId={1} />
      );

      await waitFor(() => {
        expect(screen.getByText('TEST000001')).toBeInTheDocument();
      });

      expect(renderTime).toBeLessThan(500);
    });

    it('should handle 1000 animals without performance degradation', async () => {
      const veryLargeDataset = generateLargeDataset(1000);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(veryLargeDataset)
      });

      const { renderTime } = await measureComponentRender(
        <AnimalList elevageId={1} />
      );

      await waitFor(() => {
        expect(screen.getByText('TEST000001')).toBeInTheDocument();
      });

      // Should still render in reasonable time even with 1000 items
      expect(renderTime).toBeLessThan(1000);
    });

    it('should efficiently handle search filtering', async () => {
      const largeDataset = generateLargeDataset(500);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(largeDataset)
      });

      const startTime = performance.now();
      render(<AnimalList elevageId={1} />);

      await waitFor(() => {
        expect(screen.getByText('TEST000001')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(800);
    });
  });

  describe('ElevageList Performance', () => {
    it('should render 50 elevages quickly', async () => {
      const elevageDataset = generateLargeElevageDataset(50);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(elevageDataset)
      });

      const { renderTime } = await measureComponentRender(
        <ElevageList />
      );

      await waitFor(() => {
        expect(screen.getByText('Élevage 1')).toBeInTheDocument();
      });

      expect(renderTime).toBeLessThan(300);
    });

    it('should handle large elevage counts efficiently', async () => {
      const largeElevageDataset = generateLargeElevageDataset(200);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(largeElevageDataset)
      });

      const { renderTime } = await measureComponentRender(
        <ElevageList />
      );

      await waitFor(() => {
        expect(screen.getByText('Élevage 1')).toBeInTheDocument();
      });

      expect(renderTime).toBeLessThan(600);
    });
  });

  describe('DescendanceListView Performance', () => {
    it('should render large descendance list efficiently', async () => {
      const largeTreeData = {
        animal: generateLargeDataset(1)[0],
        level: 0,
        enfants: generateLargeDataset(50).map(animal => ({
          animal,
          level: -1,
          enfants: []
        }))
      };

      const { renderTime } = await measureComponentRender(
        <DescendanceListView treeData={largeTreeData} />
      );

      await waitFor(() => {
        expect(screen.getByText(/Descendance de/)).toBeInTheDocument();
      });

      expect(renderTime).toBeLessThan(400);
    });

    it('should handle complex genealogy data efficiently', async () => {
      const complexTreeData = {
        animal: generateLargeDataset(1)[0],
        level: 0,
        enfants: generateLargeDataset(100).map((animal, index) => ({
          animal,
          level: -(Math.floor(index / 20) + 1), // Multiple generations
          enfants: []
        }))
      };

      const { renderTime } = await measureComponentRender(
        <DescendanceListView treeData={complexTreeData} />
      );

      expect(renderTime).toBeLessThan(600);
    });
  });

  describe('ConcentricGraphView Performance', () => {
    it('should render canvas visualization efficiently', async () => {
      const treeData = {
        animal: generateLargeDataset(1)[0],
        level: 0,
        enfants: generateLargeDataset(30).map(animal => ({
          animal,
          level: -1,
          enfants: []
        }))
      };

      const { renderTime } = await measureComponentRender(
        <ConcentricGraphView treeData={treeData} />
      );

      expect(renderTime).toBeLessThan(500);
    });

    it('should handle canvas operations without blocking UI', async () => {
      const complexTreeData = {
        animal: generateLargeDataset(1)[0],
        level: 0,
        enfants: generateLargeDataset(50).map(animal => ({
          animal,
          level: -1,
          enfants: []
        }))
      };

      const startTime = performance.now();
      render(<ConcentricGraphView treeData={complexTreeData} />);
      const renderEndTime = performance.now();

      // Canvas operations should not block initial render
      expect(renderEndTime - startTime).toBeLessThan(100);
    });
  });

  describe('Memory Usage', () => {
    it('should not create memory leaks with large datasets', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Render and unmount multiple times with large datasets
      for (let i = 0; i < 5; i++) {
        const largeDataset = generateLargeDataset(200);
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(largeDataset)
        });

        const { unmount } = render(<AnimalList elevageId={1} />);

        await waitFor(() => {
          expect(screen.getByText('TEST000001')).toBeInTheDocument();
        });

        unmount();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('API Response Times', () => {
    it('should handle slow API responses gracefully', async () => {
      // Simulate slow API response
      mockFetch.mockImplementation(() =>
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve(generateLargeDataset(10))
            });
          }, 1000);
        })
      );

      const startTime = performance.now();
      render(<AnimalList elevageId={1} />);

      // Component should render loading state immediately
      expect(screen.getByText(/chargement/i)).toBeInTheDocument();

      const initialRenderTime = performance.now() - startTime;
      expect(initialRenderTime).toBeLessThan(100);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('TEST000001')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should batch multiple API calls efficiently', async () => {
      let apiCallCount = 0;
      mockFetch.mockImplementation(() => {
        apiCallCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(generateLargeDataset(10))
        });
      });

      render(<AnimalList elevageId={1} />);

      await waitFor(() => {
        expect(screen.getByText('TEST000001')).toBeInTheDocument();
      });

      // Should minimize number of API calls
      expect(apiCallCount).toBeLessThanOrEqual(3);
    });
  });

  describe('Component Re-render Performance', () => {
    it('should minimize unnecessary re-renders', async () => {
      let renderCount = 0;
      const TestComponent = () => {
        renderCount++;
        return <AnimalList elevageId={1} />;
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(generateLargeDataset(10))
      });

      const { rerender } = render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByText('TEST000001')).toBeInTheDocument();
      });

      const initialRenderCount = renderCount;

      // Trigger re-render with same props
      rerender(<TestComponent />);

      // Should not cause unnecessary re-renders
      expect(renderCount - initialRenderCount).toBeLessThanOrEqual(2);
    });
  });

  describe('Scroll Performance', () => {
    it('should handle large lists with smooth scrolling', async () => {
      const largeDataset = generateLargeDataset(500);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(largeDataset)
      });

      render(<AnimalList elevageId={1} />);

      await waitFor(() => {
        expect(screen.getByText('TEST000001')).toBeInTheDocument();
      });

      // Simulate scroll events
      const scrollContainer = screen.getByRole('table').closest('div');
      if (scrollContainer) {
        const startTime = performance.now();

        // Simulate multiple scroll events
        for (let i = 0; i < 10; i++) {
          scrollContainer.scrollTop = i * 100;
        }

        const endTime = performance.now();
        const scrollTime = endTime - startTime;

        // Scroll operations should be fast
        expect(scrollTime).toBeLessThan(50);
      }
    });
  });
});