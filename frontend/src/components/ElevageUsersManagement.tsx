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
    <div className="management-container">
      <div className="management-header">
        <h3>Gestion des utilisateurs - {elevageName}</h3>
        <div className="header-actions">
          {isAdmin() && (
            <span className="admin-badge">👑 Accès administrateur</span>
          )}
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {loading && <div className="loading">Chargement...</div>}

      {/* Liste des utilisateurs actuels */}
      <div className="current-users-section">
        <h4>Utilisateurs autorisés ({Array.isArray(elevageUsers) ? elevageUsers.length : 0})</h4>

        {!Array.isArray(elevageUsers) || elevageUsers.length === 0 ? (
          <div className="no-users">Aucun utilisateur trouvé pour cet élevage.</div>
        ) : (
          <div className="users-list">
            {elevageUsers.map((elevageUser) => (
              <div key={elevageUser.user_id} className="user-item">
                <div className="user-info">
                  <span className="user-name">{elevageUser.user_name}</span>
                  <span className="user-email">{elevageUser.user_email}</span>
                  <span className={`user-role ${elevageUser.role_in_elevage}`}>
                    {elevageUser.role_in_elevage === 'owner' ? '👑 Propriétaire' : '🤝 Collaborateur'}
                  </span>
                  <span className="added-date">
                    Ajouté le {new Date(elevageUser.added_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                {canManageUsers() && elevageUser.role_in_elevage !== 'owner' && (
                  <button
                    onClick={() => removeUserFromElevage(elevageUser.user_id, elevageUser.user_name)}
                    className="remove-btn"
                    disabled={loading}
                    title="Retirer cet utilisateur"
                  >
                    🗑️
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
              className="add-user-btn"
              disabled={loading}
            >
              ➕ Ajouter un utilisateur
            </button>
          ) : (
            <div className="add-user-form">
              <h4>Ajouter un utilisateur</h4>

              <input
                type="text"
                placeholder="Rechercher un utilisateur par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />

              <div className="available-users-list">
                {filteredAvailableUsers.length === 0 ? (
                  <div className="no-available-users">
                    {searchTerm ? 'Aucun utilisateur trouvé.' : 'Tous les utilisateurs sont déjà ajoutés.'}
                  </div>
                ) : (
                  filteredAvailableUsers.map((availableUser) => (
                    <div key={availableUser.id} className="available-user-item">
                      <div className="user-info">
                        <span className="user-name">{availableUser.name}</span>
                        <span className="user-email">{availableUser.email}</span>
                        <span className="user-role-badge">{availableUser.role_name}</span>
                      </div>
                      <button
                        onClick={() => addUserToElevage(availableUser.id)}
                        className="add-btn"
                        disabled={loading}
                      >
                        ➕ Ajouter
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="form-actions">
                <button
                  onClick={() => {
                    setShowAddUser(false);
                    setSearchTerm('');
                    setError('');
                  }}
                  className="cancel-btn"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!canManageUsers() && (
        <div className="no-permission-notice">
          👁️ Vous pouvez uniquement consulter les utilisateurs de cet élevage.
        </div>
      )}

    </div>
  );
};

export default ElevageUsersManagement;