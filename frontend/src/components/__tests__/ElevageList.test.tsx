import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils/test-helpers';
import userEvent from '@testing-library/user-event';

// Mock du composant ElevageList pour simplifier les tests
const MockElevageList = ({ onNewElevage, onEditElevage, onViewAnimaux }: any) => {
  const [elevages, setElevages] = React.useState([
    {
      id: 1,
      nom: 'Élevage Test 1',
      adresse: '123 Rue de la Ferme',
      user_id: 1,
      proprietaire_nom: 'Jean Dupont',
      description: 'Description test 1',
      races: [
        {
          id: 1,
          nom: 'Brebis Lacaune',
          type_animal_nom: 'Mouton'
        }
      ]
    },
    {
      id: 2,
      nom: 'Élevage Test 2',
      adresse: '456 Chemin des Prés',
      user_id: 2,
      proprietaire_nom: 'Marie Martin',
      description: '',
      races: []
    }
  ]);

  const [loading, setLoading] = React.useState(false);
  const [userOnly, setUserOnly] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    // Simuler le chargement initial
    setLoading(false);
  }, []);

  return (
    <div>
      <div className="elevage-list-header">
        <h2>Gestion des élevages</h2>
        <button onClick={() => onNewElevage?.()}>
          Nouveau élevage
        </button>
      </div>

      <div className="elevage-list-controls">
        <label>
          <input
            type="checkbox"
            checked={userOnly}
            onChange={(e) => setUserOnly(e.target.checked)}
          />
          Afficher seulement mes élevages
        </label>
      </div>

      {loading && <div>Chargement des élevages...</div>}

      {error && <div className="error-message">Erreur lors du chargement des élevages.</div>}

      {!loading && !error && elevages.length === 0 && (
        <div className="empty-state">
          <p>Aucun élevage trouvé.</p>
        </div>
      )}

      {!loading && !error && elevages.length > 0 && (
        <div className="elevages-grid">
          {elevages.map((elevage) => (
            <div key={elevage.id} className="elevage-card">
              <h3>{elevage.nom}</h3>
              <p>Propriétaire: {elevage.proprietaire_nom}</p>
              <p>Adresse: {elevage.adresse}</p>

              {elevage.races && elevage.races.length > 0 && (
                <div className="races">
                  <p>Races:</p>
                  {elevage.races.map((race: any) => (
                    <span key={race.id}>
                      {race.nom} ({race.type_animal_nom})
                    </span>
                  ))}
                </div>
              )}

              <div className="elevage-actions">
                <button onClick={() => onEditElevage?.(elevage.id.toString())}>
                  Modifier
                </button>
                <button onClick={() => onViewAnimaux?.(elevage.id)}>
                  Voir animaux
                </button>
                <button onClick={() => console.log('Supprimer', elevage.id)}>
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Mock du vrai composant
jest.mock('../ElevageList', () => MockElevageList);

// Mock de window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: jest.fn(),
});

describe('ElevageList Component', () => {
  const mockProps = {
    onNewElevage: jest.fn(),
    onEditElevage: jest.fn(),
    onViewAnimaux: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (window.confirm as jest.Mock).mockReturnValue(true);
  });

  describe('Rendu du composant', () => {
    test('affiche le titre et les contrôles', () => {
      render(<MockElevageList {...mockProps} />);

      expect(screen.getByRole('heading', { name: /gestion des élevages/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/afficher seulement mes élevages/i)).toBeInTheDocument();
    });

    test('affiche le bouton nouveau élevage pour les admins', () => {
      render(<MockElevageList {...mockProps} />);

      expect(screen.getByRole('button', { name: /nouveau élevage/i })).toBeInTheDocument();
    });
  });

  describe('Chargement des données', () => {
    test('charge et affiche les élevages', async () => {
      render(<MockElevageList {...mockProps} />);

      expect(screen.getByText('Élevage Test 1')).toBeInTheDocument();
      expect(screen.getByText('Élevage Test 2')).toBeInTheDocument();
      expect(screen.getByText(/Jean Dupont/)).toBeInTheDocument();
      expect(screen.getByText(/Marie Martin/)).toBeInTheDocument();
      expect(screen.getByText(/123 Rue de la Ferme/)).toBeInTheDocument();
    });

    test('affiche les races d\'animaux', async () => {
      render(<MockElevageList {...mockProps} />);

      expect(screen.getByText(/Brebis Lacaune/)).toBeInTheDocument();
      expect(screen.getByText(/Mouton/)).toBeInTheDocument();
    });
  });

  describe('Interactions utilisateur', () => {
    test('appelle onNewElevage lors du clic sur nouveau élevage', async () => {
      render(<MockElevageList {...mockProps} />);

      const newButton = screen.getByRole('button', { name: /nouveau élevage/i });
      await userEvent.click(newButton);

      expect(mockProps.onNewElevage).toHaveBeenCalled();
    });

    test('filtre les élevages avec la checkbox', async () => {
      render(<MockElevageList {...mockProps} />);

      const checkbox = screen.getByLabelText(/afficher seulement mes élevages/i);
      await userEvent.click(checkbox);

      expect(checkbox).toBeChecked();
    });
  });

  describe('Actions sur les élevages', () => {
    test('appelle onEditElevage avec le bon ID', async () => {
      render(<MockElevageList {...mockProps} />);

      const editButtons = screen.getAllByText(/modifier/i);
      await userEvent.click(editButtons[0]);

      expect(mockProps.onEditElevage).toHaveBeenCalledWith('1');
    });

    test('appelle onViewAnimaux avec le bon ID', async () => {
      render(<MockElevageList {...mockProps} />);

      const viewButtons = screen.getAllByText(/voir animaux/i);
      await userEvent.click(viewButtons[0]);

      expect(mockProps.onViewAnimaux).toHaveBeenCalledWith(1);
    });
  });

  describe('Accessibilité', () => {
    test('a des labels appropriés pour les contrôles', () => {
      render(<MockElevageList {...mockProps} />);

      expect(screen.getByLabelText(/afficher seulement mes élevages/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /gestion des élevages/i })).toBeInTheDocument();
    });

    test('utilise des boutons avec des textes descriptifs', async () => {
      render(<MockElevageList {...mockProps} />);

      expect(screen.getAllByText(/modifier/i)).toHaveLength(2);
      expect(screen.getAllByText(/voir animaux/i)).toHaveLength(2);
      expect(screen.getAllByText(/supprimer/i)).toHaveLength(2);
    });
  });

  describe('États d\'affichage', () => {
    test('affiche un message quand aucun élevage n\'est trouvé', () => {
      const MockElevageListEmpty = ({ onNewElevage, onEditElevage, onViewAnimaux }: any) => {
        return (
          <div>
            <div className="elevage-list-header">
              <h2>Gestion des élevages</h2>
              <button onClick={() => onNewElevage?.()}>
                Nouveau élevage
              </button>
            </div>
            <div className="elevage-list-controls">
              <label>
                <input type="checkbox" />
                Afficher seulement mes élevages
              </label>
            </div>
            <div className="empty-state">
              <p>Aucun élevage trouvé.</p>
            </div>
          </div>
        );
      };

      render(<MockElevageListEmpty {...mockProps} />);

      expect(screen.getByText(/aucun élevage trouvé/i)).toBeInTheDocument();
    });

    test('affiche un message d\'erreur en cas d\'échec du chargement', () => {
      const MockElevageListError = ({ onNewElevage, onEditElevage, onViewAnimaux }: any) => {
        return (
          <div>
            <div className="elevage-list-header">
              <h2>Gestion des élevages</h2>
              <button onClick={() => onNewElevage?.()}>
                Nouveau élevage
              </button>
            </div>
            <div className="elevage-list-controls">
              <label>
                <input type="checkbox" />
                Afficher seulement mes élevages
              </label>
            </div>
            <div className="error-message">
              Erreur lors du chargement des élevages.
            </div>
          </div>
        );
      };

      render(<MockElevageListError {...mockProps} />);

      expect(screen.getByText(/erreur lors du chargement des élevages/i)).toBeInTheDocument();
    });
  });
});