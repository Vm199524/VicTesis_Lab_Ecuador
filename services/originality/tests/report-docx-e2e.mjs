/**
 * El camino del .docx, de punta a punta y contra el contenedor de producción.
 *
 * Las demás pruebas de este directorio corren sobre el Node de la máquina, y
 * ninguna de ellas puede responder a la pregunta que importa: ¿el informe que
 * descarga un estudiante que trabaja en Word trae SU carátula, SU encabezado y
 * los colores encima? En esta máquina no hay LibreOffice, así que el camino
 * DOCX→PDF solo existe dentro de la imagen; probarlo exige hablar con un
 * contenedor.
 *
 * El contenedor es el mismo que despliega Cloud Run —misma base, mismas
 * fuentes, mismo `soffice`—, de modo que un fallo de conversión por una fuente
 * ausente o un perfil que no se puede escribir aparece aquí y no en producción.
 *
 * Uso:
 *   docker run -d --rm -p 5099:8080 -e PORT=8080 -e PROVIDER_TIMEOUT_MS=1 \
 *     -e SEMANTIC_DISABLED=1 --name originality-e2e originality-test
 *   E2E_BASE=http://127.0.0.1:5099/api node tests/report-docx-e2e.mjs
 *
 * Los proveedores externos se abortan al milisegundo: el análisis lo resuelve
 * el corpus local que la propia prueba indexa, así que lo que se mide es el
 * costo de imprimir el informe —que es lo que el estudiante espera— y no el de
 * salir a la web, que ya se paga en la comprobación.
 */
import { buildDocx, PARRAFOS, ENCABEZADO } from "./_make-docx.mjs";
import { extractDocumentText } from "../server/extract.js";

const BASE = (process.env.E2E_BASE || "http://127.0.0.1:5099/api").replace(/\/$/, "");
const AUTOR = "Victor Manuel LLuilema Pisco";
const UNIVERSIDAD = "UNIVERSIDAD ESTATAL DE MILAGRO";

let fails = 0;
const check = (label, condition, detail = "") => {
  console.log(`  [${condition ? "PASA" : "FALLA"}] ${label}${detail ? " — " + detail : ""}`);
  if (!condition) fails++;
};

const timed = async (label, fn) => {
  const t0 = Date.now();
  const out = await fn();
  const ms = Date.now() - t0;
  console.log(`         ${(ms / 1000).toFixed(1)}s  ${label}`);
  return { out, ms };
};

/** Baja un informe y devuelve su PDF, la procedencia y el tiempo que tardó. */
async function download(url, body) {
  const { out: response, ms } = await timed(`POST ${url}`, () =>
    fetch(`${BASE}${url}`, { method: "POST", ...body })
  );
  const buffer = Buffer.from(await response.arrayBuffer());
  return { status: response.status, source: response.headers.get("x-report-source"), buffer, ms };
}

/** El texto que un lector encontraría en el PDF entregado. */
const textOf = (pdfBuffer) => extractDocumentText(pdfBuffer, "informe.pdf").then((r) => r.text);

/**
 * Colores de relleno por página.
 *
 * Se lee la lista de operadores y no el texto: una marca es una operación de
 * relleno con un color, no un carácter. El original de prueba está escrito en
 * negro, así que cualquier relleno saturado en sus páginas es una coincidencia
 * marcada —el resumen lleva sus propios colores y por eso solo se miran las
 * páginas posteriores a la carátula, que es donde empieza el anexo marcado.
 */
async function fillsPerPage(pdfBuffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(pdfBuffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    verbosity: 0,
  });
  const doc = await loadingTask.promise;

  const pages = [];
  for (let number = 1; number <= doc.numPages; number++) {
    const page = await doc.getPage(number);
    const content = await page.getTextContent();
    const ops = await page.getOperatorList();

    const fills = [];
    for (let index = 0; index < ops.fnArray.length; index++) {
      if (ops.fnArray[index] !== pdfjs.OPS.setFillRGBColor) continue;
      // pdfjs normaliza `rg` a la notación CSS del contenido (`#rrggbb`), no a
      // la tripleta 0..1 del operador.
      const hex = /^#?([0-9a-f]{6})$/i.exec(String(ops.argsArray[index]));
      if (!hex) continue;
      const [r, g, b] = [0, 2, 4].map((at) => parseInt(hex[1].slice(at, at + 2), 16));
      // Saturación: un gris tiene los tres canales iguales, un resaltado no.
      fills.push((Math.max(r, g, b) - Math.min(r, g, b)) / 255);
    }

    pages.push({ text: content.items.map((item) => item.str).join(" "), fills });
  }
  await loadingTask.destroy();
  return pages;
}

/* ---------------------------------- Casos --------------------------------- */

console.log(`\nContenedor: ${BASE}`);

const limits = await fetch(`${BASE}/limits`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
if (!limits) {
  console.error("  El servicio no responde. ¿Está el contenedor levantado?");
  process.exit(1);
}
console.log(`  Servicio vivo — máx. ${limits.maxChars.toLocaleString("es")} caracteres\n`);

// El corpus local hace de fuente citada: se indexan los párrafos sueltos, y no
// el documento entero, porque el analizador excluye del corpus el texto que
// está analizando y una coincidencia consigo mismo no sería una coincidencia.
console.log("Preparacion: indexar la fuente citada");
for (const [index, parrafo] of PARRAFOS.entries()) {
  const response = await fetch(`${BASE}/corpus/index`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: parrafo, title: `Fuente ${index + 1}`, author: AUTOR }),
  });
  if (!response.ok) {
    console.error(`  no se pudo indexar la fuente ${index + 1}: ${response.status}`);
    process.exit(1);
  }
}
console.log(`  ${PARRAFOS.length} fuentes en el corpus\n`);

console.log("1. Subida del .docx (conversion LibreOffice + geometria)");
const docx = buildDocx();
const form = new FormData();
form.append("file", new Blob([docx]), "tesis.docx");
const { out: extracted, ms: extractMs } = await timed("POST /extract", () =>
  fetch(`${BASE}/extract`, { method: "POST", body: form }).then((r) => r.json())
);

check("la extraccion devuelve texto", extracted.characters > 1000, `${extracted.characters} caracteres`);
check(
  "deja un token de marcado (hubo geometria de pagina)",
  typeof extracted.overlayToken === "string" && extracted.overlayToken.length > 0,
  extracted.overlayToken ? "token presente" : "sin token: no habría carátula en el informe"
);
check(
  "la conversion produjo varias paginas",
  Number(extracted.meta?.pages ?? 0) > 1,
  `${extracted.meta?.pages ?? "?"} paginas en ${(extractMs / 1000).toFixed(1)}s`
);

console.log("\n2. Informe de similitud sobre el documento original");
const first = await download("/report", {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: extracted.text,
    excludeCitations: false,
    overlayToken: extracted.overlayToken,
  }),
});
check("responde 200", first.status === 200, `status=${first.status}`);
check("la cabecera anuncia el original marcado", first.source === "marked", String(first.source));

const firstText = await textOf(first.buffer);
check("la caratula del .docx viaja en el informe", firstText.includes(UNIVERSIDAD));
check("el autor de la caratula tambien", firstText.includes(AUTOR));
check("el encabezado corrido del .docx se conserva", firstText.includes(ENCABEZADO));
check("cuerpo del documento presente", firstText.includes("Cronbach"));
check(
  "el informe pesa lo que un documento, no lo que un volcado",
  first.buffer.length > 50_000,
  `${(first.buffer.length / 1024 / 1024).toFixed(2)} MB`
);

console.log("\n3. Los colores, encima del original");
const pages = await fillsPerPage(first.buffer);
const coverAt = pages.findIndex((page) => page.text.includes(UNIVERSIDAD));
check("la caratula se localiza dentro del informe", coverAt >= 0, `pagina ${coverAt + 1}`);

const bodyFills = pages.slice(coverAt + 1).flatMap((page) => page.fills).filter((s) => s > 0.2);
check(
  "el original llega con los colores dibujados encima",
  bodyFills.length > 0,
  `${bodyFills.length} rellenos saturados tras la caratula`
);
check(
  "el resumen conserva su propio color",
  pages.slice(0, coverAt).some((page) => page.fills.some((s) => s > 0.2))
);
check(
  "el informe no reproduce la tesis entera en el resumen",
  pages.length > 0 && pages.length < 12,
  `${pages.length} paginas en total`
);

console.log("\n4. La segunda descarga: lo que espera el estudiante");
const second = await download("/report", {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: extracted.text,
    excludeCitations: false,
    detectAi: true,
    overlayToken: extracted.overlayToken,
  }),
});
check("responde 200", second.status === 200, `status=${second.status}`);
check("sigue marcado sobre el original", second.source === "marked", String(second.source));
check(
  "la descarga repetida no rehace el trabajo caro",
  second.ms < first.ms,
  `${(first.ms / 1000).toFixed(1)}s -> ${(second.ms / 1000).toFixed(1)}s`
);
check(
  "y baja en un tiempo razonable",
  second.ms < 25_000,
  `${(second.ms / 1000).toFixed(1)}s`
);

const secondText = await textOf(second.buffer);
check("la caratula sigue ahi en la segunda descarga", secondText.includes(UNIVERSIDAD));
check("el encabezado tambien", secondText.includes(ENCABEZADO));

console.log("\n5. Informe de IA: mismo contrato");
const ai = await download("/ai-report", {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: extracted.text, overlayToken: extracted.overlayToken }),
});
check("responde 200", ai.status === 200, `status=${ai.status}`);
check("viene marcado sobre el original", ai.source === "marked", String(ai.source));
const aiText = await textOf(ai.buffer);
check("el informe de IA lleva la caratula", aiText.includes(UNIVERSIDAD));
check("y el encabezado", aiText.includes(ENCABEZADO));

console.log("\n6. Token caducado: 409 explicito, sin reimpreso silencioso");
const stale = await fetch(`${BASE}/report`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: extracted.text, overlayToken: "00000000-0000-0000-0000-000000000000" }),
});
const staleBody = await stale.json().catch(() => ({}));
check("responde 409", stale.status === 409, `status=${stale.status}`);
check("el motivo es reconocible por el cliente", staleBody.code === "overlay-expired", String(staleBody.code));

console.log(`\nDOCX E2E${fails === 0 ? ": TODAS PASARON" : `: ${fails} FALLARON`}`);
process.exitCode = fails ? 1 : 0;
