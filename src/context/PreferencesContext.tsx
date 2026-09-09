import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_LOCALE,
  interpolate,
  translate,
  translateContent,
  type Locale,
} from '../i18n/translations';

const LOCALE_KEY = 'tesis-ecuador-locale';

interface PreferencesContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Traduce una clave de interfaz; admite placeholders {como este}. */
  t: (key: string, values?: Record<string, string | number>) => string;
  /**
   * Traduce contenido académico. Si la clave aún no está traducida devuelve el
   * texto en español que se le pasa, en vez de dejar la clave a la vista.
   */
  tf: (key: string, fallback: string) => string;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function readStoredLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(LOCALE_KEY);
    if (stored === 'es' || stored === 'en' || stored === 'pt' || stored === 'fr' || stored === 'it') {
      return stored;
    }
  } catch {
    // Sin almacenamiento disponible: se abre en español (América Latina).
  }
  return DEFAULT_LOCALE;
}

/**
 * Idioma del portal. Español de América Latina por defecto. Se aplica al elemento
 * raíz (`lang`) para que los lectores de pantalla y el navegador lo reconozcan.
 */
export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale());

  useEffect(() => {
    document.documentElement.setAttribute('lang', locale);
    try {
      window.localStorage.setItem(LOCALE_KEY, locale);
    } catch {
      // Sin persistencia disponible: el idioma dura lo que la sesión.
    }
  }, [locale]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      locale,
      setLocale: setLocaleState,
      t: (key, values) => {
        const text = translate(key, locale);
        return values ? interpolate(text, values) : text;
      },
      tf: (key, fallback) => translateContent(key, locale, fallback),
    }),
    [locale]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences debe usarse dentro de <PreferencesProvider>');
  }
  return context;
}
