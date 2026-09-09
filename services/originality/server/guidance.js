/**
 * Corrective guidance.
 *
 * A detector that only reports a number leaves the author exactly where they
 * started. This module turns both measurements into work the author can do:
 * which signal produced the AI estimate and what rewriting actually moves it,
 * and which passages produce the similarity index and how many points each
 * correction is worth.
 *
 * Two design constraints shape everything here.
 *
 * First, the AI guidance teaches academic writing, not detector evasion. Every
 * technique lowers the score because the text genuinely improves: more specific
 * evidence, a visible authorial position, real argument. Nothing here suggests
 * degrading the text to fool a classifier — that would be worthless to the
 * author, indefensible before a university, and incoherent in a product whose
 * other half is the detector itself.
 *
 * Second, the reduction plan computes its numbers. The index is
 * `round(copiedWords / totalWords * 100)` (see `plagiarism.js`), so a correction
 * that retires N matched words is worth `round(N / totalWords * 100)` points and
 * nothing more. Where an estimate is unavoidable it is conservative and stated
 * as such, because a plan that promises a drop it cannot deliver is worse than
 * no plan.
 */

/** Below this, a match is noise: shared function words, not reusable material. */
const MIN_SIMILARITY = 10;

/**
 * A deep reformulation retires the literal overlap but not the vocabulary of the
 * field. A conservative quarter of each rewritten passage is assumed to remain
 * as legitimate terminology, so the projected index errs high rather than
 * promising a drop the author will not see.
 */
const RESIDUAL_TERMINOLOGY = 0.25;

const SEVERITY_RANK = { alta: 0, media: 1, baja: 2, informativa: 3 };

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

function countWords(sentence) {
  return String(sentence ?? "")
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Spanish decimal notation, so the report reads in the language it is written in. */
function dec(value, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "n/d";
  return value.toFixed(digits).replace(".", ",");
}

function asPercent(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "n/d";
  return `${Math.round(value * 100)}%`;
}

/** Straight, typographic and angle quotes: any of them marks a citation. */
function hasQuotes(sentence) {
  return /["'“”‘’«»]/.test(String(sentence ?? ""));
}

/**
 * Does this passage look like an entry in a reference list?
 *
 * In-text citations ("Segun Lastra (2021), el exilio...") must not match, or the
 * plan would classify ordinary cited prose as bibliography and promise a
 * reduction that never arrives. A structural marker is therefore required —
 * an author-initial opening or a locator — which running prose almost never has.
 */
const REFERENCE_STRONG = [
  /^[A-ZÁÉÍÓÚÑ][\p{L}'’-]+,\s+[A-ZÁÉÍÓÚÑ]\./u,
  /https?:\/\/|doi\.org|\b10\.\d{4,}\//i,
  /\b(?:pp?\.|vol\.|n[uú]m\.|no\.|ed\.|edit\.)\s*\d/i,
];

const REFERENCE_WEAK = [
  /\(\d{4}[a-z]?\)/,
  /\b(?:et al|Recuperado de|Retrieved from|En prensa)\b/i,
];

function looksLikeReference(sentence) {
  const value = String(sentence ?? "");
  const strong = REFERENCE_STRONG.filter((pattern) => pattern.test(value)).length;
  if (strong === 0) return false;
  return strong + REFERENCE_WEAK.filter((pattern) => pattern.test(value)).length >= 2;
}

/* ================================================================== *
 * 1. AI rewriting guidance
 * ================================================================== */

/**
 * One entry per signal `ai-detect.js` measures, holding the correction that
 * actually moves that signal. The calibration endpoints quoted in each `why`
 * are the ramps used to score it, so the author sees their own value against
 * the reference rather than a bare verdict.
 */
const SIGNAL_PLAYBOOK = {
  perplexity: {
    title: "Sustituir lo general por lo particular",
    why: (m) =>
      (m === null
        ? "El modelo predice tu texto con demasiada facilidad."
        : `El modelo predice tu texto con una perplejidad de ${dec(m, 1)}, frente a un valor cercano a 40 propio de la escritura humana y a 8 del texto generado.`) +
      " Un texto se vuelve predecible cuando afirma lo que cualquiera afirmaría: enunciados generales, sin dato, sin caso, sin fecha.",
    technique:
      "Recorre el documento afirmación por afirmación y reemplaza cada enunciado general por un particular verificable que solo tú puedes aportar: la cifra de tu propio levantamiento, el número de causa, la fecha exacta de la sentencia, el nombre del cantón, el artículo concreto del instrumento. Lo impredecible es lo específico.",
    target: "Ninguna afirmación sustantiva sin un dato, un caso o una fuente que la ancle.",
    impact:
      "Es la señal de mayor peso del cálculo (40%). Subir la perplejidad es lo que más mueve el resultado, y solo se consigue aportando contenido que no estaba escrito en ninguna otra parte.",
    example: {
      before:
        "Los derechos humanos han experimentado una evolución significativa a lo largo de la historia, consolidándose como un pilar fundamental del ordenamiento jurídico internacional.",
      after:
        "Entre 1948 y 1969 el catálogo pasó de treinta artículos declarativos a un tratado exigible: la Convención Americana, que Ecuador ratificó el 28 de diciembre de 1977 y cuya competencia contenciosa aceptó solo en 1984.",
    },
  },

  burstiness: {
    title: "Alternar la densidad del argumento",
    why: (m) =>
      (m === null
        ? "La predictibilidad de tu texto apenas varía de un pasaje a otro."
        : `La variación de predictibilidad entre pasajes es de ${dec(m)}, cuando la escritura humana ronda 3,20 y la generada 1,40.`) +
      " El documento mantiene un pulso constante: todos los párrafos afirman con la misma seguridad y en el mismo nivel de abstracción.",
    technique:
      "Introduce tramos que un modelo no produce por defecto: una concesión al argumento contrario, una limitación de tu propio análisis, una duda metodológica explícita, un dato que no encaja del todo con tu tesis. La escritura humana avanza y se corrige; la generada solo avanza.",
    target: "Al menos una concesión, una limitación asumida o un contraargumento por apartado.",
    impact:
      "Segunda señal en peso (25%). Un solo párrafo verdaderamente matizado por sección cambia la medición de forma apreciable.",
    example: {
      before:
        "La Corte Interamericana ha ampliado progresivamente el catálogo de derechos protegidos. Su jurisprudencia ha reconocido el derecho al ambiente sano. También ha incorporado los derechos de las personas mayores.",
      after:
        "La Corte Interamericana amplió el catálogo por vía interpretativa, no por reforma del tratado. Y conviene matizarlo: esa expansión no ha sido pacífica —varios Estados han cuestionado la competencia del tribunal para derivar derechos no enumerados— y la propia Corte admite en la OC-23/17 que el estándar ambiental sigue en construcción.",
    },
  },

  lengthVariation: {
    title: "Prosodia deliberada de la oración",
    why: (m) =>
      (m === null
        ? "Tus oraciones miden casi todas lo mismo."
        : `El coeficiente de variación de la longitud de tus oraciones es ${dec(m)}; la prosa humana suele situarse cerca de 0,62 y la generada en 0,22.`) +
      " Un ritmo uniforme delata composición automática antes que cualquier otra cosa.",
    technique:
      "Después de dos oraciones largas con subordinación, escribe una corta y asertiva de seis a nueve palabras. Usa la oración breve para sentar la conclusión del tramo, nunca como relleno. Lee el párrafo en voz alta: si no puedes respirar, es que no hay pausa.",
    target: "Coeficiente de variación ≥ 0,60 en cada apartado.",
    impact:
      "Peso del 15%. Es la corrección más rápida de aplicar y su efecto sobre la medición es inmediato.",
    example: {
      before:
        "El presente trabajo analiza la evolución histórica de los derechos humanos, identificando los principales acontecimientos, documentos y movimientos sociales que contribuyeron a su reconocimiento progresivo. Para ello se organiza en seis apartados que abordan sucesivamente los antecedentes filosóficos, el proceso de internacionalización, la teoría de las generaciones, la arquitectura institucional, el papel de los movimientos sociales y los desafíos contemporáneos.",
      after:
        "Este trabajo analiza la evolución histórica de los derechos humanos a partir de los acontecimientos y movimientos que forzaron cada reconocimiento. La exposición sigue un orden cronológico y no temático, porque las conquistas normativas se explican mejor por la coyuntura que las produjo que por la categoría a la que hoy se las asigna. Son seis apartados. El primero desanda el argumento filosófico.",
    },
  },

  connectives: {
    title: "Retirar los conectores de plantilla del inicio de oración",
    why: (m) =>
      (m === null
        ? "Muchas de tus oraciones abren con un conector explícito."
        : `${asPercent(m)} de tus oraciones abren con un conector explícito («Además», «Sin embargo», «Por lo tanto», «En conclusión», «Es importante destacar»), cuando la escritura humana ronda el 8% y la generada el 42%.`) +
      " Los modelos encadenan párrafos con rótulos porque así hacen visible una estructura que no está en el contenido.",
    technique:
      "Elimina el conector inicial y reconstruye la relación lógica dentro de la propia oración: subordina, usa dos puntos, reordena para que el sujeto de la segunda oración retome el predicado de la primera. Si al quitar el conector la oración deja de encajar, el problema no era el conector: era que no había relación real entre las dos ideas.",
    target: "Menos del 15% de oraciones con conector en posición inicial.",
    impact:
      "Peso del 10%, pero es la señal más visible para un lector humano: un evaluador reconoce el patrón mucho antes que cualquier detector.",
    example: {
      before:
        "Además, la digitalización ha desplazado el poder de afectación hacia actores privados. Sin embargo, el sistema fue concebido sobre la responsabilidad estatal. Por lo tanto, resulta necesario replantear el círculo de destinatarios.",
      after:
        "La digitalización desplazó el poder de afectación hacia actores privados que el sistema nunca contempló: fue concebido sobre la premisa de la responsabilidad estatal. Ese desajuste es el que obliga a replantear el círculo de destinatarios de las obligaciones.",
    },
  },

  lexicalDiversity: {
    title: "Devolver el peso al verbo",
    why: (m) =>
      (m === null
        ? "El vocabulario es amplio pero gira sobre las mismas construcciones."
        : `La diversidad léxica medida es ${dec(m)}, con referencia humana cercana a 0,62 y generada a 0,44.`) +
      " El vocabulario es amplio pero se apoya una y otra vez en las mismas construcciones nominales.",
    technique:
      "Suprime las muletillas de relleno —«juega un papel fundamental», «en el marco de», «es importante destacar que», «resulta necesario señalar»— y convierte cada nominalización abstracta en el verbo que la origina: «la implementación de mecanismos» pasa a «implementar mecanismos» y, mejor aún, a quién los implementa y desde cuándo.",
    target: "Cero muletillas de relleno; sujeto explícito y verbo pleno en las oraciones que sostienen el argumento.",
    impact:
      "Peso del 5% en el cálculo, pero el recorte libera entre un 10% y un 15% de extensión que puedes dedicar a evidencia propia, que sí pesa.",
    example: {
      before:
        "La implementación de mecanismos de protección juega un papel fundamental en el marco de la garantía efectiva de los derechos, siendo importante destacar la necesidad de una adecuada articulación institucional.",
      after:
        "Los mecanismos de protección solo garantizan derechos si las instituciones se coordinan. Cuando no lo hacen, la garantía queda en el papel: el reclamo llega al organismo que no tiene competencia para resolverlo.",
    },
  },

  humanMarkers: {
    title: "Hacer visible la posición del autor",
    why: (m) =>
      (m === null
        ? "El texto no deja ver en ningún momento quién razona."
        : `Se detectaron ${Math.round((m ?? 0) * 5)} de las cinco marcas de voz personal que se buscan (primera persona analítica, incisos entre paréntesis, puntuación de matiz, adversativas y digresiones).`) +
      " El texto no dice en ningún momento quién está razonando ni desde dónde.",
    technique:
      "Declara la posición desde la que escribes y las decisiones que tomaste: «este trabajo sostiene que…», «se optó por analizar solo jurisprudencia publicada porque…», «asumo una limitación:…». Añade algún inciso entre paréntesis con la precisión que no cabía en la línea principal. No es informalidad: es autoría.",
    target: "Una declaración de posición en la introducción y una limitación asumida en las conclusiones, como mínimo.",
    impact:
      "Peso del 5%, y el de mayor valor ante un evaluador humano: la voz propia es justamente lo que un modelo no aporta si no se le pide.",
    example: {
      before:
        "Se puede concluir que existe una brecha entre el reconocimiento normativo y la garantía efectiva de los derechos.",
      after:
        "Este trabajo sostiene que la brecha no es de reconocimiento sino de exigibilidad. Asumo una limitación: el argumento se apoya en jurisprudencia interamericana publicada, de modo que los casos resueltos en instancias internas quedan fuera del análisis.",
    },
  },
};

/**
 * Techniques that apply whatever the signal breakdown says, because they add
 * material no model could have produced. They carry the severity of the overall
 * score rather than of any single measurement.
 */
const CROSS_CUTTING = [
  {
    id: "cita-con-parafrasis",
    title: "Citar con paráfrasis propia, no con la redacción de la fuente",
    why:
      "Cuando una idea ajena se reproduce parafraseada en palabras propias y con su cita, dos cosas pasan a la vez: el índice de similitud baja porque la secuencia literal de la fuente ya no está, y el indicio de IA también baja, porque parafrasear obliga a decisiones de redacción — orden, énfasis, ejemplos propios — que un modelo no toma por ti cuando solo compila.",
    technique:
      "Para cada idea que tomes de una fuente: cierra el texto original, escribe la idea de memoria con tu propia estructura de oración, y cita al autor igual que si la hubieras copiado literal. La cita no es opcional por parafrasear: sigue siendo su idea, aunque la redacción sea tuya. Evita el error inverso — parafrasear tan cerca de la fuente que solo cambian los sinónimos, cuyo efecto sobre ambos índices es mínimo.",
    target: "Ninguna idea ajena sin cita, y ninguna cita que reproduzca el orden y las frases originales de la fuente.",
    impact:
      "Es la técnica que un mismo cambio mueve dos métricas del informe a la vez: similitud e indicio de IA. Aplicada de forma sistemática en un capítulo completo, suele ser la que más rebaja visible produce por el esfuerzo invertido.",
    example: {
      before:
        "Los derechos humanos han experimentado una evolución significativa a lo largo de la historia, consolidándose como un pilar del ordenamiento jurídico internacional (Fuentes Torrijo, 2021).",
      after:
        "Fuentes Torrijo (2021) describe esa evolución como una serie de respuestas tardías: cada ampliación del catálogo llegó después de un daño ya consumado, no como una previsión del ordenamiento.",
    },
  },
  {
    id: "evidencia-local",
    title: "Anclar el argumento en evidencia local o primaria",
    why:
      "Un modelo de lenguaje solo reproduce lo que ya estaba escrito en alguna parte. Todo lo que provenga de tu propio levantamiento, de tu trabajo de campo o de fuentes locales poco digitalizadas es, por definición, impredecible para el modelo.",
    technique:
      "Incorpora al menos una fuente que el modelo no pudo haber leído: datos del INEC desagregados por cantón, una sentencia de la Corte Constitucional del Ecuador con su número de causa, actas de tu institución, entrevistas propias, tu propio conteo sobre un corpus. Cítala con su identificador completo.",
    target: "Al menos una fuente primaria o local por apartado de desarrollo.",
    impact:
      "Actúa sobre la perplejidad, la señal de mayor peso, y al mismo tiempo sube el valor académico del trabajo.",
    example: null,
  },
  {
    id: "discutir-fuente",
    title: "Discutir contra una fuente, no solo acumularlas",
    why:
      "Los modelos resumen y concilian: rara vez sostienen que un autor se equivoca. Una discusión genuina produce un patrón de razonamiento que la generación automática no reproduce.",
    technique:
      "Elige dos fuentes con posiciones incompatibles sobre tu objeto, expón el desacuerdo y toma partido con un argumento propio. Explica por qué la posición que descartas resulta insuficiente para tu caso concreto.",
    target: "Una discusión explícita entre posiciones enfrentadas por capítulo.",
    impact:
      "Mueve a la vez perplejidad y variabilidad, las dos señales que suman el 65% del cálculo.",
    example: null,
  },
  {
    id: "detalle-metodologico",
    title: "Detallar la metodología hasta lo irrepetible",
    why:
      "Una metodología descrita en abstracto («se realizó una revisión sistemática de la literatura») es exactamente lo que un modelo escribe. Una metodología real tiene fechas, cadenas de búsqueda, criterios de exclusión y números que no cuadran del todo.",
    technique:
      "Escribe la cadena booleana exacta que usaste, la fecha de la consulta, cuántos registros devolvió, cuántos descartaste y por qué motivo cada grupo. Incluye el descarte incómodo: los que no pudiste conseguir en texto completo.",
    target: "Que un tercero pueda repetir tu búsqueda y llegar a un número parecido.",
    impact: "Convierte el apartado más formulaico de la tesis en el más específico.",
    example: null,
  },
  {
    id: "figura-propia",
    title: "Construir una tabla o figura propia y leerla en el texto",
    why:
      "Una síntesis visual de elaboración propia obliga a tomar decisiones de clasificación que ningún modelo tomó por ti, y el texto que la interpreta hereda esa especificidad.",
    technique:
      "Cruza dos dimensiones de tu revisión en una tabla —por ejemplo, instrumento normativo por grado de exigibilidad en el Ecuador— y dedica un párrafo a leer lo que muestra, incluida la celda vacía y lo que su vacío significa.",
    target: "Al menos una tabla o figura de elaboración propia con su lectura en prosa.",
    impact:
      "Aporta contenido que no se deriva de las fuentes y rompe la uniformidad del ritmo expositivo.",
    example: null,
  },
];

/**
 * How to hold up authorship when the estimate is wrong.
 *
 * This is not a footnote. AI detectors produce false positives most often on
 * formal academic prose and on authors writing outside their first language,
 * which is precisely who uses this tool.
 */
const AUTHORSHIP_EVIDENCE = [
  "Conserva el historial de versiones del documento con sus fechas: un archivo que crece por tramos a lo largo de semanas es la prueba de autoría más difícil de discutir.",
  "Guarda los borradores intermedios, incluidos los que descartaste, junto con las notas manuscritas o de campo con las que trabajaste.",
  "Activa el control de cambios cuando incorpores correcciones de tu tutor, para que el rastro de la revisión quede dentro del propio archivo.",
  "Anota la procedencia de cada dato mientras escribes, no al final: poder decir de dónde salió cada cifra es lo que sostiene una defensa oral.",
  "Prepárate para explicar en voz alta por qué elegiste cada fuente, cada método y cada exclusión. Ninguna estimación pesa más que esa conversación.",
  "Si escribiste el texto por tu cuenta y aun así aparece marcado, dilo y muestra la evidencia: estos detectores fallan con más frecuencia en prosa académica formal y en autores que no escriben en su lengua materna.",
];

/** A signal below the lower bound reads as human: there is nothing to correct. */
function severityFor(contribution) {
  if (contribution >= 65) return "alta";
  if (contribution >= 40) return "media";
  if (contribution >= 25) return "baja";
  return null;
}

function headlineFor(ai) {
  const byBand = {
    unlikely: `Con un ${ai.score}% de indicio, las señales medidas son compatibles con escritura humana: lo que sigue no corrige un problema, refuerza la voz propia del texto.`,
    inconclusive: `Un ${ai.score}% cae en el tramo que no distingue de forma fiable entre escritura propia y asistida; conviene trabajar las señales que lo elevaron antes de que las lea un evaluador.`,
    possible: `El ${ai.score}% indica un texto más uniforme y predecible de lo habitual en prosa académica: las técnicas siguientes atacan exactamente las señales que lo produjeron.`,
    likely: `El ${ai.score}% responde a predictibilidad alta con variación baja; reescribir los pasajes señalados con evidencia y voz propia es la única vía que baja este valor de forma legítima.`,
  };

  const reserve = !ai.modelUsed
    ? " La estimación se apoyó solo en estilometría, sin modelo de lenguaje: su confianza es baja."
    : ai.confidence === "media"
      ? ` Con ${ai.words} palabras la confianza del cálculo es media; en textos cortos estas señales oscilan mucho.`
      : "";

  return (byBand[ai.band] ?? `Indicio de IA del ${ai.score}%.`) + reserve;
}

/**
 * Turn an AI estimate into rewriting work.
 *
 * @param {object|null} ai Result of `detectAiText`.
 * @returns {{headline: string, techniques: object[], authorship: string[]}}
 */
export function aiRewriteGuidance(ai) {
  if (!ai) {
    return {
      headline: "No hay estimación de IA disponible para este documento.",
      techniques: [],
      authorship: AUTHORSHIP_EVIDENCE,
    };
  }

  if (ai.score === null) {
    return {
      headline:
        (ai.note ? `${ai.note} ` : "") +
        "Sin una estimación no hay señales que corregir, pero la documentación de autoría sigue siendo la mejor defensa.",
      techniques: [],
      authorship: AUTHORSHIP_EVIDENCE,
    };
  }

  const techniques = [];

  // Signals arrive in weight order from `detectAiText`, so preserving that order
  // inside each severity keeps the highest-impact correction first.
  for (const signal of ai.signals ?? []) {
    const play = SIGNAL_PLAYBOOK[signal.key];
    if (!play) continue;

    const severity = severityFor(signal.contribution ?? 0);
    if (!severity) continue;

    techniques.push({
      id: signal.key,
      signal: signal.key,
      severity,
      title: play.title,
      why: play.why(signal.measured ?? null),
      technique: play.technique,
      example: play.example ?? null,
      target: play.target,
      impact: play.impact,
    });
  }

  const crossSeverity = ai.score >= 55 ? "alta" : ai.score >= 30 ? "media" : "baja";
  for (const item of CROSS_CUTTING) {
    techniques.push({ ...item, signal: null, severity: crossSeverity });
  }

  techniques.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

  return { headline: headlineFor(ai), techniques, authorship: AUTHORSHIP_EVIDENCE };
}

/* ================================================================== *
 * 2. Similarity reduction plan
 * ================================================================== */

/**
 * One entry per bucket. `retain` is the fraction of the bucket's matched words
 * that survives the correction, which is what decides the projected index:
 * zero for material that leaves the computation entirely, one for corrections
 * that remove academic risk without moving the number — and saying so plainly
 * is more useful than implying every fix lowers the percentage.
 */
const ACTION_SPECS = {
  referencias: {
    id: "referencias",
    category: "Referencias y bibliografía",
    severity: "media",
    title: "Excluir la lista de referencias del cómputo",
    retain: 0,
    technique:
      "Los asientos bibliográficos coinciden con las fuentes por definición: repiten autor, título y datos de publicación. No son plagio y no deberían pesar en el índice.",
    steps: [
      "Activa «Excluir citas y referencias» y vuelve a ejecutar el análisis.",
      "Comprueba que el apartado de referencias esté claramente separado del cuerpo, con su propio encabezado, para que la exclusión lo reconozca.",
      "Si tras excluirlo siguen apareciendo asientos marcados, revisa que no haya referencias sueltas dentro del desarrollo.",
    ],
    example: null,
  },

  literal: {
    id: "literal-sin-comillas",
    category: "Copia literal sin comillas",
    severity: "alta",
    title: "Entrecomillar y citar, o reformular desde la comprensión",
    retain: RESIDUAL_TERMINOLOGY,
    technique:
      "Hay dos rutas y su efecto es distinto. Entrecomillar y citar con página convierte el pasaje en una cita textual legítima: el índice no baja, pero el riesgo académico desaparece. Reformular desde tu propia comprensión retira el pasaje del cómputo y sí baja el índice. La proyección de este plan asume la segunda ruta.",
    steps: [
      "Decide para cada pasaje si la formulación exacta de la fuente es necesaria. Si lo es, entrecomíllala y cítala con página: queda en el índice, pero es correcta.",
      "Si no lo es, cierra la fuente, escribe la idea de memoria con tus propias palabras y solo después vuelve a comprobar que no dijiste algo distinto.",
      "Cita la fuente igualmente: reformular no transfiere la autoría de la idea.",
      "Vuelve a ejecutar el análisis para confirmar que la racha literal desapareció.",
    ],
    example: {
      before:
        "La evolución de los derechos humanos no ha sido lineal ni acumulativa de manera uniforme; cada avance normativo estuvo precedido por experiencias de violencia, exclusión o arbitrariedad que evidenciaron la insuficiencia de los ordenamientos vigentes.",
      after:
        "Cada ampliación del catálogo llegó después de un daño ya consumado: la Declaración de 1948 responde al genocidio, y la Convención de 1969 al ciclo autoritario que el continente aún no había cerrado. El derecho, aquí, no anticipa: registra (Fuentes Torrijo, 2021).",
    },
  },

  citas: {
    id: "citas-textuales",
    category: "Citas textuales ya entrecomilladas",
    severity: "informativa",
    title: "Completar el localizador de las citas textuales",
    retain: 1,
    technique:
      "Estos pasajes reproducen la fuente palabra por palabra y ya están entrecomillados, de modo que son citas legítimas. Cuentan en el índice y deben contar: no hay nada que reescribir. Lo que falta comprobar es que el localizador esté completo.",
    steps: [
      "Verifica que cada cita textual lleve página, párrafo o número de sección, no solo el año.",
      "Comprueba que la entrada correspondiente exista en la lista de referencias con todos sus datos.",
      "Si una cita ocupa más de cuarenta palabras, dale el formato de cita en bloque que exija tu norma.",
    ],
    example: {
      before:
        "«la interpretación evolutiva permite actualizar el contenido de los derechos» (Corte IDH, 2017).",
      after:
        "«la interpretación evolutiva permite actualizar el contenido de los derechos» (Corte IDH, OC-23/17, párr. 47).",
    },
  },

  containment: {
    id: "coincidencia-literal",
    category: "Coincidencia literal elevada",
    severity: "alta",
    title: "Reformular el marco sintáctico, no las palabras",
    retain: RESIDUAL_TERMINOLOGY,
    technique:
      "La métrica compara secuencias de cuatro palabras consecutivas. Cambiar sinónimos casi no la mueve, porque las secuencias que rodean cada palabra sustituida siguen intactas. Lo que la desmonta es cambiar la estructura: partir la oración, mover la negación al frente, convertir el sustantivo abstracto en verbo, invertir el orden de causa y consecuencia.",
    steps: [
      "Identifica la afirmación central del pasaje y escríbela en una sola frase corta, sin mirar la fuente.",
      "Reconstruye el pasaje a partir de esa frase, decidiendo tú el orden de los elementos.",
      "Comprueba el resultado: si reconoces todavía tramos de cuatro palabras de la fuente, no reformulaste, sustituiste.",
      "Añade la cita y, si puedes, un dato propio que la fuente no traía.",
    ],
    example: {
      before:
        "El principal desafío del Derecho Internacional de los Derechos Humanos no reside en la insuficiencia del catálogo normativo, sino en la distancia que separa el enunciado de la garantía efectiva.",
      after:
        "Lo que falta no son normas. Entre lo que los tratados enuncian y lo que una persona puede efectivamente exigir hay una distancia que el catálogo, por extenso que sea, no cierra por sí solo (Cubides et al., 2023).",
    },
  },

  parafrasis: {
    id: "parafrasis-sin-cita",
    category: "Paráfrasis sin atribución",
    severity: "media",
    title: "Atribuir la idea aunque la redacción sea propia",
    retain: 1,
    technique:
      "Estos pasajes ya están escritos con tus palabras: comparten el significado de la fuente, no su redacción. Por eso apenas pesan en el índice y por eso la corrección no lo baja. Lo que corrigen es un riesgo mayor: usar una idea ajena sin decir de quién es.",
    steps: [
      "Localiza la fuente de la que proviene cada idea y añade la cita en el formato que exija tu norma.",
      "Si llegaste a esa formulación de forma independiente, no hay nada que corregir: verifica cuál es el caso antes de actuar.",
      "Cuando varias ideas seguidas provengan de la misma fuente, atribúyelas al abrir el tramo en lugar de repetir la cita en cada oración.",
    ],
    example: {
      before:
        "La digitalización ha trasladado parte del poder de afectación de los derechos desde los Estados hacia actores privados, lo que interpela la estructura misma del sistema.",
      after:
        "La digitalización ha trasladado parte del poder de afectación de los derechos desde los Estados hacia actores privados, lo que interpela la estructura misma del sistema (Razmetaeva et al., 2022).",
    },
  },

  terminologia: {
    id: "terminologia-comun",
    category: "Terminología común",
    severity: "informativa",
    title: "No tocar: ruido esperado del área",
    retain: 1,
    technique:
      "Son coincidencias cortas sobre nombres de instrumentos, fórmulas de método y vocabulario obligado del campo. Ningún documento serio de esta disciplina puede evitarlas, y reescribirlas solo empeoraría la precisión del texto.",
    steps: [
      "No modifiques estos pasajes.",
      "Si un evaluador pregunta por ellos, explica que corresponden a denominaciones normativas y terminología técnica que no admiten variante.",
    ],
    example: null,
  },
};

/** Bucket priority. References go first so a bibliography entry with high literal
 *  overlap is not reported as verbatim copying, which it is not. */
const BUCKET_ORDER = [
  "referencias",
  "literal",
  "citas",
  "containment",
  "parafrasis",
  "terminologia",
];

function bucketOf(result) {
  const metrics = result.metrics ?? {};
  const longestRun = metrics.longestRun ?? 0;
  const containment = metrics.containment ?? 0;
  const semantic = metrics.semantic ?? 0;

  if (looksLikeReference(result.sentence)) return "referencias";
  if (longestRun >= 8) return hasQuotes(result.sentence) ? "citas" : "literal";
  if (containment >= 40) return "containment";
  if (semantic >= 55 && containment < 25) return "parafrasis";
  return "terminologia";
}

/**
 * Build a quantified correction plan for the similarity index.
 *
 * Each passage lands in exactly one bucket, so the per-action contributions sum
 * to the index instead of double-counting a passage that trips several
 * thresholds. Contributions are similarity-weighted (`words x similarity`),
 * which is how the engine counts copied words in the first place.
 *
 * @param {object} analysis Result of `analyzeDocument`.
 * @param {string} [text]   Submitted text. Unused for the arithmetic, which is
 *                          derived from the analyzed passages, and accepted so
 *                          callers can pass the same payload they give the report.
 * @returns {object} Current and projected index plus the actions that separate them.
 */
export function similarityReductionPlan(analysis, text = "") {
  const results = (analysis?.results ?? []).filter(
    (result) => typeof result?.sentence === "string"
  );
  const currentIndex = analysis?.plagiarismPercentage ?? 0;
  const totalWords = results.reduce((sum, result) => sum + countWords(result.sentence), 0);

  if (totalWords === 0 || results.length === 0) {
    return {
      currentIndex,
      projectedIndex: currentIndex,
      totalWords,
      actions: [],
      summary:
        "No hay pasajes analizados sobre los que construir un plan de corrección.",
    };
  }

  const pct = (value) => Math.round((value / totalWords) * 100);

  const buckets = new Map(BUCKET_ORDER.map((key) => [key, []]));
  for (const result of results) {
    if ((result.similarity ?? 0) < MIN_SIMILARITY) continue;
    buckets.get(bucketOf(result)).push(result);
  }

  const actions = [];

  for (const key of BUCKET_ORDER) {
    const passages = buckets.get(key);
    if (!passages || passages.length === 0) continue;

    const spec = ACTION_SPECS[key];
    const words = passages.reduce((sum, result) => sum + countWords(result.sentence), 0);
    const copied = passages.reduce(
      (sum, result) => sum + countWords(result.sentence) * ((result.similarity ?? 0) / 100),
      0
    );

    const currentContribution = pct(copied);
    const projectedContribution = pct(copied * spec.retain);

    actions.push({
      id: spec.id,
      category: spec.category,
      severity: spec.severity,
      title: spec.title,
      words,
      passages: passages.length,
      currentContribution,
      projectedContribution,
      reduction: Math.max(0, currentContribution - projectedContribution),
      technique: spec.technique,
      steps: spec.steps,
      example: spec.example,
    });
  }

  actions.sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.reduction - a.reduction
  );

  const totalReduction = actions.reduce((sum, action) => sum + action.reduction, 0);
  const highReduction = actions
    .filter((action) => action.severity === "alta")
    .reduce((sum, action) => sum + action.reduction, 0);

  const projectedIndex = Math.max(0, currentIndex - totalReduction);
  const highOnlyIndex = Math.max(0, currentIndex - highReduction);

  const summary =
    totalReduction === 0
      ? `El índice actual del ${currentIndex}% procede de solapamientos menores, citas correctas y terminología del área: no hay acciones que lo reduzcan sin perjudicar el texto.`
      : `El índice actual es del ${currentIndex}%. Aplicando solo las acciones de severidad alta baja al ${highOnlyIndex}%; con el plan completo, al ${projectedIndex}%. ` +
        "Las proyecciones descuentan las palabras coincidentes ponderadas por su similitud y conservan una cuarta parte de cada pasaje reformulado como terminología legítima del campo, de modo que el resultado real suele ser algo mejor que el proyectado." +
        (analysis?.sampled
          ? ` El documento se analizó por muestreo (${analysis.analyzedChunks} de ${analysis.totalChunks} pasajes), por lo que el plan describe la parte examinada y se extrapola al resto.`
          : "");

  return { currentIndex, projectedIndex, totalWords, actions, summary };
}
