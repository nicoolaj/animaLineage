import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

interface TypeAnimalFormProps {
  typeId?: string;
  onSave?: () => void;
  onCancel?: () => void;
}

const TypeAnimalForm: React.FC<TypeAnimalFormProps> = ({ typeId, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    nom: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isEdit, setIsEdit] = useState(false);

  const { getAuthHeaders } = useAuth();

  const fetchType = useCallback(async () => {
    if (!typeId) return;

    try {
      const response = await fetch(`${API_BASE_URL}api/types-animaux/${typeId}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          nom: data.nom || '',
          description: data.description || ''
        });
      } else {
        setError('Erreur lors du chargement du type d\'animal.');
      }
    } catch (error) {
      console.error('Error fetching type:', error);
      setError('Erreur de connexion lors du chargement.');
    }
  }, [typeId, getAuthHeaders]);

  useEffect(() => {
    if (typeId) {
      setIsEdit(true);
      fetchType();
    }
  }, [typeId, fetchType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    if (!formData.nom.trim()) {
      setError('Le nom est requis.');
      setLoading(false);
      return;
    }

    try {
      const url = isEdit
        ? `${API_BASE_URL}api/types-animaux/${typeId}`
        : `${API_BASE_URL}api/types-animaux`;

      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
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
      console.error('Error saving type:', error);
      setError('Erreur de connexion lors de la sauvegarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="typeanimalform-type-animal-form-1" className="type-animal-form">
      <div id="typeanimalform-form-header-2" className="form-header">
        <h2>{isEdit ? 'Modifier le type d\'animal' : 'Nouveau type d\'animal'}</h2>
      </div>

      {error && (
        <div id="typeanimalform-error-message-3" className="error-message">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div id="typeanimalform-form-group-4" className="form-group">
          <label htmlFor="nom">
            Nom du type <span className="required">*</span>
          </label>
          <input
            type="text"
            id="nom"
            name="nom"
            value={formData.nom}
            onChange={handleInputChange}
            required
            placeholder="Ex: Bovin, Ovin, Caprin..."
          />
        </div>

        <div id="typeanimalform-form-group-5" className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            placeholder="Description du type d'animal..."
          />
        </div>

        <div id="typeanimalform-form-actions-6" className="form-actions">
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

export default TypeAnimalForm;