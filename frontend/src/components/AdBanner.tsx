import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';

interface AdConfig {
  enabled: boolean;
  providerId: string;
  slotId: string;
  format: string;
}

interface AdBannerProps {
  className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ className = '' }) => {
  const [adConfig, setAdConfig] = useState<AdConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdConfig();
  }, []);

  const fetchAdConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}api/config/advertising`);

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de la configuration publicitaire');
      }

      const data = await response.json();

      if (data.status === 'success') {
        setAdConfig(data.data);
      } else {
        throw new Error('Configuration publicitaire invalide');
      }
    } catch (err) {
      console.error('Erreur configuration publicitaire:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load Google AdSense script if ad is enabled and we have a provider ID
    if (adConfig?.enabled && adConfig.providerId) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adConfig.providerId}`;
      script.crossOrigin = 'anonymous';

      document.head.appendChild(script);

      return () => {
        // Cleanup script on unmount
        const existingScript = document.querySelector(`script[src*="${adConfig.providerId}"]`);
        if (existingScript) {
          document.head.removeChild(existingScript);
        }
      };
    }
  }, [adConfig]);

  useEffect(() => {
    // Initialize ads after script is loaded
    if (adConfig?.enabled && window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('Erreur initialisation AdSense:', e);
      }
    }
  }, [adConfig]);

  // Don't render anything if loading or error
  if (loading) {
    return (
      <div className={`ad-banner-loading ${className}`}>
        <div className="ad-placeholder">
          <span>Chargement publicité...</span>
        </div>
      </div>
    );
  }

  if (error || !adConfig?.enabled) {
    return null; // Don't show anything if disabled or error
  }

  return (
    <div className={`ad-banner ${className}`}>
      <div className="ad-container">
        <ins
          className="adsbygoogle"
          style={{
            display: 'block',
            textAlign: 'center'
          }}
          data-ad-client={adConfig.providerId}
          data-ad-slot={adConfig.slotId}
          data-ad-format={adConfig.format}
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
};

// Extend window interface for TypeScript
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default AdBanner;