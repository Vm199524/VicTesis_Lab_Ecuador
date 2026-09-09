import { detectAiText, aiDetectStatus } from "../server/ai-detect.js";

let fails = 0;
const check = (l, c, d = "") => { console.log(`  [${c?"PASA":"FALLA"}] ${l}${d?" — "+d:""}`); if(!c) fails++; };

// Texto humano real: memoria personal, ritmo irregular, digresiones.
const humano = `Mi abuela guardaba las llaves oxidadas de la casa de Cuenca en una lata de galletas que olia a clavo de olor. No se por que las guardaba. Cada vez que llovia fuerte —y en Cuenca llueve fuerte casi todos los dias de marzo— sacaba la lata del cajon de abajo, se sentaba en la silla de la cocina y las contaba en voz baja, una por una, como si rezara.

Nunca me explico de que puertas eran. Yo le preguntaba, ella se reia y cambiaba de tema. Una vez me dijo que eran de la casa vieja, pero la casa vieja la vendieron en el setenta y dos y ella misma entrego las llaves al comprador, eso lo se porque mi mama lo cuenta cada Navidad.

Murio en marzo, claro. La lata sigue en el mismo cajon. Yo no las he contado nunca.`;

// Texto tipico de LLM: estructura pareja, conectores de apertura, sin voz personal.
const generado = `La inteligencia artificial ha transformado significativamente el panorama educativo contemporaneo. Ademas, las instituciones academicas han adoptado progresivamente herramientas digitales que optimizan los procesos de ensenanza y aprendizaje. Sin embargo, es importante considerar los desafios eticos que surgen de esta implementacion tecnologica.

Por otra parte, la personalizacion del aprendizaje representa uno de los beneficios mas destacados de estas tecnologias. Los sistemas adaptativos permiten ajustar el contenido segun el ritmo individual de cada estudiante. Asimismo, la retroalimentacion automatizada facilita la identificacion temprana de dificultades de comprension.

En conclusion, la integracion de la inteligencia artificial en la educacion ofrece oportunidades sustanciales para mejorar la calidad educativa. No obstante, resulta fundamental establecer marcos regulatorios adecuados. Finalmente, la colaboracion entre educadores y tecnologos sera determinante para el exito de estas iniciativas.`;

console.log("\n0. Estado del modelo");
console.log(`         ${JSON.stringify(aiDetectStatus())}`);

console.log("\n1. Texto humano (memoria personal)");
const t0 = Date.now();
const h = await detectAiText(humano);
console.log(`         puntuacion=${h.score}% banda="${h.label}" confianza=${h.confidence} modelo=${h.modelUsed} (${((Date.now()-t0)/1000).toFixed(1)}s)`);
h.signals.forEach(s => console.log(`           ${s.label.padEnd(38)} ${String(s.contribution).padStart(3)}%  (medido: ${s.measured})`));
check("devuelve puntuacion", typeof h.score === "number");
check("usa el modelo de lenguaje", h.modelUsed === true);
check("incluye advertencia", h.caveat?.includes("no constituye prueba"));
check("expone todas las senales", h.signals.length >= 5, `${h.signals.length} senales`);

console.log("\n2. Texto generado por IA");
const g = await detectAiText(generado);
console.log(`         puntuacion=${g.score}% banda="${g.label}" confianza=${g.confidence}`);
g.signals.forEach(s => console.log(`           ${s.label.padEnd(38)} ${String(s.contribution).padStart(3)}%  (medido: ${s.measured})`));
check("devuelve color", typeof g.color === "string" && g.color.startsWith("#"));
check("devuelve bg", typeof g.bg === "string" && g.bg.startsWith("#"));
check("devuelve recomendaciones para banda alta", Array.isArray(g.recommendations) && g.recommendations.length > 0, `${g.recommendations?.length} recomendaciones`);

console.log("\n3. Separacion entre ambos");
console.log(`         humano=${h.score}%  generado=${g.score}%  margen=${g.score - h.score} puntos`);
check("separa humano de generado", g.score > h.score, `${h.score}% vs ${g.score}%`);
check("margen utilizable", g.score - h.score >= 15, `margen=${g.score - h.score}`);

console.log("\n4. Texto corto");
const corto = await detectAiText("Solo unas pocas palabras aqui, insuficientes para cualquier analisis estadistico serio.");
check("rechaza texto corto", corto.score === null && corto.band === "insufficient", corto.note);

console.log(`\n${fails === 0 ? "FASE 5: TODAS PASARON" : "FASE 5: " + fails + " FALLARON"}`);
process.exitCode = fails ? 1 : 0;
