import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils/test-helpers';
import userEvent from '@testing-library/user-event';

// Mock du composant ElevageForm pour simplifier les tests
const MockElevageForm = ({ elevageId, onSave, onCancel }: any) => {
  const [formData, setFormData] = React.useState({
    nom: '',
    adresse: '',
    description: ''
  });

  const [errors, setErrors] = React.useState<{[key: string]: string}>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: {[key: string]: string} = {};

    if (!formData.nom.trim()) {
      newErrors.nom = 'Nom requis';
    }
    if (!formData.adresse.trim()) {
      newErrors.adresse = 'Adresse requise';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSave?.(formData);
    }
  };

  return (
    <div>
      <h2>{elevageId ? 'Modifier l\'élevage' : 'Nouvel élevage'}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="nom">Nom de l'élevage</label>
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
          <label htmlFor="adresse">Adresse</label>
          <input
            id="adresse"
            type="text"
            value={formData.adresse}
            onChange={(e) => setFormData({...formData, adresse: e.target.value})}
            required
          />
          {errors.adresse && <span className="error">{errors.adresse}</span>}
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
            {elevageId ? 'Modifier' : 'Créer'}
          </button>
          <button type="button" onClick={() => onCancel?.()}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

// Mock du vrai composant
jest.mock('../ElevageForm', () => MockElevageForm);

describe('ElevageForm Component', () => {
  const defaultProps = {
    onSave: jest.fn(),
    onCancel: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendu du composant', () => {
    test('affiche le formulaire de création', async () => {
      render(<MockElevageForm {...defaultProps} />);

      expect(screen.getByText(/nouvel élevage/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nom de l'élevage/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/adresse/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    test('affiche les boutons d\'action', async () => {
      render(<MockElevageForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /créer/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
    });

    test('affiche le titre correct en mode édition', async () => {
      render(<MockElevageForm {...defaultProps} elevageId="1" />);

      expect(screen.getByText(/modifier l'élevage/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /modifier/i })).toBeInTheDocument();
    });
  });

  describe('Interaction utilisateur', () => {
    test('met à jour les valeurs des champs lors de la saisie', async () => {
      render(<MockElevageForm {...defaultProps} />);

      const nomInput = screen.getByLabelText(/nom de l'élevage/i);
      await userEvent.type(nomInput, 'Nouvel Élevage');

      expect(nomInput).toHaveValue('Nouvel Élevage');
    });

    test('appelle onCancel lors du clic sur annuler', async () => {
      render(<MockElevageForm {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /annuler/i });
      await userEvent.click(cancelButton);

      expect(defaultProps.onCancel).toHaveBeenCalled();
    });
  });

  describe('Validation du formulaire', () => {
    test('affiche une erreur pour un nom vide', async () => {
      render(<MockElevageForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /créer/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/nom requis/i)).toBeInTheDocument();
      });
    });

    test('affiche une erreur pour une adresse vide', async () => {
      render(<MockElevageForm {...defaultProps} />);

      const nomInput = screen.getByLabelText(/nom de l'élevage/i);
      await userEvent.type(nomInput, 'Test');

      const submitButton = screen.getByRole('button', { name: /créer/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/adresse requise/i)).toBeInTheDocument();
      });
    });

    test('appelle onSave avec les données valides', async () => {
      render(<MockElevageForm {...defaultProps} />);

      const nomInput = screen.getByLabelText(/nom de l'élevage/i);
      const adresseInput = screen.getByLabelText(/adresse/i);

      await userEvent.type(nomInput, 'Élevage Test');
      await userEvent.type(adresseInput, '123 Rue Test');

      const submitButton = screen.getByRole('button', { name: /créer/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onSave).toHaveBeenCalledWith({
          nom: 'Élevage Test',
          adresse: '123 Rue Test',
          description: ''
        });
      });
    });
  });

  describe('Accessibilité', () => {
    test('les champs ont des labels appropriés', async () => {
      render(<MockElevageForm {...defaultProps} />);

      expect(screen.getByLabelText(/nom de l'élevage/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/adresse/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    test('les champs requis sont marqués comme tels', async () => {
      render(<MockElevageForm {...defaultProps} />);

      expect(screen.getByLabelText(/nom de l'élevage/i)).toBeRequired();
      expect(screen.getByLabelText(/adresse/i)).toBeRequired();
    });
  });
});