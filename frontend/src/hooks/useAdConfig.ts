import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

interface AdConfig {
  enabled: boolean;
  providerId: string;
  slotId: string;
  format: string;
}

export const useAdConfig = () => {
  const [adConfig, setAdConfig] = useState<AdConfig>({
    enabled: false,
    providerId: '',
    slotId: '',
    format: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdConfig = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}api/config/advertising`);
        if (response.ok) {
          const data = await response.json();
          setAdConfig(data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la config publicitaire:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdConfig();
  }, []);

  return { adConfig, loading };
};