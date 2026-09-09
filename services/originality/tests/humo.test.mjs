/** Prueba de humo: cada endpoint responde lo que debe. */
const BASE = "http://localhost:5000";
let fails = 0;
const check = (l, c, d = "") => { console.log(`  [${c?"PASA":"FALLA"}] ${l}${d?" — "+d:""}`); if(!c) fails++; };

const TXT = "Photosynthesis is a system of biological processes by which photosynthetic organisms, such as most plants, algae, and cyanobacteria, convert light energy, typically from sunlight, into the chemical energy necessary to fuel their metabolism. Photosynthetic organisms store the chemical energy so produced in intracellular organic compounds like sugars, glycogen, cellulose and starches. The reproducibility of these findings has been confirmed by multiple independent research teams.";

console.log("\nEndpoints");
const lim = await fetch(`${BASE}/api/limits`);
check("GET  /api/limits", lim.status === 200);

const chk = await fetch(`${BASE}/api/plagiarism-check`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ text: TXT }) });
const chkBody = await chk.json();
check("POST /api/plagiarism-check", chk.status === 200 && typeof chkBody.plagiarismPercentage === "number",
  `indice=${chkBody.plagiarismPercentage}% proveedores=[${(chkBody.providers||[]).join(", ")}]`);
check("     expone 5 metricas", chkBody.results?.[0]?.metrics && "semantic" in chkBody.results[0].metrics);
check("     expone alertas semanticas", "semanticAlerts" in chkBody);

const ai = await fetch(`${BASE}/api/ai-detect`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ text: TXT }) });
const aiBody = await ai.json();
check("POST /api/ai-detect", ai.status === 200, `puntuacion=${aiBody.score}% "${aiBody.label}"`);

const rep = await fetch(`${BASE}/api/report`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ text: TXT, meta:{ title:"Humo", author:"QA" } }) });
const pdf = Buffer.from(await rep.arrayBuffer());
check("POST /api/report", rep.status === 200 && pdf.subarray(0,5).toString() === "%PDF-", `${(pdf.length/1024).toFixed(0)} KB`);

const st = await fetch(`${BASE}/api/corpus/stats`);
check("GET  /api/corpus/stats", st.status === 200);

const ix = await fetch(`${BASE}/api/corpus/index`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ text: TXT, title:"Humo" }) });
const ixBody = await ix.json();
check("POST /api/corpus/index", ix.status === 200 && ixBody.checksum);
const del = await fetch(`${BASE}/api/corpus/${ixBody.checksum}`, { method:"DELETE" });
check("DEL  /api/corpus/:checksum", del.status === 200);

console.log("\nValidacion de entradas");
const short = await fetch(`${BASE}/api/plagiarism-check`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ text:"corto" }) });
check("rechaza texto corto (400)", short.status === 400);
const long = await fetch(`${BASE}/api/plagiarism-check`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ text:"a".repeat(130000) }) });
check("rechaza texto largo (400)", long.status === 400);
const badHarvest = await fetch(`${BASE}/api/corpus/harvest`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ endpoint:"no-es-url" }) });
check("rechaza endpoint invalido (400)", badHarvest.status === 400);

console.log(`\n${fails === 0 ? "HUMO: TODAS PASARON" : "HUMO: " + fails + " FALLARON"}`);
process.exitCode = fails ? 1 : 0;
