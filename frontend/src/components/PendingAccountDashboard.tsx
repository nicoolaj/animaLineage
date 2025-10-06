import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Footer from './Footer';
import MentionsLegales from './MentionsLegales';
import PolitiqueConfidentialite from './PolitiqueConfidentialite';

const PendingAccountDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [showMentionsLegales, setShowMentionsLegales] = useState(false);
  const [showPolitiqueConfidentialite, setShowPolitiqueConfidentialite] = useState(false);

  const handleLogout = () => {
    logout();
  };

  if (showMentionsLegales) {
    return <MentionsLegales onRetour={() => setShowMentionsLegales(false)} />;
  }

  if (showPolitiqueConfidentialite) {
    return <PolitiqueConfidentialite onRetour={() => setShowPolitiqueConfidentialite(false)} />;
  }

  return (
    <div id="pendingaccountdashboard-pending-dashboard-1" className="pending-dashboard">
      <header className="dashboard-header">
        <h1>Tableau de bord</h1>
        <div id="pendingaccountdashboard-user-info-2" className="user-info">
          <div id="pendingaccountdashboard-user-details-3" className="user-details">
            <span>Bienvenue, {user?.name}!</span>
            <span className="user-role">({user?.role_name})</span>
          </div>
          <button onClick={handleLogout} className="logout-button">
            Déconnexion
          </button>
        </div>
      </header>

      <main className="pending-content">
        <div id="pendingaccountdashboard-pending-message-card-4" className="pending-message-card">
          <div id="pendingaccountdashboard-pending-icon-5" className="pending-icon">
            <span className="hourglass">⏳</span>
          </div>

          <h2>Compte en attente de validation</h2>

          <div id="pendingaccountdashboard-pending-info-6" className="pending-info">
            <p>
              <strong>Bonjour {user?.name},</strong>
            </p>
            <p>
              Votre compte a été créé avec succès, mais il est actuellement en attente de validation
              par un administrateur.
            </p>
            <p>
              Vous recevrez une notification par email une fois que votre compte aura été activé.
              En attendant, vous pouvez vous déconnecter et revenir plus tard.
            </p>
          </div>

          <div id="pendingaccountdashboard-account-details-7" className="account-details">
            <h3>Détails de votre compte :</h3>
            <ul>
              <li><strong>Nom :</strong> {user?.name}</li>
              <li><strong>Email :</strong> {user?.email}</li>
              <li><strong>Statut :</strong> <span className="status-pending">En attente de validation</span></li>
            </ul>
          </div>

          <div id="pendingaccountdashboard-pending-actions-8" className="pending-actions">
            <p className="help-text">
              Si vous avez des questions, contactez votre administrateur.
            </p>
            <button onClick={handleLogout} className="btn-primary">
              Se déconnecter
            </button>
          </div>
        </div>
      </main>

      <Footer
        onMentionsLegalesClick={() => setShowMentionsLegales(true)}
        onPolitiqueConfidentialiteClick={() => setShowPolitiqueConfidentialite(true)}
      />
    </div>
  );
};

export default PendingAccountDashboard;