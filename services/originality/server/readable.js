/**
 * Readable-text extraction from fetched web pages.
 *
 * The previous approach stripped tags with regular expressions, which loses
 * the article on any page whose body is assembled by a framework and keeps
 * navigation chrome that pollutes the comparison. Readability is the engine
 * behind Firefox's Reader Mode: it scores DOM nodes and returns the block a
 * human would call "the article".
 *
 * A regex fallback is retained because Readability declines pages that are
 * not article-shaped (API docs, listings, forum threads), and for those a
 * rough text dump still carries signal.
 */

import { Readability, isProbablyReaderable } from "@mozilla/readability";
import { JSDOM, VirtualConsole } from "jsdom";

/** Tags whose text never belongs to the document body. */
const NOISE = /<(script|style|noscript|svg|template|iframe|canvas)\b[^>]*>[\s\S]*?<\/\1>/gi;
const CHROME = /<(nav|header|footer|aside|form|menu)\b[^>]*>[\s\S]*?<\/\1>/gi;
const BLOCK = /<\/?(p|div|br|li|tr|h[1-6]|section|article|blockquote)\b[^>]*>/gi;

const ENTITIES = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
  ldquo: '"', rdquo: '"', lsquo: "'", rsquo: "'", mdash: "—", ndash: "–",
  hellip: "…", eacute: "é", aacute: "á", iacute: "í", oacute: "ó",
  uacute: "ú", ntilde: "ñ", uuml: "ü",
};

function decodeEntities(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? " ");
}

/** Collapse whitespace without welding sentences from separate blocks together. */
function normalize(text) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t ]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Last-resort tag stripper for pages Readability rejects. */
export function stripTags(html) {
  const main = html.match(/<(?:main|article)\b[^>]*>([\s\S]*?)<\/(?:main|article)>/i);
  const body = main ? main[1] : html;

  return normalize(
    decodeEntities(
      body
        .replace(NOISE, " ")
        .replace(CHROME, " ")
        .replace(/<!--[\s\S]*?-->/g, " ")
        .replace(BLOCK, "\n")
        .replace(/<[^>]+>/g, " ")
    )
  );
}

/**
 * Extract the readable article from an HTML document.
 *
 * @param {string} html Raw HTML source.
 * @param {string} url  Document URL; Readability needs it to resolve links.
 * @returns {{ text: string, title: string, excerpt: string, method: "readability"|"fallback" }}
 */
export function extractReadable(html, url) {
  if (!html || html.length < 200) {
    return { text: "", title: "", excerpt: "", method: "fallback" };
  }

  try {
    // jsdom logs every CSS parse error on real-world pages; silence it.
    const virtualConsole = new VirtualConsole();
    virtualConsole.on("error", () => {});
    virtualConsole.on("jsdomError", () => {});

    const dom = new JSDOM(html, { url, virtualConsole, contentType: "text/html" });
    const document = dom.window.document;

    // Readability mutates the DOM, so probe before parsing.
    const readerable = isProbablyReaderable(document, { minContentLength: 300 });

    if (readerable) {
      const article = new Readability(document, {
        charThreshold: 250,
        // Keep classes off: they add nothing to a text comparison.
        keepClasses: false,
      }).parse();

      dom.window.close();

      if (article?.textContent && article.textContent.trim().length > 200) {
        return {
          text: normalize(article.textContent),
          title: article.title ?? "",
          excerpt: article.excerpt ?? "",
          method: "readability",
        };
      }
    } else {
      dom.window.close();
    }
  } catch {
    // Malformed markup, jsdom limits, or an unsupported document type.
  }

  return { text: stripTags(html), title: "", excerpt: "", method: "fallback" };
}
