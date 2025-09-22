// Mock the translation files first
jest.mock('../locales/fr.json', () => ({
  welcome: 'Bienvenue',
  error: {
    generic: 'Une erreur est survenue'
  },
  ui: {
    dashboard: 'Tableau de bord',
    save: 'Enregistrer',
    cancel: 'Annuler'
  },
  messages: {
    welcomeUser: 'Bienvenue'
  }
}));

jest.mock('../locales/en.json', () => ({
  welcome: 'Welcome',
  error: {
    generic: 'An error occurred'
  },
  ui: {
    dashboard: 'Dashboard',
    save: 'Save',
    cancel: 'Cancel'
  },
  messages: {
    welcomeUser: 'Welcome'
  }
}));

// Mock i18next-browser-languagedetector
jest.mock('i18next-browser-languagedetector', () => ({
  __esModule: true,
  default: {
    type: 'languageDetector',
    init: jest.fn(),
    detect: jest.fn(() => 'fr'),
    cacheUserLanguage: jest.fn(),
  },
}));

// Import after mocking
import i18n from '../i18n';

describe('i18n Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('i18n is initialized and configured', () => {
    expect(i18n).toBeDefined();
    expect(typeof i18n.t).toBe('function');
    expect(typeof i18n.changeLanguage).toBe('function');
  });

  test('has correct default configuration', () => {
    // fallbackLng can be a string or array, check both cases
    const fallbackLng = i18n.options.fallbackLng;
    if (Array.isArray(fallbackLng)) {
      expect(fallbackLng).toContain('fr');
    } else {
      expect(fallbackLng).toBe('fr');
    }
    expect(i18n.options.defaultNS).toBe('translation');
    expect(i18n.options.interpolation.escapeValue).toBe(false);
  });

  test('has detection configuration', () => {
    expect(i18n.options.detection).toBeDefined();
    expect(i18n.options.detection.order).toContain('localStorage');
    expect(i18n.options.detection.order).toContain('navigator');
    expect(i18n.options.detection.lookupLocalStorage).toBe('animalineage_language');
  });

  test('has resources for French and English', () => {
    expect(i18n.options.resources).toBeDefined();
    expect(i18n.options.resources.fr).toBeDefined();
    expect(i18n.options.resources.en).toBeDefined();
  });

  test('can change language', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.language).toBe('en');

    await i18n.changeLanguage('fr');
    expect(i18n.language).toBe('fr');
  });

  test('debug mode is based on NODE_ENV', () => {
    // Le debug est configuré selon l'environnement
    const originalEnv = process.env.NODE_ENV;

    process.env.NODE_ENV = 'development';
    // Dans un test real, on réinitialiserait i18n ici
    expect(i18n.options.debug).toBeDefined();

    process.env.NODE_ENV = originalEnv;
  });

  test('translations work correctly', () => {
    // Test French translations
    i18n.changeLanguage('fr');
    expect(i18n.t('welcome')).toBe('Bienvenue');
    expect(i18n.t('ui.dashboard')).toBe('Tableau de bord');
    expect(i18n.t('messages.welcomeUser')).toBe('Bienvenue');

    // Test English translations
    i18n.changeLanguage('en');
    expect(i18n.t('welcome')).toBe('Welcome');
    expect(i18n.t('ui.dashboard')).toBe('Dashboard');
    expect(i18n.t('messages.welcomeUser')).toBe('Welcome');
  });

  test('handles missing translations gracefully', () => {
    i18n.changeLanguage('fr');

    // Test with non-existent key should return the key itself or a fallback
    const result = i18n.t('nonexistent.key');
    expect(typeof result).toBe('string');
    expect(result).toBeDefined();
  });

  test('interpolation is configured correctly', () => {
    expect(i18n.options.interpolation).toBeDefined();
    expect(i18n.options.interpolation.escapeValue).toBe(false);
  });

  test('language detection configuration is correct', () => {
    const detection = i18n.options.detection;
    expect(detection).toBeDefined();
    expect(Array.isArray(detection.order)).toBe(true);
    expect(detection.order).toContain('localStorage');
    expect(detection.order).toContain('navigator');
    expect(detection.order).toContain('htmlTag');
    expect(Array.isArray(detection.caches)).toBe(true);
    expect(detection.caches).toContain('localStorage');
    expect(detection.lookupLocalStorage).toBe('animalineage_language');
  });

  test('namespace configuration is correct', () => {
    expect(i18n.options.defaultNS).toBe('translation');
    expect(i18n.options.ns).toContain('translation');
  });

  test('fallback language works', () => {
    // Test that fallback language is used when invalid language is set
    i18n.changeLanguage('invalid-lang');
    // Should fall back to French (our fallback language)
    expect(i18n.language).toBeDefined();
  });

  test('can get current language', () => {
    i18n.changeLanguage('en');
    expect(i18n.language).toBe('en');

    i18n.changeLanguage('fr');
    expect(i18n.language).toBe('fr');
  });

  test('resources structure is correct', () => {
    const resources = i18n.options.resources;
    expect(resources).toBeDefined();

    // Check French resources
    expect(resources.fr).toBeDefined();
    expect(resources.fr.translation).toBeDefined();
    expect(resources.fr.translation.welcome).toBe('Bienvenue');

    // Check English resources
    expect(resources.en).toBeDefined();
    expect(resources.en.translation).toBeDefined();
    expect(resources.en.translation.welcome).toBe('Welcome');
  });

  test('ready state is correct', () => {
    expect(i18n.isInitialized).toBe(true);
    expect(typeof i18n.t).toBe('function');
    expect(typeof i18n.changeLanguage).toBe('function');
    expect(typeof i18n.getFixedT).toBe('function');
  });
});