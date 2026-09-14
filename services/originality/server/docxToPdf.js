/**
 * DOCX to PDF conversion, so the overlay can mark a Word submission the same
 * way it already marks a native PDF.
 *
 * `overlay.js` only draws on PDF because that is the only format with page
 * geometry. A DOCX has none until something lays it out. LibreOffice headless
 * is that something: it renders the document exactly as Word would print it —
 * cover page, running headers, tables, images — and hands back a PDF that
 * `extractPdfWithLayout` can read like any other upload.
 *
 * This is a soft dependency. LibreOffice may not be installed on every host
 * this server runs on, and a student's check should not fail because of that:
 * `convertDocxToPdf` returns null on any failure — binary missing, conversion
 * error, timeout — and the caller falls back to the text-only path exactly as
 * it did before this module existed.
 */

import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

// Holgado a propósito: la primera conversión de una instancia en frío arranca
// LibreOffice entero (perfil, fuentes, filtros) y una tesis con imágenes y
// tablas tarda en maquetarse. Un corte demasiado pronto devolvería el informe
// reimpreso sin que nada estuviera realmente roto.
const CONVERT_TIMEOUT_MS = 90_000;

/** Checked in order; the first one that exists and runs wins. Overridable via env for deployments that install LibreOffice somewhere else. */
function candidateBinaries() {
  const fromEnv = process.env.SOFFICE_PATH;
  const byPlatform =
    process.platform === "win32"
      ? [
          "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
          "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
        ]
      : process.platform === "darwin"
        ? ["/Applications/LibreOffice.app/Contents/MacOS/soffice"]
        : ["/usr/bin/soffice", "/usr/bin/libreoffice", "/snap/bin/libreoffice"];

  return [fromEnv, ...byPlatform, "soffice"].filter(Boolean);
}

function run(binary, args) {
  return new Promise((resolve, reject) => {
    execFile(binary, args, { timeout: CONVERT_TIMEOUT_MS }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${error.message}${stderr ? ` — ${stderr.slice(0, 300)}` : ""}`));
        return;
      }
      resolve(stdout);
    });
  });
}

let resolvedBinary; // cached across calls once one candidate is confirmed to run

/**
 * Render a DOCX buffer to PDF via LibreOffice headless.
 *
 * Each call gets its own scratch profile (`-env:UserInstallation`) so
 * concurrent conversions do not collide over LibreOffice's user-profile lock,
 * which otherwise serializes or fails requests under load.
 *
 * @param {Buffer} docxBuffer
 * @returns {Promise<Buffer|null>} The rendered PDF, or null when no working
 *   LibreOffice installation could be found or the conversion failed.
 */
export async function convertDocxToPdf(docxBuffer) {
  if (!docxBuffer || docxBuffer.length === 0) return null;

  const workDir = await mkdtemp(join(tmpdir(), "docx2pdf-"));
  const profileDir = join(workDir, "profile");
  const inputPath = join(workDir, `${randomUUID()}.docx`);

  try {
    await writeFile(inputPath, docxBuffer);

    // A proper file URI needs three slashes before an absolute path
    // ("file:///C:/..." on Windows, "file:///tmp/..." elsewhere); LibreOffice
    // parses a two-slash one as a relative host and silently ignores the
    // profile override, which is exactly the collision this isolates against.
    const uriPath = profileDir.replace(/\\/g, "/");
    const profileUri = `file://${uriPath.startsWith("/") ? "" : "/"}${uriPath}`;

    const binaries = resolvedBinary ? [resolvedBinary] : candidateBinaries();

    for (const binary of binaries) {
      try {
        await run(binary, [
          "--headless",
          "--norestore",
          `-env:UserInstallation=${profileUri}`,
          "--convert-to",
          "pdf",
          "--outdir",
          workDir,
          inputPath,
        ]);
        resolvedBinary = binary;

        const outputPath = inputPath.replace(/\.docx$/, ".pdf");
        return await readFile(outputPath);
      } catch (error) {
        if (binary === resolvedBinary) resolvedBinary = undefined;
        // Try the next candidate path; only the last failure is worth logging.
        if (binary === binaries[binaries.length - 1]) {
          console.warn(`[docxToPdf] LibreOffice conversion unavailable: ${error.message}`);
        }
      }
    }

    return null;
  } catch (error) {
    console.warn(`[docxToPdf] Conversion failed: ${error.message}`);
    return null;
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
