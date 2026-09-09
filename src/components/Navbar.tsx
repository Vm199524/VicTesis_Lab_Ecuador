import React, { useEffect, useRef, useState } from 'react';
import { ViewMode, EcosystemId } from '../types';
import { ChevronDown, Info, Menu, X, LogIn, LogOut, User } from 'lucide-react';
import { TesisEcuadorLogo } from './TesisEcuadorLogo';
import { LanguageSelector } from './LanguageSelector';
import { usePreferences } from '../context/PreferencesContext';
import { useAuth } from '../context/AuthContext';
import { ECOSYSTEMS_LIST } from '../data/ecosystems';

interface NavbarProps {
  viewMode: ViewMode;
  activeEcosystem: EcosystemId;
  onGoHome: () => void;
  onGoSlides: () => void;
  onOpenModule: (id: EcosystemId) => void;
  onOpenAbout: () => void;
  onOpenAuth: () => void;
}

/**
 * Barra superior institucional.
 *
 * Estructura de sitio profesional: identidad a la izquierda, navegación real al
 * centro (Inicio · Módulos · Presentación · Acerca) y acciones a la derecha
 * (idioma y contacto). No aloja controles de la vista de presentación: esos viven
 * dentro de la propia presentación.
 */
export const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  activeEcosystem,
  onGoHome,
  onGoSlides,
  onOpenModule,
  onOpenAbout,
  onOpenAuth,
}) => {
  const { t } = usePreferences();
  const { user, signOut } = useAuth();
  const [modulesOpen, setModulesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const modulesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!modulesOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (modulesRef.current && !modulesRef.current.contains(event.target as Node)) {
        setModulesOpen(false);
      }
    };
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModulesOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [modulesOpen]);

  // La barra vive sobre azul marino: los enlaces se dibujan en claro y el estado
  // activo se marca con superficie translucida mas un filo dorado inferior.
  const linkBase =
    'relative px-3 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 whitespace-nowrap';
  const linkIdle = 'text-blue-100/85 hover:text-white hover:bg-white/10';
  const linkActive =
    'text-white bg-white/15 after:absolute after:left-3 after:right-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-[#c9a227]';

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#001b30] via-[#002B49] to-[#003a63] backdrop-blur-md border-b border-[#c9a227]/35 shadow-[0_2px_16px_-4px_rgba(0,27,48,0.55)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Identidad */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-2.5 min-w-0 group"
          title={t('nav.home')}
        >
          <TesisEcuadorLogo size="sm" />
          <span className="text-left min-w-0 block">
            <span
              className="block text-[17px] leading-none truncate transition-colors"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '-0.005em' }}
            >
              <span className="bg-gradient-to-r from-white via-[#f6d97a] to-[#c9a227] bg-clip-text text-transparent group-hover:from-white group-hover:via-white group-hover:to-[#f0cf62]">
                VicTesis Lab
              </span>
            </span>
            <span className="mt-1 flex items-center gap-1.5 truncate">
              <span className="w-5 h-px bg-gradient-to-r from-[#c9a227] to-transparent shrink-0" />
              <span className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-blue-100/80">
                De la idea a la victoria
              </span>
            </span>
          </span>
        </button>

        {/* Navegación principal */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
          <button
            onClick={onGoHome}
            className={`${linkBase} ${viewMode === 'home' ? linkActive : linkIdle}`}
          >
            {t('nav.home')}
          </button>

          {/* Módulos: menú desplegable con los 8 destinos */}
          <div className="relative" ref={modulesRef}>
            <button
              onClick={() => setModulesOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={modulesOpen}
              className={`${linkBase} ${viewMode === 'module' ? linkActive : linkIdle} flex items-center gap-1`}
            >
              {t('nav.modules')}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${modulesOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {modulesOpen && (
              <div className="surface absolute left-1/2 -translate-x-1/2 mt-1.5 w-[26rem] rounded-2xl p-2 shadow-xl z-50 grid grid-cols-2 gap-1">
                {ECOSYSTEMS_LIST.map((item) => {
                  const Icon = item.icon;
                  const isActive = viewMode === 'module' && activeEcosystem === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onOpenModule(item.id);
                        setModulesOpen(false);
                      }}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-colors ${
                        isActive ? 'bg-blue-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg ${item.tint.soft} ${item.tint.text} flex items-center justify-center shrink-0`}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[9px] font-black tabular-nums text-slate-400 leading-none">
                          {item.number}
                        </span>
                        <span className="block text-[12.5px] font-bold text-slate-900 leading-tight truncate mt-0.5">
                          {t(`module.${item.id}.shortName`)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={onGoSlides}
            className={`${linkBase} ${viewMode === 'slides' ? linkActive : linkIdle}`}
          >
            {t('nav.presentation')}
          </button>

          <button onClick={onOpenAbout} className={`${linkBase} ${linkIdle}`}>
            {t('nav.about')}
          </button>
        </nav>

        {/* Acciones */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onOpenAbout}
            className="lg:hidden p-2 rounded-lg text-blue-100/85 hover:text-white hover:bg-white/10 transition-colors"
            title={t('nav.about')}
          >
            <Info className="w-4 h-4" />
          </button>

          <LanguageSelector />

          {user ? (
            <div className="hidden sm:flex items-center gap-1.5">
              <span
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/15 max-w-[190px]"
                title={user.email}
              >
                <span className="w-6 h-6 rounded-full bg-[#c9a227] text-[#002B49] text-[11px] font-black flex items-center justify-center shrink-0">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="text-[12.5px] font-semibold text-blue-50 truncate">
                  {user.name}
                </span>
              </span>
              <button
                onClick={() => void signOut()}
                title={t('auth.signOut')}
                className="p-2 rounded-lg text-blue-200/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-black bg-[#c9a227] hover:bg-[#dfb62f] text-[#002B49] shadow-sm hover:shadow-md hover:-translate-y-px transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>{t('auth.signIn')}</span>
            </button>
          )}

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden p-2 rounded-lg text-blue-100/85 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={t('nav.modules')}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Navegación móvil */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#002B49] px-4 py-3 space-y-1 max-h-[70vh] overflow-y-auto thin-scrollbar animate-in slide-in-from-top-2 fade-in duration-200">
          <button
            onClick={() => {
              onGoHome();
              setMobileOpen(false);
            }}
            className={`w-full text-left ${linkBase} ${viewMode === 'home' ? linkActive : linkIdle} block`}
          >
            {t('nav.home')}
          </button>

          <div className="pt-2">
            <span className="px-3 text-[10px] font-black uppercase tracking-widest text-[#c9a227]">
              {t('nav.modules')}
            </span>
            <div className="grid grid-cols-1 gap-0.5 mt-1">
              {ECOSYSTEMS_LIST.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onOpenModule(item.id);
                      setMobileOpen(false);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 text-left transition-colors"
                  >
                    <span
                      className={`w-7 h-7 rounded-lg ${item.tint.soft} ${item.tint.text} flex items-center justify-center shrink-0`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[13px] font-semibold text-blue-50 truncate">
                      {t(`module.${item.id}.shortName`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 space-y-1">
            <button
              onClick={() => {
                onGoSlides();
                setMobileOpen(false);
              }}
              className={`w-full text-left ${linkBase} ${viewMode === 'slides' ? linkActive : linkIdle} block`}
            >
              {t('nav.presentation')}
            </button>
            <button
              onClick={() => {
                onOpenAbout();
                setMobileOpen(false);
              }}
              className={`w-full text-left ${linkBase} ${linkIdle} block`}
            >
              {t('nav.about')}
            </button>
            {user ? (
              <button
                onClick={() => {
                  void signOut();
                  setMobileOpen(false);
                }}
                className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-bold bg-white/10 text-blue-50"
              >
                <User className="w-4 h-4" />
                {user.name} · {t('auth.signOut')}
              </button>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth();
                  setMobileOpen(false);
                }}
                className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-black bg-[#c9a227] text-[#002B49]"
              >
                <LogIn className="w-4 h-4" />
                {t('auth.signIn')}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
