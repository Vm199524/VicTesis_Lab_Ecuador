const BASE = "http://localhost:5000";
let fails = 0;
const check = (l, c, d = "") => { console.log(`  [${c?"PASA":"FALLA"}] ${l}${d?" — "+d:""}`); if(!c) fails++; };

// Pasaje literal del articulo "Photosynthesis" de Wikipedia EN.
const wiki = `Photosynthesis is a system of biological processes by which photosynthetic organisms, such as most plants, algae, and cyanobacteria, convert light energy, typically from sunlight, into the chemical energy necessary to fuel their metabolism. Photosynthesis usually refers to oxygenic photosynthesis, a process that produces oxygen. Photosynthetic organisms store the chemical energy so produced in intracellular organic compounds like sugars, glycogen, cellulose and starches.`;

console.log("\n1. Deteccion sobre pasaje literal de Wikipedia");
const t0 = Date.now();
const res = await fetch(`${BASE}/api/plagiarism-check`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: wiki }),
});
const r = await res.json();
const secs = ((Date.now() - t0) / 1000).toFixed(1);

check("HTTP 200", res.status === 200, `status=${res.status}`);
check("detecta plagio alto", r.plagiarismPercentage >= 40, `indice=${r.plagiarismPercentage}% en ${secs}s`);
check("atribuye a Wikipedia", r.results?.some(x => x.sources?.some(s => s.url.includes("wikipedia"))));

const best = r.results?.flatMap(x => x.sources ?? []).sort((a,b) => b.similarity - a.similarity)[0];
if (best) console.log(`         mejor fuente: ${best.similarity}% ${best.url.slice(0, 70)}`);
console.log(`         metricas: ${JSON.stringify(r.results?.[0]?.metrics)}`);

console.log("\n2. Texto original (no debe marcar plagio)");
const original = `Mi abuela guardaba las llaves oxidadas de la casa de Cuenca en una lata de galletas que olia a clavo de olor. Cada vez que llovia fuerte sacaba la lata, las contaba en voz baja y volvia a cerrarla sin explicarme nunca para que servian esas llaves ni de que puertas eran. Murio en marzo y la lata sigue en el mismo cajon donde ella la dejo.`;
const res2 = await fetch(`${BASE}/api/plagiarism-check`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: original }),
});
const r2 = await res2.json();
check("indice bajo en texto original", r2.plagiarismPercentage <= 25, `indice=${r2.plagiarismPercentage}%`);

console.log("\n3. Proveedores activos");
const lim = await (await fetch(`${BASE}/api/limits`)).json();
console.log(`         ${JSON.stringify(lim.providers ?? "no expuesto")}`);

console.log(`\n${fails === 0 ? "FASE 1: TODAS PASARON" : "FASE 1: " + fails + " FALLARON"}`);
process.exitCode = fails ? 1 : 0;
