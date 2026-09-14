/**
 * Genera un .docx de prueba mínimo (sin dependencias) para verificar el camino
 * DOCX→PDF→marcado. No es una prueba de la suite: es un utilitario para crear un
 * archivo real contra el que probar `extract` (overlayToken) y `report-overlay`.
 *
 * Escribe un ZIP con método deflate (zlib) y el OOXML mínimo que LibreOffice,
 * mammoth y `word-extractor` aceptan: [Content_Types].xml, _rels/.rels y
 * word/document.xml con una portada, encabezados y varias páginas de texto.
 *
 * Uso:  node tests/_make-docx.mjs [ruta-salida.docx]
 */
import { deflateRawSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/* ------------------------------ ZIP (deflate) ------------------------------ */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zip(entries) {
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const [name, content] of entries) {
    const nameBuf = Buffer.from(name, "utf8");
    const data = Buffer.from(content, "utf8");
    const comp = deflateRawSync(data);
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0, 6); // flags
    local.writeUInt16LE(8, 8); // method: deflate
    local.writeUInt16LE(0, 10); // time
    local.writeUInt16LE(0, 12); // date
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comp.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    chunks.push(local, nameBuf, comp);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(8, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(comp.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt32LE(0, 30);
    cd.writeUInt32LE(0, 34);
    cd.writeUInt32LE(offset, 42);
    central.push(Buffer.concat([cd, nameBuf]));

    offset += local.length + nameBuf.length + comp.length;
  }

  const cdBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, cdBuf, eocd]);
}

/* --------------------------------- OOXML ----------------------------------- */
const p = (text, opts = {}) => {
  const { bold = false, align = "", size = 24 } = opts;
  const jc = align ? `<w:jc w:val="${align}"/>` : "";
  const b = bold ? "<w:b/>" : "";
  return (
    `<w:p><w:pPr>${jc}<w:rPr>${b}<w:sz w:val="${size}"/></w:rPr></w:pPr>` +
    `<w:r><w:rPr>${b}<w:sz w:val="${size}"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`
  );
};
const pageBreak = () => p("", {}) && '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';

/**
 * Los párrafos del cuerpo, sueltos.
 *
 * Se exportan porque la prueba de punta a punta los indexa en el corpus local:
 * sin una fuente con la que coincidir, el informe saldría sin una sola marca y
 * la comprobación de que los colores se dibujan encima no probaría nada.
 */
export const PARRAFOS = [
  "La presente investigacion tiene un enfoque cuantitativo, de tipo descriptivo y de campo, con un diseno no experimental de corte transversal. El objetivo general consiste en determinar la relacion entre las estrategias didacticas y el rendimiento academico en el area de matematicas de la educacion basica superior, en las instituciones educativas del canton Milagro durante el periodo lectivo vigente.",
  "La poblacion objeto de estudio estuvo conformada por estudiantes de la educacion basica superior, de la cual se selecciono una muestra probabilistica estratificada. Para la recoleccion de los datos se aplico un cuestionario estructurado con escala de Likert, validado mediante el juicio de expertos y cuya confiabilidad se determino a traves del coeficiente alfa de Cronbach, obteniendo un valor aceptable para su aplicacion.",
  "Los resultados evidencian una correlacion positiva moderada entre las variables analizadas. Se concluye que las estrategias didacticas empleadas por los docentes inciden de manera significativa en el desempeño de los estudiantes, por lo que se recomienda fortalecer la formacion docente y diversificar los recursos metodologicos utilizados en el aula.",
  "Las tecnicas de procesamiento y analisis de datos incluyeron la estadistica descriptiva y la estadistica inferencial. Los datos fueron tabulados y organizados en matrices que permitieron su posterior interpretacion, contrastando los resultados con el marco teorico y con estudios previos citados en la literatura cientifica indexada de los ultimos cinco anos.",
];

const TEXTO = PARRAFOS.join("<w:br/>");

/**
 * El encabezado corrido de la tesis.
 *
 * Existe porque «la carátula y el encabezado» es la queja concreta que este
 * camino tiene que resolver, y un encabezado vive en una parte aparte del
 * .docx: si la conversión se lo dejara por el camino, la prueba del cuerpo no
 * lo notaría. Se declara la relación en `word/_rels/document.xml.rels` y se
 * referencia desde el `sectPr`, que es como Word lo adjunta a las páginas.
 */
const ENCABEZADO = "UNIVERSIDAD ESTATAL DE MILAGRO - Tesis de grado";

const header = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  ${p(ENCABEZADO, { align: "center", size: 18 })}
</w:hdr>`;

const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${p("UNIVERSIDAD ESTATAL DE MILAGRO", { bold: true, align: "center", size: 36 })}
    ${p("FACULTAD DE CIENCIAS DE LA EDUCACION", { bold: true, align: "center" })}
    ${p("CARRERA DE EDUCACION BASICA", { align: "center" })}
    ${p("")}
    ${p("TEMA: Estrategias didacticas y rendimiento academico en el area de matematicas", { bold: true, align: "center" })}
    ${p("")}
    ${p("Autor: Victor Manuel LLuilema Pisco", { align: "center" })}
    ${p("MILAGRO - ECUADOR", { align: "center" })}
    ${pageBreak()}
    ${p("1. INTRODUCCION", { bold: true, size: 28 })}
    ${p(TEXTO)}
    ${pageBreak()}
    ${p("2. METODOLOGIA", { bold: true, size: 28 })}
    ${p(TEXTO)}
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rIdHdr"/>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1418"/>
    </w:sectPr>
  </w:body>
</w:document>`;

const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
</Types>`;

const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

/** Las relaciones del documento consigo mismo: de aquí cuelga el encabezado. */
const documentRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdHdr" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
</Relationships>`;

/** El .docx de prueba, en memoria. Lo importa la prueba del camino DOCX. */
export function buildDocx() {
  return zip([
    ["[Content_Types].xml", contentTypes],
    ["_rels/.rels", rels],
    ["word/_rels/document.xml.rels", documentRels],
    ["word/document.xml", document],
    ["word/header1.xml", header],
  ]);
}

/** El texto del encabezado, para que las pruebas lo busquen sin repetirlo. */
export { ENCABEZADO };

// Solo escribe el archivo cuando se ejecuta como programa; importado, expone
// `buildDocx` y no toca el disco.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const out = process.argv[2] || join(tmpdir(), "tesis-ejemplo.docx");
  const buf = buildDocx();
  writeFileSync(out, buf);
  console.log(`DOCX de prueba escrito en ${out} (${buf.length} bytes)`);
}
