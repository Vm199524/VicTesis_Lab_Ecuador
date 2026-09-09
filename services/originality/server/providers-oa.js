/**
 * Open-access providers that can supply the *body* of a document.
 *
 * The academic providers already wired into `sources.js` (CrossRef, OpenAlex)
 * return bibliographic metadata: a title, sometimes an abstract, and a landing
 * URL that is usually a paywall. Metadata cannot be compared against a
 * passage, which is why those providers contribute almost nothing to a score.
 *
 * Everything here is selected for one property: it leads to full text.
 */

const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "plagiarism-checker@example.org";
const CORE_API_KEY = process.env.CORE_API_KEY || "";
const S2_API_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY || "";

const UA = `PlagiarismChecker/1.0 (academic integrity tool; mailto:${CONTACT_EMAIL})`;
const TIMEOUT_MS = Number(process.env.PROVIDER_TIMEOUT_MS) || 9_000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestOnce(url, { headers = {}, method = "GET", body, accept = "application/json" }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method,
      body,
      headers: { "User-Agent": UA, Accept: accept, ...headers },
      signal: controller.signal,
    });
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status;
      error.retryAfter = Number(response.headers.get("retry-after")) || 0;
      throw error;
    }
    return accept.includes("json") ? await response.json() : await response.text();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Keyless academic APIs throttle aggressively, and a single 429 would
 * otherwise drop a provider for the whole check. Retries are limited to the
 * statuses that a later attempt can actually resolve.
 */
async function request(url, options = {}, attempts = 2) {
  let lastError;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await requestOnce(url, options);
    } catch (error) {
      lastError = error;
      const retriable = error.status === 429 || error.status === 503 || error.name === "AbortError";
      if (!retriable || attempt === attempts - 1) break;

      // Honour Retry-After when the server sends one, capped so a passage
      // cannot stall the whole analysis behind one slow provider.
      const wait = Math.min(error.retryAfter * 1000 || 900 * (attempt + 1), 3_000);
      await sleep(wait);
    }
  }

  throw lastError;
}

/** Abstracts arrive as JATS XML from several of these APIs. */
function plain(value) {
  if (!value || typeof value !== "string") return "";
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// CORE - the largest open-access aggregator that exposes full text.
// ---------------------------------------------------------------------------

/**
 * CORE indexes ~300M open-access works harvested from institutional
 * repositories worldwide, and its `fullText` field is the actual document
 * body. This is the highest-value provider in the set; without an API key it
 * is skipped rather than degraded.
 */
export async function searchCore(queries, limit = 4) {
  if (!CORE_API_KEY) return [];

  const data = await request("https://api.core.ac.uk/v3/search/works", {
    method: "POST",
    headers: { Authorization: `Bearer ${CORE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ q: queries.keywords, limit }),
  });

  return (data.results ?? [])
    .map((work) => {
      const url =
        work.downloadUrl ||
        work.sourceFulltextUrls?.[0] ||
        (work.doi ? `https://doi.org/${work.doi}` : work.links?.[0]?.url);
      if (!url) return null;

      return {
        url,
        title: work.title ?? "",
        // fullText is frequently megabytes of OCR; the caller truncates.
        content: typeof work.fullText === "string" ? work.fullText : plain(work.abstract),
        provider: "core",
      };
    })
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Unpaywall - turns a DOI into a readable copy.
// ---------------------------------------------------------------------------

/**
 * Unpaywall is not a search engine: given a DOI it reports where a legal open
 * copy lives. It is the direct fix for CrossRef results that resolve to a
 * publisher paywall, so it runs as an enricher over the output of other
 * providers rather than as a provider of its own.
 *
 * @param {string} doi
 * @returns {Promise<{url: string, isPdf: boolean} | null>}
 */
export async function unpaywallLocate(doi) {
  if (!doi) return null;

  const clean = String(doi).replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").trim();
  if (!/^10\.\d{4,9}\//.test(clean)) return null;

  const data = await request(
    `https://api.unpaywall.org/v2/${encodeURIComponent(clean)}?email=${encodeURIComponent(CONTACT_EMAIL)}`
  );

  const location = data.best_oa_location ?? data.first_oa_location;
  if (!location) return null;

  const pdf = location.url_for_pdf;
  const landing = location.url_for_landing_page || location.url;
  if (!pdf && !landing) return null;

  return { url: pdf || landing, isPdf: Boolean(pdf) };
}

/**
 * Replace paywalled DOI links with open copies, in place.
 * Failures leave the original candidate untouched.
 */
export async function enrichWithUnpaywall(candidates) {
  const doiLike = candidates.filter((candidate) => candidate?.doi && !candidate.content);
  if (doiLike.length === 0) return candidates;

  await Promise.all(
    doiLike.slice(0, 6).map(async (candidate) => {
      try {
        const open = await unpaywallLocate(candidate.doi);
        if (open) {
          candidate.url = open.url;
          candidate.isPdf = open.isPdf;
          candidate.provider = `${candidate.provider ?? "doi"}+unpaywall`;
        }
      } catch {
        // Not in Unpaywall, or the service is unreachable; keep the original.
      }
    })
  );

  return candidates;
}

// ---------------------------------------------------------------------------
// arXiv - preprint metadata and abstracts, no key required.
// ---------------------------------------------------------------------------

/** Minimal Atom field reader; the arXiv feed is small and regular. */
function atomEntries(xml) {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((match) => {
    const entry = match[1];
    const field = (name) => {
      const found = entry.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
      return found ? plain(found[1]) : "";
    };
    return { id: field("id"), title: field("title"), summary: field("summary") };
  });
}

async function arxivQuery(term, limit) {
  const xml = await request(
    `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(term)}` +
      `&max_results=${limit}&sortBy=relevance`,
    { accept: "application/atom+xml" }
  );
  return atomEntries(xml);
}

/**
 * An exact-phrase query is the precise signal but matches almost nothing on
 * arXiv, whose index is term-based rather than positional. The keyword form
 * runs as a fallback so the provider contributes recall instead of silence.
 */
export async function searchArxiv(queries, limit = 3) {
  let entries = await arxivQuery(`all:"${queries.phrase}"`, limit).catch(() => []);

  if (entries.length === 0) {
    // ANDing ten rare terms returns nothing; the leading terms carry the topic.
    const terms = queries.keywords.split(/\s+/).filter(Boolean).slice(0, 5);
    if (terms.length >= 2) {
      entries = await arxivQuery(terms.map((term) => `all:${term}`).join(" AND "), limit).catch(
        () => []
      );
    }
  }

  return entries
    .filter((entry) => entry.id)
    .map((entry) => ({
      url: entry.id,
      title: entry.title,
      content: entry.summary,
      provider: "arxiv",
    }));
}

// ---------------------------------------------------------------------------
// DOAJ - indexed open-access journals.
// ---------------------------------------------------------------------------

export async function searchDoaj(queries, limit = 3) {
  // The DOAJ query parser ANDs bare terms, so the full keyword list matches
  // nothing; the most distinctive few keep the query answerable.
  const terms = queries.keywords.split(/\s+/).filter(Boolean).slice(0, 4).join(" ");

  const data = await request(
    `https://doaj.org/api/v2/search/articles/${encodeURIComponent(terms)}?pageSize=${limit}`
  );

  return (data.results ?? [])
    .map((item) => {
      const bib = item.bibjson ?? {};
      const link = (bib.link ?? []).find((entry) => entry.url)?.url;
      if (!link) return null;
      return {
        url: link,
        title: bib.title ?? "",
        content: plain(bib.abstract),
        provider: "doaj",
      };
    })
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Semantic Scholar - broad coverage, flags open-access PDFs.
// ---------------------------------------------------------------------------

export async function searchSemanticScholar(queries, limit = 4) {
  const data = await request(
    "https://api.semanticscholar.org/graph/v1/paper/search" +
      `?query=${encodeURIComponent(queries.keywords)}&limit=${limit}` +
      "&fields=title,abstract,openAccessPdf,externalIds,url",
    S2_API_KEY ? { headers: { "x-api-key": S2_API_KEY } } : {}
  );

  return (data.data ?? [])
    .map((paper) => {
      const url = paper.openAccessPdf?.url || paper.url;
      if (!url) return null;
      return {
        url,
        title: paper.title ?? "",
        content: plain(paper.abstract),
        doi: paper.externalIds?.DOI ?? "",
        isPdf: Boolean(paper.openAccessPdf?.url),
        provider: "semanticscholar",
      };
    })
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Europe PMC - biomedical literature, with real full text for the OA subset.
// ---------------------------------------------------------------------------

const EPMC = "https://www.ebi.ac.uk/europepmc/webservices/rest";

/**
 * Fetch the full text of an open-access article.
 *
 * Europe PMC is one of the few free APIs that serves complete article bodies
 * rather than abstracts, which is what makes a passage-level comparison
 * possible at all. Only PMC-hosted open-access records expose it.
 */
async function europePmcFullText(pmcid) {
  const xml = await request(`${EPMC}/${pmcid}/fullTextXML`, { accept: "application/xml" });

  // JATS: the body carries the article; front matter is metadata and refs are
  // bibliography, neither of which should count as the author's text.
  const body = xml.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return plain(body ? body[1] : xml);
}

export async function searchEuropePmc(queries, limit = 3) {
  const data = await request(
    `${EPMC}/search?query=${encodeURIComponent(queries.keywords)}` +
      `&format=json&pageSize=${limit}&resultType=core`
  );

  const results = data.resultList?.result ?? [];

  return Promise.all(
    results.map(async (item) => {
      const pmcid = item.pmcid;
      const isOpen = item.isOpenAccess === "Y" && pmcid;

      let content = plain(item.abstractText);
      if (isOpen) {
        try {
          const full = await europePmcFullText(pmcid);
          if (full.length > content.length) content = full;
        } catch {
          // Not served as XML, or withdrawn; the abstract still carries signal.
        }
      }

      return {
        url: pmcid
          ? `https://europepmc.org/article/PMC/${pmcid}`
          : `https://europepmc.org/article/${item.source}/${item.id}`,
        title: item.title ?? "",
        content,
        doi: item.doi ?? "",
        provider: "europepmc",
      };
    })
  );
}

/** Which of these providers can run with the current configuration. */
export function availableOaProviders() {
  return [
    ...(CORE_API_KEY ? ["core"] : []),
    "unpaywall",
    "arxiv",
    "doaj",
    "semanticscholar",
    "europepmc",
  ];
}
