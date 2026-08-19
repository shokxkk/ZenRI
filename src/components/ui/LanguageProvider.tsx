'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  type Language,
  type TranslationKey,
  STORAGE_KEY,
  getTranslation,
  LANGUAGES,
} from '@/lib/i18n';

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  languages: typeof LANGUAGES;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'ru',
  setLang: () => {},
  t: (key) => key,
  languages: LANGUAGES,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('ru');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored && ['ru', 'uz', 'en'].includes(stored)) {
      setLangState(stored);
    }
    setMounted(true);
  }, []);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
    // Update <html lang=""> attribute dynamically
    document.documentElement.setAttribute('lang', newLang);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => getTranslation(lang, key),
    [lang]
  );

  if (!mounted) {
    // Avoid hydration mismatch – render with default 'ru' until client is ready
    return (
      <LanguageContext.Provider value={{ lang: 'ru', setLang, t: (key) => getTranslation('ru', key), languages: LANGUAGES }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
