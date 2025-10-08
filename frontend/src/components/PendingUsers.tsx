import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

interface PendingUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

interface PendingUsersProps {
  onUserValidated?: () => void;
}

export interface PendingUsersRef {
  refreshUsers: () => void;
}

const PendingUsers = forwardRef<PendingUsersRef, PendingUsersProps>(({ onUserValidated }, ref) => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const { canModerate, getAuthHeaders } = useAuth();

  const fetchPendingUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}api/simple-admin/pending-users`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setPendingUsers(data);
      } else if (response.status === 403) {
        setError('Accès refusé. Permissions insuffisantes.');
      } else {
        setError('Erreur lors du chargement des comptes en attente.');
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
      setError('Erreur de connexion lors du chargement.');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    const loadPendingUsers = async () => {
      if (canModerate()) {
        await fetchPendingUsers();
      }
    };
    loadPendingUsers();
  }, [canModerate, fetchPendingUsers]);

  useImperativeHandle(ref, () => ({
    refreshUsers: fetchPendingUsers
  }));

  const handleUserAction = async (userId: number, action: 'validate' | 'reject') => {
    try {
      setActionLoading(userId);
      const response = await fetch(`${API_BASE_URL}api/simple-admin/validate-user`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          user_id: userId,
          action: action,
        }),
      });

      if (response.ok) {
        const actionText = action === 'validate' ? 'validé' : 'rejeté';
        alert(`Utilisateur ${actionText} avec succès !`);
        await fetchPendingUsers(); // Refresh the list
        onUserValidated?.(); // Notify parent component
      } else {
        const errorData = await response.json();
        alert(`Erreur: ${errorData.message || 'Échec de l\'action'}`);
      }
    } catch (error) {
      console.error('Error handling user action:', error);
      alert('Erreur de connexion lors de l\'action');
    } finally {
      setActionLoading(null);
    }
  };

  if (!canModerate()) {
    return (
      <div id="pendingusers-pending-users-1" className="pending-users bg-red-600 text-red-100 p-4 rounded-lg text-center">
        <p className="text-sm">Accès refusé. Vous n'avez pas les permissions nécessaires.</p>
      </div>
    );
  }

  return (
    <div id="pendingusers-pending-users-2" className="pending-users bg-gray-700 rounded-lg p-4 sm:p-6 border border-gray-600">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">👤 Comptes en attente de validation</h2>
        <p className="text-sm sm:text-base text-gray-300">Les nouveaux comptes créés via la page d'inscription apparaissent ici.</p>
      </div>

      {error && (
        <div id="pendingusers-error-banner-3" className="error-banner bg-red-600 text-white p-3 sm:p-4 rounded-lg mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <p className="text-sm">⚠️ {error}</p>
          <button onClick={fetchPendingUsers} className="btn-secondary text-sm px-3 py-2 w-full sm:w-auto">
            Réessayer
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-700 py-4">Chargement...</p>
      ) : pendingUsers.length === 0 ? (
        <div id="pendingusers-pending-placeholder-4" className="pending-placeholder text-center py-8 bg-gray-600 rounded-lg border border-gray-500">
          <p className="text-base sm:text-lg text-gray-200 mb-2">📝 Aucun compte en attente pour le moment</p>
          <small className="text-xs sm:text-sm text-gray-400">Les utilisateurs peuvent créer un compte via la page de connexion</small>
        </div>
      ) : (
        <div id="pendingusers-pending-users-table-5" className="pending-users-table">
          <div className="table-responsive">
            <table className="table-mobile w-full border-collapse bg-gray-700 rounded-lg shadow-card">
              <thead className="hidden sm:table-header-group">
                <tr>
                  <th className="bg-gray-50 px-3 py-2.5 text-left text-gray-700 font-bold">Nom</th>
                  <th className="bg-gray-50 px-3 py-2.5 text-left text-gray-700 font-bold">Email</th>
                  <th className="bg-gray-50 px-3 py-2.5 text-left text-gray-700 font-bold">Demande créée le</th>
                  <th className="bg-gray-50 px-3 py-2.5 text-left text-gray-700 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="block sm:table-row-group">
                {pendingUsers.map((user) => (
                  <tr key={user.id} className="block sm:table-row border-b border-gray-200 mb-4 sm:mb-0 bg-gray-50 sm:bg-white rounded-lg sm:rounded-none p-4 sm:p-0 text-gray-900 hover:bg-gray-100 transition-colors ring-2 ring-yellow-500">
                    <td data-label="Nom" className="block sm:table-cell text-left sm:text-center px-0 sm:px-3 py-1 sm:py-2.5 border-0 sm:border-gray-200 font-semibold">
                      {user.name}
                    </td>
                    <td data-label="Email" className="block sm:table-cell text-left sm:text-center px-0 sm:px-3 py-1 sm:py-2.5 border-0 sm:border-gray-200 text-sm text-gray-700">
                      {user.email}
                    </td>
                    <td data-label="Demande créée le" className="block sm:table-cell text-left sm:text-center px-0 sm:px-3 py-1 sm:py-2.5 border-0 sm:border-gray-200 text-sm">
                      {new Date(user.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="block sm:table-cell text-left px-0 sm:px-3 py-1 sm:py-2.5 border-0 sm:border-gray-200 no-label">
                      <div id="pendingusers-action-buttons-6" className="action-buttons flex flex-col sm:flex-row gap-2 sm:gap-1 mt-3 sm:mt-0">
                        <button
                          onClick={() => handleUserAction(user.id, 'validate')}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-xs sm:text-sm rounded transition-colors duration-200 disabled:opacity-60 w-full sm:w-auto"
                          disabled={actionLoading === user.id}
                        >
                          {actionLoading === user.id ? '⏳ En cours...' : '✅ Valider'}
                        </button>
                        <button
                          onClick={() => handleUserAction(user.id, 'reject')}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs sm:text-sm rounded transition-colors duration-200 disabled:opacity-60 w-full sm:w-auto"
                          disabled={actionLoading === user.id}
                        >
                          {actionLoading === user.id ? '⏳ En cours...' : '❌ Rejeter'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
});

PendingUsers.displayName = 'PendingUsers';

export default PendingUsers;