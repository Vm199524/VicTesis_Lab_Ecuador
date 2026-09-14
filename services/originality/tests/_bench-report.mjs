/**
 * Banco de tiempos (no forma parte de la suite).
 *
 * Cronometra las etapas que un estudiante espera al pulsar «descargar el
 * informe», sobre una tesis realista de carátula + N páginas de cuerpo, y con el
 * análisis ya en caché —que es el caso normal: el informe se pide justo después
 * de la comprobación—. Sirve para saber qué etapa domina la descarga cuando
 * alguien se queja de que es lenta, y para comprobar que memorizar la extracción
 * evita repetir la conversión de LibreOffice.
 *
 * Uso: node tests/_bench-report.mjs [paginas]
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { buildThesis } from "./_make-pdf.mjs";
import { extractDocumentLayout, extractDocumentText } from "../server/extract.js";
import { overlayHighlights } from "../server/overlay.js";
import {
  generateReportPdf,
  generateReportTailPdf,
  closeBrowser,
  classify,
  verificationCode,
} from "../server/report.js";
import { mergePdfs, originalStartsAt, pageCount } from "../server/reportMerge.js";

const PAGES = Number(process.argv[2]) || 40;

const durations = new Map();
const time = async (label, fn) => {
  const t0 = Date.now();
  const out = await fn();
  const ms = Date.now() - t0;
  durations.set(label, ms);
  console.log(`  ${ms.toString().padStart(6)} ms  ${label}`);
  return out;
};
const ms = (label) => durations.get(label) ?? 0;

console.log(`\nTesis de prueba: caratula + ${PAGES} paginas de cuerpo`);
const thesisPdf = await buildThesis({ pages: PAGES });
console.log(`  ${(thesisPdf.length / 1024).toFixed(0)} KB en memoria\n`);

console.log("Extraccion (la etapa que las descargas repetian sin necesidad):");
const first = await time("1a. extract, primera vez (cache fria)", () =>
  extractDocumentLayout(thesisPdf, "tesis.pdf")
);
const second = await time("1b. extract, mismo archivo (cache caliente)", () =>
  extractDocumentLayout(thesisPdf, "tesis.pdf")
);
console.log(
  `         ${second.layout === first.layout ? "reutilizado" : "recalculado"}` +
    ` — ahorro de ${((ms("1a. extract, primera vez (cache fria)") - ms("1b. extract, mismo archivo (cache caliente)")) / 1000).toFixed(2)}s`
);

const { text, layout, pdfBuffer } = first;

// Un análisis con la forma real, repartido por el documento: es lo que la caché
// por texto devuelve sin volver a consultar los proveedores.
const analysis = (() => {
  const results = [];
  const needle = "estrategias didacticas empleadas por los docentes";
  let at = -1;
  for (let i = 0; i < 24; i++) {
    at = text.indexOf(needle, at + 1);
    if (at < 0) break;
    results.push({
      sentence: text.slice(at, at + 180),
      start: at,
      end: at + 180,
      similarity: 20 + ((i * 7) % 75),
      sources: [{ url: "https://es.wikipedia.org/wiki/Educacion", similarity: 40 }],
      isPlagiarized: i % 3 === 0,
    });
  }
  return {
    plagiarismPercentage: 31,
    overallScore: 28,
    totalSentences: 120,
    plagiarizedSentences: 24,
    analyzedChunks: 12,
    totalChunks: 12,
    sampled: false,
    providers: ["wikipedia-es"],
    results,
  };
})();
console.log(`\n  ${analysis.results.length} coincidencias a marcar\n`);

console.log("Impresion del informe (analisis en cache):");
const marked = await time("2. overlay sobre el original", () =>
  overlayHighlights({
    pdfBuffer,
    layout,
    ranges: analysis.results.map((r, index) => ({
      textStart: r.start,
      textEnd: r.end,
      similarity: r.similarity,
      color: classify(r.similarity).color,
      label: String(index + 1),
    })),
    footer: "Tesis Ecuador · Informe de similitud sobre el documento original",
    onlyMarkedPages: true,
    keepCover: true,
  })
);
console.log(
  `         ${marked.marked} pasajes marcados, ${marked.keptPages.length}/${marked.pages} paginas conservadas`
);

const meta = { title: "Tesis de prueba", author: "Maria Fernanda Quishpe Loor" };

// printWithAppendix: dos pasadas porque el numero de pagina del anexo solo se
// conoce despues de imprimir.
const summaryProbe = await time("3a. resumen (pasada 1)", () =>
  generateReportPdf({ analysis, text, meta, ai: null, includeTail: false, originalPage: 1 })
);
const probePages = await pageCount(summaryProbe);
const summary = await time("3b. resumen (pasada 2)", () =>
  generateReportPdf({
    analysis,
    text,
    meta,
    ai: null,
    includeTail: false,
    originalPage: originalStartsAt(probePages),
  })
);
const annex = await time("4. anexo de recomendaciones", () =>
  generateReportTailPdf({ analysis, text, meta })
);
const pdf = await time("5. merge resumen + original + anexo", () =>
  mergePdfs([summary, marked.buffer, annex])
);

await closeBrowser();

// Lo que el estudiante espera: overlay + las dos pasadas del resumen + anexo + merge.
const printMs =
  ms("2. overlay sobre el original") +
  ms("3a. resumen (pasada 1)") +
  ms("3b. resumen (pasada 2)") +
  ms("4. anexo de recomendaciones") +
  ms("5. merge resumen + original + anexo");
console.log(`\n  Descarga (analisis en cache): ${(printMs / 1000).toFixed(1)}s — ${(pdf.length / 1024 / 1024).toFixed(1)} MB`);

/* ----------------------------- Comprobaciones ---------------------------- */

let fails = 0;
const check = (label, ok, detail = "") => {
  console.log(`  [${ok ? "PASA" : "FALLA"}] ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) fails++;
};

console.log("\nComprobaciones:");
check("la memoria de extraccion devuelve el mismo resultado", second.layout === first.layout);
check(
  "la segunda extraccion es mas rapida",
  ms("1b. extract, mismo archivo (cache caliente)") < ms("1a. extract, primera vez (cache fria)"),
  `${ms("1a. extract, primera vez (cache fria)")}ms -> ${ms("1b. extract, mismo archivo (cache caliente)")}ms`
);

const reread = await extractDocumentText(pdf, "informe.pdf");
check("la caratula del original viaja en el informe", reread.text.includes("UNIVERSIDAD ESTATAL DE MILAGRO"));
check("el autor de la caratula tambien", reread.text.includes("Maria Fernanda Quishpe Loor"));
check("el encabezado corrido del original se conserva", reread.text.includes("Tesis de grado"));
check("no se conservo la tesis entera", reread.meta.pages < marked.pages, `${reread.meta.pages} de ${marked.pages} paginas`);

mkdirSync("docs/muestras", { recursive: true });
writeFileSync("docs/muestras/informe-overlay-bench.pdf", pdf);
console.log("\n  guardado: docs/muestras/informe-overlay-bench.pdf");
console.log("\n" + (fails === 0 ? "BANCO: TODAS PASARON" : `BANCO: ${fails} FALLARON`));
process.exitCode = fails ? 1 : 0;
