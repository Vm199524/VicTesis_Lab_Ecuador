import { AutoTokenizer, AutoModelForCausalLM, env } from "@huggingface/transformers";
env.cacheDir = "./.models";

for (const id of ["onnx-community/Qwen2.5-0.5B", "Xenova/Qwen1.5-0.5B"]) {
  const t0 = Date.now();
  try {
    const tok = await AutoTokenizer.from_pretrained(id);
    const model = await AutoModelForCausalLM.from_pretrained(id, { dtype: "q4" });
    const enc = await tok("La fotosintesis convierte la energia luminosa en energia quimica dentro de las plantas.");
    const out = await model(enc);
    console.log(`[OK] ${id} — logits ${JSON.stringify(out.logits.dims)} en ${((Date.now()-t0)/1000).toFixed(1)}s`);
    break;
  } catch (e) {
    console.log(`[NO] ${id} — ${e.message.slice(0, 110)}`);
  }
}
