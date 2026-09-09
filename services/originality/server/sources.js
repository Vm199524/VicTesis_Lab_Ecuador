/**
 * Source discovery.
 *
 * A provider returns candidates shaped as { url, title, content? }. When a
 * provider can supply the source text directly from its API (Wikipedia), it
 * does — that text is authoritative and needs no HTML scraping, which is the
 * fragile part of the pipeline.
 *
 * Providers are independent: one being blocked, rate-limited or restructured
 * must never sink a check. Every provider failure is swallowed and logged once.
 */

import { buildQueries } from "./text.js";
import {
  searchCore,
  searchArxiv,
  searchDoaj,
  searchSemanticScholar,
  searchEuropePmc,
  enrichWithUnpaywall,
  availableOaProviders,
} from "./providers-oa.js";
import { searchCorpus, corpusVersion } from "./corpus.js";

/** APIs want to know who is calling; several return 429 to generic browser UAs. */
const BOT_UA =
  "PlagiarismChecker/1.0 (open-source academic integrity tool; +https://github.com/Free-Turnitin-Plagiarism-Checker)";

/** HTML endpoints expect a browser. */
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * Optional contact address. CrossRef and OpenAlex route requests carrying one
 * into a faster, more permissive pool.
 */
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "";

/** Optional paid web-search backends, used only when a key is configured. */
const SERPER_API_KEY = process.env.SERPER_API_KEY || "";
const BRAVE_API_KEY = process.env.BRAVE_API_KEY || "";

const TIMEOUT_MS = 8_000;

/** Report each provider's first failure, then stay quiet to avoid log spam. */
const reportedFailures = new Set();
function reportFailure(provider, error) {
  if (reportedFailures.has(provider)) return;
  reportedFailures.add(provider);
  const reason = error?.cause?.code || error?.name || error?.message;
  console.warn(`[sources] ${provider} unavailable (${reason}) — continuing without it.`);
}

async function getJsonOnce(url, userAgent, extraHeaders) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": userAgent, Accept: "application/json", ...extraHeaders },
      signal: controller.signal,
    });
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * A provider that drops one request out of several does not merely lose that
 * source: it changes the reported index, because a passage with no candidates
 * scores zero and drags the document average with it. Retrying the transient
 * statuses is what keeps two runs of the same document comparable.
 */
async function getJson(url, userAgent = BOT_UA, extraHeaders = {}) {
  try {
    return await getJsonOnce(url, userAgent, extraHeaders);
  } catch (error) {
    const transient = error.status === 429 || error.status >= 500 || error.name === "AbortError";
    if (!transient) throw error;

    await new Promise((resolve) => setTimeout(resolve, 700));
    return getJsonOnce(url, userAgent, extraHeaders);
  }
}

/**
 * Passage-level result cache.
 *
 * Overlapping passages issue near-identical queries, and a re-run of the same
 * document repeats them exactly. Caching the merged candidate list cuts most of
 * the outbound traffic and removes the run-to-run variance that comes from a
 * provider answering one time and rate-limiting the next.
 */
const queryCache = new Map();
const QUERY_CACHE_MAX = 400;
const QUERY_CACHE_TTL_MS = Number(process.env.QUERY_CACHE_TTL_MS) || 15 * 60_000;

function queryCacheGet(key) {
  const entry = queryCache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.at > QUERY_CACHE_TTL_MS) {
    queryCache.delete(key);
    return null;
  }

  queryCache.delete(key);
  queryCache.set(key, entry);
  return entry.value;
}

function queryCacheSet(key, value) {
  if (queryCache.size >= QUERY_CACHE_MAX) {
    queryCache.delete(queryCache.keys().next().value);
  }
  queryCache.set(key, { at: Date.now(), value });
}

// ---------------------------------------------------------------------------
// Wikipedia — search, then pull each article's plain text from the API.
// ---------------------------------------------------------------------------

/**
 * Requesting extracts for several pages in one call makes MediaWiki silently
 * return empty extracts for the largest articles, so each article is fetched
 * on its own.
 */
async function wikipediaExtract(lang, title) {
  const url =
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json` +
    `&prop=extracts&explaintext=1&redirects=1&titles=${encodeURIComponent(title)}`;

  const data = await getJson(url);
  const page = Object.values(data.query?.pages ?? {})[0];
  return page?.extract ?? "";
}

async function wikipediaSearchTitles(lang, searchTerm, limit) {
  const url =
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&list=search` +
    `&srlimit=${limit}&srsearch=${encodeURIComponent(searchTerm)}`;

  const data = await getJson(url);
  return (data.query?.search ?? []).map((hit) => hit.title);
}

async function searchWikipedia(query, lang) {
  const { phrase, keywords } = buildQueries(query);

  // The quoted phrase is precise but brittle; the keyword query backs it up.
  const [exact, broad] = await Promise.all([
    wikipediaSearchTitles(lang, `"${phrase}"`, 2).catch(() => []),
    wikipediaSearchTitles(lang, keywords, 3).catch(() => []),
  ]);

  const titles = [...new Set([...exact, ...broad])].slice(0, 4);
  const hits = titles.map((title) => ({ title }));

  const candidates = await Promise.all(
    hits.map(async (hit) => {
      let content = "";
      try {
        content = await wikipediaExtract(lang, hit.title);
      } catch {
        // Fall back to fetching the article page like any other URL.
      }
      return {
        url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(hit.title.replace(/ /g, "_"))}`,
        title: hit.title,
        content,
      };
    })
  );

  return candidates;
}

// ---------------------------------------------------------------------------
// Academic indexes
// ---------------------------------------------------------------------------

/** CrossRef: DOI metadata. Returns landing URLs, which often sit behind paywalls. */
async function searchCrossRef(query) {
  const mailto = CONTACT_EMAIL ? `&mailto=${encodeURIComponent(CONTACT_EMAIL)}` : "";
  const url =
    `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(buildQueries(query).keywords)}` +
    `&rows=4&select=URL,title,abstract,DOI${mailto}`;

  const data = await getJson(url);

  return (data.message?.items ?? [])
    .filter((item) => item.URL)
    .map((item) => ({
      url: item.URL,
      title: item.title?.[0] ?? "",
      // CrossRef abstracts are JATS XML when present; strip the tags.
      content: item.abstract ? item.abstract.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "",
      // Carried so Unpaywall can swap the paywalled landing page for an open copy.
      doi: item.DOI ?? "",
      provider: "crossref",
    }));
}

/**
 * OpenAlex. As of 2025 the free tier carries a daily budget and answers 429
 * once it is spent, so this is strictly best-effort.
 */
async function searchOpenAlex(query) {
  const mailto = CONTACT_EMAIL ? `&mailto=${encodeURIComponent(CONTACT_EMAIL)}` : "";
  const url =
    `https://api.openalex.org/works?search=${encodeURIComponent(buildQueries(query).keywords)}` +
    `&per-page=4&select=id,doi,title,primary_location${mailto}`;

  const data = await getJson(url);

  return (data.results ?? [])
    .map((work) => {
      const location = work.primary_location ?? {};
      const url = location.pdf_url || location.landing_page_url || work.doi;
      return url ? { url, title: work.title ?? "", content: "" } : null;
    })
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// General web search
// ---------------------------------------------------------------------------

/**
 * DuckDuckGo's HTML endpoint. Free and keyless, but frequently unreachable —
 * it blocks datacenter ranges and some networks drop it entirely.
 */
async function searchDuckDuckGo(query, { exact = false } = {}) {
  const { phrase, keywords } = buildQueries(query);
  const term = exact ? `"${phrase}"` : keywords;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let html;
  try {
    const response = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(term)}`,
      { headers: { "User-Agent": BROWSER_UA }, signal: controller.signal }
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    html = await response.text();
  } finally {
    clearTimeout(timer);
  }

  const urls = [];
  for (const match of html.matchAll(/uddg=([^"&]+)/g)) {
    try {
      urls.push(decodeURIComponent(match[1]));
    } catch {
      // Malformed percent-encoding in a redirect; skip it.
    }
  }
  for (const match of html.matchAll(/class="result__a"[^>]*href="(https?:\/\/[^"]+)"/g)) {
    urls.push(match[1]);
  }

  return urls.map((url) => ({ url, title: "", content: "" }));
}

/** Serper.dev — Google results via API. Used only when SERPER_API_KEY is set. */
async function searchSerper(query) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ q: `"${buildQueries(query).phrase}"`, num: 8 }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    return (data.organic ?? []).map((hit) => ({
      url: hit.link,
      title: hit.title ?? "",
      // The snippet alone is too short to score; the page is fetched instead.
      content: "",
    }));
  } finally {
    clearTimeout(timer);
  }
}

/** Brave Search API. Used only when BRAVE_API_KEY is set. */
async function searchBrave(query) {
  const data = await getJson(
    `https://api.search.brave.com/res/v1/web/search?count=8&q=${encodeURIComponent(`"${buildQueries(query).phrase}"`)}`,
    BOT_UA,
    { "X-Subscription-Token": BRAVE_API_KEY }
  );

  return (data.web?.results ?? []).map((hit) => ({
    url: hit.url,
    title: hit.title ?? "",
    content: "",
  }));
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

const BLOCKED_HOSTS = [
  "duckduckgo.com", "google.com", "bing.com", "youtube.com", "facebook.com",
  "twitter.com", "x.com", "instagram.com", "pinterest.com", "linkedin.com",
  "tiktok.com", "reddit.com/login",
];

function isUsableUrl(url) {
  // Locally held documents have no public address. They are identified by a
  // corpus:// reference, which is resolved from the database rather than
  // fetched, so the http-only rule below must not discard them.
  if (url.startsWith("corpus://")) return true;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    if (BLOCKED_HOSTS.some((host) => parsed.hostname.endsWith(host))) return false;
    if (/\.(zip|rar|exe|dmg|mp4|mp3|jpg|jpeg|png|gif|svg|css|js)$/i.test(parsed.pathname)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Which providers are configured. Surfaced through /api/limits for the UI. */
export function activeProviders() {
  return [
    "corpus",
    "wikipedia-en",
    "wikipedia-es",
    ...availableOaProviders(),
    "crossref",
    "openalex",
    "duckduckgo",
    ...(SERPER_API_KEY ? ["serper"] : []),
    ...(BRAVE_API_KEY ? ["brave"] : []),
  ];
}

/**
 * Find candidate sources for a passage.
 *
 * Results are interleaved round-robin across providers rather than
 * concatenated, so a provider returning many hits cannot crowd out the others.
 *
 * @param {string} query
 * @param {number} limit Maximum candidates to return.
 * @returns {Promise<Array<{url: string, title: string, content: string}>>}
 */
export async function findSources(query, limit = 8, options = {}) {
  // Built once and shared: every provider needs the same two query forms, and
  // re-deriving them per provider was measurable on long documents.
  const queries = buildQueries(query);

  // Keyed on the queries actually issued, not the passage: two overlapping
  // passages that reduce to the same phrase and keywords have the same answer.
  // corpusVersion() is part of the key so that indexing or deleting a document
  // invalidates every cached answer that could have named it.
  const cacheKey =
    `${corpusVersion()}|${limit}|${queries.phrase}|${queries.keywords}|` +
    `${options.excludeChecksum ?? ""}`;
  const cached = queryCacheGet(cacheKey);
  if (cached) return cached;

  const providers = [
    // The local corpus answers from disk in microseconds and covers the one
    // case no web index can: unpublished work held by the institution.
    ["corpus", async () => searchCorpus(query, 3, { excludeChecksum: options.excludeChecksum })],
    ["wikipedia-en", () => searchWikipedia(query, "en")],
    ["wikipedia-es", () => searchWikipedia(query, "es")],
    // Full-text providers first: these are the ones that can actually be scored.
    ["core", () => searchCore(queries)],
    ["semanticscholar", () => searchSemanticScholar(queries)],
    ["arxiv", () => searchArxiv(queries)],
    ["doaj", () => searchDoaj(queries)],
    ["europepmc", () => searchEuropePmc(queries)],
    ["crossref", () => searchCrossRef(query)],
    ["openalex", () => searchOpenAlex(query)],
    ["duckduckgo-exact", () => searchDuckDuckGo(query, { exact: true })],
    ["duckduckgo", () => searchDuckDuckGo(query)],
  ];

  if (SERPER_API_KEY) providers.unshift(["serper", () => searchSerper(query)]);
  if (BRAVE_API_KEY) providers.unshift(["brave", () => searchBrave(query)]);

  // Run providers in phases to reduce latency:
  // Phase 1: corpus + wikipedia (instant, <100ms)
  // Phase 2: academic indexes (1-2s)
  // Phase 3: web search (slow, 8s timeout)
  // Once we have enough candidates, don't wait for slow providers.

  const fastProviders = [0, 1, 2]; // corpus, wikipedia-en, wikipedia-es
  const academicProviders = [3, 4, 5, 6, 7, 8, 9]; // core, semantic, arxiv, doaj, europepmc, crossref, openalex
  const slowProviders = [10, 11]; // duckduckgo variants

  const runProvider = async (name, run) => {
    try {
      return await run();
    } catch (error) {
      reportFailure(name, error);
      return [];
    }
  };

  // Phase 1: Start fast providers (should complete <100ms)
  const fastResults = await Promise.all(
    fastProviders.map((i) => runProvider(providers[i][0], providers[i][1]))
  );

  let lists = Array(providers.length).fill([]);
  fastProviders.forEach((i, idx) => {
    const usable = fastResults[idx].filter((c) => c && isUsableUrl(c.url));
    if (usable.length > 0) providersSeen.add(providers[i][0]);
    lists[i] = usable;
  });

  // Count candidates we already have
  const fastCandidateCount = lists.reduce((sum, list) => sum + list.length, 0);

  // Phase 2: Run academic providers in parallel, with timeout
  // If we already have enough, skip this phase
  if (fastCandidateCount < 6) {
    const academicPromise = Promise.all(
      academicProviders.map((i) => runProvider(providers[i][0], providers[i][1]))
    );

    // Wait max 6 seconds for academic results
    const academicResults = await Promise.race([
      academicPromise,
      new Promise((resolve) =>
        setTimeout(
          () => resolve(academicProviders.map(() => [])),
          6000
        )
      ),
    ]).catch(() => academicProviders.map(() => []));

    academicProviders.forEach((i, idx) => {
      const usable = academicResults[idx]?.filter((c) => c && isUsableUrl(c.url)) || [];
      if (usable.length > 0) providersSeen.add(providers[i][0]);
      lists[i] = usable;
    });
  }

  // Phase 3: Slow web search only if we have less than 8 candidates total
  const totalCandidates = lists.reduce((sum, list) => sum + list.length, 0);
  if (totalCandidates < 8) {
    const slowPromise = Promise.all(
      slowProviders.map((i) => runProvider(providers[i][0], providers[i][1]))
    );

    // Wait max 3 seconds for web search (quick fail if providers are blocked)
    const slowResults = await Promise.race([
      slowPromise,
      new Promise((resolve) =>
        setTimeout(() => resolve(slowProviders.map(() => [])), 3000)
      ),
    ]).catch(() => slowProviders.map(() => []));

    slowProviders.forEach((i, idx) => {
      const usable = slowResults[idx]?.filter((c) => c && isUsableUrl(c.url)) || [];
      if (usable.length > 0) providersSeen.add(providers[i][0]);
      lists[i] = usable;
    });
  }

  // Round-robin merge with deduplication.
  const seen = new Set();
  const merged = [];
  const maxLength = Math.max(0, ...lists.map((list) => list.length));

  for (let round = 0; round < maxLength && merged.length < limit; round++) {
    for (const list of lists) {
      if (merged.length >= limit) break;
      const candidate = list[round];
      if (!candidate) continue;

      const key = candidate.url.split("#")[0].replace(/\/$/, "");
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(candidate);
    }
  }

  // A DOI that resolves to a publisher paywall yields no text to compare
  // against. Unpaywall redirects those to a legal open copy where one exists.
  try {
    await enrichWithUnpaywall(merged);
  } catch {
    // Enrichment is an improvement, never a precondition.
  }

  queryCacheSet(cacheKey, merged);
  return merged;
}

/** Providers that returned at least one usable candidate, for the report. */
const providersSeen = new Set();

export function providersUsed() {
  return [...providersSeen].sort();
}

export function resetProvidersUsed() {
  providersSeen.clear();
}
