import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

interface TypeAnimal {
  id: number;
  nom: string;
  description: string;
}

interface RaceFormProps {
  raceId?: string;
  onSave?: () => void;
  onCancel?: () => void;
}

const RaceForm: React.FC<RaceFormProps> = ({ raceId, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    nom: '',
    type_animal_id: '',
    description: ''
  });

  const [typesAnimaux, setTypesAnimaux] = useState<TypeAnimal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isEdit, setIsEdit] = useState(false);

  const { getAuthHeaders } = useAuth();

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

  const fetchRace = useCallback(async () => {
    if (!raceId) return;

    try {
      const response = await fetch(`${API_BASE_URL}api/races/${raceId}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          nom: data.nom || '',
          type_animal_id: data.type_animal_id ? data.type_animal_id.toString() : '',
          description: data.description || ''
        });
      } else {
        setError('Erreur lors du chargement de la race.');
      }
    } catch (error) {
      console.error('Error fetching race:', error);
      setError('Erreur de connexion lors du chargement.');
    }
  }, [raceId, getAuthHeaders]);

  useEffect(() => {
    fetchTypesAnimaux();
    if (raceId) {
      setIsEdit(true);
      fetchRace();
    }
  }, [raceId, fetchTypesAnimaux, fetchRace]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.nom.trim() || !formData.type_animal_id) {
      setError('Le nom et le type d\'animal sont requis.');
      setLoading(false);
      return;
    }

    try {
      const url = isEdit
        ? `${API_BASE_URL}api/races/${raceId}`
        : `${API_BASE_URL}api/races`;

      const method = isEdit ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
        type_animal_id: parseInt(formData.type_animal_id)
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
      console.error('Error saving race:', error);
      setError('Erreur de connexion lors de la sauvegarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="raceform-race-form-1" className="race-form">
      <div id="raceform-form-header-2" className="form-header">
        <h2>{isEdit ? 'Modifier la race' : 'Nouvelle race'}</h2>
      </div>

      {error && (
        <div id="raceform-error-message-3" className="error-message">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div id="raceform-form-group-4" className="form-group">
          <label htmlFor="nom">
            Nom de la race <span className="required">*</span>
          </label>
          <input
            type="text"
            id="nom"
            name="nom"
            value={formData.nom}
            onChange={handleInputChange}
            required
            placeholder="Ex: Holstein, Charolaise, Lacaune..."
          />
        </div>

        <div id="raceform-form-group-5" className="form-group">
          <label htmlFor="type_animal_id">
            Type d'animal <span className="required">*</span>
          </label>
          <select
            id="type_animal_id"
            name="type_animal_id"
            value={formData.type_animal_id}
            onChange={handleInputChange}
            required
          >
            <option value="">Sélectionner un type</option>
            {typesAnimaux.map((type) => (
              <option key={type.id} value={type.id}>
                {type.nom}
              </option>
            ))}
          </select>
        </div>

        <div id="raceform-form-group-6" className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            placeholder="Description de la race..."
          />
        </div>

        <div id="raceform-form-actions-7" className="form-actions">
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

export default RaceForm;