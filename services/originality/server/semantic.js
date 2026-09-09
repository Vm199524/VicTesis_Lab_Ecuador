/**
 * Dense semantic similarity.
 *
 * The lexical metrics (containment, winnowing, TF-IDF) all fail the same way:
 * they compare surface forms. Replacing "the results demonstrate" with "the
 * evidence indicates" preserves the meaning and collapses every lexical score
 * to near zero — which is exactly the rewriting a plagiarism checker exists to
 * catch.
 *
 * A sentence-embedding model maps text to a vector whose geometry reflects
 * meaning rather than wording, so the two phrasings land close together. The
 * model is multilingual, which matters here: submissions and sources mix
 * Spanish and English freely.
 *
 * Everything in this module degrades to "no signal" rather than throwing. The
 * model weights are downloaded on first use, and a checker that cannot reach
 * the network must still produce a lexical report.
 */

import { env, pipeline } from "@huggingface/transformers";

/**
 * 384-dimension multilingual paraphrase model (~120 MB quantized). Chosen over
 * a larger encoder because a passage-by-source comparison runs it hundreds of
 * times per document, so throughput on CPU dominates the quality difference.
 */
const MODEL_ID = process.env.SEMANTIC_MODEL || "Xenova/paraphrase-multilingual-MiniLM-L12-v2";

const ENABLED = process.env.SEMANTIC_DISABLED !== "1";

/** Words per window when a source page is split for comparison. */
const WINDOW_WORDS = 48;
const WINDOW_STRIDE = 32;
/** Cap on windows scored per source: a long thesis would otherwise dominate. */
const MAX_WINDOWS = 24;

// Cache weights next to the project so a restart does not re-download them.
env.cacheDir = process.env.TRANSFORMERS_CACHE || "./.models";
env.allowLocalModels = true;

let extractorPromise = null;
let unavailableReason = null;

/**
 * Load the embedding model once.
 * Returns null (and records why) when the model cannot be obtained.
 */
async function getExtractor() {
  if (!ENABLED) return null;
  if (unavailableReason) return null;

  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", MODEL_ID, { dtype: "q8" }).catch((error) => {
      unavailableReason = error?.message ?? String(error);
      console.warn(
        `[semantic] embedding model unavailable (${unavailableReason}) — ` +
          "continuing with lexical metrics only."
      );
      return null;
    });
  }

  return extractorPromise;
}

/** Whether semantic scoring is currently usable. */
export async function semanticReady() {
  return Boolean(await getExtractor());
}

export function semanticStatus() {
  if (!ENABLED) return { enabled: false, reason: "disabled by configuration" };
  if (unavailableReason) return { enabled: false, reason: unavailableReason };
  return { enabled: true, model: MODEL_ID };
}

/**
 * Embed a batch of strings into L2-normalized vectors.
 *
 * @param {string[]} texts
 * @returns {Promise<Float32Array[] | null>}
 */
export async function embed(texts) {
  const extractor = await getExtractor();
  if (!extractor || texts.length === 0) return null;

  try {
    // Mean pooling over tokens, then normalize, so a dot product is cosine.
    const output = await extractor(texts, { pooling: "mean", normalize: true });
    return output.tolist().map((vector) => Float32Array.from(vector));
  } catch (error) {
    unavailableReason = error?.message ?? String(error);
    return null;
  }
}

/** Dot product of two normalized vectors, i.e. their cosine similarity. */
export function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

/**
 * Split a source document into overlapping windows.
 *
 * A passage is compared against a whole page, and averaging a page-level
 * embedding would dilute a single copied paragraph into the surrounding text.
 * Windows preserve the local match.
 */
export function windows(text, { size = WINDOW_WORDS, stride = WINDOW_STRIDE, max = MAX_WINDOWS, anchor = "" } = {}) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= size) return words.length >= 6 ? [words.join(" ")] : [];

  const all = [];
  for (let i = 0; i + 6 <= words.length; i += stride) {
    all.push(words.slice(i, i + size).join(" "));
    if (i + size >= words.length) break;
  }

  if (all.length <= max) return all;

  const chosen = new Set();

  // Half the budget goes to windows that share vocabulary with the passage.
  // That finds verbatim and lightly-edited reuse cheaply. It cannot be the
  // only criterion: a genuine paraphrase shares almost no vocabulary by
  // definition, so selecting on shared words would discard exactly the case
  // this module exists to catch.
  if (anchor) {
    const wanted = new Set(tokensOf(anchor));

    if (wanted.size > 0) {
      const ranked = all
        .map((window, index) => {
          let hits = 0;
          for (const token of new Set(tokensOf(window))) if (wanted.has(token)) hits++;
          return { index, hits };
        })
        .filter((entry) => entry.hits > 0)
        .sort((a, b) => b.hits - a.hits);

      for (const entry of ranked.slice(0, Math.floor(max / 2))) chosen.add(entry.index);
    }
  }

  // The rest sweeps the document evenly, so a rewritten paragraph anywhere in
  // a long source still falls inside the sample.
  const remaining = max - chosen.size;
  if (remaining > 0) {
    const step = all.length / remaining;
    for (let i = 0; i < remaining; i++) chosen.add(Math.min(all.length - 1, Math.floor(i * step)));
  }

  return [...chosen].sort((a, b) => a - b).map((index) => all[index]);
}

/** Content-word tokens used for the lexical half of window selection. */
function tokensOf(text) {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .match(/[a-z0-9]{4,}/g) ?? []
  );
}

/**
 * Best semantic similarity between a passage and any window of a source.
 *
 * @param {string} passage
 * @param {string[]} sourceTexts One entry per candidate source.
 * @returns {Promise<number[]>} Similarity in 0..1, one per source (0 when unavailable).
 */
export async function scorePassageAgainstSources(passage, sourceTexts) {
  const zeros = sourceTexts.map(() => 0);

  const extractor = await getExtractor();
  if (!extractor) return zeros;

  // Windows are sized from the passage: comparing a 20-word passage against a
  // 48-word window buries the match in surrounding text, because mean pooling
  // averages the copied sentence together with everything around it.
  const passageWords = passage.split(/\s+/).filter(Boolean).length;
  const size = Math.max(20, Math.min(64, Math.round(passageWords * 1.4)));
  const options = { size, stride: Math.max(10, Math.round(size / 2)), anchor: passage };

  // One batch for the passage and every window of every source: the model call
  // has fixed overhead, so batching is substantially faster than per-source
  // invocation.
  const perSource = sourceTexts.map((text) => windows(text ?? "", options));
  const flat = perSource.flat();
  if (flat.length === 0) return zeros;

  const vectors = await embed([passage, ...flat]);
  if (!vectors) return zeros;

  const passageVector = vectors[0];

  // Stage one: locate the most similar window per source.
  const coarse = [];
  let offset = 1;

  for (const chunks of perSource) {
    let best = 0;
    let bestWindow = "";
    for (let i = 0; i < chunks.length; i++) {
      const similarity = cosine(passageVector, vectors[offset + i]);
      if (similarity > best) {
        best = similarity;
        bestWindow = chunks[i];
      }
    }
    offset += chunks.length;
    coarse.push({ best, bestWindow });
  }

  // Stage two: a window is wider than the passage, so surrounding text drags
  // the pooled vector down and understates a real match. Re-scan the winning
  // window at passage granularity. Only promising windows are refined, which
  // keeps this to one extra batch over a handful of short strings.
  const refinable = coarse.filter((entry) => entry.best >= 0.18 && entry.bestWindow);

  if (refinable.length > 0) {
    const subPerEntry = refinable.map((entry) =>
      windows(entry.bestWindow, {
        size: Math.max(12, passageWords),
        stride: Math.max(5, Math.round(passageWords / 3)),
        max: 6,
      })
    );

    const subFlat = subPerEntry.flat();
    if (subFlat.length > 0) {
      const subVectors = await embed(subFlat);
      if (subVectors) {
        let subOffset = 0;
        refinable.forEach((entry, index) => {
          for (let i = 0; i < subPerEntry[index].length; i++) {
            const similarity = cosine(passageVector, subVectors[subOffset + i]);
            if (similarity > entry.best) entry.best = similarity;
          }
          subOffset += subPerEntry[index].length;
        });
      }
    }
  }

  const scores = [];

  for (const { best } of coarse) {

    // Calibrated against this model on real retrieved sources, not in the
    // abstract: an original passage measured against its own best-matching web
    // result peaks near 0.38, a deliberate paraphrase of a known source lands
    // around 0.67, and verbatim reuse exceeds 0.94. The floor sits above the
    // first of those, so topical resemblance alone contributes nothing --
    // otherwise every essay would score against the encyclopedia article on
    // its own subject.
    scores.push(Math.max(0, Math.min(1, (best - 0.45) / 0.35)));
  }

  return scores;
}
