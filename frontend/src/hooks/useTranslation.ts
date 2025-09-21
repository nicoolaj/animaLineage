import { useAppSelector, useAppDispatch } from '../store/hooks';
import { selectCurrentLanguage, setLanguage } from '../store/slices/languageSlice';
import { translations, Language, TranslationKey } from '../i18n/translations';
import { ErrorCode } from '../utils/errorCodes';

export const useTranslation = () => {
  const currentLanguage = useAppSelector(selectCurrentLanguage);
  const dispatch = useAppDispatch();

  // Fonction pour traduire un code d'erreur
  const translateError = (errorCode: ErrorCode): string => {
    return translations[currentLanguage].errors[errorCode] || errorCode;
  };

  // Fonction pour traduire un texte de l'interface utilisateur
  const t = (key: TranslationKey): string => {
    const keys = key.split('.') as any[];
    let value: any = translations[currentLanguage];

    for (const k of keys) {
      value = value?.[k];
    }

    return value || key;
  };

  // Fonction pour accéder aux traductions UI directement
  const ui = translations[currentLanguage].ui;
  const messages = translations[currentLanguage].messages;

  // Fonction pour changer de langue
  const changeLanguage = (language: Language) => {
    dispatch(setLanguage(language));
  };

  // Fonction pour obtenir le nom de la langue actuelle
  const getCurrentLanguageName = (): string => {
    return currentLanguage === 'fr' ? 'Français' : 'English';
  };

  // Fonction pour obtenir la liste des langues disponibles
  const getAvailableLanguages = (): Array<{ code: Language; name: string }> => [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' },
  ];

  return {
    currentLanguage,
    translateError,
    t,
    ui,
    messages,
    changeLanguage,
    getCurrentLanguageName,
    getAvailableLanguages,
  };
};