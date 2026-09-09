import React, { useState, useMemo } from 'react';
import { BOOLEAN_SAMPLES } from '../data/thesisData';
import { Search, Copy, Check, ExternalLink, Filter, Code2, Sparkles, Lightbulb, ChevronDown } from 'lucide-react';
import { ScopusQueryGenerator } from '../domain/ScopusQueryGenerator';
import { usePreferences } from '../context/PreferencesContext';

export const ScopusQueryBuilder: React.FC = () => {
  const { t, tf } = usePreferences();
  // Inputs
  const [term1, setTerm1] = useState('"Artificial Intelligence" OR "AI"');
  const [operator, setOperator] = useState<'AND' | 'OR' | 'AND NOT'>('AND');
  const [term2, setTerm2] = useState('"Customer Loyalty" OR "Customer Retention"');
  const [contextTerm, setContextTerm] = useState('"Retail" OR "E-commerce"');
  const [synonyms1, setSynonyms1] = useState('');
  const [synonyms2, setSynonyms2] = useState('');
  const [showTips, setShowTips] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const [openAccessOnly, setOpenAccessOnly] = useState(true);
  const [last5Years, setLast5Years] = useState(true);
  const [articlesOnly, setArticlesOnly] = useState(true);

  const [copiedEquation, setCopiedEquation] = useState(false);

  // OOP Domain Instance
  const queryGenerator = useMemo(() => {
    return new ScopusQueryGenerator({
      term1,
      operator,
      term2,
      contextTerm,
      synonyms1,
      synonyms2,
      openAccessOnly,
      last5Years,
      articlesOnly,
    });
  }, [term1, operator, term2, contextTerm, synonyms1, synonyms2, openAccessOnly, last5Years, articlesOnly]);

  const fullEquation = queryGenerator.buildFullScopusQuery();

  const handleCopy = () => {
    navigator.clipboard.writeText(fullEquation);
    setCopiedEquation(true);
    setTimeout(() => setCopiedEquation(false), 2000);
  };

  const handleLoadPreset = (sampleEquation: string) => {
    navigator.clipboard.writeText(sampleEquation);
    setCopiedEquation(true);
    setTimeout(() => setCopiedEquation(false), 2000);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(t('scopus.aiTip.prompt'));
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <section id="scopus-tool" className="py-8 scroll-mt-20 w-full max-w-full overflow-hidden">
      <div className="surface rounded-3xl p-5 sm:p-8 w-full max-w-full overflow-hidden">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                {t('scopus.badge')}
              </span>
              <span className="text-xs text-slate-500">{t('scopus.tagline')}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {t('scopus.title')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              {t('scopus.subtitle')}
            </p>
          </div>
        </div>

        {/* Builder Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mt-6 w-full">
          {/* Controls (Cols 1-7) */}
          <div className="lg:col-span-7 space-y-4 min-w-0">
            <h4 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-600" />
              <span>{t('scopus.builders')}</span>
            </h4>

            {/* Variable 1 input */}
            <div className="inset-surface rounded-2xl p-4">
              <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">
                {t('scopus.block1')}
              </label>
              <input
                type="text"
                value={term1}
                onChange={(e) => setTerm1(e.target.value)}
                placeholder={t('scopus.placeholder1')}
                className="field w-full rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono focus:ring-1 focus:ring-emerald-600"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                {t('scopus.tip')}
              </span>
              <input
                type="text"
                value={synonyms1}
                onChange={(e) => setSynonyms1(e.target.value)}
                placeholder={t('scopus.synonymsPlaceholder')}
                className="field w-full rounded-xl px-3.5 py-2 mt-2 text-xs font-mono focus:ring-1 focus:ring-emerald-600"
              />
              <span className="text-[10.5px] text-slate-400 mt-1 block">{t('scopus.synonymsHint')}</span>
            </div>

            {/* Operator selector */}
            <div className="flex items-center justify-center py-1">
              <div className="inline-flex rounded-xl bg-slate-200/80 p-1 border border-slate-300 shadow-inner">
                {(['AND', 'OR', 'AND NOT'] as const).map((op) => (
                  <button
                    key={op}
                    onClick={() => setOperator(op)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                      operator === op
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>

            {/* Variable 2 input */}
            <div className="inset-surface rounded-2xl p-4">
              <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">
                {t('scopus.block2')}
              </label>
              <input
                type="text"
                value={term2}
                onChange={(e) => setTerm2(e.target.value)}
                placeholder={t('scopus.placeholder2')}
                className="field w-full rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono focus:ring-1 focus:ring-emerald-600"
              />
              <input
                type="text"
                value={synonyms2}
                onChange={(e) => setSynonyms2(e.target.value)}
                placeholder={t('scopus.synonymsPlaceholder')}
                className="field w-full rounded-xl px-3.5 py-2 mt-2 text-xs font-mono focus:ring-1 focus:ring-emerald-600"
              />
              <span className="text-[10.5px] text-slate-400 mt-1 block">{t('scopus.synonymsHint')}</span>
            </div>

            {/* Context / Sector filter input */}
            <div className="inset-surface rounded-2xl p-4">
              <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">
                {t('scopus.context')}
              </label>
              <input
                type="text"
                value={contextTerm}
                onChange={(e) => setContextTerm(e.target.value)}
                placeholder='"Higher Education" OR "University"'
                className="field w-full rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {/* Quality Limiters Filters */}
            <div className="inset-surface rounded-2xl p-4">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wide block mb-2.5 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('scopus.limiters')}</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer bg-white hover:bg-slate-50 border-slate-200 p-3 rounded-xl border shadow-xs transition-all">
                  <input
                    type="checkbox"
                    checked={openAccessOnly}
                    onChange={(e) => setOpenAccessOnly(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-slate-800 font-bold">{t('scopus.openAccess')}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-white hover:bg-slate-50 border-slate-200 p-3 rounded-xl border shadow-xs transition-all">
                  <input
                    type="checkbox"
                    checked={last5Years}
                    onChange={(e) => setLast5Years(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-slate-800 font-bold">{t('scopus.last5')}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-white hover:bg-slate-50 border-slate-200 p-3 rounded-xl border shadow-xs transition-all">
                  <input
                    type="checkbox"
                    checked={articlesOnly}
                    onChange={(e) => setArticlesOnly(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-slate-800 font-bold">{t('scopus.onlyArticles')}</span>
                </label>
              </div>
            </div>

            {/* Tips avanzados: tesauro/sinónimos y filtrado de PDFs con IA */}
            <div className="inset-surface rounded-2xl p-4">
              <button
                onClick={() => setShowTips((value) => !value)}
                className="w-full flex items-center justify-between gap-2 text-left"
                aria-expanded={showTips}
              >
                <span className="text-xs font-black text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('scopus.tips.title')}</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                    showTips ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showTips && (
                <div className="mt-3 space-y-3">
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11.5px] font-black text-slate-800 mb-1">
                      {t('scopus.tips.thesaurus.title')}
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {t('scopus.tips.thesaurus.body')}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11.5px] font-black text-slate-800 mb-1">
                      {t('scopus.aiTip.title')}
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                      {t('scopus.aiTip.body')}
                    </p>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">
                          {t('scopus.aiTip.promptLabel')}
                        </span>
                        <button
                          onClick={handleCopyPrompt}
                          className="flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 hover:text-emerald-900"
                        >
                          {copiedPrompt ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedPrompt ? t('action.copied') : t('action.copy')}</span>
                        </button>
                      </div>
                      <p className="text-[10.5px] text-slate-600 font-mono leading-relaxed whitespace-pre-wrap">
                        {t('scopus.aiTip.prompt')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Generated Syntax Output (Cols 8-12) */}
          <div className="lg:col-span-5 space-y-4 min-w-0">
            <h4 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-600" />
              <span>{t('scopus.output')}</span>
            </h4>

            <div className="inset-surface rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-auto min-h-[260px] min-w-0">
              <div className="min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                    {t('scopus.syntax')}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl transition-all shadow-xs"
                  >
                    {copiedEquation ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedEquation ? t('action.copied') : t('scopus.copyEquation')}</span>
                  </button>
                </div>

                <pre className="text-xs font-mono text-emerald-950 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs overflow-x-auto whitespace-pre-wrap break-words break-all leading-relaxed max-w-full">
                  {fullEquation}
                </pre>
              </div>

              {/* Direct Quick Launch Links */}
              <div className="pt-4 border-t border-slate-200 mt-4 space-y-2">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide block">
                  {t('scopus.tryNow')}
                </span>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={queryGenerator.getGoogleScholarUrl()}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border-slate-200 text-xs font-bold border shadow-xs transition-all"
                  >
                    <span>Google Scholar</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  <a
                    href={queryGenerator.getScopusAdvancedUrl()}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border-slate-200 text-xs font-bold border shadow-xs transition-all"
                  >
                    <span>Scopus Advanced</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  <a
                    href={queryGenerator.getWebOfScienceUrl()}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border-slate-200 text-xs font-bold border shadow-xs transition-all"
                  >
                    <span>Web of Science</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="surface rounded-2xl p-4">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wide block mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('scopus.samples')}</span>
              </span>

              <div className="space-y-2">
                {BOOLEAN_SAMPLES.map((sample, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border-slate-200 transition-all flex items-center justify-between gap-2 border"
                  >
                    <div className="truncate text-xs">
                      <span className="font-extrabold text-slate-900 block truncate">
                        {tf(`boolean.${idx}.topic`, sample.topic)}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px] truncate block">
                        {sample.equation}
                      </span>
                    </div>
                    <button
                      onClick={() => handleLoadPreset(sample.equation)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-emerald-700 border-slate-200 text-[11px] font-bold border shrink-0 transition-all"
                    >
                      {t('action.copy')}
                    </button>
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
