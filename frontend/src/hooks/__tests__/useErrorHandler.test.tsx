import React from 'react';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useErrorHandler } from '../useErrorHandler';
import languageReducer from '../../store/slices/languageSlice';
import { ERROR_CODES } from '../../utils/errorCodes';

const createMockStore = (initialLanguage = 'fr') => {
  return configureStore({
    reducer: {
      language: languageReducer,
    },
    preloadedState: {
      language: {
        currentLanguage: initialLanguage,
      },
    },
  });
};

const wrapper = ({ children, store }: { children: React.ReactNode; store: any }) => {
  return React.createElement(Provider, { store }, children);
};

describe('useErrorHandler', () => {
  describe('translateError', () => {
    test('traduit un code d\'erreur en français', () => {
      const store = createMockStore('fr');
      const { result } = renderHook(() => useErrorHandler(), {
        wrapper: (props: any) => wrapper({ ...props, store }),
      });

      const translation = result.current.translateError(ERROR_CODES.AUTH_001);
      expect(translation).toBe('Identifiants invalides');
    });

    test('traduit un code d\'erreur en anglais', () => {
      const store = createMockStore('en');
      const { result } = renderHook(() => useErrorHandler(), {
        wrapper: (props: any) => wrapper({ ...props, store }),
      });

      const translation = result.current.translateError(ERROR_CODES.AUTH_001);
      expect(translation).toBe('Invalid credentials');
    });
  });

  describe('handleError', () => {
    test('traite une erreur avec code', () => {
      const store = createMockStore('fr');
      const { result } = renderHook(() => useErrorHandler(), {
        wrapper: (props: any) => wrapper({ ...props, store }),
      });

      const error = { code: ERROR_CODES.AUTH_001, message: 'Test' };
      const message = result.current.handleError(error);
      expect(message).toBe('Identifiants invalides');
    });

    test('traite une erreur réseau', () => {
      const store = createMockStore('fr');
      const { result } = renderHook(() => useErrorHandler(), {
        wrapper: (props: any) => wrapper({ ...props, store }),
      });

      const error = { name: 'NetworkError' };
      const message = result.current.handleError(error);
      expect(message).toBe('Erreur de connexion réseau');
    });

    test('traite un code d\'erreur string', () => {
      const store = createMockStore('fr');
      const { result } = renderHook(() => useErrorHandler(), {
        wrapper: (props: any) => wrapper({ ...props, store }),
      });

      const message = result.current.handleError(ERROR_CODES.AUTH_002);
      expect(message).toBe('Le mot de passe doit contenir au moins 6 caractères');
    });

    test('traite un message string non codé', () => {
      const store = createMockStore('fr');
      const { result } = renderHook(() => useErrorHandler(), {
        wrapper: (props: any) => wrapper({ ...props, store }),
      });

      const message = result.current.handleError('Custom error message');
      expect(message).toBe('Custom error message');
    });

    test('traite une Error standard', () => {
      const store = createMockStore('fr');
      const { result } = renderHook(() => useErrorHandler(), {
        wrapper: (props: any) => wrapper({ ...props, store }),
      });

      const error = new Error('Standard error');
      const message = result.current.handleError(error);
      expect(message).toBe('Standard error');
    });

    test('retourne un message par défaut pour les erreurs inconnues', () => {
      const store = createMockStore('fr');
      const { result } = renderHook(() => useErrorHandler(), {
        wrapper: (props: any) => wrapper({ ...props, store }),
      });

      const message = result.current.handleError({});
      expect(message).toBe('Une erreur inattendue s\'est produite');
    });
  });

  describe('createCodedError', () => {
    test('crée une erreur avec code', () => {
      const store = createMockStore('fr');
      const { result } = renderHook(() => useErrorHandler(), {
        wrapper: (props: any) => wrapper({ ...props, store }),
      });

      const codedError = result.current.createCodedError(ERROR_CODES.AUTH_001, 'Custom message', { test: true });

      expect(codedError.code).toBe(ERROR_CODES.AUTH_001);
      expect(codedError.message).toBe('Custom message');
      expect(codedError.details).toEqual({ test: true });
    });

    test('utilise la traduction comme message par défaut', () => {
      const store = createMockStore('fr');
      const { result } = renderHook(() => useErrorHandler(), {
        wrapper: (props: any) => wrapper({ ...props, store }),
      });

      const codedError = result.current.createCodedError(ERROR_CODES.AUTH_001);

      expect(codedError.message).toBe('Identifiants invalides');
    });
  });

  describe('isValidErrorCode', () => {
    test('valide les codes d\'erreur corrects', () => {
      const store = createMockStore('fr');
      const { result } = renderHook(() => useErrorHandler(), {
        wrapper: (props: any) => wrapper({ ...props, store }),
      });

      expect(result.current.isValidErrorCode(ERROR_CODES.AUTH_001)).toBe(true);
      expect(result.current.isValidErrorCode('INVALID_CODE')).toBe(false);
    });
  });

  describe('extractErrorCode', () => {
    test('extrait le code depuis une réponse API avec error_code', () => {
      const store = createMockStore('fr');
      const { result } = renderHook(() => useErrorHandler(), {
        wrapper: (props: any) => wrapper({ ...props, store }),
      });

      const response = { error_code: ERROR_CODES.AUTH_001 };
      const code = result.current.extractErrorCode(response);
      expect(code).toBe(ERROR_CODES.AUTH_001);
    });

    test('extrait le code depuis une réponse API avec code', () => {
      const store = createMockStore('fr');
      const { result } = renderHook(() => useErrorHandler(), {
        wrapper: (props: any) => wrapper({ ...props, store }),
      });

      const response = { code: ERROR_CODES.AUTH_002 };
      const code = result.current.extractErrorCode(response);
      expect(code).toBe(ERROR_CODES.AUTH_002);
    });

    test('retourne null pour les réponses sans code', () => {
      const store = createMockStore('fr');
      const { result } = renderHook(() => useErrorHandler(), {
        wrapper: (props: any) => wrapper({ ...props, store }),
      });

      const response = { message: 'Error without code' };
      const code = result.current.extractErrorCode(response);
      expect(code).toBe(null);
    });
  });

  describe('handleError avec error_code', () => {
    test('traite une erreur avec error_code depuis l\'API', () => {
      const store = createMockStore('fr');
      const { result } = renderHook(() => useErrorHandler(), {
        wrapper: (props: any) => wrapper({ ...props, store }),
      });

      const error = { error_code: ERROR_CODES.AUTH_001, message: 'API error message' };
      const message = result.current.handleError(error);
      expect(message).toBe('Identifiants invalides');
    });
  });
});