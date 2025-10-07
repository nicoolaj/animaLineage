import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: number;
  role_name: string;
  status: number;
}

interface ElevageUser {
  user_id: number;
  user_name: string;
  user_email: string;
  role_in_elevage: 'owner' | 'collaborator';
  added_at: string;
}

interface ElevageUsersManagementProps {
  elevageId: number;
  elevageName: string;
  onClose: () => void;
}

const ElevageUsersManagement: React.FC<ElevageUsersManagementProps> = ({
  elevageId,
  elevageName,
  onClose
}) => {
  const [elevageUsers, setElevageUsers] = useState<ElevageUser[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);

  const { getAuthHeaders, user, isAdmin, canModerate } = useAuth();

  // Vérifier si l'utilisateur peut gérer les utilisateurs de cet élevage
  const canManageUsers = useCallback(() => {
    if (!user) return false;

    // Admin peut gérer tous les élevages
    if (isAdmin()) return true;

    // Modérateur peut gérer ses élevages (vérifier si propriétaire)
    if (canModerate()) {
      const ownerUser = elevageUsers.find(eu => eu.role_in_elevage === 'owner');
      return ownerUser?.user_id === user.id;
    }

    return false;
  }, [user, isAdmin, canModerate, elevageUsers]);

  const fetchElevageUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}api/elevages/${elevageId}/users`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setElevageUsers(Array.isArray(data) ? data : []);
      } else if (response.status === 403) {
        setError('Accès refusé pour voir les utilisateurs de cet élevage.');
      } else {
        setError('Erreur lors du chargement des utilisateurs de l\'élevage.');
      }
    } catch (error) {
      console.error('Error fetching elevage users:', error);
      setError('Erreur de connexion lors du chargement.');
      setElevageUsers([]); // S'assurer que c'est un tableau vide en cas d'erreur
    } finally {
      setLoading(false);
    }
  }, [elevageId, getAuthHeaders]);

  const fetchAvailableUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}api/users`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        // Filtrer les utilisateurs déjà ajoutés à l'élevage
        const existingUserIds = Array.isArray(elevageUsers) ? elevageUsers.map(eu => eu.user_id) : [];
        const available = data.filter((u: User) => !existingUserIds.includes(u.id));
        setAvailableUsers(available);
      } else {
        setError('Erreur lors du chargement des utilisateurs disponibles.');
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
      setError('Erreur de connexion lors du chargement des utilisateurs.');
    }
  }, [getAuthHeaders, elevageUsers]);

  useEffect(() => {
    fetchElevageUsers();
  }, [fetchElevageUsers]);

  useEffect(() => {
    if (showAddUser) {
      fetchAvailableUsers();
    }
  }, [showAddUser, fetchAvailableUsers]);

  const addUserToElevage = async (userId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}api/elevages/${elevageId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          user_id: userId,
          role_in_elevage: 'collaborator'
        }),
      });

      if (response.ok) {
        setShowAddUser(false);
        setSearchTerm('');
        await fetchElevageUsers(); // Rafraîchir la liste
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erreur lors de l\'ajout de l\'utilisateur.');
      }
    } catch (error) {
      console.error('Error adding user to elevage:', error);
      setError('Erreur lors de l\'ajout de l\'utilisateur.');
    } finally {
      setLoading(false);
    }
  };

  const removeUserFromElevage = async (userId: number, userName: string) => {
    // Vérifier qu'on ne supprime pas le propriétaire
    const userToRemove = elevageUsers.find(eu => eu.user_id === userId);
    if (userToRemove?.role_in_elevage === 'owner') {
      setError('Impossible de retirer le propriétaire de l\'élevage.');
      return;
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir retirer ${userName} de cet élevage ?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}api/elevages/${elevageId}/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        await fetchElevageUsers(); // Rafraîchir la liste
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erreur lors de la suppression de l\'utilisateur.');
      }
    } catch (error) {
      console.error('Error removing user from elevage:', error);
      setError('Erreur lors de la suppression de l\'utilisateur.');
    } finally {
      setLoading(false);
    }
  };

  const filteredAvailableUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="management-container p-4 sm:p-6">
      <div className="management-header flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-gray-600 gap-3 sm:gap-4">
        <h3 className="text-lg sm:text-xl font-semibold text-white">Gestion des utilisateurs - {elevageName}</h3>
        <div className="header-actions flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {isAdmin() && (
            <span className="admin-badge bg-yellow-500 text-yellow-900 px-2 sm:px-3 py-1 rounded-full text-xs font-bold">👑 Accès administrateur</span>
          )}
          <button onClick={onClose} className="close-btn bg-red-600 hover:bg-red-700 text-white border-none rounded-full w-8 h-8 sm:w-9 sm:h-9 cursor-pointer transition-colors duration-200 flex items-center justify-center text-sm">✕</button>
        </div>
      </div>

      {error && (
        <div className="error-message bg-red-600 text-white px-3 py-2.5 rounded-md mb-4 text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading && <div className="loading text-center text-gray-300 py-4">Chargement...</div>}

      {/* Liste des utilisateurs actuels */}
      <div className="current-users-section mb-6">
        <h4 className="text-base sm:text-lg font-medium text-gray-300 mb-3 sm:mb-4">
          Utilisateurs autorisés ({Array.isArray(elevageUsers) ? elevageUsers.length : 0})
        </h4>

        {!Array.isArray(elevageUsers) || elevageUsers.length === 0 ? (
          <div className="no-users text-center text-gray-300 py-4 italic">Aucun utilisateur trouvé pour cet élevage.</div>
        ) : (
          <div className="users-list space-y-3">
            {elevageUsers.map((elevageUser) => (
              <div key={elevageUser.user_id} className="user-item bg-gray-700 border border-gray-600 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <div className="user-info flex flex-col gap-1 flex-1">
                  <span className="user-name font-semibold text-white text-sm sm:text-base">{elevageUser.user_name}</span>
                  <span className="user-email text-xs sm:text-sm text-gray-300">{elevageUser.user_email}</span>
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 sm:items-center">
                    <span className={`user-role ${elevageUser.role_in_elevage} px-2 py-1 rounded text-xs font-bold ${elevageUser.role_in_elevage === 'owner' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                      {elevageUser.role_in_elevage === 'owner' ? '👑 Propriétaire' : '🤝 Collaborateur'}
                    </span>
                    <span className="added-date text-xs text-gray-400 italic">
                      Ajouté le {new Date(elevageUser.added_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                {canManageUsers() && elevageUser.role_in_elevage !== 'owner' && (
                  <button
                    onClick={() => removeUserFromElevage(elevageUser.user_id, elevageUser.user_name)}
                    className="remove-btn bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-sm cursor-pointer transition-colors duration-200 border-none rounded w-full sm:w-auto"
                    disabled={loading}
                    title="Retirer cet utilisateur"
                  >
                    🗑️ Retirer
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section d'ajout d'utilisateurs */}
      {canManageUsers() && (
        <div className="add-users-section">
          {!showAddUser ? (
            <button
              onClick={() => setShowAddUser(true)}
              className="btn-primary w-full sm:w-auto"
              disabled={loading}
            >
              ➕ Ajouter un utilisateur
            </button>
          ) : (
            <div className="add-user-form bg-gray-700 border border-gray-600 rounded-lg p-4 sm:p-6">
              <h4 className="text-base sm:text-lg font-medium text-gray-300 mb-3 sm:mb-4">Ajouter un utilisateur</h4>

              <input
                type="text"
                placeholder="Rechercher un utilisateur par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input w-full mb-4 px-3 py-2 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />

              <div className="available-users-list max-h-48 sm:max-h-64 overflow-y-auto space-y-2 mb-4">
                {filteredAvailableUsers.length === 0 ? (
                  <div className="no-available-users text-center text-gray-300 py-4 italic text-sm">
                    {searchTerm ? 'Aucun utilisateur trouvé.' : 'Tous les utilisateurs sont déjà ajoutés.'}
                  </div>
                ) : (
                  filteredAvailableUsers.map((availableUser) => (
                    <div key={availableUser.id} className="available-user-item flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-gray-600 rounded border border-gray-500 gap-2 sm:gap-3">
                      <div className="user-info flex flex-col gap-1 flex-1">
                        <span className="user-name font-semibold text-white text-sm">{availableUser.name}</span>
                        <span className="user-email text-xs text-gray-300">{availableUser.email}</span>
                        <span className="user-role-badge text-xs px-2 py-1 bg-gray-500 text-gray-200 rounded">{availableUser.role_name}</span>
                      </div>
                      <button
                        onClick={() => addUserToElevage(availableUser.id)}
                        className="add-btn bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-3 sm:px-4 py-2 text-sm cursor-pointer transition-colors duration-200 border-none rounded w-full sm:w-auto"
                        disabled={loading}
                      >
                        ➕ Ajouter
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="form-actions flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setShowAddUser(false);
                    setSearchTerm('');
                    setError('');
                  }}
                  className="cancel-btn bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 text-sm cursor-pointer transition-colors duration-200 border-none rounded w-full sm:w-auto"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!canManageUsers() && (
        <div className="no-permission-notice bg-yellow-600 text-yellow-100 p-3 sm:p-4 rounded-lg text-center font-medium text-sm">
          👁️ Vous pouvez uniquement consulter les utilisateurs de cet élevage.
        </div>
      )}

    </div>
  );
};

export default ElevageUsersManagement;