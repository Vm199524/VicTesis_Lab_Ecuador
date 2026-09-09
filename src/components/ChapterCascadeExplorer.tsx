import React, { useState } from 'react';
import { CHAPTERS_DATA } from '../data/thesisData';
import {
  FileText,
  Copy,
  Check,
  AlertOctagon,
  CheckCircle2,
} from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';

export const ChapterCascadeExplorer: React.FC = () => {
  const { t, tf } = usePreferences();
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [copiedTemplate, setCopiedTemplate] = useState<boolean>(false);

  const currentChapter = CHAPTERS_DATA[activeChapterIndex];

  const handleCopyTemplate = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  return (
    <section id="chapters-cascade" className="py-8 scroll-mt-20 w-full max-w-full overflow-hidden">
      <div className="surface rounded-3xl p-5 sm:p-8 w-full max-w-full overflow-hidden">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200">
                {t('chapters.badge')}
              </span>
              <span className="text-xs text-slate-500">{t('chapters.tagline')}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {t('chapters.title')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              {t('chapters.subtitle')}
            </p>
          </div>
        </div>

        {/* Visual Cascade Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mt-6 w-full">
          {CHAPTERS_DATA.map((ch, idx) => {
            const isActive = activeChapterIndex === idx;
            return (
              <button
                key={ch.number}
                onClick={() => setActiveChapterIndex(idx)}
                className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden min-w-0 ${
                  isActive
                    ? 'bg-[#002B49] text-white border-[#002B49] shadow-md ring-2 ring-blue-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs font-black uppercase tracking-wider ${
                      isActive ? 'text-amber-300' : 'text-blue-700'
                    }`}
                  >
                    {tf(`chapter.roman.${ch.number}`, ch.roman)}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider ${
                      isActive ? 'bg-amber-400 text-[#002B49]' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    Fase {idx + 1}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-extrabold truncate">
                  {tf(`chapter.${ch.number}.title`, ch.title).split('&')[0]}
                </p>
                <span
                  className={`text-[11px] block mt-1 font-medium truncate ${
                    isActive ? 'text-blue-100' : 'text-slate-500'
                  }`}
                >
                  {t(`chapters.step.${idx}`)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Chapter Details */}
        <div className="mt-6 inset-surface rounded-2xl p-5 sm:p-7 w-full max-w-full overflow-hidden">
          {/* Chapter Heading */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="min-w-0">
              <span className="text-xs font-black text-blue-700 uppercase tracking-widest block">
                {tf(`chapter.roman.${currentChapter.number}`, currentChapter.roman)} • {t('chapters.guideLabel')}
              </span>
              <h4 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 break-words">
                {tf(`chapter.${currentChapter.number}.title`, currentChapter.title)}
              </h4>
              <p className="text-xs sm:text-sm text-amber-900 font-bold mt-1 italic break-words">
                {t('chapters.keyQuestion')}: "{tf(`chapter.${currentChapter.number}.question`, currentChapter.question)}"
              </p>
            </div>

            <button
              onClick={() =>
                handleCopyTemplate(
                  `${currentChapter.roman}: ${currentChapter.title}\nPropósito: ${currentChapter.purpose}\n\nFórmula / Plantilla:\n${currentChapter.formulaOrTemplate}\n\nError a evitar:\n${currentChapter.keyMistake}`
                )
              }
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border-slate-200 text-xs font-bold border transition-all shadow-xs shrink-0 self-start md:self-auto"
            >
              {copiedTemplate ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedTemplate ? t('action.copied') : t('chapters.copySummary')}</span>
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 mt-4 leading-relaxed font-medium">
            {tf(`chapter.${currentChapter.number}.purpose`, currentChapter.purpose)}
          </p>

          {/* 3 Pillars for the Chapter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mt-6 w-full">
            {/* Deliverables */}
            <div className="surface rounded-2xl p-5 min-w-0">
              <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>{t('chapters.deliverables')}</span>
              </h5>
              <ul className="space-y-2.5 text-xs text-slate-700">
                {currentChapter.deliverables.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                    <span className="break-words">
                      {tf(`chapter.${currentChapter.number}.deliverable.${i}`, item)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Common Pitfall */}
            <div className="surface rounded-2xl p-5 min-w-0">
              <h5 className="text-xs font-black uppercase tracking-wider text-rose-800 flex items-center gap-2 mb-3">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>{t('chapters.mistake')}</span>
              </h5>
              <p className="text-xs text-rose-900 leading-relaxed bg-rose-50 border border-rose-200 p-3 rounded-xl font-medium break-words">
                {tf(`chapter.${currentChapter.number}.keyMistake`, currentChapter.keyMistake)}
              </p>

              <div className="mt-4">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide block mb-1">
                  {t('chapters.template')}:
                </span>
                <p className="text-xs font-mono inset-surface p-2.5 rounded-xl text-emerald-900 leading-relaxed break-words break-all">
                  {tf(`chapter.${currentChapter.number}.formulaOrTemplate`, currentChapter.formulaOrTemplate)}
                </p>
              </div>
            </div>

            {/* Checklist */}
            <div className="surface rounded-2xl p-5 min-w-0">
              <h5 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t('chapters.checklist')}</span>
              </h5>
              <div className="space-y-2 text-xs text-slate-700">
                {currentChapter.checklist.map((check, i) => (
                  <div key={i} className="flex items-start gap-2 inset-surface p-2.5 rounded-xl">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="break-words font-medium">
                      {tf(`chapter.${currentChapter.number}.check.${i}`, check)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
