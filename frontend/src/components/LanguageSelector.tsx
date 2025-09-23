import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const LanguageSelector: React.FC = () => {
  const { currentLanguage, changeLanguage, getAvailableLanguages, ui } = useTranslation();

  const languages = getAvailableLanguages();

  return (
    <div className="inline-block">
      <select
        value={currentLanguage}
        onChange={(e) => changeLanguage(e.target.value as 'fr' | 'en')}
        className="form-select text-sm cursor-pointer"
        title="Language"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-gray-700 text-white">
            {lang.code === 'fr' ? '🇫🇷' : '🇬🇧'} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;