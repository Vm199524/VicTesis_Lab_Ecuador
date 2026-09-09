/**
 * Machine-generated text detection.
 *
 * READ THIS BEFORE USING THE OUTPUT FOR ANYTHING THAT AFFECTS A STUDENT.
 *
 * There is no reliable way to prove a text was written by a language model.
 * Every published detector, commercial ones included, produces false positives,
 * and they fall disproportionately on non-native writers and on formal academic
 * prose -- precisely the population and the register this tool serves. A high
 * score here is a reason to open a conversation, never a finding of misconduct.
 *
 * The implementation reflects that. It reports a band rather than a verdict,
 * always returns the individual signals so a human can see what drove the
 * number, and states its own uncertainty in the payload rather than leaving the
 * caller to remember it.
 *
 * Method: a small causal language model scores how predictable the text is.
 * Model-generated prose sits in a high-probability region of its own
 * distribution -- low perplexity, and unusually little variation from sentence
 * to sentence. Human writing wanders: it is less predictable on average and far
 * more uneven, a property the literature calls burstiness. Both signals are
 * measured, because either alone is trivially defeated.
 */

import { AutoTokenizer, AutoModelForCausalLM, env } from "@huggingface/transformers";

/** Multilingual by design: submissions here are largely in Spanish. */
const MODEL_ID = process.env.AI_DETECT_MODEL || "onnx-community/Qwen2.5-0.5B";
const ENABLED = process.env.AI_DETECT_DISABLED !== "1";

/** Tokens per scored window, and how many windows a document contributes. */
const WINDOW_TOKENS = 160;
const MAX_WINDOWS = 8;

env.cacheDir = process.env.TRANSFORMERS_CACHE || "./.models";
env.allowLocalModels = true;

let modelPromise = null;
let unavailableReason = null;

async function getModel() {
  if (!ENABLED || unavailableReason) return null;

  if (!modelPromise) {
    modelPromise = (async () => {
      const tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID);
      const model = await AutoModelForCausalLM.from_pretrained(MODEL_ID, { dtype: "q4" });
      return { tokenizer, model };
    })().catch((error) => {
      unavailableReason = error?.message ?? String(error);
      console.warn(
        `[ai-detect] model unavailable (${unavailableReason}) — ` +
          "falling back to stylometric signals only."
      );
      return null;
    });
  }

  return modelPromise;
}

export function aiDetectStatus() {
  if (!ENABLED) return { enabled: false, reason: "disabled by configuration" };
  if (unavailableReason) return { enabled: false, reason: unavailableReason };
  return { enabled: true, model: MODEL_ID };
}

// ---------------------------------------------------------------------------
// Stylometric signals (no model required, language independent)
// ---------------------------------------------------------------------------

function sentencesOf(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.split(/\s+/).length >= 3);
}

/**
 * Sentence-length variation.
 *
 * Human paragraphs mix a nine-word sentence with a thirty-word one. Generated
 * prose tends toward a house rhythm, so the coefficient of variation drops.
 */
function lengthVariation(sentences) {
  if (sentences.length < 4) return null;

  const lengths = sentences.map((sentence) => sentence.split(/\s+/).length);
  const mean = lengths.reduce((sum, n) => sum + n, 0) / lengths.length;
  if (mean === 0) return null;

  const variance = lengths.reduce((sum, n) => sum + (n - mean) ** 2, 0) / lengths.length;
  return Math.sqrt(variance) / mean;
}

/** Share of sentences opening with an explicit discourse connective. */
function connectiveDensity(sentences) {
  if (sentences.length < 4) return null;

  const openers =
    /^(ademas|asimismo|sin embargo|no obstante|por lo tanto|en consecuencia|por otra parte|en conclusion|finalmente|en primer lugar|en segundo lugar|cabe destacar|es importante|de igual manera|por consiguiente|moreover|however|furthermore|therefore|consequently|additionally|in conclusion|firstly|secondly|it is important|notably)\b/i;

  const hits = sentences.filter((sentence) =>
    openers.test(sentence.normalize("NFD").replace(/[̀-ͯ]/g, ""))
  ).length;

  return hits / sentences.length;
}

/** Vocabulary breadth, measured on a fixed window so length does not skew it. */
function typeTokenRatio(text) {
  const words = text.toLowerCase().match(/[\p{L}]{3,}/gu) ?? [];
  if (words.length < 60) return null;

  const window = words.slice(0, 400);
  return new Set(window).size / window.length;
}

/**
 * Traces of a specific human writing: contractions, digressions in
 * parentheses, first person, informal punctuation. Their complete absence in
 * a long text is weak evidence on its own, which is why it carries the
 * smallest weight below.
 */
function humanMarkers(text) {
  const markers = [
    /\b(yo|mi|me parece|creo que|en mi opinion|a mi juicio)\b/i,
    /\([^)]{15,}\)/,
    /[;:]\s*[a-z]/,
    /\b(pero|aunque|sino)\b/i,
    /\.{3}|--|—/,
  ];

  const normalized = text.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return markers.filter((pattern) => pattern.test(normalized)).length / markers.length;
}

// ---------------------------------------------------------------------------
// Model-based signals
// ---------------------------------------------------------------------------

/** Softmax log-probability of the observed next token, for every position. */
function tokenLogProbs(logits, ids) {
  const [, positions, vocab] = logits.dims;
  const data = logits.data;
  const out = [];

  // Position i predicts token i+1, so the final row has no observed target.
  for (let i = 0; i < positions - 1; i++) {
    const base = i * vocab;
    const target = Number(ids[i + 1]);

    let max = -Infinity;
    for (let v = 0; v < vocab; v++) {
      const value = data[base + v];
      if (value > max) max = value;
    }

    let sum = 0;
    for (let v = 0; v < vocab; v++) sum += Math.exp(data[base + v] - max);

    out.push(data[base + target] - max - Math.log(sum));
  }

  return out;
}

function statistics(values) {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return { mean, sd: Math.sqrt(variance) };
}

/**
 * Score windows of the document with the language model.
 * @returns {Promise<{perplexity: number, burstiness: number, windows: number} | null>}
 */
async function modelSignals(text) {
  const loaded = await getModel();
  if (!loaded) return null;

  const { tokenizer, model } = loaded;

  try {
    const encoded = await tokenizer(text);
    const allIds = Array.from(encoded.input_ids.data);
    if (allIds.length < 40) return null;

    // Sample windows across the document rather than scoring all of it: cost is
    // linear in tokens and a thesis would take minutes.
    const starts = [];
    const stride = Math.max(WINDOW_TOKENS, Math.floor(allIds.length / MAX_WINDOWS));
    for (let i = 0; i + 40 <= allIds.length && starts.length < MAX_WINDOWS; i += stride) {
      starts.push(i);
    }

    const logProbs = [];

    for (const start of starts) {
      const ids = allIds.slice(start, start + WINDOW_TOKENS);
      if (ids.length < 40) continue;

      const input = {
        input_ids: new (encoded.input_ids.constructor)(
          "int64",
          BigInt64Array.from(ids.map((id) => BigInt(id))),
          [1, ids.length]
        ),
        attention_mask: new (encoded.input_ids.constructor)(
          "int64",
          BigInt64Array.from(ids.map(() => 1n)),
          [1, ids.length]
        ),
      };

      const output = await model(input);
      logProbs.push(...tokenLogProbs(output.logits, ids));
    }

    if (logProbs.length < 30) return null;

    const { mean, sd } = statistics(logProbs);
    return { perplexity: Math.exp(-mean), burstiness: sd, windows: starts.length };
  } catch (error) {
    unavailableReason = error?.message ?? String(error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Combination
// ---------------------------------------------------------------------------

/** Map a value to 0..1 where `low` reads as human and `high` as generated. */
function ramp(value, human, machine) {
  if (value === null || !Number.isFinite(value)) return null;
  const t = (value - human) / (machine - human);
  return Math.max(0, Math.min(1, t));
}

const BANDS = [
  { max: 30, id: "unlikely", label: "Poco probable",
    color: "#15803d", bg: "#f0fdf4",
    note: "Las senales estilometricas y de predictibilidad son compatibles con escritura humana.",
    recommendations: [] },
  { max: 55, id: "inconclusive", label: "No concluyente",
    color: "#ca8a04", bg: "#fefce8",
    note: "Senales mixtas. Este rango no distingue de forma fiable; no debe usarse como evidencia.",
    recommendations: [] },
  { max: 75, id: "possible", label: "Posible asistencia de IA",
    color: "#ea580c", bg: "#fff7ed",
    note: "El texto es mas uniforme y predecible de lo habitual. Conversar con el autor antes de concluir nada.",
    recommendations: [
      "Verificar si el autor utilizó ChatGPT, Claude u otro asistente",
      "Comparar con trabajos anteriores del mismo autor",
      "Realizar cuestionamiento oral sobre el contenido y argumentos",
      "Revisar si hay exceso de formalismo o tonalidad atípica"
    ] },
  { max: 101, id: "likely", label: "Compatible con generacion por IA",
    color: "#dc2626", bg: "#fef2f2",
    note: "Predictibilidad alta y variacion baja, patron caracteristico de texto generado. Sigue requiriendo verificacion humana.",
    recommendations: [
      "Solicitar al autor que reescriba las secciones clave del trabajo",
      "Realizar entrevista para verificar comprension profunda del contenido",
      "Comparar patrones con trabajos previos del estudiante",
      "Si la evidencia es concluyente, solicitar trabajo completamente nuevo",
      "Recordar que por sí solo no constituye prueba legal, pero justifica investigacion adicional"
    ] },
];

/**
 * Estimate whether a text was machine-generated.
 *
 * @param {string} text
 * @returns {Promise<object>} Score, band, per-signal detail and caveats.
 */
export async function detectAiText(text) {
  const sentences = sentencesOf(text);
  const words = text.split(/\s+/).filter(Boolean).length;

  if (words < 120) {
    return {
      score: null,
      band: "insufficient",
      label: "Texto insuficiente",
      note: "Se requieren al menos 120 palabras para cualquier estimacion.",
      signals: [],
      words,
    };
  }

  const model = await modelSignals(text);

  // Calibration points are the endpoints of each ramp: the first value is
  // typical of human writing, the second of generated text.
  const candidates = [
    {
      key: "perplexity",
      label: "Predictibilidad (perplejidad)",
      weight: 0.4,
      raw: model?.perplexity ?? null,
      value: ramp(model?.perplexity ?? null, 40, 8),
      explain: "Cuanto mejor predice el modelo el texto, mas probable es que lo haya generado un modelo.",
    },
    {
      key: "burstiness",
      label: "Variabilidad de predictibilidad",
      weight: 0.25,
      raw: model?.burstiness ?? null,
      value: ramp(model?.burstiness ?? null, 3.2, 1.4),
      explain: "La escritura humana alterna pasajes predecibles e imprevisibles; la generada es pareja.",
    },
    {
      key: "lengthVariation",
      label: "Variacion de longitud de oracion",
      weight: 0.15,
      raw: lengthVariation(sentences),
      value: ramp(lengthVariation(sentences), 0.62, 0.22),
      explain: "Los textos generados tienden a un ritmo de oracion constante.",
    },
    {
      key: "connectives",
      label: "Densidad de conectores",
      weight: 0.1,
      raw: connectiveDensity(sentences),
      value: ramp(connectiveDensity(sentences), 0.08, 0.42),
      explain: "Abrir muchas oraciones con 'ademas', 'sin embargo', 'en conclusion' es un habito de los modelos.",
    },
    {
      key: "lexicalDiversity",
      label: "Diversidad lexica",
      weight: 0.05,
      raw: typeTokenRatio(text),
      value: (() => {
        const ratio = typeTokenRatio(text);
        // Both extremes are informative, so this one is folded, not ramped.
        return ratio === null ? null : ramp(ratio, 0.62, 0.44);
      })(),
      explain: "El vocabulario generado suele ser amplio pero repetitivo en su estructura.",
    },
    {
      key: "humanMarkers",
      label: "Marcas de voz personal",
      weight: 0.05,
      raw: humanMarkers(text),
      value: ramp(humanMarkers(text), 0.8, 0.1),
      explain: "Primera persona, incisos y digresiones son raros en texto generado sin instrucciones al respecto.",
    },
  ];

  const signals = candidates.filter((signal) => signal.value !== null);
  const totalWeight = signals.reduce((sum, signal) => sum + signal.weight, 0);

  if (totalWeight === 0) {
    return {
      score: null,
      band: "unavailable",
      label: "No evaluable",
      note: "No se pudo calcular ninguna senal sobre este texto.",
      signals: [],
      words,
    };
  }

  const score = Math.round(
    (signals.reduce((sum, signal) => sum + signal.value * signal.weight, 0) / totalWeight) * 100
  );

  const band = BANDS.find((entry) => score < entry.max) ?? BANDS[BANDS.length - 1];

  // Without the language model only stylometry remains, which is markedly
  // weaker; the caller is told so rather than being handed a bare number.
  const modelUsed = Boolean(model);
  const confidence = !modelUsed ? "baja" : words < 300 ? "media" : "alta";

  return {
    score,
    band: band.id,
    label: band.label,
    color: band.color,
    bg: band.bg,
    note: band.note,
    recommendations: band.recommendations ?? [],
    confidence,
    modelUsed,
    windowsScored: model?.windows ?? 0,
    words,
    signals: signals.map(({ key, label, value, raw, explain }) => ({
      key,
      label,
      contribution: Math.round(value * 100),
      measured: raw === null ? null : Number(raw.toFixed(3)),
      explain,
    })),
    caveat:
      "Esta estimacion es probabilistica y no constituye prueba. Los detectores de IA " +
      "producen falsos positivos, con mayor frecuencia en escritura academica formal y " +
      "en autores que no escriben en su lengua materna. Uselo para iniciar una " +
      "conversacion con el autor, nunca como fundamento unico de una sancion.",
  };
}

// ---------------------------------------------------------------------------
// Per-passage estimate
//
// `detectAiText` above answers "how does this document read as a whole", and
// that is the number that belongs in a conversation with an author. It cannot
// say *where*, because it samples eight windows scattered through the text and
// pools them: there is no per-position value left to draw with.
//
// Marking the author's own PDF needs one, so this section scores contiguous
// blocks whose character offsets we chose ourselves and therefore know exactly.
// The trade is real and is printed in the report rather than hidden: a block
// carries a fraction of the evidence a whole document does, so its estimate is
// markedly noisier. It orients a reader's attention. It does not attribute a
// paragraph.
// ---------------------------------------------------------------------------

/** Below this a block has too little signal to score; it goes unmarked. */
const BLOCK_MIN_TOKENS = 48;

/** Target block size. Large enough to be meaningful, small enough to localise. */
const BLOCK_TARGET_WORDS = 90;

/** Ceiling on model calls per document, so a thesis cannot run unbounded. */
const MAX_BLOCKS = 60;

/** Bands used to colour a block. Deliberately coarser than the document bands. */
const PASSAGE_BANDS = [
  { max: 55, id: "inconclusive", color: "#64748b" },
  { max: 75, id: "possible", color: "#a16207" },
  { max: 101, id: "likely", color: "#c2410c" },
];

/** Under this length, a line with no sentence punctuation is a heading. */
const PROSE_LINE_CHARS = 70;

/**
 * The stretches of the document that are actually prose.
 *
 * A thesis is not prose end to end. The cover page carries the university, the
 * faculty, the title, the author, the year; every page repeats a running
 * header; chapters open with a numbered heading. None of it is written in the
 * sense this estimate measures — there is no rhythm to be uniform, no sentence
 * length to vary — and scoring it produces a number about typography.
 *
 * That is not a hypothetical. The first version of this marked "66% · posible
 * asistencia de IA" across a test document's cover page, because the cover ran
 * into the opening paragraph with no sentence boundary between them to split
 * on. A student would have opened that report and seen their university's name
 * flagged as machine-written.
 *
 * The rule is deliberately mechanical rather than clever: a line is prose when
 * it ends a sentence, or when it is long enough to be a wrapped one. A cover
 * line, a running header and a chapter title all fail both tests; a wrapped
 * body line passes the second and the last line of a paragraph passes the
 * first. Colons do not count as sentence ends, or "CAPITULO I: EL PROBLEMA"
 * would read as prose.
 *
 * @returns {Array<{start: number, end: number}>} Contiguous prose regions.
 */
function proseRegions(text) {
  const regions = [];
  let open = null;
  let offset = 0;

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    const isProse = trimmed.length >= PROSE_LINE_CHARS || /[.!?]["'”’)\]]*$/.test(trimmed);

    if (isProse) {
      if (!open) open = { start: offset, end: offset + line.length };
      else open.end = offset + line.length;
    } else if (open) {
      regions.push(open);
      open = null;
    }

    offset += line.length + 1; // el "\n" que split() consumió
  }

  if (open) regions.push(open);
  return regions;
}

/**
 * Sentence boundaries inside one region, as absolute offsets.
 *
 * `sentencesOf` cannot be reused: it splits and trims, and both operations
 * discard the positions this needs. Offsets index the exact string that was
 * passed in — the same string the PDF layout was extracted from — because an
 * off-by-one would shift every highlight on the page.
 */
function sentenceSpans(text, from, to) {
  const spans = [];
  const boundary = /[.!?]["'”’)\]]*\s+/g;
  boundary.lastIndex = from;
  let cursor = from;
  let match;

  while ((match = boundary.exec(text)) !== null && match.index < to) {
    const end = Math.min(to, match.index + match[0].length);
    if (end > cursor) spans.push({ start: cursor, end });
    cursor = end;
  }

  if (cursor < to) spans.push({ start: cursor, end: to });
  return spans;
}

/**
 * Group sentences into blocks of roughly `BLOCK_TARGET_WORDS`.
 *
 * Blocks never cross a region boundary, so a mark cannot span the gap where a
 * heading was skipped and shade it on the way past.
 *
 * When a document would exceed `MAX_BLOCKS`, the target grows instead of the
 * tail being dropped: a truncated pass would leave the last chapters silently
 * unmarked, which reads as "nothing found there" rather than "not examined".
 *
 * @returns {Array<{start: number, end: number}>}
 */
function blockSpans(text) {
  const regions = proseRegions(text);
  if (regions.length === 0) return [];

  const totalWords = regions.reduce(
    (sum, region) => sum + text.slice(region.start, region.end).split(/\s+/).filter(Boolean).length,
    0
  );
  const target = Math.max(BLOCK_TARGET_WORDS, Math.ceil(totalWords / MAX_BLOCKS));

  const blocks = [];

  for (const region of regions) {
    let open = null;
    let words = 0;

    for (const sentence of sentenceSpans(text, region.start, region.end)) {
      if (!open) open = { start: sentence.start, end: sentence.end };
      else open.end = sentence.end;

      words += text.slice(sentence.start, sentence.end).split(/\s+/).filter(Boolean).length;

      if (words >= target) {
        blocks.push(open);
        open = null;
        words = 0;
      }
    }

    // A short remainder is folded into the previous block of the same region
    // rather than scored on its own, where it would be noise dressed as a
    // finding. With no such block it is dropped for the same reason.
    if (open) {
      const previous = blocks[blocks.length - 1];
      if (words >= target / 2) blocks.push(open);
      else if (previous && previous.end === open.start) previous.end = open.end;
    }
  }

  return blocks;
}

/** Perplexity and burstiness for one block, or null when it is too short. */
async function blockSignals(loaded, text) {
  const { tokenizer, model } = loaded;

  const encoded = await tokenizer(text);
  const ids = Array.from(encoded.input_ids.data).slice(0, WINDOW_TOKENS * 2);
  if (ids.length < BLOCK_MIN_TOKENS) return null;

  const input = {
    input_ids: new (encoded.input_ids.constructor)(
      "int64",
      BigInt64Array.from(ids.map((id) => BigInt(id))),
      [1, ids.length]
    ),
    attention_mask: new (encoded.input_ids.constructor)(
      "int64",
      BigInt64Array.from(ids.map(() => 1n)),
      [1, ids.length]
    ),
  };

  const output = await model(input);
  const logProbs = tokenLogProbs(output.logits, ids);
  if (logProbs.length < 20) return null;

  const { mean, sd } = statistics(logProbs);
  return { perplexity: Math.exp(-mean), burstiness: sd };
}

/**
 * Locate the passages that read as machine-written.
 *
 * Only the two model signals are used. The stylometric ones in `detectAiText`
 * — sentence-length variation, connective density, lexical diversity — are
 * distribution statistics that need a few hundred words before they mean
 * anything; computing them over ninety would manufacture precision.
 *
 * Returns only blocks above the "inconclusive" floor. Marking a whole document
 * in grey because every block scored 40% would tell a reader nothing and would
 * make the page unreadable underneath.
 *
 * @param {string} text The exact string the PDF layout was extracted from.
 * @returns {Promise<Array<{textStart, textEnd, score, band, color, label}>>}
 */
export async function detectAiPassages(text) {
  const loaded = await getModel();
  if (!loaded) return [];

  const blocks = blockSpans(text);
  const passages = [];

  for (const block of blocks) {
    let signals;
    try {
      signals = await blockSignals(loaded, text.slice(block.start, block.end));
    } catch (error) {
      // One block failing is not a reason to lose the other fifty-nine.
      console.warn(`[ai-detect] block scoring failed: ${error?.message ?? error}`);
      continue;
    }
    if (!signals) continue;

    // The same ramps and relative weights as the document-level estimate, with
    // the stylometric terms removed and the remaining two renormalised.
    const perplexity = ramp(signals.perplexity, 40, 8);
    const burstiness = ramp(signals.burstiness, 3.2, 1.4);
    if (perplexity === null || burstiness === null) continue;

    const score = Math.round(((perplexity * 0.4 + burstiness * 0.25) / 0.65) * 100);
    if (score < PASSAGE_BANDS[0].max) continue;

    const band = PASSAGE_BANDS.find((entry) => score < entry.max) ?? PASSAGE_BANDS.at(-1);

    passages.push({
      textStart: block.start,
      textEnd: block.end,
      score,
      band: band.id,
      color: band.color,
      label: `${score}%`,
    });
  }

  return passages;
}
