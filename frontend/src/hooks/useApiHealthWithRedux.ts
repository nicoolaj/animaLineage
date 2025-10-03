import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { setHealthy, setUnhealthy, setChecking } from '../store/slices/apiHealthSlice';
import { API_BASE_URL } from '../config/api';

export const useApiHealthWithRedux = () => {
  const dispatch = useDispatch();
  const apiHealth = useSelector((state: RootState) => state.apiHealth);

  const checkApiHealth = async () => {
    dispatch(setChecking());

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
          dispatch(setHealthy());
        } else {
          dispatch(setUnhealthy('Réponse API invalide'));
        }
      } else {
        dispatch(setUnhealthy(`API indisponible (${response.status})`));
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

      dispatch(setUnhealthy(errorMessage));
    }
  };

  // Test initial au montage du composant
  useEffect(() => {
    checkApiHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Test périodique toutes les 5 minutes si l'API est en erreur
  useEffect(() => {
    if (!apiHealth.isHealthy && !apiHealth.isChecking) {
      const interval = setInterval(() => {
        checkApiHealth();
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiHealth.isHealthy, apiHealth.isChecking]);

  return {
    ...apiHealth,
    recheckHealth: checkApiHealth
  };
};