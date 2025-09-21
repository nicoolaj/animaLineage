import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Language } from '../../i18n/translations';

interface LanguageState {
  currentLanguage: Language;
}

const initialState: LanguageState = {
  currentLanguage: 'fr', // Français par défaut
};

const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.currentLanguage = action.payload;
      // Sauvegarder la préférence en localStorage
      localStorage.setItem('language', action.payload);
    },
    initializeLanguage: (state) => {
      // Charger la langue depuis localStorage ou utiliser la langue du navigateur
      const savedLanguage = localStorage.getItem('language') as Language;
      const browserLanguage = navigator.language.split('-')[0] as Language;

      if (savedLanguage && (savedLanguage === 'fr' || savedLanguage === 'en')) {
        state.currentLanguage = savedLanguage;
      } else if (browserLanguage === 'en' || browserLanguage === 'fr') {
        state.currentLanguage = browserLanguage;
      } else {
        state.currentLanguage = 'fr'; // Défaut français
      }
    },
  },
});

export const { setLanguage, initializeLanguage } = languageSlice.actions;

// Selectors
export const selectCurrentLanguage = (state: { language: LanguageState }) => state.language.currentLanguage;

export default languageSlice.reducer;