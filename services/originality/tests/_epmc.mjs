import { searchEuropePmc } from "../server/providers-oa.js";
import { buildQueries } from "../server/text.js";
const q = buildQueries("Photosynthesis converts light energy into chemical energy stored in organic compounds within plant cells.");
const t0 = Date.now();
const r = await searchEuropePmc(q);
console.log(`Europe PMC: ${r.length} resultados en ${Date.now()-t0}ms`);
r.forEach(x => console.log(`  ${String(x.content.length).padStart(7)} chars — ${x.title.slice(0,62)}`));
const full = r.filter(x => x.content.length > 5000);
console.log(`Con TEXTO COMPLETO (>5000 chars): ${full.length} de ${r.length}`);
