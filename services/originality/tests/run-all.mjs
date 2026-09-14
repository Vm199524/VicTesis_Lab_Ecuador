/**
 * Ejecuta toda la suite. Las pruebas unitarias no necesitan servidor;
 * las de integracion requieren que el servidor este escuchando.
 */
import { spawn } from "node:child_process";
import { rmSync } from "node:fs";

const SUITES = [
  ["unidad", "readable.test.mjs"],
  ["unidad", "semantic.test.mjs"],
  ["unidad", "corpus.test.mjs"],
  ["unidad", "report.test.mjs"],
  ["unidad", "layout.test.mjs"],
  ["unidad", "docx-overlay.test.mjs"],
  ["rutas",  "report-routes.test.mjs"],
  ["unidad", "ai-detect.test.mjs"],
  ["red",    "providers-oa.test.mjs"],
  ["red",    "harvest.test.mjs"],
  ["http",   "fase1.test.mjs"],
  ["http",   "fase3.test.mjs"],
  ["http",   "fase4.test.mjs"],
  ["http",   "falsos-positivos.test.mjs"],
];

// Cada suite que escribe en el corpus recibe su propia base. Sin esto, la
// cosecha OAI deja documentos que la suite siguiente interpreta como estado
// propio, y el fallo aparece en el test equivocado.
const run = (file, tipo) => new Promise((resolve) => {
  const child = spawn(process.execPath, [`tests/${file}`], {
    env: {
      ...process.env,
      // Las suites http hablan con el servidor, que usa su propia base.
      CORPUS_DB: tipo === "http" ? "./data/corpus.db" : `./data/test-${file.replace(/\W/g, "_")}.db`,
    },
  });
  let out = "";
  child.stdout.on("data", d => out += d);
  child.stderr.on("data", d => out += d);
  child.on("close", code => resolve({ code, out }));
});

let failed = 0;
const t0 = Date.now();

// Estado limpio: las bases de prueba son desechables por definicion.
for (const suffix of ["", "-wal", "-shm"]) {
  try { rmSync(`./data`, { recursive: true, force: true }); } catch {}
  break;
}

for (const [tipo, file] of SUITES) {
  const { code, out } = await run(file, tipo);
  const resumen = out.split("\n").filter(l => /PASARON|FALLARON/.test(l)).pop() ?? "sin resumen";
  const marca = code === 0 ? "OK  " : "FALLA";
  console.log(`[${marca}] ${tipo.padEnd(7)} ${file.padEnd(28)} ${resumen.trim()}`);
  if (code !== 0) {
    failed++;
    out.split("\n").filter(l => l.includes("[FALLA]")).forEach(l => console.log(`         ${l.trim()}`));
  }
}

console.log(`\n${failed === 0 ? "SUITE COMPLETA: TODO VERDE" : `SUITE: ${failed} archivo(s) con fallos`} — ${((Date.now()-t0)/1000).toFixed(0)}s`);
process.exitCode = failed ? 1 : 0;
