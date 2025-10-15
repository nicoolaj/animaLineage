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

import React, { useEffect, lazy, Suspense } from 'react';
import './App.css';
import { useDispatch } from 'react-redux';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { initializeLanguage } from './store/slices/languageSlice';
import { useApiHealthWithRedux } from './hooks/useApiHealthWithRedux';
import LoadingFallback from './components/LoadingFallback';

// Lazy loading des composants principaux pour optimiser le temps de chargement initial
const LandingPage = lazy(() => import('./components/LandingPage'));
const MainDashboard = lazy(() => import('./components/MainDashboard'));
const PendingAccountDashboard = lazy(() => import('./components/PendingAccountDashboard'));
const MaintenanceMessage = lazy(() => import('./components/MaintenanceMessage'));

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
      <Suspense fallback={<LoadingFallback />}>
        <MaintenanceMessage
          error={apiHealth.error}
          onRetry={apiHealth.recheckHealth}
          isRetrying={apiHealth.isChecking}
        />
      </Suspense>
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
      return (
        <Suspense fallback={<LoadingFallback />}>
          <LandingPage />
        </Suspense>
      );
    }

    // Si l'utilisateur est connecté mais son compte est en attente (status = 0)
    if (user?.status === 0) {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <PendingAccountDashboard />
        </Suspense>
      );
    }

    // Si l'utilisateur est connecté et validé (status = 1) ou rejeté (status = 2)
    return (
      <Suspense fallback={<LoadingFallback />}>
        <MainDashboard />
      </Suspense>
    );
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
