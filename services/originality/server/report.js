/**
 * Report generation — two independent documents.
 *
 * `generateReportPdf` prints the similarity report: the originality index, the
 * matched sources, the submitted text with matches highlighted in place, and a
 * quantified reduction plan that projects the index after each correction.
 *
 * `generateAiReportPdf` prints the AI-writing report: the likelihood band, the
 * signals that produced it, and rewriting guidance keyed to those signals.
 *
 * They are deliberately separate artifacts. A similarity index is a measurement
 * against located sources; an AI estimate is a probabilistic reading of style.
 * Binding them into one PDF invited readers to treat the second with the
 * evidentiary weight of the first, so each now travels — and is cited — alone.
 *
 * Both are authored as HTML and printed through headless Chromium, so the
 * reports and the on-screen result share one set of styling decisions.
 */

import puppeteer from "puppeteer";
import { createHash } from "node:crypto";

import { aiRewriteGuidance, similarityReductionPlan } from "./guidance.js";

/**
 * Similarity bands. The thresholds are reporting conventions, not scientific
 * cutoffs: a 12% index made of correctly quoted material is fine, and a 12%
 * index that is one verbatim paragraph is not. The bands exist to direct
 * attention, and the wording says so.
 */
const BANDS = [
  { max: 15, id: "low", label: "Bajo", color: "#15803d", bg: "#dcfce7",
    note: "Coincidencias compatibles con citas y terminologia comun." },
  { max: 30, id: "moderate", label: "Moderado", color: "#a16207", bg: "#fef9c3",
    note: "Revisar que cada coincidencia este citada y entrecomillada." },
  { max: 50, id: "high", label: "Alto", color: "#c2410c", bg: "#ffedd5",
    note: "Proporcion elevada de texto coincidente. Requiere revision detallada." },
  { max: 101, id: "critical", label: "Critico", color: "#b91c1c", bg: "#fee2e2",
    note: "La mayor parte del documento coincide con fuentes localizadas." },
];

export function classify(percentage) {
  return BANDS.find((band) => percentage < band.max) ?? BANDS[BANDS.length - 1];
}

/** Report identifier: stable for the same text, so a re-run is traceable. */
export function verificationCode(text) {
  return createHash("sha256").update(text).digest("hex").slice(0, 12).toUpperCase();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Describe which pages of the original travel with the report.
 *
 * `overlayHighlights` trims the appendix to the pages that actually carry a
 * mark, so a sixty-page thesis with four marked pages downloads as a report
 * plus four pages, not plus sixty. The reader still needs to know that: a
 * document that jumps from page 3 to page 12 without a word of warning reads
 * as broken, not as edited on purpose.
 *
 * @param {{totalPages: number, keptPages: number[], markedPages?: number[]}|null} info
 *   `markedPages` matters because the cover travels unmarked (`keepCover`), and
 *   naming it among the matches would be a lie about a page nobody flagged.
 * @returns {string} A sentence naming what is included, or "" when there is
 *   nothing to explain (no page info, every page survived the trim, or nothing
 *   at all travelled — the caller already explains that case in its own words).
 */
function describeKeptPages(info) {
  if (!info || !Array.isArray(info.keptPages) || !Number.isFinite(info.totalPages)) return "";
  if (info.keptPages.length >= info.totalPages) return "";
  if (info.keptPages.length === 0) return "";

  const marked = Array.isArray(info.markedPages) ? info.markedPages : info.keptPages;

  // La carátula viaja sola: no hubo ninguna coincidencia que marcar sobre ella
  // ni sobre el resto del documento.
  if (marked.length === 0) {
    return ` Ninguna pagina del original presento una coincidencia que marcar, asi que de el solo se adjunta la <b>caratula</b> (pagina 1), que es la que identifica el trabajo; reproducir la tesis completa no aportaria evidencia.`;
  }

  const listed = marked.slice(0, 12).join(", ");
  const rest = marked.length > 12 ? ` y ${marked.length - 12} mas` : "";
  const cover =
    info.keptPages.includes(1) && !marked.includes(1)
      ? " y la <b>caratula</b> (pagina 1), que va sin marca pero identifica el trabajo"
      : "";

  return ` Para no adjuntar el documento completo, se incluyen <b>${info.keptPages.length} de ${info.totalPages} paginas</b> del original: las que presentaron una marca (pagina${marked.length === 1 ? "" : "s"} ${listed}${rest})${cover}. Cada una conserva su numero de pagina real para que la ubique en su archivo; el resto no tuvo coincidencias y no aparece en esta descarga.`;
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// ---------------------------------------------------------------------------
// Corrective guidance
// ---------------------------------------------------------------------------

/**
 * Derive the actions a student can actually take.
 *
 * The metric pattern distinguishes the cases: a long verbatim run is a
 * quotation problem, high semantic overlap with low literal overlap is an
 * attribution problem, and many small matches are usually terminology.
 */
export function buildRecommendations(analysis) {
  const recommendations = [];
  const results = analysis.results ?? [];

  const verbatim = results.filter((r) => (r.metrics?.longestRun ?? 0) >= 8);
  const nearCopy = results.filter((r) => (r.metrics?.containment ?? 0) >= 40);
  // High meaning-level overlap with little shared wording is the signature of
  // a rewritten source, which the lexical metrics alone would report as clean.
  const paraphrase = results.filter(
    (r) =>
      (r.metrics?.semantic ?? 0) >= 55 ||
      (r.similarity >= 35 && (r.metrics?.containment ?? 0) < 25)
  );
  const uncited = results.filter((r) => r.similarity >= 30 && !/[""«»"]/.test(r.sentence));

  if (verbatim.length > 0) {
    recommendations.push({
      severity: "alta",
      title: "Copia literal sin comillas",
      detail:
        `${verbatim.length} pasaje(s) reproducen secuencias largas de una fuente palabra por palabra. ` +
        "Encierre el fragmento entre comillas y anada la cita con pagina, o reescribalo por completo con sus propias palabras.",
    });
  }

  if (nearCopy.length > 0) {
    recommendations.push({
      severity: "alta",
      title: "Coincidencia literal elevada",
      detail:
        `${nearCopy.length} pasaje(s) comparten mas del 40% de sus secuencias de palabras con la fuente. ` +
        "Reescribir cambiando solo algunas palabras no resuelve esto: reformule la idea desde su propia comprension y cite el origen.",
    });
  }

  if (paraphrase.length > 0) {
    recommendations.push({
      severity: "media",
      title: "Parafrasis sin atribucion",
      detail:
        `${paraphrase.length} pasaje(s) expresan el contenido de una fuente con otras palabras. ` +
        "La parafrasis tambien exige cita: reescribir no transfiere la autoria de la idea.",
    });
  }

  if (uncited.length > 0) {
    recommendations.push({
      severity: "media",
      title: "Coincidencias sin marcas de cita",
      detail:
        `${uncited.length} pasaje(s) con coincidencia significativa no contienen comillas ni marcas de cita. ` +
        "Verifique que cada uno lleve su referencia en el formato exigido (APA, IEEE, Vancouver).",
    });
  }

  const semanticFlagged = results.filter((r) => (r.semanticFlags ?? []).length > 0);
  if (semanticFlagged.length > 0) {
    recommendations.push({
      severity: "media",
      title: "Revisar afinidad de significado",
      detail:
        `${semanticFlagged.length} pasaje(s) coinciden en contenido con una fuente sin compartir su redaccion. ` +
        "Si se apoyo en esa fuente, la idea debe citarse aunque la haya reescrito por completo. " +
        "Si llego a ella de forma independiente, no hay nada que corregir: verifique cual es el caso antes de actuar.",
    });
  }

  if (analysis.sampled) {
    recommendations.push({
      severity: "informativa",
      title: "Analisis por muestreo",
      detail:
        `El documento supera el limite de pasajes analizables, por lo que se examinaron ${analysis.analyzedChunks} ` +
        `de ${analysis.totalChunks} pasajes distribuidos uniformemente. El indice es una estimacion representativa, no un recuento exhaustivo.`,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      severity: "informativa",
      title: "Sin hallazgos que requieran correccion",
      detail:
        "No se detectaron coincidencias que sugieran copia literal ni parafrasis sin atribuir. " +
        "Revise de todos modos que las citas existentes esten completas en la lista de referencias.",
    });
  }

  return recommendations;
}

// ---------------------------------------------------------------------------
// Source aggregation
// ---------------------------------------------------------------------------

/** Collapse per-passage matches into one row per source, as reviewers expect. */
export function aggregateSources(results) {
  const byUrl = new Map();

  for (const result of results ?? []) {
    for (const source of result.sources ?? []) {
      const existing = byUrl.get(source.url);
      const words = result.sentence.split(/\s+/).filter(Boolean).length;

      if (existing) {
        existing.passages += 1;
        existing.words += words;
        existing.best = Math.max(existing.best, source.similarity);
      } else {
        byUrl.set(source.url, {
          url: source.url,
          host: hostOf(source.url),
          best: source.similarity,
          passages: 1,
          words,
        });
      }
    }
  }

  return [...byUrl.values()].sort((a, b) => b.best - a.best);
}

// ---------------------------------------------------------------------------
// Highlighted document
// ---------------------------------------------------------------------------

/**
 * Rebuild the submitted text with matched passages marked.
 *
 * Passages overlap by one sentence by design, so ranges are merged before
 * rendering; otherwise the same sentence would be wrapped twice and the
 * nesting would break the markup.
 */
function highlightedBody(text, results) {
  const ranges = (results ?? [])
    .filter((result) => result.similarity >= 15 && Number.isFinite(result.start))
    .map((result) => ({
      start: result.start,
      end: Math.min(text.length, (result.end ?? result.start) + result.sentence.length),
      similarity: result.similarity,
      source: result.sources?.[0]?.url ?? "",
    }))
    .sort((a, b) => a.start - b.start);

  const merged = [];
  for (const range of ranges) {
    const previous = merged[merged.length - 1];
    if (previous && range.start <= previous.end) {
      previous.end = Math.max(previous.end, range.end);
      previous.similarity = Math.max(previous.similarity, range.similarity);
      previous.source ||= range.source;
    } else {
      merged.push({ ...range });
    }
  }

  let html = "";
  let cursor = 0;

  for (const range of merged) {
    if (range.start > cursor) html += escapeHtml(text.slice(cursor, range.start));

    const band = classify(range.similarity);
    html +=
      `<mark class="hl" style="background:${band.bg};border-bottom:2px solid ${band.color}">` +
      escapeHtml(text.slice(range.start, range.end)) +
      `<sup style="color:${band.color}">${range.similarity}%</sup></mark>`;

    cursor = range.end;
  }

  html += escapeHtml(text.slice(cursor));
  return html.replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>");
}

// ---------------------------------------------------------------------------
// HTML document
// ---------------------------------------------------------------------------

const STYLES = `
  @page { size: A4; margin: 18mm 16mm 20mm; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
         color: #0f172a; font-size: 10.5pt; line-height: 1.55; margin: 0; }
  h1 { font-size: 20pt; margin: 0 0 4px; letter-spacing: -0.4px; }
  h2 { font-size: 13pt; margin: 0 0 12px; padding-bottom: 6px;
       border-bottom: 2px solid #e2e8f0; }
  .muted { color: #64748b; font-size: 9pt; }
  .page-break { page-break-before: always; }
  .avoid-break { page-break-inside: avoid; }

  .cover { display: flex; gap: 28px; align-items: center; margin: 24px 0 32px; }
  .gauge { width: 150px; height: 150px; border-radius: 50%; flex-shrink: 0;
           display: flex; flex-direction: column; align-items: center;
           justify-content: center; color: #fff; }
  .gauge .value { font-size: 38pt; font-weight: 700; line-height: 1; }
  .gauge .caption { font-size: 8pt; text-transform: uppercase; letter-spacing: 1px; margin-top: 6px; }

  .meta { display: grid; grid-template-columns: auto 1fr; gap: 4px 16px; font-size: 9.5pt; }
  .meta dt { color: #64748b; }
  .meta dd { margin: 0; font-weight: 500; }

  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 20px 0 28px; }
  .stat { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; }
  .stat .n { font-size: 17pt; font-weight: 700; }
  .stat .l { font-size: 8pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }

  table { width: 100%; border-collapse: collapse; font-size: 9pt; }
  th { text-align: left; background: #f8fafc; padding: 7px 8px;
       border-bottom: 2px solid #e2e8f0; font-size: 8.5pt;
       text-transform: uppercase; letter-spacing: 0.4px; color: #475569; }
  td { padding: 7px 8px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  .pct { font-weight: 700; white-space: nowrap; }
  .url { color: #475569; word-break: break-all; font-size: 8pt; }

  .rec { border-left: 4px solid; padding: 10px 14px; margin-bottom: 12px;
         background: #f8fafc; border-radius: 0 4px 4px 0; }
  .rec h3 { margin: 0 0 4px; font-size: 10.5pt; }
  .rec p { margin: 0; font-size: 9.5pt; color: #334155; }
  .sev { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.6px;
         padding: 1px 6px; border-radius: 3px; margin-left: 6px; vertical-align: middle; }

  .doc { font-size: 10pt; line-height: 1.85; text-align: justify; }
  .doc p { margin: 0 0 10px; }
  mark.hl { padding: 1px 0; }
  mark.hl sup { font-size: 7pt; font-weight: 700; margin-left: 2px; }

  .legend { display: flex; gap: 14px; flex-wrap: wrap; font-size: 8.5pt;
            margin-bottom: 14px; color: #475569; }
  .legend span { display: inline-flex; align-items: center; gap: 5px; }
  .swatch { width: 11px; height: 11px; border-radius: 2px; display: inline-block; }

  .passage { border: 1px solid #e2e8f0; border-radius: 5px; padding: 10px 12px; margin-bottom: 10px; }
  .passage blockquote { margin: 0 0 8px; font-size: 9.5pt; color: #1e293b;
                        font-style: italic; border-left: 3px solid #cbd5e1; padding-left: 10px; }
  .metrics { display: flex; gap: 14px; font-size: 8pt; color: #64748b; flex-wrap: wrap; }
  .metrics b { color: #0f172a; }

  .disclaimer { margin-top: 20px; padding: 12px 14px; background: #f8fafc;
                border: 1px solid #e2e8f0; border-radius: 5px; font-size: 8.5pt; color: #475569; }

  /* --- Reduction plan and rewriting guidance --------------------------- */

  /* The projection headline: the number the author is trying to move, and
     where the plan says it lands. Rendered large because it is the one figure
     a student acts on. */
  .proj { display: flex; align-items: center; gap: 18px; padding: 14px 16px;
          border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 18px;
          background: #f8fafc; }
  .proj .n { font-size: 26pt; font-weight: 700; line-height: 1; }
  .proj .l { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.6px;
             color: #64748b; margin-top: 3px; }
  .proj .arrow { font-size: 18pt; color: #94a3b8; }
  .proj .gain { margin-left: auto; text-align: right; font-size: 9pt; color: #334155; }

  .tech { border: 1px solid #e2e8f0; border-left: 4px solid; border-radius: 0 5px 5px 0;
          padding: 11px 14px; margin-bottom: 12px; }
  .tech h3 { margin: 0 0 6px; font-size: 10.5pt; }
  .tech .why { margin: 0 0 7px; font-size: 9pt; color: #475569;
               background: #f8fafc; padding: 6px 9px; border-radius: 4px; }
  .tech .how { margin: 0 0 7px; font-size: 9.5pt; color: #0f172a; }
  .tech .foot { display: flex; gap: 16px; flex-wrap: wrap; font-size: 8.5pt;
                color: #64748b; margin-top: 7px; padding-top: 7px;
                border-top: 1px solid #f1f5f9; }
  .tech .foot b { color: #0f172a; }
  .tech ol, .tech ul { margin: 0 0 7px; padding-left: 18px; font-size: 9.5pt; color: #334155; }
  .tech li { margin-bottom: 3px; }

  /* Before/after sits side by side so the transformation is legible at a
     glance; on a narrow column it would read as two unrelated quotations. */
  .ba { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 8px 0 4px; }
  .ba > div { padding: 8px 10px; border-radius: 4px; font-size: 8.5pt; line-height: 1.5; }
  .ba .before { background: #fef2f2; border: 1px solid #fecaca; color: #7f1d1d; }
  .ba .after { background: #f0fdf4; border: 1px solid #bbf7d0; color: #14532d; }
  .ba .tag { display: block; font-size: 7pt; text-transform: uppercase;
             letter-spacing: 0.6px; font-weight: 700; margin-bottom: 4px; opacity: 0.75; }

  .notice { padding: 11px 14px; border-radius: 5px; margin-bottom: 16px;
            font-size: 9.5pt; color: #334155; }
  .notice b { display: block; margin-bottom: 5px; }

  .bands { display: grid; gap: 7px; margin-bottom: 18px; }
  .bands > div { display: flex; align-items: baseline; gap: 10px; font-size: 9.5pt;
                 padding: 6px 10px; border-radius: 4px; }
  .bands .r { font-weight: 700; width: 74px; flex-shrink: 0; font-size: 9pt; }
`;

// ---------------------------------------------------------------------------
// AI-writing bands
// ---------------------------------------------------------------------------

/** Colour for an AI-likelihood band. Deliberately muted: this is not a verdict. */
const AI_BAND_COLORS = {
  unlikely: "#15803d",
  inconclusive: "#64748b",
  possible: "#a16207",
  likely: "#c2410c",
  insufficient: "#94a3b8",
  unavailable: "#94a3b8",
};

/**
 * The reading scale, printed in the report so the number is never seen without
 * it. The ranges mirror the bands in `ai-detect.js`; the wording states what
 * each range does and does not license the reader to conclude.
 */
const AI_BANDS = [
  { range: "0 – 30%", id: "unlikely", label: "Poco probable",
    note: "Las señales de estilo y predictibilidad son compatibles con escritura humana." },
  { range: "30 – 55%", id: "inconclusive", label: "No concluyente",
    note: "Señales mixtas. Este tramo no distingue de forma fiable y no debe usarse como evidencia." },
  { range: "55 – 75%", id: "possible", label: "Posible asistencia de IA",
    note: "El texto es más uniforme y predecible de lo habitual. Conviene conversar con el autor antes de concluir nada." },
  { range: "75 – 100%", id: "likely", label: "Compatible con generación por IA",
    note: "Predictibilidad alta y variación baja, patrón característico de texto generado. Sigue requiriendo verificación humana." },
];

/**
 * The AI estimate's place in the similarity report: a cross-reference, nothing
 * more.
 *
 * The full estimate now prints as its own document. What stays here is a single
 * line telling the reader that it exists and where to read it, because a
 * similarity report that silently omitted a completed AI analysis would be read
 * as an absence of findings rather than a separation of concerns.
 */
function renderAiSection(ai) {
  if (!ai) return "";

  const color = ai.color ?? AI_BAND_COLORS[ai.band] ?? "#64748b";

  const figure =
    ai.score === null
      ? escapeHtml(ai.label ?? "no evaluable")
      : `<b style="color:${color}">${ai.score}% — ${escapeHtml(ai.label)}</b>`;

  return `<div class="notice" style="background:#f8fafc;border:1px solid #e2e8f0">
  <b>Estimación de escritura con IA: ${figure}</b>
  Esta cifra no forma parte del índice de similitud y se emite como documento aparte,
  con las señales que la producen y la guía de reescritura correspondiente. Descárguela
  desde el mismo panel, en «Informe de IA». No debe leerse con el valor probatorio de
  una coincidencia textual localizada.
</div>`;
}

// ---------------------------------------------------------------------------
// Reduction plan
// ---------------------------------------------------------------------------

/** Severity palette, shared by the reduction plan and the rewriting guidance. */
const SEVERITY = {
  alta: "#b91c1c",
  media: "#a16207",
  baja: "#0369a1",
  informativa: "#0369a1",
};

function severityColor(severity) {
  return SEVERITY[severity] ?? "#475569";
}

function renderBeforeAfter(example) {
  if (!example || (!example.before && !example.after)) return "";

  return `<div class="ba">
  <div class="before"><span class="tag">Antes</span>${escapeHtml(example.before ?? "—")}</div>
  <div class="after"><span class="tag">Después</span>${escapeHtml(example.after ?? "—")}</div>
</div>`;
}

/**
 * The corrective section of the similarity report.
 *
 * `similarityReductionPlan` turns the analysis into costed actions: how many
 * words each finding covers, how many points of the index it currently carries,
 * and where the index lands once the action is taken. That projection is the
 * part a student can plan around, which the previous prose recommendations
 * could not give them.
 *
 * If the plan cannot be produced the older `buildRecommendations` output prints
 * instead: losing the projection is a degraded report, losing the corrective
 * section altogether would be a broken one.
 */
function renderCorrectiveSection(analysis, text) {
  let plan = null;
  try {
    plan = similarityReductionPlan(analysis, text);
  } catch (error) {
    console.warn(`[report] reduction plan unavailable: ${error?.message ?? error}`);
  }

  if (!plan || !Array.isArray(plan.actions) || plan.actions.length === 0) {
    const recommendations = buildRecommendations(analysis);
    return `<div class="page-break"></div>
<h2>Acciones correctivas</h2>
${recommendations
  .map(
    (rec) => `<div class="rec avoid-break" style="border-left-color:${severityColor(rec.severity)}">
  <h3>${escapeHtml(rec.title)}<span class="sev" style="background:${severityColor(rec.severity)};color:#fff">${escapeHtml(rec.severity)}</span></h3>
  <p>${escapeHtml(rec.detail)}</p>
</div>`
  )
  .join("")}`;
  }

  const current = plan.currentIndex ?? analysis.plagiarismPercentage ?? 0;
  const projected = plan.projectedIndex ?? current;
  const saved = Math.max(0, current - projected);

  return `<div class="page-break"></div>
<h2>Plan de reducción del índice</h2>

<div class="proj avoid-break">
  <div>
    <div class="n" style="color:${classify(current).color}">${current}%</div>
    <div class="l">Índice actual</div>
  </div>
  <div class="arrow">&rarr;</div>
  <div>
    <div class="n" style="color:${classify(projected).color}">${projected}%</div>
    <div class="l">Índice proyectado</div>
  </div>
  <div class="gain">
    Reducción estimada: <b>${saved} punto${saved === 1 ? "" : "s"}</b><br>
    sobre ${(plan.totalWords ?? 0).toLocaleString("es-EC")} palabras analizadas
  </div>
</div>

<p style="font-size:9pt;color:#64748b;margin:0 0 18px">
  La proyección supone que cada acción se aplica por completo. No es una promesa: el
  índice final depende de cómo se reescriba cada pasaje y de que las fuentes citadas
  se mantengan. Las citas correctamente entrecomilladas y atribuidas siguen contando
  en el índice, y eso es legítimo.
</p>

${plan.actions
  .map(
    (action) => `<div class="tech avoid-break" style="border-left-color:${severityColor(action.severity)}">
  <h3>${escapeHtml(action.title)}<span class="sev" style="background:${severityColor(action.severity)};color:#fff">${escapeHtml(action.severity ?? "")}</span></h3>
  <p class="why">${escapeHtml(action.category ?? "")}${action.category ? " · " : ""}${(action.words ?? 0).toLocaleString("es-EC")} palabras en ${action.passages ?? 0} pasaje${action.passages === 1 ? "" : "s"}</p>
  <p class="how">${escapeHtml(action.technique ?? "")}</p>
  ${
    Array.isArray(action.steps) && action.steps.length > 0
      ? `<ol>${action.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>`
      : ""
  }
  ${renderBeforeAfter(action.example)}
  <div class="foot">
    <span>Aporta hoy <b>${action.currentContribution ?? 0} pt</b></span>
    <span>Tras la acción <b>${action.projectedContribution ?? 0} pt</b></span>
    <span>Reducción <b>${action.reduction ?? 0} pt</b></span>
  </div>
</div>`
  )
  .join("")}

${
  plan.summary
    ? `<div class="notice avoid-break" style="background:#f0f9ff;border:1px solid #bae6fd">
  <b>En resumen</b>${escapeHtml(plan.summary)}
</div>`
    : ""
}`;
}

/**
 * @param {object} payload
 * @param {object} payload.analysis  Result of `analyzeDocument`.
 * @param {string} payload.text      The submitted text.
 * @param {object} [payload.meta]    Document/author metadata for the cover.
 * @param {object} [payload.ai]      Result of `detectAiText`, when requested.
 */
export function renderReportHtml({
  analysis,
  text,
  meta = {},
  ai = null,
  originalPage = null,
  originalPageInfo = null,
  // Overlay reports print the recommendation as a trailing annex (after the
  // marked original pages) and pass `includeTail:false` here; standalone
  // reports keep it inline at the end.
  includeTail = true,
}) {
  const percentage = analysis.plagiarismPercentage ?? 0;
  const band = classify(percentage);
  const sources = aggregateSources(analysis.results);
  const words = text.split(/\s+/).filter(Boolean).length;
  const code = verificationCode(text);

  const generated = new Date().toLocaleString("es-EC", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const topPassages = (analysis.results ?? [])
    .filter((result) => result.similarity >= 25)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 12);

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<title>Informe de similitud ${escapeHtml(code)}</title>
<style>${STYLES}</style></head><body>

<h1>Informe de similitud</h1>
<div class="muted">Documento ${escapeHtml(code)} · generado el ${escapeHtml(generated)}</div>

<div class="cover">
  <div class="gauge" style="background:${band.color}">
    <div class="value">${percentage}%</div>
    <div class="caption">Indice de similitud</div>
  </div>
  <div>
    <dl class="meta">
      <dt>Titulo</dt><dd>${escapeHtml(meta.title || "Documento sin titulo")}</dd>
      <dt>Autor</dt><dd>${escapeHtml(meta.author || "No declarado")}</dd>
      <dt>Archivo</dt><dd>${escapeHtml(meta.filename || "texto pegado")}</dd>
      <dt>Nivel</dt><dd style="color:${band.color};font-weight:700">${band.label}</dd>
      <dt>Codigo</dt><dd style="font-family:monospace">${escapeHtml(code)}</dd>
    </dl>
    <p style="margin:12px 0 0;font-size:9.5pt;color:#334155">${band.note}</p>
  </div>
</div>

<div class="page-break"></div>
<h2>¿Cómo leer este informe?</h2>

<div style="display:grid;gap:16px;margin-bottom:20px">
  <div style="border-left:3px solid #0369a1;padding-left:12px">
    <p style="margin:0 0 6px;font-weight:700">¿QUÉ ES EL ÍNDICE DE SIMILITUD?</p>
    <p style="margin:0;font-size:9.5pt;color:#334155">
      No es un promedio de pasajes. Se calcula como: <b>(palabras_copiadas × similitud) ÷ total_palabras</b>
    </p>
    <p style="margin:8px 0 0;font-size:9.5pt;color:#334155">
      Ejemplo: Si tu documento tiene 1000 palabras y 200 son idénticas a una fuente, el índice es 20%,
      aunque técnicamente solo el 20% esté copiado.
    </p>
  </div>

  <div style="border-left:3px solid #15803d;padding-left:12px">
    <p style="margin:0 0 6px;font-weight:700">🟢 VERDE (0–15%)</p>
    <p style="margin:0;font-size:9.5pt;color:#334155">
      Normal. Citas directas entrecomilladas, terminología común o pequeños solapamientos. <b>No requiere acción si están citados.</b>
    </p>
  </div>

  <div style="border-left:3px solid #a16207;padding-left:12px">
    <p style="margin:0 0 6px;font-weight:700">🟡 AMARILLO (15–30%)</p>
    <p style="margin:0;font-size:9.5pt;color:#334155">
      Revisar. Asegúrate de que cada coincidencia tenga <b>comillas y cita bibliográfica</b>.
      Si no están, agrégalas.
    </p>
  </div>

  <div style="border-left:3px solid #c2410c;padding-left:12px">
    <p style="margin:0 0 6px;font-weight:700">🟠 NARANJA (30–50%)</p>
    <p style="margin:0;font-size:9.5pt;color:#334155">
      Proporción elevada de texto coincidente. <b>Verifica que cada fragmento tenga comillas y cita.
      Si no, coloca comillas o reescribe con tus propias palabras.</b>
    </p>
  </div>

  <div style="border-left:3px solid #b91c1c;padding-left:12px">
    <p style="margin:0 0 6px;font-weight:707;color:#b91c1c">🔴 ROJO (50%+)</p>
    <p style="margin:0;font-size:9.5pt;color:#334155">
      La mayoría del documento coincide con fuentes encontradas. <b>Revisa cada pasaje rojo.</b>
      Si lo sacaste de un artículo, pon comillas y cita. Si lo parafraseaste, cita la idea.
      Si es tuyo, investiga por qué el sistema encontró similitud.
    </p>
  </div>
</div>

<div style="background:#f0f9ff;border:1px solid #0369a1;border-radius:6px;padding:12px;margin-bottom:20px">
  <p style="margin:0 0 8px;font-weight:700;color:#0369a1">⚠️ IMPORTANTE</p>
  <p style="margin:0;font-size:9.5pt;color:#334155">
    <b>El color NO decide si hay plagio.</b> Lo que importa es si está correctamente citado:
  </p>
  <ul style="margin:6px 0 0;padding-left:20px;font-size:9.5pt;color:#334155">
    <li>✅ Texto IGUAL + Comillas + Cita = Está bien (cita textual legítima)</li>
    <li>❌ Texto IGUAL + Sin comillas + Sin cita = Plagio</li>
    <li>❌ Idea PARAFRASEADA + Sin cita = Plagio de idea (aunque esté en tus palabras)</li>
  </ul>
</div>

<p style="margin:0;font-size:9.5pt;color:#334155;font-weight:700">LAS 4 MÉTRICAS QUE VES EN CADA PASAJE:</p>
<ul style="margin:8px 0 0;padding-left:20px;font-size:9.5pt;color:#334155">
  <li><b>Literal:</b> % de frases idénticas (cadenas de 4 palabras). Detecta copia textual.</li>
  <li><b>Léxica:</b> Solape de vocabulario ponderado (TF-IDF). Detecta reutilización de palabras clave.</li>
  <li><b>Huella:</b> Reutilización parcial (algoritmo de MOSS). Detecta plagio fragmentado.</li>
  <li><b>Semántica:</b> ¿Dice lo mismo aunque con otras palabras? Detecta parafraseo.</li>
</ul>

<div class="stats">
  <div class="stat"><div class="n">${words.toLocaleString("es-EC")}</div><div class="l">Palabras</div></div>
  <div class="stat"><div class="n">${analysis.totalSentences ?? 0}</div><div class="l">Pasajes analizados</div></div>
  <div class="stat"><div class="n">${sources.length}</div><div class="l">Fuentes coincidentes</div></div>
  ${
    ai && ai.score !== null
      ? `<div class="stat"><div class="n" style="color:${AI_BAND_COLORS[ai.band] ?? "#64748b"}">${ai.score}%</div><div class="l">Indicio de IA</div></div>`
      : `<div class="stat"><div class="n">${analysis.plagiarizedSentences ?? 0}</div><div class="l">Pasajes marcados</div></div>`
  }
</div>

${renderAiSection(ai)}

<h2>Fuentes coincidentes</h2>
${
  sources.length === 0
    ? `<p class="muted">No se localizaron fuentes con coincidencia significativa.</p>`
    : `<table>
  <thead><tr><th style="width:52px">Coinc.</th><th>Fuente</th><th style="width:64px">Pasajes</th></tr></thead>
  <tbody>${sources
    .slice(0, 25)
    .map((source) => {
      const sband = classify(source.best);
      return `<tr>
      <td class="pct" style="color:${sband.color}">${source.best}%</td>
      <td><div>${escapeHtml(source.host)}</div><div class="url">${escapeHtml(source.url)}</div></td>
      <td>${source.passages}</td>
    </tr>`;
    })
    .join("")}</tbody></table>`
}

<div class="page-break"></div>
<h2>Documento analizado</h2>
<div class="legend">
  ${BANDS.map(
    (b) => `<span><i class="swatch" style="background:${b.bg};border:1px solid ${b.color}"></i>${b.label}</span>`
  ).join("")}
  <span class="muted">El porcentaje sobre cada fragmento indica su coincidencia maxima.</span>
</div>
${
  originalPage
    ? originalPageInfo?.keptPages?.length === 0
      ? // Nothing was flagged: no page of the submission travels with the report.
        `<p style="font-size:9.5pt;color:#334155;margin:0">
  Ningun pasaje presento una coincidencia significativa sobre el documento original, asi que
  <b>no se adjunta ninguna hoja</b> en esta descarga: reproducir la tesis completa no aportaria
  evidencia, y el informe debe leerse, no duplicar la entrega.
</p>`
      : // The submission travels with this report, so reprinting it here would
        // show the same text twice — once reflowed into these styles, once as the
        // author actually wrote it. Only the second one is evidence.
        `<p style="font-size:9.5pt;color:#334155;margin:0">
  Las coincidencias estan marcadas <b>sobre el documento original</b>, que se adjunta a
  partir de la <b>pagina ${originalPage}</b> de este informe conservando su caratula,
  encabezados, tablas y paginacion. Cada marca lleva el numero con el que aparece en el
  detalle de coincidencias.${describeKeptPages(originalPageInfo)}
</p>`
    : `<div class="doc"><p>${highlightedBody(text, analysis.results)}</p></div>`
}

${
  topPassages.length === 0
    ? ""
    : `<div class="page-break"></div>
<h2>Detalle de coincidencias</h2>
${topPassages
  .map((passage) => {
    const pband = classify(passage.similarity);
    const metrics = passage.metrics ?? {};
    return `<div class="passage avoid-break">
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
    <span class="pct" style="color:${pband.color};font-size:11pt">${passage.similarity}%</span>
    <span class="url">${escapeHtml(passage.sources?.[0]?.url ?? "sin fuente dominante")}</span>
  </div>
  <blockquote>${escapeHtml(passage.sentence.slice(0, 420))}${passage.sentence.length > 420 ? "…" : ""}</blockquote>
  <div class="metrics">
    <span>Literal <b>${metrics.containment ?? 0}%</b></span>
    <span>Lexica <b>${metrics.cosine ?? 0}%</b></span>
    <span>Huella <b>${metrics.fingerprint ?? 0}%</b></span>
    <span>Semantica <b>${metrics.semantic ?? 0}%</b></span>
    <span>Racha <b>${metrics.longestRun ?? 0}</b> palabras</span>
  </div>
</div>`;
  })
  .join("")}`
}

${(() => {
  const flagged = (analysis.results ?? []).filter((r) => (r.semanticFlags ?? []).length > 0);
  if (flagged.length === 0) return "";

  return `<div class="page-break"></div>
<h2>Pasajes con afinidad de significado</h2>
<p style="font-size:9.5pt;color:#334155;margin:0 0 14px">
  Estos pasajes expresan un contenido muy proximo al de la fuente indicada, pero
  <b>no comparten su redaccion</b>. El indice de similitud no los contabiliza, porque
  con esta evidencia no es posible distinguir un texto reescrito a partir de la fuente
  de un texto independiente sobre el mismo tema. Se listan para que el evaluador
  aplique el criterio que la medicion no puede aportar.
</p>
${flagged
  .slice(0, 10)
  .map((passage) => {
    const flag = passage.semanticFlags[0];
    return `<div class="passage avoid-break">
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
    <span class="pct" style="color:#0369a1;font-size:11pt">Afinidad ${flag.semantic}%</span>
    <span class="url">${escapeHtml(flag.url)}</span>
  </div>
  <blockquote>${escapeHtml(passage.sentence.slice(0, 360))}${passage.sentence.length > 360 ? "…" : ""}</blockquote>
  <div class="metrics">
    <span>Coincidencia literal <b>${passage.metrics?.containment ?? 0}%</b></span>
    <span>Indice asignado <b>${passage.similarity}%</b></span>
  </div>
</div>`;
  })
  .join("")}`;
})()}

${
  includeTail
    ? `${renderCorrectiveSection(analysis, text)}

<div class="disclaimer">
  <b>Sobre la interpretacion de este informe.</b> El indice de similitud mide coincidencia
  textual con las fuentes que el sistema pudo localizar y leer; no es, por si solo, un
  dictamen de plagio. Una cita correcta produce coincidencia legitima, y una fuente no
  indexada publicamente no aparece aqui aunque haya sido copiada. La decision academica
  corresponde al evaluador, tras revisar los pasajes senalados en su contexto.
</div>`
    : ""
}

</body></html>`;
}

// ---------------------------------------------------------------------------
// AI-writing report
// ---------------------------------------------------------------------------

/**
 * The rewriting guidance section.
 *
 * This is the part a detector normally withholds. A bare percentage tells an
 * author that something is wrong with their prose and nothing about what; the
 * guidance names the signal that moved the number, the measured value behind
 * it, and the writing technique that addresses it.
 *
 * The techniques raise unpredictability by raising specificity — primary data,
 * named cases, the author's own analytical position — so a text that follows
 * them scores lower because it genuinely carries more of its author, not
 * because it has been disguised. That is also why the `authorship` block
 * matters: these detectors misfire most often on formal academic prose and on
 * writers working outside their first language, and an author wrongly flagged
 * needs to know how to evidence their own work.
 */
function renderGuidanceSection(ai) {
  let guidance = null;
  try {
    guidance = aiRewriteGuidance(ai);
  } catch (error) {
    console.warn(`[report] rewriting guidance unavailable: ${error?.message ?? error}`);
  }

  const fallback = Array.isArray(ai?.recommendations) ? ai.recommendations : [];

  if (!guidance || !Array.isArray(guidance.techniques) || guidance.techniques.length === 0) {
    if (fallback.length === 0) return "";

    return `<div class="page-break"></div>
<h2>Acciones recomendadas</h2>
<ul style="margin:0;padding-left:20px;font-size:9.5pt;color:#334155">
  ${fallback.map((item) => `<li style="margin-bottom:4px">${escapeHtml(item)}</li>`).join("")}
</ul>`;
  }

  return `<div class="page-break"></div>
<h2>Guía de reescritura</h2>

${
  guidance.headline
    ? `<p style="font-size:10pt;color:#334155;margin:0 0 18px">${escapeHtml(guidance.headline)}</p>`
    : ""
}

${guidance.techniques
  .map(
    (technique) => `<div class="tech avoid-break" style="border-left-color:${severityColor(technique.severity)}">
  <h3>${escapeHtml(technique.title)}<span class="sev" style="background:${severityColor(technique.severity)};color:#fff">${escapeHtml(technique.severity ?? "")}</span></h3>
  ${technique.why ? `<p class="why"><b>Por qué se marcó:</b> ${escapeHtml(technique.why)}</p>` : ""}
  ${technique.technique ? `<p class="how">${escapeHtml(technique.technique)}</p>` : ""}
  ${renderBeforeAfter(technique.example)}
  <div class="foot">
    ${technique.target ? `<span>Meta: <b>${escapeHtml(technique.target)}</b></span>` : ""}
    ${technique.impact ? `<span>Efecto: <b>${escapeHtml(technique.impact)}</b></span>` : ""}
  </div>
</div>`
  )
  .join("")}

${
  Array.isArray(guidance.authorship) && guidance.authorship.length > 0
    ? `<div class="notice avoid-break" style="background:#f0f9ff;border:1px solid #bae6fd">
  <b>Si el texto es suyo y aun así aparece marcado</b>
  Estos detectores producen falsos positivos con más frecuencia en prosa académica formal
  y en quienes no escriben en su lengua materna. Documentar el proceso es la defensa:
  <ul style="margin:7px 0 0;padding-left:20px">
    ${guidance.authorship.map((item) => `<li style="margin-bottom:3px">${escapeHtml(item)}</li>`).join("")}
  </ul>
</div>`
    : ""
}`;
}

/**
 * @param {object} payload
 * @param {object} payload.ai      Result of `detectAiText`.
 * @param {string} payload.text    The analysed text.
 * @param {object} [payload.meta]  Document/author metadata for the cover.
 */
export function renderAiReportHtml({
  ai,
  text,
  meta = {},
  originalPage = null,
  originalPageInfo = null,
  passages = [],
  // Overlay reports move the rewriting guide to a trailing annex (after the
  // marked original pages); standalone reports keep it inline.
  includeTail = true,
}) {
  const code = verificationCode(text);
  const color = ai?.color ?? AI_BAND_COLORS[ai?.band] ?? "#64748b";
  const bg = ai?.bg ?? "#f8fafc";
  const words = ai?.words ?? text.split(/\s+/).filter(Boolean).length;
  const scored = typeof ai?.score === "number";

  const generated = new Date().toLocaleString("es-EC", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<title>Informe de escritura con IA ${escapeHtml(code)}</title>
<style>${STYLES}</style></head><body>

<h1>Informe de escritura con IA</h1>
<div class="muted">Documento ${escapeHtml(code)} · generado el ${escapeHtml(generated)}</div>

<div class="cover">
  <div class="gauge" style="background:${color}">
    <div class="value">${scored ? `${ai.score}%` : "s/d"}</div>
    <div class="caption">Indicio de IA</div>
  </div>
  <div>
    <dl class="meta">
      <dt>Titulo</dt><dd>${escapeHtml(meta.title || "Documento sin titulo")}</dd>
      <dt>Autor</dt><dd>${escapeHtml(meta.author || "No declarado")}</dd>
      <dt>Archivo</dt><dd>${escapeHtml(meta.filename || "texto pegado")}</dd>
      <dt>Lectura</dt><dd style="color:${color};font-weight:700">${escapeHtml(ai?.label ?? "No evaluable")}</dd>
      <dt>Codigo</dt><dd style="font-family:monospace">${escapeHtml(code)}</dd>
    </dl>
    <p style="margin:12px 0 0;font-size:9.5pt;color:#334155">${escapeHtml(ai?.note ?? "")}</p>
  </div>
</div>

<div class="notice" style="background:${bg};border:1px solid ${color}40">
  <b>Qué mide este porcentaje</b>
  Es la proporción del texto cuyo estilo y predictibilidad se parecen a los de la prosa
  que producen los modelos de lenguaje. No mide copia: un texto puede ser enteramente
  original y aun así puntuar alto. Tampoco identifica qué herramienta se usó, ni si se
  usó alguna.
</div>

<div class="notice" style="background:#fffbeb;border:1px solid #fde68a">
  <b>Aviso importante</b>
  Esta cifra es una estimación probabilística, no un dictamen. Ningún método publicado
  —tampoco los comerciales— demuestra que un texto fue escrito por un modelo, y los
  falsos positivos recaen de forma desproporcionada sobre la escritura académica formal
  y sobre autores que no redactan en su lengua materna: exactamente el perfil que este
  portal atiende. Úsela para abrir una conversación con el autor, nunca como fundamento
  único de una sanción.
</div>

<h2>Cómo leer el resultado</h2>
<div class="bands">
  ${AI_BANDS.map((entry) => {
    const active = entry.id === ai?.band;
    const entryColor = AI_BAND_COLORS[entry.id] ?? "#64748b";
    return `<div style="background:${active ? bg : "#f8fafc"};border:1px solid ${active ? entryColor + "80" : "#e2e8f0"}">
    <span class="r" style="color:${entryColor}">${entry.range}</span>
    <span><b>${escapeHtml(entry.label)}</b> — ${escapeHtml(entry.note)}</span>
  </div>`;
  }).join("")}
</div>

<div class="stats">
  <div class="stat"><div class="n">${words.toLocaleString("es-EC")}</div><div class="l">Palabras</div></div>
  <div class="stat"><div class="n">${escapeHtml(ai?.confidence ?? "n/d")}</div><div class="l">Confianza del cálculo</div></div>
  <div class="stat"><div class="n" style="font-size:11pt">${ai?.modelUsed ? "Modelo + estilo" : "Solo estilo"}</div><div class="l">Método</div></div>
  <div class="stat"><div class="n">${ai?.windowsScored ?? 0}</div><div class="l">Ventanas puntuadas</div></div>
</div>

${
  !scored
    ? `<div class="disclaimer"><b>Sin estimación.</b> ${escapeHtml(ai?.note ?? "No fue posible calcular ninguna señal sobre este texto.")}</div>`
    : `<div class="page-break"></div>
<h2>Señales medidas</h2>
<p style="font-size:9pt;color:#64748b;margin:0 0 14px">
  Cada señal se mide por separado y aporta al resultado según su peso. La columna
  «aporte» indica cuánto empuja esa señal hacia el extremo compatible con generación
  automática; el valor medido es el dato en bruto, para que pueda verificarse.
</p>
<table>
  <thead><tr><th style="width:52px">Aporte</th><th>Señal medida</th><th style="width:66px">Valor</th></tr></thead>
  <tbody>${(ai.signals ?? [])
    .map(
      (signal) => `<tr>
      <td class="pct" style="color:${signal.contribution >= 60 ? color : "#475569"}">${signal.contribution}%</td>
      <td><div>${escapeHtml(signal.label)}</div><div class="url">${escapeHtml(signal.explain)}</div></td>
      <td>${signal.measured ?? "—"}</td>
    </tr>`
    )
    .join("")}</tbody>
</table>`
}

${includeTail ? renderGuidanceSection(ai) : ""}

<div class="page-break"></div>
<h2>Documento analizado</h2>
${
  originalPage
    ? `<div class="legend">
  ${AI_BANDS.map(
    (b) =>
      `<span><i class="swatch" style="background:${AI_BAND_COLORS[b.id]}33;border:1px solid ${
        AI_BAND_COLORS[b.id]
      }"></i>${escapeHtml(b.label)}</span>`
  ).join("")}
</div>
<p style="font-size:9.5pt;color:#334155;margin:0 0 12px">
  ${
    originalPageInfo?.keptPages?.length === 0
      ? `<b>Ningun bloque del documento original supero el umbral</b>, por lo que no se adjunta
  ninguna hoja en esta descarga y la tesis no se reproduce completa.`
      : `El <b>documento original</b> se adjunta a partir de la <b>pagina ${originalPage}</b> con su
  caratula, encabezados y paginacion intactos.`
  } ${
    passages.length === 0
      ? "No hay ningun bloque cuyo indicio de escritura automatica supere el tramo \"no concluyente\", asi que va sin sombrear."
      : passages.length === 1
        ? "Sobre el esta sombreado <b>un bloque</b> cuyo indicio de escritura automatica supera el tramo \"no concluyente\", con su porcentaje."
        : `Sobre el estan sombreados <b>${passages.length} bloques</b> cuyo indicio de escritura automatica supera el tramo "no concluyente", cada uno con su porcentaje.`
  }
  Los titulares, la caratula y los encabezados corridos no se puntuan: no son prosa,
  y medir su ritmo daria un numero sobre la tipografia, no sobre la escritura.${describeKeptPages(originalPageInfo)}
</p>
<div class="disclaimer" style="margin-top:0">
  <b>Como leer esas marcas.</b> El sombreado por bloque es <b>mas ruidoso que el indice global</b>
  de la primera pagina: cada bloque se puntua con mucho menos texto, y tramos cortos, muy
  citados o muy tecnicos elevan el indicio sin que ello signifique nada. Son un <b>indicio para
  orientar la lectura</b>, nunca una marca de autoria por parrafo. La cifra que vale para
  cualquier conversacion con el autor es la global.
</div>`
    : `<p style="font-size:9pt;color:#64748b;margin:0 0 14px">
  El texto se reproduce completo, sin resaltar. Al no haberse subido un PDF con geometria de
  pagina, no hay un documento original sobre el que marcar los bloques.
</p>
<div class="doc"><p>${highlightedBody(text, [])}</p></div>`
}

<div class="disclaimer">
  <b>Límite de este informe.</b> ${escapeHtml(ai?.caveat ?? "Esta estimación es probabilística y no constituye prueba.")}
</div>

</body></html>`;
}

// ---------------------------------------------------------------------------
// PDF printing
// ---------------------------------------------------------------------------

/**
 * One browser is reused across requests: launching Chromium costs roughly a
 * second, which would dominate report generation. The instance is re-created
 * transparently if it dies.
 */
let browserPromise = null;

async function getBrowser() {
  if (browserPromise) {
    try {
      const browser = await browserPromise;
      if (browser.connected) return browser;
    } catch {
      // Fall through and relaunch.
    }
  }

  browserPromise = puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  });

  return browserPromise;
}

/** Release the shared browser; call on shutdown. */
export async function closeBrowser() {
  if (!browserPromise) return;
  try {
    (await browserPromise).close();
  } catch {
    // Already gone.
  }
  browserPromise = null;
}

/**
 * Print an authored HTML report to a PDF buffer.
 *
 * Both reports share the page furniture — the running header carries the report
 * name and its verification code, the footer the portal, the standing caveat and
 * the page count — so that a page separated from the rest still says what it is
 * and which document it came from.
 *
 * @param {string} html   The complete report document.
 * @param {string} title  Report name for the running header.
 * @param {string} code   Verification code for the analysed text.
 * @returns {Promise<Buffer>}
 */
async function printPdf(html, title, code) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // The document is fully self-contained, so nothing waits on the network.
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30_000 });

    return Buffer.from(
      await page.pdf({
        format: "A4",
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: `<div style="font-size:7pt;color:#94a3b8;width:100%;padding:0 16mm;">
          ${escapeHtml(title)} · ${escapeHtml(code)}</div>`,
        footerTemplate: `<div style="font-size:7pt;color:#94a3b8;width:100%;padding:0 16mm;
          display:flex;justify-content:space-between;">
          <span>Tesis Ecuador · generado automaticamente, requiere revision humana.</span>
          <span class="pageNumber"></span>/<span class="totalPages"></span></div>`,
        margin: { top: "20mm", bottom: "18mm", left: "16mm", right: "16mm" },
      })
    );
  } finally {
    await page.close();
  }
}

/**
 * Render the similarity report to a PDF buffer.
 *
 * @returns {Promise<Buffer>}
 */
export async function generateReportPdf(payload) {
  return printPdf(
    renderReportHtml(payload),
    "Informe de similitud",
    verificationCode(payload.text)
  );
}

/**
 * Render the AI-writing report to a PDF buffer.
 *
 * @param {object} payload
 * @param {object} payload.ai      Result of `detectAiText`.
 * @param {string} payload.text    The analysed text.
 * @param {object} [payload.meta]  Document/author metadata for the cover.
 * @returns {Promise<Buffer>}
 */
export async function generateAiReportPdf(payload) {
  return printPdf(
    renderAiReportHtml(payload),
    "Informe de escritura con IA",
    verificationCode(payload.text)
  );
}

// ---------------------------------------------------------------------------
// Trailing recommendation annex
//
// Overlay downloads merge [cover+analysis, marked original pages, annex]. The
// annex carries the recommendation ("cómo resolverlo") that the summary used to
// print before the original pages, so a downloaded report now closes with the
// plan of action instead of with the last marked page.
// ---------------------------------------------------------------------------

/** HTML for the trailing annex of a similarity report. */
export function renderReportTailHtml({ analysis, text, meta = {} }) {
  const percentage = analysis.plagiarismPercentage ?? 0;
  const band = classify(percentage);
  const code = verificationCode(text);
  const generated = new Date().toLocaleString("es-EC", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<title>Anexo · Plan de accion ${escapeHtml(code)}</title>
<style>${STYLES}</style></head><body>

<h1>Anexo al informe de similitud</h1>
<div class="muted">Documento ${escapeHtml(code)} · generado el ${escapeHtml(generated)}</div>

<div class="cover">
  <div class="gauge" style="background:${band.color}">
    <div class="value">${percentage}%</div>
    <div class="caption">Indice de similitud</div>
  </div>
  <div>
    <dl class="meta">
      <dt>Titulo</dt><dd>${escapeHtml(meta.title || "Documento sin titulo")}</dd>
      <dt>Autor</dt><dd>${escapeHtml(meta.author || "No declarado")}</dd>
      <dt>Archivo</dt><dd>${escapeHtml(meta.filename || "texto pegado")}</dd>
    </dl>
    <p style="margin:12px 0 0;font-size:9.5pt;color:#334155">
      Cierre del informe: como bajar la similitud detectada sobre el documento original
      marcado que antecede a estas paginas.
    </p>
  </div>
</div>

${renderCorrectiveSection(analysis, text)}

<div class="disclaimer">
  <b>Sobre la interpretacion de este informe.</b> El indice de similitud mide coincidencia
  textual con las fuentes que el sistema pudo localizar y leer; no es, por si solo, un
  dictamen de plagio. Una cita correcta produce coincidencia legitima, y una fuente no
  indexada publicamente no aparece aqui aunque haya sido copiada. La decision academica
  corresponde al evaluador, tras revisar los pasajes senalados en su contexto.
</div>

</body></html>`;
}

/** HTML for the trailing annex of an AI-writing report. */
export function renderAiReportTailHtml({ ai, text, meta = {} }) {
  const code = verificationCode(text);
  const color = ai?.color ?? AI_BAND_COLORS[ai?.band] ?? "#64748b";
  const generated = new Date().toLocaleString("es-EC", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const guidance = renderGuidanceSection(ai);

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<title>Anexo · Guia de reescritura ${escapeHtml(code)}</title>
<style>${STYLES}</style></head><body>

<h1>Anexo al informe de escritura con IA</h1>
<div class="muted">Documento ${escapeHtml(code)} · generado el ${escapeHtml(generated)}</div>

<div class="cover">
  <div class="gauge" style="background:${color}">
    <div class="value">${typeof ai?.score === "number" ? `${ai.score}%` : "s/d"}</div>
    <div class="caption">Indicio de IA</div>
  </div>
  <div>
    <dl class="meta">
      <dt>Titulo</dt><dd>${escapeHtml(meta.title || "Documento sin titulo")}</dd>
      <dt>Autor</dt><dd>${escapeHtml(meta.author || "No declarado")}</dd>
      <dt>Archivo</dt><dd>${escapeHtml(meta.filename || "texto pegado")}</dd>
    </dl>
    <p style="margin:12px 0 0;font-size:9.5pt;color:#334155">
      Cierre del informe: como hacer que la prosa cargue mas de tu propia voz cuando el
      indicio de escritura automatica sea alto.
    </p>
  </div>
</div>

${
  guidance ||
  `<p style="font-size:9.5pt;color:#64748b">
  No hay senales suficientes para ofrecer una guia de reescritura especifica.
</p>`
}

</body></html>`;
}

/** Render the trailing recommendation annex of a similarity report. */
export async function generateReportTailPdf(payload) {
  return printPdf(
    renderReportTailHtml(payload),
    "Anexo · Informe de similitud",
    verificationCode(payload.text)
  );
}

/** Render the trailing recommendation annex of an AI-writing report. */
export async function generateAiReportTailPdf(payload) {
  return printPdf(
    renderAiReportTailHtml(payload),
    "Anexo · Informe de IA",
    verificationCode(payload.text)
  );
}
