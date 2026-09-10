import { createServer } from "http";
import { createHash } from "node:crypto";
import multer from "multer";

import { checkTextSchema, UPLOAD_LIMITS } from "../shared/schema.js";
import { analyzeDocument, LIMITS } from "./plagiarism.js";
import { extractDocumentLayout, SUPPORTED_EXTENSIONS } from "./extract.js";
import {
  generateReportPdf,
  generateReportTailPdf,
  generateAiReportPdf,
  generateAiReportTailPdf,
  classify,
  verificationCode,
} from "./report.js";
import { overlayHighlights } from "./overlay.js";
import { mergePdfs, originalStartsAt, pageCount } from "./reportMerge.js";
import { storeLayout, takeLayout } from "./reportStore.js";
import { indexDocument, forget, corpusStats, checksumOf } from "./corpus.js";
import { harvestRepository, probeRepository } from "./harvest.js";
import { detectAiText, detectAiPassages } from "./ai-detect.js";

/**
 * Print a summary that has to name the page its appendix starts on.
 *
 * The number is only knowable after the summary is printed, and printing it
 * changes nothing about the length: the sentence carrying the number is the
 * same handful of lines whatever the number is. So two passes settle it — print
 * to learn the count, reprint with the count. A third pass would find the same
 * answer.
 */
async function printWithAppendix(render, payload) {
  const probe = await render({ ...payload, originalPage: 1 });
  return render({ ...payload, originalPage: originalStartsAt(await pageCount(probe)) });
}

/** Send a PDF buffer as a download. */
function sendPdf(res, buffer, filename) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Length", buffer.length);
  res.end(buffer);
}

/**
 * Short-lived cache of completed analyses, keyed by the analysed text.
 *
 * Downloading a report used to re-run the plagiarism scan against the open web —
 * the slowest part of the flow — because a report is an attestable document and
 * its numbers have to come from this server. That remains true; the scan just
 * no longer needs to happen twice for the same text. A check and its reports
 * share one text, so the first result is kept here (memory only, bounded) and
 * the report endpoints reuse it. A download that used to take minutes again now
 * only prints the PDF.
 */
const analysisCache = new Map();
const ANALYSIS_CACHE_TTL_MS = 30 * 60 * 1000;

function analysisKey(text, excludeCitations) {
  const hash = createHash("sha1");
  hash.update(excludeCitations ? "1" : "0");
  hash.update("\0");
  hash.update(text);
  return hash.digest("hex");
}

function getCached(key) {
  const entry = analysisCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > ANALYSIS_CACHE_TTL_MS) {
    analysisCache.delete(key);
    return null;
  }
  return entry;
}

/** Merge one result part into the cache entry for `key` (never drops others). */
function cachePut(key, part) {
  analysisCache.set(key, { ...(getCached(key) ?? {}), ...part, at: Date.now() });
}

/** Reuse the plagiarism analysis for `text` or run it once and keep it. */
async function analysisForKey(text, excludeCitations) {
  const key = analysisKey(text, excludeCitations);
  const cached = getCached(key);
  if (cached?.analysis) return { key, analysis: cached.analysis, reused: true };
  const analysis = await analyzeDocument(text, { excludeCitations });
  cachePut(key, { analysis });
  return { key, analysis, reused: false };
}

/** Reuse the document-level AI estimate for `text` or run it once and keep it. */
async function aiForKey(text) {
  const key = analysisKey(text, false);
  const cached = getCached(key);
  if (cached?.ai) return { key, ai: cached.ai, reused: true };
  const ai = await detectAiText(text);
  cachePut(key, { ai });
  return { key, ai, reused: false };
}

/** Reuse the per-block AI scan (only meaningful for overlay reports). */
async function passagesForKey(text) {
  const key = analysisKey(text, false);
  const cached = getCached(key);
  if (cached?.passages) return cached.passages;
  const passages = await detectAiPassages(text).catch(() => []);
  cachePut(key, { passages });
  return passages;
}

/**
 * Uploads are buffered in memory and discarded once the text is extracted —
 * nothing touches disk, so there is no upload directory to clean up or secure.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UPLOAD_LIMITS.maxBytes, files: 1 },
  fileFilter: (_req, file, callback) => {
    const ext = (file.originalname.match(/\.[^.]+$/)?.[0] || "").toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      callback(new Error(`Unsupported file type "${ext || "unknown"}".`));
      return;
    }
    callback(null, true);
  },
});

export function registerRoutes(app) {
  app.get("/api/limits", (_req, res) => {
    res.json({
      maxChars: LIMITS.maxChars,
      minChars: LIMITS.minChars,
      maxChunks: LIMITS.maxChunks,
      upload: UPLOAD_LIMITS,
    });
  });

  /** Extract plain text from an uploaded PDF / Word / RTF / text document. */
  app.post("/api/extract", (req, res) => {
    upload.single("file")(req, res, async (uploadError) => {
      if (uploadError) {
        const tooLarge = uploadError.code === "LIMIT_FILE_SIZE";
        res.status(400).json({
          error: tooLarge
            ? `File exceeds the ${Math.round(UPLOAD_LIMITS.maxBytes / 1024 / 1024)}MB limit.`
            : uploadError.message,
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "No file was uploaded." });
        return;
      }

      try {
        const { text, format, meta, layout, pdfBuffer } = await extractDocumentLayout(
          req.file.buffer,
          req.file.originalname
        );

        if (text.trim().length === 0) {
          res.status(422).json({
            error:
              "No text could be extracted. If this is a scanned PDF it contains images, not text, and needs OCR first.",
          });
          return;
        }

        const truncated = text.length > LIMITS.maxChars;
        const finalText = truncated ? text.slice(0, LIMITS.maxChars) : text;

        // The overlay report marks the file as uploaded, not whatever the
        // client edits afterward — so it is kept against the untouched text
        // and offered only when there is page geometry to draw on (PDF, and
        // not truncated: a cut document no longer matches its own layout).
        const overlayToken =
          layout && !truncated
            ? storeLayout({
                // A converted DOCX stores the LibreOffice PDF output — the
                // file the layout coordinates actually describe — never the
                // original upload, which has no page geometry of its own.
                buffer: pdfBuffer ?? req.file.buffer,
                layout,
                text: finalText,
                filename: req.file.originalname,
              })
            : null;

        res.json({
          text: finalText,
          format,
          filename: req.file.originalname,
          characters: finalText.length,
          words: finalText.split(/\s+/).filter(Boolean).length,
          truncated,
          meta,
          overlayToken,
        });
      } catch (error) {
        console.error("Extraction failed:", error);
        res.status(422).json({ error: error.message || "Could not read the document." });
      }
    });
  });

  app.post("/api/plagiarism-check", async (req, res) => {
    try {
      const { text, excludeCitations } = checkTextSchema.parse(req.body);

      const started = Date.now();
      console.log(
        `Plagiarism check started: ${text.length} chars, excludeCitations=${excludeCitations}`
      );

      const { analysis, reused } = await analysisForKey(text, excludeCitations);

      console.log(
        reused
          ? `Plagiarism check served from cache in ${((Date.now() - started) / 1000).toFixed(1)}s`
          : `Check complete in ${((Date.now() - started) / 1000).toFixed(1)}s — ` +
              `${analysis.plagiarismPercentage}% plagiarized across ${analysis.totalSentences} passages`
      );

      res.json(analysis);
    } catch (error) {
      if (error?.name === "ZodError") {
        res.status(400).json({ error: error.errors?.[0]?.message ?? "Invalid request" });
        return;
      }
      console.error("Error in plagiarism check:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  });

  /**
   * Print a similarity report.
   *
   * The analysis is re-run rather than accepted from the client: a report is
   * an attestable document, so its numbers have to come from this server.
   *
   * Optionally accepts `overlayToken` to mark the original PDF instead of
   * generating a reprinted report. This preserves the author's formatting.
   */
  app.post("/api/report", async (req, res) => {
    try {
      const { overlayToken, excludeCitations } = req.body ?? {};

      // Two paths: overlay (with token) or full report (with text).
      //
      // El layout del documento original vive en la RAM de la instancia del
      // detector —efímera en Cloud Run—. Si entre la carga y esta descarga la
      // instancia se recicló, murió por memoria o pasó el TTL, el token ya no
      // resuelve. Antes eso era un 409 y el estudiante se quedaba sin informe;
      // ahora cualquier tropiezo del marcado cae al reimpreso de abajo, que
      // solo necesita el texto (el cliente siempre lo envía como respaldo).
      const stored = overlayToken ? takeLayout(overlayToken) : null;

      if (stored) {
        // Overlay path: mark the author's own PDF
        const started = Date.now();
        const meta = req.body?.meta ?? {};
        const includeAi = req.body?.detectAi !== false;

        // El análisis ya se hizo durante la comprobación: se reutiliza en lugar
        // de volver a escanear la web (la caché hace que descargar solo imprima).
        const { analysis } = await analysisForKey(stored.text, excludeCitations);
        const aiResult = includeAi
          ? (await aiForKey(stored.text).catch(() => ({ ai: null }))).ai
          : null;

        const ranges = (analysis.results ?? [])
          .filter((r) => r.similarity >= 15 && Number.isFinite(r.start))
          .map((r, index) => ({
            textStart: r.start,
            textEnd: r.end ?? r.start + r.sentence.length,
            similarity: r.similarity,
            color: classify(r.similarity).color,
            label: String(index + 1),
          }));

        const marked = await overlayHighlights({
          pdfBuffer: stored.buffer,
          layout: stored.layout,
          ranges,
          footer: "Tesis Ecuador · Informe de similitud sobre el documento original",
          onlyMarkedPages: true,
        });

        if (!marked) {
          console.warn("[report] el documento original no admite marcado directo; se imprime reimpreso");
        } else {
          // Summary first, then the submission itself. The summary omits its
          // reprinted body when the original follows, so the text appears once —
          // as the author formatted it, with the matches drawn on top. Only the
          // pages that actually carry a mark travel with the download — a thesis
          // can run past a hundred pages and the report exists to be read, not
          // to reproduce the whole submission a second time.
          const summary = await printWithAppendix(generateReportPdf, {
            analysis,
            text: stored.text,
            meta,
            ai: aiResult,
            // La recomendación de cómo bajar el índice se imprime como anexo final,
            // después de las hojas marcadas del documento original.
            includeTail: false,
            originalPageInfo: { totalPages: marked.pages, keptPages: marked.keptPages },
          });

          const annex = await generateReportTailPdf({ analysis, text: stored.text, meta });
          const pdf = await mergePdfs([summary, marked.buffer, annex]);
          if (!pdf) {
            console.warn("[report] el merge del marcado no produjo PDF; se imprime reimpreso");
          } else {
            console.log(
              `Overlay report generated in ${((Date.now() - started) / 1000).toFixed(1)}s — ` +
                `${marked.marked} passages marked, ${marked.keptPages.length}/${marked.pages} original pages kept, ` +
                `${(pdf.length / 1024).toFixed(0)} KB total`
            );

            sendPdf(res, pdf, `informe-similitud-${verificationCode(stored.text)}.pdf`);
            return;
          }
        }
      } else if (overlayToken) {
        console.warn(
          `[report] overlayToken ${String(overlayToken).slice(0, 8)}… sin layout en memoria ` +
            "(instancia reciclada o TTL vencido); se imprime el informe reimpreso"
        );
      }

      // Text path: generate a full reprinted report (y respaldo del marcado
      // cuando el original ya no está disponible o no admite marcas).
      const { text } = checkTextSchema.parse(req.body);
      const meta = req.body?.meta ?? {};

      const started = Date.now();
      const includeAi = req.body?.detectAi !== false;

      // Reutiliza el análisis de la comprobación en curso (caché por texto) en
      // lugar de volver a escanear la web solo para imprimir el informe.
      const { analysis } = await analysisForKey(text, excludeCitations);
      const aiResult = includeAi
        ? (await aiForKey(text).catch(() => ({ ai: null }))).ai
        : null;

      const pdf = await generateReportPdf({ analysis, text, meta, ai: aiResult });

      console.log(
        `Report generated in ${((Date.now() - started) / 1000).toFixed(1)}s — ` +
          `${(pdf.length / 1024).toFixed(0)} KB, ${analysis.plagiarismPercentage}% index`
      );

      const filename = `informe-similitud-${verificationCode(text)}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", pdf.length);
      res.end(pdf);
    } catch (error) {
      if (error?.name === "ZodError") {
        res.status(400).json({ error: error.errors?.[0]?.message ?? "Invalid request" });
        return;
      }
      console.error("Error generating report:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Report generation failed",
      });
    }
  });

  /**
   * Print the similarity report on top of the author's own PDF.
   *
   * The reprinted `/api/report` reflows the text into its own layout, which
   * is exactly the complaint this route answers: the student's cover page,
   * running footer and tables survive untouched, and the matches are drawn
   * on top of them instead. Only available when `/api/extract` had page
   * geometry to keep — a pasted text or a non-PDF upload has none, and the
   * client is expected to fall back to `/api/report` in that case.
   */
  app.post("/api/report-overlay", async (req, res) => {
    try {
      const { overlayToken, excludeCitations } = req.body ?? {};
      const stored = takeLayout(overlayToken);
      if (!stored) {
        res.status(409).json({
          error:
            "No hay un documento original disponible para marcar. Sube de nuevo el PDF y repite el analisis.",
        });
        return;
      }

      const started = Date.now();
      const { analysis } = await analysisForKey(stored.text, excludeCitations);

      const ranges = (analysis.results ?? [])
        .filter((r) => r.similarity >= 15 && Number.isFinite(r.start))
        .map((r, index) => ({
          textStart: r.start,
          textEnd: r.end ?? r.start + r.sentence.length,
          similarity: r.similarity,
          color: classify(r.similarity).color,
          label: String(index + 1),
        }));

      const result = await overlayHighlights({
        pdfBuffer: stored.buffer,
        layout: stored.layout,
        ranges,
        footer: "Tesis Ecuador . Informe de similitud sobre el documento original",
      });

      if (!result) {
        res.status(409).json({
          error: "El documento original no admite marcado directo. Descarga el informe reimpreso.",
        });
        return;
      }

      console.log(
        `Overlay report generated in ${((Date.now() - started) / 1000).toFixed(1)}s — ` +
          `${result.marked} passages marked over ${result.pages} pages`
      );

      const filename = `original-marcado-${verificationCode(stored.text)}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", result.buffer.length);
      res.end(result.buffer);
    } catch (error) {
      if (error?.name === "ZodError") {
        res.status(400).json({ error: error.errors?.[0]?.message ?? "Invalid request" });
        return;
      }
      console.error("Error generating overlay report:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Overlay report generation failed",
      });
    }
  });

  /**
   * Estimate whether a text was machine-generated.
   *
   * Deliberately a separate endpoint: the result carries different evidentiary
   * weight from a similarity index and must not be read as part of it.
   */
  app.post("/api/ai-detect", async (req, res) => {
    try {
      const { text } = req.body ?? {};
      if (typeof text !== "string" || text.trim().length < 100) {
        res.status(400).json({ error: "Se requiere 'text' con al menos 100 caracteres." });
        return;
      }

      const { ai } = await aiForKey(text);
      res.json(ai);
    } catch (error) {
      console.error("Error in AI detection:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Print the AI-writing report.
   *
   * A separate document from the similarity report, and separately requested:
   * the two carry different evidentiary weight, and issuing them as one PDF let
   * a probabilistic style estimate travel with the authority of a located
   * textual match. The estimate is recomputed here rather than accepted from the
   * client, for the same reason the similarity report re-runs its analysis.
   */
  app.post("/api/ai-report", async (req, res) => {
    try {
      const { overlayToken } = req.body ?? {};
      const meta = req.body?.meta ?? {};
      const started = Date.now();

      // With a token the report is printed over the author's own PDF; the text
      // scored is the one extracted from that file, never whatever the client
      // sends afterwards, or the offsets would no longer match the pages.
      const stored = overlayToken ? takeLayout(overlayToken) : null;
      const text = stored ? stored.text : req.body?.text;

      if (typeof text !== "string" || text.trim().length < 100) {
        res.status(400).json({ error: "Se requiere 'text' con al menos 100 caracteres." });
        return;
      }

      // The document-level estimate is the one that carries weight, so it is
      // computed for every report (reused from cache when the text is already
      // known). The per-block pass runs only when there is a page to draw it
      // on, because it costs a model call per block.
      const { ai } = await aiForKey(text);
      const passages = stored ? await passagesForKey(text) : [];

      let pdf;

      if (stored) {
        const marked = await overlayHighlights({
          pdfBuffer: stored.buffer,
          layout: stored.layout,
          ranges: passages,
          footer: "Tesis Ecuador · Indicio de escritura con IA sobre el documento original",
          onlyMarkedPages: true,
        });

        if (marked) {
          const summary = await printWithAppendix(generateAiReportPdf, {
            ai,
            text,
            meta,
            passages,
            // La guía de reescritura se imprime como anexo final, tras las hojas
            // marcadas del documento original.
            includeTail: false,
            originalPageInfo: { totalPages: marked.pages, keptPages: marked.keptPages },
          });
          const annex = await generateAiReportTailPdf({ ai, text, meta });
          pdf = await mergePdfs([summary, marked.buffer, annex]);
        }
      }

      // No token, an unmarkable file, or a merge that produced nothing: the
      // reprinted report is still a complete report, so it stands in.
      if (!pdf) pdf = await generateAiReportPdf({ ai, text, meta });

      console.log(
        `AI report generated in ${((Date.now() - started) / 1000).toFixed(1)}s — ` +
          `${(pdf.length / 1024).toFixed(0)} KB, ${ai.score ?? "n/d"}% indicator, ` +
          `${passages.length} blocks marked`
      );

      sendPdf(res, pdf, `informe-ia-${verificationCode(text)}.pdf`);
    } catch (error) {
      console.error("Error generating AI report:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "AI report generation failed",
      });
    }
  });

  // -------------------------------------------------------------------------
  // Local corpus
  //
  // Retention is opt-in per submission. Storing a student's work so that later
  // submissions can be checked against it is a policy decision with consent and
  // data-protection consequences, so it never happens as a side effect of
  // running a check.
  // -------------------------------------------------------------------------

  app.get("/api/corpus/stats", (_req, res) => {
    try {
      res.json(corpusStats());
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/corpus/index", (req, res) => {
    try {
      const { text, title, author, url, origin } = req.body ?? {};
      if (typeof text !== "string" || text.trim().length < 200) {
        res.status(400).json({ error: "Se requiere 'text' con al menos 200 caracteres." });
        return;
      }

      const result = indexDocument(text, { title, author, url, origin });
      res.json({ ...result, checksum: checksumOf(text) });
    } catch (error) {
      console.error("Error indexing document:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /** Erasure: a stored submission must be removable on request. */
  app.delete("/api/corpus/:checksum", (req, res) => {
    try {
      const removed = forget(req.params.checksum);
      res.status(removed ? 200 : 404).json({ removed });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/corpus/harvest", async (req, res) => {
    try {
      const { endpoint, set, from, maxRecords } = req.body ?? {};
      if (typeof endpoint !== "string" || !/^https?:\/\//.test(endpoint)) {
        res.status(400).json({ error: "Se requiere 'endpoint' OAI-PMH valido." });
        return;
      }

      const identity = await probeRepository(endpoint);
      const result = await harvestRepository(endpoint, {
        set,
        from,
        maxRecords: Math.min(Number(maxRecords) || 200, 5_000),
      });

      res.json({ repository: identity.name, ...result });
    } catch (error) {
      console.error("Error harvesting repository:", error);
      res.status(502).json({ error: error.message });
    }
  });

  return createServer(app);
}
