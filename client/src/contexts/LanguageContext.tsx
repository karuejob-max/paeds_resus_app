import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  SupportedLanguage,
  TranslationDictionary,
  getTranslations,
  t,
  isRTL,
  detectBrowserLanguage,
  getSupportedLanguages,
  type LanguageConfig
} from '../../../shared/i18n';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  translations: TranslationDictionary;
  t: (path: string) => string;
  isRTL: boolean;
  supportedLanguages: LanguageConfig[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'paeds_resus_language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    // Check localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored && ['en', 'sw', 'fr', 'ar'].includes(stored)) {
        return stored as SupportedLanguage;
      }
    }
    // Fall back to browser detection
    return detectBrowserLanguage();
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
  };

  // Update document direction for RTL languages
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isRTL(language) ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    translations: getTranslations(language),
    t: (path: string) => t(language, path),
    isRTL: isRTL(language),
    supportedLanguages: getSupportedLanguages()
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
