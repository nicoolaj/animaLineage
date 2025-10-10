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
    <div id="dashboard-container" className="dashboard min-h-screen bg-gray-50 text-gray-900 p-4 sm:p-6">
      <header id="dashboard-header" className="dashboard-header flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 pb-4 sm:pb-6 border-b-2 border-gray-300 gap-4">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">📊 Tableau de bord</h1>
        <div id="dashboard-user-info" className="user-info flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <div id="dashboard-user-details" className="user-details flex flex-col sm:flex-row gap-1 sm:gap-2 text-sm sm:text-base">
            <span className="text-gray-200">Bienvenue, <span className="font-semibold">{user?.name}</span>!</span>
            <span className="user-role text-xs sm:text-sm px-2 py-1 bg-blue-600 text-white rounded-full">({user?.role_name})</span>
          </div>
          <button onClick={handleLogout} className="logout-button btn-secondary text-sm px-4 py-2 w-full sm:w-auto">
            🚪 Déconnexion
          </button>
        </div>
      </header>

      <main id="dashboard-content" className="dashboard-content space-y-6 sm:space-y-8">
        {canModerate() && (
          <div id="dashboard-admin-section" className="admin-section bg-gray-100 rounded-lg p-4 sm:p-6 border border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">🛡️ Panel d'administration</h2>
            <p className="text-sm sm:text-base text-gray-200 mb-4">Vous avez accès aux fonctionnalités de modération.</p>
            {canAdministrate() && (
              <div id="dashboard-admin-notice" className="admin-notice bg-yellow-600 text-yellow-100 p-3 sm:p-4 rounded-lg border-l-4 border-yellow-400">
                <p className="text-sm sm:text-base font-medium">👑 Vous êtes administrateur - Accès complet au système</p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-6 sm:space-y-8">
          {canModerate() && <AdminPanel ref={adminPanelRef} onUserDeleted={handleUserDeleted} />}

          {canModerate() && <PendingUsers ref={pendingUsersRef} onUserValidated={handleUserValidated} />}
        </div>

      </main>
    </div>
  );
};

export default Dashboard;