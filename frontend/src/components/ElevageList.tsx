import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

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

  const { getAuthHeaders, user, isAdmin } = useAuth();
  const API_BASE_URL = 'http://localhost:3001/api';

  const fetchElevages = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const url = showMyOnly
        ? `${API_BASE_URL}/elevages?my=true`
        : `${API_BASE_URL}/elevages`;

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
    return <div id="elevagelist-loading-1" className="loading">Chargement des élevages...</div>;
  }

  return (
    <div id="elevagelist-elevage-list-2" className="elevage-list">
      <div id="elevagelist-elevage-header-3" className="elevage-header">
        <h2>Gestion des Élevages</h2>
        <div id="elevagelist-elevage-controls-4" className="elevage-controls">
          <label>
            <input
              type="checkbox"
              checked={showMyOnly}
              onChange={(e) => setShowMyOnly(e.target.checked)}
            />
            Afficher seulement mes élevages
          </label>
          {isAdmin() && (
            <button
              className="btn-primary"
              onClick={onNewElevage}
            >
              Nouveau élevage
            </button>
          )}
        </div>
      </div>

      {error && (
        <div id="elevagelist-error-message-5" className="error-message">
          ⚠️ {error}
        </div>
      )}

      {elevages.length === 0 ? (
        <div id="elevagelist-empty-state-6" className="empty-state">
          <p>Aucun élevage trouvé.</p>
          {showMyOnly && (
            <p>
              <button
                className="btn-secondary"
                onClick={() => setShowMyOnly(false)}
              >
                Voir tous les élevages
              </button>
            </p>
          )}
        </div>
      ) : (
        <div id="elevagelist-elevages-grid-7" className="elevages-grid">
          {elevages.map((elevage) => (
            <div key={elevage.id} className="elevage-card">
              <div id="elevagelist-elevage-card-header-8" className="elevage-card-header">
                <h3>{elevage.nom}</h3>
                <div id="elevagelist-elevage-actions-9" className="elevage-actions">
                  <button
                    className="btn-view-animals"
                    onClick={() => onViewAnimaux?.(elevage.id)}
                    title="Voir les animaux"
                  >
                    🦕 Animaux
                  </button>
                  {canEdit(elevage) && (
                    <>
                      <button
                        className="btn-edit"
                        onClick={() => onEditElevage?.(elevage.id.toString())}
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => deleteElevage(elevage.id)}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div id="elevagelist-elevage-info-10" className="elevage-info">
                <div id="elevagelist-info-item-11" className="info-item">
                  <strong>Propriétaire:</strong> {elevage.proprietaire_nom}
                </div>
                <div id="elevagelist-info-item-12" className="info-item">
                  <strong>Adresse:</strong> {elevage.adresse}
                </div>
                {elevage.description && (
                  <div id="elevagelist-info-item-13" className="info-item">
                    <strong>Description:</strong> {elevage.description}
                  </div>
                )}
              </div>

              <div id="elevagelist-races-animaux-14" className="races-animaux">
                <strong>Races d'animaux:</strong>
                {elevage.races.length > 0 ? (
                  <div id="elevagelist-races-tags-15" className="races-tags">
                    {elevage.races.map((race) => (
                      <span key={race.id} className="race-tag">
                        {race.nom} <small>({race.type_animal_nom})</small>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="no-races">Aucune race spécifiée</span>
                )}
              </div>

              <div id="elevagelist-elevage-date-16" className="elevage-date">
                Créé le {new Date(elevage.created_at).toLocaleDateString('fr-FR')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ElevageList;
