/**
 * Plagiarism engine: source discovery, page retrieval and scoring.
 *
 * The public surface is `analyzeDocument`, which chunks a document, finds
 * candidate sources on the open web and in academic indexes, and scores each
 * chunk against them.
 */

import {
  tokenize,
  ngrams,
  containment,
  tfidfCosine,
  buildIdf,
  winnow,
  longestVerbatimRun,
  chunkText,
  stripCitations,
} from "./text.js";
import { findSources, activeProviders, providersUsed, resetProvidersUsed } from "./sources.js";
import { extractReadable } from "./readable.js";
import { extractDocumentText } from "./extract.js";
import { scorePassageAgainstSources, semanticStatus } from "./semantic.js";
import { checksumOf } from "./corpus.js";

export { semanticStatus };

export { activeProviders };

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export const LIMITS = {
  /** Hard ceiling on submitted text. ~20k words, roughly a 40-page paper. */
  maxChars: Number(process.env.MAX_CHARS) || 120_000,
  minChars: 100,
  /** Passages actually sent through source discovery. */
  maxChunks: Number(process.env.MAX_CHUNKS) || 120,
  /** Candidate URLs kept per passage. */
  maxSourcesPerChunk: 8,
  /** Characters retained from each fetched source page. */
  maxSourceChars: 20_000,
  /** A source PDF larger than this is skipped rather than parsed. */
  maxSourcePdfBytes: Number(process.env.MAX_SOURCE_PDF_BYTES) || 12 * 1024 * 1024,
  /** Parallel outbound HTTP requests. */
  concurrency: Number(process.env.FETCH_CONCURRENCY) || 10,
  fetchTimeoutMs: 5_000, // reduced from 8s: fail faster if a source is slow
};

/** Score above which a passage is reported as plagiarized. */
const PLAGIARISM_THRESHOLD = 0.5;
/** Score above which a source is worth listing as a partial match. */
const SOURCE_THRESHOLD = 0.15;
/**
 * Semantic similarity that warrants a reviewer's attention even when no
 * lexical evidence supports it. Set below the level at which `combineScores`
 * would let it move the index, which is the point: the reader is told what the
 * number deliberately excludes.
 */
const SEMANTIC_FLAG_THRESHOLD = 0.55;

// ---------------------------------------------------------------------------
// Concurrency + caching
// ---------------------------------------------------------------------------

/** Run `worker` over `items` with at most `limit` in flight. Order preserved. */
async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      try {
        results[index] = await worker(items[index], index);
      } catch (error) {
        results[index] = { error };
      }
    }
  });

  await Promise.all(runners);
  return results;
}

/**
 * Page cache. A source page is typically hit by several passages of the same
 * document, so caching removes most of the network cost of a long check.
 */
const pageCache = new Map();
const PAGE_CACHE_MAX = 500;

function cacheGet(url) {
  if (!pageCache.has(url)) return undefined;
  // Refresh recency for a rough LRU.
  const value = pageCache.get(url);
  pageCache.delete(url);
  pageCache.set(url, value);
  return value;
}

function cacheSet(url, value) {
  if (pageCache.size >= PAGE_CACHE_MAX) {
    pageCache.delete(pageCache.keys().next().value);
  }
  pageCache.set(url, value);
}

async function withTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LIMITS.fetchTimeoutMs);
  try {
    return await fetch(url, {
      ...options,
      headers: { "User-Agent": USER_AGENT, ...options.headers },
      signal: controller.signal,
      redirect: "follow",
    });
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Source discovery (see sources.js)
// ---------------------------------------------------------------------------

/** @deprecated Prefer `findSources`, which also returns titles and API-supplied text. */
export async function searchWeb(query) {
  const sources = await findSources(query, LIMITS.maxSourcesPerChunk);
  return sources.map((source) => source.url);
}

// ---------------------------------------------------------------------------
// Page retrieval
// ---------------------------------------------------------------------------

/** Fetch a URL and return its readable text, or "" on any failure. */
export async function fetchPageContent(url) {
  const cached = cacheGet(url);
  if (cached !== undefined) return cached;

  let text = "";
  try {
    const response = await withTimeout(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.8,es;q=0.6",
      },
    });

    if (response.ok) {
      const contentType = response.headers.get("content-type") ?? "";

      if (contentType.includes("html") || contentType.includes("text/plain")) {
        const html = await response.text();
        text = extractReadable(html, url).text.slice(0, LIMITS.maxSourceChars);
      } else if (contentType.includes("pdf")) {
        // Open-access providers resolve to PDFs far more often than to HTML,
        // so skipping them would discard the very sources most worth scoring.
        // The size guard keeps one scanned thesis from stalling the check.
        const length = Number(response.headers.get("content-length")) || 0;
        if (length === 0 || length <= LIMITS.maxSourcePdfBytes) {
          const buffer = Buffer.from(await response.arrayBuffer());
          if (buffer.length <= LIMITS.maxSourcePdfBytes) {
            const extracted = await extractDocumentText(buffer, "source.pdf");
            text = extracted.text.slice(0, LIMITS.maxSourceChars);
          }
        }
      }
    }
  } catch {
    // Timeout, DNS failure, TLS error — treat as "no content".
  }

  cacheSet(url, text);
  return text;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * Combine the metrics into a single 0..1 similarity.
 *
 * Containment leads because it is the reliable signal for verbatim reuse of a
 * short passage inside a long page. Cosine contributes a paraphrase signal but
 * is discounted, since topical overlap alone is not plagiarism.
 */
function combineScores({ contain4, contain7, cosine, fingerprint, runRatio, semantic }) {
  const verbatim = Math.max(contain4, fingerprint, runRatio);

  // Semantic similarity is the only signal that survives real rewriting, but it
  // also rises for two independent texts on the same subject -- an essay on
  // student dropout resembles the literature on student dropout without
  // borrowing a word from it. How far it is trusted therefore depends on
  // whether any lexical trace corroborates it.
  //
  // The bottom rung matters most: not one shared 4-gram, no shared fingerprint,
  // and no repeated pair of words means there is nothing tying this passage to
  // this source beyond subject matter. Rewriting from a source almost always
  // leaves residue -- a proper noun, a technical term, a figure -- so the
  // absence of all residue argues for coincidence, and the weight reflects it.
  // With no lexical trace at all, two readings remain and they look identical
  // to every metric here: a translated or fully rewritten source, and two
  // independent texts on one subject. What separates them is degree. Measured
  // on this model, an essay about student dropout matches the dropout
  // literature around 0.73-0.81, while the same sentence rendered in another
  // language exceeds 0.94. So uncorroborated similarity is ignored below that
  // gap and only counts above it, where coincidence stops being a plausible
  // explanation. Erring the other way would flag honest work for choosing a
  // well-studied topic.
  let paraphrase = 0.75 * cosine;

  if (contain4 > 0.05 || fingerprint > 0.05) {
    paraphrase = Math.max(paraphrase, semantic * 0.9);
  } else if (runRatio > 0.12) {
    paraphrase = Math.max(paraphrase, semantic * 0.7);
  } else {
    paraphrase = Math.max(paraphrase, Math.max(0, (semantic - 0.85) / 0.15) * 0.75);
  }

  // A long exact run is decisive on its own.
  if (contain7 > 0.35 || runRatio > 0.6) {
    return Math.min(1, Math.max(verbatim, 0.75));
  }

  return Math.min(1, Math.max(verbatim, paraphrase));
}

function scoreChunk(chunkTokens, sourceTokens, idf, semantic = 0) {
  if (chunkTokens.length < 4 || sourceTokens.length < 4) return null;

  const contain4 = containment(ngrams(chunkTokens, 4), ngrams(sourceTokens, 4));
  const contain7 = containment(ngrams(chunkTokens, 7), ngrams(sourceTokens, 7));
  const cosine = tfidfCosine(chunkTokens, sourceTokens, idf);
  const fingerprint = containment(winnow(chunkTokens), winnow(sourceTokens));
  const run = longestVerbatimRun(chunkTokens, sourceTokens);
  const runRatio = run / chunkTokens.length;

  return {
    similarity: combineScores({ contain4, contain7, cosine, fingerprint, runRatio, semantic }),
    metrics: {
      containment: Math.round(contain4 * 100),
      cosine: Math.round(cosine * 100),
      fingerprint: Math.round(fingerprint * 100),
      semantic: Math.round(semantic * 100),
      longestRun: run,
    },
  };
}

/**
 * Analyze a document end to end.
 *
 * @param {string} text
 * @param {{ excludeCitations?: boolean, onProgress?: (done: number, total: number) => void }} options
 */
export async function analyzeDocument(text, options = {}) {
  const { excludeCitations = false, onProgress } = options;

  const prepared = excludeCitations ? stripCitations(text) : text;
  const documentChecksum = checksumOf(text);

  // Which providers actually answered is part of the result: an index computed
  // while half the sources were rate-limited is not comparable to one computed
  // with all of them, and a reader of the report deserves to know which it is.
  resetProvidersUsed();
  const allChunks = chunkText(prepared);

  if (allChunks.length === 0) {
    throw new Error(
      "No analyzable passages found. The document may be too short or contain only fragments."
    );
  }

  // Over the budget, sample evenly across the document rather than truncating,
  // so the report still reflects the whole text.
  let chunks = allChunks;
  let sampled = false;
  if (allChunks.length > LIMITS.maxChunks) {
    const step = allChunks.length / LIMITS.maxChunks;
    chunks = Array.from({ length: LIMITS.maxChunks }, (_, i) => allChunks[Math.floor(i * step)]);
    sampled = true;
  }

  let completed = 0;

  const results = await pool(chunks, LIMITS.concurrency, async (chunk) => {
    const candidateSources = await findSources(chunk.text, LIMITS.maxSourcesPerChunk, {
      // Prevents a stored copy of this very document from matching itself when
      // the same text is submitted twice.
      excludeChecksum: documentChecksum,
    });

    // Providers that expose the source text through their API (Wikipedia) have
    // already supplied it; only the rest need an HTTP fetch and HTML cleanup.
    const pages = await pool(candidateSources, LIMITS.concurrency, async (source) => ({
      url: source.url,
      title: source.title,
      content: source.content
        ? source.content.slice(0, LIMITS.maxSourceChars)
        : await fetchPageContent(source.url),
    }));

    const chunkTokens = tokenize(chunk.text);
    const candidates = pages.filter((page) => page?.content && page.content.length > 200);

    // IDF is computed per passage over its own candidate set, so weighting
    // reflects the documents actually being compared.
    const tokenized = candidates.map((page) => ({ ...page, tokens: tokenize(page.content) }));
    const idf = buildIdf([chunkTokens, ...tokenized.map((page) => page.tokens)]);

    // Embeddings run once per passage over the whole candidate set, batched.
    // Returns zeros when the model is unavailable, which leaves the lexical
    // metrics in charge rather than failing the check.
    const semanticScores = await scorePassageAgainstSources(
      chunk.text,
      tokenized.map((page) => page.content)
    );

    let best = 0;
    let bestMetrics = null;
    const sources = [];

    // Passages whose meaning tracks a source without sharing its wording. They
    // are deliberately kept out of the index -- see combineScores -- because at
    // this level the evidence cannot separate a rewritten source from an
    // independent text on the same subject. Surfacing them separately lets a
    // reviewer apply the judgement the metrics cannot.
    const semanticFlags = [];

    for (const [index, page] of tokenized.entries()) {
      const scored = scoreChunk(chunkTokens, page.tokens, idf, semanticScores[index] ?? 0);
      if (!scored) continue;

      if (scored.similarity > best) {
        best = scored.similarity;
        bestMetrics = scored.metrics;
      }
      if (scored.similarity > SOURCE_THRESHOLD) {
        sources.push({
          url: page.url,
          similarity: Math.round(scored.similarity * 100),
          metrics: scored.metrics,
        });
      }

      const semantic = semanticScores[index] ?? 0;
      if (semantic >= SEMANTIC_FLAG_THRESHOLD && scored.similarity < PLAGIARISM_THRESHOLD) {
        semanticFlags.push({ url: page.url, semantic: Math.round(semantic * 100) });
      }
    }

    sources.sort((a, b) => b.similarity - a.similarity);
    completed++;
    onProgress?.(completed, chunks.length);

    semanticFlags.sort((a, b) => b.semantic - a.semantic);

    return {
      sentence: chunk.text,
      semanticFlags: semanticFlags.slice(0, 3),
      // Character offsets into the submitted text, so a report can highlight
      // the passage in place instead of re-searching for it.
      start: chunk.start,
      end: chunk.end,
      similarity: Math.round(best * 100),
      sources: sources.slice(0, 5),
      metrics: bestMetrics,
      isPlagiarized: best > PLAGIARISM_THRESHOLD,
    };
  });

  const valid = results.filter((result) => result && !result.error);
  if (valid.length === 0) {
    throw new Error("Analysis failed: no passage could be checked against any source.");
  }

  const plagiarized = valid.filter((result) => result.isPlagiarized);

  // Similarity index, in the sense Turnitin reports one: the share of the
  // document's words that matched a source. Each passage contributes its word
  // count scaled by how much of it matched, so a passage that is half copied
  // counts as half — a binary over/under threshold count would report 0% for a
  // document that is 45% copied throughout.
  const totalWords = valid.reduce((sum, r) => sum + r.sentence.split(/\s+/).length, 0);
  const copiedWords = valid.reduce(
    (sum, r) => sum + (r.sentence.split(/\s+/).length * r.similarity) / 100,
    0
  );

  return {
    overallScore: Math.round(
      valid.reduce((sum, r) => sum + r.similarity, 0) / valid.length
    ),
    plagiarismPercentage: totalWords > 0 ? Math.round((copiedWords / totalWords) * 100) : 0,
    totalSentences: valid.length,
    plagiarizedSentences: plagiarized.length,
    analyzedChunks: chunks.length,
    totalChunks: allChunks.length,
    sampled,
    excludeCitations,
    providers: providersUsed(),
    semanticAlerts: valid.filter((result) => (result.semanticFlags ?? []).length > 0).length,
    results: valid,
  };
}

// Retained for backwards compatibility with the previous module surface.
export {
  tokenize,
  containment,
  tfidfCosine,
  winnow,
} from "./text.js";

/** @deprecated Superseded by the metric set in `scoreChunk`. */
export function calculateSimilarity(text1, text2) {
  const a = tokenize(text1);
  const b = tokenize(text2);
  return tfidfCosine(a, b, buildIdf([a, b]));
}

/** @deprecated Use `containment(ngrams(a, n), ngrams(b, n))`. */
export function nGramSimilarity(text1, text2, n = 5) {
  return containment(ngrams(tokenize(text1), n), ngrams(tokenize(text2), n));
}
