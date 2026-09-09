/**
 * Document text extraction.
 *
 * Supports PDF (pdfjs-dist), DOCX (mammoth), legacy DOC (word-extractor),
 * RTF and plain text. Each extractor returns a normalized plain-text string
 * plus whatever metadata the format exposes.
 */

const MAMMOTH_STYLE_MAP = [
  "p[style-name='Quote'] => blockquote",
  "p[style-name='Intense Quote'] => blockquote",
];

/** Collapse the whitespace soup that document formats tend to produce. */
export function normalizeText(raw) {
  return raw
    .replace(/\r\n?/g, "\n")
    // Ligatures and typographic characters that break word matching.
    .replace(/\uFB00/g, "ff")
    .replace(/\uFB01/g, "fi")
    .replace(/\uFB02/g, "fl")
    .replace(/\uFB03/g, "ffi")
    .replace(/\uFB04/g, "ffl")
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014\u2015]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    // Soft hyphen + line break: "compre-\nhensive" -> "comprehensive".
    .replace(/\u00AD/g, "")
    .replace(/(\w)-\n(\w)/g, "$1$2")
    // Drop control characters except tab/newline.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractPdf(buffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    // No worker thread and no eval in a server process.
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
    verbosity: 0,
  });
  const doc = await loadingTask.promise;

  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();

    // pdf.js emits positioned text runs, not lines. Rebuild line breaks from
    // the `hasEOL` flag so sentence splitting downstream behaves sensibly.
    let text = "";
    for (const item of content.items) {
      if (typeof item.str !== "string") continue;
      text += item.str;
      if (item.hasEOL) text += "\n";
      else if (!item.str.endsWith(" ")) text += " ";
    }

    pages.push(text);
    page.cleanup();
  }

  const numPages = doc.numPages;
  let info = {};
  try {
    const metadata = await doc.getMetadata();
    info = metadata?.info ?? {};
  } catch {
    // Metadata is optional; a malformed dictionary should not fail extraction.
  }
  await loadingTask.destroy();

  return {
    text: normalizeText(pages.join("\n\n")),
    meta: { pages: numPages, title: info.Title || null, author: info.Author || null },
  };
}

async function extractDocx(buffer) {
  const mammoth = (await import("mammoth")).default;
  const { value, messages } = await mammoth.extractRawText({ buffer });

  return {
    text: normalizeText(value),
    meta: {
      warnings: messages.filter((m) => m.type === "warning").length,
      styleMap: MAMMOTH_STYLE_MAP.length,
    },
  };
}

async function extractDoc(buffer) {
  const WordExtractor = (await import("word-extractor")).default;
  const doc = await new WordExtractor().extract(buffer);

  const body = doc.getBody() || "";
  const footnotes = doc.getFootnotes() || "";
  const endnotes = doc.getEndnotes() || "";

  return {
    text: normalizeText([body, footnotes, endnotes].filter(Boolean).join("\n\n")),
    meta: { hasNotes: Boolean(footnotes || endnotes) },
  };
}

/** RTF has no dependency here — strip control words and unescape hex/unicode. */
function extractRtf(buffer) {
  const raw = buffer.toString("latin1");

  const text = raw
    // Drop binary and metadata groups wholesale. These nest one level deep
    // (a fonttbl contains a group per font), so match that explicitly.
    .replace(
      /\{\\(?:\*\\)?(?:fonttbl|colortbl|stylesheet|info|pict|object)(?:[^{}]|\{[^{}]*\})*\}/gs,
      ""
    )
    .replace(/\\u(-?\d+)\s?\??/g, (_, code) =>
      String.fromCharCode(Number(code) < 0 ? Number(code) + 65536 : Number(code))
    )
    .replace(/\\'([0-9a-f]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\par[d]?\b/g, "\n")
    .replace(/\\line\b/g, "\n")
    .replace(/\\tab\b/g, "\t")
    .replace(/\\[a-z]+-?\d*\s?/gi, "")
    .replace(/[{}]/g, "");

  return { text: normalizeText(text), meta: {} };
}

function extractPlain(buffer) {
  // Detect and honour a UTF-16 BOM; otherwise assume UTF-8.
  if (buffer.length >= 2) {
    if (buffer[0] === 0xff && buffer[1] === 0xfe) {
      return { text: normalizeText(buffer.toString("utf16le")), meta: { encoding: "utf-16le" } };
    }
    if (buffer[0] === 0xfe && buffer[1] === 0xff) {
      const swapped = Buffer.from(buffer);
      swapped.swap16();
      return { text: normalizeText(swapped.toString("utf16le")), meta: { encoding: "utf-16be" } };
    }
  }

  return {
    text: normalizeText(buffer.toString("utf8").replace(/^\uFEFF/, "")),
    meta: { encoding: "utf-8" },
  };
}

/** Magic-number sniffing — filename extensions lie, especially on uploads. */
function sniff(buffer) {
  if (buffer.length >= 4) {
    const head = buffer.subarray(0, 4);
    if (head.toString("latin1") === "%PDF") return "pdf";
    // ZIP container: DOCX, but also ODT/XLSX. Confirmed by the caller's extension.
    if (head[0] === 0x50 && head[1] === 0x4b && (head[2] === 0x03 || head[2] === 0x05)) {
      return "zip";
    }
    // OLE2 compound file: legacy .doc/.xls.
    if (head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0) {
      return "ole";
    }
  }
  if (buffer.subarray(0, 5).toString("latin1") === "{\\rtf") return "rtf";
  return "unknown";
}

export const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".doc", ".rtf", ".txt", ".md"];

/**
 * Extract plain text from an uploaded document buffer.
 *
 * @param {Buffer} buffer   Raw file contents.
 * @param {string} filename Original filename, used to disambiguate ZIP containers.
 * @returns {Promise<{text: string, format: string, meta: object}>}
 */
export async function extractDocumentText(buffer, filename = "") {
  if (!buffer || buffer.length === 0) {
    throw new Error("The uploaded file is empty");
  }

  const ext = (filename.match(/\.[^.]+$/)?.[0] || "").toLowerCase();
  const magic = sniff(buffer);

  // Trust the magic number first, fall back to the extension.
  if (magic === "pdf") return { format: "pdf", ...(await extractPdf(buffer)) };
  if (magic === "rtf") return { format: "rtf", ...extractRtf(buffer) };
  if (magic === "ole") return { format: "doc", ...(await extractDoc(buffer)) };

  if (magic === "zip") {
    if (ext === ".docx" || ext === "") return { format: "docx", ...(await extractDocx(buffer)) };
    throw new Error(
      `Compressed format "${ext}" is not supported. Convert it to .docx or .pdf first.`
    );
  }

  if (ext === ".txt" || ext === ".md" || magic === "unknown") {
    const result = extractPlain(buffer);
    // A binary file read as UTF-8 turns into replacement characters.
    const garbageRatio = (result.text.match(/\uFFFD/g) || []).length / (result.text.length || 1);
    if (garbageRatio > 0.05) {
      throw new Error("Unrecognized file format. Supported: PDF, DOCX, DOC, RTF, TXT, MD.");
    }
    return { format: ext === ".md" ? "markdown" : "text", ...result };
  }

  throw new Error(`Unsupported file type "${ext || "unknown"}".`);
}

// ---------------------------------------------------------------------------
// Layout-aware extraction
//
// The plain-text path above throws the geometry away, which is why a report
// built from it cannot mark up the author's own document: nothing is left to say
// *where* a passage sat on the page. What follows keeps that information, so
// `overlay.js` can paint on the original file instead of reprinting a stripped
// copy of it.
// ---------------------------------------------------------------------------

/**
 * `normalizeText`, but it also reports where every character ended up.
 *
 * Highlighting needs offsets that index the *normalized* text, because that is
 * the string the analysis runs on. Normalization is not length-preserving
 * (`[ \t]+` collapses runs, a ligature expands to two or three characters), so
 * an offset taken from the raw page stream lands in the wrong place, and the
 * drift compounds the deeper into the document it goes.
 *
 * Rather than estimate that drift, every rewrite runs through `mappedStage`,
 * which carries a per-character provenance array alongside the string. The
 * stages and their order deliberately mirror `normalizeText`, and the layout
 * test asserts the two produce byte-identical output so this cannot quietly
 * drift away from it.
 *
 * @param {string} raw
 * @returns {{text: string, map: Int32Array}} `map[i]` is the index in `text`
 *   corresponding to index `i` of `raw`. Characters normalization deleted map to
 *   the position their surviving successor occupies.
 */
export function normalizeTextMapped(raw) {
  // `origin[i]` = index in `raw` that produced character `i` of the current text.
  let text = raw;
  let origin = new Int32Array(raw.length + 1);
  for (let i = 0; i <= raw.length; i++) origin[i] = i;

  const stage = (pattern, replace) => {
    const result = mappedStage(text, origin, pattern, replace);
    text = result.text;
    origin = result.origin;
  };

  stage(/\r\n?/g, () => "\n");
  stage(/ﬀ/g, () => "ff");
  stage(/ﬁ/g, () => "fi");
  stage(/ﬂ/g, () => "fl");
  stage(/ﬃ/g, () => "ffi");
  stage(/ﬄ/g, () => "ffl");
  stage(/[‘’‚‛]/g, () => "'");
  stage(/[“”„‟]/g, () => '"');
  stage(/[–—―]/g, () => "-");
  stage(/…/g, () => "...");
  stage(/ /g, () => " ");
  stage(/­/g, () => "");
  stage(/(\w)-\n(\w)/g, (match) => match[1] + match[2]);
  stage(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, () => "");
  stage(/[ \t]+/g, () => " ");
  stage(/ ?\n ?/g, () => "\n");
  stage(/\n{3,}/g, () => "\n\n");

  // `.trim()` expressed as two stages, so the leading cut shifts the map too.
  stage(/^\s+/g, () => "");
  stage(/\s+$/g, () => "");

  // Invert provenance into the forward map callers actually want. A raw index
  // whose character did not survive (collapsed whitespace, a control byte)
  // inherits the position of the next one that did, so a range whose edge fell
  // inside deleted text still spans the right visible characters.
  const map = new Int32Array(raw.length + 1).fill(-1);
  for (let i = origin.length - 1; i >= 0; i--) {
    const source = origin[i];
    if (source >= 0 && source <= raw.length) map[source] = i;
  }
  let next = text.length;
  for (let i = raw.length; i >= 0; i--) {
    if (map[i] === -1) map[i] = next;
    else next = map[i];
  }

  return { text, map };
}

/**
 * One regex rewrite that keeps character provenance intact.
 *
 * Every character a replacement emits is attributed to the first character of
 * the match. That is what makes a range edge landing inside a collapsed
 * whitespace run resolve to the start of the run rather than wherever the run
 * happened to end.
 */
function mappedStage(text, origin, pattern, replace) {
  const out = [];
  const next = [];
  let cursor = 0;

  for (const match of text.matchAll(pattern)) {
    const start = match.index;
    const end = start + match[0].length;

    for (let i = cursor; i < start; i++) {
      out.push(text[i]);
      next.push(origin[i]);
    }

    const replacement = replace(match);
    for (let i = 0; i < replacement.length; i++) {
      out.push(replacement[i]);
      next.push(origin[start]);
    }

    cursor = end;
  }

  for (let i = cursor; i < text.length; i++) {
    out.push(text[i]);
    next.push(origin[i]);
  }
  next.push(origin[text.length]);

  return { text: out.join(""), origin: Int32Array.from(next) };
}

/**
 * Extract a PDF's text together with the geometry of every text run.
 *
 * Text is accumulated exactly as `extractPdf` does -- same separator rules, same
 * page join -- so the string returned here is the one the analysis already knows
 * how to read. What is added is `items`: for each run pdf.js reported, where it
 * sits on its page and which slice of `text` it produced.
 *
 * Coordinates pass through untouched, and that decision is worth stating plainly
 * because the obvious assumption is the wrong one. `getTextContent()` reports
 * `transform[4]`/`transform[5]` in PDF user space with the origin at the
 * bottom-left, the very space `pdf-lib` draws in. The y-flip that pdf.js text
 * layers are known for lives in `viewport.transform` (`[1,0,0,-1,0,height]`) and
 * applies only when rendering to a canvas. Verified against a real 13-page
 * submission: its first body line reports y=664 and its page footer y=25 on an
 * 842-unit page, so y grows upward. Flipping here would put every highlight on
 * the wrong side of the page.
 *
 * @param {Buffer} buffer
 * @returns {Promise<{text: string, meta: object, pages: Array, items: Array}>}
 */
export async function extractPdfWithLayout(buffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
    verbosity: 0,
  });
  const doc = await loadingTask.promise;

  const pages = [];
  const rawItems = [];
  const pageTexts = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();

    pages.push({ index: pageNumber, width: viewport.width, height: viewport.height });

    let text = "";
    for (const item of content.items) {
      if (typeof item.str !== "string") continue;

      // Offsets are recorded against this page's own text and rebased once the
      // page separators are known, which keeps the two passes independent.
      const start = text.length;
      text += item.str;

      if (item.str.trim().length > 0) {
        rawItems.push({
          page: pageNumber,
          str: item.str,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width,
          // `height` is 0 on the zero-width runs pdf.js emits as line breaks;
          // for real runs it tracks the font size, which is what a highlight box
          // needs.
          height: item.height || Math.abs(item.transform[3]) || 0,
          fontSize: Math.abs(item.transform[0]) || item.height || 0,
          pageStart: start,
          pageEnd: start + item.str.length,
          pageSlot: pageTexts.length,
        });
      }

      if (item.hasEOL) text += "\n";
      else if (!item.str.endsWith(" ")) text += " ";
    }

    pageTexts.push(text);
    page.cleanup();
  }

  let info = {};
  try {
    const metadata = await doc.getMetadata();
    info = metadata?.info ?? {};
  } catch {
    // Metadata is optional; a malformed dictionary should not fail extraction.
  }
  const numPages = doc.numPages;
  await loadingTask.destroy();

  // Rebase per-page offsets onto the joined document, then push them through
  // normalization so they index the string the caller receives.
  const SEPARATOR = "\n\n";
  const pageOffsets = [];
  let running = 0;
  for (const pageText of pageTexts) {
    pageOffsets.push(running);
    running += pageText.length + SEPARATOR.length;
  }

  const rawText = pageTexts.join(SEPARATOR);
  const { text, map } = normalizeTextMapped(rawText);

  const items = [];
  for (const item of rawItems) {
    const base = pageOffsets[item.pageSlot];
    const textStart = map[Math.min(base + item.pageStart, rawText.length)];
    const textEnd = map[Math.min(base + item.pageEnd, rawText.length)];

    // A run normalization erased entirely (whitespace-only once cleaned up) has
    // nothing to highlight, and keeping it as a zero-width range would make it
    // match every lookup at that offset.
    if (textEnd <= textStart) continue;

    items.push({
      page: item.page,
      str: item.str,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
      fontSize: item.fontSize,
      textStart,
      textEnd,
    });
  }

  return {
    text,
    meta: { pages: numPages, title: info.Title || null, author: info.Author || null },
    pages,
    items,
  };
}

/**
 * Layout-aware extraction for any supported upload.
 *
 * PDF carries coordinates natively. DOCX gets them by first rendering to PDF
 * with LibreOffice (see `docxToPdf.js`) and reading the result exactly like a
 * native PDF upload — same text extraction, same header/footer treatment,
 * same page geometry — so the overlay draws on it identically. Every other
 * format, and a DOCX when no LibreOffice installation is available, resolves
 * to `layout: null` and the caller falls back to the reprinted report.
 *
 * @param {Buffer} buffer
 * @param {string} filename
 * @returns {Promise<{text: string, format: string, meta: object, layout: object|null, pdfBuffer: Buffer|null}>}
 *   `pdfBuffer` is the file the layout coordinates actually describe — the
 *   original upload for a PDF, the LibreOffice output for a converted DOCX —
 *   and is what the caller must hand to `overlayHighlights`, not the raw upload.
 */
export async function extractDocumentLayout(buffer, filename = "") {
  if (!buffer || buffer.length === 0) {
    throw new Error("The uploaded file is empty");
  }

  if (sniff(buffer) === "pdf") {
    const { text, meta, pages, items } = await extractPdfWithLayout(buffer);
    return { text, format: "pdf", meta, layout: { pages, items }, pdfBuffer: buffer };
  }

  const ext = (filename.match(/\.[^.]+$/)?.[0] || "").toLowerCase();
  if (sniff(buffer) === "zip" && (ext === ".docx" || ext === "")) {
    const { convertDocxToPdf } = await import("./docxToPdf.js");
    const converted = await convertDocxToPdf(buffer).catch((error) => {
      console.warn(`[extract] DOCX→PDF conversion threw: ${error?.message ?? error}`);
      return null;
    });

    if (converted) {
      try {
        const { text, meta, pages, items } = await extractPdfWithLayout(converted);
        return { text, format: "docx", meta, layout: { pages, items }, pdfBuffer: converted };
      } catch (error) {
        console.warn(
          `[extract] Could not read the converted PDF, falling back to text-only: ${error?.message ?? error}`
        );
      }
    }
  }

  const plain = await extractDocumentText(buffer, filename);
  return { ...plain, layout: null, pdfBuffer: null };
}
