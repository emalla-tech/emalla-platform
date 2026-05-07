import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LANGUAGE_LABELS, SupportedLanguage, translations, TranslationTree } from './translations';

const STORAGE_KEY = 'emalla-language';

interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: TranslationTree;
  languages: typeof LANGUAGE_LABELS;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
    if (savedLanguage && savedLanguage in translations) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (nextLanguage: SupportedLanguage) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: translations[language],
      languages: LANGUAGE_LABELS
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider.');
  }

  return context;
};
