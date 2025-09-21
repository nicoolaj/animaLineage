import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const LanguageSelector: React.FC = () => {
  const { currentLanguage, changeLanguage, getAvailableLanguages, ui } = useTranslation();

  const languages = getAvailableLanguages();

  return (
    <div className="language-selector">
      <select
        value={currentLanguage}
        onChange={(e) => changeLanguage(e.target.value as 'fr' | 'en')}
        className="language-select"
        title="Language"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.code === 'fr' ? '🇫🇷' : '🇬🇧'} {lang.name}
          </option>
        ))}
      </select>

      <style>{`
        .language-selector {
          display: inline-block;
        }

        .language-select {
          background: #374151;
          color: white;
          border: 1px solid #4b5563;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 14px;
          cursor: pointer;
          outline: none;
          transition: border-color 0.2s;
        }

        .language-select:hover {
          border-color: #3b82f6;
        }

        .language-select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .language-select option {
          background: #374151;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default LanguageSelector;