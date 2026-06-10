"use client";

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { session } from '@/lib/api';
import { dirFor, translations, type Locale, type TranslationKey } from './translations';

const STORAGE_KEY = 'admin.locale';

interface I18nContextValue {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function readInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'fa' || saved === 'en' ? saved : 'en';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  // Apply the locale: x-lang header (§7), <html lang/dir>, and persistence.
  const apply = useCallback((next: Locale) => {
    session.setLang(next);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next;
      document.documentElement.dir = dirFor(next);
    }
  }, []);

  // Hydrate from storage on mount (avoids SSR/client mismatch by starting at 'en').
  // setState here is intentional client-only hydration, not a render-driven sync.
  useEffect(() => {
    const initial = readInitialLocale();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocaleState(initial);
    apply(initial);
  }, [apply]);

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      apply(next);
      if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, next);
    },
    [apply],
  );

  const t = useCallback(
    (key: TranslationKey, fallback?: string) =>
      translations[locale][key] ?? translations.en[key] ?? fallback ?? key,
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, dir: dirFor(locale), setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>');
  return ctx;
}
