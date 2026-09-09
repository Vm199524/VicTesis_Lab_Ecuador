import { AutoTokenizer, AutoModelForCausalLM, env } from "@huggingface/transformers";
env.cacheDir = "./.models";
const t0 = Date.now();
try {
  const id = "Xenova/distilgpt2";
  const tok = await AutoTokenizer.from_pretrained(id);
  const model = await AutoModelForCausalLM.from_pretrained(id, { dtype: "q8" });
  console.log(`modelo causal cargado en ${((Date.now()-t0)/1000).toFixed(1)}s`);

  const texto = "The quick brown fox jumps over the lazy dog every single morning.";
  const enc = await tok(texto);
  const out = await model(enc);
  console.log("logits shape:", out.logits.dims);
  console.log("=> perplejidad calculable: SI");
} catch (e) {
  console.log("=> perplejidad calculable: NO —", e.message.slice(0, 150));
}
