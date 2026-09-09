import { indexDocument, searchCorpus, corpusStats } from "../server/corpus.js";
import { chunkText, tokenize, winnow } from "../server/text.js";
import { findSources } from "../server/sources.js";

const tesis = `La presente investigacion analiza el impacto de las tecnologias de la informacion en el rendimiento academico de los estudiantes universitarios de la provincia del Guayas. El estudio adopta un enfoque cuantitativo de alcance correlacional con un diseno no experimental de corte transversal. La poblacion estuvo conformada por mil doscientos estudiantes matriculados en carreras de ingenieria, de los cuales se extrajo una muestra probabilistica estratificada de trescientos participantes. Los instrumentos de recoleccion incluyeron un cuestionario estructurado validado mediante juicio de expertos y un coeficiente alfa de Cronbach superior a cero coma ochenta. Los resultados evidencian una correlacion positiva moderada entre el uso academico de herramientas digitales y el promedio ponderado obtenido.`;
indexDocument(tesis, { title: "Tesis 2023", origin: "tesis" });
console.log("corpus:", JSON.stringify(corpusStats()));

const trabajoB = `Este documento presenta mi analisis personal sobre un tema de investigacion que he desarrollado durante el ultimo semestre academico en la universidad.

El estudio adopta un enfoque cuantitativo de alcance correlacional con un diseno no experimental de corte transversal. La poblacion estuvo conformada por mil doscientos estudiantes matriculados en carreras de ingenieria, de los cuales se extrajo una muestra probabilistica estratificada de trescientos participantes.

Finalmente presento conclusiones propias derivadas de mi propia lectura del material bibliografico consultado durante el proceso.`;

console.log("\n--- por documento completo ---");
console.log("coincidencias:", searchCorpus(trabajoB, 3).length);

console.log("\n--- por chunk (como hace analyzeDocument) ---");
const chunks = chunkText(trabajoB);
chunks.forEach((c, i) => {
  const t = tokenize(c.text);
  const fp = winnow(t);
  const hits = searchCorpus(c.text, 3);
  console.log(`chunk ${i}: ${t.length} tokens, ${fp.size} huellas -> ${hits.length} coincidencias${hits[0]?` (${hits[0].shared} compartidas)`:""}`);
  console.log(`   "${c.text.slice(0,80)}..."`);
});

console.log("\n--- via findSources ---");
const src = await findSources(chunks[1].text, 8);
console.log("proveedores que respondieron:", src.map(s => s.provider ?? "?").join(", "));
console.log("hay corpus:", src.some(s => s.provider === "corpus"));
