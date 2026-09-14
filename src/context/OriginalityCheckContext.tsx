import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePreferences } from './PreferencesContext';

/* ------------------------------------------------------------------ *
 * Contrato con el servicio de verificación
 * ------------------------------------------------------------------ */

/** Espejo de TEXT_LIMITS y UPLOAD_LIMITS del servicio de originalidad. */
export const TEXT_LIMITS = { min: 100, max: 120_000 };
// Word (.docx) queda anulado por ahora: la conversión a PDF fallaba más de lo
// que ayudaba, así que la subida se limita a PDF y TXT, que son los formatos
// que el servicio responde bien. Reincluir el resto es ampliar estas dos listas.
export const UPLOAD = {
  maxBytes: 25 * 1024 * 1024,
  extensions: ['.pdf', '.txt'],
  accept: '.pdf,.txt',
};

/* ------------------------------------------------------------------ *
 * Base del servicio de verificación
 * ------------------------------------------------------------------ */

/**
 * URL del Cloud Run del portal para el módulo de originalidad.
 *
 * Firebase Hosting corta sus rewrites a Cloud Run a los 60 s, y un análisis de
 * una tesis completa dura varios minutos: por el hosting el navegador jamás
 * recibe la respuesta de un análisis largo (la pasarela devuelve 502/504 y el
 * estudiante ve un error pese a que el detector terminó). Por eso, cuando se
 * despliega con `VITE_ORIGINALITY_API_URL` apuntando a la URL pública del
 * Cloud Run del portal (timeout 900 s), el cliente habla con ella de forma
 * directa y se salta el tope del hosting. Vacía => mismo origen (desarrollo,
 * donde el portal reenvía sin límite de 60 s).
 */
const ORIGINALITY_API_BASE = (import.meta.env.VITE_ORIGINALITY_API_URL ?? '').replace(/\/+$/, '');

function originalityUrl(path: string): string {
  return `${ORIGINALITY_API_BASE}/api/originality/${path}`;
}

export interface SourceHit {
  url: string;
  similarity: number;
}

export interface SentenceResult {
  sentence: string;
  similarity: number;
  sources: SourceHit[];
  isPlagiarized: boolean;
}

export interface CheckResult {
  overallScore: number;
  plagiarismPercentage: number;
  totalSentences: number;
  plagiarizedSentences: number;
  analyzedChunks?: number;
  totalChunks?: number;
  sampled?: boolean;
  semanticAlerts?: number;
  /** Proveedores que devolvieron candidatos utilizables durante el análisis. */
  providers?: string[];
  results: SentenceResult[];
}

export interface AiResult {
  score: number | null;
  label: string;
  note: string;
  caveat?: string;
}

export interface ExtractedDoc {
  filename: string;
  characters: number;
  words: number;
  truncated: boolean;
  sizeBytes: number;
  /**
   * Título y autor que el propio archivo declara (la ficha del PDF, o la que
   * LibreOffice conserva al convertir un .docx). Van a la portada del informe
   * para que diga de qué trabajo es; si el archivo no los trae, el servicio
   * imprime «Documento sin título» en lugar de inventárselos.
   */
  meta: Record<string, unknown>;
  /**
   * Clave para pedir el informe dibujado sobre el original en vez de reimpreso.
   * Solo existe cuando la extracción tuvo geometría de página que conservar: un
   * PDF sin recortar, o un .docx que el detector convirtió a PDF con LibreOffice
   * (carátula, encabezados y pies incluidos). El texto pegado a mano, .txt, .rtf
   * o .doc no tienen coordenadas, así que aquí llega `null` y esa variante del
   * informe no se ofrece.
   */
  overlayToken: string | null;
}

/* ------------------------------------------------------------------ *
 * Proveedores consultados
 * ------------------------------------------------------------------ */

export type ProviderState = 'pending' | 'checking' | 'done' | 'silent';

export interface Provider {
  id: string;
  label: string;
  glyph: string;
  /** Nombres con los que el servicio identifica al proveedor en su respuesta. */
  keys: string[];
  /** Fragmentos de dominio que identifican una fuente como propia del proveedor. */
  hosts: string[];
}

/**
 * Los ocho proveedores abiertos que consulta el servicio, más el corpus local.
 *
 * `keys` casa con el campo `providers` del resultado —qué proveedores llegaron a
 * aportar candidatos— y `hosts` atribuye cada coincidencia concreta a su origen,
 * porque las fuentes vuelven como URL y no como nombre de proveedor.
 */
export const PROVIDERS: Provider[] = [
  {
    id: 'wikipedia',
    label: 'Wikipedia',
    glyph: '🌐',
    keys: ['wikipedia-es', 'wikipedia-en'],
    hosts: ['wikipedia.org'],
  },
  { id: 'core', label: 'CORE', glyph: '🪶', keys: ['core'], hosts: ['core.ac.uk'] },
  {
    id: 'europepmc',
    label: 'Europe PMC',
    glyph: '🧬',
    keys: ['europepmc'],
    hosts: ['europepmc.org', 'ebi.ac.uk'],
  },
  { id: 'arxiv', label: 'arXiv', glyph: '📐', keys: ['arxiv'], hosts: ['arxiv.org'] },
  {
    id: 'semanticscholar',
    label: 'Semantic Scholar',
    glyph: '🎓',
    keys: ['semanticscholar'],
    hosts: ['semanticscholar.org'],
  },
  { id: 'doaj', label: 'DOAJ', glyph: '📙', keys: ['doaj'], hosts: ['doaj.org'] },
  {
    id: 'crossref',
    label: 'CrossRef',
    glyph: '🔗',
    keys: ['crossref'],
    hosts: ['doi.org', 'crossref.org'],
  },
  { id: 'openalex', label: 'OpenAlex', glyph: '🔎', keys: ['openalex'], hosts: ['openalex.org'] },
  { id: 'local', label: 'Repositorio local', glyph: '🏛️', keys: ['corpus'], hosts: [] },
];

export interface ProviderStatus {
  state: ProviderState;
  /** Mayor similitud atribuida al proveedor, o null si no aportó coincidencias. */
  match: number | null;
}

const IDLE_STATUS: Record<string, ProviderStatus> = Object.fromEntries(
  PROVIDERS.map((p) => [p.id, { state: 'pending' as ProviderState, match: null }])
);

/** Atribuye una URL de resultado al proveedor que la sirvió. */
function providerOf(url: string): string {
  const lower = url.toLowerCase();
  const hit = PROVIDERS.find((p) => p.hosts.some((host) => lower.includes(host)));
  return hit ? hit.id : 'local';
}

/**
 * Lee la respuesta JSON del verificador.
 *
 * El puente del portal (`/api/originality/*`) responde JSON incluso en sus
 * errores, pero cuando el análisis de un documento largo excede el tiempo de
 * espera de Cloud Run puede llegar una página HTML de pasarela en su lugar.
 * Parsear ese HTML lanzaría el crudo "Unexpected token '<' ... is not valid
 * JSON"; este helper lo convierte en un mensaje claro.
 */
async function readCheckerJson(response: Response, offlineMessage: string): Promise<any> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(offlineMessage);
  }
  return response.json();
}

/* ------------------------------------------------------------------ *
 * Contexto
 * ------------------------------------------------------------------ */

interface OriginalityCheckContextValue {
  text: string;
  setText: (value: string) => void;
  doc: ExtractedDoc | null;
  setDoc: (value: ExtractedDoc | null) => void;
  excludeCitations: boolean;
  setExcludeCitations: React.Dispatch<React.SetStateAction<boolean>>;
  isChecking: boolean;
  isUploading: boolean;
  isDownloading: boolean;
  isDownloadingAi: boolean;
  isDetectingAi: boolean;
  result: CheckResult | null;
  aiResult: AiResult | null;
  error: string | null;
  setError: (value: string | null) => void;
  notice: string | null;
  setNotice: (value: string | null) => void;
  isDragging: boolean;
  setIsDragging: (value: boolean) => void;
  status: Record<string, ProviderStatus>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  wordCount: number;
  sizeBytes: number;
  overLimit: boolean;
  canCheck: boolean;
  nf: Intl.NumberFormat;
  answeredCount: number;
  matchedCount: number;
  progress: number;
  isBusy: boolean;
  hasSomethingToClear: boolean;
  uploadFile: (file: File | undefined) => Promise<void>;
  resetAnalysis: () => void;
  handleReset: () => void;
  handleCheck: () => Promise<void>;
  handleDownloadReport: () => Promise<void>;
  handleDetectAi: () => Promise<void>;
  handleDownloadAiReport: () => Promise<void>;
  handleDownloadOverlayReport: () => Promise<void>;
}

const OriginalityCheckContext = createContext<OriginalityCheckContextValue | null>(null);

/**
 * Estado del Verificador de Originalidad, montado en la raíz de la app.
 *
 * Antes vivía en `useState` local dentro de `OriginalityChecker`, que solo se
 * monta mientras el módulo de plagio está activo (`activeEcosystem === 'plagiarism'`
 * en `App.tsx`). Un análisis real tarda varios minutos —consulta nueve
 * proveedores externos—, y al cambiar de módulo o volver al inicio React
 * desmontaba el componente y con él todo el progreso: el estudiante volvía y
 * el resultado había desaparecido, aunque la petición seguía viva en el
 * navegador (nada aquí cancela un `fetch` en curso; lo que se perdía era solo
 * el estado que lo iba a mostrar). Sacar el estado de aquí y montarlo en la
 * raíz —fuera de `viewMode`/`activeEcosystem`— lo desacopla de qué pantalla se
 * esté mostrando: sobrevive a cualquier navegación dentro de la SPA. Lo que NO
 * sobrevive es recargar la página o cerrar la pestaña; eso exigiría guardar el
 * progreso en el servidor, fuera de alcance aquí.
 */
export const OriginalityCheckProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { t, locale } = usePreferences();

  const [text, setText] = useState('');
  const [doc, setDoc] = useState<ExtractedDoc | null>(null);
  const [excludeCitations, setExcludeCitations] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingAi, setIsDownloadingAi] = useState(false);
  const [isDetectingAi, setIsDetectingAi] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<Record<string, ProviderStatus>>(IDLE_STATUS);

  const inputRef = useRef<HTMLInputElement>(null);
  const tickerRef = useRef<number | null>(null);
  /** El archivo subido se retiene para poder renovar el token de marcado: el
   * layout del detector vive en la RAM de su instancia (efímera), así que al
   * descargar un informe se re-extrae este archivo si hace falta. */
  const fileRef = useRef<File | null>(null);

  const wordCount = useMemo(() => text.split(/\s+/).filter(Boolean).length, [text]);
  const sizeBytes = doc ? doc.sizeBytes : new Blob([text]).size;
  const overLimit = text.length > TEXT_LIMITS.max;
  const canCheck = text.length >= TEXT_LIMITS.min && !overLimit && !isChecking;

  const nf = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const resolvedCount = useMemo(
    () =>
      PROVIDERS.filter((p) => {
        const state = status[p.id]?.state;
        return state === 'done' || state === 'silent';
      }).length,
    [status]
  );
  const activeCount = useMemo(
    () => PROVIDERS.filter((p) => status[p.id]?.state !== 'pending').length,
    [status]
  );

  /**
   * Recuento para el resumen de proveedores: «respondió» y «encontró algo» son
   * cosas distintas, y mezclarlas es lo que hace ilegible una lista de nueve.
   */
  const answeredCount = useMemo(
    () => PROVIDERS.filter((p) => status[p.id]?.state === 'done').length,
    [status]
  );
  const matchedCount = useMemo(
    () =>
      PROVIDERS.filter((p) => status[p.id]?.state === 'done' && status[p.id]?.match !== null)
        .length,
    [status]
  );

  const progress = isChecking
    ? Math.min(92, (activeCount / PROVIDERS.length) * 92)
    : (resolvedCount / PROVIDERS.length) * 100;

  const stopTicker = useCallback(() => {
    if (tickerRef.current !== null) {
      window.clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
  }, []);

  useEffect(() => stopTicker, [stopTicker]);

  const resetAnalysis = useCallback(() => {
    setResult(null);
    setAiResult(null);
    setStatus(IDLE_STATUS);
    stopTicker();
  }, [stopTicker]);

  /**
   * Borra por completo la tesis ya revisada.
   *
   * Limpiar solo el informe no basta: si queda el texto o el documento anterior,
   * el análisis siguiente arranca sobre datos cruzados. Se devuelve todo al
   * estado inicial, incluido el `input` de archivo —que conserva el nombre del
   * fichero previo aunque ya no se use— para que subir otra tesis no herede nada.
   */
  const handleReset = useCallback(() => {
    setText('');
    setDoc(null);
    setResult(null);
    setAiResult(null);
    setError(null);
    setNotice(null);
    setStatus(IDLE_STATUS);
    stopTicker();
    fileRef.current = null;
    if (inputRef.current) inputRef.current.value = '';
  }, [stopTicker]);

  /**
   * Pide un informe y devuelve la respuesta, reenviando el archivo si hace falta.
   *
   * El `overlayToken` que permite marcar el documento original vive en la RAM de
   * la instancia que lo extrajo, y en Cloud Run esa instancia es efímera: entre
   * la subida y la descarga puede reciclarse, y el token deja de resolver. Antes
   * el remedio era re-subir el archivo en cada descarga —con lo que un .docx
   * volvía a pasar por LibreOffice entero, la etapa más lenta del servicio— y
   * aun así el token podía quedar en una instancia y la descarga en otra.
   *
   * Ahora se intenta primero con el token, que no mueve ni un byte, y solo si el
   * servicio responde 409 (`overlay-expired`) se reenvía el archivo. Entonces la
   * extracción y el marcado ocurren en esa misma petición, así que el token
   * recién creado no puede caducar por el camino.
   */
  const downloadReport = useCallback(
    async (
      endpoint: 'report' | 'ai-report',
      body: Record<string, unknown>,
      errorKey: string
    ): Promise<Response> => {
      const post = (payload: Record<string, unknown> | FormData) =>
        fetch(originalityUrl(endpoint), {
          method: 'POST',
          ...(payload instanceof FormData
            ? { body: payload }
            : {
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              }),
        });

      let response = await post(body);

      const expired = await response
        .clone()
        .json()
        .then((data) => response.status === 409 && data?.code === 'overlay-expired')
        .catch(() => false);

      if (expired && fileRef.current) {
        const form = new FormData();
        form.append('file', fileRef.current);
        for (const [key, value] of Object.entries(body)) {
          // El token caducado no se reenvía: el archivo lo sustituye.
          if (key === 'overlayToken' || value === undefined || value === null) continue;
          form.append(key, typeof value === 'string' ? value : JSON.stringify(value));
        }
        response = await post(form);
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || t(errorKey));
      }

      return response;
    },
    [t]
  );

  /** Entrega al navegador el PDF de una respuesta ya validada. */
  const savePdf = useCallback((response: Response, fallbackName: string) => {
    return response.blob().then((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download =
        response.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] ||
        fallbackName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
  }, []);

  /** Cualquier operación en vuelo: el reinicio a mitad de camino dejaría estado huérfano. */
  const isBusy =
    isChecking ||
    isUploading ||
    isDownloading ||
    isDownloadingAi ||
    isDetectingAi;
  const hasSomethingToClear = text.length > 0 || doc !== null || result !== null;

  /* ---------------- Carga de documento ---------------- */

  const uploadFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setError(null);

      const ext = (file.name.match(/\.[^.]+$/)?.[0] || '').toLowerCase();
      if (!UPLOAD.extensions.includes(ext)) {
        setError(t('plag.errorFormat', { ext: ext || '?' }));
        return;
      }
      if (file.size > UPLOAD.maxBytes) {
        setError(t('plag.errorSize', { mb: Math.round(UPLOAD.maxBytes / 1024 / 1024) }));
        return;
      }

      setIsUploading(true);
      try {
        fileRef.current = file;
        const body = new FormData();
        body.append('file', file);
        const response = await fetch(originalityUrl('extract'), { method: 'POST', body });
        const data = await readCheckerJson(response, t('plag.serviceOffline'));
        if (!response.ok) throw new Error(data.error || t('plag.errorRead'));

        setText(data.text);
        setDoc({
          filename: data.filename,
          characters: data.characters,
          words: data.words,
          truncated: data.truncated,
          sizeBytes: file.size,
          meta: data.meta ?? {},
          overlayToken: data.overlayToken ?? null,
        });
        resetAnalysis();
        setNotice(
          data.truncated
            ? t('plag.loadedTruncated', { name: data.filename })
            : t('plag.loaded', { name: data.filename })
        );
      } catch (uploadError) {
        setError((uploadError as Error).message);
        setDoc(null);
        fileRef.current = null;
      } finally {
        setIsUploading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [resetAnalysis, t]
  );

  /* ---------------- Análisis ---------------- */

  /**
   * El servicio devuelve el resultado de una sola vez: no hay flujo de progreso
   * por proveedor. Mientras la petición está en vuelo, la lista avanza de
   * «pendiente» a «consultando» de forma escalonada como indicador de actividad
   * —y así se rotula al pie—; el estado definitivo de cada proveedor sí se deriva
   * de las URLs realmente devueltas, no de esta animación.
   */
  const startTicker = useCallback(() => {
    stopTicker();
    setStatus(IDLE_STATUS);
    let index = 0;
    tickerRef.current = window.setInterval(() => {
      if (index >= PROVIDERS.length) {
        stopTicker();
        return;
      }
      const id = PROVIDERS[index].id;
      index += 1;
      setStatus((prev) => ({ ...prev, [id]: { state: 'checking', match: null } }));
    }, 650);
  }, [stopTicker]);

  /**
   * Estado definitivo de cada proveedor, tomado de la respuesta y no del reloj:
   * `providers` dice cuáles llegaron a aportar candidatos y las URLs de cada
   * fuente dicen cuál produjo cada coincidencia. Un proveedor ausente de esa
   * lista no se marca como «sin coincidencias» —no llegó a responder nada— sino
   * como «sin resultados», que es lo que de verdad ocurrió.
   */
  const settleStatus = useCallback((data: CheckResult) => {
    const best: Record<string, number> = {};
    for (const sentence of data.results) {
      for (const source of sentence.sources) {
        const id = providerOf(source.url);
        best[id] = Math.max(best[id] ?? 0, source.similarity);
      }
    }

    const answered = new Set(data.providers ?? []);
    setStatus(
      Object.fromEntries(
        PROVIDERS.map((p) => {
          const match = best[p.id] ?? null;
          const responded = match !== null || p.keys.some((key) => answered.has(key));
          return [
            p.id,
            {
              state: (responded ? 'done' : 'silent') as ProviderState,
              match,
            },
          ];
        })
      )
    );
  }, []);

  const handleCheck = async () => {
    if (!canCheck) return;
    setError(null);
    setNotice(null);
    setResult(null);
    setAiResult(null);
    setIsChecking(true);
    startTicker();

    try {
      const response = await fetch(originalityUrl('plagiarism-check'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, excludeCitations }),
      });
      const data = await readCheckerJson(response, t('plag.serviceOffline'));
      if (!response.ok) throw new Error(data.error || t('plag.errorAnalysis'));

      setResult(data);
      settleStatus(data);
    } catch (checkError) {
      setError((checkError as Error).message);
      setStatus(IDLE_STATUS);
    } finally {
      stopTicker();
      setIsChecking(false);
    }
  };

  const handleDownloadReport = async () => {
    setIsDownloading(true);
    setError(null);
    setNotice(null);
    try {
      // El texto viaja siempre: es lo que permite imprimir el informe reimpreso
      // cuando el documento no tiene geometría de página (texto pegado, .txt,
      // .rtf, .doc). El token solo añade el marcado sobre el original.
      const response = await downloadReport(
        'report',
        {
          text,
          excludeCitations,
          detectAi: true,
          meta: doc?.meta ?? {},
          ...(doc?.overlayToken ? { overlayToken: doc.overlayToken } : {}),
        },
        'plag.errorReport'
      );

      // Con documento subido, un «reimpreso» significa que la carátula original
      // no llegó al PDF. El estudiante tiene que enterarse aquí y no al abrirlo.
      if (doc?.overlayToken && response.headers.get('x-report-source') === 'reprinted') {
        setNotice(t('plag.reportReprinted'));
      }

      await savePdf(response, 'informe-similitud.pdf');
    } catch (reportError) {
      setError((reportError as Error).message);
    } finally {
      setIsDownloading(false);
    }
  };

  /** Estimación de IA en crudo: la comparten el botón de la tarjeta y el del PDF. */
  const runAiDetection = useCallback(async () => {
    const response = await fetch(originalityUrl('ai-detect'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await readCheckerJson(response, t('plag.serviceOffline'));
    if (!response.ok) throw new Error(data.error || t('plag.errorAi'));
    setAiResult(data as AiResult);
  }, [text, t]);

  const handleDetectAi = async () => {
    setIsDetectingAi(true);
    setError(null);
    try {
      await runAiDetection();
    } catch (aiError) {
      setError((aiError as Error).message);
    } finally {
      setIsDetectingAi(false);
    }
  };

  /**
   * Informe de IA como PDF, independiente del de similitud.
   *
   * Si todavía no se ha estimado, se estima primero y luego se descarga en lugar
   * de deshabilitar el botón: quien lo pulsa quiere «el PDF de IA», no dos pasos,
   * y encadenarlo deja la tarjeta con el mismo número que lleva el informe —una
   * tarjeta vacía junto a un PDF con datos parecería un fallo.
   */
  const handleDownloadAiReport = async () => {
    setIsDownloadingAi(true);
    setError(null);
    try {
      if (!aiResult) await runAiDetection();

      // Mismo camino que el informe de similitud: token primero —que no mueve ni
      // un byte— y reenvío del archivo solo si el servicio dice que ya no lo
      // tiene. El texto viaja siempre para que, sin geometría que marcar, el
      // servicio imprima el reimpreso en lugar de responder con un error.
      const response = await downloadReport(
        'ai-report',
        {
          text,
          meta: doc?.meta ?? {},
          ...(doc?.overlayToken ? { overlayToken: doc.overlayToken } : {}),
        },
        'plag.errorAiReport'
      );

      if (doc?.overlayToken && response.headers.get('x-report-source') === 'reprinted') {
        setNotice(t('plag.reportReprinted'));
      }

      await savePdf(response, 'informe-ia.pdf');
    } catch (reportError) {
      setError((reportError as Error).message);
    } finally {
      setIsDownloadingAi(false);
    }
  };

  const value = useMemo<OriginalityCheckContextValue>(
    () => ({
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
    }),
    [
      text,
      doc,
      excludeCitations,
      isChecking,
      isUploading,
      isDownloading,
      isDownloadingAi,
      isDetectingAi,
      result,
      aiResult,
      error,
      notice,
      isDragging,
      status,
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
    ]
  );

  return (
    <OriginalityCheckContext.Provider value={value}>{children}</OriginalityCheckContext.Provider>
  );
};

export function useOriginalityCheck(): OriginalityCheckContextValue {
  const context = useContext(OriginalityCheckContext);
  if (!context) {
    throw new Error('useOriginalityCheck debe usarse dentro de <OriginalityCheckProvider>');
  }
  return context;
}
