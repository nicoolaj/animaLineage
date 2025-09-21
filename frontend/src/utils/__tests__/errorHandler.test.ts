import {
  extractErrorCode,
  createCodedError,
  validateRequired,
  validateEmail,
  validatePassword,
  ApplicationError,
  createError,
} from '../errorHandler';
import { ERROR_CODES } from '../errorCodes';

describe('errorHandler', () => {
  describe('ApplicationError', () => {
    test('crée une erreur avec code', () => {
      const error = new ApplicationError(ERROR_CODES.AUTH_001, 'Test message', { test: true });

      expect(error.code).toBe(ERROR_CODES.AUTH_001);
      expect(error.message).toBe('Test message');
      expect(error.details).toEqual({ test: true });
      expect(error.name).toBe('ApplicationError');
    });

    test('utilise le code comme message par défaut', () => {
      const error = new ApplicationError(ERROR_CODES.AUTH_001);

      expect(error.message).toBe(ERROR_CODES.AUTH_001);
    });
  });

  describe('createError', () => {
    test('crée une ApplicationError', () => {
      const error = createError(ERROR_CODES.AUTH_001, 'Test message');

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.code).toBe(ERROR_CODES.AUTH_001);
      expect(error.message).toBe('Test message');
    });
  });

  describe('extractErrorCode', () => {
    test('extrait le code d\'une ApplicationError', () => {
      const error = new ApplicationError(ERROR_CODES.AUTH_001);
      const code = extractErrorCode(error);

      expect(code).toBe(ERROR_CODES.AUTH_001);
    });

    test('extrait le code d\'un objet avec propriété code', () => {
      const error = { code: ERROR_CODES.AUTH_002 };
      const code = extractErrorCode(error);

      expect(code).toBe(ERROR_CODES.AUTH_002);
    });

    test('extrait le code d\'une réponse API', () => {
      const error = {
        response: {
          data: {
            code: ERROR_CODES.AUTH_003
          }
        }
      };
      const code = extractErrorCode(error);

      expect(code).toBe(ERROR_CODES.AUTH_003);
    });

    test('map les messages d\'erreur courants', () => {
      expect(extractErrorCode({ message: 'Invalid credentials' })).toBe(ERROR_CODES.AUTH_001);
      expect(extractErrorCode({ message: 'Access denied' })).toBe(ERROR_CODES.AUTH_006);
      expect(extractErrorCode({ message: 'Token expired' })).toBe(ERROR_CODES.AUTH_005);
      expect(extractErrorCode({ message: 'Network error' })).toBe(ERROR_CODES.SYS_001);
      expect(extractErrorCode({ status: 404, message: 'User not found' })).toBe(ERROR_CODES.USER_001);
      expect(extractErrorCode({ status: 404, message: 'Animal not found' })).toBe(ERROR_CODES.ANIMAL_001);
    });

    test('retourne SYS_010 pour les erreurs inconnues', () => {
      const code = extractErrorCode({ message: 'Unknown error' });

      expect(code).toBe(ERROR_CODES.SYS_010);
    });
  });

  describe('createCodedError', () => {
    test('crée un objet CodedError', () => {
      const error = {
        message: 'Test error',
        response: {
          data: {
            code: ERROR_CODES.AUTH_001,
            details: { field: 'email' }
          }
        }
      };

      const codedError = createCodedError(error);

      expect(codedError).toEqual({
        code: ERROR_CODES.AUTH_001,
        message: 'Test error',
        details: { code: ERROR_CODES.AUTH_001, details: { field: 'email' } }
      });
    });
  });

  describe('validateRequired', () => {
    test('valide les valeurs requises', () => {
      expect(validateRequired('test')).toBeNull();
      expect(validateRequired(123)).toBeNull();
      expect(validateRequired(true)).toBeNull();

      expect(validateRequired('')).toBe(ERROR_CODES.VAL_001);
      expect(validateRequired('   ')).toBe(ERROR_CODES.VAL_001);
      expect(validateRequired(null)).toBe(ERROR_CODES.VAL_001);
      expect(validateRequired(undefined)).toBe(ERROR_CODES.VAL_001);
    });
  });

  describe('validateEmail', () => {
    test('valide les emails corrects', () => {
      expect(validateEmail('test@example.com')).toBeNull();
      expect(validateEmail('user.name+tag@domain.co.uk')).toBeNull();
    });

    test('rejette les emails invalides', () => {
      expect(validateEmail('')).toBe(ERROR_CODES.VAL_001);
      expect(validateEmail('invalid-email')).toBe(ERROR_CODES.VAL_010);
      expect(validateEmail('test@')).toBe(ERROR_CODES.VAL_010);
      expect(validateEmail('@example.com')).toBe(ERROR_CODES.VAL_010);
    });
  });

  describe('validatePassword', () => {
    test('valide les mots de passe corrects', () => {
      expect(validatePassword('123456')).toBeNull();
      expect(validatePassword('password123')).toBeNull();
    });

    test('rejette les mots de passe invalides', () => {
      expect(validatePassword('')).toBe(ERROR_CODES.VAL_001);
      expect(validatePassword('12345')).toBe(ERROR_CODES.AUTH_002);
    });
  });
});