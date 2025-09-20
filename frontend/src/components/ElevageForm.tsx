import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Race {
  id: number;
  nom: string;
  type_animal_id: number;
  type_animal_nom: string;
  description: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface ElevageFormProps {
  elevageId?: string;
  onSave?: () => void;
  onCancel?: () => void;
}

const ElevageForm: React.FC<ElevageFormProps> = ({ elevageId, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    user_id: '',
    description: '',
    races_ids: [] as number[]
  });

  const [races, setRaces] = useState<Race[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isEdit, setIsEdit] = useState(false);

  const { getAuthHeaders } = useAuth();
  const API_BASE_URL = 'http://localhost:3001/api';

  const fetchRaces = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/races`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setRaces(data);
      }
    } catch (error) {
      console.error('Error fetching races:', error);
    }
  }, [getAuthHeaders]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [getAuthHeaders]);

  const fetchElevage = useCallback(async () => {
    if (!elevageId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/elevages/${elevageId}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          nom: data.nom || '',
          adresse: data.adresse || '',
          user_id: data.user_id ? data.user_id.toString() : '',
          description: data.description || '',
          races_ids: data.races?.map((r: Race) => r.id) || []
        });
      } else {
        setError('Erreur lors du chargement de l\'élevage.');
      }
    } catch (error) {
      console.error('Error fetching elevage:', error);
      setError('Erreur de connexion lors du chargement.');
    }
  }, [elevageId, getAuthHeaders]);

  useEffect(() => {
    fetchRaces();
    fetchUsers();
    if (elevageId) {
      setIsEdit(true);
      fetchElevage();
    }
  }, [elevageId, fetchElevage, fetchRaces, fetchUsers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRaceChange = (raceId: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      races_ids: checked
        ? [...prev.races_ids, raceId]
        : prev.races_ids.filter(id => id !== raceId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.nom.trim() || !formData.adresse.trim() || !formData.user_id) {
      setError('Le nom, l\'adresse et le propriétaire sont requis.');
      setLoading(false);
      return;
    }

    try {
      const url = isEdit
        ? `${API_BASE_URL}/elevages/${elevageId}`
        : `${API_BASE_URL}/elevages`;

      const method = isEdit ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
        user_id: parseInt(formData.user_id)
      };

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        if (onSave) {
          onSave();
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erreur lors de la sauvegarde.');
      }
    } catch (error) {
      console.error('Error saving elevage:', error);
      setError('Erreur de connexion lors de la sauvegarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="elevageform-elevage-form-1" className="elevage-form">
      <div id="elevageform-form-header-2" className="form-header">
        <h2>{isEdit ? 'Modifier l\'élevage' : 'Nouveau élevage'}</h2>
      </div>

      {error && (
        <div id="elevageform-error-message-3" className="error-message">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div id="elevageform-form-group-4" className="form-group">
          <label htmlFor="nom">
            Nom de l'élevage <span className="required">*</span>
          </label>
          <input
            type="text"
            id="nom"
            name="nom"
            value={formData.nom}
            onChange={handleInputChange}
            required
            placeholder="Ex: Ferme des Prés Verts"
          />
        </div>

        <div id="elevageform-form-group-5" className="form-group">
          <label htmlFor="adresse">
            Adresse <span className="required">*</span>
          </label>
          <textarea
            id="adresse"
            name="adresse"
            value={formData.adresse}
            onChange={handleInputChange}
            required
            rows={3}
            placeholder="Adresse complète de l'élevage"
          />
        </div>

        <div id="elevageform-form-group-6" className="form-group">
          <label htmlFor="user_id">
            Propriétaire <span className="required">*</span>
          </label>
          <select
            id="user_id"
            name="user_id"
            value={formData.user_id}
            onChange={handleInputChange}
            required
          >
            <option value="">Sélectionner un utilisateur</option>
            {users
              .filter(user =>
                userSearch === '' ||
                user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                user.email.toLowerCase().includes(userSearch.toLowerCase())
              )
              .map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))
            }
          </select>
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="user-search"
          />
        </div>

        <div id="elevageform-form-group-7" className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            placeholder="Description de l'élevage, spécialités, particularités..."
          />
        </div>

        <div id="elevageform-form-group-8" className="form-group">
          <label>Races d'animaux</label>
          <div id="elevageform-races-checkbox-group-9" className="races-checkbox-group">
            {races.map((race) => (
              <label key={race.id} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={formData.races_ids.includes(race.id)}
                  onChange={(e) => handleRaceChange(race.id, e.target.checked)}
                />
                <span className="checkbox-label">
                  {race.nom}
                  <small className="race-type">
                    ({race.type_animal_nom})
                  </small>
                  {race.description && (
                    <small className="race-description">
                      {race.description}
                    </small>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div id="elevageform-form-actions-10" className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Sauvegarde...' : (isEdit ? 'Modifier' : 'Créer')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ElevageForm;