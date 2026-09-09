import { embed, cosine, windows, scorePassageAgainstSources, semanticReady, semanticStatus } from "../server/semantic.js";

let fails = 0;
const check = (l, c, d = "") => { console.log(`  [${c?"PASA":"FALLA"}] ${l}${d?" — "+d:""}`); if(!c) fails++; };

console.log("\n0. Disponibilidad del modelo (primera vez descarga ~120MB)");
const t0 = Date.now();
const ready = await semanticReady();
console.log(`         ${JSON.stringify(semanticStatus())} en ${((Date.now()-t0)/1000).toFixed(1)}s`);
if (!ready) { console.log("\nModelo no disponible — el sistema degrada a metricas lexicas."); process.exitCode = 0; process.exit(0); }

console.log("\n1. Ventanas");
const w = windows("palabra ".repeat(200).trim());
check("divide texto largo", w.length > 1 && w.length <= 14, `${w.length} ventanas`);
check("texto corto sin dividir", windows("una frase corta de prueba en este caso").length === 1);
check("texto minusculo se descarta", windows("tres palabras aqui").length === 0);

console.log("\n2. Similitud semantica (el caso que TF-IDF no ve)");
const original = "The results demonstrate that the proposed algorithm significantly outperforms existing baseline methods.";
const parafraseo = "The evidence indicates the suggested approach markedly exceeds the performance of current standard techniques.";
const distinto   = "The restaurant serves traditional Ecuadorian cuisine with fresh seafood from the coastal region.";

const [vo, vp, vd] = await embed([original, parafraseo, distinto]);
const simParafraseo = cosine(vo, vp);
const simDistinto = cosine(vo, vd);
check("parafrasis puntua alto", simParafraseo > 0.6, `coseno=${simParafraseo.toFixed(3)}`);
check("texto ajeno puntua bajo", simDistinto < 0.35, `coseno=${simDistinto.toFixed(3)}`);
check("separa ambos casos", simParafraseo - simDistinto > 0.35, `margen=${(simParafraseo-simDistinto).toFixed(3)}`);

console.log("\n3. Multilingue (espanol vs ingles)");
const es = "La fotosintesis convierte la energia luminosa en energia quimica en las plantas.";
const en = "Photosynthesis converts light energy into chemical energy in plants.";
const [ves, ven] = await embed([es, en]);
const cross = cosine(ves, ven);
check("cruza idiomas", cross > 0.6, `coseno=${cross.toFixed(3)}`);

console.log("\n4. Puntuacion pasaje vs fuentes");
const fuente = "Introduction. " + "Filler sentence about unrelated topics. ".repeat(30) +
  "The evidence indicates the suggested approach markedly exceeds the performance of current standard techniques. " +
  "More filler about other subjects entirely. ".repeat(30);
const ajena = "Cooking recipes and travel guides for the coastal region of Ecuador. ".repeat(20);

const t1 = Date.now();
const scores = await scorePassageAgainstSources(original, [fuente, ajena]);
// Caso adversarial: la frase clave esta rodeada de relleno identico repetido,
// que diluye el vector de la ventana. Lo que se exige es que la senal
// sobreviva la dilucion y quede separada de la fuente ajena, no un valor alto.
check("encuentra la coincidencia enterrada", scores[0] > 0.25, `score=${scores[0].toFixed(3)} en ${Date.now()-t1}ms`);
check("separa fuente relevante de ajena", scores[0] - scores[1] > 0.25, `${scores[0].toFixed(3)} vs ${scores[1].toFixed(3)}`);
check("descarta la fuente ajena", scores[1] < 0.3, `score=${scores[1].toFixed(3)}`);

console.log(`\n${fails === 0 ? "FASE 3 (motor): TODAS PASARON" : "FASE 3: " + fails + " FALLARON"}`);
process.exitCode = fails ? 1 : 0;
