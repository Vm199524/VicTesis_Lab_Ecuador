import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Check,
  Trash2,
  Copy,
  MessageCircle,
  Loader2,
  ClipboardPaste,
  ChevronDown,
  Scale,
  Sparkles,
  Clock3,
  ArrowRight,
  RotateCcw,
  Info,
} from 'lucide-react';
import {
  analyzeThesisDraft,
  STAGE_PROFILES,
  type DraftDiagnosis,
  type DraftFinding,
  type DraftStage,
  type FindingSeverity,
} from '../domain/ThesisDraftAnalyzer';
import { readDraftFile, DocxExtractionError } from '../domain/DocxTextExtractor';
import { usePreferences } from '../context/PreferencesContext';

interface DraftReviewWorkbenchProps {
  onOpenWhatsApp: () => void;
}

const STORAGE_KEY = 'tesis-ecuador-draft-review-text';
const STAGE_STORAGE_KEY = 'tesis-ecuador-draft-review-stage';
const MIN_LENGTH = 400;

/**
 * Vocabulario de severidad orientado a la acción.
 *
 * El estudiante llega a este módulo con ansiedad: leer "CRÍTICA" en rojo sobre su
 * trabajo no le dice qué hacer, solo lo asusta. Cada nivel nombra la consecuencia
 * concreta y usa un color que informa sin alarmar.
 */
const SEVERITY_UI: Record<
  FindingSeverity,
  { label: string; chip: string; dot: string; weight: number }
> = {
  critica: {
    label: 'Te lo van a devolver',
    chip: 'bg-rose-50 text-rose-800 border-rose-200',
    dot: 'bg-rose-500',
    weight: 4,
  },
  alta: {
    label: 'Importante',
    chip: 'bg-orange-50 text-orange-800 border-orange-200',
    dot: 'bg-orange-500',
    weight: 3,
  },
  media: {
    label: 'Recomendado',
    chip: 'bg-sky-50 text-sky-800 border-sky-200',
    dot: 'bg-sky-500',
    weight: 2,
  },
  baja: {
    label: 'Detalle final',
    chip: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    weight: 1,
  },
};

/**
 * Paleta del puntaje. Deliberadamente sin rojo: un Avance 1 recién empezado da bajo
 * por definición, y pintarlo de rojo transmite un fracaso que no ocurrió.
 */
function scoreTone(score: number) {
  if (score >= 85)
    return {
      text: 'text-emerald-700',
      stroke: '#059669',
      soft: 'bg-emerald-50 border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-800',
    };
  if (score >= 70)
    return {
      text: 'text-sky-700',
      stroke: '#0284c7',
      soft: 'bg-sky-50 border-sky-200',
      badge: 'bg-sky-100 text-sky-800',
    };
  if (score >= 50)
    return {
      text: 'text-indigo-700',
      stroke: '#4f46e5',
      soft: 'bg-indigo-50 border-indigo-200',
      badge: 'bg-indigo-100 text-indigo-800',
    };
  return {
    text: 'text-slate-700',
    stroke: '#94a3b8',
    soft: 'bg-slate-50 border-slate-200',
    badge: 'bg-slate-200 text-slate-700',
  };
}

const STAGE_ORDER: DraftStage[] = ['avance1', 'avance2', 'final'];

/**
 * Qué revisa cada área, en lenguaje del estudiante. Alimenta el panel de
 * transparencia. `id` es la clave estable para buscar la traducción
 * (`draft.areaCriteria.<id>`); el texto español queda como fallback de `tf()`.
 */
const AREA_CRITERIA: Record<string, { id: string; text: string }> = {
  Estructura: {
    id: 'estructura',
    text: 'Que existan como encabezado las secciones que el formato pide en esta etapa.',
  },
  'Resumen y abstract': {
    id: 'resumen',
    text: 'Extensión de 150 a 250 palabras, palabras clave y su equivalente en inglés.',
  },
  Objetivos: {
    id: 'objetivos',
    text: 'Un objetivo general con verbo en infinitivo y objeto claro, tres específicos sin repetir verbo, y el alcance declarado.',
  },
  Requerimientos: {
    id: 'requerimientos',
    text: 'Matriz de requerimientos funcionales y no funcionales codificados, con prioridad y métrica verificable.',
  },
  Metodología: {
    id: 'metodologia',
    text: 'Una sola metodología nombrada, justificada, con sus fases, cronograma y riesgos.',
  },
  'Diseño y desarrollo': {
    id: 'diseno',
    text: 'Diagramas UML, arquitectura, diccionario de datos, casos de prueba y versiones de las tecnologías.',
  },
  'Citas y referencias': {
    id: 'citas',
    text: 'Citas en el texto, referencias en APA 7, correspondencia entre ambas, vigencia y DOI.',
  },
  'Redacción académica': {
    id: 'redaccion',
    text: 'Tercera persona impersonal, tiempo verbal consistente, conectores y oraciones de largo manejable.',
  },
  'Formato editorial': {
    id: 'formato',
    text: 'Tablas y figuras numeradas con fuente, espaciado limpio e informe de originalidad.',
  },
};

export const DraftReviewWorkbench: React.FC<DraftReviewWorkbenchProps> = ({ onOpenWhatsApp }) => {
  const { t, tf } = usePreferences();
  const [text, setText] = useState('');
  const [stage, setStage] = useState<DraftStage>('avance1');
  const [fileName, setFileName] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const [reading, setReading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<DraftDiagnosis | null>(null);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAllFindings, setShowAllFindings] = useState(false);
  const [showRubric, setShowRubric] = useState(false);
  const [showDeferred, setShowDeferred] = useState(false);
  const [guidance, setGuidance] = useState<Record<string, string>>({});
  const [guidanceState, setGuidanceState] = useState<'idle' | 'loading' | 'error'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const profile = STAGE_PROFILES[stage];

  // Recupera el borrador previo. Se avisa explícitamente: encontrar texto que uno no
  // acaba de pegar y no saber de dónde salió es desconcertante.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setText(stored);
        setRestored(true);
      }
      const storedStage = window.localStorage.getItem(STAGE_STORAGE_KEY);
      if (storedStage && STAGE_ORDER.includes(storedStage as DraftStage)) {
        setStage(storedStage as DraftStage);
      }
    } catch {
      // El navegador puede bloquear el almacenamiento; el módulo funciona igual.
    }
  }, []);

  useEffect(() => {
    try {
      if (text) window.localStorage.setItem(STORAGE_KEY, text);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Sin persistencia disponible: se continúa sin guardar.
    }
  }, [text]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STAGE_STORAGE_KEY, stage);
    } catch {
      // Sin persistencia disponible: se continúa sin guardar.
    }
  }, [stage]);

  const handleFile = useCallback(async (file: File) => {
    setReading(true);
    setError(null);
    try {
      const extracted = await readDraftFile(file);
      setText(extracted);
      setFileName(file.name);
      setRestored(false);
      setDiagnosis(null);
    } catch (err) {
      setError(
        err instanceof DocxExtractionError
          ? err.message
          : tf('draft.error.fileRead', 'No se pudo leer el archivo. Copia el texto y pégalo en el cuadro.')
      );
    } finally {
      setReading(false);
    }
  }, []);

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  /** Hallazgos ordenados por impacto real: severidad multiplicada por el peso del área. */
  const prioritized = useMemo(() => {
    if (!diagnosis) return [];
    const weightOf = (finding: DraftFinding) =>
      SEVERITY_UI[finding.severity].weight * (profile.weights[finding.area] ?? 1);
    return [...diagnosis.findings].sort((a, b) => weightOf(b) - weightOf(a));
  }, [diagnosis, profile]);

  const nextSteps = useMemo(() => prioritized.slice(0, 3), [prioritized]);

  // La guía de corrección vive en el servidor: aquí solo viajan identificadores,
  // nunca una línea del documento del estudiante.
  useEffect(() => {
    if (nextSteps.length === 0) {
      setGuidance({});
      return;
    }
    let cancelled = false;
    setGuidanceState('loading');
    fetch('/api/draft-guidance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: nextSteps.map((finding) => finding.id) }),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((data: { guidance: Array<{ id: string; fix: string }> }) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        data.guidance.forEach((entry) => {
          map[entry.id] = entry.fix;
        });
        setGuidance(map);
        setGuidanceState('idle');
      })
      .catch(() => {
        if (!cancelled) setGuidanceState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [nextSteps]);

  const runAnalysis = async () => {
    if (text.trim().length < MIN_LENGTH) {
      setError(
        tf('draft.error.minLength', 'Necesito al menos {count} caracteres para dar un diagnóstico útil. Pega el capítulo completo, no un párrafo suelto.').replace('{count}', String(MIN_LENGTH))
      );
      return;
    }
    if (analyzing) return;
    setError(null);
    setShowAllFindings(false);
    setAnalyzing(true);
    const startedAt = Date.now();
    // Instantánea: si el usuario edita mientras "analiza", el diagnóstico se
    // calcula sobre lo que pidió revisar, no sobre el texto ya cambiado.
    const snapshotText = text;
    const snapshotStage = stage;
    const result = analyzeThesisDraft(snapshotText, snapshotStage);
    // Retención mínima de ~2 s: aunque el análisis sea instantáneo, el resultado
    // no aparece al momento, para que se perciba que el módulo está trabajando.
    const elapsed = Date.now() - startedAt;
    if (elapsed < 2000) {
      await new Promise((resolve) => setTimeout(resolve, 2000 - elapsed));
    }
    setDiagnosis(result);
    setAnalyzing(false);
    window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const reset = () => {
    setText('');
    setFileName(null);
    setRestored(false);
    setDiagnosis(null);
    setError(null);
    setGuidance({});
    if (inputRef.current) inputRef.current.value = '';
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nada que limpiar si el navegador bloquea el almacenamiento.
    }
  };

  const copySummary = () => {
    if (!diagnosis) return;
    const lines = [
      `${tf('draft.summary.headerPrefix', 'Diagnóstico de forma —')} ${tf(`draft.stage.${diagnosis.stage}.label`, STAGE_PROFILES[diagnosis.stage].label)}`,
      `${tf('draft.label.readinessLevel', 'Nivel de preparación')}: ${diagnosis.score}/100 (${diagnosis.level})`,
      `${tf('draft.summary.sectionsPresent', 'Secciones presentes:')} ${diagnosis.sectionsPresent} de ${diagnosis.sectionsExpected} ${tf('draft.summary.sectionsRequiredAt', 'exigidas en esta etapa.')}`,
      '',
      tf('draft.label.areasEvaluated', 'Áreas evaluadas:'),
      ...diagnosis.areas.map(
        (area) => `- ${area.area}: ${area.score}/${area.max} (${area.findings} observaciones)`
      ),
      '',
      `${tf('draft.summary.observationsCount', 'Observaciones que cuentan en esta etapa')} (${diagnosis.findings.length}):`,
      ...prioritized.map(
        (finding, index) =>
          `${index + 1}. [${tf(`draft.severity.${finding.severity}`, SEVERITY_UI[finding.severity].label)}] ${finding.title} — ${finding.evidence}`
      ),
      '',
      tf('draft.label.disclaimer', 'Este diagnóstico revisa forma y estructura, no el fondo científico. La decisión de aprobación es del docente o tutor.'),
    ];
    void navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const tone = diagnosis ? scoreTone(diagnosis.score) : null;
  const sectionProgress =
    diagnosis && diagnosis.sectionsExpected > 0
      ? Math.round((diagnosis.sectionsPresent / diagnosis.sectionsExpected) * 100)
      : 0;

  const source = fileName
    ? `${tf('draft.source.file', 'Archivo:')} ${fileName}`
    : restored
      ? tf('draft.source.loaded', 'Recuperado de tu sesión anterior')
      : text
        ? tf('draft.source.pasted', 'Texto pegado')
        : null;

  return (
    <section id="draft-review" className="scroll-mt-32 space-y-3">
      {/* ---------- Encabezado del módulo ---------- */}
      <div className="surface rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="min-w-0">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-900 border border-sky-200">
              {tf('draft.module.badge', 'Revisor de borrador')}
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1.5">
              {tf('draft.module.title', 'Diagnóstico de tu avance 🔎')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {tf('draft.module.tagline', 'Revisa la forma y la estructura de tu documento contra el formato de titulación, antes de que lo lea tu docente.')}
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
            {tf('draft.badge.local', 'Se procesa en tu navegador')}
          </span>
        </div>

        {/* ---------- Paso 1: etapa de entrega ---------- */}
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-5 h-5 rounded-md bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shrink-0">
              1
            </span>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
              {tf('draft.prompt.what', '¿Qué estás entregando?')}
            </h4>
          </div>
          <p className="text-[11px] text-slate-500 mb-2 leading-snug">
            {tf('draft.prompt.whatHint', 'Esto cambia por completo el resultado. A un Avance 1 no se le exige desarrollo, pruebas ni conclusiones, y evaluarlo como documento terminado da un puntaje bajo que no describe nada real.')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {STAGE_ORDER.map((id) => {
              const item = STAGE_PROFILES[id];
              const isActive = stage === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    setStage(id);
                    setDiagnosis(null);
                  }}
                  aria-pressed={isActive}
                  className={`text-left rounded-xl border p-2.5 transition-all ${
                    isActive
                      ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-black">{tf(`draft.stage.${id}.shortLabel`, item.shortLabel)}</span>
                    {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </div>
                  <p
                    className={`text-[10px] leading-snug mt-1 ${
                      isActive ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {tf(`draft.stage.${id}.scope`, item.scope)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ---------- Paso 2: documento ---------- */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-5 h-5 rounded-md bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shrink-0">
              2
            </span>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
              {tf('draft.step2.title', 'Tu documento')}
            </h4>
          </div>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`rounded-xl border-2 border-dashed px-4 py-4 text-center transition-all ${
              dragging ? 'border-sky-500 bg-sky-50' : 'border-slate-300 bg-slate-50/60'
            }`}
          >
            {reading ? (
              <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-700">
                <Loader2 className="w-4 h-4 animate-spin" />
                {tf('draft.status.reading', 'Leyendo el documento…')}
              </span>
            ) : (
              <>
                <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-800">
                  {tf('draft.dropzone.prefix', 'Arrastra tu archivo aquí o')}{' '}
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="text-sky-700 underline hover:text-sky-900"
                  >
                    {tf('draft.dropzone.action', 'selecciónalo')}
                  </button>
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {tf('draft.dropzone.formats', 'Formatos aceptados: .docx, .txt. Si tienes PDF, copia el texto y pégalo abajo.')}
                </p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".docx,.txt,.md"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
          </div>

          {/* Barra de estado del contenido: de dónde salió y cómo quitarlo */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 mb-1">
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-wide flex items-center gap-1.5 min-w-0">
              <ClipboardPaste className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{tf('draft.status.label', 'Texto del borrador')}</span>
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-slate-500 tabular-nums">
                {words.toLocaleString('es-EC')} {tf('draft.status.words', 'palabras')}
              </span>
              {text && (
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 border-slate-200 text-[11px] font-bold border transition-all"
                  title={tf('draft.action.clearTitle', 'Borrar el texto y empezar de nuevo')}
                >
                  <Trash2 className="w-3 h-3" />
                  {tf('draft.action.clear', 'Limpiar')}
                </button>
              )}
            </div>
          </div>

          {source && (
            <div
              className={`flex items-start gap-2 rounded-lg px-2.5 py-1.5 mb-2 border text-[11px] ${
                restored
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              {restored ? (
                <RotateCcw className="w-3.5 h-3.5 shrink-0 mt-px" />
              ) : (
                <FileText className="w-3.5 h-3.5 shrink-0 mt-px" />
              )}
              <span className="min-w-0">
                {source}
                {restored && (
                  <>
                    {tf('draft.source.restoredNote', '. Este texto quedó guardado en tu navegador de una sesión previa; si no es el documento que quieres revisar, pulsa')}{' '}
                    <strong>{tf('draft.action.clear', 'Limpiar')}</strong>.
                  </>
                )}
              </span>
            </div>
          )}

          <textarea
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setRestored(false);
              setFileName(null);
            }}
            rows={7}
            placeholder={tf('draft.prompt.placeholder', 'Pega aquí el texto de tu avance…')}
            className="field w-full rounded-xl px-3 py-2.5 text-xs leading-relaxed focus:ring-1 focus:ring-sky-600 resize-y"
          />

          {error && (
            <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[11px] text-amber-900">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button
              onClick={() => void runAnalysis()}
              disabled={reading || analyzing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#002B49] hover:bg-[#001f35] disabled:opacity-50 text-white text-xs font-black shadow-sm transition-all"
            >
              <FileText className="w-4 h-4" />
              {tf('draft.action.analyze', 'Analizar mi')} {tf(`draft.stage.${stage}.shortLabel`, profile.shortLabel)}
            </button>
            <span className="text-[10px] text-slate-500">
              {tf('draft.action.localNote', 'Tu documento no sale de este navegador.')}
            </span>
          </div>
          {analyzing && (
            <div className="mt-2.5 inline-flex items-center gap-2 rounded-lg bg-sky-50 border border-sky-200 px-3 py-2 text-[11px] font-bold text-sky-800">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {tf('draft.status.analyzing', 'Analizando estructura, estilo y referencias…')}
            </div>
          )}
        </div>
      </div>

      {/* ---------- Resultado ---------- */}
      {diagnosis && tone && (
        <div ref={resultsRef} className="space-y-3 animate-in fade-in duration-300">
          {/* Panel de puntaje */}
          <div className={`rounded-2xl border p-4 sm:p-5 ${tone.soft}`}>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
              {/* Anillo de progreso */}
              <div className="relative w-28 h-28 shrink-0">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" className="text-slate-200" strokeWidth="12" />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke={tone.stroke}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(diagnosis.score / 100) * 327} 327`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-black tabular-nums ${tone.text}`}>
                    {diagnosis.score}
                  </span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                    {tf('draft.score.outOf100', 'de 100')}
                  </span>
                </div>
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${tone.badge}`}
                >
                  {tf(`draft.stage.${diagnosis.stage}.shortLabel`, STAGE_PROFILES[diagnosis.stage].shortLabel)}
                </span>
                <h4 className={`text-xl font-black mt-1 ${tone.text}`}>{diagnosis.level}</h4>
                <p className="text-xs text-slate-700 leading-snug mt-1">{diagnosis.levelHint}</p>

                {/* Encuadre honesto: esto no es una nota */}
                <p
                  className="text-[11px] text-slate-600 leading-snug mt-2 bg-white/70 border border-white rounded-lg px-2.5 py-1.5"
                  dangerouslySetInnerHTML={{ __html: tf('draft.result.notQualified', 'Esto <strong>no es tu calificación</strong>. Es un chequeo automático de forma y estructura sobre lo que el formato exige en esta etapa. El fondo científico de tu trabajo y la decisión de aprobar la tiene tu docente o tutor.') }}
                />

                {/* Progreso de secciones */}
                <div className="mt-2.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                    <span>{tf('draft.progress.sectionsRequired', 'Secciones exigidas en esta etapa')}</span>
                    <span className="tabular-nums">
                      {diagnosis.sectionsPresent}/{diagnosis.sectionsExpected}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${sectionProgress}%`, backgroundColor: tone.stroke }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lo que ya está resuelto: se reconoce antes de corregir */}
          {diagnosis.strengths.length > 0 && (
            <div className="surface rounded-2xl p-4 border-emerald-200">
              <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                {tf('draft.section.strengths', 'Esto ya lo tienes resuelto')}
              </h4>
              <ul className="space-y-1.5">
                {diagnosis.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2 text-[11.5px] text-slate-700">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Próximos pasos priorizados por impacto */}
          {nextSteps.length > 0 && (
            <div className="surface rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3 mb-1">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-sky-600" />
                  {tf('draft.section.nextStepsCount', 'Tus próximos {n} pasos').replace('{n}', String(nextSteps.length))}
                </h4>
                <span className="text-[10px] text-slate-500 shrink-0">{tf('draft.section.orderedByImpact', 'Ordenados por impacto')}</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3 leading-snug">
                {tf('draft.section.nextStepsHint', 'No intentes arreglar todo a la vez. Estos son los que más mueven tu resultado en esta etapa.')}
              </p>

              <ol className="space-y-2.5">
                {nextSteps.map((finding, index) => (
                  <li
                    key={finding.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-[#002B49] text-white text-[11px] font-black flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide border ${
                              SEVERITY_UI[finding.severity].chip
                            }`}
                          >
                            {tf(`draft.severity.${finding.severity}`, SEVERITY_UI[finding.severity].label)}
                          </span>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                            {finding.area}
                          </span>
                        </div>
                        <p className="text-[12.5px] font-extrabold text-slate-900 leading-snug">
                          {finding.title}
                        </p>
                        <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
                          {finding.evidence}
                        </p>

                        {/* El "cómo corregirlo" llega del servidor */}
                        <div className="mt-2 pt-2 border-t border-slate-200">
                          {guidanceState === 'loading' && !guidance[finding.id] ? (
                            <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              {tf('draft.guidance.loading', 'Cargando la corrección…')}
                            </span>
                          ) : guidance[finding.id] ? (
                            <p className="text-[11.5px] text-slate-800 leading-snug">
                              <span className="font-black text-emerald-800">{tf('draft.guidance.howToFix', 'Cómo corregirlo:')} </span>
                              {guidance[finding.id]}
                            </p>
                          ) : (
                            <span className="text-[11px] text-slate-500">
                              {tf('draft.guidance.error', 'No se pudo cargar la corrección. Recarga la página o escríbeme y te la explico.')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Resto de hallazgos */}
          {prioritized.length > nextSteps.length && (
            <div className="surface rounded-2xl p-4">
              <button
                onClick={() => setShowAllFindings((value) => !value)}
                className="w-full flex items-center justify-between gap-2 text-left"
                aria-expanded={showAllFindings}
              >
                <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  {tf('draft.section.otherFindings', 'Las otras {n} observaciones').replace('{n}', String(prioritized.length - nextSteps.length))}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                    showAllFindings ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showAllFindings && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                  {prioritized.slice(nextSteps.length).map((finding) => (
                    <div
                      key={finding.id}
                      className="rounded-xl border border-slate-200 p-2.5 flex flex-col"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            SEVERITY_UI[finding.severity].dot
                          }`}
                        />
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide truncate">
                          {finding.area} · {tf(`draft.severity.${finding.severity}`, SEVERITY_UI[finding.severity].label)}
                        </span>
                      </div>
                      <p className="text-[12px] font-extrabold text-slate-900 leading-snug">
                        {finding.title}
                      </p>
                      <p className="text-[11px] text-slate-600 leading-snug mt-0.5 flex-1">
                        {finding.evidence}
                      </p>
                      <button
                        onClick={onOpenWhatsApp}
                        className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-600 hover:text-emerald-700 transition-colors"
                      >
                        <Lock className="w-3 h-3 shrink-0" />
                        {tf('draft.action.explainFix', 'Cómo corregirlo — te lo explico')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Todavía no aplica: tranquiliza en lugar de alarmar */}
          {diagnosis.deferred.length > 0 && (
            <div className="inset-surface rounded-2xl p-4">
              <button
                onClick={() => setShowDeferred((value) => !value)}
                className="w-full flex items-center justify-between gap-2 text-left"
                aria-expanded={showDeferred}
              >
                <span className="text-xs font-black text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock3 className="w-3.5 h-3.5 text-slate-500" />
                  {tf('draft.section.deferred', 'Todavía no aplica ({n})').replace('{n}', String(diagnosis.deferred.length))}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                    showDeferred ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <p
                className="text-[11px] text-slate-500 mt-1 leading-snug"
                dangerouslySetInnerHTML={{ __html: tf('draft.section.deferredHint', 'Detecté estos puntos, pero corresponden a etapas posteriores. <strong>No restan nada</strong> a tu resultado: los verás aquí cuando cambies la etapa arriba.') }}
              />

              {showDeferred && (
                <ul className="mt-2.5 space-y-1">
                  {diagnosis.deferred.map((finding) => (
                    <li
                      key={finding.id}
                      className="flex items-start gap-2 text-[11px] text-slate-600 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                    >
                      <Clock3 className="w-3 h-3 shrink-0 mt-0.5 text-slate-400" />
                      <span className="leading-snug">
                        <strong className="text-slate-700">{finding.title}</strong> · {finding.area}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Áreas evaluadas */}
          <div className="surface rounded-2xl p-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-2.5">
              {tf('draft.section.scoreBreakdown', 'Cómo se reparte tu puntaje')}
            </h4>
            <div className="space-y-2">
              {diagnosis.areas.map((area) => {
                const ratio = area.max > 0 ? area.score / area.max : 0;
                return (
                  <div key={area.area}>
                    <div className="flex items-center justify-between text-[11px] mb-1 gap-2">
                      <span className="font-bold text-slate-700 min-w-0 truncate">{area.area}</span>
                      <span className="tabular-nums text-slate-500 shrink-0">
                        {area.score} / {area.max}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          ratio >= 0.85
                            ? 'bg-emerald-500'
                            : ratio >= 0.6
                              ? 'bg-sky-500'
                              : ratio >= 0.3
                                ? 'bg-indigo-400'
                                : 'bg-slate-400'
                        }`}
                        style={{ width: `${Math.max(ratio * 100, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Checklist de secciones con conciencia de etapa */}
          <div className="surface rounded-2xl p-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-2.5">
              {tf('draft.section.formatSections', 'Secciones del formato')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-1.5">
              {diagnosis.sections.map((section) => {
                const status = section.present
                  ? 'presente'
                  : section.expectedNow
                    ? 'falta'
                    : 'despues';
                return (
                  <div
                    key={section.key}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 border text-[11px] ${
                      status === 'presente'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : status === 'falta'
                          ? 'bg-white border-slate-300 text-slate-700'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    {status === 'presente' ? (
                      <Check className="w-3.5 h-3.5 shrink-0" />
                    ) : status === 'falta' ? (
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-400 shrink-0" />
                    ) : (
                      <Clock3 className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="truncate font-bold">{section.label}</span>
                    {status === 'despues' && (
                      <span className="ml-auto text-[9px] shrink-0 uppercase tracking-wide">
                        {tf('draft.label.later', 'Después')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transparencia del cálculo */}
          <div className="surface rounded-2xl p-4">
            <button
              onClick={() => setShowRubric((value) => !value)}
              className="w-full flex items-center justify-between gap-2 text-left"
              aria-expanded={showRubric}
            >
              <span className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-slate-500" />
                {tf('draft.section.scoreOrigin', '¿De dónde sale este puntaje?')}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                  showRubric ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showRubric && (
              <div className="mt-3 space-y-3 text-[11.5px] text-slate-700 leading-relaxed">
                <div className="flex items-start gap-2 inset-surface rounded-lg px-3 py-2">
                  <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <p
                    dangerouslySetInnerHTML={{ __html: tf('draft.rubric.basis', 'La base es el <strong>formato institucional de titulación</strong> y la estructura que comparten los trabajos ya aprobados de la carrera. Las reglas son deterministas y revisan <strong>solo forma</strong>: si una sección existe, si los objetivos están en infinitivo, si hay correspondencia entre citas y referencias, etcétera. Ninguna regla juzga si tu idea es buena.') }}
                  />
                </div>

                <div>
                  <p className="font-black text-slate-900 mb-1.5">
                    {tf('draft.rubric.weightsFor', 'Pesos para')} {tf(`draft.stage.${diagnosis.stage}.shortLabel`, STAGE_PROFILES[diagnosis.stage].shortLabel)} {tf('draft.rubric.sumTo100', '(suman 100)')}
                  </p>
                  <ul className="space-y-1.5">
                    {diagnosis.areas.map((area) => (
                      <li
                        key={area.area}
                        className="border border-slate-200 rounded-lg px-2.5 py-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-800">{area.area}</span>
                          <span className="tabular-nums text-slate-500 shrink-0 text-[10px]">
                            {tf('draft.rubric.worth', 'vale')} {area.max} {tf('draft.rubric.pts', 'pts')}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 leading-snug mt-0.5">
                          {AREA_CRITERIA[area.area]
                            ? tf(`draft.areaCriteria.${AREA_CRITERIA[area.area].id}`, AREA_CRITERIA[area.area].text)
                            : null}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="font-black text-slate-900 mb-1">{tf('draft.rubric.discountTitle', 'Cuánto descuenta cada observación')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(SEVERITY_UI) as FindingSeverity[]).map((severity) => (
                      <span
                        key={severity}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${SEVERITY_UI[severity].chip}`}
                      >
                        {tf(`draft.severity.${severity}`, SEVERITY_UI[severity].label)}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10.5px] text-slate-500 leading-snug mt-1.5">
                    {tf('draft.rubric.discountNote', 'Cada área parte de su puntaje completo y baja según el peso de las observaciones que acumule, con un tope: ningún área cae por debajo de cero ni arrastra a las demás.')}
                  </p>
                </div>

                <p
                  className="text-[10.5px] text-slate-500 leading-snug border-t border-slate-200 pt-2"
                  dangerouslySetInnerHTML={{ __html: tf('draft.rubric.notReviewed', 'Lo que este diagnóstico <strong>no</strong> revisa: la calidad de tu propuesta, la validez de tus resultados, el porcentaje de similitud y los criterios propios de tu docente. Un 100 aquí no significa aprobación.') }}
                />
              </div>
            )}
          </div>

          {/* Cierre */}
          <div className="surface rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p
              className="text-[11px] text-slate-600 leading-snug min-w-0"
              dangerouslySetInnerHTML={{ __html: tf('draft.closing.text', 'Este diagnóstico revisa forma y estructura. <strong>La decisión sobre tu trabajo la toma tu docente o tutor.</strong> Si quieres que revisemos juntos algún punto en específico, escríbeme.') }}
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={copySummary}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 text-[11px] font-black border transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? tf('draft.action.copied', 'Copiado') : tf('draft.action.copyDiagnosis', 'Copiar diagnóstico')}
              </button>
              <button
                onClick={onOpenWhatsApp}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-[11px] font-black shadow-sm transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                {tf('draft.action.writeMe', 'Escríbeme')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};