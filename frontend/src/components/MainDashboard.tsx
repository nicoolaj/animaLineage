import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import AdminPanel, { AdminPanelRef } from './AdminPanel';
import PendingUsers, { PendingUsersRef } from './PendingUsers';
import ElevageList from './ElevageList';
import ElevageForm from './ElevageForm';
import ElevageDetail from './ElevageDetail';
import TypesAnimauxList from './TypesAnimauxList';
import TypeAnimalForm from './TypeAnimalForm';
import RacesList from './RacesList';
import RaceForm from './RaceForm';
import AnimalDashboard from './AnimalDashboard';
import TransferRequestManager from './TransferRequestManager';
import CompatibilityTester from './CompatibilityTester';
import LanguageSelector from './LanguageSelector';

type TabType = 'elevages' | 'animals' | 'users' | 'types-races' | 'transfer-requests' | 'compatibility-tester' | 'elevage-form' | 'elevage-detail' | 'type-form' | 'race-form';

interface TabData {
  id: TabType;
  label: string;
  icon: string;
  requiredRole?: number;
}

const MainDashboard: React.FC = () => {
  const { user, logout, canAdministrate } = useAuth();
  const { ui, messages } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('elevages');
  const [elevageFormMode, setElevageFormMode] = useState<{ mode: 'create' | 'edit'; id?: string }>({ mode: 'create' });
  const [selectedElevageId, setSelectedElevageId] = useState<number | null>(null);
  const [typeFormMode, setTypeFormMode] = useState<{ mode: 'create' | 'edit'; id?: string }>({ mode: 'create' });
  const [raceFormMode, setRaceFormMode] = useState<{ mode: 'create' | 'edit'; id?: string }>({ mode: 'create' });
  const [typesRacesSubTab, setTypesRacesSubTab] = useState<'types' | 'races'>('types');

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

  const handleNewElevage = () => {
    setElevageFormMode({ mode: 'create' });
    setActiveTab('elevage-form');
  };

  const handleEditElevage = (id: string) => {
    setElevageFormMode({ mode: 'edit', id });
    setActiveTab('elevage-form');
  };

  const handleViewAnimaux = (elevageId: number) => {
    setSelectedElevageId(elevageId);
    setActiveTab('elevage-detail');
  };

  const handleBackToElevages = () => {
    setSelectedElevageId(null);
    setActiveTab('elevages');
  };

  const handleElevageFormClose = () => {
    setActiveTab('elevages');
  };

  const handleNewType = () => {
    setTypeFormMode({ mode: 'create' });
    setActiveTab('type-form');
  };

  const handleEditType = (id: string) => {
    setTypeFormMode({ mode: 'edit', id });
    setActiveTab('type-form');
  };

  const handleTypeFormClose = () => {
    setActiveTab('types-races');
  };

  const handleNewRace = () => {
    setRaceFormMode({ mode: 'create' });
    setActiveTab('race-form');
  };

  const handleEditRace = (id: string) => {
    setRaceFormMode({ mode: 'edit', id });
    setActiveTab('race-form');
  };

  const handleRaceFormClose = () => {
    setActiveTab('types-races');
  };

  const tabs: TabData[] = [
    {
      id: 'elevages',
      label: ui.elevages,
      icon: '🚜'
    },
    {
      id: 'animals',
      label: ui.animals,
      icon: '🐄',
      requiredRole: 2 // Admin et modérateurs
    },
    {
      id: 'types-races',
      label: ui.typesRaces,
      icon: '🏷️',
      requiredRole: 1 // Admin uniquement
    },
    {
      id: 'transfer-requests',
      label: 'Demandes de transfert',
      icon: '🔄',
      requiredRole: 2 // Admin et modérateurs
    },
    {
      id: 'compatibility-tester',
      label: 'Compatibilité Reproduction',
      icon: '🧬'
      // Pas de requiredRole - accessible à tous
    },
    {
      id: 'users',
      label: ui.users,
      icon: '👥',
      requiredRole: 1 // Admin uniquement
    }
  ];

  const availableTabs = tabs.filter(tab =>
    !tab.requiredRole || (user && user.role <= tab.requiredRole)
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'elevages':
        return <ElevageList onNewElevage={handleNewElevage} onEditElevage={handleEditElevage} onViewAnimaux={handleViewAnimaux} />;

      case 'animals':
        return <AnimalDashboard />;

      case 'transfer-requests':
        return <TransferRequestManager />;

      case 'compatibility-tester':
        return <CompatibilityTester />;

      case 'elevage-detail':
        return selectedElevageId ? (
          <ElevageDetail elevageId={selectedElevageId} onBack={handleBackToElevages} />
        ) : (
          <div>Élevage non sélectionné</div>
        );

      case 'elevage-form':
        return (
          <ElevageForm
            elevageId={elevageFormMode.mode === 'edit' ? elevageFormMode.id : undefined}
            onSave={handleElevageFormClose}
            onCancel={handleElevageFormClose}
          />
        );

      case 'types-races':
        return (
          <div id="maindashboard-types-races-management-1" className="types-races-management">
            <div id="maindashboard-sub-tabs-2" className="sub-tabs">
              <button
                className={`sub-tab ${typesRacesSubTab === 'types' ? 'active' : ''}`}
                onClick={() => setTypesRacesSubTab('types')}
              >
                Types d'animaux
              </button>
              <button
                className={`sub-tab ${typesRacesSubTab === 'races' ? 'active' : ''}`}
                onClick={() => setTypesRacesSubTab('races')}
              >
                Races
              </button>
            </div>
            <div id="maindashboard-sub-tab-content-3" className="sub-tab-content">
              {typesRacesSubTab === 'types' ? (
                <TypesAnimauxList onNewType={handleNewType} onEditType={handleEditType} />
              ) : (
                <RacesList onNewRace={handleNewRace} onEditRace={handleEditRace} />
              )}
            </div>
          </div>
        );

      case 'type-form':
        return (
          <TypeAnimalForm
            typeId={typeFormMode.mode === 'edit' ? typeFormMode.id : undefined}
            onSave={handleTypeFormClose}
            onCancel={handleTypeFormClose}
          />
        );

      case 'race-form':
        return (
          <RaceForm
            raceId={raceFormMode.mode === 'edit' ? raceFormMode.id : undefined}
            onSave={handleRaceFormClose}
            onCancel={handleRaceFormClose}
          />
        );

      case 'users':
        return (
          <div id="maindashboard-users-management-4" className="users-management">
            <div id="maindashboard-users-section-5" className="users-section">
              <h3>🛡️ Gestion des utilisateurs</h3>
              <p>Administration des comptes utilisateurs du système.</p>
              {canAdministrate() && (
                <div id="maindashboard-admin-notice-6" className="admin-notice">
                  <p>👑 Accès administrateur - Gestion complète des utilisateurs</p>
                </div>
              )}
            </div>

            <AdminPanel ref={adminPanelRef} onUserDeleted={handleUserDeleted} />
            <PendingUsers ref={pendingUsersRef} onUserValidated={handleUserValidated} />
          </div>
        );

      default:
        return <div>Onglet non trouvé</div>;
    }
  };

  return (
    <div id="maindashboard-dashboard-7" className="dashboard">
      <header className="dashboard-header">
        <img
          src="/logo_full.svg"
          alt="AnimaLineage"
          className="dashboard-logo"
          style={{ height: '40px', width: 'auto' }}
        />
        <div id="maindashboard-user-info-8" className="user-info">
          <div id="maindashboard-user-details-9" className="user-details">
            <span>{messages.welcomeUser}, {user?.name}!</span>
            <span className="user-role">({user?.role_name})</span>
          </div>
          <div className="header-controls">
            <LanguageSelector />
            <button onClick={handleLogout} className="logout-button">
              {ui.logout}
            </button>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        <div id="maindashboard-nav-tabs-10" className="nav-tabs">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="dashboard-content">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default MainDashboard;
