import React from 'react';
import { ArrowRight, ArrowUpRight, MessageCircle, Presentation, Sparkles } from 'lucide-react';
import { RobotFace } from './RobotFace';
import { ECOSYSTEMS_LIST } from '../data/ecosystems';
import { AdSlot } from './AdSlot';
import { usePreferences } from '../context/PreferencesContext';
import { useAuth } from '../context/AuthContext';
import type { EcosystemId } from '../types';

interface HomeDashboardProps {
  onOpenModule: (id: EcosystemId) => void;
  onGoSlides: () => void;
  onOpenTutor: () => void;
  onOpenWhatsapp: () => void;
}

/**
 * Panel principal en retícula bento.
 *
 * Cada módulo es una puerta de entrada del mismo peso visual. La retícula es
 * uniforme a propósito: nueve tarjetas iguales llenan tres filas exactas, sin
 * huecos, y el orden numerado marca por dónde empezar.
 */
export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onOpenModule,
  onGoSlides,
  onOpenTutor,
  onOpenWhatsapp,
}) => {
  const { t } = usePreferences();
  const { user } = useAuth();

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ---------------- Fila 1: bienvenida + tutor ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="card-rise lg:col-span-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#002B49] via-[#00447a] to-[#001c30] animate-gradient-shift text-white p-6 sm:p-8 shadow-[0_18px_40px_-18px_rgba(0,43,73,0.65)]">
          {/* Retícula tenue de fondo: da textura sin robar atención al texto. */}
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '38px 38px',
            }}
          />
          <div className="absolute -top-16 -right-10 w-72 h-72 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />

          {/* Barrido de luz: recorre la banda cada pocos segundos. */}
          <div className="absolute inset-y-0 left-0 w-1/3 pointer-events-none overflow-hidden">
            <div className="hero-sheen w-full h-full bg-gradient-to-r from-transparent via-white/12 to-transparent" />
          </div>

          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold">
              <Sparkles className="w-3 h-3 text-amber-300" />
              {t('brand.name')}
            </span>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-[1.1] mt-3">
              {user ? t('home.greetingNamed', { name: user.name.split(' ')[0] }) : t('home.greeting')}
            </h1>
            <p className="text-[13px] sm:text-[15px] text-blue-100/90 leading-relaxed mt-2.5">
              {t('home.subtitle')}
            </p>

            <div className="flex flex-wrap items-center gap-2.5 mt-5">
              <button
                onClick={() => onOpenModule('feasibility')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#002B49] text-[13px] font-black hover:bg-slate-100 transition-colors"
              >
                {t('home.startHere')}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onOpenModule('draft')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-[13px] font-bold transition-colors"
              >
                {t('home.reviewDraft')}
              </button>
            </div>
          </div>
        </section>

        <button
          onClick={onOpenTutor}
          style={{ '--rise-delay': '80ms' } as React.CSSProperties}
          className="card-rise surface-interactive lg:col-span-4 rounded-2xl p-6 text-left flex flex-col justify-between group"
        >
          <div>
            <span className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <RobotFace className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black text-slate-900 mt-3.5">{t('home.tutorTitle')}</h2>
            <p className="text-[13px] text-slate-500 leading-relaxed mt-1">{t('home.tutorBody')}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-blue-700 mt-5">
            {t('home.tutorCta')}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </button>
      </div>

      {/* ---------------- Fila 2: retícula bento de módulos ---------------- */}
      <section>
        <div className="flex items-end justify-between gap-3 mb-3 px-0.5">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {t('home.modulesTitle')}
            </h2>
            <p className="text-[13px] text-slate-500">{t('home.modulesSubtitle')}</p>
          </div>
          <span className="text-[11px] font-bold text-slate-400 tabular-nums shrink-0">
            {ECOSYSTEMS_LIST.length}
          </span>
        </div>

        {/* Retícula uniforme: los nueve módulos ocupan tres filas exactas, sin
            huecos ni tarjetas sueltas al final. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 items-stretch">
          {ECOSYSTEMS_LIST.map((item, index) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onOpenModule(item.id)}
                style={{ '--rise-delay': `${140 + index * 55}ms` } as React.CSSProperties}
                className={`card-rise surface-interactive ${item.tint.hoverBorder} group relative overflow-hidden rounded-2xl text-left flex flex-col h-full p-5`}
              >
                {/* Barra de identidad del módulo: crece a lo ancho al enfocarla. */}
                <span
                  className={`absolute inset-x-0 top-0 h-0.5 ${item.tint.bar} origin-left scale-x-100 md:scale-x-[0.35] group-hover:scale-x-100 transition-transform duration-300`}
                />

                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`w-11 h-11 rounded-xl ${item.tint.soft} ${item.tint.text} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="text-[11px] font-black tabular-nums text-slate-300 group-hover:text-slate-400 transition-colors">
                    {item.number}
                  </span>
                </div>

                <h3 className="font-black text-slate-900 tracking-tight leading-snug mt-3.5 text-[15px]">
                  {t(`module.${item.id}.shortName`)}
                </h3>
                <p className="text-slate-500 leading-relaxed mt-1 flex-1 text-[12px]">
                  {t(`module.${item.id}.description`)}
                </p>

                <span
                  className={`inline-flex items-center gap-1 text-[12px] font-bold ${item.tint.text} mt-4`}
                >
                  {t('home.open')}
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Franja publicitaria: separada del trabajo, entre secciones y nunca
          dentro de una herramienta. Solo aparece si hay cuenta de AdSense. */}
      <AdSlot slot={(import.meta.env.VITE_ADSENSE_SLOT_HOME as string) || ''} />

      {/* ---------------- Fila 3: presentación + acompañamiento ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <button
          onClick={onGoSlides}
          style={{ '--rise-delay': '640ms' } as React.CSSProperties}
          className="card-rise surface-interactive rounded-2xl p-6 text-left flex items-start gap-4 group"
        >
          <span className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
            <Presentation className="w-5 h-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-black text-slate-900">
              {t('home.presentationTitle')}
            </span>
            <span className="block text-[12.5px] text-slate-500 leading-relaxed mt-1">
              {t('home.presentationBody')}
            </span>
            <span className="inline-flex items-center gap-1 text-[12px] font-bold text-slate-700 mt-3">
              {t('home.presentationCta')}
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </span>
        </button>

        <div
          style={{ '--rise-delay': '700ms' } as React.CSSProperties}
          className="card-rise rounded-2xl p-6 bg-emerald-50 border border-emerald-300 flex items-start gap-4"
        >
          <span className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-[15px] font-black text-emerald-950">{t('home.helpTitle')}</h3>
            <p className="text-[12.5px] text-emerald-900/80 leading-relaxed mt-1">
              {t('home.helpBody')}
            </p>
            <button
              onClick={onOpenWhatsapp}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12.5px] font-bold mt-3 transition-colors"
            >
              {t('support.button')}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
