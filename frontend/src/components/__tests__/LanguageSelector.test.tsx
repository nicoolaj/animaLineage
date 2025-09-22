import React from 'react';
import { render, screen, fireEvent } from '../../test-utils/test-helpers';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import LanguageSelector from '../LanguageSelector';
import languageReducer from '../../store/slices/languageSlice';

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

const renderWithStore = (store: any) => {
  return render(
    <Provider store={store}>
      <LanguageSelector />
    </Provider>
  );
};

describe('LanguageSelector', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders language selector', () => {
    const store = createMockStore('fr');
    renderWithStore(store);

    const selector = screen.getByRole('combobox');
    expect(selector).toBeInTheDocument();
  });

  test('displays available languages', () => {
    const store = createMockStore('fr');
    renderWithStore(store);

    expect(screen.getByText('🇫🇷 Français')).toBeInTheDocument();
    expect(screen.getByText('🇬🇧 English')).toBeInTheDocument();
  });

  test('shows current language as selected', () => {
    const store = createMockStore('en');
    renderWithStore(store);

    const selector = screen.getByRole('combobox') as HTMLSelectElement;
    expect(selector.value).toBe('en');
  });

  test('triggers language change when option is selected', () => {
    const store = createMockStore('fr');
    renderWithStore(store);

    const selector = screen.getByRole('combobox');
    fireEvent.change(selector, { target: { value: 'en' } });

    // Vérifier que l'action est déclenchée en vérifiant l'état du store
    const state = store.getState();
    expect(state.language.currentLanguage).toBe('en');
  });
});