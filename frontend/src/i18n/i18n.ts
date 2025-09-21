import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import des traductions
import translationFR from './locales/fr.json';
import translationEN from './locales/en.json';

const resources = {
  fr: {
    translation: translationFR
  },
  en: {
    translation: translationEN
  }
};

i18n
  .use(LanguageDetector) // Détection automatique de la langue
  .use(initReactI18next) // Intégration avec React
  .init({
    resources,
    fallbackLng: 'fr', // Langue par défaut
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false, // React protège déjà contre XSS
    },

    detection: {
      // Options de détection de langue
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'animalineage_language',
    },

    // Namespace par défaut
    defaultNS: 'translation',
    ns: ['translation'],
  });

export default i18n;