import React, { useState } from 'react';
import { ACADEMIC_TOOLS } from '../data/thesisData';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';

/** Categoría del catálogo → clave del diccionario. */
const CATEGORY_KEY: Record<string, string> = {
  Todas: 'toolbox.category.all',
  Busqueda: 'toolbox.category.search',
  Citas: 'toolbox.category.citations',
  Redaccion: 'toolbox.category.writing',
  Analisis: 'toolbox.category.analysis',
};

/** Modelo de pago del catálogo → clave del diccionario. */
const PRICING_KEY: Record<string, string> = {
  Gratuito: 'toolbox.pricing.free',
  Freemium: 'toolbox.pricing.freemium',
  Institucional: 'toolbox.pricing.institutional',
};

export const ToolboxGrid: React.FC = () => {
  const { t, tf } = usePreferences();
  const [activeCategory, setActiveCategory] = useState<string>('Todas');

  const categories = ['Todas', 'Busqueda', 'Citas', 'Redaccion', 'Analisis'];

  const filteredTools =
    activeCategory === 'Todas'
      ? ACADEMIC_TOOLS
      : ACADEMIC_TOOLS.filter((tool) => tool.category === activeCategory);

  const getCategoryLabel = (cat: string) => t(CATEGORY_KEY[cat] ?? cat);

  return (
    <section id="digital-toolbox" className="py-8 scroll-mt-20">
      <div className="surface rounded-3xl p-6 sm:p-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-fuchsia-100 text-fuchsia-900 border border-fuchsia-200 flex items-center gap-1">
                <span>{t('toolbox.badge')}</span>
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                {t('toolbox.tagline')}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {t('toolbox.title')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              {t('toolbox.subtitle')}
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? 'bg-white text-fuchsia-700 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              className="surface-interactive hover:border-fuchsia-300 rounded-2xl p-5 flex flex-col justify-between transition-all group hover-lift"
            >
              <div>
                {/* Header with badge & pricing */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                    {tf(`tool.${tool.id}.badge`, tool.badge)}
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                      tool.pricing === 'Gratuito'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : tool.pricing === 'Freemium'
                        ? 'bg-amber-50 text-amber-900 border-amber-200'
                        : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                    }`}
                  >
                    {t(PRICING_KEY[tool.pricing] ?? tool.pricing)}
                  </span>
                </div>

                <h4 className="text-base font-extrabold text-slate-900 group-hover:text-fuchsia-700 transition-colors flex items-center justify-between">
                  <span>{tf(`tool.${tool.id}.name`, tool.name)}</span>
                </h4>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {tf(`tool.${tool.id}.description`, tool.description)}
                </p>

                {/* Key Benefit */}
                <div className="mt-3 inset-surface p-3 rounded-xl">
                  <span className="text-[10px] font-black text-amber-800 uppercase tracking-wide block mb-0.5">
                    {t('toolbox.benefit')}
                  </span>
                  <p className="text-xs text-slate-700 font-medium leading-tight">
                    {tf(`tool.${tool.id}.keyBenefit`, tool.keyBenefit)}
                  </p>
                </div>
              </div>

              {/* Footer pro tip & link */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 truncate italic">
                  {tf(`tool.${tool.id}.proTip`, tool.proTip)}
                </span>

                <a
                  href={tool.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 font-bold text-xs transition-all shadow-xs shrink-0"
                >
                  <span>{t('toolbox.openSite')}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Academic Ethics & Anti-Turnitin Callout */}
        <div className="mt-8 bg-emerald-50/80 border border-emerald-300 rounded-2xl p-5 shadow-xs">
          <div className="flex items-start gap-3.5">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span>{t('toolbox.ethicsTitle')}</span>
              </h5>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed font-normal">
                {t('toolbox.ethicsIntro')}{' '}
                <strong>{t('toolbox.ethicsWarning')}</strong>
                {t('toolbox.ethicsRest')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
