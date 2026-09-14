/**
 * Fabrica una tesis en PDF con los dos rasgos que el informe tiene que
 * conservar: una carátula y un encabezado corrido sobre un cuerpo de varias
 * páginas. No es una prueba de la suite: es el material contra el que corren la
 * prueba de rutas y el banco de tiempos, para que las dos midan lo mismo.
 *
 * Se construye con pdf-lib y no con dos PDFs distintos: así la geometría es
 * conocida y una marca mal puesta se detecta como un fallo, no como ruido.
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/** Texto base del cuerpo. Deliberadamente repetitivo: la tesis de verdad lo es. */
export const PARRAFOS = [
  "La presente investigacion tiene un enfoque cuantitativo, de tipo descriptivo y de campo, con un diseno no experimental de corte transversal. El objetivo general consiste en determinar la relacion entre las estrategias didacticas y el rendimiento academico en el area de matematicas de la educacion basica superior.",
  "La poblacion objeto de estudio estuvo conformada por estudiantes de la educacion basica superior, de la cual se selecciono una muestra probabilistica estratificada. Para la recoleccion de los datos se aplico un cuestionario estructurado con escala de Likert, validado mediante el juicio de expertos y cuya confiabilidad se determino a traves del coeficiente alfa de Cronbach.",
  "Los resultados evidencian una correlacion positiva moderada entre las variables analizadas. Se concluye que las estrategias didacticas empleadas por los docentes inciden de manera significativa en el desempeno de los estudiantes, por lo que se recomienda fortalecer la formacion docente y diversificar los recursos metodologicos utilizados en el aula.",
  "Las tecnicas de procesamiento y analisis de datos incluyeron la estadistica descriptiva y la estadistica inferencial. Los datos fueron tabulados y organizados en matrices que permitieron su posterior interpretacion, contrastando los resultados con el marco teorico y con estudios previos citados en la literatura cientifica indexada de los ultimos cinco anos.",
];

export const CARRERA = "CARRERA DE EDUCACION BASICA";
export const AUTOR = "Maria Fernanda Quishpe Loor";
export const UNIVERSIDAD = "UNIVERSIDAD ESTATAL DE MILAGRO";
export const ENCABEZADO = "UNIVERSIDAD ESTATAL DE MILAGRO — Tesis de grado";

/** Envuelve un texto a un ancho aproximado en caracteres. */
function wrap(text, max = 92) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > max) {
      lines.push(line.trim());
      line = word;
    } else {
      line = `${line} ${word}`;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

/**
 * @param {object} [options]
 * @param {number} [options.pages] Páginas de cuerpo, además de la carátula.
 * @param {(page: number) => string} [options.body] Cuerpo de cada página.
 * @returns {Promise<Buffer>}
 */
export async function buildThesis({ pages = 12, body } = {}) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const A4 = [595.28, 841.89];

  const cover = pdf.addPage(A4);
  const center = (line, y, f, size) =>
    cover.drawText(line, {
      x: (A4[0] - f.widthOfTextAtSize(line, size)) / 2,
      y,
      size,
      font: f,
      color: rgb(0.1, 0.1, 0.1),
    });
  center(UNIVERSIDAD, 720, bold, 15);
  center("FACULTAD DE CIENCIAS DE LA EDUCACION", 700, bold, 12);
  center(CARRERA, 682, font, 11);
  center("TEMA: Estrategias didacticas y rendimiento academico", 560, bold, 13);
  center(`Autora: ${AUTOR}`, 500, font, 11);
  center("MILAGRO - ECUADOR", 460, font, 11);
  center("2026", 442, font, 11);

  for (let index = 1; index <= pages; index++) {
    const page = pdf.addPage(A4);
    page.drawText(ENCABEZADO, {
      x: 56,
      y: 800,
      size: 8,
      font,
      color: rgb(0.45, 0.45, 0.45),
    });
    page.drawLine({
      start: { x: 56, y: 794 },
      end: { x: 539, y: 794 },
      thickness: 0.5,
      color: rgb(0.75, 0.75, 0.75),
    });
    page.drawText(String(index), {
      x: 300,
      y: 40,
      size: 9,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    let y = 760;
    page.drawText(`${index}. SECCION DEL CUERPO`, { x: 56, y, size: 12, font: bold });
    y -= 22;

    for (const paragraph of PARRAFOS) {
      for (const line of wrap(body ? body(index) : `${paragraph} ${paragraph}`)) {
        page.drawText(line, { x: 56, y, size: 10.5, font });
        y -= 15;
      }
      y -= 6;
    }
  }

  return Buffer.from(await pdf.save());
}
