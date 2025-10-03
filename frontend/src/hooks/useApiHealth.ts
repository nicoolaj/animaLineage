import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

export interface ApiHealthStatus {
  isHealthy: boolean;
  isChecking: boolean;
  error: string | null;
  lastCheck: Date | null;
}

export const useApiHealth = () => {
  const [status, setStatus] = useState<ApiHealthStatus>({
    isHealthy: false,
    isChecking: true,
    error: null,
    lastCheck: null
  });

  const checkApiHealth = async () => {
    setStatus(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes timeout

      const response = await fetch(`${API_BASE_URL}api/ping`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.message === 'pong') {
          setStatus({
            isHealthy: true,
            isChecking: false,
            error: null,
            lastCheck: new Date()
          });
        } else {
          throw new Error('Réponse API invalide');
        }
      } else {
        throw new Error(`API indisponible (${response.status})`);
      }
    } catch (error) {
      let errorMessage = 'Service temporairement indisponible';

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Le service met trop de temps à répondre';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Impossible de contacter le serveur';
        } else {
          errorMessage = error.message;
        }
      }

      setStatus({
        isHealthy: false,
        isChecking: false,
        error: errorMessage,
        lastCheck: new Date()
      });
    }
  };

  // Test initial au montage du composant
  useEffect(() => {
    checkApiHealth();
  }, []);

  // Test périodique toutes les 5 minutes si l'API est en erreur
  useEffect(() => {
    if (!status.isHealthy && !status.isChecking) {
      const interval = setInterval(() => {
        checkApiHealth();
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [status.isHealthy, status.isChecking]);

  return {
    ...status,
    recheckHealth: checkApiHealth
  };
};