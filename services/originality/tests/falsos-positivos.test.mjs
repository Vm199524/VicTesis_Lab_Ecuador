/**
 * Un detector que marca trabajo honesto es peor que no tener detector.
 * Estos textos son originales; ninguno deberia superar el umbral de revision.
 */
const BASE = "http://localhost:5000";
let fails = 0;

const ORIGINALES = [
  ["memoria personal", `Mi abuela guardaba las llaves oxidadas de la casa de Cuenca en una lata de galletas que olia a clavo de olor. Cada vez que llovia fuerte sacaba la lata del cajon, se sentaba en la silla de la cocina y las contaba en voz baja, una por una. Nunca me explico de que puertas eran. Murio en marzo y la lata sigue en el mismo cajon donde ella la dejo.`],
  ["metodologia de tesis", `Para esta investigacion seleccione a doce docentes del colegio donde trabajo, todos con mas de cinco anos de experiencia en aulas de bachillerato tecnico. Las entrevistas se realizaron en la sala de profesores durante los recreos, lo que limito su duracion a unos veinte minutos cada una. Transcribi las grabaciones a mano porque el software de transcripcion no reconocia bien el acento serrano de dos participantes.`],
  ["observacion de campo", `El martes llegue al taller a las siete de la manana y ya habia cuatro estudiantes esperando afuera. Anote que ninguno traia el equipo de proteccion completo, aunque el reglamento lo exige desde el ano pasado. Cuando pregunte, dos dijeron que las gafas se les habian roto y nadie las repuso; los otros dos simplemente se encogieron de hombros.`],
  ["argumentacion propia", `Sostengo que el problema de la desercion en nuestra carrera no es academico sino logistico. Los estudiantes que abandonan no son los de peores notas: son los que viven en los recintos y dependen de un solo bus que sale a las cinco de la tarde. Si la ultima clase termina a las seis, la decision de abandonar se toma sola, sin que nadie la registre como lo que es.`],
];

const post = async (text) => {
  const r = await fetch(`${BASE}/api/plagiarism-check`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }),
  });
  return r.json();
};

console.log("\nControl de falsos positivos (todos son textos originales)");
const UMBRAL = 25;
const puntuaciones = [];

for (const [etiqueta, texto] of ORIGINALES) {
  const r = await post(texto);
  const idx = r.plagiarismPercentage ?? -1;
  puntuaciones.push(idx);
  const ok = idx <= UMBRAL;
  if (!ok) fails++;
  const fuente = r.results?.flatMap(x => x.sources ?? []).sort((a,b)=>b.similarity-a.similarity)[0];
  console.log(`  [${ok?"PASA":"FALLA"}] ${etiqueta.padEnd(24)} indice=${String(idx).padStart(3)}%${fuente?`  (top: ${fuente.similarity}% ${fuente.url.slice(0,52)})`:""}`);
}

const media = (puntuaciones.reduce((a,b)=>a+b,0) / puntuaciones.length).toFixed(1);
const max = Math.max(...puntuaciones);
console.log(`\n  media=${media}%  maximo=${max}%  umbral=${UMBRAL}%`);

console.log(`\n${fails === 0 ? "FALSOS POSITIVOS: TODAS PASARON" : "FALSOS POSITIVOS: " + fails + " FALLARON"}`);
process.exitCode = fails ? 1 : 0;
