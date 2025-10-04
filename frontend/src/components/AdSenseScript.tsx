import React, { useEffect } from 'react';
import { useAdConfig } from '../hooks/useAdConfig';

const AdSenseScript: React.FC = () => {
  const { adConfig, loading } = useAdConfig();

  useEffect(() => {
    console.log('AdSenseScript: loading =', loading, 'adConfig =', adConfig);

    if (!loading && adConfig.enabled && adConfig.providerId) {
      console.log('AdSenseScript: Conditions met, loading script for', adConfig.providerId);

      // Vérifier si le script n'est pas déjà chargé
      const existingScript = document.querySelector(`script[src*="${adConfig.providerId}"]`);
      if (!existingScript) {
        console.log('AdSenseScript: Creating new script element');
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adConfig.providerId}`;
        script.crossOrigin = 'anonymous';
        script.onload = () => console.log('AdSenseScript: Script loaded successfully');
        script.onerror = () => console.error('AdSenseScript: Script failed to load');
        document.head.appendChild(script);
        console.log('AdSenseScript: Script added to head');

        return () => {
          // Nettoyage si le composant est démonté
          const scriptToRemove = document.querySelector(`script[src*="${adConfig.providerId}"]`);
          if (scriptToRemove) {
            document.head.removeChild(scriptToRemove);
          }
        };
      } else {
        console.log('AdSenseScript: Script already exists');
      }
    } else {
      console.log('AdSenseScript: Conditions not met - loading:', loading, 'enabled:', adConfig.enabled, 'providerId:', adConfig.providerId);
    }
  }, [adConfig, loading]);

  return null; // Ce composant n'affiche rien, il charge juste le script
};

export default AdSenseScript;