import { extractReadable, stripTags } from "../server/readable.js";

let fails = 0;
const check = (label, cond, detail = "") => {
  console.log(`  [${cond ? "PASA" : "FALLA"}] ${label}${detail ? " — " + detail : ""}`);
  if (!cond) fails++;
};

console.log("\n1. Articulo bien formado");
const article = `<!DOCTYPE html><html><head><title>Metodologia de investigacion</title></head>
<body>
<nav><a href="/x">Inicio</a><a href="/y">Contacto</a><a href="/z">Acerca</a></nav>
<header><h1>Sitio de prueba</h1></header>
<article>
<h1>La metodologia de la investigacion cientifica</h1>
<p>La investigacion cientifica moderna requiere metodologias rigurosas que permitan validar hipotesis mediante evidencia empirica verificable y reproducible por terceros independientes.</p>
<p>El metodo hipotetico deductivo parte de una conjetura general y deriva consecuencias observables que pueden ser contrastadas con datos obtenidos en condiciones controladas de laboratorio.</p>
<p>La reproducibilidad constituye el pilar fundamental del conocimiento cientifico, pues un resultado que no puede ser replicado por otros equipos carece de valor probatorio dentro de la comunidad academica.</p>
<p>Los disenos experimentales aleatorizados reducen el sesgo de seleccion y permiten inferir relaciones causales entre las variables independientes manipuladas y las dependientes medidas.</p>
</article>
<footer>Copyright 2025 Sitio de prueba. Todos los derechos reservados.</footer>
<script>console.log("analytics tracker");</script>
</body></html>`;

const r1 = extractReadable(article, "https://ejemplo.test/articulo");
check("usa Readability", r1.method === "readability", `method=${r1.method}`);
check("conserva el cuerpo", r1.text.includes("hipotetico deductivo"), `${r1.text.length} chars`);
check("descarta navegacion", !r1.text.includes("Contacto"));
check("descarta footer", !r1.text.toLowerCase().includes("derechos reservados"));
check("descarta script", !r1.text.includes("analytics"));

console.log("\n2. Pagina no-articulo (cae al fallback)");
const listing = `<html><body><ul><li><a href="/1">Item uno</a></li><li><a href="/2">Item dos</a></li></ul></body></html>`;
const r2 = extractReadable(listing, "https://ejemplo.test/lista");
check("no rompe", typeof r2.text === "string", `method=${r2.method}`);

console.log("\n3. Entidades y tipografia");
const ents = `<html><body><article><p>${"El an&aacute;lisis &mdash; seg&uacute;n Garc&iacute;a &amp; L&oacute;pez &mdash; requiere rigor metodologico y validacion empirica constante en cada etapa del proceso investigativo desarrollado. ".repeat(4)}</p></article></body></html>`;
const r3 = extractReadable(ents, "https://ejemplo.test/e");
check("decodifica acentos", r3.text.includes("análisis") && r3.text.includes("García"), r3.text.slice(0, 60));
check("decodifica &amp;", r3.text.includes("&"));

console.log("\n4. stripTags directo");
const s = stripTags("<div><p>Primera oracion.</p><p>Segunda oracion.</p></div>");
check("separa bloques", /Primera oracion\.\s*\n?\s*Segunda/.test(s), JSON.stringify(s));

console.log(`\n${fails === 0 ? "TODAS PASARON" : fails + " FALLARON"}`);
process.exitCode = fails ? 1 : 0;
