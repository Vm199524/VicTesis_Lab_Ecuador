import React, { useState, useMemo } from 'react';
import { BookOpen, Copy, Check, Info, FileCheck2 } from 'lucide-react';
import { ApaCitationEngine, CitationStyle, AuthorCountCategory } from '../domain/ApaCitationEngine';
import { usePreferences } from '../context/PreferencesContext';

export const Apa7ReferenceHelper: React.FC = () => {
  const { t, tf } = usePreferences();
  const [authorCount, setAuthorCount] = useState<AuthorCountCategory>(3);
  const [citationType, setCitationType] = useState<CitationStyle>('parenthetical');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // OOP Domain Model Instance
  const citationEngine = useMemo(() => {
    return new ApaCitationEngine({
      authorCount,
      citationStyle: citationType,
      year: '2024',
      page: '42',
    });
  }, [authorCount, citationType]);

  const inTextCitation = citationEngine.generateInTextCitation();
  const referenceEntry = citationEngine.generateReferenceListEntry();
  const ruleExplanation = tf(citationEngine.getRuleKey(), citationEngine.getRuleExplanation());

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const citationOptions: { id: CitationStyle; title: string; desc: string }[] = [
    { id: 'parenthetical', title: t('apa.style.parenthetical'), desc: t('apa.style.parenthetical.desc') },
    { id: 'narrative', title: t('apa.style.narrative'), desc: t('apa.style.narrative.desc') },
    { id: 'directShort', title: t('apa.style.directShort'), desc: t('apa.style.directShort.desc') },
    { id: 'directBlock', title: t('apa.style.directBlock'), desc: t('apa.style.directBlock.desc') },
  ];

  return (
    <section id="apa-helper" className="py-8 scroll-mt-20 w-full max-w-full overflow-hidden">
      <div className="surface rounded-3xl p-5 sm:p-8 w-full max-w-full overflow-hidden">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-violet-50 text-violet-800 border border-violet-200">
                {t('apa.badge')}
              </span>
              <span className="text-xs text-slate-500">{t('apa.tagline')}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {t('apa.title')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              {t('apa.subtitle')}
            </p>
          </div>
        </div>

        {/* Interactive Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mt-6 w-full">
          {/* Settings / Controls (Cols 1-6) */}
          <div className="lg:col-span-6 space-y-4 min-w-0">
            <h4 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-violet-600" />
              <span>{t('apa.settings')}</span>
            </h4>

            {/* Author Count Selector */}
            <div className="inset-surface rounded-2xl p-4 sm:p-5">
              <label className="text-xs font-black text-slate-700 block mb-2 uppercase tracking-wide">
                {t('apa.authorCount')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([1, 2, 3] as AuthorCountCategory[]).map((count) => (
                  <button
                    key={count}
                    onClick={() => setAuthorCount(count)}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all border ${
                      authorCount === count
                        ? 'bg-violet-500 text-white border-violet-400 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {count === 3 ? t('apa.authors.three') : count === 1 ? t('apa.authors.one') : t('apa.authors.two')}
                  </button>
                ))}
              </div>

              <div className="mt-3 p-3 rounded-xl bg-violet-50/80 border border-violet-200 text-xs text-violet-900 leading-relaxed font-medium">
                <span className="font-extrabold">{t('apa.ruleLabel')}</span> {ruleExplanation}
              </div>
            </div>

            {/* Citation Type Selector */}
            <div className="inset-surface rounded-2xl p-4 sm:p-5">
              <label className="text-xs font-black text-slate-700 block mb-2 uppercase tracking-wide">
                {t('apa.integrationMode')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {citationOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setCitationType(option.id)}
                    className={`p-3 rounded-xl text-left text-xs transition-all border ${
                      citationType === option.id
                        ? 'bg-violet-50 border-violet-500 text-violet-950 font-black shadow-xs ring-1 ring-violet-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-black text-slate-900 mb-0.5">{option.title}</div>
                    <div className="text-[11px] text-slate-500">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time Previews (Cols 7-12) */}
          <div className="lg:col-span-6 space-y-4 min-w-0">
            <h4 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-violet-600" />
              <span>{t('apa.liveResult')}</span>
            </h4>

            {/* In-text preview */}
            <div className="inset-surface rounded-2xl p-4 sm:p-5 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                  {t('apa.inTextLabel')}
                </span>
                <button
                  onClick={() => handleCopy(inTextCitation, 'inText')}
                  className="flex items-center gap-1.5 text-xs font-bold text-violet-900 bg-violet-200 hover:bg-violet-300 px-3 py-1 rounded-xl transition-all shadow-xs"
                >
                  {copiedText === 'inText' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === 'inText' ? t('action.copied') : t('apa.copyCitation')}</span>
                </button>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 leading-relaxed font-serif shadow-xs break-words">
                {inTextCitation}
              </div>
            </div>

            {/* Reference entry preview */}
            <div className="inset-surface rounded-2xl p-4 sm:p-5 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                  {t('apa.referenceLabel')}
                </span>
                <button
                  onClick={() => handleCopy(referenceEntry, 'reference')}
                  className="flex items-center gap-1.5 text-xs font-bold text-violet-900 bg-violet-200 hover:bg-violet-300 px-3 py-1 rounded-xl transition-all shadow-xs"
                >
                  {copiedText === 'reference' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === 'reference' ? t('action.copied') : t('apa.copyReference')}</span>
                </button>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 leading-relaxed font-serif shadow-xs break-words">
                <p className="pl-6 -indent-6 break-words">{referenceEntry}</p>
              </div>
            </div>

            {/* Zotero Tip */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">
                <span className="font-extrabold text-blue-950 block mb-0.5">{t('apa.zoteroTitle')}</span>
                {t('apa.zoteroBody')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
