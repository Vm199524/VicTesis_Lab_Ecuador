/**
 * Highlighting on the author's own document.
 *
 * The reprinted report reflows the submission into the report's own styles,
 * which loses the cover page, the running footer, the tables and every other
 * formatting decision the author made. This module takes the opposite approach:
 * it opens the uploaded PDF unchanged and draws on top of it, so what comes back
 * is the student's document with the matches marked in place.
 *
 * This module itself only ever draws on PDF -- a DOCX has no page geometry
 * until something lays it out, so there are no coordinates to draw at. `pdfBuffer`
 * must already be a PDF by the time it reaches here; anything else and
 * `overlayHighlights` returns null.
 *
 * A DOCX gets those coordinates upstream, in `extract.js` / `docxToPdf.js`:
 * the upload is rendered to PDF with LibreOffice headless first, and this
 * module never knows the difference. When LibreOffice is not installed, that
 * conversion itself returns null and the caller falls back to the reprinted
 * report -- the same fallback that used to be the only option for DOCX.
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/**
 * Vertical extent of a highlight relative to the text baseline.
 *
 * pdf.js reports the baseline, not the glyph box: `y` is where the letters sit,
 * with descenders below it and ascenders above. These two factors turn that
 * baseline into a box that covers the line without swallowing the one above it.
 */
const DESCENT = 0.24;
const ASCENT = 0.82;

/** Translucent enough that the author's text stays readable underneath. */
const FILL_OPACITY = 0.3;

/** Fallback when a range carries no colour of its own. */
const DEFAULT_COLOR = "#facc15";

/**
 * Parse `#rrggbb` into the 0..1 triplet pdf-lib expects.
 * Anything unparseable falls back rather than throwing: a malformed colour is
 * not a reason to fail a whole report.
 */
function parseColor(value) {
  const hex = /^#?([0-9a-f]{6})$/i.exec(String(value ?? "").trim());
  const digits = hex ? hex[1] : DEFAULT_COLOR.slice(1);
  return rgb(
    parseInt(digits.slice(0, 2), 16) / 255,
    parseInt(digits.slice(2, 4), 16) / 255,
    parseInt(digits.slice(4, 6), 16) / 255
  );
}

/**
 * Resolve a text range to the on-page rectangles that cover it.
 *
 * A range rarely lines up with pdf.js's runs: it can start mid-run, span several
 * runs, and continue onto the next line or page. Each intersecting run therefore
 * contributes its own rectangle.
 *
 * Where a run is only partly covered, the rectangle is narrowed by the
 * proportion of characters involved. That assumes every glyph in the run is the
 * same width, which is false for proportional type -- an 'i' is not an 'm'. The
 * error stays under a few points because runs from a text extractor are short,
 * and the alternative (measuring each glyph against the embedded font metrics)
 * buys precision that a highlight does not need.
 */
function rectanglesFor(range, items) {
  const rectangles = [];

  for (const item of items) {
    const start = Math.max(range.textStart, item.textStart);
    const end = Math.min(range.textEnd, item.textEnd);
    if (end <= start) continue;

    const span = item.textEnd - item.textStart;
    const fromFraction = span > 0 ? (start - item.textStart) / span : 0;
    const toFraction = span > 0 ? (end - item.textStart) / span : 1;

    const height = item.height || item.fontSize || 10;

    rectangles.push({
      page: item.page,
      x: item.x + fromFraction * item.width,
      width: Math.max(1, (toFraction - fromFraction) * item.width),
      y: item.y - DESCENT * height,
      height: (DESCENT + ASCENT) * height,
    });
  }

  return rectangles;
}

/**
 * Draw similarity highlights onto the original PDF.
 *
 * Coordinates are used exactly as `extractPdfWithLayout` reported them. Both
 * pdf.js text items and pdf-lib's drawing calls work in PDF user space with the
 * origin at the bottom-left, so no y-flip belongs here; see the note in
 * `extract.js` for why that is easy to get wrong.
 *
 * The highlights are drawn over the text rather than beneath it. Putting them
 * genuinely behind would mean rewriting the page's content stream to inject
 * operators ahead of the existing ones, which pdf-lib does not expose; a
 * translucent fill achieves the same readability with none of that risk.
 *
 * @param {object}   options
 * @param {Buffer}   options.pdfBuffer The original upload, unmodified.
 * @param {object}   options.layout    From `extractPdfWithLayout`.
 * @param {Array}    options.ranges    `{textStart, textEnd, similarity, color, label}`.
 * @param {string}   [options.footer]   Stamped at the foot of every page.
 * @param {boolean}  [options.onlyMarkedPages] When true, pages that received no
 *   rectangle are dropped from the returned PDF. A thesis is commonly sixty or
 *   more pages and a handful of matches; appending all of it to a downloadable
 *   report just to carry three marked pages defeats the point of a report
 *   someone is meant to actually read. Footer stamping still runs against every
 *   original page first, so a kept page keeps its true page number.
 * @returns {Promise<{buffer: Buffer, pages: number, marked: number, keptPages: number[]}|null>}
 *   The marked-up PDF, how many ranges actually landed on a page, and the
 *   1-based original page numbers the returned buffer contains (all of them,
 *   in original order, unless `onlyMarkedPages` trimmed it) — or null when the
 *   input is not a PDF and so carries no geometry to draw on. `marked` is worth
 *   checking: a zero there means the overlay produced a clean copy of the
 *   original, which the caller probably wants to report rather than pass off as
 *   a highlighted document.
 */
export async function overlayHighlights({ pdfBuffer, layout, ranges = [], footer, onlyMarkedPages = false }) {
  if (!pdfBuffer || pdfBuffer.length === 0) return null;
  if (!layout || !Array.isArray(layout.items) || layout.items.length === 0) return null;

  // A PDF is the only input with coordinates. See the DOCX note above.
  if (pdfBuffer.subarray(0, 4).toString("latin1") !== "%PDF") return null;

  const pdf = await PDFDocument.load(pdfBuffer, {
    // The point of this module is that the author's file survives intact, so
    // nothing here may rewrite the pages it does not touch.
    updateMetadata: false,
  });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();

  let marked = 0;
  // 1-based original page numbers that received at least one rectangle, in the
  // order they were first touched. A Set because the same page routinely
  // catches several ranges.
  const markedPages = new Set();

  ranges.forEach((range, index) => {
    if (!Number.isFinite(range.textStart) || !Number.isFinite(range.textEnd)) return;
    if (range.textEnd <= range.textStart) return;

    const color = parseColor(range.color);
    const badge = range.label ?? String(index + 1);

    const rectangles = rectanglesFor(range, layout.items);
    if (rectangles.length === 0) return;
    marked += 1;

    for (const rectangle of rectangles) {
      const page = pages[rectangle.page - 1];
      if (!page) continue;
      markedPages.add(rectangle.page);

      page.drawRectangle({
        x: rectangle.x,
        y: rectangle.y,
        width: rectangle.width,
        height: rectangle.height,
        color,
        opacity: FILL_OPACITY,
      });

      // A rule along the bottom edge survives printing in greyscale, where the
      // tint alone would disappear.
      page.drawRectangle({
        x: rectangle.x,
        y: rectangle.y,
        width: rectangle.width,
        height: 0.7,
        color,
        opacity: 0.95,
      });
    }

    // One numbered badge per range, at its first rectangle, so a reviewer can
    // tie the mark back to the source list without repeating it on every line.
    const first = rectangles[0];
    const page = pages[first.page - 1];
    if (!page) return;

    const size = 6.5;
    const textWidth = font.widthOfTextAtSize(badge, size);
    const padding = 1.6;
    const boxWidth = textWidth + padding * 2;
    const boxHeight = size + padding;
    // Sit the badge just left of the highlight, tucked back inside the page if
    // the passage begins at the margin.
    const boxX = Math.max(2, first.x - boxWidth - 1.5);
    const boxY = first.y + first.height - boxHeight;

    page.drawRectangle({
      x: boxX,
      y: boxY,
      width: boxWidth,
      height: boxHeight,
      color,
      opacity: 0.95,
    });
    page.drawText(badge, {
      x: boxX + padding,
      y: boxY + padding * 0.9,
      size,
      font,
      color: rgb(1, 1, 1),
    });
  });

  if (footer) {
    const size = 7;
    const total = pages.length;

    pages.forEach((page, index) => {
      const { width } = page.getSize();
      const label = `${footer}`;
      const pagination = `${index + 1} / ${total}`;

      page.drawText(label, {
        x: 40,
        y: 14,
        size,
        font,
        color: rgb(0.58, 0.64, 0.72),
      });
      page.drawText(pagination, {
        x: width - 40 - font.widthOfTextAtSize(pagination, size),
        y: 14,
        size,
        font,
        color: rgb(0.58, 0.64, 0.72),
      });
    });
  }

  let output = pdf;
  let keptPages = pages.map((_, index) => index + 1);

  // Trimming happens last, after every page already carries its highlights and
  // its true footer number, so dropping a page never renumbers the ones that
  // remain. When nothing was marked the appendix is trimmed to zero pages too:
  // a report exists to be read, not to reproduce the whole submission, and a
  // clean page does not belong to this download any more than an unmarked one.
  if (onlyMarkedPages && markedPages.size < pages.length) {
    keptPages = [...markedPages].sort((a, b) => a - b);
    const trimmed = await PDFDocument.create();
    if (keptPages.length > 0) {
      const copied = await trimmed.copyPages(
        pdf,
        keptPages.map((pageNumber) => pageNumber - 1)
      );
      copied.forEach((page) => trimmed.addPage(page));
    }
    output = trimmed;
  }

  const bytes = await output.save();
  return { buffer: Buffer.from(bytes), pages: pages.length, marked, keptPages };
}
