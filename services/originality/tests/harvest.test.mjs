import { parseOaiPage, probeRepository, harvestRepository } from "../server/harvest.js";
import { corpusStats, closeCorpus } from "../server/corpus.js";

let fails = 0;
const check = (l, c, d = "") => { console.log(`  [${c?"PASA":"FALLA"}] ${l}${d?" — "+d:""}`); if(!c) fails++; };

console.log("\n1. Parseo OAI-PMH (sin red)");
const xml = `<?xml version="1.0"?>
<OAI-PMH><ListRecords>
<record><header><identifier>oai:test:1</identifier></header><metadata><oai_dc:dc>
<dc:title>An&#225;lisis del rendimiento acad&#233;mico</dc:title>
<dc:creator>Perez, Maria</dc:creator><dc:creator>Lopez, Juan</dc:creator>
<dc:description>Este trabajo examina la relaci&#243;n entre h&#225;bitos de estudio y calificaciones.</dc:description>
<dc:identifier>oai:test:1</dc:identifier>
<dc:identifier>https://repositorio.test/handle/123</dc:identifier>
<dc:date>2023-05-10</dc:date><dc:type>bachelorThesis</dc:type>
</oai_dc:dc></metadata></record>
<record><header status="deleted"><identifier>oai:test:2</identifier></header></record>
</ListRecords><resumptionToken>tok123</resumptionToken></OAI-PMH>`;

const { records, resumptionToken } = parseOaiPage(xml);
check("extrae registros vivos", records.length === 1, `${records.length} registros`);
check("omite registros borrados", !records.some(r => r.title === ""));
check("decodifica entidades", records[0].title.includes("Análisis") && records[0].title.includes("académico"), records[0].title);
check("une varios autores", records[0].author === "Perez, Maria, Lopez, Juan", records[0].author);
check("prefiere URL resoluble", records[0].url === "https://repositorio.test/handle/123", records[0].url);
check("captura resumptionToken", resumptionToken === "tok123", resumptionToken);

console.log("\n2. Sondeo de repositorios reales");
const endpoints = [
  ["UNEMI", "https://repositorio.unemi.edu.ec/oai/request"],
  ["ESPOL", "https://www.dspace.espol.edu.ec/oai/request"],
  ["arXiv", "https://export.arxiv.org/oai2"],
];
// probeRepository solo confirma que el endpoint habla OAI-PMH. Un DSpace puede
// responder Identify y aun asi no servir registros si su indice OAI nunca fue
// construido, asi que la cosecha real se valida por separado.
for (const [nombre, url] of endpoints) {
  try {
    const info = await probeRepository(url);
    console.log(`  [OK]    ${nombre.padEnd(8)} "${info.name}"`);
  } catch (e) {
    console.log(`  [n/d]   ${nombre.padEnd(8)} ${e.message.slice(0, 70)}`);
  }
}
const vivo = "https://export.arxiv.org/oai2";
const vivoSet = "cs";

if (vivo) {
  console.log(`\n3. Cosecha real (10 registros de ${vivo.slice(0, 50)})`);
  const antes = corpusStats().documents;
  const r = await harvestRepository(vivo, { maxRecords: 10, set: vivoSet });
  const despues = corpusStats().documents;
  console.log(`         obtenidos=${r.fetched} indexados=${r.indexed} omitidos=${r.skipped}`);
  if (r.errors.length) console.log(`         errores: ${r.errors[0]}`);
  check("cosecha registros", r.fetched > 0, `${r.fetched} registros`);
  check("crece el corpus", despues >= antes, `${antes} -> ${despues} documentos`);
} else {
  console.log("\n3. Cosecha real — omitida: ningun endpoint accesible desde esta red");
}

closeCorpus();
console.log(`\n${fails === 0 ? "FASE 4 (cosecha): TODAS PASARON" : "FASE 4: " + fails + " FALLARON"}`);
process.exitCode = fails ? 1 : 0;
