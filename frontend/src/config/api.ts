// Configuration centralisée de l'API
export const API_CONFIG = {
  // Utilise la variable d'environnement REACT_APP_API_URL si définie, sinon localhost pour le développement
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001/',

  // Autres configurations API si nécessaire
  TIMEOUT: 10000,

  // Helper pour construire les URLs complètes
  buildUrl: (endpoint: string) => {
    const baseUrl = API_CONFIG.BASE_URL.endsWith('/')
      ? API_CONFIG.BASE_URL.slice(0, -1)
      : API_CONFIG.BASE_URL;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${cleanEndpoint}`;
  }
};

// Export direct de l'URL de base pour la compatibilité
export const API_BASE_URL = API_CONFIG.BASE_URL;
