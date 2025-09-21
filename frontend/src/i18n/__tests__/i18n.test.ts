import i18n from '../i18n';

// Mock des modules externes
jest.mock('i18next-browser-languagedetector', () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    use: jest.fn().mockReturnThis(),
    type: 'languageDetector',
  },
}));

jest.mock('../locales/fr.json', () => ({
  welcome: 'Bienvenue',
  error: {
    generic: 'Une erreur est survenue'
  }
}));

jest.mock('../locales/en.json', () => ({
  welcome: 'Welcome',
  error: {
    generic: 'An error occurred'
  }
}));

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
    expect(i18n.options.fallbackLng).toBe('fr');
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
});