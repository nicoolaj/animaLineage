import React, { useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminPanel, { AdminPanelRef } from './AdminPanel';
import PendingUsers, { PendingUsersRef } from './PendingUsers';

const Dashboard: React.FC = () => {
  const { user, logout, canModerate, canAdministrate } = useAuth();
  const adminPanelRef = useRef<AdminPanelRef>(null);
  const pendingUsersRef = useRef<PendingUsersRef>(null);

  const handleLogout = () => {
    logout();
  };

  const handleUserValidated = () => {
    adminPanelRef.current?.refreshUsers();
  };

  const handleUserDeleted = () => {
    pendingUsersRef.current?.refreshUsers();
  };

  return (
    <div id="dashboard-container" className="dashboard">
      <header id="dashboard-header" className="dashboard-header">
        <h1>Tableau de bord</h1>
        <div id="dashboard-user-info" className="user-info">
          <div id="dashboard-user-details" className="user-details">
            <span>Bienvenue, {user?.name}!</span>
            <span className="user-role">({user?.role_name})</span>
          </div>
          <button onClick={handleLogout} className="logout-button">
            Déconnexion
          </button>
        </div>
      </header>

      <main id="dashboard-content" className="dashboard-content">
        {canModerate() && (
          <div id="dashboard-admin-section" className="admin-section">
            <h2>🛡️ Panel d'administration</h2>
            <p>Vous avez accès aux fonctionnalités de modération.</p>
            {canAdministrate() && (
              <div id="dashboard-admin-notice" className="admin-notice">
                <p>👑 Vous êtes administrateur - Accès complet au système</p>
              </div>
            )}
          </div>
        )}

        {canModerate() && <AdminPanel ref={adminPanelRef} onUserDeleted={handleUserDeleted} />}

        {canModerate() && <PendingUsers ref={pendingUsersRef} onUserValidated={handleUserValidated} />}

      </main>
    </div>
  );
};

export default Dashboard;