import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

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
  const API_BASE_URL = 'http://localhost:3001/api';

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
      const response = await fetch(`${API_BASE_URL}/elevages/${elevageId}/users`, {
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
      const response = await fetch(`${API_BASE_URL}/users`, {
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
      const response = await fetch(`${API_BASE_URL}/elevages/${elevageId}/users`, {
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
      const response = await fetch(`${API_BASE_URL}/elevages/${elevageId}/users/${userId}`, {
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
    <div className="elevage-users-management">
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

      <style>{`
        .elevage-users-management {
          background: #374151;
          border-radius: 12px;
          padding: 25px;
          max-width: 800px;
          margin: 20px auto;
          color: white;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .management-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #4b5563;
        }

        .management-header h3 {
          margin: 0;
          color: white;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .admin-badge {
          background: #fbbf24;
          color: #92400e;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }

        .close-btn {
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 50%;
          width: 35px;
          height: 35px;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .close-btn:hover {
          background: #b91c1c;
        }

        .current-users-section {
          margin-bottom: 30px;
        }

        .current-users-section h4 {
          color: #d1d5db;
          margin-bottom: 15px;
          border-bottom: 1px solid #4b5563;
          padding-bottom: 8px;
        }

        .users-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .user-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #1f2937;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #4b5563;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .user-name {
          font-weight: bold;
          color: white;
          font-size: 16px;
        }

        .user-email {
          color: #9ca3af;
          font-size: 14px;
        }

        .user-role {
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: bold;
        }

        .user-role.owner {
          background: #fbbf24;
          color: #92400e;
        }

        .user-role.collaborator {
          background: #34d399;
          color: #065f46;
        }

        .added-date {
          color: #6b7280;
          font-size: 12px;
        }

        .remove-btn {
          background: #dc2626;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }

        .remove-btn:hover {
          background: #b91c1c;
        }

        .remove-btn:disabled {
          background: #6b7280;
          cursor: not-allowed;
        }

        .add-users-section {
          border-top: 1px solid #4b5563;
          padding-top: 20px;
        }

        .add-user-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .add-user-btn:hover {
          background: #2563eb;
        }

        .add-user-btn:disabled {
          background: #6b7280;
          cursor: not-allowed;
        }

        .add-user-form h4 {
          color: #d1d5db;
          margin-bottom: 15px;
        }

        .search-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #4b5563;
          border-radius: 6px;
          background: #1f2937;
          color: white;
          margin-bottom: 15px;
          font-size: 14px;
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .available-users-list {
          max-height: 300px;
          overflow-y: auto;
          margin-bottom: 15px;
        }

        .available-user-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #1f2937;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #4b5563;
          margin-bottom: 8px;
        }

        .user-role-badge {
          background: #6b7280;
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: bold;
        }

        .add-btn {
          background: #10b981;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: background-color 0.2s;
        }

        .add-btn:hover {
          background: #059669;
        }

        .add-btn:disabled {
          background: #6b7280;
          cursor: not-allowed;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .cancel-btn {
          background: #6b7280;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .cancel-btn:hover {
          background: #4b5563;
        }

        .no-users, .no-available-users {
          text-align: center;
          color: #9ca3af;
          font-style: italic;
          padding: 20px;
        }

        .no-permission-notice {
          background: #1f2937;
          border: 1px solid #4b5563;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          color: #fbbf24;
          margin-top: 20px;
        }

        .error-message {
          background: #dc2626;
          color: white;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-size: 0.9rem;
        }

        .loading {
          text-align: center;
          color: #9ca3af;
          padding: 20px;
        }

        @media (max-width: 768px) {
          .elevage-users-management {
            margin: 10px;
            padding: 20px;
          }

          .user-item, .available-user-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .management-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default ElevageUsersManagement;