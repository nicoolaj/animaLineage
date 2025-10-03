import React, { useEffect } from 'react';
import { useAdConfig } from '../hooks/useAdConfig';

const AdSenseScript: React.FC = () => {
  const { adConfig, loading } = useAdConfig();

  useEffect(() => {
    if (!loading && adConfig.enabled && adConfig.providerId) {
      // Vérifier si le script n'est pas déjà chargé
      const existingScript = document.querySelector(`script[src*="${adConfig.providerId}"]`);
      if (!existingScript) {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adConfig.providerId}`;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);

        return () => {
          // Nettoyage si le composant est démonté
          const scriptToRemove = document.querySelector(`script[src*="${adConfig.providerId}"]`);
          if (scriptToRemove) {
            document.head.removeChild(scriptToRemove);
          }
        };
      }
    }
  }, [adConfig, loading]);

  return null; // Ce composant n'affiche rien, il charge juste le script
};

export default AdSenseScript;