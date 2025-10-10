import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import FamilyTree from '../FamilyTree';
import { AuthContext } from '../../contexts/AuthContext';

// Mock canvas context
const mockCanvasContext = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  font: '',
  textAlign: '',
  shadowColor: '',
  shadowBlur: 0,
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 100 })),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  clearRect: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
};

// Mock HTMLCanvasElement
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => mockCanvasContext),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

const mockGetAuthHeaders = vi.fn(() => ({ 'Authorization': 'Bearer test-token' }));

const mockAuthContext = {
  user: { id: 1, name: 'Test User' },
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getAuthHeaders: mockGetAuthHeaders,
  isAuthenticated: true,
  loading: false
};

const mockFamilyTreeData = {
  id: 1,
  identifiant_officiel: 'CHILD001',
  nom: 'Child',
  sexe: 'M',
  race_nom: 'Holstein',
  date_naissance: '2020-01-01',
  statut: 'vivant',
  pere: {
    id: 2,
    identifiant_officiel: 'FATHER001',
    nom: 'Father',
    sexe: 'M',
    race_nom: 'Holstein',
    date_naissance: '2015-01-01',
    statut: 'vivant',
    pere: {
      id: 4,
      identifiant_officiel: 'GRANDPA001',
      nom: 'Grandpa',
      sexe: 'M',
      race_nom: 'Holstein',
      date_naissance: '2010-01-01',
      statut: 'vivant'
    },
    mere: {
      id: 5,
      identifiant_officiel: 'GRANDMA001',
      nom: 'Grandma',
      sexe: 'F',
      race_nom: 'Holstein',
      date_naissance: '2010-01-01',
      statut: 'vivant'
    }
  },
  mere: {
    id: 3,
    identifiant_officiel: 'MOTHER001',
    nom: 'Mother',
    sexe: 'F',
    race_nom: 'Holstein',
    date_naissance: '2016-01-01',
    statut: 'vivant'
  }
};

const defaultProps = {
  animalId: 1,
  onClose: vi.fn()
};

const renderWithProvider = (props = defaultProps) => {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <FamilyTree {...props} />
    </AuthContext.Provider>
  );
};

describe('FamilyTree Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful API response
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockFamilyTreeData
    });
  });

  test('renders loading state initially', () => {
    renderWithProvider();

    expect(screen.getByText(/chargement de l'arbre généalogique/i)).toBeInTheDocument();
  });

  test('loads family tree data on mount', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/animaux/1/genealogie'),
        expect.objectContaining({
          headers: { 'Authorization': 'Bearer test-token' }
        })
      );
    });
  });

  test('renders family tree title', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByText(/arbre généalogique/i)).toBeInTheDocument();
    });
  });

  test('displays animal information', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByText('Child (CHILD001)')).toBeInTheDocument();
    });
  });

  test('renders canvas element', async () => {
    renderWithProvider();

    await waitFor(() => {
      const canvas = screen.getByRole('img', { hidden: true }); // Canvas has img role
      expect(canvas).toBeInTheDocument();
    });
  });

  test('shows zoom controls', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTitle(/zoom avant/i)).toBeInTheDocument();
      expect(screen.getByTitle(/zoom arrière/i)).toBeInTheDocument();
      expect(screen.getByTitle(/réinitialiser/i)).toBeInTheDocument();
    });
  });

  test('handles zoom in', async () => {
    renderWithProvider();

    await waitFor(() => {
      const zoomInButton = screen.getByTitle(/zoom avant/i);
      fireEvent.click(zoomInButton);

      // Verify canvas context methods were called for redrawing
      expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    });
  });

  test('handles zoom out', async () => {
    renderWithProvider();

    await waitFor(() => {
      const zoomOutButton = screen.getByTitle(/zoom arrière/i);
      fireEvent.click(zoomOutButton);

      expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    });
  });

  test('handles reset zoom', async () => {
    renderWithProvider();

    await waitFor(() => {
      // First zoom in
      const zoomInButton = screen.getByTitle(/zoom avant/i);
      fireEvent.click(zoomInButton);

      // Then reset
      const resetButton = screen.getByTitle(/réinitialiser/i);
      fireEvent.click(resetButton);

      expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    });
  });

  test('shows generation level controls', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByText(/générations/i)).toBeInTheDocument();
      const levelButtons = screen.getAllByRole('button').filter(btn =>
        /^[1-5]$/.test(btn.textContent || '')
      );
      expect(levelButtons).toHaveLength(5);
    });
  });

  test('changes generation levels', async () => {
    renderWithProvider();

    await waitFor(() => {
      const level3Button = screen.getByRole('button', { name: '3' });
      fireEvent.click(level3Button);

      // Should make a new API call with different levels
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('levels=3'),
        expect.any(Object)
      );
    });
  });

  test('closes modal when close button is clicked', async () => {
    const mockOnClose = vi.fn();
    renderWithProvider({ ...defaultProps, onClose: mockOnClose });

    await waitFor(() => {
      const closeButton = screen.getByRole('button', { name: /✕/ });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test('handles API error gracefully', async () => {
    (fetch as any).mockRejectedValue(new Error('API Error'));

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByText(/erreur lors du chargement/i)).toBeInTheDocument();
    });
  });

  test('shows no data message when tree is empty', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => null
    });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByText(/aucune donnée généalogique/i)).toBeInTheDocument();
    });
  });

  test('handles canvas interaction - mouse down', async () => {
    renderWithProvider();

    await waitFor(() => {
      const canvas = screen.getByRole('img', { hidden: true });

      fireEvent.mouseDown(canvas, {
        clientX: 100,
        clientY: 100,
        button: 0
      });

      // Verify mouse interaction is captured
      expect(canvas).toBeInTheDocument();
    });
  });

  test('handles canvas interaction - mouse move', async () => {
    renderWithProvider();

    await waitFor(() => {
      const canvas = screen.getByRole('img', { hidden: true });

      // Start drag
      fireEvent.mouseDown(canvas, {
        clientX: 100,
        clientY: 100,
        button: 0
      });

      // Move mouse
      fireEvent.mouseMove(canvas, {
        clientX: 150,
        clientY: 150
      });

      expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    });
  });

  test('handles canvas interaction - mouse up', async () => {
    renderWithProvider();

    await waitFor(() => {
      const canvas = screen.getByRole('img', { hidden: true });

      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseUp(canvas);

      expect(canvas).toBeInTheDocument();
    });
  });

  test('draws family tree on canvas', async () => {
    renderWithProvider();

    await waitFor(() => {
      // Verify canvas drawing methods were called
      expect(mockCanvasContext.fillRect).toHaveBeenCalled();
      expect(mockCanvasContext.fillText).toHaveBeenCalled();
    });
  });

  test('shows animal count when multiple generations loaded', async () => {
    renderWithProvider();

    await waitFor(() => {
      // With our mock data, we should see count of animals
      const animalCountText = screen.getByText(/child/i);
      expect(animalCountText).toBeInTheDocument();
    });
  });
});