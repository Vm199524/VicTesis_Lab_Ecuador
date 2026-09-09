/**
 * Joining the printed report to the author's own document.
 *
 * A similarity report is two things at once, and they want opposite treatment.
 * The summary — index, bands, source table, recommendations — is ours to
 * typeset, and Puppeteer prints it. The evidence is the submission itself, and
 * every formatting decision in it belongs to the author: the cover page the
 * university mandates, the running headers, the tables. Reprinting that into
 * our own styles destroys the thing the reader most needs to recognise.
 *
 * So neither document is regenerated here. The summary PDF and the overlaid
 * original are produced separately and concatenated, which is how Turnitin and
 * its peers present the same two halves: read the numbers, then turn the page
 * and see them on the document you submitted.
 *
 * Page numbering deliberately restarts at the seam. The appended half keeps the
 * author's own pagination — page 12 of the thesis is page 12 in the marks — and
 * the summary carries its own count in the running footer Puppeteer stamped.
 * A single continuous numbering would contradict both.
 */

import { PDFDocument } from "pdf-lib";

/**
 * Concatenate PDF buffers into one document.
 *
 * Copied pages carry their own resources — fonts, images, the exact page box —
 * so a mismatch in size between the A4 summary and a Letter submission is
 * preserved rather than scaled. That is the correct behaviour: rescaling the
 * author's pages would silently alter the margins their faculty checks.
 *
 * @param {Buffer[]} buffers In order. Empty or unreadable entries are skipped
 *   rather than throwing, so one damaged half still yields a usable report.
 * @returns {Promise<Buffer|null>} null when nothing could be read at all.
 */
export async function mergePdfs(buffers) {
  const usable = (buffers ?? []).filter(
    (buffer) => buffer && buffer.length > 0 && buffer.subarray(0, 4).toString("latin1") === "%PDF"
  );

  if (usable.length === 0) return null;
  if (usable.length === 1) return Buffer.from(usable[0]);

  const merged = await PDFDocument.create();

  for (const buffer of usable) {
    let source;
    try {
      source = await PDFDocument.load(buffer, { updateMetadata: false });
    } catch (error) {
      // A half that will not parse is worth losing; failing the whole report
      // over it is not.
      console.warn(`[reportMerge] Skipping an unreadable PDF: ${error.message}`);
      continue;
    }

    const pages = await merged.copyPages(source, source.getPageIndices());
    for (const page of pages) merged.addPage(page);
  }

  if (merged.getPageCount() === 0) return null;

  return Buffer.from(await merged.save());
}

/**
 * Where the author's document starts once the summary is in front of it.
 *
 * The summary text says "the marked text appears from page N", and N has to be
 * right before the summary is printed — but it is only knowable after printing,
 * because the summary's own length depends on how many sources were found.
 * Callers resolve this by printing the summary once with a placeholder, reading
 * its page count, and reprinting. This helper names the arithmetic so the two
 * call sites cannot disagree about it.
 *
 * @param {number} summaryPages
 * @returns {number} 1-based page number of the first page of the original.
 */
export function originalStartsAt(summaryPages) {
  return Math.max(1, Number(summaryPages) || 0) + 1;
}

/**
 * Count the pages of a PDF buffer without keeping the document around.
 *
 * @param {Buffer} buffer
 * @returns {Promise<number>} 0 when the buffer is not a readable PDF.
 */
export async function pageCount(buffer) {
  if (!buffer || buffer.length === 0) return 0;
  try {
    const pdf = await PDFDocument.load(buffer, { updateMetadata: false });
    return pdf.getPageCount();
  } catch {
    return 0;
  }
}
