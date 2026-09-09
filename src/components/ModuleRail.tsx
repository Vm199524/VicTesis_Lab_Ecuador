import React, { useEffect, useState } from 'react';
import { PanelLeftClose, PanelLeftOpen, Check } from 'lucide-react';
import { ECOSYSTEMS_LIST } from '../data/ecosystems';
import { usePreferences } from '../context/PreferencesContext';
import type { EcosystemId } from '../types';

interface ModuleRailProps {
  activeEcosystem: EcosystemId;
  onSelectEcosystem: (id: EcosystemId) => void;
}

const COLLAPSE_KEY = 'tesis-ecuador-rail-collapsed';

/**
 * Riel de navegación vertical fijo, en vidrio esmerilado sobre el fondo oscuro.
 * Cada módulo tiene su propio acento de color (ver `src/data/ecosystems.ts`); ese
 * color vive solo en el icono y el indicador de selección, nunca en el fondo de la
 * fila completa, para que el vidrio se mantenga consistente en todo el riel.
 */
export const ModuleRail: React.FC<ModuleRailProps> = ({ activeEcosystem, onSelectEcosystem }) => {
  const { t } = usePreferences();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      // Sin almacenamiento disponible: el riel arranca expandido.
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((previous) => {
      const next = !previous;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        // Se ignora si el navegador bloquea el almacenamiento.
      }
      return next;
    });
  };

  return (
    <>
      {/* ---------- Escritorio: riel vertical fijo ---------- */}
      <nav
        aria-label="Módulos del portal"
        className={`hidden lg:flex flex-col shrink-0 sticky top-[80px] self-start transition-[width] duration-200 z-20 ${
          collapsed ? 'w-[68px]' : 'w-[228px]'
        }`}
      >
        <div className="surface rounded-2xl p-2 max-h-[calc(100vh-100px)] overflow-y-auto thin-scrollbar">
          <div
            className={`flex items-center gap-2 px-1 pb-2 mb-1 border-b border-slate-200 ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            {!collapsed && (
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                {t('rail.title')}
              </span>
            )}
            <button
              onClick={toggleCollapsed}
              title={collapsed ? t('rail.expand') : t('rail.collapse')}
              className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              {collapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          <ul className="space-y-0.5">
            {ECOSYSTEMS_LIST.map((item) => {
              const Icon = item.icon;
              const isActive = activeEcosystem === item.id;
              const shortName = t(`module.${item.id}.shortName`);
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onSelectEcosystem(item.id)}
                    title={collapsed ? `${item.number}. ${shortName}` : t(`module.${item.id}.description`)}
                    aria-current={isActive ? 'true' : undefined}
                    className={`relative w-full flex items-center gap-2.5 rounded-xl transition-all group ${
                      collapsed ? 'justify-center px-0 py-2.5' : 'px-2.5 py-2'
                    } ${
                      isActive
                        ? 'bg-slate-100'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Indicador de selección: color del módulo */}
                    <span
                      className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all ${
                        isActive ? `h-6 ${item.tint.bar}` : 'h-0 bg-transparent'
                      }`}
                    />

                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? `${item.tint.solid} text-white`
                          : `${item.tint.soft} ${item.tint.text}`
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </span>

                    {!collapsed && (
                      <span className="min-w-0 flex-1 text-left">
                        <span className="text-[9px] font-bold tabular-nums opacity-50 block leading-none text-slate-500">
                          {item.number}
                        </span>
                        <span
                          className={`text-[11.5px] font-extrabold leading-tight block truncate ${
                            isActive
                              ? 'text-slate-900'
                              : 'text-slate-600'
                          }`}
                        >
                          {shortName}
                        </span>
                      </span>
                    )}

                    {!collapsed && isActive && (
                      <Check className={`w-3.5 h-3.5 shrink-0 ${item.tint.text}`} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* ---------- Móvil y tablet: tira horizontal fija ---------- */}
      <nav
        aria-label="Módulos del portal"
        className="lg:hidden sticky top-16 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-[#eaeff6]/92 backdrop-blur-md border-b border-slate-200"
      >
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {ECOSYSTEMS_LIST.map((item) => {
            const Icon = item.icon;
            const isActive = activeEcosystem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectEcosystem(item.id)}
                aria-current={isActive ? 'true' : undefined}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all flex items-center gap-1.5 border whitespace-nowrap shrink-0 ${
                  isActive
                    ? `${item.tint.solid} text-white border-transparent`
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="opacity-60 tabular-nums">{item.number}</span>
                <span>{t(`module.${item.id}.shortName`)}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
