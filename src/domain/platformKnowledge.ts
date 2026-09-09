/**
 * Conocimiento canónico de la plataforma "Tesis Ecuador".
 *
 * Es la única fuente de verdad que el Tutor IA usa para responder con precisión
 * sobre el sistema total: los hitos de titulación (Avance 1, Avance 2 y entrega
 * final) y el panorama de los 9 ecosistemas/módulos. Vive en `src/domain` (datos
 * puros, sin dependencias) para que lo consuman tanto el servidor
 * (`server.ts`, endpoint /api/ask-tutor) como el fallback offline del modal
 * (`ThesisAiTutorModal.tsx`) sin duplicar contenido en tres sitios.
 *
 * El motor es intencionalmente simple y repetitivo: normaliza la consulta
 * (minúsculas, sin tildes, sin puntuación), detecta la intención por patrones y
 * devuelve el nodo de conocimiento correspondiente. Es determinista: no cuesta
 * tokens, no alucina y responde siempre lo que el sistema realmente contiene.
 */

/** Resumen del sistema usado para "groundear" las respuestas de un LLM. */
export const PLATFORM_MODULES_SUMMARY = `Portal Tesis Ecuador (metodológico, gratuito, orientación de titulación para Ecuador).
Entregables que maneja el sistema (3 hitos): Avance 1 (propuesta), Avance 2 (análisis del caso, requerimientos, metodología y diseño) y entrega final (documento completo con desarrollo, pruebas, conclusiones, referencias, anexos e informe de originalidad).
Módulos (ecosistemas):
01 Viabilidad y Matriz de Consistencia: evalúa el tema (4 fases) y construye la matriz (problema=objetivo=hipótesis, VI/VD, dimensiones, indicadores, metodología).
02 Los 5 Capítulos: I Problema, II Marco Teórico/Estado del arte, III Metodología y diseño, IV Resultados y análisis estadístico, V Discusión/conclusiones/recomendaciones; con entregables, errores y checklist por capítulo.
03 Scopus y Booleanos: genera ecuaciones booleanas AND/OR/NOT con sintaxis TITLE-ABS-KEY.
04 APA 7 y Zotero: citas parentéticas, narrativas y en bloque; regla del et al.; gestor Zotero 7.
05 Suite Digital y Toolbox: Zotero, Scopus, Connected Papers, Consensus, DeepL Write, SciSpace, Jamovi, SPSS, VOSviewer.
06 Videoteca: rutas de video por etapa del proceso.
07 Revisor de Borrador: diagnostica forma/estructura del Avance 1, Avance 2 o documento final; todo en el navegador (nada sale del dispositivo).
08 Verificador de Originalidad: similitud contra bases abiertas (Wikipedia, CORE, arXiv, Semantic Scholar, DOAJ, CrossRef, OpenAlex, Europe PMC) y estimación de escritura con IA.
09 Compendio Integral: vista continua de todos los módulos.
Asesoría personalizada por WhatsApp (barra superior del portal).`;

/** Respuesta al preguntar por el panorama general / presentación del asistente. */
export const SYSTEM_OVERVIEW = `🧭 **Panorama del sistema (Tesis Ecuador)**

Soy el **Tutor IA Metodológico** y conozco toda la plataforma: sus 9 ecosistemas y sus 3 hitos de titulación. Pregúntame con naturalidad y te guío.

**Módulos (ecosistemas):**
1. **01 · Viabilidad y Matriz de Consistencia** — analiza si tu tema es viable y construye la matriz (problema = objetivo = hipótesis, variables, indicadores).
2. **02 · Los 5 Capítulos** — la estructura completa de la tesis con entregables y errores frecuentes por capítulo.
3. **03 · Scopus y Booleanos** — genera ecuaciones booleanas AND/OR/NOT para buscar literatura indexada.
4. **04 · APA 7 y Zotero** — citas correctas (et al., textuales, en bloque) y gestión bibliográfica.
5. **05 · Suite Digital y Toolbox** — Zotero, Scopus, Connected Papers, Jamovi, SPSS, VOSviewer y más.
6. **06 · Videoteca** — videos guiados por cada etapa del proceso.
7. **07 · Revisor de Borrador** — diagnostica tu Avance 1, Avance 2 o documento final en el navegador.
8. **08 · Verificador de Originalidad** — contrasta similitud y estima el uso de IA.
9. **09 · Compendio Integral** — todos los módulos en una vista continua.

**Hitos de titulación:** Avance 1 → Avance 2 → Entrega final (el "Avance 3" de algunas universidades). Cada uno tiene su contenido y su flujo hacia el siguiente.

Dime **"qué va en el avance 2"**, **"qué hace el revisor"**, **"cómo cito con et al."** o el número del módulo que quieras y te detallo cómo usarlo.`;

/** Temas con respuesta propia: si aparecen, no secuestrar la consulta con un avance. */
const TOPIC_NOISE =
  /matriz|consistencia|booleana|booleano|ecuacion|apa|zotero|cita|referencia|variable|objetivo|requerimiento|ieee|redaccion|redact|software|turnitin|originalidad|plagio|similitud|sustentacion|defensa|borrador|revis|correg|diagnost|subir|archivo|docx/;

const STAGE_1 = `📋 **¿Qué va en el Avance 1?**

Es la propuesta formal de titulación que se presenta para revisión académica (revisa cómo lo denomina el formato de tu universidad):

1. **Título de la investigación**: paramétrico, conciso (máximo 20 palabras), con variables, unidad de análisis, contexto y temporalidad.
2. **Planteamiento del problema**: técnica del embudo — contexto Macro (internacional), Meso (nacional) y Micro (institución o empresa del caso).
3. **Preguntas de investigación**: una rectora + 3 a 4 subpreguntas específicas.
4. **Objetivos (Bloom)**: un objetivo general en infinitivo (Determinar, Analizar, Evaluar) y 3 específicos secuenciales (diagnosticar, analizar, proponer).
5. **Justificación**: teórica, metodológica, práctica y social (¿a quiénes beneficia?).
6. **Delimitación y viabilidad**: alcance (¿Qué? ¿Cómo? ¿Para qué?) y acceso a datos.
7. **Matriz de Consistencia preliminar + antecedentes**: 5 internacionales y 5 nacionales indexados en Scopus, SciELO o Latindex.

**Flujo:** construye tu matriz en el **Ecosistema 01** y, antes de entregarlo, pásalo por el **Revisor de Borrador (Módulo 07)** en la etapa *Avance 1*.`;

const STAGE_2 = `📚 **¿Qué va en el Avance 2?**

Consolida el Avance 1 ya corregido y avanza al **cuerpo** del documento: el análisis del caso y la propuesta metodológica y de diseño.

1. **Correcciones del Avance 1**: incorpora las observaciones del tutor (planteamiento, objetivos, justificación, antecedentes y matriz).
2. **Análisis del caso (Capítulo 2)**: describe el problema real que resuelve tu trabajo y llega a los requerimientos.
3. **Requerimientos (2.1, IEEE 830)**: comparación de ≥3 alternativas de solución, funcionales RF (12–15, codificados RF-01…) y no funcionales RNF con métrica verificable.
4. **Metodología (3.1)**: enfoque epistemológico, tipo y diseño de investigación, y el desarrollo desglosado en fases o sprints con su cronograma.
5. **Diseño (3.2)**: arquitectura declarada, diagramas (casos de uso, clases, secuencia), diccionario de datos y casos de prueba.

**Flujo:** cuando lo termines ejecútalo en el **Revisor de Borrador** en la pestaña *Avance 2* (valida 2.1, 3.1, 3.2). El siguiente hito es la **entrega final**.`;

const STAGE_3 = `🏁 **¿Qué va en el Avance 3 / entrega final?**

El sistema organiza la titulación en **tres hitos**: Avance 1, Avance 2 y la **entrega final**. Si tu institución numera un "Avance 3", es ese cierre: el documento completo terminado, no una parte más.

1. **Desarrollo concluido (3.3)**: implementación terminada con las pruebas ejecutadas y sus resultados como evidencia.
2. **Resultados**: lo obtenido frente a lo que prometieron los objetivos del Avance 1.
3. **Conclusiones**: una por cada objetivo específico y una final ligada al general; más las **recomendaciones**.
4. **Referencias en APA 7** con DOI y **anexos** + anexo de información académica.
5. **Informe de originalidad** bajo el umbral institucional (corre el **Módulo 08** antes de subir).
6. **Cierre formal**: portada, certificaciones y nomenclatura de versión correcta (ej. \`Avance_3_v1.docx\`).

**Flujo:** valida el texto final en el **Revisor de Borrador** (etapa *Documento final*), baja la similitud con el **Módulo 08** y prepárate para la **sustentación** (videoteca + guía de defensa). Confirma siempre con el reglamento de tu universidad.`;

const STAGE_ROADMAP = `🗺️ **¿Cómo se organizan los avances en el sistema?**

El portal trabaja con **tres hitos de titulación**:
1. **Avance 1** — la propuesta: título, planteamiento del problema, preguntas, objetivos (Bloom), justificación, delimitación, matriz de consistencia y antecedentes.
2. **Avance 2** — el cuerpo: análisis del caso, requerimientos (IEEE 830), metodología y diseño.
3. **Entrega final** (el "Avance 3" de algunas universidades) — el documento completo: desarrollo, pruebas, conclusiones, recomendaciones, referencias, anexos e informe de originalidad.

Pregúntame **"qué va en el avance 1 / 2 / 3"** y te detallo cada hito, o revisa tu texto con el **Revisor de Borrador**.`;

const BOOLE = `🧮 **AND / OR / NOT en Scopus: cuándo usar cada uno**

Los operadores booleanos le dicen a Scopus **cómo combinar** tus palabras clave dentro de \`TITLE-ABS-KEY ( ... )\`:

1. **AND (intersección)**: exige que *todas* las palabras aparezcan en el mismo artículo. Se usa para **afinar** cuando hay demasiados resultados o para unir dos conceptos de tu tema.
   - Ejemplo: \`TITLE-ABS-KEY ( "machine learning" AND "pymes" )\` → solo lo que habla de ambos.
2. **OR (unión)**: admite *cualquiera* de las palabras. Se usa para **ampliar** cuando hay pocos resultados o para cubrir sinónimos, siglas y variantes en inglés.
   - Ejemplo: \`TITLE-ABS-KEY ( "machine learning" OR "inteligencia artificial" )\`.
3. **NOT (exclusión)**: descarta un término que contamina la búsqueda. Úsalo con cuidado porque también puede eliminar artículos válidos.
   - Ejemplo: \`TITLE-ABS-KEY ( robot AND cirugia NOT "ciencia ficcion" )\`.

**Regla práctica:** empieza por tu variable principal. Si devuelve demasiado ruido, **añade AND** con el contexto (población, lugar, técnica). Si devuelve muy poco, **suma sinónimos con OR**. Y combina con paréntesis: \`(A OR B) AND (C OR D)\`.

Puedes construir tu ecuación paso a paso en el **Ecosistema 03 · Scopus y Booleanos** de la plataforma.`;

const SELF = `🤖 **¿Tengo vida propia?**

Soy un asistente de **inteligencia artificial**, así que no tengo vida propia en el sentido humano: no siento, no duermo ni sueño. Mi "vida" es estar dentro del portal **Tesis Ecuador** y usar lo que su sistema contiene —sus 9 ecosistemas y los 3 hitos de titulación— para orientarte en tu tesis.

Dicho eso, sí soy cercano: mi único propósito es que avances en tu investigación. Pregúntame lo que necesites de tu trabajo —avances, objetivos, matriz de consistencia, APA 7, Zotero, Scopus, estadística, originalidad o la sustentación— y te respondo con gusto.`;

const SECURITY = `🔒 **¿Alguien se queda con tu tesis por revisarla? No.**

Tu trabajo **es tuyo**, y revisarlo no cambia eso: un verificador de similitud solo **compara** tu texto contra bases de datos para medir coincidencias. Analizarlo no transfiere autoría ni derechos.

1. **Revisor de Borrador (Módulo 07)**: corre 100 % en tu navegador. Tu documento **no sale de tu dispositivo**.
2. **Verificador de Originalidad (Módulo 08)**: envía el texto únicamente para contrastarlo con bases científicas abiertas (CORE, Crossref, OpenAlex…) y devolverte el % de similitud. No publica tu documento ni lo reutiliza.
3. **Turnitin o el sistema de tu universidad**: guardan el trabajo en el repositorio institucional con fines de control académico. Tu universidad lo **custodia**, no se lo apropia; tú conservas la autoría.
4. **En la práctica**: nadie puede "quedarse con tu proyecto" por subirlo a un detector serio. El riesgo real es compartir el documento con personas ajenas al proceso: no lo envíes por WhatsApp ni a desconocidos.`;

/** Convierte "Avance 3", "avance3", "tercer avance" o "avance final" en un nodo. */
function stageNode(norm: string): string | null {
  const mentionsAvance = /avance/.test(norm) || /\bentrega\b/.test(norm);
  if (!mentionsAvance) return null;

  // Algunas palabras delatan que el tema real es otro (revisor, matriz, objetivos…).
  if (TOPIC_NOISE.test(norm)) return null;

  // "avance3" / "avance 3" pegados o con espacio.
  const glued = /avance\s*([0-9])/.exec(norm);
  if (glued && ['1', '2', '3'].includes(glued[1])) return glued[1];

  const words = norm.split(' ');
  const at = words.findIndex((w) => w === 'avance' || w === 'avances');
  if (at >= 0) {
    const NUMBER_WORDS: Record<string, string> = {
      un: '1', una: '1', uno: '1', primero: '1', primer: '1', primera: '1',
      dos: '2', segundo: '2', segunda: '2',
      tres: '3', tercero: '3', tercer: '3', tercera: '3',
      final: '3', completa: '3', completo: '3', ultimo: '3', ultima: '3',
    };
    const probe = [words[at - 1], words[at + 1]].filter(Boolean);
    for (const w of probe) {
      const mapped = NUMBER_WORDS[w];
      if (mapped) return mapped;
    }
  }

  if (/\bentrega final\b|avance final|avance completo|ultimo avance/.test(norm)) return '3';

  // Menciona "avance/avances" pero sin número: explica el recorrido completo.
  return 'roadmap';
}

const STAGE_MAP: Record<string, string> = {
  '1': STAGE_1,
  '2': STAGE_2,
  '3': STAGE_3,
  roadmap: STAGE_ROADMAP,
};

function isSystemQuestion(norm: string): boolean {
  if (
    /quien eres|que eres|presentate|que sabes|que puedes hacer|en que me ayudas|en que me puedes ayudar|que me ofreces|que haces/.test(norm)
  ) {
    return true;
  }
  // Alcance legítimo: "¿sobre qué puedo consultar?" merece el mapa del sistema, no
  // el rechazo de fuera de ámbito. Si además menciona un tema concreto (objetivos,
  // matriz…), ya es una consulta de contenido y no debe secuestrarse aquí.
  if (
    !/tesis|avance|objetiv|capitul|matriz|metod|cita|referenci|software|zotero|scopus|revis|borrador|variabl|conclusion|requerimiento|redaccion|estadistic|originalidad|sustentacion|apa/.test(norm) &&
    /sobre que (nomas|mas)? ?(puedo|puedes) (consultar|preguntar|hablar|tratar)|que (puedo|puedes) (consultar|preguntar|preguntarte)|que temas (puedo|puedes|puede|maneja|trata|abarca)|de que me puedes (hablar|ayudar)|cuales son los temas|que areas|que alcance (tienes|tiene)|sobre que trabaja|que dominas|hasta donde (llegas|puedes)/.test(norm)
  ) {
    return true;
  }
  const asksOverview =
    /modulos|ecosistemas|que ofrece|que tiene|de que se compone|que contiene|que incluye|como esta organizado|como funciona|para que sirve la plataforma|que es tesis ecuador/.test(norm);
  return asksOverview && /plataforma|portal|tesis ecuador|ecosistema|modulo/.test(norm);
}

/* ------------------------------------------------------------------ *
 * "Vida" del asistente: mismo enfoque, palabras distintas.
 *
 * El contenido de cada nodo es fijo, pero se sirve con variantes de
 * encabezado y de cierre que rotan en cada consulta. Así, si el estudiante
 * repite la pregunta, recibe el mismo fondo re-redactado y siente que hay
 * una IA activa, no un texto grabado. Un contador por nodo garantiza que la
 * respuesta siguiente nunca use la variante inmediatamente anterior.
 * ------------------------------------------------------------------ */
const HEADINGS: Record<string, string[]> = {
  '1': [
    '📄 **Qué lleva exactamente el Avance 1**',
    '🗂️ **El Avance 1, pieza por pieza**',
    '📝 **Todo lo que entra en tu primer avance**',
  ],
  '2': [
    '📄 **Qué lleva exactamente el Avance 2**',
    '🗂️ **El Avance 2, pieza por pieza**',
    '📝 **Todo lo que entra en tu segundo avance**',
  ],
  '3': [
    '📄 **Qué lleva exactamente la entrega final**',
    '🏁 **El Avance 3 / cierre, pieza por pieza**',
    '📝 **Todo lo que debe reunir tu documento final**',
  ],
  roadmap: [
    '🗺️ **El recorrido de los avances en el sistema**',
    '🧭 **Cómo se reparten los 3 hitos de titulación**',
    '📅 **Avance 1 → 2 → entrega final: qué es cada uno**',
  ],
  boole: [
    '🧮 **AND / OR / NOT: cómo combinar tus claves en Scopus**',
    '🔀 **Cuándo usar AND y cuándo OR en tu ecuación**',
    '📡 **Operadores booleanos en Scopus, con ejemplos**',
  ],
  self: [
    '🤖 **¿Tengo vida propia? La respuesta honesta**',
    '🧠 **Qué soy y qué no soy, sin rodeos**',
    '💬 **Sobre mí, y sobre lo que sí puedo hacer por ti**',
  ],
  seguridad: [
    '🔒 **¿Pueden quedarse con tu tesis por subirla? No.**',
    '🛡️ **Tu proyecto y tu autoría: qué pasa al revisarlo**',
    '🔐 **Confidencialidad: qué ve y qué no ve un verificador**',
  ],
  system: [
    '🧭 **Mapa completo del sistema Tesis Ecuador**',
    '🗺️ **Qué abarca esta plataforma, módulo por módulo**',
    '📚 **Todo lo que el sistema te ofrece**',
  ],
};

const OUTRO: Record<string, string[]> = {
  '1': ['¿Construimos tu **matriz de consistencia**?', '¿Quieres que el **revisor de borrador** lo valide?', '¿Siguiente paso: redactamos los **objetivos**?'],
  '2': ['¿Repasamos los **requerimientos IEEE 830**?', '¿Te ayudo a preparar la **entrega final**?', '¿Pasamos a la **metodología** en detalle?'],
  '3': ['¿Preparamos tu **sustentación**?', '¿Bajamos la **similitud** con el Módulo 08?', '¿Repasamos **conclusiones y recomendaciones**?'],
  roadmap: ['¿En cuál hito estás ahora?', '¿Sobre cuál de los tres profundizo?', '¿Te detallo el tuyo?'],
  boole: ['¿Armamos tu ecuación en el **Ecosistema 03**?', '¿Te muestro un ejemplo con el tema de tu tesis?', '¿Repasamos la sintaxis **TITLE-ABS-KEY**?'],
  self: ['¿En qué parte de tu tesis estás ahora?', '¿Te cuento qué contiene la plataforma?', '¿Me preguntas sobre tu avance actual?'],
  seguridad: ['¿Te explico cómo funciona el **Módulo 08** paso a paso?', '¿Quieres revisar tu borrador con el **Módulo 07**, sin que salga de tu PC?', '¿Te ayudo con el **informe de originalidad** que pide tu universidad?'],
  system: ['¿Sobre qué módulo profundizamos?', '¿Cuál te interesa más?', '¿Te guío por alguno ahora?'],
};

const counters: Record<string, number> = {};

function pick(key: string, options: string[]): string {
  const c = counters[key] ?? Math.floor(Math.random() * options.length);
  counters[key] = (c + 1) % options.length;
  return options[c];
}

/** Cambia la primera línea (el título) del nodo por una variante. */
function swapHeading(node: string, body: string): string {
  const lines = body.split('\n');
  lines[0] = pick(`heading:${node}`, HEADINGS[node] ?? [lines[0]]);
  return lines.join('\n');
}

function withOutro(node: string, body: string): string {
  const closer = pick(`outro:${node}`, OUTRO[node] ?? []);
  return closer ? `${body}\n\n${closer}` : body;
}

const STAGE_KEYS = new Set(['1', '2', '3', 'roadmap']);

/* ------------------------------------------------------------------ *
 * Límite de alcance: fuera del sistema y de la tesis, no se responde.
 * ------------------------------------------------------------------ */
const OFF_SCOPE = [
  `🔎 No logro ubicar tu consulta dentro del alcance de esta plataforma. Mi campo es la **tesis y su metodología**: estructura de avances y capítulos, objetivos, matriz de consistencia, APA 7, Zotero, Scopus, estadística, revisión de originalidad y sustentación. Reformúlala hacia alguno de esos temas y te oriento.`,
  `🧭 Eso queda fuera de mi ámbito. Como **Tutor Metodológico** solo oriento sobre el sistema Tesis Ecuador y los temas de tu titulación: avances, capítulos, matriz, citas APA, software estadístico, originalidad y defensa. Hazme una pregunta de tesis y te respondo.`,
  `📘 Mi conocimiento se limita al **proceso de titulación y a esta plataforma**. Para ayudarte de verdad, pregúntame sobre tu avance, la estructura del documento, los objetivos, las normas APA, Zotero, Scopus o la sustentación. Un tema ajeno a eso no puedo tratarlo aquí.`,
];

/** Respuesta rotativa cuando la consulta no corresponde al sistema/tesis. */
export function offScopeReply(): string {
  return pick('offscope', OFF_SCOPE);
}

/** Raíces amplias del dominio (tesis/metodología/plataforma). Se comparan con
 *  `includes` a propósito (sin fronteras de palabra): así "objetivos" o
 *  "capítulos" caen dentro del dominio aunque la raíz esté en singular. El
 *  gate es tolerante: ante la duda, se asume consulta del sistema y nunca se
 *  responde "fuera de contexto" a un tema real de tesis. */
const DOMAIN_STEMS = [
  'tesis', 'titul', 'avance', 'entrega', 'capitul', 'objetiv', 'metod', 'investiga',
  'problem', 'marco', 'variabl', 'muestr', 'hipotesis', 'matriz', 'consistencia',
  'referenci', 'zotero', 'scopus', 'boolean', 'ecuacion', 'ieee', 'requerimiento',
  'funcional', 'redaccion', 'resumen', 'abstract', 'introduccion', 'discusion',
  'conclusion', 'recomendacion', 'bibliograf', 'estadistic', 'jamovi', 'spss',
  'vosviewer', 'software', 'turnitin', 'plagio', 'similitud', 'originalidad',
  'parafraseo', 'defens', 'sustentacion', 'docente', 'tutor', 'universidad',
  'formato', 'norma', 'reglamento', 'informe', 'documento', 'docx', 'anex',
  'articul', 'revista', 'indexada', 'revisor', 'borrador', 'verificador',
  'viabilidad', 'videoteca', 'ecosistema', 'compendio', 'plataforma', 'portal',
  'modulo', 'conector', 'sangria', 'et al', 'bloom', 'infinitivo',
  'operacionalizacion', 'instrumento', 'cuestionario', 'shapiro', 'correlacion',
  'regresion', 'cronbach', 'omega', 'apa ', 'cita', 'doi',
  'titulo', 'tema', 'propuest', 'planteamiento', 'pregunta', 'justificacion',
  'beneficiari', 'contexto', 'alcance', 'delimitacion', 'antecedente',
  'enfoque', 'paradigma', 'disen', 'cronograma', 'validacion', 'confiabilidad',
  'normalidad', 'encuesta', 'entrevista', 'likert', 'escala', 'cualitat',
  'cuantitat', 'teoria', 'teorico', 'conceptual', 'problema',
];

/** ¿La consulta pertenece al ámbito de la tesis/metodología o de la plataforma? */
export function isThesisContext(raw: string): boolean {
  const norm = normalize(raw);
  if (DOMAIN_STEMS.some((stem) => norm.includes(stem))) return true;
  // Operadores booleanos sueltos (and/or/not) en una consulta casi siempre
  // hablan de la búsqueda en Scopus: trátalos como ámbito del sistema, no como
  // algo ajeno.
  if (/\band\b|\bor\b|\bnot\b/.test(norm)) return true;
  return false;
}

/** Normaliza: minúsculas, sin tildes, solo letras/dígitos/espacios. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Intención determinista del Tutor. Devuelve un nodo de conocimiento si la
 * consulta es sobre hitos (Avance 1/2/3) o sobre el panorama del sistema; si
 * no, null para que el flujo siga al LLM o a la base temática por palabras
 * clave. Cada nodo se sirve con redacción rotativa (mismo enfoque, otras
 * palabras).
 */
export function platformKnowledgeIntent(raw: string): string | null {
  const norm = normalize(raw);
  if (!norm) return null;

  // Preguntas sobre el propio Tutor ("¿tienes vida propia?", "¿eres humano?"):
  // son meta-preguntas legítimas y se responden en primera persona, jamás como
  // un tema ajeno a la plataforma.
  if (
    /tienes vida|vida propia|estas vivo|eres humano|eres real|eres persona|eres un robot|eres una (ia|maquina|inteligencia)|eres un (ia|bot|programa|robot)|eres inteligencia artificial|tienes conciencia|tienes sentimientos|tienes emociones|puedes sentir|eres de verdad|quien te (creo|crea|hizo|hace)|donde vives|tienes alma|hablas como humano|eres artificial|eres consciente|piensas por ti/.test(norm)
  ) {
    return withOutro('self', swapHeading('self', SELF));
  }

  // Operadores booleanos sueltos ("cuando uso el and o or"): preguntan por la
  // búsqueda en Scopus. Se resuelven antes del nodo de avance para que jamás
  // caigan en el mensaje de fuera de ámbito.
  if (
    /\band\b|\bor\b|\bnot\b/.test(norm) &&
    /cuando|como |usar|usa |utiliz|ejempl|diferencia|scopus|operador|busqued|combina|funciona|clave|entender|sirve|^que es|^que son|para buscar|ampliar|afinar|sinonimos/.test(norm)
  ) {
    return withOutro('boole', swapHeading('boole', BOOLE));
  }

  const stage = stageNode(norm);
  if (stage && STAGE_KEYS.has(stage)) {
    const base = STAGE_MAP[stage];
    return withOutro(stage, swapHeading(stage, base));
  }

  if (isSystemQuestion(norm)) {
    return withOutro('system', swapHeading('system', SYSTEM_OVERVIEW));
  }

  // Miedo a que "roben/retengan" la tesis al subirla a un verificador: es una
  // preocupación legítima de confidencialidad, no una consulta genérica de
  // antiplagio. Se responde asegurando autoría y explicando cada módulo.
  if (
    /se queda con mi|quedarse con mi|queden con mi|quien se queda|me (pueden |puede |podrian |podria |van a )?(roban|roben|robar|plagien|plagian|plagiar|copien|copian|copiar|quiten|quitan|quitar)|roban (mi|la|el) (tesis|proyecto|borrador|trabajo|documento)|roben (mi|la|el) (tesis|proyecto|borrador)|robo de (tesis|ideas|proyecto)|alguien (pueda|puede|podria|va a|se va a) (quedar|usar|copiar|robar|plagiar)|es seguro|seguro (subir|guardar|meter|enviar)|confidencial|privado|propiedad (intelectual|de mi)|derechos? de autor|copyright|se apropia|me apropian|vender (mi|la)|usen mi|guarde mi|guardan mi|publica mi|reutiliz|(van|va|voy|vamos|vas) a quedar(se)? con mi|se queden con mi|quedarse con mi (tesis|proyecto|trabajo|borrador|documento|idea|avance)/.test(norm)
  ) {
    return withOutro('seguridad', swapHeading('seguridad', SECURITY));
  }

  return null;
}

