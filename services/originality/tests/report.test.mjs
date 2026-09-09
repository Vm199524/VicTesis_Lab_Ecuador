import fs from "node:fs";
import { renderReportHtml, generateReportPdf, closeBrowser, classify, buildRecommendations, aggregateSources, verificationCode } from "../server/report.js";

let fails = 0;
const check = (l, c, d = "") => { console.log(`  [${c?"PASA":"FALLA"}] ${l}${d?" — "+d:""}`); if(!c) fails++; };

const text = `La fotosintesis es un sistema de procesos biologicos mediante el cual los organismos fotosinteticos convierten la energia luminosa en energia quimica. Este proceso resulta fundamental para la vida en el planeta.

Los organismos fotosinteticos almacenan la energia quimica producida en compuestos organicos intracelulares como azucares, glucogeno, celulosa y almidones. La reproducibilidad de estos hallazgos ha sido confirmada por multiples equipos independientes.

En conclusion, el estudio de la fotosintesis sigue siendo un area activa de investigacion con implicaciones para la agricultura y la energia renovable.`;

const analysis = {
  plagiarismPercentage: 42,
  overallScore: 38,
  totalSentences: 3,
  plagiarizedSentences: 1,
  analyzedChunks: 3,
  totalChunks: 3,
  sampled: false,
  results: [
    { sentence: "La fotosintesis es un sistema de procesos biologicos mediante el cual los organismos fotosinteticos convierten la energia luminosa en energia quimica.",
      start: 0, end: 0, similarity: 78,
      sources: [{ url: "https://es.wikipedia.org/wiki/Fotosintesis", similarity: 78, metrics: {} }],
      metrics: { containment: 71, cosine: 22, fingerprint: 55, longestRun: 16 }, isPlagiarized: true },
    { sentence: "Los organismos fotosinteticos almacenan la energia quimica producida en compuestos organicos intracelulares como azucares, glucogeno, celulosa y almidones.",
      start: 213, end: 213, similarity: 44,
      sources: [{ url: "https://en.wikipedia.org/wiki/Photosynthesis", similarity: 44, metrics: {} }],
      metrics: { containment: 18, cosine: 51, fingerprint: 12, longestRun: 4 }, isPlagiarized: false },
    { sentence: "En conclusion, el estudio de la fotosintesis sigue siendo un area activa de investigacion.",
      start: 420, end: 420, similarity: 6, sources: [],
      metrics: { containment: 2, cosine: 6, fingerprint: 0, longestRun: 1 }, isPlagiarized: false },
  ],
};

console.log("\n1. Funciones puras");
check("clasifica bandas", classify(5).id === "low" && classify(42).id === "high" && classify(80).id === "critical");
check("codigo estable", verificationCode(text) === verificationCode(text), verificationCode(text));
const srcs = aggregateSources(analysis.results);
check("agrega fuentes", srcs.length === 2 && srcs[0].best === 78, `${srcs.length} fuentes, top=${srcs[0]?.best}%`);
const recs = buildRecommendations(analysis);
check("genera recomendaciones", recs.length >= 2, recs.map(r => r.title).join(" | "));
check("detecta copia literal", recs.some(r => r.title.includes("literal")));
check("detecta parafrasis", recs.some(r => r.title.includes("arafrasis")));

console.log("\n2. HTML del informe");
const html = renderReportHtml({ analysis, text, meta: { title: "Ensayo sobre fotosintesis", author: "Victor Lluilema", filename: "ensayo.pdf" } });
check("contiene indice", html.includes("42%"));
check("contiene autor", html.includes("Victor Lluilema"));
check("resalta pasajes", html.includes("<mark class=\"hl\""), `${(html.match(/<mark/g)||[]).length} marcas`);
check("incluye descargo", html.includes("no es, por si solo, un"));
check("escapa HTML", !renderReportHtml({ analysis, text: "<script>alert(1)</script> ".repeat(20), meta: {} }).includes("<script>alert(1)"));

console.log("\n3. Impresion a PDF");
const t0 = Date.now();
const pdf = await generateReportPdf({ analysis, text, meta: { title: "Ensayo sobre fotosintesis", author: "Victor Lluilema" } });
const ms = Date.now() - t0;
check("devuelve Buffer", Buffer.isBuffer(pdf));
check("cabecera PDF valida", pdf.subarray(0, 5).toString() === "%PDF-", pdf.subarray(0, 8).toString());
check("tamano razonable", pdf.length > 20_000, `${(pdf.length/1024).toFixed(0)} KB en ${ms}ms`);

fs.mkdirSync("docs/muestras", { recursive: true });
fs.writeFileSync("docs/muestras/informe-ejemplo.pdf", pdf);
console.log(`         guardado en docs/muestras/informe-ejemplo.pdf`);

console.log("\n4. Reutilizacion del navegador");
const t1 = Date.now();
await generateReportPdf({ analysis, text, meta: {} });
const ms2 = Date.now() - t1;
check("segunda impresion mas rapida", ms2 < ms, `${ms}ms -> ${ms2}ms`);

await closeBrowser();
console.log(`\n${fails === 0 ? "FASE 2: TODAS PASARON" : "FASE 2: " + fails + " FALLARON"}`);
process.exitCode = fails ? 1 : 0;
