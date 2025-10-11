import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

interface Race {
  id: number;
  nom: string;
  type_animal_nom: string;
  description: string;
}

interface Elevage {
  id: number;
  nom: string;
  adresse: string;
  user_id: number;
  proprietaire_nom: string;
  description: string;
  created_at: string;
  races: Race[];
}

interface ElevageListProps {
  onNewElevage?: () => void;
  onEditElevage?: (id: string) => void;
  onViewAnimaux?: (elevageId: number) => void;
}

const ElevageList: React.FC<ElevageListProps> = ({ onNewElevage, onEditElevage, onViewAnimaux }) => {
  const [elevages, setElevages] = useState<Elevage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showMyOnly, setShowMyOnly] = useState(false);

  const { getAuthHeaders, user, isAdmin, canModerate } = useAuth();

  const fetchElevages = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const url = showMyOnly
        ? `${API_BASE_URL}api/elevages?my=true`
        : `${API_BASE_URL}api/elevages`;

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setElevages(data);
      } else if (response.status === 403) {
        setError('Accès refusé. Permissions insuffisantes.');
      } else {
        setError('Erreur lors du chargement des élevages.');
      }
    } catch (error) {
      console.error('Error fetching elevages:', error);
      setError('Erreur de connexion lors du chargement.');
    } finally {
      setLoading(false);
    }
  }, [showMyOnly, getAuthHeaders]);

  useEffect(() => {
    fetchElevages();
  }, [showMyOnly, fetchElevages]);

  const deleteElevage = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet élevage ?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/elevages/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setElevages(elevages.filter(e => e.id !== id));
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erreur lors de la suppression.');
      }
    } catch (error) {
      console.error('Error deleting elevage:', error);
      setError('Erreur lors de la suppression.');
    }
  };

  const canEdit = (elevage: Elevage) => {
    return user?.role === 1 || elevage.user_id === user?.id;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:py-8">
        <div className="flex items-center justify-center p-8">
          <div className="text-gray-900">Chargement des élevages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
          🚜 Gestion des Élevages
        </h2>
        <p className="text-gray-700 mt-2 text-base sm:text-lg">Création et gestion des élevages d'animaux.</p>
        <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
          {/* Filtre pour les admins et modérateurs */}
          {(isAdmin() || canModerate()) && (
            <label className="flex items-center gap-2 text-gray-700">
              <input
                type="checkbox"
                checked={showMyOnly}
                onChange={(e) => setShowMyOnly(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">
                {isAdmin() ? 'Afficher seulement mes élevages' : 'Mes élevages uniquement'}
              </span>
            </label>
          )}
          {(isAdmin() || canModerate()) && (
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={onNewElevage}
            >
              Nouveau élevage
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded-lg mb-6">
          ⚠️ {error}
        </div>
      )}

      {elevages.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-700 mb-4">
            <div className="text-4xl mb-4">🚜</div>
            <p className="text-lg">Aucun élevage trouvé.</p>
          </div>
          {showMyOnly && (
            <button
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              onClick={() => setShowMyOnly(false)}
            >
              Voir tous les élevages
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {elevages.map((elevage) => (
            <div key={elevage.id} className="bg-white rounded-lg shadow-md border border-gray-200 min-h-fit">
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 flex-1">{elevage.nom}</h3>
                  <div className="flex gap-2 ml-3">
                    <button
                      className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={() => onViewAnimaux?.(elevage.id)}
                      title="Gestion des animaux 🦕 et utilisateurs"
                    >
                      🦕
                    </button>
                    {canEdit(elevage) && (
                      <>
                        <button
                          className="p-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                          onClick={() => onEditElevage?.(elevage.id.toString())}
                          title="Configuration de l'élevage"
                        >
                          ⚙️
                        </button>
                        <button
                          className="p-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          onClick={() => deleteElevage(elevage.id)}
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
                  <span className="font-medium text-gray-900">Propriétaire:</span> {elevage.proprietaire_nom}
                </div>
                <div className="text-sm text-gray-800">
                  <span className="font-medium text-gray-900">Adresse:</span> {elevage.adresse}
                </div>
                {elevage.description && (
                  <div className="text-sm text-gray-800">
                    <span className="font-medium text-gray-900">Description:</span> {elevage.description}
                  </div>
                )}
              </div>

              <div className="px-4 sm:px-6 pb-4">
                <div className="text-sm font-medium text-gray-900 mb-2">Races d'animaux 🦕:</div>
                {elevage.races.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {elevage.races.map((race) => (
                      <span key={race.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {race.nom} <span className="ml-1 text-blue-600">({race.type_animal_nom})</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-gray-700 italic">Aucune race spécifiée</span>
                )}
              </div>

              <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-100">
                <div className="text-xs text-gray-700">
                  Créé le {new Date(elevage.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ElevageList;
