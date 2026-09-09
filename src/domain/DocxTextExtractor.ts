/**
 * DocxTextExtractor
 *
 * Extrae el texto plano de un archivo .docx directamente en el navegador, sin
 * dependencias externas y sin subir el documento a ningún servidor.
 *
 * Un .docx es un contenedor ZIP; aquí se lee su directorio central, se localiza
 * `word/document.xml` y se descomprime con la API nativa DecompressionStream.
 */

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;

interface ZipEntry {
  fileName: string;
  compressionMethod: number;
  compressedSize: number;
  localHeaderOffset: number;
}

export class DocxExtractionError extends Error {}

function findEndOfCentralDirectory(view: DataView): number {
  // El EOCD vive al final del archivo; se admite hasta 64 KB de comentario final.
  const maxScan = Math.min(view.byteLength, 65_557);
  for (let offset = view.byteLength - 22; offset >= view.byteLength - maxScan; offset -= 1) {
    if (offset < 0) break;
    if (view.getUint32(offset, true) === EOCD_SIGNATURE) return offset;
  }
  throw new DocxExtractionError('El archivo no tiene una estructura .docx válida.');
}

function readCentralDirectory(buffer: ArrayBuffer): ZipEntry[] {
  const view = new DataView(buffer);
  const eocd = findEndOfCentralDirectory(view);
  const entryCount = view.getUint16(eocd + 10, true);
  let cursor = view.getUint32(eocd + 16, true);

  const decoder = new TextDecoder('utf-8');
  const entries: ZipEntry[] = [];

  for (let index = 0; index < entryCount; index += 1) {
    if (cursor + 46 > view.byteLength) break;
    if (view.getUint32(cursor, true) !== CENTRAL_SIGNATURE) break;

    const compressionMethod = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const fileNameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localHeaderOffset = view.getUint32(cursor + 42, true);

    const fileName = decoder.decode(new Uint8Array(buffer, cursor + 46, fileNameLength));
    entries.push({ fileName, compressionMethod, compressedSize, localHeaderOffset });

    cursor += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new DocxExtractionError(
      'Tu navegador no puede descomprimir el archivo. Abre el documento, copia el texto y pégalo en el cuadro.'
    );
  }

  try {
    const stream = new Blob([data as BlobPart]).stream().pipeThrough(
      new DecompressionStream('deflate-raw')
    );
    const chunks: Uint8Array[] = [];
    const reader = stream.getReader();

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value as Uint8Array);
    }

    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(total);
    let position = 0;
    chunks.forEach((chunk) => {
      result.set(chunk, position);
      position += chunk.length;
    });
    return result;
  } catch {
    throw new DocxExtractionError(
      'No se pudo descomprimir el documento. Abre el archivo, copia el texto y pégalo en el cuadro.'
    );
  }
}

function readEntryData(buffer: ArrayBuffer, entry: ZipEntry): Uint8Array {
  const view = new DataView(buffer);
  const offset = entry.localHeaderOffset;

  if (view.getUint32(offset, true) !== LOCAL_SIGNATURE) {
    throw new DocxExtractionError('El contenido interno del documento está dañado.');
  }

  const fileNameLength = view.getUint16(offset + 26, true);
  const extraLength = view.getUint16(offset + 28, true);
  const dataStart = offset + 30 + fileNameLength + extraLength;

  return new Uint8Array(buffer, dataStart, entry.compressedSize);
}

/** Convierte el XML de WordprocessingML en texto legible preservando párrafos. */
function xmlToPlainText(xml: string): string {
  return xml
    .replace(/<w:tab\b[^>]*\/>/g, '\t')
    .replace(/<w:br\b[^>]*\/>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<\/w:tr>/g, '\n')
    .replace(/<\/w:tc>/g, ' | ')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/[^\S\n]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Lee un .docx y devuelve su texto plano. Lanza DocxExtractionError si no es posible. */
export async function extractDocxText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const entries = readCentralDirectory(buffer);

  const document = entries.find((entry) => entry.fileName === 'word/document.xml');
  if (!document) {
    throw new DocxExtractionError('No se encontró el cuerpo del documento dentro del archivo.');
  }

  const compressed = readEntryData(buffer, document);
  const raw =
    document.compressionMethod === 0 ? compressed : await inflateRaw(compressed);

  const xml = new TextDecoder('utf-8').decode(raw);
  const text = xmlToPlainText(xml);

  if (text.length < 200) {
    throw new DocxExtractionError(
      'El documento se leyó pero contiene muy poco texto. Verifica que no sea un archivo de imágenes escaneadas.'
    );
  }

  return text;
}

/** Lee archivos de texto plano (.txt, .md). */
export async function extractPlainText(file: File): Promise<string> {
  const text = await file.text();
  if (text.trim().length < 200) {
    throw new DocxExtractionError('El archivo contiene muy poco texto para analizar.');
  }
  return text;
}

export type SupportedDraftFile = 'docx' | 'text' | 'unsupported';

export function classifyDraftFile(file: File): SupportedDraftFile {
  const name = file.name.toLowerCase();
  if (name.endsWith('.docx')) return 'docx';
  if (name.endsWith('.txt') || name.endsWith('.md')) return 'text';
  return 'unsupported';
}

/** Orquesta la lectura según el tipo de archivo entregado por el usuario. */
export async function readDraftFile(file: File): Promise<string> {
  const kind = classifyDraftFile(file);

  if (kind === 'docx') return extractDocxText(file);
  if (kind === 'text') return extractPlainText(file);

  if (file.name.toLowerCase().endsWith('.pdf')) {
    throw new DocxExtractionError(
      'Los PDF no se pueden leer aquí. Abre el PDF, selecciona todo el texto (Ctrl+A), cópialo y pégalo en el cuadro.'
    );
  }

  if (file.name.toLowerCase().endsWith('.doc')) {
    throw new DocxExtractionError(
      'El formato .doc antiguo no es compatible. Guarda el archivo como .docx desde Word y vuelve a intentarlo.'
    );
  }

  throw new DocxExtractionError(
    'Formato no compatible. Sube tu documento en .docx o .txt, o pega el texto directamente.'
  );
}
