import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

interface TypeAnimal {
  id: number;
  nom: string;
  description: string;
}

interface Race {
  id: number;
  nom: string;
  type_animal_id: number;
  type_animal_nom: string;
  description: string;
  created_at: string;
}

interface RacesListProps {
  onNewRace?: () => void;
  onEditRace?: (id: string) => void;
}

const RacesList: React.FC<RacesListProps> = ({ onNewRace, onEditRace }) => {
  const [races, setRaces] = useState<Race[]>([]);
  const [typesAnimaux, setTypesAnimaux] = useState<TypeAnimal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('');

  const { getAuthHeaders, isAdmin } = useAuth();

  const fetchRaces = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const url = selectedTypeFilter
        ? `${API_BASE_URL}api/races?type_id=${selectedTypeFilter}`
        : `${API_BASE_URL}api/races`;

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setRaces(data);
      } else if (response.status === 403) {
        setError('Accès refusé. Permissions insuffisantes.');
      } else {
        setError('Erreur lors du chargement des races.');
      }
    } catch (error) {
      console.error('Error fetching races:', error);
      setError('Erreur de connexion lors du chargement.');
    } finally {
      setLoading(false);
    }
  }, [selectedTypeFilter, getAuthHeaders]);

  const fetchTypesAnimaux = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}api/types-animaux`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setTypesAnimaux(data);
      }
    } catch (error) {
      console.error('Error fetching types animaux:', error);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchTypesAnimaux();
  }, [fetchTypesAnimaux]);

  useEffect(() => {
    fetchRaces();
  }, [selectedTypeFilter, fetchRaces]);

  const deleteRace = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette race ?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}api/races/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setRaces(races.filter(r => r.id !== id));
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erreur lors de la suppression.');
      }
    } catch (error) {
      console.error('Error deleting race:', error);
      setError('Erreur lors de la suppression.');
    }
  };

  if (loading) {
    return <div id="raceslist-loading-1" className="loading">Chargement des races...</div>;
  }

  return (
    <div id="raceslist-races-list-2" className="races-list">
      <div id="raceslist-races-header-3" className="races-header">
        <h2>Gestion des Races</h2>
        <div id="raceslist-races-controls-4" className="races-controls">
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="type-filter"
          >
            <option value="">Tous les types</option>
            {typesAnimaux.map((type) => (
              <option key={type.id} value={type.id}>
                {type.nom}
              </option>
            ))}
          </select>
          {isAdmin() && (
            <button
              className="btn-primary"
              onClick={onNewRace}
            >
              Nouvelle race
            </button>
          )}
        </div>
      </div>

      {error && (
        <div id="raceslist-error-message-5" className="error-message">
          ⚠️ {error}
        </div>
      )}

      {races.length === 0 ? (
        <div id="raceslist-empty-state-6" className="empty-state">
          <p>Aucune race trouvée.</p>
        </div>
      ) : (
        <div id="raceslist-races-grid-7" className="races-grid">
          {races.map((race) => (
            <div key={race.id} className="race-card">
              <div id="raceslist-race-card-header-8" className="race-card-header">
                <h3>{race.nom}</h3>
                <div id="raceslist-race-actions-9" className="race-actions">
                  {isAdmin() && (
                    <>
                      <button
                        className="btn-edit"
                        onClick={() => onEditRace?.(race.id.toString())}
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => deleteRace(race.id)}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div id="raceslist-race-info-10" className="race-info">
                <div id="raceslist-info-item-11" className="info-item">
                  <strong>Type d'animal 🦕:</strong> {race.type_animal_nom}
                </div>
                {race.description && (
                  <div id="raceslist-info-item-12" className="info-item">
                    <strong>Description:</strong> {race.description}
                  </div>
                )}
              </div>

              <div id="raceslist-race-date-13" className="race-date">
                Créée le {new Date(race.created_at).toLocaleDateString('fr-FR')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RacesList;