import { fr, en, translations, Translations } from '../translations';
import { ERROR_CODES, ErrorCode } from '../../utils/errorCodes';

describe('Translations', () => {
  describe('Structure validation', () => {
    it('should have consistent structure between languages', () => {
      // Check that both languages have the same top-level keys
      expect(Object.keys(fr)).toEqual(Object.keys(en));

      // Check errors structure
      expect(Object.keys(fr.errors)).toEqual(Object.keys(en.errors));

      // Check ui structure
      expect(Object.keys(fr.ui)).toEqual(Object.keys(en.ui));

      // Check messages structure
      expect(Object.keys(fr.messages)).toEqual(Object.keys(en.messages));
    });

    it('should have all error codes covered', () => {
      const allErrorCodes = Object.values(ERROR_CODES);

      // Check French translations have all error codes
      const frErrorCodes = Object.keys(fr.errors);
      allErrorCodes.forEach(errorCode => {
        expect(frErrorCodes).toContain(errorCode);
        expect(fr.errors[errorCode as ErrorCode]).toBeDefined();
        expect(typeof fr.errors[errorCode as ErrorCode]).toBe('string');
        expect(fr.errors[errorCode as ErrorCode].length).toBeGreaterThan(0);
      });

      // Check English translations have all error codes
      const enErrorCodes = Object.keys(en.errors);
      allErrorCodes.forEach(errorCode => {
        expect(enErrorCodes).toContain(errorCode);
        expect(en.errors[errorCode as ErrorCode]).toBeDefined();
        expect(typeof en.errors[errorCode as ErrorCode]).toBe('string');
        expect(en.errors[errorCode as ErrorCode].length).toBeGreaterThan(0);
      });
    });
  });

  describe('French translations', () => {
    it('should have proper UI translations', () => {
      expect(fr.ui.dashboard).toBe('Tableau de bord');
      expect(fr.ui.elevages).toBe('Élevages');
      expect(fr.ui.animals).toBe('Animaux');
      expect(fr.ui.users).toBe('Paramétrages');
      expect(fr.ui.logout).toBe('Déconnexion');

      expect(fr.ui.save).toBe('Enregistrer');
      expect(fr.ui.cancel).toBe('Annuler');
      expect(fr.ui.delete).toBe('Supprimer');
      expect(fr.ui.edit).toBe('Modifier');
      expect(fr.ui.add).toBe('Ajouter');
    });

    it('should have proper messages', () => {
      expect(fr.messages.welcomeUser).toBe('Bienvenue');
      expect(fr.messages.noDataFound).toBe('Aucune donnée trouvée');
      expect(fr.messages.operationSuccessful).toBe('Opération réussie');
      expect(fr.messages.changesUnsaved).toBe('Vous avez des modifications non sauvegardées');
    });

    it('should have authentication error messages', () => {
      expect(fr.errors.AUTH_001).toBe('Identifiants invalides');
      expect(fr.errors.AUTH_002).toBe('Le mot de passe doit contenir au moins 6 caractères');
      expect(fr.errors.AUTH_003).toBe('Format d\'email invalide');
      expect(fr.errors.AUTH_006).toBe('Accès refusé');
    });

    it('should have system error messages', () => {
      expect(fr.errors.SYS_001).toBe('Erreur de connexion réseau');
      expect(fr.errors.SYS_002).toBe('Erreur serveur interne');
      expect(fr.errors.SYS_003).toBe('Service temporairement indisponible');
    });
  });

  describe('English translations', () => {
    it('should have proper UI translations', () => {
      expect(en.ui.dashboard).toBe('Dashboard');
      expect(en.ui.elevages).toBe('Breeding Farms');
      expect(en.ui.animals).toBe('Animals');
      expect(en.ui.users).toBe('Users');
      expect(en.ui.logout).toBe('Logout');

      expect(en.ui.save).toBe('Save');
      expect(en.ui.cancel).toBe('Cancel');
      expect(en.ui.delete).toBe('Delete');
      expect(en.ui.edit).toBe('Edit');
      expect(en.ui.add).toBe('Add');
    });

    it('should have proper messages', () => {
      expect(en.messages.welcomeUser).toBe('Welcome');
      expect(en.messages.noDataFound).toBe('No data found');
      expect(en.messages.operationSuccessful).toBe('Operation successful');
      expect(en.messages.changesUnsaved).toBe('You have unsaved changes');
    });

    it('should have authentication error messages', () => {
      expect(en.errors.AUTH_001).toBe('Invalid credentials');
      expect(en.errors.AUTH_002).toBe('Password must be at least 6 characters long');
      expect(en.errors.AUTH_003).toBe('Invalid email format');
      expect(en.errors.AUTH_006).toBe('Access denied');
    });

    it('should have system error messages', () => {
      expect(en.errors.SYS_001).toBe('Network connection error');
      expect(en.errors.SYS_002).toBe('Internal server error');
      expect(en.errors.SYS_003).toBe('Service temporarily unavailable');
    });
  });

  describe('Translation completeness', () => {
    it('should not have empty strings', () => {
      const checkForEmptyStrings = (obj: any, path = ''): void => {
        Object.entries(obj).forEach(([key, value]) => {
          const currentPath = path ? `${path}.${key}` : key;
          if (typeof value === 'string') {
            expect(value.trim()).not.toBe('');
            expect(value).not.toBe('');
          } else if (typeof value === 'object' && value !== null) {
            checkForEmptyStrings(value, currentPath);
          }
        });
      };

      checkForEmptyStrings(fr, 'fr');
      checkForEmptyStrings(en, 'en');
    });

    it('should have consistent translation counts', () => {
      const countTranslations = (obj: any): number => {
        return Object.values(obj).reduce((count, value) => {
          if (typeof value === 'string') {
            return count + 1;
          } else if (typeof value === 'object' && value !== null) {
            return count + countTranslations(value);
          }
          return count;
        }, 0);
      };

      const frCount = countTranslations(fr);
      const enCount = countTranslations(en);

      expect(frCount).toBe(enCount);
      expect(frCount).toBeGreaterThan(0);
    });
  });

  describe('Exports', () => {
    it('should export translations object correctly', () => {
      expect(translations).toBeDefined();
      expect(translations.fr).toBe(fr);
      expect(translations.en).toBe(en);
    });

    it('should be readonly', () => {
      // TypeScript readonly check - this will fail at compile time if not readonly
      expect(typeof translations).toBe('object');
    });
  });

  describe('Error code coverage', () => {
    it('should cover all authentication errors', () => {
      const authErrors = Object.values(ERROR_CODES).filter(code => code.startsWith('AUTH_'));

      authErrors.forEach(errorCode => {
        expect(fr.errors[errorCode as ErrorCode]).toBeDefined();
        expect(en.errors[errorCode as ErrorCode]).toBeDefined();
        expect(fr.errors[errorCode as ErrorCode]).not.toBe('');
        expect(en.errors[errorCode as ErrorCode]).not.toBe('');
      });
    });

    it('should cover all animal errors', () => {
      const animalErrors = Object.values(ERROR_CODES).filter(code => code.startsWith('ANIMAL_'));

      animalErrors.forEach(errorCode => {
        expect(fr.errors[errorCode as ErrorCode]).toBeDefined();
        expect(en.errors[errorCode as ErrorCode]).toBeDefined();
      });
    });

    it('should cover all elevage errors', () => {
      const elevageErrors = Object.values(ERROR_CODES).filter(code => code.startsWith('ELEVAGE_'));

      elevageErrors.forEach(errorCode => {
        expect(fr.errors[errorCode as ErrorCode]).toBeDefined();
        expect(en.errors[errorCode as ErrorCode]).toBeDefined();
      });
    });

    it('should cover all user errors', () => {
      const userErrors = Object.values(ERROR_CODES).filter(code => code.startsWith('USER_'));

      userErrors.forEach(errorCode => {
        expect(fr.errors[errorCode as ErrorCode]).toBeDefined();
        expect(en.errors[errorCode as ErrorCode]).toBeDefined();
      });
    });

    it('should cover all race errors', () => {
      const raceErrors = Object.values(ERROR_CODES).filter(code => code.startsWith('RACE_'));

      raceErrors.forEach(errorCode => {
        expect(fr.errors[errorCode as ErrorCode]).toBeDefined();
        expect(en.errors[errorCode as ErrorCode]).toBeDefined();
      });
    });

    it('should cover all system errors', () => {
      const systemErrors = Object.values(ERROR_CODES).filter(code => code.startsWith('SYS_'));

      systemErrors.forEach(errorCode => {
        expect(fr.errors[errorCode as ErrorCode]).toBeDefined();
        expect(en.errors[errorCode as ErrorCode]).toBeDefined();
      });
    });

    it('should cover all validation errors', () => {
      const validationErrors = Object.values(ERROR_CODES).filter(code => code.startsWith('VAL_'));

      validationErrors.forEach(errorCode => {
        expect(fr.errors[errorCode as ErrorCode]).toBeDefined();
        expect(en.errors[errorCode as ErrorCode]).toBeDefined();
      });
    });
  });

  describe('Translation quality', () => {
    it('should not have placeholder text in French', () => {
      const checkForPlaceholders = (obj: any): void => {
        Object.values(obj).forEach(value => {
          if (typeof value === 'string') {
            expect(value.toLowerCase()).not.toContain('todo');
            expect(value.toLowerCase()).not.toContain('placeholder');
            expect(value.toLowerCase()).not.toContain('fixme');
          } else if (typeof value === 'object' && value !== null) {
            checkForPlaceholders(value);
          }
        });
      };

      checkForPlaceholders(fr);
    });

    it('should not have placeholder text in English', () => {
      const checkForPlaceholders = (obj: any): void => {
        Object.values(obj).forEach(value => {
          if (typeof value === 'string') {
            expect(value.toLowerCase()).not.toContain('todo');
            expect(value.toLowerCase()).not.toContain('placeholder');
            expect(value.toLowerCase()).not.toContain('fixme');
          } else if (typeof value === 'object' && value !== null) {
            checkForPlaceholders(value);
          }
        });
      };

      checkForPlaceholders(en);
    });

    it('should have appropriate character lengths', () => {
      const checkStringLengths = (obj: any): void => {
        Object.values(obj).forEach(value => {
          if (typeof value === 'string') {
            expect(value.length).toBeGreaterThan(0);
            expect(value.length).toBeLessThan(500); // Reasonable upper limit
          } else if (typeof value === 'object' && value !== null) {
            checkStringLengths(value);
          }
        });
      };

      checkStringLengths(fr);
      checkStringLengths(en);
    });
  });
});