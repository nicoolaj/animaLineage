/*
 * Copyright 2025 - Nicolas Jalibert
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useEffect } from 'react';
import './App.css';
import { useDispatch } from 'react-redux';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { initializeLanguage } from './store/slices/languageSlice';
import { useApiHealthWithRedux } from './hooks/useApiHealthWithRedux';
import Auth from './components/Auth';
import MainDashboard from './components/MainDashboard';
import PendingAccountDashboard from './components/PendingAccountDashboard';
import MaintenanceMessage from './components/MaintenanceMessage';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const dispatch = useDispatch();
  const apiHealth = useApiHealthWithRedux();

  useEffect(() => {
    dispatch(initializeLanguage());
  }, [dispatch]);

  // Afficher le message de maintenance si l'API n'est pas disponible
  if (!apiHealth.isHealthy && apiHealth.error) {
    return (
      <MaintenanceMessage
        error={apiHealth.error}
        onRetry={apiHealth.recheckHealth}
        isRetrying={apiHealth.isChecking}
      />
    );
  }

  if (isLoading || apiHealth.isChecking) {
    return (
      <div className="App">
        <div className="loading-container">
          <p>{apiHealth.isChecking ? 'Vérification du service...' : 'Chargement...'}</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (!isAuthenticated) {
      return <Auth />;
    }

    // Si l'utilisateur est connecté mais son compte est en attente (status = 0)
    if (user?.status === 0) {
      return <PendingAccountDashboard />;
    }

    // Si l'utilisateur est connecté et validé (status = 1) ou rejeté (status = 2)
    return <MainDashboard />;
  };

  return (
    <div className="App">
      {renderContent()}
    </div>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
