const texto = "Sostengo que el problema de la desercion en nuestra carrera no es academico sino logistico. Los estudiantes que abandonan no son los de peores notas: son los que viven en los recintos y dependen de un solo bus que sale a las cinco de la tarde. Si la ultima clase termina a las seis, la decision de abandonar se toma sola, sin que nadie la registre como lo que es.";
const vals = [];
for (let i = 0; i < 5; i++) {
  const r = await (await fetch("http://localhost:5000/api/plagiarism-check", {
    method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ text: texto }),
  })).json();
  vals.push(r.plagiarismPercentage);
  const top = r.results?.flatMap(x => x.sources ?? []).sort((a,b)=>b.similarity-a.similarity)[0];
  console.log(`  corrida ${i+1}: ${String(r.plagiarismPercentage).padStart(3)}%   top=${top ? `${top.similarity}% ${top.url.slice(0,58)}` : "sin fuentes"}`);
}
const min = Math.min(...vals), max = Math.max(...vals);
console.log(`\n  rango: ${min}% - ${max}%   dispersion: ${max-min} puntos`);
