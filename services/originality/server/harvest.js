/**
 * OAI-PMH harvesting.
 *
 * Nearly every university repository -- DSpace, EPrints, Islandora -- exposes
 * an OAI-PMH endpoint, and almost none of them are indexed deeply by the
 * public search engines this checker otherwise relies on. For a Latin American
 * institution that gap is most of the relevant literature: theses, local
 * journals, and prior work by the same faculty.
 *
 * Harvesting those records into the local corpus is what turns a generic web
 * checker into one that knows the institution's own output.
 */

import { indexDocument } from "./corpus.js";

const UA = "PlagiarismChecker/1.0 (OAI-PMH harvester)";
const TIMEOUT_MS = 20_000;

async function fetchXml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/xml,text/xml" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decode(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match)
    .replace(/\s+/g, " ")
    .trim();
}

/** Every value of a Dublin Core element within one record. */
function dcValues(record, element) {
  const pattern = new RegExp(`<(?:\\w+:)?${element}\\b[^>]*>([\\s\\S]*?)</(?:\\w+:)?${element}>`, "g");
  return [...record.matchAll(pattern)].map((match) => decode(match[1]));
}

/**
 * Parse one page of an OAI-PMH ListRecords response.
 *
 * @returns {{records: Array<object>, resumptionToken: string}}
 */
export function parseOaiPage(xml) {
  const records = [];

  for (const match of xml.matchAll(/<record\b[^>]*>([\s\S]*?)<\/record>/g)) {
    const record = match[1];

    // Deleted records carry a status attribute and no metadata.
    if (/<header[^>]*status=["']deleted["']/.test(record)) continue;

    const title = dcValues(record, "title")[0] ?? "";
    const description = dcValues(record, "description").join("\n\n");
    const identifiers = dcValues(record, "identifier");

    records.push({
      title,
      author: dcValues(record, "creator").join(", "),
      description,
      date: dcValues(record, "date")[0] ?? "",
      // Prefer a resolvable landing page over an internal OAI identifier.
      url: identifiers.find((id) => /^https?:\/\//.test(id)) ?? identifiers[0] ?? "",
      type: dcValues(record, "type")[0] ?? "",
    });
  }

  const token = xml.match(/<resumptionToken[^>]*>([\s\S]*?)<\/resumptionToken>/);
  return { records, resumptionToken: token ? decode(token[1]) : "" };
}

/**
 * Harvest a repository into the local corpus.
 *
 * Records whose abstract is too short to fingerprint are skipped rather than
 * stored: a title and two lines of description produce no reliable match and
 * would only inflate the corpus.
 *
 * @param {string} endpoint  Base OAI-PMH URL, e.g. https://repositorio.tuuniversidad.edu.ec/oai/request
 * @param {object} [options]
 * @param {string} [options.set]        OAI set to restrict the harvest to.
 * @param {string} [options.from]       ISO date lower bound, for incremental runs.
 * @param {number} [options.maxRecords] Stop after this many records.
 * @param {(progress: {fetched: number, indexed: number}) => void} [options.onProgress]
 */
export async function harvestRepository(endpoint, options = {}) {
  const { set = "", from = "", until = "", maxRecords = 500, onProgress } = options;

  const base = endpoint.includes("?") ? endpoint : `${endpoint}?`;
  const join = base.endsWith("?") ? "" : "&";

  const listUrl = (extra) =>
    `${base}${join}verb=ListRecords&metadataPrefix=oai_dc` +
    (set ? `&set=${encodeURIComponent(set)}` : "") +
    extra;

  let url = listUrl(
    (from ? `&from=${encodeURIComponent(from)}` : "") +
      (until ? `&until=${encodeURIComponent(until)}` : "")
  );

  let fetched = 0;
  let indexed = 0;
  let skipped = 0;
  const errors = [];

  // Several DSpace deployments answer 500 to an unfiltered ListRecords while
  // serving the same request happily once it is bounded. Rather than reporting
  // the repository as broken, the harvest falls back to walking it in yearly
  // windows, which is what the endpoint can actually deliver.
  let windowQueue = null;

  const nextWindowUrl = () => {
    while (windowQueue?.length) {
      const year = windowQueue.shift();
      return listUrl(`&from=${year}-01-01&until=${year}-12-31`);
    }
    return "";
  };

  while (url && fetched < maxRecords) {
    let xml;
    try {
      xml = await fetchXml(url);
    } catch (error) {
      if (!from && !until && windowQueue === null) {
        const thisYear = new Date().getFullYear();
        windowQueue = Array.from({ length: 16 }, (_, i) => thisYear - i);
        errors.push(
          `listado completo rechazado (${error.message}); recolectando por anos`
        );
        url = nextWindowUrl();
        continue;
      }
      if (windowQueue?.length) {
        url = nextWindowUrl();
        continue;
      }
      errors.push(`${error.message} al pedir ${url.slice(0, 120)}`);
      break;
    }

    const oaiError = xml.match(/<error[^>]*code=["']([^"']+)["'][^>]*>([\s\S]*?)<\/error>/);
    if (oaiError) {
      // Walking year by year necessarily hits years with nothing in them (the
      // current year before anyone has submitted, a founding year before the
      // repository existed). That is not a reason to give up on the rest of
      // the queue -- only report it as a dead end once every window is spent.
      if (oaiError[1] === "noRecordsMatch" && windowQueue?.length) {
        url = nextWindowUrl();
        continue;
      }
      errors.push(`OAI ${oaiError[1]}: ${decode(oaiError[2])}`);
      break;
    }

    const { records, resumptionToken } = parseOaiPage(xml);

    if (records.length === 0) {
      // An empty window is normal; only a genuinely exhausted harvest stops.
      url = nextWindowUrl();
      if (!url) break;
      continue;
    }

    for (const record of records) {
      fetched++;
      if (fetched > maxRecords) break;

      // Title plus abstract is what oai_dc carries; the full text lives behind
      // the landing page and is fetched separately when it is worth the cost.
      const body = [record.title, record.description].filter(Boolean).join("\n\n");

      const result = indexDocument(body, {
        title: record.title,
        author: record.author,
        url: record.url,
        origin: "repositorio",
      });

      if (result.added) indexed++;
      else skipped++;
    }

    onProgress?.({ fetched, indexed });

    url = resumptionToken
      ? `${base}${join}verb=ListRecords&resumptionToken=${encodeURIComponent(resumptionToken)}`
      : nextWindowUrl();
  }

  return { endpoint, fetched, indexed, skipped, errors };
}

/**
 * Check that an endpoint answers OAI-PMH before committing to a full harvest.
 */
export async function probeRepository(endpoint) {
  const base = endpoint.includes("?") ? endpoint : `${endpoint}?`;
  const xml = await fetchXml(`${base}${base.endsWith("?") ? "" : "&"}verb=Identify`);

  const name = xml.match(/<repositoryName>([\s\S]*?)<\/repositoryName>/);
  const granularity = xml.match(/<granularity>([\s\S]*?)<\/granularity>/);

  if (!name) throw new Error("La respuesta no es un endpoint OAI-PMH valido.");

  return {
    name: decode(name[1]),
    granularity: granularity ? decode(granularity[1]) : "",
  };
}
