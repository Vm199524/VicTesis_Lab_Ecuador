/**
 * Extraccion con geometria y superposicion sobre el documento original.
 *
 * La invariante fragil es la primera: `normalizeTextMapped` reproduce
 * `normalizeText` caracter por caracter. Si alguien toca una y no la otra, los
 * resaltados dejan de caer donde deben, y el fallo se ve como un desfase que
 * crece a lo largo del documento en vez de como un error. Por eso se comprueba
 * aqui y no en la revision.
 */
import fs from "node:fs";
import {
  normalizeText,
  normalizeTextMapped,
  extractPdfWithLayout,
  extractDocumentText,
} from "../server/extract.js";
import { overlayHighlights } from "../server/overlay.js";

let fails = 0;
const check = (l, c, d = "") => {
  console.log(`  [${c ? "PASA" : "FALLA"}] ${l}${d ? " — " + d : ""}`);
  if (!c) fails++;
};

console.log("normalizacion con mapa de posiciones");

const SAMPLES = [
  "Hola  mundo\r\n\r\n\r\nsegunda   linea",
  "compre-\nhensive  ­soft  nbsp",
  "ligaduras ﬀ ﬁ ﬃ comillas “x” ‘y’ raya – puntos …",
  "   sangria y cola   \n\n\n\n ",
  "controlcharsaqui fin",
  "a\tb\t\tc   d\n \n  \ne",
  "",
  "   ",
];

for (const sample of SAMPLES) {
  const plain = normalizeText(sample);
  const mapped = normalizeTextMapped(sample).text;
  check(
    `identica a normalizeText: ${JSON.stringify(sample.slice(0, 26))}`,
    plain === mapped,
    plain === mapped ? "" : `${JSON.stringify(plain)} != ${JSON.stringify(mapped)}`
  );
}

{
  // El mapa debe ser monotono y quedarse dentro del texto resultante: un indice
  // que retrocede produce rangos invertidos que el overlay descarta en silencio.
  const raw = "uno  dos\r\n\r\n\r\ntres   ­cuatro";
  const { text, map } = normalizeTextMapped(raw);

  let monotone = true;
  for (let i = 1; i <= raw.length; i++) if (map[i] < map[i - 1]) monotone = false;

  check("el mapa no retrocede", monotone);
  check(
    "el mapa cae dentro del texto normalizado",
    [...map].every((value) => value >= 0 && value <= text.length)
  );
}

// ---------------------------------------------------------------------------
// Documento real. Sin el PDF de muestra estas comprobaciones se omiten en lugar
// de fallar: la suite tiene que poder correr en una maquina limpia.
// ---------------------------------------------------------------------------

const SAMPLE_PDF = process.env.LAYOUT_SAMPLE_PDF || "docs/muestras/informe-ejemplo.pdf";

if (!fs.existsSync(SAMPLE_PDF)) {
  console.log(`\n(omitido: no existe ${SAMPLE_PDF})`);
} else {
  console.log("\nextraccion con geometria sobre un PDF real");

  const buffer = fs.readFileSync(SAMPLE_PDF);
  const layout = await extractPdfWithLayout(buffer);
  const plain = await extractDocumentText(buffer, "muestra.pdf");

  check(
    "el texto coincide con el extractor de siempre",
    layout.text === plain.text,
    `${layout.text.length} vs ${plain.text.length} caracteres`
  );
  check("devuelve una pagina por pagina del PDF", layout.pages.length === plain.meta.pages);
  check("devuelve fragmentos con geometria", layout.items.length > 0, `${layout.items.length} items`);

  // Cada fragmento debe apuntar a sus propias palabras. Un desfase de
  // normalizacion se manifiesta justo aqui.
  const key = (value) => normalizeText(value).replace(/\s+/g, " ").trim();
  let aligned = 0;
  let misaligned = 0;
  for (const item of layout.items) {
    if (item.str.trim().length < 4) continue;
    const slice = layout.text.slice(item.textStart, item.textEnd);
    if (key(slice) === key(item.str)) aligned++;
    else misaligned++;
  }
  check(
    "cada fragmento apunta a su propio texto",
    misaligned === 0,
    `${aligned} alineados, ${misaligned} desviados`
  );

  console.log("\nsuperposicion sobre el original");

  const first = layout.items.find((item) => item.str.trim().length > 12);
  const result = await overlayHighlights({
    pdfBuffer: buffer,
    layout,
    ranges: first
      ? [{ textStart: first.textStart, textEnd: first.textEnd, similarity: 55, color: "#f97316" }]
      : [],
    footer: "Prueba",
  });

  check("devuelve un PDF", Boolean(result && result.buffer?.length > 0));
  check(
    "conserva el numero de paginas",
    result?.pages === plain.meta.pages,
    `${result?.pages} vs ${plain.meta.pages}`
  );
  check("marca el rango pedido", result?.marked === (first ? 1 : 0));

  // El punto entero del modulo: el documento del autor sigue ahi.
  const again = await extractDocumentText(result.buffer, "salida.pdf");
  const survived = key(plain.text)
    .split(" ")
    .filter((word) => word.length > 6)
    .every((word) => again.text.includes(word));
  check("el texto original sobrevive en la salida", survived);

  // Sin coordenadas no hay nada que dibujar, y adivinar seria peor que negarse.
  const notPdf = Buffer.from("PK not a pdf");
  check(
    "rechaza lo que no es PDF",
    (await overlayHighlights({ pdfBuffer: notPdf, layout, ranges: [] })) === null
  );
  check(
    "rechaza un layout vacio",
    (await overlayHighlights({ pdfBuffer: buffer, layout: null, ranges: [] })) === null
  );

  // El recorte del anexo: solo viajan las paginas marcadas, y la caratula
  // viaja ademas aunque no lleve marca (es la que identifica el trabajo). Se
  // marca a proposito una pagina que no es la primera, porque marcar la
  // caratula haria pasar la comprobacion sin ejercitar la excepcion.
  if (layout.pages.length > 1) {
    console.log("\nrecorte del anexo (solo lo marcado, mas la caratula)");

    const later = layout.items.find(
      (item) => item.page > 1 && item.str.trim().length > 12
    );

    if (!later) {
      console.log("  (omitido: la muestra no tiene texto en paginas posteriores)");
    } else {
      const range = [
        { textStart: later.textStart, textEnd: later.textEnd, similarity: 55, color: "#f97316" },
      ];

      const trimmed = await overlayHighlights({
        pdfBuffer: buffer,
        layout,
        ranges: range,
        onlyMarkedPages: true,
        keepCover: true,
      });
      const withoutCover = await overlayHighlights({
        pdfBuffer: buffer,
        layout,
        ranges: range,
        onlyMarkedPages: true,
      });

      check(
        "la caratula viaja sin llevar marca",
        trimmed?.keptPages.includes(1) === true,
        `kept=${JSON.stringify(trimmed?.keptPages)} marked=${JSON.stringify(trimmed?.markedPages)}`
      );
      check(
        "la caratula no se anuncia como marcada",
        trimmed?.markedPages.includes(1) === false
      );
      check(
        "sin keepCover solo viaja lo marcado",
        withoutCover?.keptPages.length === withoutCover?.markedPages.length,
        `${withoutCover?.keptPages.length} vs ${withoutCover?.markedPages.length}`
      );
      check(
        "el anexo tiene tantas paginas como paginas conservadas",
        (await extractDocumentText(trimmed.buffer, "anexo.pdf")).meta.pages ===
          trimmed.keptPages.length,
        `${trimmed.keptPages.length} conservadas`
      );
      check(
        "las paginas conservadas van en orden y son del original",
        trimmed.keptPages.every((page) => page > 0 && page <= layout.pages.length) &&
          trimmed.keptPages.every((page, index, all) => index === 0 || page > all[index - 1])
      );
    }
  }
}

console.log(fails === 0 ? "\nTodo correcto." : `\n${fails} comprobacion(es) fallaron.`);
process.exit(fails === 0 ? 0 : 1);
