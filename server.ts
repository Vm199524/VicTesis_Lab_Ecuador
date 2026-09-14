import express from 'express';
import path from 'path';
import type { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { DRAFT_GUIDANCE, getPublicGuidance } from './src/domain/draftGuidanceLibrary';
import { registerAuthRoutes } from './src/server/authRoutes';
import { initUserStore } from './src/server/authService';
import { registerOriginalityRoutes } from './src/server/originalityProxy';
import { startOriginalityService, stopOriginalityService } from './src/server/originalityService';
import { translateContent, translate, LOCALES, DEFAULT_LOCALE, type Locale } from './src/i18n/translations';
import {
  PLATFORM_MODULES_SUMMARY,
  platformKnowledgeIntent,
  offScopeReply,
  isThesisContext,
} from './src/domain/platformKnowledge';
import { matchMetaKey } from './src/domain/tutorIntentEngine';

function resolveLocale(value: unknown): Locale {
  return LOCALES.some((l) => l.id === value) ? (value as Locale) : DEFAULT_LOCALE;
}

console.time('[perf] Inicio del servidor');
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '2mb' }));

// Lazy-load GoogleGenAI client: el import dinamico evita cargar el SDK (~11 MB,
// ~190 ms) en el arranque del servidor. Solo se importa la primera vez que hay
// una consulta real con GEMINI_API_KEY definida.
let aiClient: GoogleGenAI | null = null;
async function getAiClient(): Promise<GoogleGenAI> {
  if (!aiClient) {
    const { GoogleGenAI } = await import('@google/genai');
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

const SYSTEM_INSTRUCTION = `Eres el "Tutor IA Metodológico" de VicTesis Lab, un asistente docente experto en investigación científica y procesos de titulación para estudiantes universitarios de todo el Ecuador.
Contexto: VicTesis Lab es el nombre del sistema (un portal universitario independiente y de acceso libre llamado portal Tesis Ecuador), dirigido a estudiantes de cualquier universidad del país.
Tu objetivo es explicar conceptos metodológicos con rigor científico, pedagogía universitaria y ejemplos aplicados a la tesis.
Cada universidad tiene su propio formato de titulación: da orientación general y recuerda al estudiante que debe contrastarla con el reglamento y el formato vigentes de su institución. No inventes normativas ni plazos de universidades concretas.
Responde únicamente sobre metodología, titulación y el contenido real de VicTesis Lab (el portal Tesis Ecuador). Si la consulta es ajena a ese ámbito (temas personales, actualidad, otros oficios, etc.), indícalo con amabilidad y redirige a un tema del sistema; no improvises módulos que no existan.
Regla de marca: cada vez que te refieras a este sistema, portal o aplicación, nómbralo "VicTesis Lab". En la primera mención de una respuesta puedes aclarar entre paréntesis que es el portal universitario Tesis Ecuador. No uses solos términos genéricos como "el sistema", "la plataforma" o "este portal", y no lo llames únicamente "Tesis Ecuador" ni "Ecu Tesis".
Experto en TÍTULOS de tesis: cuando te pidan construir, mejorar o evaluar el título de una investigación, nunca propongas títulos genéricos ni pobres. Aplica a cualquier carrera o especialidad (trabajo social, ingeniería, arquitectura, educación, salud, derecho, etc.). Procede así: 1) si falta información, haz antes 1-3 preguntas breves para delimitar carrera/programa, el problema o tema concreto, la(s) variable(s) u objeto de estudio, la población o unidad de análisis y el contexto (lugar y año o periodo); 2) con los datos, propón 2-3 opciones con enfoques distintos, cada una paramétrica, concisa (idealmente 15-25 palabras) y gramaticalmente correcta, que combine tipo de estudio/estrategia o propuesta + objeto o variables + delimitación (población/ámbito) + contexto geográfico-temporal, con la terminología propia de la disciplina del estudiante; 3) tras proponerlas, explica en 1-2 frases por qué cada opción está bien estructurada y cuál recomiendas.
Estilo: responde en lenguaje natural y conversacional, como un tutor real que dialoga con el estudiante. Evita plantillas, enumeraciones rígidas, títulos repetidos y el tono de manual. Adapta la extensión a la pregunta concreta y, cuando des pasos o conceptos, explícalos en frases fluidas con ejemplos cercanos. Si algo no se entiende o falta contexto, pregunta con naturalidad.`;

// ------------------------------------------------------------------------ LLM
// El Tutor usa un modelo real en lenguaje natural cuando hay una clave. Prioridad:
// Together (Llama, barato y serverless) y, si no, Gemini. Sin ninguna clave cae
// siempre al motor determinista local.

const TOGETHER_MODEL =
  process.env.TOGETHER_MODEL || 'meta-llama/Llama-3.3-70B-Instruct-Turbo';

const LOCALE_NAMES: Record<string, string> = {
  es: 'español',
  en: 'English',
  pt: 'Portuguese',
  fr: 'French',
  it: 'Italian',
};

function localeInstruction(locale: unknown): string {
  if (!locale || locale === 'es') return '';
  const name = LOCALE_NAMES[String(locale)] ?? String(locale);
  return `\nIMPORTANTE — Idioma: redacta toda la respuesta en ${name} (código ${locale}).`;
}

/**
 * Intenta responder la pregunta con un LLM. Devuelve `null` si no hay modelo
 * configurado o si el modelo falla (así el llamador usa el motor local).
 */
async function askLlm(
  message: string,
  conversationHistory: unknown,
  locale: unknown,
  turns = 0,
): Promise<string | null> {
  // Conversación extensa: se invita (con mesura) a seguir en el módulo interactivo
  // que encaja con la consulta, en lugar de explicar todo únicamente por chat.
  const longChatHint =
    typeof turns === 'number' && turns >= 6
      ? `\nConversación extensa: el estudiante lleva ya ${turns} mensajes consultándote. Si su consulta actual encaja con uno de los módulos interactivos de VicTesis Lab, al final de tu respuesta recomiéndale en una sola línea (tono natural) abrir ese módulo desde el menú "Módulos", porque ahí encontrará herramientas interactivas para avanzar más rápido. No repitas la recomendación en cada respuesta.`
      : '';

  const history: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  if (Array.isArray(conversationHistory)) {
    for (const m of conversationHistory) {
      if (!m || typeof m.text !== 'string' || !m.text.trim()) continue;
      history.push({ role: m.sender === 'ai' ? 'assistant' : 'user', content: m.text });
    }
  }

  // 1) Together AI (Llama): económico, con el conocimiento del sistema en contexto.
  const togetherKey = process.env.TOGETHER_API_KEY;
  if (togetherKey) {
    try {
      const system = `${SYSTEM_INSTRUCTION}
# Conocimiento del sistema VicTesis Lab (portal Tesis Ecuador)
${PLATFORM_MODULES_SUMMARY}${longChatHint}${localeInstruction(locale)}`;
      const messages = [{ role: 'system', content: system }] as Array<{
        role: string;
        content: string;
      }>;
      for (const h of history) messages.push(h);
      messages.push({ role: 'user', content: message });

      const response = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${togetherKey}`,
        },
        body: JSON.stringify({
          model: TOGETHER_MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 900,
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        console.warn('[tutor][together] error', response.status, text.slice(0, 300));
      } else {
        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) return content;
      }
    } catch (error: any) {
      console.warn('[tutor][together] fallo, probando Gemini:', error?.message || error);
    }
  }

  // 2) Gemini (respaldo; requiere clave sin restricciones).
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const ai = await getAiClient();
      const context =
        history.map((h) => `${h.role === 'user' ? 'Tesista' : 'Tutor IA'}: ${h.content}`).join('\n') + '\n\n';
      const prompt = `${history.length ? `Historial previo:\n${context}` : ''}Pregunta del tesista: ${message}`;
      const systemInstruction = `${SYSTEM_INSTRUCTION}${longChatHint}${localeInstruction(locale)}`;
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
        config: { systemInstruction, temperature: 0.7 },
      });
      if (response.text && response.text.trim().length > 0) return response.text.trim();
    } catch (geminiError: any) {
      console.warn('[tutor][gemini] error:', geminiError?.message || geminiError);
    }
  }

  return null;
}

// Comprehensive expert knowledge database for the platform
function getDomainResponse(query: string): string {
  const q = query.toLowerCase();

  if (
    q.includes('booleana') ||
    q.includes('booleano') ||
    q.includes('boole') ||
    (q.includes('ecuacion') && !q.includes('matriz')) ||
    (q.includes('operador') && (q.includes('and') || q.includes('or') || q.includes('not'))) ||
    q.includes('title-abs-key')
  ) {
    return `🔍 **¿Qué es una Ecuación Booleana de Búsqueda Científica?**

Una ecuación booleana es una expresión lógica formal basada en el álgebra inventada por el matemático George Boole. En la investigación académica, se utiliza para programar los motores de bases de datos científicas indexadas (como **Scopus**, **Web of Science**, **PubMed** o **IEEE Xplore**) con el fin de recuperar con precisión matemática los artículos arbitrados que fundamentan las variables de tu tesis, eliminando miles de publicaciones irrelevantes.

**Los 3 Operadores Lógicos Fundamentales:**

1. **AND (Intersección obligatoria)**:
   - Exige que todos los términos conectados aparezcan simultáneamente en el artículo (en el título, resumen o palabras clave).
   - *Función*: Reduce y delimita drásticamente el número de resultados.
   - *Ejemplo*: \`"machine learning" AND "credit risk"\` (solo mostrará artículos que aborden ambas variables a la vez).

2. **OR (Unión de sinónimos y descriptores)**:
   - Recupera artículos que contengan al menos uno de los términos indicados. Se usa para conectar sinónimos, acrónimos o variantes terminológicas.
   - *Función*: Amplía la cobertura para no omitir literatura esencial redactada con vocabulario alternativo.
   - *Ejemplo*: \`("pyme" OR "sme" OR "small business" OR "pequeña y mediana empresa")\`.

3. **NOT / AND NOT (Exclusión temática)**:
   - Descarta cualquier documento que contenga el término excluido, evitando sesgos disciplinarios.
   - *Función*: Depura el ruido de la búsqueda.
   - *Ejemplo*: \`"educacion superior" AND NOT "primaria"\`.

**Signos de Puntuación y Sintaxis Clave en Scopus:**
- **Comillas dobles (\`"..."\` )**: Indican búsqueda por frase exacta. Si escribes \`"gestion del talento humano"\`, el motor busca las cuatro palabras en ese orden estricto, no palabras dispersas en el documento.
- **Paréntesis \`( )\`**: Agrupan términos y fijan la jerarquía de evaluación lógica, exactamente igual que en una ecuación algebraica: \`(A OR B) AND (C OR D)\`.
- **Asterisco (\`*\` / Comodín de truncamiento)**: Reemplaza caracteres finales para capturar toda la familia de palabras de una misma raíz (ej: \`educat*\` recupera *education, educational, educator, educative*).
- **Prefijo de campo \`TITLE-ABS-KEY(...)\`**: Ordena a Scopus buscar exclusivamente dentro de los tres campos más significativos: Título (Title), Resumen (Abstract) y Palabras Clave (Keywords).

*Ejemplo de ecuación booleana completa para tu Avance 1*:
\`TITLE-ABS-KEY(("artificial intelligence" OR "machine learning") AND ("academic performance" OR "learning assessment") AND ("higher education" OR "university"))\`

En el **Mini Ecosistema 03 (Scopus & Booleanos)** de esta plataforma encuentras un sintetizador visual que traduce tus variables directamente a esta sintaxis.`;
  }

  if (q.includes('matriz') || q.includes('consistencia') || q.includes('alineacion')) {
    return `📐 **¿Qué es la Matriz de Consistencia y cómo se estructura?**

La matriz de consistencia es el instrumento metodológico nuclear del **Avance 1**. Su objetivo es garantizar la coherencia lógica y la simetría epistemológica entre todas las partes de la investigación:

1. **Alineación Vertical Rectora**:
   - **Pregunta General**: ¿De qué manera la Variable X incide en la Variable Y en [Población/Contexto]?
   - **Objetivo General**: Determinar la incidencia de la Variable X en la Variable Y en [Población/Contexto].
   - **Hipótesis General**: La Variable X incide significativamente en la Variable Y en [Población/Contexto].
2. **Problemas y Objetivos Específicos**:
   - Desglosan la investigación en 3 fases: Diagnóstico inicial de las variables, análisis correlacional o causal, y propuesta metodológica o de intervención.
3. **Operacionalización de Variables**:
   - **Variable Independiente (Causa / X)** y **Variable Dependiente (Efecto / Y)**, descompuestas en dimensiones e indicadores medibles.
4. **Marco Metodológico**:
   - Tipo de investigación, diseño no experimental de corte transversal, población y tamaño de muestra calculada.

En el **Mini Ecosistema 01** puedes construir interactivamente tu Matriz de Consistencia en 4 fases progresivas.`;
  }

  if (q.includes('avance 1') || q.includes('avance1') || q.includes('primer avance')) {
    return `📋 **¿Qué contiene el Avance 1 de Titulación?**

El Avance 1 es la propuesta formal de titulación que se presenta para revisión académica (revisa cómo lo denomina el formato de tu universidad):

1. **Título de la Investigación**: Paramétrico, conciso (máximo 20 palabras), delimitando variables, unidad de análisis, contexto geográfico y temporalidad.
2. **Planteamiento del Problema**: Estructurado bajo el método del embudo (Contexto Macro internacional, Meso nacional y Micro en la institución o empresa objeto de estudio).
3. **Preguntas de Investigación**: Una pregunta rectora central y 3 a 4 subpreguntas específicas.
4. **Objetivos (Taxonomía de Bloom)**: Un objetivo general en infinitivo (ej: Determinar, Analizar, Evaluar) y 3 objetivos específicos secuenciales.
5. **Justificación del Estudio**: Justificación teórica (aporte al conocimiento), metodológica (instrumentos aplicados), práctica (solución al problema) y social (beneficiarios directos).
6. **Delimitación y Viabilidad**: Viabilidad temporal, financiera y de acceso a los datos y muestra.
7. **Matriz de Consistencia Preliminar y Antecedentes**: 5 antecedentes internacionales y 5 nacionales indexados en Scopus, SciELO o Latindex.`;
  }

  if (
    q.includes('apa') ||
    q.includes('et al') ||
    q.includes('cita') ||
    q.includes('referencia') ||
    q.includes('normas apa')
  ) {
    return `📑 **Normas APA 7ª Edición: guía rápida para estudiantes universitarios**

1. **Regla del "et al." (Cambio fundamental en APA 7)**:
   - Para fuentes con **3 o más autores**, se coloca el apellido del primer autor seguido de \`et al.\` y el año desde la **PRIMERA cita** en el texto (ejemplo: *Rodríguez et al., 2023*). Ya no es necesario nombrar a todos los autores en la primera mención.
2. **Cita Textual Corta (< 40 palabras)**:
   - Se incluye entre comillas dentro del párrafo, señalando autor, año y página exacta: *Según Martínez (2024), "la transformación digital..." (p. 88)* o parentética *(Martínez, 2024, p. 88)*.
3. **Cita en Bloque (≥ 40 palabras)**:
   - Párrafo independiente, con sangría izquierda de 1.27 cm, sin comillas y con interlineado doble.
4. **Formato de Referencias con DOI**:
   - Todo artículo científico debe incluir su enlace DOI activo en formato \`https://doi.org/10.xxxx/xxxxx\`.
   - Se aplica sangría francesa (0.5 pulgadas / 1.27 cm) y orden alfabético estricto.

*Recomendación*: Utiliza el gestor bibliográfico **Zotero 7** explicado en el **Mini Ecosistema 04** para insertar citas sin errores manuales.`;
  }

  if (q.includes('zotero') || q.includes('gestor')) {
    return `📚 **¿Qué es Zotero 7 y cómo automatiza tu tesis?**

Zotero es un software libre y gratuito de gestión bibliográfica:
1. **Zotero Connector**: Con un clic en tu navegador Chrome/Firefox/Edge, extrae automáticamente el PDF, título, autores, revista, volumen, año y DOI desde Scopus o Google Scholar.
2. **Integración con Word y Google Docs**: Permite citar con un atajo (\`Alt+Z\`) en formato APA 7ª edición.
3. **Generación de Referencias**: Genera la bibliografía final en 1 segundo asegurando 100% de coincidencia con las citas del texto.
4. **Prevención en Turnitin**: Elimina el riesgo de citas huérfanas (autores citados que no aparecen en referencias).`;
  }

  if (
    q.includes('capitulo') ||
    q.includes('5 capitulos') ||
    q.includes('estructura') ||
    q.includes('capítulo')
  ) {
    return `🏛️ **Estructura Canónica de los 5 Capítulos de Titulación:**

- **Capítulo 1: El Problema**: Planteamiento del problema (macro, meso y micro), formulación de preguntas, delimitación, justificación y objetivos SMART.
- **Capítulo 2: Marco Teórico**: Antecedentes históricos e investigativos contemporáneos (artículos indexados de los últimos 5 años), bases teóricas y definición de términos.
- **Capítulo 3: Metodología**: Enfoque (cuantitativo/cualitativo), tipo (descriptivo/correlacional/explicativo), diseño no experimental de corte transversal, población, muestra, técnicas e instrumentos validados (alfa de Cronbach).
- **Capítulo 4: Análisis de Resultados**: Presentación de tablas, gráficos con formato APA 7, estadística descriptiva e inferencial (pruebas de normalidad y correlación/regresión) y contraste de hipótesis.
- **Capítulo 5: Discusión, Conclusiones y Propuesta**: Triangulación de resultados con los antecedentes del Capítulo 2, conclusiones vinculadas a cada objetivo y recomendaciones prácticas.

Puedes consultar entregables detallados en el **Mini Ecosistema 02 (Los 5 Capítulos)**.`;
  }

  if (
    q.includes('jamovi') ||
    q.includes('spss') ||
    q.includes('vosviewer') ||
    q.includes('connected papers') ||
    q.includes('software') ||
    q.includes('toolbox')
  ) {
    return `💻 **Suite Digital & Toolbox del Mini Ecosistema 05:**

- **Jamovi (Estadística Libre y Gratuita)**: Construido sobre el motor estadístico R con interfaz moderna. Ideal para pruebas de normalidad (Shapiro-Wilk), correlaciones (Pearson, Spearman) y pruebas T de Student.
- **IBM SPSS Statistics**: Software estándar para tablas de contingencia, análisis descriptivo y fiabilidad de instrumentos (Alfa de Cronbach y Omega de McDonald).
- **VOSviewer**: Software para bibliometría que genera mapas visuales de co-ocurrencia de palabras clave y redes de co-citación de autores.
- **Connected Papers**: Herramienta basada en grafos de similitud semántica para encontrar los artículos fundacionales ("prior works") y derivados de cualquier investigación semilla.
- **Zotero 7**: Gestor bibliográfico de código abierto imprescindible para la titulación.`;
  }

  if (
    q.includes('variable') ||
    q.includes('independiente') ||
    q.includes('dependiente') ||
    q.includes('operacionalizacion')
  ) {
    return `🎯 **Variables de Investigación: Independiente vs. Dependiente:**

- **Variable Independiente (VI - Causa / Variable X)**:
  Representa el factor que actúa, condiciona, predice o produce un efecto sobre el fenómeno (ejemplo: *Estrategias de marketing digital*, *Sistemas de control interno* o *Uso de herramientas de IA*).
- **Variable Dependiente (VD - Efecto / Variable Y)**:
  Representa el resultado, conducta o métrica medida que varía en función de la variable independiente (ejemplo: *Volumen de ventas*, *Eficiencia financiera* o *Rendimiento académico*).
- **Operacionalización en la Matriz**:
  Toda variable debe desglosarse en:
  1. Definición Conceptual (según autores de referencia).
  2. Definición Operacional (cómo se medirá en la práctica).
  3. Dimensiones (subcomponentes teóricos de la variable).
  4. Indicadores (datos cuantitativos o ítems de la escala Likert).`;
  }

  if (
    q.includes('turnitin') ||
    q.includes('plagio') ||
    q.includes('similitud') ||
    q.includes('coincidencia')
  ) {
    return `🛡️ **Prevención y Manejo de Similitud en Turnitin:**

1. **Parafraseo Crítico**: No te limites a cambiar palabras por sinónimos (el algoritmo de Turnitin detecta patrones de sinonimia). Lee la fuente, sintetiza la idea con tus propias palabras y argumenta su relación con tu caso.
2. **Cita Oportuna**: Siempre que utilices una idea ajena, coloca la cita parentética o narrativa correspondiente. El parafraseo sin cita también es considerado plagio no intencional.
3. **Citas Textuales**: Utilízalas únicamente cuando la literalidad de la definición de una ley, norma o fórmula sea indispensable.
4. **Filtros institucionales**: Asegúrate de que el informe de Turnitin tenga activados los filtros que exige tu universidad, habitualmente la exclusión de la bibliografía y de las fuentes con coincidencias menores al 1%. Confirma el porcentaje máximo de similitud admitido en el reglamento de titulación de tu institución.`;
  }

  if (
    q.includes('borrador') ||
    q.includes('revisor') ||
    q.includes('mi avance') ||
    q.includes('diagnostico') ||
    q.includes('diagnóstico')
  ) {
    return `📝 **Revisor de Borrador (Módulo 07 del portal)**

Sube tu Avance 1 o 2 en \`.docx\` o pega el texto: el módulo emite un diagnóstico automatizado de forma y estructura. Todo se procesa en el navegador, el documento no viaja a ningún servidor.

Revisa nueve áreas: estructura de secciones obligatorias, resumen y abstract, formulación de objetivos, matriz de requerimientos RF/RNF, metodología y fases, diagramas y pruebas, citas y referencias APA 7, redacción académica y formato editorial de tablas y figuras.

⚠️ El diagnóstico es orientativo y revisa la forma, no el fondo científico. Un puntaje alto no significa que el trabajo esté aprobado: esa decisión es siempre del docente o tutor.`;
  }

  if (q.includes('objetivo') || q.includes('bloom') || q.includes('infinitivo')) {
    return `🎯 **Cómo redactar los objetivos de investigación**

**Objetivo general**: \`verbo en infinitivo + qué se hace + para qué + en qué población y contexto\`. Uno solo, medible, de 25 a 35 palabras.

**Objetivos específicos**: tres, secuenciales, con verbos distintos. El primero diagnostica, el segundo diseña y el tercero desarrolla o valida. Sumados deben producir el objetivo general.

**Verbos de Bloom** por nivel: Identificar, Describir y Caracterizar (diagnóstico); Analizar, Comparar y Determinar (análisis); Diseñar, Desarrollar, Implementar y Proponer (creación).

**Errores frecuentes**: abrir con "El objetivo de este trabajo es", repetir el verbo entre objetivos, plantear un objetivo sin entregable que lo evidencie, o meter dos propósitos en una sola oración. Cada objetivo específico necesita después su propia conclusión.`;
  }

  if (
    q.includes('requerimiento') ||
    q.includes('requisito') ||
    q.includes('ieee') ||
    q.includes('no funcional')
  ) {
    return `📋 **Requerimientos funcionales y no funcionales (IEEE 830)**

**Funcionales (RF)**: lo que el sistema hace. Tabla con ID, módulo, descripción y prioridad. Se esperan entre 12 y 15; los que suelen faltar son reportes, auditoría y control de acceso.

**No funcionales (RNF)**: atributos de calidad, cada uno con **métrica numérica verificable**. Cubre rendimiento, seguridad, disponibilidad, escalabilidad, usabilidad, mantenibilidad, portabilidad e interoperabilidad.

"El sistema debe ser rápido y seguro" no es un requerimiento sino un deseo: sin número no es verificable.

Antes de los requerimientos va la comparación de al menos **tres alternativas de solución** con ventajas, desventajas y decisión tomada.`;
  }

  if (
    q.includes('redaccion') ||
    q.includes('redacción') ||
    q.includes('primera persona') ||
    q.includes('escribir mejor')
  ) {
    return `✍️ **Errores de redacción académica más frecuentes**

1. **Primera persona**: cambia "nosotros desarrollamos" por "se desarrolló".
2. **Tiempo futuro**: desarrollo, resultados y conclusiones van en pasado. El futuro solo cabe en las recomendaciones.
3. **Oraciones de más de 45 palabras**: divídelas en una que afirma y otra que explica.
4. **Falta de conectores**: Asimismo, No obstante, En consecuencia, Por consiguiente.
5. **Lenguaje impreciso**: reemplaza "muy rápido" por el dato concreto.
6. **Marco teórico como diccionario**: haz dialogar a los autores en lugar de enumerar definiciones.
7. **Tablas o figuras sin número, fuente ni mención previa en el texto**.`;
  }

  if (
    q.includes('formato') ||
    q.includes('estructura del documento') ||
    q.includes('secciones') ||
    q.includes('indice') ||
    q.includes('índice')
  ) {
    return `🏛️ **Estructura completa del documento de titulación**

**Preliminares**: portada institucional, ficha de registro del repositorio, certificado antiplagio, certificado del tutor, declaración de autoría con bitácora de tutorías, tabla de contenido e índices de tablas y figuras.

**Cuerpo**:
1. RESUMEN (150-250 palabras) + Palabras clave.
2. ABSTRACT + Keywords.
3. **1. Introducción**: 1.1 Descripción, 1.2 Propósito del caso, 1.3 Base conceptual.
4. **2. Análisis del caso**: 2.1 Requerimientos.
5. **3. Diseño y desarrollo**: 3.1 Metodología, 3.2 Diseño, 3.3 Desarrollo.
6. **4. Conclusiones y recomendaciones**.
7. Referencias en APA 7, Anexos y Anexo de información académica.

Cada capítulo responde una pregunta: el 1 por qué existe el problema, el 2 qué debe hacer la solución, el 3 cómo se construyó y el 4 qué se logró.`;
  }

  if (
    q.includes('sustenta') ||
    q.includes('defensa') ||
    q.includes('diapositiva') ||
    q.includes('exposicion') ||
    q.includes('exposición')
  ) {
    return `🎤 **Preparación de la sustentación**

**Diez minutos**: problema y justificación (2), objetivos (1), metodología y diseño (2), producto y demostración (3), conclusiones (2).

**Preguntas que se repiten**: por qué esa metodología, cómo se calculó la muestra o se eligió el caso, qué limitaciones tuvo el trabajo, cómo se validó el producto y qué harías diferente.

**Recomendaciones**: domina tu propio documento, ten el prototipo corriendo con datos de demostración, reconoce las limitaciones abiertamente y, si no sabes algo, explica cómo lo averiguarías.`;
  }

  if (
    q.includes('video') ||
    q.includes('youtube') ||
    q.includes('tutorial')
  ) {
    return `🎬 **Videoteca guiada (Módulo 06 del portal)**

Rutas por etapa: estructura del documento, metodología y diseño, revisión de literatura científica, herramientas (Zotero, APA 7, Word académico, Jamovi/SPSS, antiplagio) y sustentación.

Cada tarjeta abre YouTube con los términos exactos del tema en lugar de un video fijo, de modo que el material esté siempre vigente.`;
  }

  if (
    q.includes('ayuda') ||
    q.includes('creador') ||
    q.includes('quien creo') ||
    q.includes('quien desarrollo') ||
    q.includes('asesoria') ||
    q.includes('whatsapp')
  ) {
    return `👨‍🏫 **Asesoría metodológica personalizada**

Este portal es un recurso metodológico de acceso libre para los estudiantes universitarios de pregrado y posgrado de **todo el Ecuador** que se encuentran en proceso de titulación.

Si quieres que te ayuden con **un tema en específico** o con **el desarrollo de tu proyecto de titulación**, puedes dar clic en el botón de **WhatsApp** de la barra superior.

Ten presente que las indicaciones de tu docente o tutor siempre tienen la última palabra sobre tu trabajo.`;
  }

  return `🎓 **Tutor IA Metodológico para estudiantes universitarios del Ecuador**

He registrado tu consulta. Para orientarte con precisión académica, puedes preguntarme sobre cualquiera de las herramientas de la plataforma:
- **Ecuaciones booleanas de búsqueda** (operadores AND, OR, NOT, comillas y sintaxis Scopus TITLE-ABS-KEY).
- **Estructuración del Avance 1** y construcción de la Matriz de Consistencia.
- **Los 5 capítulos canónicos** de un trabajo de titulación universitario.
- **Normas APA 7ª edición** (regla del *et al.*, citas textuales y referencias).
- **Zotero 7** y gestores de citas bibliográficas.
- **Software estadístico y bibliométrico** (Jamovi, SPSS, VOSviewer, Connected Papers y Turnitin).

*Pruébame*: escribe *"¿Qué es una ecuación booleana?"*, *"¿Cómo citar con et al en APA 7?"* o *"¿Cómo hacer la matriz de consistencia?"*.`;
}

// API endpoint to answer student questions
app.post('/api/ask-tutor', async (req, res) => {
  try {
    const { message, conversationHistory, locale, turns } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Mensaje requerido' });
      return;
    }

    const llmEnabled = Boolean(process.env.TOGETHER_API_KEY || process.env.GEMINI_API_KEY);

    // Motor determinista del sistema (gratis y preciso): responde al instante
    // sobre hitos (Avance 1/2/3) y panorama de la plataforma. Solo se usa cuando
    // NO hay un modelo conectado; con LLM esas preguntas también se responden en
    // lenguaje natural y este motor queda únicamente como respaldo.
    if (!llmEnabled) {
      const platformReply = platformKnowledgeIntent(message);
      if (platformReply) {
        res.json({ reply: platformReply });
        return;
      }
    }

    // Límite de alcance: fuera del sistema y de los temas de tesis no se
    // responde contenido; se orienta con amabilidad hacia el ámbito propio.
    const normalized = message.toLowerCase().trim();

    // Si hay una tutoría en curso (historial con respuestas del tutor), una
    // continuación breve ("sí", "sigamos") no debe tratarse como fuera de alcance:
    // se deja pasar al LLM con el historial para que retome el hilo.
    const hasOngoingHistory =
      Array.isArray(conversationHistory) &&
      conversationHistory.some(
        (m: { sender?: string; text?: string }) =>
          m && m.sender === 'ai' && typeof m.text === 'string' && m.text.trim().length > 30,
      );
    const shortFollowUp = !isThesisContext(normalized) && normalized.split(/\s+/).filter(Boolean).length <= 6;

    // Cortesía pura (saludo/agradecimiento/despedida): la clasifica el mismo
    // mini-agente que el cliente (matchMetaKey) y se responde en el idioma activo,
    // salvo que estemos en medio de una tutoría (ahí se deja que el LLM siga el
    // hilo). Evita que "hola" o "gracias" caigan en el texto fuera de alcance.
    const meta = matchMetaKey(normalized);
    if (meta !== 'none' && !hasOngoingHistory) {
      res.json({ reply: translate(`tutor.${meta}`, resolveLocale(locale)) });
      return;
    }
    // Fuera del sistema y de los temas de tesis no se responde contenido.
    if (!isThesisContext(normalized) && !(hasOngoingHistory && shortFollowUp)) {
      res.json({ reply: offScopeReply() });
      return;
    }

    // Respuesta con un modelo real (Together/Llama o Gemini) en lenguaje natural.
    const llmReply = await askLlm(message, conversationHistory, locale, turns);
    if (llmReply) {
      res.json({ reply: llmReply });
      return;
    }

    // High-depth domain knowledge response fallback
    const domainReply = getDomainResponse(message);
    res.json({ reply: domainReply });
  } catch (error) {
    console.error('Error in /api/ask-tutor:', error);
    const domainReply = getDomainResponse(req.body?.message || '');
    res.json({ reply: domainReply });
  }
});

/**
 * Guía de corrección del revisor de borradores.
 *
 * El cliente NUNCA envía el texto del documento: solo los identificadores de los
 * hallazgos que su propio navegador detectó. El servidor devuelve un número acotado de
 * consejos, de modo que la guía completa no viaja al bundle ni queda expuesta en las
 * herramientas de desarrollo.
 */
const PUBLIC_GUIDANCE_LIMIT = 3;

app.post('/api/draft-guidance', (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  if (ids.length === 0) {
    res.json({ guidance: [], limit: PUBLIC_GUIDANCE_LIMIT });
    return;
  }
  res.json({
    guidance: getPublicGuidance(ids, PUBLIC_GUIDANCE_LIMIT),
    limit: PUBLIC_GUIDANCE_LIMIT,
  });
});

/**
 * Panel privado: devuelve la guía completa para poder acompañar a un estudiante.
 * Requiere ADMIN_KEY en el entorno; si no está definida, el endpoint queda cerrado.
 */
app.post('/api/admin/draft-guidance', (req, res) => {
  const adminKey = process.env.ADMIN_KEY;

  if (!adminKey) {
    res.status(503).json({
      error:
        'El panel privado está deshabilitado. Define ADMIN_KEY en tu archivo .env y reinicia el servidor para activarlo.',
    });
    return;
  }

  const passphrase = typeof req.body?.passphrase === 'string' ? req.body.passphrase : '';
  if (passphrase !== adminKey) {
    res.status(401).json({ error: 'Clave incorrecta.' });
    return;
  }

  const entries = Object.entries(DRAFT_GUIDANCE).map(([id, fix]) => ({ id, fix }));
  res.json({ total: entries.length, guidance: entries });
});

// Chequeo de salud: usado por el pipeline de despliegue (deploy.yml) para
// confirmar que la revision nueva de Cloud Run ya esta atendiendo trafico.
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Sesion de estudiantes: correo/contrasena siempre; Google y GitHub si hay credenciales.
registerAuthRoutes(app);

// Verificador de Originalidad: el portal actua de puente hacia el servicio detector.
registerOriginalityRoutes(app);

// Vite middleware for development or static serving for production
async function startServer() {
  // Carga el almacén de cuentas antes de atender tráfico: en producción conecta
  // Firestore y deja la caché de usuarios lista (ver authService.initUserStore).
  await initUserStore();

  if (process.env.NODE_ENV !== 'production') {
    console.time('[perf] Inicializar Vite');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    console.timeEnd('[perf] Inicializar Vite');
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  console.time('[perf] Servidor HTTP escuchando');
  app.listen(PORT, '0.0.0.0', () => {
    console.timeEnd('[perf] Servidor HTTP escuchando');
    console.log(`Tesis Ecuador · Portal Universitario ejecutándose en http://127.0.0.1:${PORT}`);
  });

  // El Verificador de Originalidad se inicia bajo demanda (lazy-loading) cuando
  // el usuario abre la sección de plagio por primera vez. Esto reduce el tiempo
  // de arranque del portal de 45-60s a 2-3s.
}

// Un fallo asincrono sin capturar tumbaria el proceso sin dejar rastro en el log.
// Registrarlo antes de salir es la diferencia entre depurar y adivinar.
process.on('uncaughtException', (error) => {
  console.error('[fatal] Excepcion no capturada:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[fatal] Promesa rechazada sin manejar:', reason);
});

process.on('exit', (code) => {
  stopOriginalityService();
  console.error(`[server] El proceso termina con codigo ${code}`);
});

// Ctrl+C y `kill` no disparan 'exit' por si solos: sin esto el detector quedaria
// huerfano ocupando su puerto y el siguiente arranque fallaria.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    stopOriginalityService();
    process.exit(0);
  });
}

startServer().catch((error) => {
  console.error('[fatal] El servidor no pudo iniciar:', error);
  process.exit(1);
});

setTimeout(() => {
  console.timeEnd('[perf] Inicio del servidor');
}, 1000);
