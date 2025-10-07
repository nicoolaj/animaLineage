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
    return (
      <div className="max-w-7xl mx-auto py-6 sm:py-8">
        <div className="flex items-center justify-center p-8">
          <div className="text-gray-900">Chargement des races...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
          🐎 Gestion des Races
        </h2>
        <p className="text-gray-700 mt-2 text-base sm:text-lg">Classification détaillée des races par type d'animal.</p>
        <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-gray-700 bg-white"
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
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={onNewRace}
            >
              Nouvelle race
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded-lg mb-6">
          ⚠️ {error}
        </div>
      )}

      {races.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-700">
            <div className="text-4xl mb-4">🐎</div>
            <p className="text-lg">Aucune race trouvée.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {races.map((race) => (
            <div key={race.id} className="bg-white rounded-lg shadow-md border border-gray-200 min-h-fit">
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 flex-1">{race.nom}</h3>
                  <div className="flex gap-2 ml-3">
                    {isAdmin() && (
                      <>
                        <button
                          className="p-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                          onClick={() => onEditRace?.(race.id.toString())}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          className="p-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          onClick={() => deleteRace(race.id)}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-3">
                <div className="text-sm text-gray-800">
                  <span className="font-medium text-gray-900">Type d'animal 🦕:</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2">
                    {race.type_animal_nom}
                  </span>
                </div>
                {race.description && (
                  <div className="text-sm text-gray-800">
                    <span className="font-medium text-gray-900">Description:</span> {race.description}
                  </div>
                )}
              </div>

              <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-100">
                <div className="text-xs text-gray-700">
                  Créée le {new Date(race.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RacesList;