import { indexDocument, searchCorpus, forget, corpusStats, checksumOf, closeCorpus } from "../server/corpus.js";
import fs from "node:fs";

process.env.CORPUS_DB = ":memory:";
let fails = 0;
const check = (l, c, d = "") => { console.log(`  [${c?"PASA":"FALLA"}] ${l}${d?" — "+d:""}`); if(!c) fails++; };

const tesis2023 = `La presente investigacion analiza el impacto de las tecnologias de la informacion en el rendimiento academico de los estudiantes universitarios de la provincia del Guayas durante el periodo comprendido entre los anos dos mil veinte y dos mil veintitres. El estudio adopta un enfoque cuantitativo de alcance correlacional con un diseno no experimental de corte transversal. La poblacion estuvo conformada por mil doscientos estudiantes matriculados en carreras de ingenieria, de los cuales se extrajo una muestra probabilistica estratificada de trescientos participantes. Los instrumentos de recoleccion incluyeron un cuestionario estructurado validado mediante juicio de expertos y un coeficiente alfa de Cronbach superior a cero coma ochenta. Los resultados evidencian una correlacion positiva moderada entre el uso academico de herramientas digitales y el promedio ponderado obtenido por los estudiantes al finalizar cada periodo lectivo.`;

console.log("\n1. Indexado");
const r1 = indexDocument(tesis2023, { title: "Impacto de las TIC en el rendimiento academico", author: "Estudiante A", origin: "tesis" });
check("indexa documento", r1.added && r1.id > 0, `id=${r1.id}, ${r1.fingerprints} huellas`);
const r2 = indexDocument(tesis2023, { title: "duplicado" });
check("no duplica", !r2.added && r2.id === r1.id);
check("rechaza texto corto", indexDocument("muy corto", {}).added === false);

console.log("\n2. Deteccion de copia entre estudiantes");
// Estudiante B copia dos oraciones de la tesis de 2023 dentro de su propio trabajo.
const trabajoB = `Introduccion a mi propio trabajo sobre otro tema completamente distinto que desarrollo libremente.
El estudio adopta un enfoque cuantitativo de alcance correlacional con un diseno no experimental de corte transversal. La poblacion estuvo conformada por mil doscientos estudiantes matriculados en carreras de ingenieria, de los cuales se extrajo una muestra probabilistica estratificada de trescientos participantes.
Conclusiones propias que no tienen relacion con ninguna fuente anterior consultada.`;

const hits = searchCorpus(trabajoB, 3);
check("encuentra la tesis previa", hits.length > 0, `${hits.length} coincidencias`);
if (hits[0]) {
  console.log(`         "${hits[0].title}" — ${hits[0].shared} huellas compartidas, origen=${hits[0].origin}`);
  check("devuelve el cuerpo para puntuar", hits[0].content.length > 500, `${hits[0].content.length} chars`);
}

console.log("\n3. Documento no relacionado");
const ajeno = `La gastronomia ecuatoriana de la region costa se caracteriza por el uso intensivo de mariscos frescos, platano verde y mani. El encebollado, considerado plato nacional, combina albacora, yuca y cebolla curtida en jugo de limon. Su preparacion varia entre provincias y cada familia conserva su propia receta transmitida oralmente entre generaciones sucesivas.`;
check("no marca documento ajeno", searchCorpus(ajeno, 3).length === 0);

console.log("\n4. Auto-exclusion");
check("un documento no coincide consigo mismo",
  searchCorpus(tesis2023, 3, { excludeChecksum: checksumOf(tesis2023) }).length === 0);
check("sin exclusion si coincide", searchCorpus(tesis2023, 3).length === 1);

console.log("\n5. Estadisticas y borrado");
const stats = corpusStats();
check("reporta estadisticas", stats.documents === 1 && stats.fingerprints > 0,
  `${stats.documents} docs, ${stats.fingerprints} huellas, origenes=${JSON.stringify(stats.byOrigin)}`);
check("borra por checksum", forget(checksumOf(tesis2023)) === true);
check("queda vacio tras borrar", corpusStats().documents === 0);

closeCorpus();
console.log(`\n${fails === 0 ? "FASE 4 (corpus): TODAS PASARON" : "FASE 4: " + fails + " FALLARON"}`);
process.exitCode = fails ? 1 : 0;
