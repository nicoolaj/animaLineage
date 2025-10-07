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
import Footer from './Footer';
import MentionsLegales from './MentionsLegales';
import PolitiqueConfidentialite from './PolitiqueConfidentialite';
import BackupManager from './BackupManager';

type TabType = 'elevages' | 'animals' | 'users' | 'types-races' | 'transfer-requests' | 'compatibility-tester' | 'elevage-form' | 'elevage-detail' | 'type-form' | 'race-form' | 'mentions-legales' | 'politique-confidentialite';

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
      icon: '⚙️',
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
      case 'mentions-legales':
        return <MentionsLegales onRetour={() => setActiveTab('elevages')} />;
      case 'politique-confidentialite':
        return <PolitiqueConfidentialite onRetour={() => setActiveTab('elevages')} />;

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
          <div className="max-w-7xl mx-auto">
            {/* En-tête */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
                ⚙️ Paramétrages du système
              </h2>
              <p className="text-gray-700 mt-2 text-base sm:text-lg">Configuration et administration des paramètres globaux.</p>
              {canAdministrate() && (
                <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 font-medium">👑 Accès administrateur - Configuration système complète</p>
                </div>
              )}
            </div>

            {/* Grille de cartes responsive */}
            <div className="parametrages-grid grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              {/* Carte Gestion des utilisateurs */}
              <div className="parametrages-card bg-white rounded-lg shadow-md border border-gray-200 min-h-fit">
                <div className="card-header p-4 sm:p-6 border-b border-gray-100">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
                    👥 Gestion des utilisateurs
                  </h3>
                  <p className="text-gray-700 mt-2 text-sm sm:text-base">Administration des comptes utilisateurs et demandes d'inscription.</p>
                </div>
                <div className="card-content p-4 sm:p-6">
                  <div className="space-y-6">
                    <PendingUsers ref={pendingUsersRef} onUserValidated={handleUserValidated} />
                    <AdminPanel ref={adminPanelRef} onUserDeleted={handleUserDeleted} />
                  </div>
                </div>
              </div>

              {/* Carte Sauvegardes */}
              <div className="parametrages-card bg-white rounded-lg shadow-md border border-gray-200 min-h-fit">
                <div className="card-header p-4 sm:p-6 border-b border-gray-100">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
                    💾 Gestion des sauvegardes
                  </h3>
                  <p className="text-gray-700 mt-2 text-sm sm:text-base">Création et gestion des sauvegardes de la base de données.</p>
                </div>
                <div className="card-content p-4 sm:p-6">
                  <BackupManager />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Onglet non trouvé</div>;
    }
  };

  return (
    <div id="maindashboard-dashboard-7" className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <img
            src="/logo_full.svg"
            alt="AnimaLineage"
            className="h-8 sm:h-10 w-auto"
          />
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-900">{messages.welcomeUser}, {user?.name}!</div>
              <div className="text-xs text-gray-700">({user?.role_name})</div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSelector />
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
              >
                {ui.logout}
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg font-medium text-sm transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="text-base">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-gray-50">
        {renderTabContent()}
      </main>

      <Footer
        onMentionsLegalesClick={() => setActiveTab('mentions-legales')}
        onPolitiqueConfidentialiteClick={() => setActiveTab('politique-confidentialite')}
      />
    </div>
  );
};

export default MainDashboard;
