import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useTranslation } from '../useTranslation';
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

describe('useTranslation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Fonctionnalités de base', () => {
    test('retourne la langue courante', () => {
      const store = createMockStore('fr');
      const { result } = renderHook(() => useTranslation(), {
        wrapper: (props: any) => wrapper({ ...props, store }),
      });

      expect(result.current.currentLanguage).toBe('fr');
    });

    test('traduit les codes d\'erreur', () => {
      const store = createMockStore('fr');
      const { result } = renderHook(() => useTranslation(), {
        wrapper: (props: any) => wrapper({ ...props, store }),
      });

      const translation = result.current.translateError(ERROR_CODES.AUTH_001);
      expect(translation).toBe('Identifiants invalides');
    });

    test('retourne le code si la traduction n\'existe pas', () => {
      const store = createMockStore('fr');
      const { result } = renderHook(() => useTranslation(), {
        wrapper: (props: any) => wrapper({ ...props, store }),
      });

      const translation = result.current.translateError('UNKNOWN_CODE' as any);
      expect(translation).toBe('UNKNOWN_CODE');
    });
  });

  describe('Interface utilisateur', () => {
    test('fournit l\'accès aux traductions UI', () => {
      const store = createMockStore('fr');
      const { result } = renderHook(() => useTranslation(), {
        wrapper: (props: any) => wrapper({ ...props, store }),
      });

      expect(result.current.ui.save).toBe('Enregistrer');
      expect(result.current.ui.cancel).toBe('Annuler');
      expect(result.current.ui.dashboard).toBe('Tableau de bord');
    });

    test('fournit l\'accès aux messages', () => {
      const store = createMockStore('fr');
      const { result } = renderHook(() => useTranslation(), {
        wrapper: (props: any) => wrapper({ ...props, store }),
      });

      expect(result.current.messages.welcomeUser).toBe('Bienvenue');
      expect(result.current.messages.noDataFound).toBe('Aucune donnée trouvée');
    });
  });

  describe('Changement de langue', () => {
    test('change la langue active', () => {
      const store = createMockStore('fr');
      const { result } = renderHook(() => useTranslation(), {
        wrapper: (props: any) => wrapper({ ...props, store }),
      });

      act(() => {
        result.current.changeLanguage('en');
      });

      // Récupérer le hook après changement
      const { result: newResult } = renderHook(() => useTranslation(), {
        wrapper: (props: any) => wrapper({ ...props, store }),
      });

      expect(newResult.current.currentLanguage).toBe('en');
      expect(newResult.current.ui.save).toBe('Save');
    });

    test('déclenche le changement de langue dans le store', () => {
      const store = createMockStore('fr');
      const { result } = renderHook(() => useTranslation(), {
        wrapper: (props: any) => wrapper({ ...props, store }),
      });

      act(() => {
        result.current.changeLanguage('en');
      });

      // Vérifier que l'état du store a changé
      const state = store.getState();
      expect(state.language.currentLanguage).toBe('en');
    });
  });

  describe('Traductions en anglais', () => {
    test('traduit correctement en anglais', () => {
      const store = createMockStore('en');
      const { result } = renderHook(() => useTranslation(), {
        wrapper: (props: any) => wrapper({ ...props, store }),
      });

      expect(result.current.translateError(ERROR_CODES.AUTH_001)).toBe('Invalid credentials');
      expect(result.current.ui.dashboard).toBe('Dashboard');
      expect(result.current.ui.elevages).toBe('Breeding Farms');
    });
  });

  describe('Utilitaires', () => {
    test('retourne le nom de la langue courante', () => {
      const storeFr = createMockStore('fr');
      const { result: resultFr } = renderHook(() => useTranslation(), {
        wrapper: (props: any) => wrapper({ ...props, store: storeFr }),
      });

      expect(resultFr.current.getCurrentLanguageName()).toBe('Français');

      const storeEn = createMockStore('en');
      const { result: resultEn } = renderHook(() => useTranslation(), {
        wrapper: (props: any) => wrapper({ ...props, store: storeEn }),
      });

      expect(resultEn.current.getCurrentLanguageName()).toBe('English');
    });

    test('retourne la liste des langues disponibles', () => {
      const store = createMockStore('fr');
      const { result } = renderHook(() => useTranslation(), {
        wrapper: (props: any) => wrapper({ ...props, store }),
      });

      const languages = result.current.getAvailableLanguages();
      expect(languages).toEqual([
        { code: 'fr', name: 'Français' },
        { code: 'en', name: 'English' },
      ]);
    });
  });
});