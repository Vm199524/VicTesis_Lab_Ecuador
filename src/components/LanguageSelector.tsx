import React, { useEffect, useRef, useState } from 'react';
import { Check, Globe, ChevronDown } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';
import { LOCALES } from '../i18n/translations';

/**
 * Selector de idioma de la barra superior. Al cambiarlo, todo el portal —interfaz
 * y contenido— se reescribe en el idioma elegido.
 */
export const LanguageSelector: React.FC = () => {
  const { locale, setLocale, t } = usePreferences();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = LOCALES.find((item) => item.id === locale) ?? LOCALES[0];

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={t('nav.language')}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[13px] font-semibold text-blue-100/85 hover:text-white hover:bg-white/10 transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{active.id.toUpperCase()}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="surface absolute right-0 mt-1.5 w-44 rounded-xl overflow-hidden z-50 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {LOCALES.map((item) => {
            const isActive = item.id === locale;
            return (
              <button
                key={item.id}
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  setLocale(item.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-left transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-base leading-none">{item.flag}</span>
                <span className="flex-1">{item.label}</span>
                {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
