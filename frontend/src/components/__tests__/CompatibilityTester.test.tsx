import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import CompatibilityTester from '../CompatibilityTester';
import { AuthContext } from '../../contexts/AuthContext';
import { LanguageContext } from '../../contexts/LanguageContext';

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

const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'compatibility.title': 'Test de Compatibilité',
    'animal.male': 'Mâle',
    'animal.female': 'Femelle',
    'check.sex.compatible': 'Sexes compatibles',
    'check.relationship.none': 'Aucune relation détectée',
    'genetic.excellent': 'Excellent',
    'genetic.score': 'Score',
    'result.compatible': 'Compatible',
    'result.incompatible': 'Incompatible'
  };
  return translations[key] || key;
});

const mockLanguageContext = {
  language: 'fr',
  setLanguage: vi.fn(),
  t: mockT,
  availableLanguages: [{ code: 'fr', name: 'Français' }]
};

const mockAnimals = [
  {
    id: 1,
    nom: 'Bella',
    identifiant_officiel: 'BE001',
    sexe: 'F' as const,
    race_id: 1,
    race_nom: 'Holstein',
    type_animal_nom: 'Bovin',
    date_naissance: '2020-01-01',
    elevage_nom: 'Ferme Test'
  },
  {
    id: 2,
    nom: 'Max',
    identifiant_officiel: 'BE002',
    sexe: 'M' as const,
    race_id: 1,
    race_nom: 'Holstein',
    type_animal_nom: 'Bovin',
    date_naissance: '2019-06-15',
    elevage_nom: 'Ferme Test'
  },
  {
    id: 3,
    nom: 'Luna',
    identifiant_officiel: 'BE003',
    sexe: 'F' as const,
    race_id: 1,
    race_nom: 'Holstein',
    type_animal_nom: 'Bovin',
    date_naissance: '2021-03-10',
    pere_id: 2, // Max is the father
    elevage_nom: 'Ferme Test'
  }
];

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <LanguageContext.Provider value={mockLanguageContext}>
        {ui}
      </LanguageContext.Provider>
    </AuthContext.Provider>
  );
};

describe('CompatibilityTester Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockAnimals
    });
  });

  test('renders component title', async () => {
    renderWithProviders(<CompatibilityTester />);

    await waitFor(() => {
      expect(screen.getByText('Test de Compatibilité')).toBeInTheDocument();
    });
  });

  test('loads animals on mount', async () => {
    renderWithProviders(<CompatibilityTester />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/animaux'),
        expect.objectContaining({
          headers: { 'Authorization': 'Bearer test-token' }
        })
      );
    });
  });

  test('allows selecting two different animals', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompatibilityTester />);

    // Wait for animals to load
    await waitFor(() => {
      expect(screen.getByText('Bella (BE001)')).toBeInTheDocument();
    });

    // Select first animal
    await user.click(screen.getByText('Bella (BE001)'));
    expect(screen.getByDisplayValue('Bella (BE001) - Holstein - F')).toBeInTheDocument();

    // Select second animal
    const maxButton = screen.getByText('Max (BE002)');
    await user.click(maxButton);
    expect(screen.getByDisplayValue('Max (BE002) - Holstein - M')).toBeInTheDocument();
  });

  test('filters animals by search term', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompatibilityTester />);

    await waitFor(() => {
      expect(screen.getByText('Bella (BE001)')).toBeInTheDocument();
    });

    // Search for "Max"
    const searchInput = screen.getAllByPlaceholderText(/rechercher/i)[0];
    await user.type(searchInput, 'Max');

    expect(screen.getByText('Max (BE002)')).toBeInTheDocument();
    expect(screen.queryByText('Bella (BE001)')).not.toBeInTheDocument();
  });

  test('performs compatibility test for compatible animals', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompatibilityTester />);

    await waitFor(() => {
      expect(screen.getByText('Bella (BE001)')).toBeInTheDocument();
    });

    // Select Bella (F) and Max (M) - different sexes, same race, no relation
    await user.click(screen.getByText('Bella (BE001)'));
    await user.click(screen.getByText('Max (BE002)'));

    // Click test button
    await user.click(screen.getByRole('button', { name: /tester la compatibilité/i }));

    await waitFor(() => {
      expect(screen.getByText(/compatible/i)).toBeInTheDocument();
      expect(screen.getByText(/sexes compatibles/i)).toBeInTheDocument();
    });
  });

  test('detects parent-child relationship', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompatibilityTester />);

    await waitFor(() => {
      expect(screen.getByText('Luna (BE003)')).toBeInTheDocument();
    });

    // Select Max (father) and Luna (daughter)
    await user.click(screen.getByText('Max (BE002)'));
    await user.click(screen.getByText('Luna (BE003)'));

    await user.click(screen.getByRole('button', { name: /tester la compatibilité/i }));

    await waitFor(() => {
      expect(screen.getByText(/incompatible/i)).toBeInTheDocument();
      expect(screen.getByText(/parent\/enfant/i)).toBeInTheDocument();
    });
  });

  test('detects same sex incompatibility', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompatibilityTester />);

    await waitFor(() => {
      expect(screen.getByText('Bella (BE001)')).toBeInTheDocument();
    });

    // Select two females
    await user.click(screen.getByText('Bella (BE001)'));
    await user.click(screen.getByText('Luna (BE003)'));

    await user.click(screen.getByRole('button', { name: /tester la compatibilité/i }));

    await waitFor(() => {
      expect(screen.getByText(/incompatible/i)).toBeInTheDocument();
    });
  });

  test('shows genetic diversity analysis', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompatibilityTester />);

    await waitFor(() => {
      expect(screen.getByText('Bella (BE001)')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Bella (BE001)'));
    await user.click(screen.getByText('Max (BE002)'));
    await user.click(screen.getByRole('button', { name: /tester la compatibilité/i }));

    await waitFor(() => {
      expect(screen.getByText(/score/i)).toBeInTheDocument();
      expect(screen.getByText(/95\/100/)).toBeInTheDocument(); // Same race score
    });
  });

  test('requires two different animals for testing', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompatibilityTester />);

    await waitFor(() => {
      expect(screen.getByText('Bella (BE001)')).toBeInTheDocument();
    });

    // Select same animal twice
    await user.click(screen.getByText('Bella (BE001)'));
    // Try to select the same animal for second selection
    await user.click(screen.getByText('Bella (BE001)'));

    const testButton = screen.getByRole('button', { name: /tester la compatibilité/i });
    expect(testButton).toBeDisabled();
  });

  test('clears results when new animals are selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompatibilityTester />);

    await waitFor(() => {
      expect(screen.getByText('Bella (BE001)')).toBeInTheDocument();
    });

    // Perform initial test
    await user.click(screen.getByText('Bella (BE001)'));
    await user.click(screen.getByText('Max (BE002)'));
    await user.click(screen.getByRole('button', { name: /tester la compatibilité/i }));

    await waitFor(() => {
      expect(screen.getByText(/compatible/i)).toBeInTheDocument();
    });

    // Select different animal
    await user.click(screen.getByText('Luna (BE003)'));

    // Results should be cleared
    expect(screen.queryByText(/compatible/i)).not.toBeInTheDocument();
  });

  test('handles API error gracefully', async () => {
    (fetch as any).mockRejectedValue(new Error('API Error'));

    renderWithProviders(<CompatibilityTester />);

    await waitFor(() => {
      expect(screen.getByText(/erreur lors du chargement/i)).toBeInTheDocument();
    });
  });
});