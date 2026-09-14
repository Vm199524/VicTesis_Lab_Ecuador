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
import { indexDocument, forget, corpusStats, checksumOf, persistCorpus } from "./corpus.js";
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
 * Acepta un archivo adjunto, pero solo cuando la petición lo trae.
 *
 * Un informe se pide de dos maneras: con el `overlayToken` que dejó la subida
 * —lo normal, y no viaja ni un byte del documento— o reenviando el archivo,
 * que es lo que hace el cliente cuando la instancia que lo extrajo ya no
 * existe. Las peticiones JSON de toda la vida no pasan por aquí: preguntar por
 * el tipo de contenido antes de invocar a multer evita que un cuerpo JSON se
 * interprete como un formulario vacío.
 *
 * @returns {Promise<Error|null>} El error de subida, o null si no hubo.
 */
function receiveFile(req, res) {
  return new Promise((resolve) => {
    if (!req.is("multipart/form-data")) {
      resolve(null);
      return;
    }
    upload.single("file")(req, res, (error) => resolve(error ?? null));
  });
}

/**
 * Los campos de un formulario llegan como texto.
 *
 * Un `multipart/form-data` no distingue `true` de `"true"`, así que un booleano
 * que llegue por ahí hay que interpretarlo; el valor por defecto cubre el campo
 * ausente, que en JSON y en formulario se ven igual.
 */
function asBoolean(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return value === true || value === "true" || value === "1" || value === 1;
}

/** `meta` viaja como objeto en JSON y como texto JSON dentro de un formulario. */
function parseMeta(value) {
  if (value && typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Descarga un archivo subido para marcar sobre él, o explica por qué no se pudo.
 *
 * Se devuelve también el texto cuando la conversión no dio geometría —un .docx
 * sin LibreOffice, o uno tan largo que hubo que recortarlo—: en ese caso el
 * informe reimpreso sigue siendo un informe completo, y reenviar el archivo no
 * cambiaría nada, así que el llamador cae a él en lugar de pedir un reintento.
 *
 * @returns {Promise<{buffer: Buffer, layout: object, text: string, filename: string}|{text: string}>}
 */
async function originalFromUpload(file) {
  const { text, layout, pdfBuffer } = await extractDocumentLayout(file.buffer, file.originalname);

  // Mismo corte que aplica `/api/extract`, y por el mismo motivo que allí: el
  // análisis no admite más de `maxChars`, y los desplazamientos que devuelve
  // sobre ese prefijo siguen cayendo sobre las primeras páginas de la maqueta.
  const clipped = text.length > LIMITS.maxChars ? text.slice(0, LIMITS.maxChars) : text;

  // Sin geometría no hay coordenadas que marcar y el llamador imprime el
  // reimpreso; con ella, el informe lleva las hojas del original marcadas.
  if (!layout || !pdfBuffer) return { text: clipped };

  return { buffer: pdfBuffer, layout, text: clipped, filename: file.originalname };
}

/** Las coincidencias que se dibujan sobre el original, con su banda de color. */
function overlayRanges(analysis) {
  return (analysis.results ?? [])
    .filter((r) => r.similarity >= 15 && Number.isFinite(r.start))
    .map((r, index) => ({
      textStart: r.start,
      textEnd: r.end ?? r.start + r.sentence.length,
      similarity: r.similarity,
      color: classify(r.similarity).color,
      label: String(index + 1),
    }));
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

/**
 * Vacía la caché de análisis.
 *
 * Un análisis depende del corpus local: indexar o borrar un documento cambia
 * las coincidencias que arrojaría. Sin esto, un documento suprimido seguiría
 * apareciendo como fuente hasta que venciera su TTL —media hora—, y el derecho
 * de supresión, que existe justamente para retirar un trabajo ajeno, quedaría
 * en entredicho dentro de la misma instancia que lo conserva.
 *
 * Se vacía entera y no por entradas porque averiguar cuáles dependían del
 * documento tocado exige reproducir la búsqueda que la caché venía a evitar; el
 * corpus cambia por acciones puntuales —indexar, cosechar, borrar— y el precio
 * de la siguiente comprobación es el de siempre, no uno añadido.
 */
function clearAnalysisCache() {
  analysisCache.clear();
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

/**
 * El informe de similitud completo: resumen, original marcado y anexo.
 *
 * El resumen no reimprime el cuerpo del documento —el original viene detrás con
 * los colores encima— así que el texto aparece una sola vez, tal como lo
 * escribió el autor, y solo viajan las hojas que llevan alguna marca más la
 * carátula, que es la que identifica de qué trabajo es el informe.
 *
 * @returns {Promise<{pdf: Buffer, marked: object}|null>} null cuando el
 *   documento no admite marcado, y el llamador imprime el reimpreso.
 */
async function printSimilarityReport({ original, analysis, meta, aiResult }) {
  const marked = await overlayHighlights({
    pdfBuffer: original.buffer,
    layout: original.layout,
    ranges: overlayRanges(analysis),
    footer: "Tesis Ecuador · Informe de similitud sobre el documento original",
    onlyMarkedPages: true,
    keepCover: true,
  });
  if (!marked) return null;

  const summary = await printWithAppendix(generateReportPdf, {
    analysis,
    text: original.text,
    meta,
    ai: aiResult,
    // La recomendación de cómo bajar el índice se imprime como anexo final,
    // después de las hojas marcadas del documento original.
    includeTail: false,
    originalPageInfo: {
      totalPages: marked.pages,
      keptPages: marked.keptPages,
      markedPages: marked.markedPages,
    },
  });

  const annex = await generateReportTailPdf({ analysis, text: original.text, meta });
  const pdf = await mergePdfs([summary, marked.buffer, annex]);
  return pdf ? { pdf, marked } : null;
}

/**
 * El informe de escritura con IA: resumen, original marcado y guía de reescritura.
 *
 * Mismo esqueleto que el de similitud, pero lo que se dibuja sobre el original
 * son los bloques con indicio de IA, no las coincidencias con fuentes: son dos
 * preguntas distintas y el lector no debe confundir una marca con la otra.
 */
async function printAiReport({ original, ai, text, meta, passages }) {
  const marked = await overlayHighlights({
    pdfBuffer: original.buffer,
    layout: original.layout,
    ranges: passages,
    footer: "Tesis Ecuador · Indicio de escritura con IA sobre el documento original",
    onlyMarkedPages: true,
    // La carátula viaja siempre: es la que dice de qué trabajo es el informe.
    keepCover: true,
  });
  if (!marked) return null;

  const summary = await printWithAppendix(generateAiReportPdf, {
    ai,
    text,
    meta,
    passages,
    // La guía de reescritura se imprime como anexo final, tras las hojas
    // marcadas del documento original.
    includeTail: false,
    originalPageInfo: {
      totalPages: marked.pages,
      keptPages: marked.keptPages,
      markedPages: marked.markedPages,
    },
  });

  const annex = await generateAiReportTailPdf({ ai, text, meta });
  const pdf = await mergePdfs([summary, marked.buffer, annex]);
  return pdf ? { pdf, marked } : null;
}

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
        // and offered whenever there is page geometry to draw on.
        //
        // Un texto recortado al límite de caracteres también sirve: el recorte
        // es un prefijo del documento, así que los desplazamientos que devuelve
        // el análisis siguen cayendo sobre las primeras páginas de la maqueta.
        // Lo único que se pierde son las marcas más allá del corte, que nunca
        // llegaron a analizarse. Antes se renunciaba al marcado entero en ese
        // caso y una tesis completa —más larga que el límite— descargaba su
        // informe reimpreso como texto libre, sin carátula ni encabezados.
        const overlayToken = layout
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
   * The author's own document is marked and attached when it can be had —
   * either from the `overlayToken` left by `/api/extract`, or from the file
   * itself when the client re-sends it (see `receiveFile`). Without either,
   * or when the document carries no page geometry, the report is reprinted
   * from the text alone.
   */
  app.post("/api/report", async (req, res) => {
    try {
      const uploadError = await receiveFile(req, res);
      if (uploadError) {
        const tooLarge = uploadError.code === "LIMIT_FILE_SIZE";
        res.status(400).json({
          error: tooLarge
            ? `File exceeds the ${Math.round(UPLOAD_LIMITS.maxBytes / 1024 / 1024)}MB limit.`
            : uploadError.message,
        });
        return;
      }

      const excludeCitations = asBoolean(req.body?.excludeCitations, false);
      const meta = parseMeta(req.body?.meta);
      const includeAi = asBoolean(req.body?.detectAi, true);
      const token = typeof req.body?.overlayToken === "string" ? req.body.overlayToken : "";
      const started = Date.now();

      // El documento se reúne de la petición misma cuando viene adjunto: extraer
      // y marcar en una sola petición quita de en medio el viaje de ida y vuelta
      // que dejaba al token en una instancia y a la descarga en otra.
      let original = null;
      let fallbackText = null;

      if (req.file) {
        const uploaded = await originalFromUpload(req.file);
        if (uploaded.layout) original = uploaded;
        else fallbackText = uploaded.text;
      } else if (token) {
        original = takeLayout(token);
        if (!original) {
          // El layout vive en la RAM de una instancia efímera: que ya no esté no
          // significa que el documento no se pueda marcar, sino que la instancia
          // que lo extrajo se recicló. Antes esto degradaba en silencio al
          // reimpreso y el estudiante recibía un informe sin su carátula sin que
          // nadie se enterara; ahora se responde 409 con el motivo y el cliente
          // reenvía el archivo. El marcado se resuelve entonces en esa única
          // petición, sin depender de que le toque al mismo contenedor.
          res.status(409).json({
            error: "El documento original ya no está disponible. Reenvialo para marcarlo.",
            code: "overlay-expired",
          });
          return;
        }
      }

      const text = original?.text ?? fallbackText ?? req.body?.text;
      const { text: analysed } = checkTextSchema.parse({ text, excludeCitations });

      // Reutiliza el análisis de la comprobación en curso (caché por texto) en
      // lugar de volver a escanear la web solo para imprimir el informe.
      const { analysis } = await analysisForKey(analysed, excludeCitations);
      const aiResult = includeAi
        ? (await aiForKey(analysed).catch(() => ({ ai: null }))).ai
        : null;

      if (original) {
        const built = await printSimilarityReport({ original, analysis, meta, aiResult });
        if (built) {
          console.log(
            `Overlay report generated in ${((Date.now() - started) / 1000).toFixed(1)}s — ` +
              `${built.marked.marked} passages marked, ` +
              `${built.marked.keptPages.length}/${built.marked.pages} original pages kept, ` +
              `${(built.pdf.length / 1024).toFixed(0)} KB total`
          );
          res.setHeader("X-Report-Source", "marked");
          sendPdf(res, built.pdf, `informe-similitud-${verificationCode(analysed)}.pdf`);
          return;
        }
        console.warn("[report] el documento original no admite marcado directo; se imprime reimpreso");
      }

      // Text path: generate a full reprinted report (y respaldo del marcado
      // cuando el original no está disponible o no admite marcas).
      const pdf = await generateReportPdf({ analysis, text: analysed, meta, ai: aiResult });

      console.log(
        `Report generated in ${((Date.now() - started) / 1000).toFixed(1)}s — ` +
          `${(pdf.length / 1024).toFixed(0)} KB, ${analysis.plagiarismPercentage}% index`
      );

      res.setHeader("X-Report-Source", "reprinted");
      sendPdf(res, pdf, `informe-similitud-${verificationCode(analysed)}.pdf`);
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
      const uploadError = await receiveFile(req, res);
      if (uploadError) {
        const tooLarge = uploadError.code === "LIMIT_FILE_SIZE";
        res.status(400).json({
          error: tooLarge
            ? `File exceeds the ${Math.round(UPLOAD_LIMITS.maxBytes / 1024 / 1024)}MB limit.`
            : uploadError.message,
        });
        return;
      }

      const meta = parseMeta(req.body?.meta);
      const token = typeof req.body?.overlayToken === "string" ? req.body.overlayToken : "";
      const started = Date.now();

      // Con token o con archivo, el informe se imprime sobre el PDF del autor y
      // el texto puntuado es el que salió de ese archivo —nunca el que el
      // cliente mande después—, o los desplazamientos ya no casarían con las
      // páginas. Sin ninguno de los dos, se puntúa el texto pegado a mano.
      let original = null;
      let fallbackText = null;

      if (req.file) {
        const uploaded = await originalFromUpload(req.file);
        if (uploaded.layout) original = uploaded;
        else fallbackText = uploaded.text;
      } else if (token) {
        original = takeLayout(token);
        if (!original) {
          // Mismo motivo que en `/api/report`: la instancia que extrajo el
          // archivo ya no existe. Se pide reenviarlo en lugar de entregar en
          // silencio un informe sin la carátula del trabajo.
          res.status(409).json({
            error: "El documento original ya no está disponible. Reenvialo para marcarlo.",
            code: "overlay-expired",
          });
          return;
        }
      }

      const text = original?.text ?? fallbackText ?? req.body?.text;

      if (typeof text !== "string" || text.trim().length < 100) {
        res.status(400).json({ error: "Se requiere 'text' con al menos 100 caracteres." });
        return;
      }

      // The document-level estimate is the one that carries weight, so it is
      // computed for every report (reused from cache when the text is already
      // known). The per-block pass runs only when there is a page to draw it
      // on, because it costs a model call per block.
      const { ai } = await aiForKey(text);
      const passages = original ? await passagesForKey(text) : [];

      let pdf;
      let source = "reprinted";

      if (original) {
        const built = await printAiReport({ original, ai, text, meta, passages });
        if (built) {
          pdf = built.pdf;
          source = "marked";
        }
      }

      // No token, an unmarkable file, or a merge that produced nothing: the
      // reprinted report is still a complete report, so it stands in.
      if (!pdf) pdf = await generateAiReportPdf({ ai, text, meta });

      console.log(
        `AI report generated in ${((Date.now() - started) / 1000).toFixed(1)}s — ` +
          `${(pdf.length / 1024).toFixed(0)} KB, ${ai.score ?? "n/d"}% indicator, ` +
          `${passages.length} blocks marked, ${source}`
      );

      res.setHeader("X-Report-Source", source);
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

  app.post("/api/corpus/index", async (req, res) => {
    try {
      const { text, title, author, url, origin } = req.body ?? {};
      if (typeof text !== "string" || text.trim().length < 200) {
        res.status(400).json({ error: "Se requiere 'text' con al menos 200 caracteres." });
        return;
      }

      const result = indexDocument(text, { title, author, url, origin });
      clearAnalysisCache();
      await persistCorpus();
      res.json({ ...result, checksum: checksumOf(text) });
    } catch (error) {
      console.error("Error indexing document:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /** Erasure: a stored submission must be removable on request. */
  app.delete("/api/corpus/:checksum", async (req, res) => {
    try {
      const removed = forget(req.params.checksum);
      if (removed) {
        clearAnalysisCache();
        await persistCorpus();
      }
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

      clearAnalysisCache();
      await persistCorpus();
      res.json({ repository: identity.name, ...result });
    } catch (error) {
      console.error("Error harvesting repository:", error);
      res.status(502).json({ error: error.message });
    }
  });

  return createServer(app);
}
