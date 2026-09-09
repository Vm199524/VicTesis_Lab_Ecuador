import { searchArxiv, searchDoaj, searchSemanticScholar, searchCore, unpaywallLocate, availableOaProviders } from "../server/providers-oa.js";
import { buildQueries } from "../server/text.js";

const passage = "Machine learning models require large annotated datasets to achieve reliable generalization performance across diverse domains and tasks.";
const q = buildQueries(passage);
console.log("Consultas generadas:");
console.log("  phrase  :", q.phrase);
console.log("  keywords:", q.keywords);
console.log("\nProveedores disponibles:", availableOaProviders().join(", "));

const probes = [
  ["arxiv", () => searchArxiv(q)],
  ["doaj", () => searchDoaj(q)],
  ["semanticscholar", () => searchSemanticScholar(q)],
  ["core", () => searchCore(q)],
];

console.log("\nSondeo de red por proveedor:");
for (const [name, run] of probes) {
  const t0 = Date.now();
  try {
    const results = await run();
    const withText = results.filter(r => r.content && r.content.length > 100).length;
    const ms = Date.now() - t0;
    console.log(`  [OK]   ${name.padEnd(16)} ${results.length} resultados, ${withText} con texto (${ms}ms)`);
    if (results[0]) console.log(`         ej: ${(results[0].title || "").slice(0, 70)}`);
  } catch (e) {
    console.log(`  [FALLA] ${name.padEnd(16)} ${e.cause?.code || e.message}`);
  }
}

console.log("\nUnpaywall (DOI conocido open access):");
try {
  const loc = await unpaywallLocate("10.1371/journal.pone.0000308");
  console.log(loc ? `  [OK]   ${loc.isPdf ? "PDF" : "landing"} -> ${loc.url.slice(0, 80)}` : "  [VACIO] sin copia abierta");
} catch (e) {
  console.log(`  [FALLA] ${e.cause?.code || e.message}`);
}
