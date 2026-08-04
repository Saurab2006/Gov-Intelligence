'use client';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { t as translate, LOCALES } from '@/lib/i18n';

const LanguageContext = createContext(null);
const STORAGE_KEY = 'govinsight-locale';

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState('en');

  // Restore saved preference on mount (client-only; avoids SSR/client mismatch)
  useEffect(() => {
    try {
      const saved = document.cookie.split('; ').find(row => row.startsWith(`${STORAGE_KEY}=`));
      const value = saved ? saved.split('=')[1] : null;
      if (value && LOCALES[value]) setLocaleState(value);
    } catch { /* noop */ }
  }, []);

  const setLocale = useCallback((next) => {
    if (!LOCALES[next]) return;
    setLocaleState(next);
    try {
      document.cookie = `${STORAGE_KEY}=${next}; path=/; max-age=31536000`;
      document.documentElement.lang = next;
    } catch { /* noop */ }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'en' ? 'ne' : 'en');
  }, [locale, setLocale]);

  const value = useMemo(() => ({
    locale,
    setLocale,
    toggleLocale,
    t: (key) => translate(locale, key),
  }), [locale, setLocale, toggleLocale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}

// Convenience hook mirroring the shape used by next-i18next, so components
// read naturally: const { t } = useTranslation();
export function useTranslation() {
  const { t } = useLanguage();
  return { t };
}
