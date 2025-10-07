import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

interface TypeAnimal {
  id: number;
  nom: string;
  description: string;
  created_at: string;
}

interface TypesAnimauxListProps {
  onNewType?: () => void;
  onEditType?: (id: string) => void;
}

const TypesAnimauxList: React.FC<TypesAnimauxListProps> = ({ onNewType, onEditType }) => {
  const [types, setTypes] = useState<TypeAnimal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const { getAuthHeaders, isAdmin } = useAuth();

  const fetchTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}api/types-animaux`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setTypes(data);
      } else if (response.status === 403) {
        setError('Accès refusé. Permissions insuffisantes.');
      } else {
        setError('Erreur lors du chargement des types d\'animaux.');
      }
    } catch (error) {
      console.error('Error fetching types:', error);
      setError('Erreur de connexion lors du chargement.');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const deleteType = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce type d\'animal 🦕 ?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}api/types-animaux/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setTypes(types.filter(t => t.id !== id));
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erreur lors de la suppression.');
      }
    } catch (error) {
      console.error('Error deleting type:', error);
      setError('Erreur lors de la suppression.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:py-8">
        <div className="flex items-center justify-center p-8">
          <div className="text-gray-900">Chargement des types d'animaux 🦕...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
          🦕 Gestion des Types d'Animaux
        </h2>
        <p className="text-gray-700 mt-2 text-base sm:text-lg">Classification et organisation des types d'animaux.</p>
        <div className="mt-4">
          {isAdmin() && (
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={onNewType}
            >
              Nouveau type
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded-lg mb-6">
          ⚠️ {error}
        </div>
      )}

      {types.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-700">
            <div className="text-4xl mb-4">🦕</div>
            <p className="text-lg">Aucun type d'animal trouvé.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {types.map((type) => (
            <div key={type.id} className="bg-white rounded-lg shadow-md border border-gray-200 min-h-fit">
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 flex-1">{type.nom}</h3>
                  <div className="flex gap-2 ml-3">
                    {isAdmin() && (
                      <>
                        <button
                          className="p-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                          onClick={() => onEditType?.(type.id.toString())}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          className="p-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          onClick={() => deleteType(type.id)}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {type.description && (
                <div className="p-4 sm:p-6">
                  <div className="text-sm text-gray-800">
                    <span className="font-medium text-gray-900">Description:</span> {type.description}
                  </div>
                </div>
              )}

              <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-100">
                <div className="text-xs text-gray-700">
                  Créé le {new Date(type.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TypesAnimauxList;