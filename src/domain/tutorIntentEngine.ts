/**
 * Motor de intención del Tutor IA (100 % offline).
 *
 * Convierte la consulta del usuario en una clave de la base de conocimiento
 * (tutor.kb.<clave>). A diferencia de un simple `includes`, normaliza el texto
 * (minúsculas y sin tildes) y barre reglas priorizadas con sinónimos, de modo
 * que "redacción", "redaccion" o "redactar mejor" caen en el mismo tema.
 *
 * Las claves devueltas son las mismas que usa `KNOWLEDGE_RESPONSES_ES` y
 * `TUTOR_RESPONSE_TRANSLATIONS`, así que el contenido traducido no cambia.
 */

/** Quita tildes/diacríticos y pasa a minúsculas para comparar sin ruido. */
export function normalizeMatch(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

interface IntentRule {
  /** Clave de la KB que se devuelve si la regla acierta. */
  key: string;
  /** Cualquiera de estos fragmentos (normalizados) activa la regla. */
  has: string[];
  /** Si el texto contiene alguno de estos, la regla NO aplica. */
  not?: string[];
}

/**
 * Reglas priorizadas: se devuelve la PRIMERA regla que acierte (orden = prioridad),
 * igual que hacía la cadena else-if original, pero con normalización y sinónimos.
 */
const INTENT_RULES: IntentRule[] = [
  {
    key: 'ecuacion_booleana',
    has: ['booleana', 'booleano', 'boolean', 'operador and', 'operador or', 'operador not'],
    not: ['matriz'],
  },
  { key: 'matriz', has: ['matriz', 'consistencia', 'alineacion metodologica'] },
  {
    key: 'avance1',
    has: ['avance 1', 'avance1', 'primer avance', 'avance uno', 'que lleva el avance'],
  },
  { key: 'zotero', has: ['zotero', 'gestor de citas', 'gestor bibliografico', 'gestor de referencias'] },
  { key: 'scopus', has: ['scopus', 'wos', 'web of science', 'cuartil', 'ecuacion de busqueda', 'base de datos arbitrada'] },
  { key: 'apa', has: ['apa', 'et al', 'cita', 'citar', 'referencia', 'doi', 'bibliografia', 'parentetica', 'normas'] },
  {
    key: 'software',
    has: ['jamovi', 'spss', 'vosviewer', 'connected papers', 'software', 'toolbox', 'atlas.ti', 'maxqda'],
  },
  { key: 'variables', has: ['variable', 'independiente', 'dependiente', 'operacionalizacion', 'dimensiones e indicadores'] },
  {
    key: 'capitulos',
    has: ['5 capitulos', 'cinco capitulos', 'capitulo', 'estructura del documento', 'estructura canonica'],
  },
  { key: 'cuantitativo', has: ['cuantitativ', 'cualitativ', 'enfoque de investigacion', 'paradigma', 'epistemologic'] },
  { key: 'turnitin', has: ['turnitin', 'plagio', 'similitud', 'antiplagio', 'originalidad del texto'] },
  {
    key: 'revision_borrador',
    has: ['revisor de borrador', 'borrador', 'revisa mi', 'revisa mi avance', 'mi avance', 'subir mi', 'diagnostico', 'diagnostic', 'revisar mi'],
  },
  {
    key: 'objetivos',
    has: ['objetivo', 'bloom', 'infinitivo', 'verbo taxonomico', 'objetivo general', 'objetivos especificos'],
  },
  {
    key: 'requerimientos',
    has: ['requerimiento', 'requisito', 'ieee', 'rf-', 'rnf', 'funcional', 'no funcional', 'casos de uso', 'historias de usuario'],
  },
  {
    key: 'redaccion',
    has: ['redaccion', 'redactar', 'redacto', 'redactemos', 'escribir mejor', 'primera persona', 'ortograf', 'conectores', 'voz pasiva', 'parafraseo'],
  },
  { key: 'videoteca', has: ['videoteca', 'video', 'youtube', 'tutorial', 'rutas de video'] },
  {
    key: 'defensa',
    has: ['sustenta', 'defensa', 'sustentacion', 'diapositiva', 'exposicion', 'presentar la tesis', 'preguntas de la defensa'],
  },
  {
    key: 'estructura_documento',
    has: ['estructura del documento completo', 'secciones', 'indice', 'preliminares', 'documento completo', 'que lleva el documento'],
  },
  { key: 'asesoria', has: ['asesoria', 'ayuda', 'whatsapp', 'contactar', 'un tutor', 'un asesor'] },
];

/**
 * Devuelve la clave de la KB que mejor responde a la consulta, o 'default'
 * cuando ninguna regla acierta.
 */
export function matchTopicKey(raw: string): string {
  const q = normalizeMatch(raw);
  if (!q) return 'default';
  for (const rule of INTENT_RULES) {
    if (rule.not && rule.not.some((n) => q.includes(n))) continue;
    if (rule.has.some((h) => q.includes(h))) return rule.key;
  }
  return 'default';
}

/**
 * Máquina de estados guiada (flujo de pasos): define, para ciertos temas de la
 * KB, cuál es el "siguiente paso" natural en el proceso de la tesis. Si el tema
 * no tiene siguiente (p. ej. "asesoria"), `nextTopicKey` devuelve `undefined` y
 * el Tutor simplemente retoma el tema (sin CTA de avance).
 *
 * Solo apunta a claves que existen en `tutor.kb.*` (ver tutorResponses.ts).
 */
const TOPIC_NEXT: Partial<Record<string, string>> = {
  cuantitativo: 'objetivos',
  objetivos: 'variables',
  variables: 'matriz',
  matriz: 'ecuacion_booleana',
  ecuacion_booleana: 'scopus',
  scopus: 'zotero',
  zotero: 'apa',
  apa: 'redaccion',
  redaccion: 'turnitin',
  turnitin: 'revision_borrador',
  revision_borrador: 'estructura_documento',
  estructura_documento: 'defensa',
};

/** Devuelve el siguiente paso del flujo guiado para una clave KB (o undefined). */
export function nextTopicKey(key: string): string | undefined {
  return TOPIC_NEXT[key];
}

/**
 * Meta-intenciones de cortesía. El mini-agente las clasifica igual que los temas:
 * un saludo, un agradecimiento o una despedida NO son "texto libre" ni temas de la
 * KB, así que se resuelven aquí, en una sola fuente de verdad, en vez de añadir
 * ramas sueltas en el componente por cada caso ("hola", luego "gracias", luego…).
 */
export type MetaKey = 'greeting' | 'thanks' | 'farewell' | 'none';

// Palabras de cortesía por familia. Se normalizan a tokens (una frase de dos
// palabras aporta sus dos tokens) para poder comparar palabra por palabra.
const META_PHRASES: Record<Exclude<MetaKey, 'none'>, string[]> = {
  greeting: [
    'hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'hey',
    'saludos', 'que tal', 'como estas', 'buen dia', 'hello', 'hi',
    'good morning', 'good afternoon', 'good evening', 'good night',
  ],
  thanks: [
    'gracias', 'muchas gracias', 'te agradezco', 'se agradece', 'thank you',
    'thanks', 'muito obrigado', 'obrigado', 'obrigada', 'merci', 'grazie', 'thank u',
  ],
  farewell: [
    'adios', 'chao', 'hasta luego', 'hasta pronto', 'nos vemos', 'bye',
    'goodbye', 'see you', 'hasta manana', 'ate logo', 'au revoir', 'arrivederci',
  ],
};

// Conectores/relleno que pueden acompañar a una cortesía sin volverla tema
// ("gracias por tu ayuda", "muy amable"). NO incluye palabras de contenido.
const META_FILLER = new Set([
  'por', 'tu', 'su', 'mi', 'de', 'el', 'la', 'los', 'las', 'muy', 'con', 'todo',
  'toda', 'todos', 'todas', 'un', 'una', 'y', 'a', 'me', 'te', 'para', 'en',
  'que', 'es', 'eres', 'tan', 'amable', 'buena', 'bueno', 'genial', 'perfecto',
  'super', 'bien', 'sido', 'fue', 'esta', 'estuvo', 'claro', 'excelente',
]);

// Conjunto de tokens (palabras sueltas) permitidas por familia.
const META_TOKENS: Record<Exclude<MetaKey, 'none'>, Set<string>> = {
  greeting: new Set(META_PHRASES.greeting.flatMap((p) => p.split(' '))),
  thanks: new Set(META_PHRASES.thanks.flatMap((p) => p.split(' '))),
  farewell: new Set(META_PHRASES.farewell.flatMap((p) => p.split(' '))),
};

/**
 * Clasifica un mensaje como cortesía (saludo, agradecimiento o despedida) si es
 * breve y cada palabra es de cortesía o un relleno neutro. Si arrastra contenido
 * real ("hola, qué es la matriz") sobra la palabra "matriz" y NO se clasifica
 * como saludo; la prioridad de tema la decide `matchTopicKey`.
 */
export function matchMetaKey(raw: string): MetaKey {
  const q = normalizeMatch(raw).trim();
  if (!q) return 'none';
  // Solo letras/espacios para contar y comparar limpio.
  const clean = q.replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const words = clean.split(' ');
  if (words.length === 0 || words.length > 6) return 'none';

  for (const kind of ['greeting', 'thanks', 'farewell'] as const) {
    const allowed = META_TOKENS[kind];
    const hasKindToken = words.some((w) => allowed.has(w));
    if (!hasKindToken) continue;
    // Todas las palabras deben ser de la familia o relleno neutro.
    const allNeutral = words.every((w) => allowed.has(w) || META_FILLER.has(w));
    if (allNeutral) return kind;
  }
  return 'none';
}
