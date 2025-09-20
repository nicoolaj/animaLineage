import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

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
  const API_BASE_URL = 'http://localhost:3001/api';

  const fetchTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/types-animaux`, {
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
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce type d\'animal ?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/types-animaux/${id}`, {
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
    return <div id="typesanimauxlist-loading-1" className="loading">Chargement des types d'animaux...</div>;
  }

  return (
    <div id="typesanimauxlist-types-animaux-list-2" className="types-animaux-list">
      <div id="typesanimauxlist-types-header-3" className="types-header">
        <h2>Gestion des Types d'Animaux</h2>
        <div id="typesanimauxlist-types-controls-4" className="types-controls">
          {isAdmin() && (
            <button
              className="btn-primary"
              onClick={onNewType}
            >
              Nouveau type
            </button>
          )}
        </div>
      </div>

      {error && (
        <div id="typesanimauxlist-error-message-5" className="error-message">
          ⚠️ {error}
        </div>
      )}

      {types.length === 0 ? (
        <div id="typesanimauxlist-empty-state-6" className="empty-state">
          <p>Aucun type d'animal trouvé.</p>
        </div>
      ) : (
        <div id="typesanimauxlist-types-grid-7" className="types-grid">
          {types.map((type) => (
            <div key={type.id} className="type-card">
              <div id="typesanimauxlist-type-card-header-8" className="type-card-header">
                <h3>{type.nom}</h3>
                <div id="typesanimauxlist-type-actions-9" className="type-actions">
                  {isAdmin() && (
                    <>
                      <button
                        className="btn-edit"
                        onClick={() => onEditType?.(type.id.toString())}
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => deleteType(type.id)}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>

              {type.description && (
                <div id="typesanimauxlist-type-info-10" className="type-info">
                  <div id="typesanimauxlist-info-item-11" className="info-item">
                    <strong>Description:</strong> {type.description}
                  </div>
                </div>
              )}

              <div id="typesanimauxlist-type-date-12" className="type-date">
                Créé le {new Date(type.created_at).toLocaleDateString('fr-FR')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TypesAnimauxList;