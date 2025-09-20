import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: number;
  role_name: string;
  created_at: string;
  status: number;
}

interface Role {
  [key: number]: string;
}

interface AdminPanelProps {
  onUserDeleted?: () => void;
}

export interface AdminPanelRef {
  refreshUsers: () => void;
}

const AdminPanel = forwardRef<AdminPanelRef, AdminPanelProps>(({ onUserDeleted }, ref) => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role>({});
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState<number>(3);
  const [error, setError] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const { canAdministrate, canModerate, user, getAuthHeaders } = useAuth();
  const API_BASE_URL = 'http://localhost:3001/api';

  const fetchAdminUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}/simple-admin/users`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setAdminUsers(data);
      } else if (response.status === 403) {
        setError('Accès refusé. Permissions insuffisantes.');
      } else {
        setError('Erreur lors du chargement des utilisateurs.');
      }
    } catch (error) {
      console.error('Error fetching admin users:', error);
      setError('Erreur de connexion lors du chargement.');
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders]);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/simple-admin/roles`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  }, [user, getAuthHeaders]);

  useEffect(() => {
    if (canModerate()) {
      fetchAdminUsers();
      fetchRoles();
    }
  }, [canModerate, fetchAdminUsers, fetchRoles]);

  useImperativeHandle(ref, () => ({
    refreshUsers: fetchAdminUsers
  }));

  const updateUserRole = async () => {
    if (!selectedUser || !canAdministrate()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/simple-admin/update-role`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          new_role: newRole,
        }),
      });

      if (response.ok) {
        await fetchAdminUsers();
        setSelectedUser(null);
        setNewRole(3);
        alert('Rôle mis à jour avec succès !');
      } else {
        const errorData = await response.json();
        alert(`Erreur: ${errorData.message || 'Échec de la mise à jour du rôle'}`);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Erreur de connexion lors de la mise à jour du rôle');
    }
  };

  const handleRoleChange = (user: AdminUser) => {
    setSelectedUser(user);
    setNewRole(user.role);
  };

  const cancelRoleChange = () => {
    setSelectedUser(null);
    setNewRole(3);
  };

  const deleteUser = async (userId: number, userName: string) => {
    if (!canAdministrate()) return;

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer l'utilisateur "${userName}" ? Cette action est irréversible.`
    );

    if (!confirmed) return;

    try {
      setActionLoading(userId);
      const response = await fetch(`${API_BASE_URL}/simple-admin/delete-user`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          user_id: userId,
        }),
      });

      if (response.ok) {
        await fetchAdminUsers();
        onUserDeleted?.(); // Notify parent component
        alert('Utilisateur supprimé avec succès !');
      } else {
        const errorData = await response.json();
        alert(`Erreur: ${errorData.message || 'Échec de la suppression'}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Erreur de connexion lors de la suppression');
    } finally {
      setActionLoading(null);
    }
  };

  if (!canModerate()) {
    return (
      <div id="adminpanel-admin-panel-1" className="admin-panel">
        <p>Accès refusé. Vous n'avez pas les permissions nécessaires.</p>
      </div>
    );
  }

  return (
    <div id="adminpanel-admin-panel-2" className="admin-panel">
      <h3>👥 Gestion des utilisateurs</h3>

      {error && (
        <div id="adminpanel-error-banner-3" className="error-banner">
          <p>⚠️ {error}</p>
          <button onClick={fetchAdminUsers} className="btn-small btn-secondary">
            Réessayer
          </button>
        </div>
      )}

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div id="adminpanel-admin-users-table-4" className="admin-users-table">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Créé le</th>
                {canAdministrate() && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {adminUsers.map((user) => (
                <tr key={user.id} className={user.status === 0 ? 'pending-user' : ''}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role_name}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${user.status}`}>
                      {user.status === 0 ? '⏳ En attente' :
                       user.status === 1 ? '✅ Validé' :
                       user.status === 2 ? '❌ Rejeté' : 'Inconnu'}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  {canAdministrate() && (
                    <td>
                      <div id="adminpanel-action-buttons-5" className="action-buttons">
                        <button
                          onClick={() => handleRoleChange(user)}
                          className="btn-small btn-primary"
                        >
                          Modifier rôle
                        </button>
                        <button
                          onClick={() => deleteUser(user.id, user.name)}
                          className="btn-small btn-danger"
                          disabled={actionLoading === user.id}
                        >
                          {actionLoading === user.id ? 'Suppression...' : 'Supprimer'}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedUser && canAdministrate() && (
        <div id="adminpanel-role-modal-6" className="role-modal">
          <div id="adminpanel-modal-content-7" className="modal-content">
            <h4>Modifier le rôle de {selectedUser.name}</h4>
            <div id="adminpanel-role-form-8" className="role-form">
              <label>Nouveau rôle :</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(Number(e.target.value))}
              >
                {Object.entries(roles).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <div id="adminpanel-modal-actions-9" className="modal-actions">
                <button onClick={updateUserRole} className="btn-primary">
                  Confirmer
                </button>
                <button onClick={cancelRoleChange} className="btn-secondary">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

AdminPanel.displayName = 'AdminPanel';

export default AdminPanel;