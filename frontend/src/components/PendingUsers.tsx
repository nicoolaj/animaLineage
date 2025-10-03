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
      <div id="pendingusers-pending-users-1" className="pending-users">
        <p>Accès refusé. Vous n'avez pas les permissions nécessaires.</p>
      </div>
    );
  }

  return (
    <div id="pendingusers-pending-users-2" className="pending-users">
      <h2>👤 Comptes en attente de validation</h2>
      <p>Les nouveaux comptes créés via la page d'inscription apparaissent ici.</p>

      {error && (
        <div id="pendingusers-error-banner-3" className="error-banner">
          <p>⚠️ {error}</p>
          <button onClick={fetchPendingUsers} className="btn-small btn-secondary">
            Réessayer
          </button>
        </div>
      )}

      {loading ? (
        <p>Chargement...</p>
      ) : pendingUsers.length === 0 ? (
        <div id="pendingusers-pending-placeholder-4" className="pending-placeholder">
          <p>📝 Aucun compte en attente pour le moment</p>
          <small>Les utilisateurs peuvent créer un compte via la page de connexion</small>
        </div>
      ) : (
        <div id="pendingusers-pending-users-table-5" className="pending-users-table">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Demande créée le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{new Date(user.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</td>
                  <td>
                    <div id="pendingusers-action-buttons-6" className="action-buttons">
                      <button
                        onClick={() => handleUserAction(user.id, 'validate')}
                        className="btn-small btn-success"
                        disabled={actionLoading === user.id}
                      >
                        {actionLoading === user.id ? 'En cours...' : '✅ Valider'}
                      </button>
                      <button
                        onClick={() => handleUserAction(user.id, 'reject')}
                        className="btn-small btn-danger"
                        disabled={actionLoading === user.id}
                      >
                        {actionLoading === user.id ? 'En cours...' : '❌ Rejeter'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

PendingUsers.displayName = 'PendingUsers';

export default PendingUsers;