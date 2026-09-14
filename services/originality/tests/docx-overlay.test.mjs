/**
 * Marcado sobre el ORIGINAL de un .docx.
 *
 * Es el camino que recorre un estudiante que trabaja en Word, y el unico punto
 * del sistema donde el detector depende de un programa externo: el .docx se
 * convierte a PDF con LibreOffice —caratula, encabezados, tablas y paginacion
 * incluidos—, esa maqueta se lee con geometria y las coincidencias se dibujan
 * encima. Sin esta prueba, un fallo de la conversion (una fuente que falta, un
 * perfil que no se puede escribir, un tiempo de espera corto) degrada en
 * silencio al informe reimpreso y solo se nota mirando el PDF descargado.
 *
 * Se omite, sin fallar, cuando la maquina no tiene LibreOffice: la conversion es
 * una dependencia blanda por diseno y la suite tiene que poder correr en limpio.
 */
import { buildDocx, ENCABEZADO } from "./_make-docx.mjs";
import { convertDocxToPdf } from "../server/docxToPdf.js";
import { extractPdfWithLayout, extractDocumentText } from "../server/extract.js";
import { overlayHighlights } from "../server/overlay.js";

let fails = 0;
const check = (label, condition, detail = "") => {
  console.log(`  [${condition ? "PASA" : "FALLA"}] ${label}${detail ? " — " + detail : ""}`);
  if (!condition) fails++;
};

console.log("docx → original marcado (LibreOffice)");

const pdf = await convertDocxToPdf(buildDocx());

if (!pdf) {
  console.log("  (omitido: no hay LibreOffice disponible en esta maquina)");
  console.log("\nDOCX: OMITIDO (sin LibreOffice)");
  process.exit(0);
}

check("convierte el .docx a un PDF", pdf.subarray(0, 4).toString("latin1") === "%PDF");

const layout = await extractPdfWithLayout(pdf);

check("la conversion produce varias paginas", layout.pages.length > 1, `${layout.pages.length} paginas`);
check(
  "la caratula sobrevive a la conversion",
  layout.text.includes("UNIVERSIDAD ESTATAL DE MILAGRO")
);
check(
  "el cuerpo del documento sobrevive",
  layout.text.includes("Cronbach"),
  `${layout.text.length} caracteres extraidos`
);
// El encabezado vive en una parte aparte del .docx: que la conversión lo
// arrastre es justo lo que la queja «la carátula y el encabezado» pone en duda.
check("el encabezado corrido sobrevive a la conversion", layout.text.includes(ENCABEZADO));
check("la maqueta trae geometria", layout.items.length > 0, `${layout.items.length} fragmentos`);

// El fragmento a marcar es de una pagina posterior: marcar la caratula haria
// pasar la comprobacion de abajo sin ejercitar la excepcion de keepCover.
const later = layout.items.find((item) => item.page > 1 && item.str.trim().length > 24);

if (!later) {
  check("hay texto marcable fuera de la caratula", false, "la conversion no dejo texto en paginas 2+");
} else {
  const marked = await overlayHighlights({
    pdfBuffer: pdf,
    layout,
    ranges: [{ textStart: later.textStart, textEnd: later.textEnd, similarity: 60, color: "#dc2626" }],
    footer: "Prueba",
    onlyMarkedPages: true,
    keepCover: true,
  });

  check("marca el pasaje pedido", marked?.marked === 1);
  check(
    "conserva la caratula junto a las paginas marcadas",
    marked?.keptPages.includes(1) === true && marked?.markedPages.includes(1) === false,
    `conservadas=${JSON.stringify(marked?.keptPages)} marcadas=${JSON.stringify(marked?.markedPages)}`
  );
  check(
    "el anexo conserva el orden del original",
    (marked?.keptPages ?? []).every((page, index, all) => index === 0 || page > all[index - 1])
  );

  // Lo que el estudiante descarga tiene que seguir siendo SU documento.
  const reread = await extractDocumentText(marked.buffer, "anexo.pdf");
  check("el texto original sigue en la salida", reread.text.includes("Cronbach"));
  check("la caratula sigue en la salida", reread.text.includes("UNIVERSIDAD ESTATAL DE MILAGRO"));
  check(
    "el anexo tiene tantas paginas como paginas conservadas",
    reread.meta.pages === marked.keptPages.length,
    `${reread.meta.pages} vs ${marked.keptPages.length}`
  );
}

console.log(`\nDOCX${fails === 0 ? ": TODAS PASARON" : `: ${fails} FALLARON`}`);
process.exit(fails === 0 ? 0 : 1);
