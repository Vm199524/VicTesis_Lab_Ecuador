import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  AlertCircle,
  Type,
  Download,
  Bot,
  Lightbulb,
  Search,
  Bell,
  ChevronDown,
  User,
  CheckCircle2,
  MinusCircle,
  FileText,
  BarChart3,
  CaseSensitive,
  Scale,
  BookOpen,
  Database,
  FlaskConical,
  FileStack,
  Brain,
  BookMarked,
  Link2,
  Network,
  HardDrive,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import FileDropzone from "@/components/FileDropzone";
import IntegrityLogo from "@/components/IntegrityLogo";
import { checkTextSchema, TEXT_LIMITS } from "../../../shared/schema";
import { useTranslation } from "@/i18n";

/**
 * Proveedores consultados por el backend, en el orden en que se muestran.
 * `test` mapea el dominio de una URL de fuente a este proveedor (para el
 * porcentaje de coincidencia); `resultKeys` son los nombres que usa
 * `server/plagiarism.js` en `result.providers` para este mismo proveedor
 * (ver `providersUsed()` en server/plagiarism.js y `providersSeen` en
 * server/sources.js), usados para distinguir "respondió sin coincidencias"
 * de "no devolvió ningún candidato".
 */
const PROVIDERS = [
  { key: "wikipedia", label: "Wikipedia", Icon: BookOpen, test: (h) => h.endsWith("wikipedia.org"), resultKeys: ["wikipedia-en", "wikipedia-es"] },
  { key: "core", label: "CORE", Icon: Database, test: (h) => h === "core.ac.uk" || h.endsWith(".core.ac.uk"), resultKeys: ["core"] },
  { key: "europepmc", label: "Europe PMC", Icon: FlaskConical, test: (h) => h.endsWith("europepmc.org"), resultKeys: ["europepmc"] },
  { key: "arxiv", label: "arXiv", Icon: FileStack, test: (h) => h.endsWith("arxiv.org"), resultKeys: ["arxiv"] },
  { key: "semanticscholar", label: "Semantic Scholar", Icon: Brain, test: (h) => h.endsWith("semanticscholar.org"), resultKeys: ["semanticscholar"] },
  { key: "doaj", label: "DOAJ", Icon: BookMarked, test: (h) => h.endsWith("doaj.org"), resultKeys: ["doaj"] },
  { key: "crossref", label: "CrossRef", Icon: Link2, test: (h) => h.endsWith("doi.org") || h.endsWith("crossref.org"), resultKeys: ["crossref"] },
  { key: "openalex", label: "OpenAlex", Icon: Network, test: (h) => h.endsWith("openalex.org"), resultKeys: ["openalex"] },
  { key: "local", label: "Repositorio Local", Icon: HardDrive, test: () => false, resultKeys: ["corpus"] },
];

const initialProviderStatus = () =>
  Object.fromEntries(PROVIDERS.map((p) => [p.key, { status: "pending", matchPercent: null }]));

/** Determina a qué proveedor pertenece una URL de fuente, por su dominio. */
function classifyUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    const match = PROVIDERS.find((p) => p.key !== "local" && p.test(host));
    return match ? match.key : "local";
  } catch {
    return "local";
  }
}

/**
 * Calcula el estado final real de cada proveedor combinando dos señales del
 * backend: las fuentes citadas en `result.results[].sources[].url` (dan el
 * porcentaje de coincidencia) y `result.providers` (la lista de proveedores
 * que sí devolvieron al menos un candidato utilizable, aunque no haya
 * quedado como fuente citada). Un proveedor entra en uno de tres estados:
 *   - "matched": tiene al menos una fuente atribuida → coincidencia {x}%.
 *   - "checked": aparece en result.providers pero sin fuente atribuida →
 *     respondió, sin coincidencias.
 *   - "no-results": no aparece en result.providers → no devolvió nada; no es
 *     honesto decir "comprobado" de un proveedor que no llegó a responder.
 */
function computeFinalProviderStatus(result) {
  const providersUsed = new Set(result.providers ?? []);
  const bestByProvider = {};
  for (const item of result.results ?? []) {
    for (const source of item.sources ?? []) {
      const key = classifyUrl(source.url);
      bestByProvider[key] = Math.max(bestByProvider[key] || 0, source.similarity);
    }
  }

  const status = {};
  for (const p of PROVIDERS) {
    const best = bestByProvider[p.key] || 0;
    if (best > 0) {
      status[p.key] = { status: "matched", matchPercent: Math.round(best) };
    } else if (p.resultKeys.some((k) => providersUsed.has(k))) {
      status[p.key] = { status: "checked", matchPercent: 0 };
    } else {
      status[p.key] = { status: "no-results", matchPercent: null };
    }
  }
  return status;
}

const Index = () => {
  const [text, setText] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [excludeCitations, setExcludeCitations] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [isDetectingAi, setIsDetectingAi] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [fileMeta, setFileMeta] = useState(null); // { filename, sizeBytes } | null
  const [providerStatus, setProviderStatus] = useState(initialProviderStatus);
  // El idioma del ecosistema se define en otra plataforma: aquí solo se lee una vez.
  const language = useMemo(() => localStorage.getItem("language") || "es", []);
  const { toast } = useToast();
  const t = useTranslation(language);

  const wordCount = useMemo(
    () => text.split(/\s+/).filter(Boolean).length,
    [text]
  );
  const overLimit = text.length > TEXT_LIMITS.max;
  const canCheck = text.length >= TEXT_LIMITS.min && !overLimit;
  const hasContent = text.length > 0;

  // Si el texto se vacía manualmente, el documento cargado deja de ser válido.
  useEffect(() => {
    if (text.length === 0 && fileMeta) setFileMeta(null);
  }, [text, fileMeta]);

  // El endpoint de análisis responde de una sola vez (sin progreso incremental).
  // Mientras la petición está en vuelo, se simula actividad avanzando los
  // proveedores de "Pendiente" a "Comprobando…" de forma escalonada; es solo
  // un indicador visual, aclarado con una nota al pie en la tarjeta de estado.
  useEffect(() => {
    if (!isChecking) return undefined;
    setProviderStatus(initialProviderStatus());
    let i = 0;
    const timer = setInterval(() => {
      setProviderStatus((prev) => {
        if (i >= PROVIDERS.length) return prev;
        const key = PROVIDERS[i].key;
        i += 1;
        return { ...prev, [key]: { status: "checking", matchPercent: null } };
      });
    }, 280);
    return () => clearInterval(timer);
  }, [isChecking]);

  const resolvedProviders = Object.values(providerStatus).filter((s) => s.status !== "pending").length;
  const rawProgressPercent = Math.round((resolvedProviders / PROVIDERS.length) * 100);
  // Mientras la petición sigue en vuelo, se limita el tope visual para no dar
  // la impresión de un 100% completado antes de tener el resultado real.
  const progressPercent = isChecking ? Math.min(rawProgressPercent, 92) : rawProgressPercent;

  const showError = (description) =>
    toast({ title: "Error", description, variant: "destructive" });

  const handleExtracted = (data) => {
    if (!data) {
      setText("");
      setFileMeta(null);
      setResult(null);
      setAiResult(null);
      setProviderStatus(initialProviderStatus());
      return;
    }

    setText(data.text);
    setFileMeta({ filename: data.filename, sizeBytes: data.fileSizeBytes ?? null });
    setResult(null);
    setAiResult(null);
    setProviderStatus(initialProviderStatus());
    toast({
      title: t("documentLoaded"),
      description: t("documentsWords", {
        filename: data.filename,
        truncated: data.truncated ? t("truncatedNote") : ""
      }).replace(/\s+/g, " "),
    });
  };

  const handleCheck = async () => {
    const validation = checkTextSchema.safeParse({ text, excludeCitations });
    if (!validation.success) {
      showError(validation.error.errors[0]?.message || t("error"));
      return;
    }

    setIsChecking(true);
    setResult(null);
    setAiResult(null);
    try {
      const response = await fetch("/api/plagiarism-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, excludeCitations }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t("errorAnalysis"));
      }

      setResult(data);
      setProviderStatus(computeFinalProviderStatus(data));
      toast({
        title: t("analysisComplete"),
        description: `${t("plagiarismIndex")}: ${data.plagiarismPercentage}%`,
      });
    } catch (error) {
      console.error("Error checking plagiarism:", error);
      setProviderStatus(initialProviderStatus());
      showError(error.message);
    } finally {
      setIsChecking(false);
    }
  };

  /** Descarga el informe PDF. El servidor reanaliza: el PDF debe ser atestiguable. */
  const handleDownloadReport = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, excludeCitations }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || t("errorReport"));
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        response.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] ||
        "informe-similitud.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast({ title: t("reportDownloaded"), description: link.download });
    } catch (error) {
      showError(error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDetectAi = async () => {
    setIsDetectingAi(true);
    try {
      const response = await fetch("/api/ai-detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("errorEstimate"));
      setAiResult(data);
    } catch (error) {
      showError(error.message);
    } finally {
      setIsDetectingAi(false);
    }
  };

  const getScoreColor = (score) => {
    if (score < 20) return "text-green-600";
    if (score < 50) return "text-yellow-600";
    return "text-red-600";
  };

  // Campos del resumen: guiones cuando no hay documento ni texto, sin inventar valores.
  const displayName = fileMeta?.filename ?? (hasContent ? t("pastedTextLabel") : t("emptyPlaceholder"));
  const displayWords = hasContent ? wordCount.toLocaleString(language) : t("emptyPlaceholder");
  const displayChars = hasContent ? text.length.toLocaleString(language) : t("emptyPlaceholder");
  const sizeBytes = fileMeta?.sizeBytes ?? (hasContent ? new Blob([text]).size : null);
  const sizeIsFromText = !fileMeta && hasContent;
  const displaySize =
    sizeBytes != null
      ? `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB${sizeIsFromText ? ` (${t("pastedTextLabel").toLowerCase()})` : ""}`
      : t("emptyPlaceholder");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Cabecera fija */}
      <header className="sticky top-0 z-40 flex h-[72px] items-center border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <IntegrityLogo size="md" />
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-bold leading-tight text-slate-900">{t("title")}</h1>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                Ver. 2.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100"
                  data-testid="button-notifications"
                  aria-label={t("notifications")}
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    0
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64">
                <p className="text-sm font-medium text-slate-800">{t("noNotifications")}</p>
                <p className="mt-1 text-xs text-slate-500">{t("noNotificationsSub")}</p>
              </PopoverContent>
            </Popover>

            <Separator orientation="vertical" className="h-6 bg-slate-200" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-full p-1 pr-2 transition-colors hover:bg-slate-100"
                  data-testid="button-account-menu"
                >
                  <Avatar className="h-8 w-8 border border-slate-200">
                    <AvatarFallback className="bg-slate-100 text-slate-500">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>{t("accountMenuLabel")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled
                  className="whitespace-normal text-xs text-slate-500 opacity-100"
                >
                  {t("accountMenuItem")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[62%_38%]">
          {/* Columna izquierda: entrada de documento/texto */}
          <Card className="rounded-2xl border-slate-200 shadow-sm" data-testid="card-input">
            <CardContent className="space-y-4 pt-6">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t("privacyNotice")}
              </span>

              <FileDropzone
                onExtracted={handleExtracted}
                onError={showError}
                disabled={isChecking}
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <span className="text-sm font-medium text-slate-500">{t("uploadOrPaste")}</span>
                <span
                  className={cn(
                    "text-sm tabular-nums",
                    overLimit ? "font-semibold text-red-600" : "text-slate-400"
                  )}
                >
                  {text.length.toLocaleString(language)} / {TEXT_LIMITS.max.toLocaleString(language)}
                </span>
              </div>

              <Textarea
                data-testid="input-text"
                placeholder={t("textarea", { min: TEXT_LIMITS.min })}
                value={text}
                onChange={(event) => setText(event.target.value)}
                className="min-h-[280px] resize-y text-base"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p
                  className="flex items-center gap-1.5 text-sm text-slate-500"
                  data-testid="text-character-count"
                >
                  <Type className="h-3.5 w-3.5" />
                  {text.length.toLocaleString(language)} {t("characterCount")}
                </p>
                <span
                  className={cn(
                    "text-sm tabular-nums",
                    overLimit ? "font-semibold text-red-600" : "text-slate-400"
                  )}
                >
                  {text.length.toLocaleString(language)} / {TEXT_LIMITS.max.toLocaleString(language)}
                </span>
              </div>

              <Separator className="bg-slate-100" />

              <div className="flex items-center gap-3 pt-1">
                <Switch
                  id="exclude-citations"
                  checked={excludeCitations}
                  onCheckedChange={setExcludeCitations}
                  disabled={isChecking}
                  data-testid="switch-exclude-citations"
                />
                <Label htmlFor="exclude-citations" className="cursor-pointer text-base text-slate-700">
                  {t("excludeCitations")}
                </Label>
              </div>

              {overLimit && (
                <Alert variant="destructive" data-testid="alert-over-limit">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t("overLimit", { max: TEXT_LIMITS.max.toLocaleString(language), extra: (text.length - TEXT_LIMITS.max).toLocaleString(language) })}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Columna derecha: resumen y estado del análisis */}
          <div className="flex flex-col gap-6">
            <Card className="rounded-2xl border-slate-200 shadow-sm" data-testid="card-summary">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-900">
                  {t("documentSummary")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div
                  className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-sm"
                  data-testid="document-summary-fields"
                >
                  <div className="flex min-w-0 items-center gap-2 text-slate-600" data-testid="summary-filename">
                    <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate">{displayName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600" data-testid="summary-words">
                    <BarChart3 className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>{displayWords === t("emptyPlaceholder") ? displayWords : `${displayWords} ${t("words")}`}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600" data-testid="summary-chars">
                    <CaseSensitive className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>{displayChars === t("emptyPlaceholder") ? displayChars : `${displayChars} ${t("characterCount")}`}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600" data-testid="summary-size">
                    <Scale className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>{displaySize}</span>
                  </div>
                </div>

                <Button
                  data-testid="button-check-plagiarism"
                  onClick={handleCheck}
                  disabled={isChecking || !canCheck}
                  className={cn(
                    "h-12 w-full gap-2 rounded-xl border-b-2 border-emerald-500/70 bg-gradient-to-b from-slate-900 to-[#0d2137] text-base font-semibold text-white shadow-[0_0_20px_-4px_rgba(16,185,129,0.55)] hover:brightness-110",
                    (isChecking || !canCheck) && "cursor-not-allowed opacity-50 shadow-none hover:brightness-100"
                  )}
                >
                  {isChecking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {isChecking ? t("checking") : t("startAnalysis")}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 shadow-sm" data-testid="card-provider-status">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-900">
                  {t("realtimeStatus")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                  <div
                    className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(16,185,129,0.6)] transition-all duration-500"
                    style={{ left: `calc(${progressPercent}% - 5px)` }}
                  />
                </div>

                <ul className="mt-4 space-y-2.5" data-testid="list-provider-status">
                  {PROVIDERS.map(({ key, label, Icon }) => {
                    const entry = providerStatus[key];
                    const isPending = !entry || entry.status === "pending";
                    const isCheckingRow = entry?.status === "checking";
                    const hasMatch = entry?.status === "matched";
                    const isChecked = entry?.status === "checked";
                    const hasNoResults = entry?.status === "no-results";

                    let statusText = t("providerPending");
                    if (isCheckingRow) statusText = t("providerChecking");
                    else if (hasMatch) statusText = t("providerMatch", { percent: entry.matchPercent });
                    else if (isChecked) statusText = t("providerNoMatch");
                    else if (hasNoResults) statusText = t("providerNoResults");

                    return (
                      <li
                        key={key}
                        className="flex items-center justify-between gap-3 text-sm"
                        data-testid={`provider-status-${key}`}
                      >
                        <span className="flex items-center gap-2 text-slate-700">
                          <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                          {label}
                        </span>
                        <span
                          className={cn(
                            "flex items-center gap-1 text-xs font-medium",
                            isPending && "text-slate-400",
                            isCheckingRow && "animate-pulse text-slate-400",
                            (hasMatch || isChecked) && "text-emerald-600",
                            hasNoResults && "text-slate-300"
                          )}
                        >
                          {(hasMatch || isChecked) && <CheckCircle2 className="h-3.5 w-3.5" />}
                          {hasNoResults && <MinusCircle className="h-3.5 w-3.5" />}
                          {statusText}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <p className="mt-4 text-xs text-slate-400">{t("indicativeProgress")}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Resultados del análisis: ancho completo, debajo de la retícula */}
        {result && (
          <div className="mt-8 space-y-6">
            <Card className="rounded-2xl border-slate-200 shadow-sm" data-testid="card-report">
              <CardHeader>
                <CardTitle className="text-slate-900">{t("reportTitle")}</CardTitle>
                {result.sampled && (
                  <CardDescription>
                    {t("reportSampled", { chunks: result.analyzedChunks, total: result.totalChunks })}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleDownloadReport}
                    disabled={isDownloading}
                    data-testid="button-download-report"
                    className="flex-1"
                  >
                    {isDownloading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    {isDownloading ? t("generatingReport") : t("downloadReport")}
                  </Button>

                  <Button
                    onClick={handleDetectAi}
                    disabled={isDetectingAi}
                    variant="outline"
                    data-testid="button-detect-ai"
                    className="flex-1"
                  >
                    {isDetectingAi ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Bot className="mr-2 h-4 w-4" />
                    )}
                    {isDetectingAi ? t("detectingAi") : t("detectAi")}
                  </Button>
                </div>

                {aiResult && (
                  <Alert data-testid="alert-ai-result">
                    <Bot className="h-4 w-4" />
                    <AlertDescription className="space-y-2">
                      <p className="font-semibold">
                        {aiResult.score === null
                          ? aiResult.label
                          : `${t("aiIndicator")}: ${aiResult.score}% — ${aiResult.label}`}
                      </p>
                      <p className="text-sm text-muted-foreground">{aiResult.note}</p>
                      {aiResult.caveat && (
                        <p className="text-xs text-muted-foreground">{aiResult.caveat}</p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {result.semanticAlerts > 0 && (
                  <Alert data-testid="alert-semantic">
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription className="space-y-1">
                      <p className="font-semibold">
                        {result.semanticAlerts} {t("semanticAlerts")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("semanticDesc")}
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-6 text-center">
                    <p className="mb-2 text-sm text-slate-500">
                      {t("plagiarismLabel")}
                    </p>
                    <p
                      className={`text-5xl font-bold ${getScoreColor(result.plagiarismPercentage)}`}
                      data-testid="text-plagiarism-percentage"
                    >
                      {result.plagiarismPercentage}%
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-6 text-center">
                    <p className="mb-2 text-sm text-slate-500">
                      {t("similarityLabel")}
                    </p>
                    <p
                      className={`text-5xl font-bold ${getScoreColor(result.overallScore)}`}
                      data-testid="text-overall-score"
                    >
                      {result.overallScore}%
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>{t("analyzedPassages")}</span>
                    <span className="font-semibold" data-testid="text-total-sentences">
                      {result.totalSentences}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>{t("plagiarizedPassages")}</span>
                    <span
                      className="font-semibold text-red-600"
                      data-testid="text-plagiarized-sentences"
                    >
                      {result.plagiarizedSentences}
                    </span>
                  </div>
                  <Progress
                    value={(result.plagiarizedSentences / result.totalSentences) * 100}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 shadow-sm" data-testid="card-details">
              <CardHeader>
                <CardTitle className="text-slate-900">{t("detailedResults")}</CardTitle>
                <CardDescription>
                  {t("detailedDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.results.map((item, index) => (
                    <div
                      key={index}
                      data-testid={`result-sentence-${index}`}
                      className={`rounded-xl border-2 p-4 ${
                        item.isPlagiarized
                          ? "border-red-200 bg-red-50"
                          : "border-green-200 bg-green-50"
                      }`}
                    >
                      <div className="mb-2 flex flex-wrap items-start justify-between gap-4">
                        <p
                          className="flex-1 text-sm font-medium text-slate-800"
                          data-testid={`text-sentence-${index}`}
                        >
                          {item.sentence}
                        </p>
                        <span
                          data-testid={`badge-similarity-${index}`}
                          className={`rounded-full px-3 py-1 text-sm font-bold ${
                            item.isPlagiarized
                              ? "bg-red-600 text-white"
                              : "bg-green-600 text-white"
                          }`}
                        >
                          {item.similarity}%
                        </span>
                      </div>

                      {item.metrics && (
                        <p
                          className="mb-2 font-mono text-[11px] text-slate-500"
                          data-testid={`text-metrics-${index}`}
                        >
                          {t("metricsLabel", {
                            containment: item.metrics.containment,
                            cosine: item.metrics.cosine,
                            fingerprint: item.metrics.fingerprint,
                            longestRun: item.metrics.longestRun
                          })}
                        </p>
                      )}

                      {item.sources.length > 0 && (
                        <div className="mt-2 border-t border-current/20 pt-2">
                          <p className="mb-1 text-xs font-semibold text-slate-600">{t("potentialSources")}</p>
                          <div className="space-y-1">
                            {item.sources.map((source, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  data-testid={`link-source-${index}-${idx}`}
                                  className={`flex-1 truncate text-xs hover:underline ${
                                    source.similarity >= 50
                                      ? "font-semibold text-red-600"
                                      : "text-orange-600"
                                  }`}
                                >
                                  {source.url}
                                </a>
                                <span
                                  className={`text-xs font-bold ${
                                    source.similarity >= 50
                                      ? "text-red-600"
                                      : "text-orange-600"
                                  }`}
                                  data-testid={`text-source-similarity-${index}-${idx}`}
                                >
                                  {source.similarity}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <p className="mt-10 text-center text-xs text-slate-400">{t("orgTag")}</p>
      </main>
    </div>
  );
};

export default Index;
