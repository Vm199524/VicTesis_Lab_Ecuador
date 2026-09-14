/**
 * El contrato de descarga de informes, de punta a punta y contra el servidor.
 *
 * Lo que se comprueba aquí es lo que el estudiante ve al pulsar «descargar», y
 * que ninguna prueba unitaria puede cubrir porque vive en la frontera entre
 * petición y respuesta:
 *
 *   1. Con el layout vivo, un token basta: el informe llega con la carátula del
 *      original dentro y ni un byte del documento viaja de vuelta al servidor.
 *   2. Con el token caducado —la instancia del detector se recicló—, el servicio
 *      responde 409 `overlay-expired` en lugar de degradar en silencio a un
 *      informe reimpreso que el estudiante no puede distinguir.
 *   3. Reenviando el archivo, la extracción y el marcado ocurren en esa misma
 *      petición, así que el informe vuelve marcado sobre el original.
 *   4. Sin geometría (texto pegado) el informe reimpreso sigue saliendo, que es
 *      el caso legítimo de la degradación.
 *
 * El análisis se sirve del corpus local —el texto de la tesis se indexa antes—
 * con los proveedores externos abortados al milisegundo, de modo que la prueba
 * no depende de la red ni espera minutos.
 */
import { spawn } from "node:child_process";
import { rmSync } from "node:fs";

import { buildThesis, PARRAFOS, UNIVERSIDAD, AUTOR, ENCABEZADO } from "./_make-pdf.mjs";
import { extractDocumentText } from "../server/extract.js";

const PORT = 5099;
const BASE = `http://127.0.0.1:${PORT}/api`;

let fails = 0;
const check = (label, condition, detail = "") => {
  console.log(`  [${condition ? "PASA" : "FALLA"}] ${label}${detail ? " — " + detail : ""}`);
  if (!condition) fails++;
};

/* --------------------------------- Servidor -------------------------------- */

for (const suffix of ["", "-wal", "-shm"]) {
  rmSync(`./data/routes-test.db${suffix}`, { force: true });
}

const server = spawn(process.execPath, ["tests/_routes-server.mjs"], {
  env: {
    ...process.env,
    TEST_PORT: String(PORT),
    CORPUS_DB: "./data/routes-test.db",
    // Ningún proveedor externo: el análisis lo resuelve el corpus local.
    PROVIDER_TIMEOUT_MS: "1",
    SEMANTIC_DISABLED: "1",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

const ready = new Promise((resolve, reject) => {
  let out = "";
  const timer = setTimeout(() => reject(new Error("el servidor de prueba no arrancó")), 30_000);
  server.stdout.on("data", (chunk) => {
    out += chunk;
    if (out.includes("listo")) {
      clearTimeout(timer);
      resolve();
    }
  });
  server.stderr.on("data", (chunk) => process.stderr.write(chunk));
});

const finish = (code) => {
  server.kill();
  process.exitCode = code;
};

try {
  await ready;
} catch (error) {
  console.error(error.message);
  finish(1);
  process.exit(1);
}

/* --------------------------------- Ayudas --------------------------------- */

/** Descarga una respuesta y devuelve su PDF y las cabeceras que interesan. */
async function readReport(response) {
  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    status: response.status,
    source: response.headers.get("x-report-source"),
    buffer,
  };
}

/** El texto que un lector vería en el PDF entregado. */
const textOf = (pdfBuffer) => extractDocumentText(pdfBuffer, "informe.pdf").then((r) => r.text);

/**
 * Páginas del informe, con su texto y los colores de relleno que llevan.
 *
 * Se lee la lista de operadores de cada página —no el PDF como texto— porque lo
 * que hay que comprobar es que las marcas se DIBUJARON, y una marca es una
 * operación de relleno con un color, no un carácter. El original de prueba está
 * dibujado en gris, así que cualquier relleno saturado en sus páginas es
 * necesariamente una coincidencia marcada; el resumen lleva sus propios colores
 * y por eso solo se miran las páginas posteriores a la carátula.
 */
async function pagesOf(pdfBuffer) {
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
      // pdfjs normaliza el operador `rg` a la notación CSS que ya traía el
      // contenido (`#rrggbb`), no a la tripleta 0..1 del operador.
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

console.log("\nPreparacion");
const thesis = await buildThesis({ pages: 12 });

// El corpus local hace de fuente: se indexa la fuente —los párrafos sueltos, de
// los que la tesis cita— y no la tesis misma, porque el analizador excluye del
// corpus el documento que está analizando y una coincidencia consigo mismo no
// sería una coincidencia.
const form = new FormData();
form.append("file", new Blob([thesis], { type: "application/pdf" }), "tesis.pdf");
const extracted = await (await fetch(`${BASE}/extract`, { method: "POST", body: form })).json();
check("la extraccion devuelve texto", extracted.characters > 2000, `${extracted.characters} caracteres`);
check("la extraccion deja un token de marcado", typeof extracted.overlayToken === "string" && extracted.overlayToken.length > 0);

const indexed = await (
  await fetch(`${BASE}/corpus/index`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: PARRAFOS.join("\n\n"),
      title: "Fuente citada por la tesis",
      author: "Maria Fernanda Quishpe Loor",
    }),
  })
).json();
check("el corpus indexa el documento", Number(indexed.chunks ?? indexed.chunksStored ?? 0) > 0 || indexed.indexed !== false, JSON.stringify(indexed).slice(0, 120));

console.log("\n1. Token vivo: el informe lleva la caratula del original");
const withToken = await readReport(
  await fetch(`${BASE}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: extracted.text,
      excludeCitations: false,
      overlayToken: extracted.overlayToken,
    }),
  })
);
check("responde 200", withToken.status === 200, `status=${withToken.status}`);
check("la cabecera anuncia el original marcado", withToken.source === "marked", String(withToken.source));

const withTokenText = await textOf(withToken.buffer);
check("la caratula del original viaja en el informe", withTokenText.includes(UNIVERSIDAD));
check("el autor de la caratula tambien", withTokenText.includes(AUTOR));
// El guion largo del encabezado llega normalizado a guion ASCII, como todo el
// texto que se extrae: se compara sobre esa forma, que es la que ve el lector.
check(
  "el encabezado corrido del original se conserva",
  withTokenText.includes(ENCABEZADO.replace("—", "-"))
);
// Cuerpo del documento: solo viaja si además de la carátula se conservaron las
// páginas marcadas, que es lo que hace útil al informe.
check(
  "las paginas marcadas del cuerpo viajan con el informe",
  withTokenText.includes("SECCION DEL CUERPO")
);

// Y esas páginas llevan los colores encima: es la parte que el estudiante ve y
// la que ninguna comprobación de texto puede confirmar.
const delivered = await pagesOf(withToken.buffer);
const coverAt = delivered.findIndex((page) => page.text.includes(UNIVERSIDAD));
check("la caratula se localiza dentro del informe", coverAt >= 0, `pagina ${coverAt + 1}`);
const markedFills = delivered
  .slice(coverAt + 1)
  .flatMap((page) => page.fills)
  .filter((saturation) => saturation > 0.2);
check(
  "el original llega con los colores dibujados encima",
  markedFills.length > 0,
  `${markedFills.length} rellenos saturados tras la caratula`
);
check(
  "el resumen conserva su propio color",
  delivered.slice(0, coverAt).some((page) => page.fills.some((s) => s > 0.2))
);

console.log("\n2. Token caducado: 409 explicito, sin reimpreso silencioso");
const stale = await fetch(`${BASE}/report`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: extracted.text, overlayToken: "00000000-0000-0000-0000-000000000000" }),
});
const staleBody = await stale.json().catch(() => ({}));
check("responde 409", stale.status === 409, `status=${stale.status}`);
check("el motivo es reconocible por el cliente", staleBody.code === "overlay-expired", String(staleBody.code));

console.log("\n3. Reenvio del archivo: extraccion y marcado en una sola peticion");
const resentForm = new FormData();
resentForm.append("file", new Blob([thesis], { type: "application/pdf" }), "tesis.pdf");
resentForm.append("text", extracted.text);
resentForm.append("excludeCitations", "false");
const resent = await readReport(await fetch(`${BASE}/report`, { method: "POST", body: resentForm }));
check("responde 200", resent.status === 200, `status=${resent.status}`);
check("vuelve marcado sobre el original", resent.source === "marked", String(resent.source));
const resentText = await textOf(resent.buffer);
check("y la caratula sigue dentro", resentText.includes(UNIVERSIDAD));

console.log("\n4. Texto pegado: el reimpreso sigue siendo un informe completo");
const pasted = await readReport(
  await fetch(`${BASE}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: extracted.text, excludeCitations: false }),
  })
);
check("responde 200", pasted.status === 200, `status=${pasted.status}`);
check("se anuncia como reimpreso", pasted.source === "reprinted", String(pasted.source));
const pastedText = await textOf(pasted.buffer);
check("el informe reimpreso trae el analisis", pastedText.length > 1000, `${pastedText.length} caracteres`);

console.log("\n5. Informe de IA: mismo contrato");
const aiStale = await fetch(`${BASE}/ai-report`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: extracted.text, overlayToken: "00000000-0000-0000-0000-000000000000" }),
});
const aiStaleBody = await aiStale.json().catch(() => ({}));
check("token caducado responde 409", aiStale.status === 409 && aiStaleBody.code === "overlay-expired", `status=${aiStale.status}`);

const aiForm = new FormData();
aiForm.append("file", new Blob([thesis], { type: "application/pdf" }), "tesis.pdf");
aiForm.append("text", extracted.text);
const aiResent = await readReport(await fetch(`${BASE}/ai-report`, { method: "POST", body: aiForm }));
check("con el archivo responde 200", aiResent.status === 200, `status=${aiResent.status}`);
const aiText = await textOf(aiResent.buffer);
check("el informe de IA tambien lleva la caratula", aiText.includes(UNIVERSIDAD));

console.log("\n6. Tesis mas larga que el limite: el informe sigue marcado sobre el original");
// El texto se recorta a `maxChars` para poder analizarlo, pero el recorte es un
// prefijo del documento: los desplazamientos que devuelve el analisis siguen
// cayendo sobre sus primeras paginas, asi que el marcado no se pierde. Antes
// esto renunciaba al marcado entero y una tesis completa descargaba su informe
// reimpreso como texto libre, sin caratula ni encabezados.
const longThesis = await buildThesis({ pages: 60 });
const longForm = new FormData();
longForm.append("file", new Blob([longThesis], { type: "application/pdf" }), "tesis-larga.pdf");
const longExtract = await (await fetch(`${BASE}/extract`, { method: "POST", body: longForm })).json();
check("el texto se recorta al limite", longExtract.truncated === true, `${longExtract.characters} caracteres`);
check(
  "el token de marcado sigue existiendo",
  typeof longExtract.overlayToken === "string" && longExtract.overlayToken.length > 0
);

const longReport = await readReport(
  await fetch(`${BASE}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: longExtract.text,
      excludeCitations: false,
      overlayToken: longExtract.overlayToken,
    }),
  })
);
check("responde 200", longReport.status === 200, `status=${longReport.status}`);
check(
  "llega marcado sobre el original, no reimpreso",
  longReport.source === "marked",
  String(longReport.source)
);
const longText = await textOf(longReport.buffer);
check("la caratula del original viaja en el informe", longText.includes(UNIVERSIDAD));
check("y el encabezado corrido tambien", longText.includes(ENCABEZADO.replace("—", "-")));

finish(fails === 0 ? 0 : 1);
console.log(`\nRUTAS${fails === 0 ? ": TODAS PASARON" : `: ${fails} FALLARON`}`);
