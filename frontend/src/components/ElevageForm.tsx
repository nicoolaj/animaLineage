import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isEdit, setIsEdit] = useState(false);

  const { getAuthHeaders } = useAuth();

  const fetchRaces = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}api/races`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Races disponibles chargées:', data);
        setRaces(data);
      }
    } catch (error) {
      console.error('Error fetching races:', error);
    }
  }, [getAuthHeaders]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}api/users`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Users chargés:', data);
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [getAuthHeaders]);

  const fetchElevage = useCallback(async () => {
    if (!elevageId) return;

    try {
      const response = await fetch(`${API_BASE_URL}api/elevages/${elevageId}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Élevage chargé:', data);
        console.log('Users disponibles:', users);
        console.log('Races de l\'élevage:', data.races);
        const racesIds = data.races?.map((r: Race) => r.id) || [];
        console.log('Races IDs extraits:', racesIds);

        const newFormData = {
          nom: data.nom || '',
          adresse: data.adresse || '',
          user_id: data.user_id ? String(data.user_id) : '',
          description: data.description || '',
          races_ids: racesIds
        };
        console.log('FormData mise à jour:', newFormData);
        console.log('user_id sélectionné:', newFormData.user_id);
        setFormData(newFormData);
      } else {
        setError('Erreur lors du chargement de l\'élevage.');
      }
    } catch (error) {
      console.error('Error fetching elevage:', error);
      setError('Erreur de connexion lors du chargement.');
    }
  }, [elevageId, getAuthHeaders, users]);

  useEffect(() => {
    // Charger les données de référence
    fetchRaces();
    fetchUsers();
  }, [fetchRaces, fetchUsers]);

  useEffect(() => {
    // Charger l'élevage seulement quand elevageId change ET que les users sont chargés
    if (elevageId && users.length > 0) {
      setIsEdit(true);
      fetchElevage();
    } else if (elevageId && users.length === 0) {
      setIsEdit(true);
      // On attend que les users soient chargés
    } else {
      setIsEdit(false);
      // Reset form when creating new
      setFormData({
        nom: '',
        adresse: '',
        user_id: '',
        description: '',
        races_ids: []
      });
    }
  }, [elevageId, fetchElevage, users.length]);

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
        ? `${API_BASE_URL}api/elevages/${elevageId}`
        : `${API_BASE_URL}api/elevages`;

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{isEdit ? 'Modifier l\'élevage' : 'Nouveau élevage'}</h2>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded-lg mb-4 sm:mb-6">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 space-y-6">
        <div>
          <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
            Nom de l'élevage <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="nom"
            name="nom"
            value={formData.nom}
            onChange={handleInputChange}
            required
            placeholder="Ex: Ferme des Prés Verts"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="adresse" className="block text-sm font-medium text-gray-700 mb-2">
            Adresse <span className="text-red-500">*</span>
          </label>
          <textarea
            id="adresse"
            name="adresse"
            value={formData.adresse}
            onChange={handleInputChange}
            required
            rows={3}
            placeholder="Adresse complète de l'élevage"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors resize-vertical"
          />
        </div>

        <div>
          <label htmlFor="user_id" className="block text-sm font-medium text-gray-700 mb-2">
            Propriétaire <span className="text-red-500">*</span>
          </label>
          <select
            id="user_id"
            name="user_id"
            value={formData.user_id}
            onChange={(e) => {
              console.log('Changement de propriétaire:', e.target.value);
              handleInputChange(e);
            }}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <option value="">Sélectionner un utilisateur</option>
            {users.map((user) => (
              <option key={user.id} value={String(user.id)}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          {/* Temporarily disabled search
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="user-search"
          />
          */}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            placeholder="Description de l'élevage, spécialités, particularités..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors resize-vertical"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Races d'animaux 🦕</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {races.map((race) => {
              const isChecked = formData.races_ids.includes(race.id);
              console.log(`Race ${race.nom} (ID: ${race.id}) - checked: ${isChecked}, races_ids:`, formData.races_ids);
              return (
                <label key={race.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleRaceChange(race.id, e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{race.nom}</div>
                  <div className="text-sm text-gray-700">({race.type_animal_nom})</div>
                  {race.description && (
                    <div className="text-sm text-gray-700 mt-1">{race.description}</div>
                  )}
                </div>
              </label>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
            onClick={onCancel}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
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