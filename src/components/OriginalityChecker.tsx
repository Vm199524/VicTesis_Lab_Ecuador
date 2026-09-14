import React from 'react';
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  MinusCircle,
  RotateCcw,
  Scale,
  Search,
  ShieldCheck,
  Type,
  UploadCloud,
  X,
} from 'lucide-react';
import { AcademicIntegrityLogo } from './AcademicIntegrityLogo';
import { usePreferences } from '../context/PreferencesContext';
import {
  PROVIDERS,
  TEXT_LIMITS,
  UPLOAD,
  useOriginalityCheck,
  type ProviderState,
} from '../context/OriginalityCheckContext';

/* ------------------------------------------------------------------ *
 * Componente
 * ------------------------------------------------------------------ */

/**
 * Verificador de Originalidad Académica integrado en el portal.
 *
 * Habla con el servicio de detección a través del propio servidor del portal
 * (`/api/originality/*`), de modo que el navegador nunca necesita conocer ni
 * alcanzar el puerto del servicio.
 *
 * El estado del análisis vive en `OriginalityCheckContext`, montado en la raíz
 * de la app: este componente es puramente de presentación y puede desmontarse
 * y remontarse —al cambiar de módulo, al volver al inicio— sin que el progreso
 * se pierda. Ver el comentario del contexto para el porqué.
 */
export const OriginalityChecker: React.FC = () => {
  const { t, locale } = usePreferences();
  const {
    text,
    setText,
    doc,
    setDoc,
    excludeCitations,
    setExcludeCitations,
    isChecking,
    isUploading,
    isDownloading,
    isDownloadingAi,
    isDetectingAi,
    result,
    aiResult,
    error,
    setError,
    notice,
    setNotice,
    isDragging,
    setIsDragging,
    status,
    inputRef,
    wordCount,
    sizeBytes,
    overLimit,
    canCheck,
    nf,
    answeredCount,
    matchedCount,
    progress,
    isBusy,
    hasSomethingToClear,
    uploadFile,
    resetAnalysis,
    handleReset,
    handleCheck,
    handleDownloadReport,
    handleDetectAi,
    handleDownloadAiReport,
  } = useOriginalityCheck();

  const scoreColor = (score: number) =>
    score < 20 ? 'text-emerald-600' : score < 50 ? 'text-amber-600' : 'text-red-600';

  /**
   * Bandas de IA, deliberadamente distintas de las de similitud: aquí un 40% no
   * es «moderado» sino «no concluyente», y el color no debe insinuar un veredicto
   * que la medición no sostiene. Reutilizar `scoreColor` mentiría sobre eso.
   */
  const aiScoreColor = (score: number) =>
    score < 30
      ? 'text-emerald-600'
      : score < 55
        ? 'text-amber-600'
        : score < 75
          ? 'text-orange-600'
          : 'text-red-600';

  /* ---------------- Render ---------------- */

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ---------- Cabecera del verificador ---------- */}
      <div className="surface rounded-2xl px-4 sm:px-5 py-3.5 flex items-center gap-3">
        <AcademicIntegrityLogo size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[16px] sm:text-[19px] font-black text-slate-900 tracking-tight leading-tight">
              {t('plag.title')}
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[11px] font-bold">
              Ver. 2.0
            </span>
          </div>
          <p className="text-[12px] text-slate-500 leading-tight mt-0.5 truncate">
            {t('plag.tagline')}
          </p>
          <span className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t('plag.privacyBadge')}
          </span>
        </div>

        {/* Reinicio: vive en la cabecera porque hace falta en cuanto hay algo
            cargado, no solo al terminar un informe. */}
        <button
          onClick={handleReset}
          disabled={isBusy || !hasSomethingToClear}
          title={t('plag.resetHint')}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-600 text-[12.5px] font-bold hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">{t('plag.reset')}</span>
        </button>
      </div>

      {(error || notice) && (
        <div
          className={`rounded-xl px-4 py-3 text-[13px] font-semibold flex items-start gap-2.5 ${
            error
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="flex-1">{error ?? notice}</span>
          <button
            onClick={() => (error ? setError(null) : setNotice(null))}
            className="shrink-0 opacity-60 hover:opacity-100"
            aria-label={t('action.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ---------- Retícula principal ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Columna izquierda: entrada del documento */}
        <section className="lg:col-span-7 surface rounded-2xl p-4 sm:p-5 space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              void uploadFile(e.dataTransfer.files?.[0]);
            }}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
            }}
            className={`rounded-xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-teal-400 bg-teal-50/60'
                : 'border-slate-300 hover:border-teal-300 hover:bg-slate-50'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept={UPLOAD.accept}
              className="hidden"
              onChange={(e) => void uploadFile(e.target.files?.[0])}
            />
            {isUploading ? (
              <Loader2 className="w-9 h-9 mx-auto text-teal-600 animate-spin" />
            ) : (
              <UploadCloud className="w-9 h-9 mx-auto text-slate-400" strokeWidth={1.5} />
            )}
            <p className="text-[14px] font-semibold text-slate-700 mt-3">{t('plag.dropTitle')}</p>
            <p className="text-[13px] text-slate-500 mt-0.5">{t('plag.dropSub')}</p>
          </div>

          <div className="flex items-end justify-between gap-3">
            <label htmlFor="originality-text" className="text-[14px] font-bold text-slate-800">
              {t('plag.pasteLabel')}
            </label>
            <span
              className={`text-[12px] tabular-nums shrink-0 ${
                overLimit ? 'font-bold text-red-600' : 'text-slate-500'
              }`}
            >
              {nf.format(text.length)} / {nf.format(TEXT_LIMITS.max)}
            </span>
          </div>

          <textarea
            id="originality-text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setDoc(null);
              resetAnalysis();
            }}
            placeholder={t('plag.placeholder', { min: nf.format(TEXT_LIMITS.min) })}
            className="w-full min-h-[280px] rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-[13.5px] leading-relaxed text-slate-800 thin-scrollbar focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 resize-y"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
            <span className="inline-flex items-center gap-1.5 text-slate-500">
              <Type className="w-3.5 h-3.5" />
              {nf.format(text.length)} {t('plag.characters')} · {nf.format(wordCount)}{' '}
              {t('plag.words')}
            </span>
            {text.length > 0 && text.length < TEXT_LIMITS.min && (
              <span className="text-amber-600 font-semibold">
                {t('plag.minHint', { min: nf.format(TEXT_LIMITS.min) })}
              </span>
            )}
            {overLimit && (
              <span className="text-red-600 font-bold">
                {t('plag.overLimit', { extra: nf.format(text.length - TEXT_LIMITS.max) })}
              </span>
            )}
          </div>

          <div className="border-t border-slate-200 pt-3.5 flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={excludeCitations}
              onClick={() => setExcludeCitations((v) => !v)}
              disabled={isChecking}
              className={`relative w-12 h-7 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
                excludeCitations ? 'bg-[#002B49]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  excludeCitations ? 'translate-x-5' : ''
                }`}
              />
            </button>
            <span className="text-[14px] font-semibold text-slate-700">
              {t('plag.excludeCitations')}
            </span>
          </div>
        </section>

        {/* Columna derecha: resumen y estado */}
        <div className="lg:col-span-5 space-y-4">
          <section className="surface rounded-2xl p-4 sm:p-5">
            <h3 className="text-[17px] font-black text-slate-900 tracking-tight">
              {t('plag.summaryTitle')}
            </h3>

            <div className="mt-3 rounded-xl border border-slate-200 p-3.5 space-y-2.5">
              <span className="flex items-center gap-2 text-[13px] font-semibold text-slate-700 min-w-0">
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{doc ? doc.filename : t('plag.noDocument')}</span>
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <span className="flex items-center gap-2 text-[13px] text-slate-700">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  {text ? `${nf.format(wordCount)} ${t('plag.words')}` : '—'}
                </span>
                <span className="flex items-center gap-2 text-[13px] text-slate-700">
                  <Type className="w-4 h-4 text-slate-400 shrink-0" />
                  {text ? `${nf.format(text.length)} ${t('plag.characters')}` : '—'}
                </span>
                <span className="flex items-center gap-2 text-[13px] text-slate-700">
                  <Scale className="w-4 h-4 text-slate-400 shrink-0" />
                  {text ? `${(sizeBytes / 1024 / 1024).toFixed(2)} MB` : '—'}
                </span>
              </div>
            </div>

            <button
              onClick={() => void handleCheck()}
              disabled={!canCheck}
              className="w-full mt-3.5 inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-b from-[#0d2a44] to-[#06203a] text-white text-[15px] font-bold shadow-[0_0_22px_-6px_rgba(16,185,129,0.65)] hover:from-[#123354] hover:to-[#082744] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all"
            >
              {isChecking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {isChecking ? t('plag.analyzing') : t('plag.startAnalysis')}
            </button>

            {/* Tranquilidad de espera: el análisis real tarda varios minutos. */}
            {!result && (canCheck || isChecking) && (
              <p className="mt-2.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-snug">
                {t('plag.slowHint')}
              </p>
            )}
          </section>

          <section className="surface rounded-2xl p-4 sm:p-5">
            <h3 className="text-[17px] font-black text-slate-900 tracking-tight">
              {t('plag.statusTitle')}
            </h3>

            {/* Recuento explícito: la lista sola no deja claro cuántos de los
                nueve llegaron a responder ni cuántos encontraron algo. */}
            {result && (
              <p className="text-[12px] text-slate-500 mt-1">
                {t('plag.providersSummary', {
                  answered: answeredCount,
                  total: PROVIDERS.length,
                  matched: matchedCount,
                })}
              </p>
            )}

            <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0d2a44] via-teal-500 to-emerald-400 transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <ul className="mt-3.5 space-y-1.5">
              {PROVIDERS.map((provider) => {
                const state =
                  status[provider.id] ?? { state: 'pending' as ProviderState, match: null };
                return (
                  <li key={provider.id} className="flex items-center gap-2.5 text-[13px]">
                    <span className="w-5 text-center shrink-0" aria-hidden="true">
                      {provider.glyph}
                    </span>
                    <span className="font-semibold text-slate-700 flex-1 min-w-0 truncate">
                      {provider.id === 'local' ? t('plag.localCorpus') : provider.label}
                    </span>
                    {state.state === 'done' && state.match !== null ? (
                      // Único estado que pide atención, y por eso el único con
                      // color: respondió y además encontró texto parecido.
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[12px] font-bold tabular-nums">
                        {t('plag.matchAt', { pct: state.match })}
                      </span>
                    ) : state.state === 'done' ? (
                      <span className="flex items-center gap-1.5 text-slate-500 shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        {t('plag.noMatches')}
                      </span>
                    ) : state.state === 'silent' ? (
                      <span className="flex items-center gap-1.5 text-slate-400 shrink-0">
                        <MinusCircle className="w-4 h-4" />
                        {t('plag.noResults')}
                      </span>
                    ) : (
                      <span
                        className={`shrink-0 ${
                          state.state === 'checking'
                            ? 'text-slate-600 animate-pulse font-semibold'
                            : 'text-slate-400'
                        }`}
                      >
                        {state.state === 'checking' ? t('plag.checking') : t('plag.pending')}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            <p className="text-[11px] text-slate-400 leading-snug mt-3">{t('plag.progressNote')}</p>
          </section>
        </div>
      </div>

      {/* ---------- Informe ---------- */}
      {result && (
        <section className="surface rounded-2xl p-4 sm:p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-[17px] font-black text-slate-900 tracking-tight">
                {t('plag.reportTitle')}
              </h3>
              {result.sampled && (
                <p className="text-[12px] text-slate-500 mt-0.5">
                  {t('plag.sampled', {
                    chunks: result.analyzedChunks ?? 0,
                    total: result.totalChunks ?? 0,
                  })}
                </p>
              )}
            </div>
            {/* Dos informes, dos botones: similitud e IA se leen con criterios
                distintos y no deben viajar en el mismo PDF. */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void handleDownloadReport()}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#002B49] hover:bg-[#001f35] text-white text-[12.5px] font-bold disabled:opacity-50 transition-colors"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isDownloading ? t('plag.generatingReport') : t('plag.downloadPlagiarismPdf')}
              </button>
              <button
                onClick={() => void handleDownloadAiReport()}
                disabled={isDownloadingAi}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-b from-[#5b3fa8] to-[#472f88] hover:from-[#67489c] hover:to-[#3d2878] text-white text-[12.5px] font-bold disabled:opacity-50 transition-colors"
              >
                {isDownloadingAi ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
                {isDownloadingAi ? t('plag.generatingAiPdf') : t('plag.downloadAiPdf')}
              </button>
            </div>
          </div>

          {/* Cuando la extracción guardó geometría de página, ambos informes ya
              adjuntan el documento original marcado; el botón aparte que hacía
              solo eso desapareció por redundante. La geometría la tiene un PDF
              subido tal cual (Word queda anulado por ahora). Un texto pegado o
              un .txt no tienen coordenadas, y ahí el informe sale reimpreso. */}
          {doc?.overlayToken ? (
            <p className="text-[12px] text-slate-500 -mt-1.5">{t('plag.overlayIncluded')}</p>
          ) : (
            <p className="text-[12px] text-slate-500 -mt-1.5">{t('plag.overlayUnavailable')}</p>
          )}

          {/* Una tarjeta por magnitud. Antes ambas mostraban plagio con dos
              nombres distintos, lo que se leía como dos mediciones cuando era
              una sola; la segunda es ahora la de IA, que es la otra pregunta. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 text-center">
              <p className="text-[12px] text-slate-500 font-semibold">
                {t('plag.similarityCardLabel')}
              </p>
              <p className={`text-4xl font-black mt-1.5 ${scoreColor(result.plagiarismPercentage)}`}>
                {result.plagiarismPercentage}%
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 text-center">
              <p className="text-[12px] text-slate-500 font-semibold">{t('plag.aiCardLabel')}</p>
              {aiResult && aiResult.score !== null ? (
                <p className={`text-4xl font-black mt-1.5 ${aiScoreColor(aiResult.score)}`}>
                  {aiResult.score}%
                </p>
              ) : (
                <>
                  {/* Sin estimación no se rellena con un cero: un cero aquí se
                      leería como «no hay IA», que es una afirmación distinta. */}
                  <p
                    className="text-4xl font-black mt-1.5 text-slate-300"
                    aria-label={t('plag.aiNotRun')}
                  >
                    —
                  </p>
                  {aiResult ? (
                    // Ya se estimó pero no salió un valor utilizable (texto corto,
                    // modelo no disponible): el motivo lo explica el servicio y
                    // repetir el botón no cambiaría el resultado.
                    <p className="text-[12px] text-slate-500 mt-1">{aiResult.label}</p>
                  ) : (
                    <button
                      onClick={() => void handleDetectAi()}
                      disabled={isDetectingAi}
                      className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-300 bg-white text-slate-600 text-[12px] font-bold hover:text-slate-900 hover:border-slate-400 disabled:opacity-50 transition-colors"
                    >
                      {isDetectingAi ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Bot className="w-3.5 h-3.5" />
                      )}
                      {isDetectingAi ? t('plag.detectingAi') : t('plag.estimateAiShort')}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* La cifra vive en la tarjeta; aquí queda lo que una cifra no dice:
              la banda, su lectura y el límite de la estimación. */}
          {aiResult && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <p className="text-[13px] font-bold text-slate-800">{aiResult.label}</p>
              <p className="text-[12.5px] text-slate-600 leading-relaxed mt-1">{aiResult.note}</p>
              {aiResult.caveat && (
                <p className="text-[11.5px] text-slate-500 leading-relaxed mt-1">
                  {aiResult.caveat}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-slate-600">{t('plag.analyzedPassages')}</span>
              <span className="font-bold text-slate-900 tabular-nums">{result.totalSentences}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-slate-600">{t('plag.flaggedPassages')}</span>
              <span className="font-bold text-red-600 tabular-nums">
                {result.plagiarizedSentences}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-red-500"
                style={{
                  width: `${
                    result.totalSentences
                      ? (result.plagiarizedSentences / result.totalSentences) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-[14px] font-black text-slate-900">{t('plag.detailTitle')}</h4>
            {result.results.map((item, index) => (
              <div
                key={index}
                className={`rounded-xl border p-3.5 ${
                  item.isPlagiarized
                    ? 'border-red-200 bg-red-50/70'
                    : 'border-emerald-200 bg-emerald-50/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] text-slate-800 leading-relaxed flex-1">
                    {item.sentence}
                  </p>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[12px] font-bold text-white shrink-0 ${
                      item.isPlagiarized ? 'bg-red-600' : 'bg-emerald-600'
                    }`}
                  >
                    {item.similarity}%
                  </span>
                </div>

                {item.sources.length > 0 && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-900/10 space-y-1">
                    <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                      {t('plag.potentialSources')}
                    </p>
                    {item.sources.map((source, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex-1 truncate text-[12px] hover:underline ${
                            source.similarity >= 50 ? 'font-bold text-red-700' : 'text-amber-700'
                          }`}
                        >
                          {source.url}
                        </a>
                        <span
                          className={`text-[12px] font-bold tabular-nums shrink-0 ${
                            source.similarity >= 50 ? 'text-red-700' : 'text-amber-700'
                          }`}
                        >
                          {source.similarity}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-[11.5px] text-slate-500 leading-relaxed border-t border-slate-200 pt-3">
            {t('plag.disclaimer')}
          </p>
        </section>
      )}
    </div>
  );
};
