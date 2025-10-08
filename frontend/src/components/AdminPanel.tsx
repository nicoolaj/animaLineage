import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

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

  const { canAdministrate, canModerate, getAuthHeaders } = useAuth();

  const fetchAdminUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}api/simple-admin/users`, {
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
  }, [getAuthHeaders]);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}api/simple-admin/roles`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  }, [getAuthHeaders]);

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
      const response = await fetch(`${API_BASE_URL}api/simple-admin/update-role`, {
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
      const response = await fetch(`${API_BASE_URL}api/simple-admin/delete-user`, {
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
      <div id="adminpanel-admin-panel-1" className="admin-panel bg-red-600 text-red-100 p-4 rounded-lg text-center">
        <p className="text-sm">Accès refusé. Vous n'avez pas les permissions nécessaires.</p>
      </div>
    );
  }

  return (
    <div id="adminpanel-admin-panel-2" className="admin-panel">
      <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
        📋 Utilisateurs validés
      </h4>

      {error && (
        <div id="adminpanel-error-banner-3" className="error-banner bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <p className="text-sm">⚠️ {error}</p>
          <button onClick={fetchAdminUsers} className="text-sm px-3 py-2 bg-red-200 text-red-800 rounded hover:bg-red-300 w-full sm:w-auto">
            Réessayer
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-700 py-4">Chargement...</p>
      ) : (
        <div id="adminpanel-admin-users-table-4" className="admin-users-table">
          <div className="table-responsive">
            <table className="table-mobile w-full border-collapse bg-white border border-gray-200 rounded-lg overflow-hidden">
              <thead className="hidden sm:table-header-group">
                <tr>
                  <th className="bg-gray-50 px-3 py-2.5 text-left text-gray-700 font-medium text-sm">Nom</th>
                  <th className="bg-gray-50 px-3 py-2.5 text-left text-gray-700 font-medium text-sm">Email</th>
                  <th className="bg-gray-50 px-3 py-2.5 text-left text-gray-700 font-medium text-sm">Rôle</th>
                  <th className="bg-gray-50 px-3 py-2.5 text-left text-gray-700 font-medium text-sm">Statut</th>
                  <th className="bg-gray-50 px-3 py-2.5 text-left text-gray-700 font-medium text-sm">Créé le</th>
                  {canAdministrate() && <th className="bg-gray-50 px-3 py-2.5 text-left text-gray-700 font-medium text-sm">Actions</th>}
                </tr>
              </thead>
              <tbody className="block sm:table-row-group">
                {adminUsers.map((user) => (
                  <tr key={user.id} className={`block sm:table-row border-b border-gray-200 mb-4 sm:mb-0 bg-gray-50 sm:bg-white rounded-lg sm:rounded-none p-4 sm:p-0 text-gray-900 hover:bg-gray-100 transition-colors ${user.status === 0 ? 'ring-2 ring-yellow-500' : ''}`}>
                    <td data-label="Nom" className="block sm:table-cell text-left sm:text-center px-0 sm:px-3 py-1 sm:py-2.5 border-0 sm:border-gray-200 font-semibold text-gray-900">
                      {user.name}
                    </td>
                    <td data-label="Email" className="block sm:table-cell text-left sm:text-center px-0 sm:px-3 py-1 sm:py-2.5 border-0 sm:border-gray-200 text-sm text-gray-700">
                      {user.email}
                    </td>
                    <td data-label="Rôle" className="block sm:table-cell text-left sm:text-center px-0 sm:px-3 py-1 sm:py-2.5 border-0 sm:border-gray-200">
                      <span className={`role-badge px-2 py-1 rounded text-xs font-bold ${
                        user.role === 1 ? 'bg-red-600 text-white' :
                        user.role === 2 ? 'bg-yellow-600 text-white' :
                        'bg-blue-600 text-white'
                      }`}>
                        {user.role_name}
                      </span>
                    </td>
                    <td data-label="Statut" className="block sm:table-cell text-left sm:text-center px-0 sm:px-3 py-1 sm:py-2.5 border-0 sm:border-gray-200">
                      <span className={`status-badge px-2 py-1 rounded-full text-xs font-bold ${
                        user.status === 0 ? 'bg-yellow-600 text-white' :
                        user.status === 1 ? 'bg-green-600 text-white' :
                        user.status === 2 ? 'bg-red-600 text-white' : 'bg-gray-600 text-white'
                      }`}>
                        {user.status === 0 ? '⏳ En attente' :
                         user.status === 1 ? '✅ Validé' :
                         user.status === 2 ? '❌ Rejeté' : 'Inconnu'}
                      </span>
                    </td>
                    <td data-label="Créé le" className="block sm:table-cell text-left sm:text-center px-0 sm:px-3 py-1 sm:py-2.5 border-0 sm:border-gray-200 text-sm text-gray-700">
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    {canAdministrate() && (
                      <td className="block sm:table-cell text-left px-0 sm:px-3 py-1 sm:py-2.5 border-0 sm:border-gray-200 no-label">
                        <div id="adminpanel-action-buttons-5" className="action-buttons flex flex-col sm:flex-row gap-2 sm:gap-1">
                          <button
                            onClick={() => handleRoleChange(user)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs sm:text-sm rounded transition-colors duration-200 w-full sm:w-auto"
                          >
                            ✏️ Modifier rôle
                          </button>
                          <button
                            onClick={() => deleteUser(user.id, user.name)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs sm:text-sm rounded transition-colors duration-200 disabled:opacity-60 w-full sm:w-auto"
                            disabled={actionLoading === user.id}
                          >
                            {actionLoading === user.id ? '⏳ Suppression...' : '🗑️ Supprimer'}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedUser && canAdministrate() && (
        <div id="adminpanel-role-modal-6" className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div id="adminpanel-modal-content-7" className="modal-container bg-gray-700 rounded-xl p-4 sm:p-6 max-w-md sm:max-w-2xl w-full mx-auto text-white shadow-2xl">
            <h4 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">
              Modifier le rôle de {selectedUser.name}
            </h4>
            <div id="adminpanel-role-form-8" className="role-form space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm sm:text-base font-medium text-gray-300">Nouveau rôle :</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(Number(e.target.value))}
                  className="form-select w-full px-3 py-2.5 border border-gray-600 rounded-md bg-gray-700 text-white text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(roles).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div id="adminpanel-modal-actions-9" className="modal-actions flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-600">
                <button
                  onClick={cancelRoleChange}
                  className="btn-secondary w-full sm:w-auto order-2 sm:order-1"
                >
                  Annuler
                </button>
                <button
                  onClick={updateUserRole}
                  className="btn-primary w-full sm:w-auto order-1 sm:order-2"
                >
                  Confirmer
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