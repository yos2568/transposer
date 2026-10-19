import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Instrument } from '../core/types';
import { en, th, type MessageKey } from './messages';
import { instrumentNameTh } from './instrumentNamesTh';

export type Lang = 'en' | 'th';

const STORAGE_KEY = 'transposer.lang';
const TABLES: Record<Lang, Record<MessageKey, string>> = { en, th };

/** Fill {placeholders} in a message. Unknown placeholders are left visible. */
export function fill(template: string, vars?: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (vars && key in vars ? String(vars[key]) : match));
}

function readStoredLang(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'th' ? 'th' : 'en';
  } catch {
    return 'en'; // Storage can be blocked (private windows, strict settings).
  }
}

function storeLang(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Not stored; the choice lasts for this page only.
  }
}

interface I18n {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  instrumentName: (instrument: Instrument) => string;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    storeLang(next);
    document.documentElement.lang = next;
  }, []);

  // Keep the document language in step with the first render, too.
  useMemo(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<I18n>(() => {
    const table = TABLES[lang];
    return {
      lang,
      setLang,
      t: (key, vars) => fill(table[key], vars),
      instrumentName: (instrument) => (lang === 'th' ? instrumentNameTh(instrument.name) : instrument.name),
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
