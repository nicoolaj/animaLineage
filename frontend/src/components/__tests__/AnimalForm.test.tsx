import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import AnimalForm from '../AnimalForm';
import { AuthContext } from '../../contexts/AuthContext';
import { LanguageContext } from '../../contexts/LanguageContext';

// Mock fetch
global.fetch = vi.fn();

const mockGetAuthHeaders = vi.fn(() => ({ 'Authorization': 'Bearer test-token' }));
const mockOnSubmit = vi.fn();
const mockOnCancel = vi.fn();

const mockAuthContext = {
  user: { id: 1, name: 'Test User' },
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getAuthHeaders: mockGetAuthHeaders,
  isAuthenticated: true,
  loading: false
};

const mockT = vi.fn((key: string) => key);

const mockLanguageContext = {
  language: 'fr',
  setLanguage: vi.fn(),
  t: mockT,
  availableLanguages: [{ code: 'fr', name: 'Français' }]
};

const mockRaces = [
  { id: 1, nom: 'Holstein', type_animal_nom: 'Bovin' },
  { id: 2, nom: 'Charolaise', type_animal_nom: 'Bovin' }
];

const mockAnimals = [
  {
    id: 1,
    nom: 'Père Test',
    identifiant_officiel: 'PT001',
    sexe: 'M',
    race_nom: 'Holstein'
  },
  {
    id: 2,
    nom: 'Mère Test',
    identifiant_officiel: 'MT001',
    sexe: 'F',
    race_nom: 'Holstein'
  }
];

const defaultProps = {
  elevageId: 1,
  onSubmit: mockOnSubmit,
  onCancel: mockOnCancel
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <LanguageContext.Provider value={mockLanguageContext}>
        {ui}
      </LanguageContext.Provider>
    </AuthContext.Provider>
  );
};

describe('AnimalForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/races')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockRaces
        });
      }
      if (url.includes('/api/animaux')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockAnimals
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      });
    });
  });

  test('renders form with required fields', async () => {
    renderWithProviders(<AnimalForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/identifiant officiel/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nom/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sexe/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/race/i)).toBeInTheDocument();
    });
  });

  test('loads races and animals on mount', async () => {
    renderWithProviders(<AnimalForm {...defaultProps} />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/races'),
        expect.any(Object)
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/animaux'),
        expect.any(Object)
      );
    });
  });

  test('populates form when editing existing animal', async () => {
    const existingAnimal = {
      id: 1,
      identifiant_officiel: 'TEST001',
      nom: 'Test Animal',
      sexe: 'M' as const,
      race_id: 1,
      date_naissance: '2020-01-01',
      pere_id: 1,
      mere_id: 2
    };

    renderWithProviders(<AnimalForm {...defaultProps} animal={existingAnimal} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('TEST001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Animal')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2020-01-01')).toBeInTheDocument();
    });
  });

  test('validates required fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AnimalForm {...defaultProps} />);

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /enregistrer/i });
    await user.click(submitButton);

    // Should not call onSubmit because of validation
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('submits form with valid data', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AnimalForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/identifiant officiel/i)).toBeInTheDocument();
    });

    // Fill in required fields
    await user.type(screen.getByLabelText(/identifiant officiel/i), 'TEST001');
    await user.type(screen.getByLabelText(/nom/i), 'Test Animal');

    // Select sex
    const sexSelect = screen.getByLabelText(/sexe/i);
    await user.selectOptions(sexSelect, 'M');

    // Wait for races to load and select one
    await waitFor(() => {
      const raceSelect = screen.getByLabelText(/race/i);
      expect(raceSelect).toBeInTheDocument();
    });

    const raceSelect = screen.getByLabelText(/race/i);
    await user.selectOptions(raceSelect, '1');

    // Add birth date
    await user.type(screen.getByLabelText(/date de naissance/i), '2020-01-01');

    // Submit form
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          identifiant_officiel: 'TEST001',
          nom: 'Test Animal',
          sexe: 'M',
          race_id: 1,
          date_naissance: '2020-01-01'
        })
      );
    });
  });

  test('shows death date warning when filled', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AnimalForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/date de décès/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/date de décès/i), '2023-01-01');

    expect(screen.getByText(/renseigner cette date retire automatiquement/i)).toBeInTheDocument();
  });

  test('filters parent options by sex', async () => {
    renderWithProviders(<AnimalForm {...defaultProps} />);

    await waitFor(() => {
      const pereSelect = screen.getByLabelText(/père/i);
      const mereSelect = screen.getByLabelText(/mère/i);

      expect(pereSelect).toBeInTheDocument();
      expect(mereSelect).toBeInTheDocument();
    });

    // Check that père options only show males and mère options only show females
    const pereSelect = screen.getByLabelText(/père/i);
    const mereSelect = screen.getByLabelText(/mère/i);

    expect(pereSelect.querySelectorAll('option')).toHaveLength(2); // 1 option + empty option
    expect(mereSelect.querySelectorAll('option')).toHaveLength(2); // 1 option + empty option
  });

  test('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AnimalForm {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /annuler/i }));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('validates date constraints', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AnimalForm {...defaultProps} />);

    const birthDateInput = screen.getByLabelText(/date de naissance/i);
    const deathDateInput = screen.getByLabelText(/date de décès/i);

    // Test future birth date (should be prevented by max attribute)
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateString = futureDate.toISOString().split('T')[0];

    await user.type(birthDateInput, futureDateString);

    // The input should have max constraint
    expect(birthDateInput.getAttribute('max')).toBe(new Date().toISOString().split('T')[0]);
  });

  test('shows loading state during submission', async () => {
    const user = userEvent.setup();
    const slowOnSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderWithProviders(<AnimalForm {...defaultProps} onSubmit={slowOnSubmit} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/identifiant officiel/i)).toBeInTheDocument();
    });

    // Fill required fields
    await user.type(screen.getByLabelText(/identifiant officiel/i), 'TEST001');
    await user.selectOptions(screen.getByLabelText(/sexe/i), 'M');
    await user.selectOptions(screen.getByLabelText(/race/i), '1');

    await user.click(screen.getByRole('button', { name: /enregistrer/i }));

    // Should show loading state
    expect(screen.getByText(/enregistrement/i)).toBeInTheDocument();
  });

  test('handles API errors gracefully', async () => {
    (fetch as any).mockRejectedValue(new Error('API Error'));

    renderWithProviders(<AnimalForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/erreur lors du chargement/i)).toBeInTheDocument();
    });
  });
});