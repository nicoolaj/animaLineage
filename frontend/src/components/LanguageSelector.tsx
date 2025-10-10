import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSelector: React.FC = () => {
  const { currentLanguage, changeLanguage, getAvailableLanguages } = useTranslation();
  const { config } = useLanguage();

  const languages = getAvailableLanguages();

  // Ne pas afficher le sélecteur si LANG_SELECTOR=false
  if (!config.selectorEnabled) {
    return null;
  }

  return (
    <div className="inline-block">
      <select
        value={currentLanguage}
        onChange={(e) => changeLanguage(e.target.value as 'fr' | 'en')}
        className="form-select text-sm cursor-pointer"
        title="Language"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-white text-gray-900">
            {lang.code === 'fr' ? '🇫🇷' : '🇬🇧'} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;