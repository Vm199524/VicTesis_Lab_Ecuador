const BASE = "http://localhost:5000";
let fails = 0;
const check = (l, c, d = "") => { console.log(`  [${c?"PASA":"FALLA"}] ${l}${d?" — "+d:""}`); if(!c) fails++; };
const J = async (m, p, b) => {
  const r = await fetch(`${BASE}${p}`, { method: m, headers: {"Content-Type":"application/json"}, body: b?JSON.stringify(b):undefined });
  return { status: r.status, body: await r.json() };
};

const tesisPrevia = `La presente investigacion analiza el impacto de las tecnologias de la informacion en el rendimiento academico de los estudiantes universitarios de la provincia del Guayas. El estudio adopta un enfoque cuantitativo de alcance correlacional con un diseno no experimental de corte transversal. La poblacion estuvo conformada por mil doscientos estudiantes matriculados en carreras de ingenieria, de los cuales se extrajo una muestra probabilistica estratificada de trescientos participantes. Los instrumentos de recoleccion incluyeron un cuestionario estructurado validado mediante juicio de expertos y un coeficiente alfa de Cronbach superior a cero coma ochenta. Los resultados evidencian una correlacion positiva moderada entre el uso academico de herramientas digitales y el promedio ponderado obtenido.`;

console.log("\n1. Estado inicial");
const s0 = await J("GET", "/api/corpus/stats");
check("expone estadisticas", s0.status === 200, JSON.stringify(s0.body));

console.log("\n2. Indexado de una tesis de 2023");
const idx = await J("POST", "/api/corpus/index", { text: tesisPrevia, title: "Impacto de las TIC en el rendimiento academico", author: "Estudiante A (2023)", origin: "tesis" });
check("indexa", idx.status === 200 && idx.body.added, `id=${idx.body.id}, ${idx.body.fingerprints} huellas`);
const checksum = idx.body.checksum;

console.log("\n3. Estudiante B copia parrafos de esa tesis");
const trabajoB = `Este documento presenta mi analisis personal sobre un tema de investigacion que he desarrollado durante el ultimo semestre academico en la universidad.

El estudio adopta un enfoque cuantitativo de alcance correlacional con un diseno no experimental de corte transversal. La poblacion estuvo conformada por mil doscientos estudiantes matriculados en carreras de ingenieria, de los cuales se extrajo una muestra probabilistica estratificada de trescientos participantes.

Finalmente presento conclusiones propias derivadas de mi propia lectura del material bibliografico consultado durante el proceso.`;

const t0 = Date.now();
const chk = await J("POST", "/api/plagiarism-check", { text: trabajoB });
const secs = ((Date.now()-t0)/1000).toFixed(1);
console.log(`         indice=${chk.body.plagiarismPercentage}% en ${secs}s`);
const corpusHit = chk.body.results?.flatMap(r => r.sources ?? []).find(s => s.url.startsWith("corpus://"));
check("detecta la copia del corpus local", Boolean(corpusHit), corpusHit ? `${corpusHit.similarity}% ${corpusHit.url}` : "sin coincidencia local");
check("indice refleja la copia", chk.body.plagiarismPercentage >= 25, `indice=${chk.body.plagiarismPercentage}%`);

console.log("\n4. Trabajo no relacionado");
const ajeno = `La gastronomia ecuatoriana de la region costa se caracteriza por el uso intensivo de mariscos frescos, platano verde y mani molido. El encebollado, considerado plato nacional del Ecuador, combina albacora fresca, yuca cocida y cebolla curtida en jugo de limon sutil. Cada familia conserva su propia receta transmitida oralmente entre generaciones.`;
const chk2 = await J("POST", "/api/plagiarism-check", { text: ajeno });
const hitAjeno = chk2.body.results?.flatMap(r => r.sources ?? []).some(s => s.url.startsWith("corpus://"));
check("no marca trabajo ajeno contra el corpus", !hitAjeno, `indice=${chk2.body.plagiarismPercentage}%`);

console.log("\n5. Derecho de supresion");
const del = await J("DELETE", `/api/corpus/${checksum}`);
check("borra el documento", del.status === 200 && del.body.removed);
// El corpus puede contener documentos de otras fuentes (cosecha, otras
// pruebas); lo que se verifica es que este documento concreto ya no esta.
const s1 = await J("GET", "/api/corpus/stats");
check("desaparece del corpus", s1.body.documents === s0.body.documents,
  `${s0.body.documents} antes -> ${s1.body.documents} despues`);
const rechk = await J("POST", "/api/plagiarism-check", { text: trabajoB });
check("ya no coincide tras el borrado",
  !rechk.body.results?.flatMap(r => r.sources ?? []).some(s => s.url.startsWith("corpus://")));
check("borrar dos veces devuelve 404", (await J("DELETE", `/api/corpus/${checksum}`)).status === 404);

console.log(`\n${fails === 0 ? "FASE 4: TODAS PASARON" : "FASE 4: " + fails + " FALLARON"}`);
process.exitCode = fails ? 1 : 0;
