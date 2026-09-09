const BASE = "http://localhost:5000";
let fails = 0;
const check = (l, c, d = "") => { console.log(`  [${c?"PASA":"FALLA"}] ${l}${d?" — "+d:""}`); if(!c) fails++; };

const post = async (text) => {
  const t0 = Date.now();
  const r = await fetch(`${BASE}/api/plagiarism-check`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const j = await r.json();
  j._secs = ((Date.now() - t0) / 1000).toFixed(1);
  return j;
};

// Wikipedia "Photosynthesis", parafraseado a fondo: sin secuencias literales.
console.log("\n1. PARAFRASEO PROFUNDO de Wikipedia (el caso que TF-IDF no ve)");
const parafraseado = `Plants, algae and cyanobacteria run a set of linked biological reactions that capture radiant energy from the sun and lock it into chemical bonds their cells can later spend. When people speak of this conversion they normally mean the oxygen releasing variety of the reaction. What these organisms build from that captured energy are carbon rich molecules held inside the cell, among them starch, cellulose, glycogen and simple sugars.`;
const p = await post(parafraseado);
const mp = p.results?.[0]?.metrics ?? {};
console.log(`         indice=${p.plagiarismPercentage}% en ${p._secs}s`);
console.log(`         metricas: literal=${mp.containment}% lexica=${mp.cosine}% huella=${mp.fingerprint}% SEMANTICA=${mp.semantic}% racha=${mp.longestRun}`);
check("expone metrica semantica", typeof mp.semantic === "number");
// El parafraseo profundo sin residuo lexico no infla el indice por diseno: a ese
// nivel de evidencia no se distingue de un texto independiente sobre el mismo
// tema, y marcarlo produciria falsos positivos sobre trabajo honesto. La senal
// no se pierde, se reporta aparte para juicio humano.
// mp son las metricas del primer pasaje; la senal puede caer en cualquiera.
const semMax = Math.max(0, ...(p.results ?? []).map(r => r.metrics?.semantic ?? 0));
check("semantica detecta el parafraseo", semMax >= 40, `semantica maxima=${semMax}%`);
const alertas = p.results?.filter(r => (r.semanticFlags ?? []).length > 0) ?? [];
check("emite alerta semantica para revision", alertas.length > 0 || p.plagiarismPercentage >= 35,
  `alertas=${alertas.length}, indice=${p.plagiarismPercentage}%`);
check("supera lo que darian solo las lexicas", p.plagiarismPercentage > Math.max(mp.containment ?? 0, mp.fingerprint ?? 0),
  `indice=${p.plagiarismPercentage}% vs literal=${mp.containment}%`);
check("atribuye a Wikipedia", p.results?.some(x => x.sources?.some(s => s.url.includes("wikipedia"))));

console.log("\n2. Copia literal (no debe degradarse)");
const literal = `Photosynthesis is a system of biological processes by which photosynthetic organisms, such as most plants, algae, and cyanobacteria, convert light energy, typically from sunlight, into the chemical energy necessary to fuel their metabolism. Photosynthetic organisms store the chemical energy so produced in intracellular organic compounds like sugars, glycogen, cellulose and starches.`;
const l = await post(literal);
const ml = l.results?.[0]?.metrics ?? {};
console.log(`         indice=${l.plagiarismPercentage}% en ${l._secs}s`);
console.log(`         metricas: literal=${ml.containment}% semantica=${ml.semantic}% racha=${ml.longestRun}`);
check("sigue detectando copia literal", l.plagiarismPercentage >= 40, `indice=${l.plagiarismPercentage}%`);

console.log("\n3. Texto original (control de falsos positivos)");
const original = `Mi abuela guardaba las llaves oxidadas de la casa de Cuenca en una lata de galletas que olia a clavo de olor. Cada vez que llovia fuerte sacaba la lata, las contaba en voz baja y volvia a cerrarla sin explicarme nunca de que puertas eran. Murio en marzo y la lata sigue en el mismo cajon donde ella la dejo, con las mismas llaves adentro.`;
const o = await post(original);
console.log(`         indice=${o.plagiarismPercentage}% en ${o._secs}s`);
check("no marca texto original", o.plagiarismPercentage <= 25, `indice=${o.plagiarismPercentage}%`);

console.log(`\n${fails === 0 ? "FASE 3: TODAS PASARON" : "FASE 3: " + fails + " FALLARON"}`);
process.exitCode = fails ? 1 : 0;
