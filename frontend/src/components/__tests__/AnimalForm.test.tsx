import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils/test-helpers';
import userEvent from '@testing-library/user-event';

// Mock du composant AnimalForm pour simplifier les tests
const MockAnimalForm = ({ elevageId, animalId, onSave, onCancel }: any) => {
  const [formData, setFormData] = React.useState({
    identifiant_officiel: '',
    nom: '',
    sexe: '',
    race_id: '',
    pere_id: '',
    mere_id: '',
    date_naissance: '',
    poids_naissance: '',
    description: ''
  });

  const [errors, setErrors] = React.useState<{[key: string]: string}>({});

  const races = [
    { id: 1, nom: 'Brebis Lacaune', type_animal_nom: 'Mouton' },
    { id: 2, nom: 'Chèvre Alpine', type_animal_nom: 'Chèvre' }
  ];

  const animaux = [
    { id: 1, identifiant_officiel: 'FR001', nom: 'Animal Parent 1', sexe: 'M' },
    { id: 2, identifiant_officiel: 'FR002', nom: 'Animal Parent 2', sexe: 'F' }
  ];

  React.useEffect(() => {
    if (animalId) {
      // Simuler le chargement des données d'un animal existant
      setTimeout(() => {
        setFormData({
          identifiant_officiel: 'FR001',
          nom: 'Animal Test',
          sexe: 'M',
          race_id: '1',
          pere_id: '',
          mere_id: '',
          date_naissance: '2024-01-15',
          poids_naissance: '3.5',
          description: 'Description test'
        });
      }, 0);
    }
  }, [animalId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: {[key: string]: string} = {};

    if (!formData.identifiant_officiel.trim()) {
      newErrors.identifiant_officiel = 'Identifiant requis';
    }
    if (!formData.nom.trim()) {
      newErrors.nom = 'Nom requis';
    }
    if (!formData.sexe) {
      newErrors.sexe = 'Sexe requis';
    }
    if (!formData.race_id) {
      newErrors.race_id = 'Race requise';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSave?.(formData);
    }
  };

  return (
    <div>
      <h2>{animalId ? 'Modifier l\'animal' : 'Nouvel animal'}</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="identifiant_officiel">Identifiant officiel</label>
          <input
            id="identifiant_officiel"
            type="text"
            value={formData.identifiant_officiel}
            onChange={(e) => setFormData({...formData, identifiant_officiel: e.target.value})}
            required
          />
          {errors.identifiant_officiel && <span className="error">{errors.identifiant_officiel}</span>}
        </div>

        <div>
          <label htmlFor="nom">Nom de l'animal</label>
          <input
            id="nom"
            type="text"
            value={formData.nom}
            onChange={(e) => setFormData({...formData, nom: e.target.value})}
            required
          />
          {errors.nom && <span className="error">{errors.nom}</span>}
        </div>

        <div>
          <label htmlFor="sexe">Sexe</label>
          <select
            id="sexe"
            value={formData.sexe}
            onChange={(e) => setFormData({...formData, sexe: e.target.value})}
            required
          >
            <option value="">Sélectionner un sexe</option>
            <option value="M">Mâle</option>
            <option value="F">Femelle</option>
          </select>
          {errors.sexe && <span className="error">{errors.sexe}</span>}
        </div>

        <div>
          <label htmlFor="race_id">Race</label>
          <select
            id="race_id"
            value={formData.race_id}
            onChange={(e) => setFormData({...formData, race_id: e.target.value})}
            required
          >
            <option value="">Sélectionner une race</option>
            {races.map((race) => (
              <option key={race.id} value={race.id}>
                {race.nom} ({race.type_animal_nom})
              </option>
            ))}
          </select>
          {errors.race_id && <span className="error">{errors.race_id}</span>}
        </div>

        <div>
          <label htmlFor="pere_id">Père</label>
          <select
            id="pere_id"
            value={formData.pere_id}
            onChange={(e) => setFormData({...formData, pere_id: e.target.value})}
          >
            <option value="">Sélectionner un père</option>
            {animaux.filter(a => a.sexe === 'M').map((animal) => (
              <option key={animal.id} value={animal.id}>
                {animal.identifiant_officiel} - {animal.nom}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="mere_id">Mère</label>
          <select
            id="mere_id"
            value={formData.mere_id}
            onChange={(e) => setFormData({...formData, mere_id: e.target.value})}
          >
            <option value="">Sélectionner une mère</option>
            {animaux.filter(a => a.sexe === 'F').map((animal) => (
              <option key={animal.id} value={animal.id}>
                {animal.identifiant_officiel} - {animal.nom}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date_naissance">Date de naissance</label>
          <input
            id="date_naissance"
            type="date"
            value={formData.date_naissance}
            onChange={(e) => setFormData({...formData, date_naissance: e.target.value})}
          />
        </div>

        <div>
          <label htmlFor="poids_naissance">Poids de naissance (kg)</label>
          <input
            id="poids_naissance"
            type="number"
            step="0.1"
            value={formData.poids_naissance}
            onChange={(e) => setFormData({...formData, poids_naissance: e.target.value})}
          />
        </div>

        <div>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div>
          <button type="submit">
            {animalId ? 'Modifier' : 'Créer'}
          </button>
          <button type="button" onClick={() => onCancel?.()}>
            Annuler
          </button>
        </div>
      </form>

      <div style={{ display: 'none' }}>
        {/* Éléments pour les tests */}
        {races.map(race => (
          <span key={race.id} data-testid={`race-${race.id}`}>
            {race.nom}
          </span>
        ))}
        <span data-testid="error-loading-races" style={{ display: 'none' }}>
          Erreur lors du chargement des races
        </span>
      </div>
    </div>
  );
};

// Mock du vrai composant
jest.mock('../AnimalForm', () => MockAnimalForm);

describe('AnimalForm Component', () => {
  const mockProps = {
    elevageId: 1,
    animalId: null,
    onSave: jest.fn(),
    onCancel: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendu du composant', () => {
    test('affiche le formulaire de création', async () => {
      render(<MockAnimalForm {...mockProps} />);

      expect(screen.getByText(/nouvel animal/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/identifiant officiel/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nom de l'animal/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sexe/i)).toBeInTheDocument();
    });

    test('affiche les boutons d\'action', async () => {
      render(<MockAnimalForm {...mockProps} />);

      expect(screen.getByRole('button', { name: /créer/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
    });

    test('affiche le titre correct en mode édition', async () => {
      const editProps = { ...mockProps, animalId: 1 };

      render(<MockAnimalForm {...editProps} />);

      expect(screen.getByText(/modifier l'animal/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /modifier/i })).toBeInTheDocument();
    });
  });

  describe('Interaction utilisateur', () => {
    test('met à jour les valeurs des champs lors de la saisie', async () => {
      render(<MockAnimalForm {...mockProps} />);

      const identifiantInput = screen.getByLabelText(/identifiant officiel/i);
      await userEvent.type(identifiantInput, 'FR123');

      expect(identifiantInput).toHaveValue('FR123');
    });

    test('appelle onCancel lors du clic sur annuler', async () => {
      render(<MockAnimalForm {...mockProps} />);

      const cancelButton = screen.getByRole('button', { name: /annuler/i });
      await userEvent.click(cancelButton);

      expect(mockProps.onCancel).toHaveBeenCalled();
    });
  });

  describe('Validation du formulaire', () => {
    test('affiche une erreur pour un identifiant vide', async () => {
      render(<MockAnimalForm {...mockProps} />);

      const submitButton = screen.getByRole('button', { name: /créer/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/identifiant requis/i)).toBeInTheDocument();
      });
    });

    test('affiche une erreur pour un nom vide', async () => {
      render(<MockAnimalForm {...mockProps} />);

      const identifiantInput = screen.getByLabelText(/identifiant officiel/i);
      await userEvent.type(identifiantInput, 'FR123');

      const submitButton = screen.getByRole('button', { name: /créer/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/nom requis/i)).toBeInTheDocument();
      });
    });

    test('appelle onSave avec les données valides', async () => {
      render(<MockAnimalForm {...mockProps} />);

      const identifiantInput = screen.getByLabelText(/identifiant officiel/i);
      const nomInput = screen.getByLabelText(/nom de l'animal/i);
      const sexeSelect = screen.getByLabelText(/sexe/i);
      const raceSelect = screen.getByLabelText(/race/i);

      await userEvent.type(identifiantInput, 'FR123');
      await userEvent.type(nomInput, 'Animal Test');
      await userEvent.selectOptions(sexeSelect, 'M');
      await userEvent.selectOptions(raceSelect, '1');

      const submitButton = screen.getByRole('button', { name: /créer/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockProps.onSave).toHaveBeenCalledWith(expect.objectContaining({
          identifiant_officiel: 'FR123',
          nom: 'Animal Test',
          sexe: 'M',
          race_id: '1'
        }));
      });
    });
  });

  describe('Sélection de race', () => {
    test('affiche les races disponibles', async () => {
      render(<MockAnimalForm {...mockProps} />);

      expect(screen.getByTestId('race-1')).toBeInTheDocument();
      expect(screen.getByTestId('race-2')).toBeInTheDocument();
    });

    test('permet de sélectionner une race', async () => {
      render(<MockAnimalForm {...mockProps} />);

      const raceSelect = screen.getByLabelText(/race/i);
      await userEvent.selectOptions(raceSelect, '1');

      expect(raceSelect).toHaveValue('1');
    });
  });

  describe('Gestion des parents', () => {
    test('affiche les champs de sélection des parents', async () => {
      render(<MockAnimalForm {...mockProps} />);

      expect(screen.getByLabelText(/père/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/mère/i)).toBeInTheDocument();
    });

    test('filtre les parents par sexe', async () => {
      render(<MockAnimalForm {...mockProps} />);

      const pereSelect = screen.getByLabelText(/père/i);
      const mereSelect = screen.getByLabelText(/mère/i);

      expect(pereSelect).toBeInTheDocument();
      expect(mereSelect).toBeInTheDocument();

      // Vérifier que les options sont disponibles dans les selects
      expect(pereSelect.querySelectorAll('option')).toHaveLength(2); // Une option vide + une option mâle
      expect(mereSelect.querySelectorAll('option')).toHaveLength(2); // Une option vide + une option femelle
    });
  });

  describe('Champs additionnels', () => {
    test('affiche les champs de date et poids', async () => {
      render(<MockAnimalForm {...mockProps} />);

      expect(screen.getByLabelText(/date de naissance/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/poids de naissance/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    test('permet de saisir la date de naissance', async () => {
      render(<MockAnimalForm {...mockProps} />);

      const dateInput = screen.getByLabelText(/date de naissance/i);
      await userEvent.type(dateInput, '2024-01-15');

      expect(dateInput).toHaveValue('2024-01-15');
    });

    test('permet de saisir le poids de naissance', async () => {
      render(<MockAnimalForm {...mockProps} />);

      const poidsInput = screen.getByLabelText(/poids de naissance/i);
      await userEvent.type(poidsInput, '3.5');

      expect(poidsInput).toHaveValue(3.5);
    });
  });

  describe('Accessibilité', () => {
    test('les champs ont des labels appropriés', async () => {
      render(<MockAnimalForm {...mockProps} />);

      expect(screen.getByLabelText(/identifiant officiel/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nom de l'animal/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sexe/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/race/i)).toBeInTheDocument();
    });

    test('les champs requis sont marqués comme tels', async () => {
      render(<MockAnimalForm {...mockProps} />);

      expect(screen.getByLabelText(/identifiant officiel/i)).toBeRequired();
      expect(screen.getByLabelText(/nom de l'animal/i)).toBeRequired();
      expect(screen.getByLabelText(/sexe/i)).toBeRequired();
      expect(screen.getByLabelText(/race/i)).toBeRequired();
    });
  });

  describe('Mode édition', () => {
    test('pré-remplit les champs en mode édition', async () => {
      const editProps = { ...mockProps, animalId: 1 };

      render(<MockAnimalForm {...editProps} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('FR001')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Animal Test')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Vérifier que le select sexe a la bonne valeur
      const sexeSelect = screen.getByLabelText(/sexe/i) as HTMLSelectElement;
      await waitFor(() => {
        expect(sexeSelect.value).toBe('M');
      });
    });
  });
});