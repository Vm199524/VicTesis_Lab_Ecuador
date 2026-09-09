import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  X,
  MessageSquare,
  RefreshCw,
  Trash2,
  Lightbulb,
  ChevronDown,
} from 'lucide-react';
import { FormattedAcademicText } from './FormattedAcademicText';
import { RobotFace } from './RobotFace';
import { usePreferences } from '../context/PreferencesContext';
import { platformKnowledgeIntent } from '../domain/platformKnowledge';
import { matchTopicKey, nextTopicKey, matchMetaKey } from '../domain/tutorIntentEngine';
import type { EcosystemId, ViewMode } from '../types';
import { ECOSYSTEMS_LIST } from '../data/ecosystems';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

interface ThesisAiTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWhatsApp: () => void;
  /**
   * Módulo activo y vista, para que el tutor ajuste su tono al contexto del
   * usuario (p. ej. responder "con foco en Scopus" si el chat se abre dentro
   * del Ecosistema 03). Se emite una sola vez por módulo.
   */
  activeEcosystem?: EcosystemId;
  viewMode?: ViewMode;
}

/**
 * Accesos rápidos del tutor.
 *
 * La etiqueta se traduce, pero `query` viaja siempre en español: la base de
 * conocimiento reconoce la consulta por palabras clave españolas, así que
 * traducir también el texto enviado dejaría al tutor sin respuesta.
 */
const PRESET_QUESTIONS: { key: string; query: string }[] = [
  { key: 'draftReview', query: '¿Cómo reviso mi borrador?' },
  { key: 'structure', query: 'Estructura del documento completo' },
  { key: 'objectives', query: '¿Cómo redacto los objetivos?' },
  { key: 'ieee830', query: 'Requerimientos IEEE 830' },
  { key: 'writingErrors', query: 'Errores de redacción académica' },
  { key: 'boolean', query: '¿Qué es una ecuación booleana?' },
  { key: 'matrix', query: 'Matriz de Consistencia y Avance 1' },
  { key: 'etAl', query: 'Regla del "et al." en APA 7' },
  { key: 'chapters', query: 'Los 5 capítulos de la tesis' },
  { key: 'zotero', query: 'Zotero 7 y gestor de citas' },
];

/**
 * Textos en español de la base de conocimiento del tutor. Sirven de *fallback*
 * de `tf()`: la traducción real (en, pt, fr, it) vive en
 * `src/i18n/content/tutorResponses.ts` bajo las claves `tutor.kb.<id>`.
 */
const KNOWLEDGE_RESPONSES_ES: Record<string, string> = {
  ecuacion_booleana: `🔍 **¿Qué es una Ecuación Booleana de Búsqueda Científica?**

Una ecuación booleana es una expresión lógica estructurada basada en el álgebra de George Boole, utilizada en motores de búsqueda académica y bases de datos arbitradas de alto impacto (como **Scopus**, **Web of Science**, **PubMed** e **IEEE Xplore**) para recuperar con máxima precisión la literatura indexada sobre las variables de tu tesis.

**Los 3 operadores lógicos fundamentales**

1. **AND (Intersección obligatoria)**:
   - Exige que todos los términos conectados aparezcan simultáneamente en el documento (título, resumen o palabras clave).
   - *Función*: Reduce y delimita los resultados a la intersección exacta.
   - *Ejemplo*: \`"machine learning" AND "credit risk"\` (solo recupera artículos que traten de ambos temas a la vez).

2. **OR (Unión de sinónimos)**:
   - Recupera artículos que contengan al menos uno de los términos indicados. Se utiliza para enlazar sinónimos, acrónimos o variantes conceptuales.
   - *Función*: Amplía la cobertura para no perder artículos clave redactados con otros términos.
   - *Ejemplo*: \`("pyme" OR "sme" OR "small business" OR "pequeña y mediana empresa")\`.

3. **NOT / AND NOT (Exclusión temática)**:
   - Descarta documentos que contengan un término indeseado que pueda sesgar el estudio.
   - *Función*: Depura el ruido metodológico.
   - *Ejemplo*: \`"educacion superior" AND NOT "primaria"\`.

**Signos de puntuación y sintaxis clave en Scopus**
- **Comillas dobles (\`"..."\` )**: Obligan al motor a buscar la frase textual continua y exacta, no palabras sueltas dispersas (ej: \`"supply chain management"\`).
- **Paréntesis \`( )\`**: Agrupan términos y definen la jerarquía lógica, exactamente como en una fórmula matemática: \`(A OR B) AND (C OR D)\`.
- **Asterisco (\`*\` / Comodín de truncamiento)**: Captura la raíz léxica y todas sus derivaciones (ej: \`educat*\` recupera *education, educational, educator, educative*).
- **Prefijo de campo \`TITLE-ABS-KEY(...)\`**: Ordena a Scopus buscar exclusivamente dentro del Título, Resumen (Abstract) y Palabras Clave (Keywords).

*Ejemplo integral para tu Avance 1 en Scopus*:
\`TITLE-ABS-KEY(("artificial intelligence" OR "machine learning") AND ("academic performance" OR "learning assessment") AND ("higher education" OR "university"))\`

En el **Mini Ecosistema 03 (Scopus & Booleanos)** de esta plataforma dispones de un generador interactivo que traduce automáticamente tus variables a esta sintaxis.`,

  scopus: `🔍 **Fórmula recomendada para Scopus y Web of Science**

1. Usa comillas dobles para términos compuestos: \`"supply chain"\` o \`"machine learning"\`.
2. Emplea el operador **AND** para intersecar tus variables obligatorias: \`"variable A" AND "variable B"\`.
3. Emplea el operador **OR** para agrupar sinónimos: \`("fintech" OR "digital banking")\`.
4. Filtra por los últimos 5 años (2021-2026) y revistas indexadas en cuartiles Q1 o Q2.

*Recomendación metodológica*: Traducir las ecuaciones al idioma inglés permite acceder a más del 85% de la producción científica global arbitrada.`,

  matriz: `📐 **¿Qué es la Matriz de Consistencia y cómo se estructura?**

La matriz de consistencia es la herramienta metodológica medular del **Avance 1**. Garantiza la coherencia lógica y la alineación matemática entre todos los componentes de la investigación:

1. **Problema General** = **Objetivo General** = **Hipótesis General** (si aplica).
2. **Problemas Específicos** = **Objetivos Específicos** = **Hipótesis Específicas**.
3. **Variables**: Variable Independiente (Causa / X) y Variable Dependiente (Efecto / Y).
4. **Dimensiones e Indicadores**: Los parámetros cuantificables o cualificables que se medirán con los instrumentos de campo.
5. **Metodología**: Enfoque (cuantitativo/cualitativo), tipo (descriptivo, correlacional, explicativo), diseño (no experimental transversal) y muestra.

En el **Mini Ecosistema 01** puedes construir progresivamente tu Matriz de Consistencia en 4 fases secuenciales.`,

  avance1: `📋 **¿Qué contiene el Avance 1 de Titulación?**

El Avance 1 representa la fundamentación inicial y la aprobación del plan de tesis:
1. **Título del Proyecto**: Paramétrico y conciso (idealmente entre 15 y 20 palabras), delimitando variables, unidad de análisis, contexto geográfico y temporalidad.
2. **Planteamiento del Problema**: Redactado bajo la técnica del embudo (contexto Macro internacional, Meso nacional y Micro institucional).
3. **Preguntas de Investigación**: Una pregunta rectora central y 3 a 4 subpreguntas específicas.
4. **Objetivos de Investigación**: Un objetivo general (inicia con verbo taxonómico de Bloom en infinitivo) y 3 objetivos específicos secuenciales (diagnosticar, analizar/evaluar y proponer).
5. **Justificación**: Teórica, metodológica, práctica y social.
6. **Matriz de Consistencia Preliminar y Antecedentes**: 5 antecedentes internacionales y 5 nacionales indexados en Scopus, Latindex o SciELO.`,

  apa: `📑 **Normas APA 7ª Edición: puntos clave de evaluación**

1. **Regla del "et al."**: Para obras con 3 o más autores, desde la PRIMERA cita en el texto se coloca únicamente el primer autor seguido de \`et al.\` y el año (ejemplo: *García et al., 2023*).
2. **Cita Textual Corta (< 40 palabras)**: Se incorpora dentro del párrafo entre comillas, indicando autor, año y número de página: *(Pérez, 2024, p. 45)*.
3. **Cita en Bloque (≥ 40 palabras)**: Se ubica en párrafo independiente con sangría izquierda de 1.27 cm, a doble espacio y sin comillas.
4. **Identificador Digital (DOI)**: Debe presentarse siempre en formato de hipervínculo activo \`https://doi.org/...\`.

*Recomendación*: El uso del gestor bibliográfico **Zotero** previene inconsistencias formales entre las citas en el cuerpo del texto y la lista final de referencias. Revisa el **Mini Ecosistema 04** para ver el simulador interactivo de citas.`,

  zotero: `📚 **¿Qué es Zotero 7 y por qué es indispensable para tu tesis?**

Zotero es un gestor bibliográfico de código abierto que automatiza la recopilación, organización y citación de fuentes académicas:
1. **Zotero Connector**: Extensión de navegador que detecta artículos en Scopus, Google Scholar o repositorios y los guarda con un solo clic con metadatos completos (autores, año, DOI, revista).
2. **Integración con Microsoft Word y Google Docs**: Inserta citas parentéticas y narrativas en formato APA 7ª edición con un atajo de teclado, garantizando que el formato nunca tenga fallas tipográficas.
3. **Generación instantánea de Referencias**: Con un solo clic genera la lista bibliográfica final con sangría francesa y orden alfabético estricto.
4. **Cero discrepancias en Turnitin**: Evita la falta de coincidencia entre autores citados en el texto y autores referenciados al final, una de las observaciones más frecuentes al revisar la bibliografía.

En el **Mini Ecosistema 04** tienes una guía completa de configuración paso a paso de Zotero 7.`,

  capitulos: `🏛️ **Estructura canónica de los 5 capítulos de titulación**

1. **Capítulo 1: El Problema**: Contextualización macro, meso y micro; formulación de preguntas de investigación, objetivos generales y específicos (SMART), y justificación del estudio.
2. **Capítulo 2: Marco Teórico**: Antecedentes investigativos contemporáneos (artículos indexados de los últimos 5 años), fundamentación teórica y conceptualización de variables.
3. **Capítulo 3: Metodología**: Enfoque epistemológico, tipo y diseño de investigación, delimitación de la población, cálculo de muestra, técnicas e instrumentos de recolección de datos.
4. **Capítulo 4: Resultados**: Procesamiento de datos, estadística descriptiva e inferencial, y comprobación de hipótesis.
5. **Capítulo 5: Discusión y Conclusiones**: Triangulación de los hallazgos con la literatura del Capítulo 2, conclusiones y recomendaciones prácticas.

Puedes explorar cada uno en detalle en el **Mini Ecosistema 02 (Los 5 Capítulos)**. Verifica siempre el número y el orden de capítulos que exige el formato de titulación de tu universidad: esta es la estructura más extendida, pero cada institución la adapta.`,

  cuantitativo: `📊 **Diferenciación epistemológica: enfoque cuantitativo vs. cualitativo**

**Enfoque Cuantitativo**
- Se orienta a la medición numérica de variables y al análisis estadístico inferencial.
- Busca probar hipótesis preestablecidas mediante muestras probabilísticas representativas.
- Instrumentos característicos: Cuestionarios estructurados con escala Likert y registros estandarizados.

**Enfoque Cualitativo**
- Explora significados, percepciones y experiencias de los sujetos de investigación.
- No busca generalización probabilística ni prueba numérica de hipótesis.
- Instrumentos característicos: Entrevistas a profundidad, grupos focales y análisis documental.`,

  variables: `🎯 **Variables de investigación: independiente vs. dependiente**

- **Variable Independiente (VI - Causa / X)**: Es la variable antecedente que influye, genera o predice un cambio sobre la otra variable (ej: *Estrategias de gamificación docente* o *Implementación de sistemas ERP*).
- **Variable Dependiente (VD - Efecto / Y)**: Es el fenómeno, conducta o métrica observada que se ve alterada por la acción de la variable independiente (ej: *Rendimiento académico* o *Eficiencia operativa financiera*).
- **Operacionalización**: Ambas variables deben desglosarse en la Matriz de Consistencia en: Definición conceptual, Definición operacional, Dimensiones, Indicadores e Ítems del instrumento.`,

  turnitin: `🛡️ **Prevención de similitud inapropiada en Turnitin**

1. **Parafraseo Sintético**: Comprender la idea central de la fuente original y redactarla con léxico propio y análisis crítico, evitando el mero reemplazo de palabras por sinónimos.
2. **Atribución Obligatoria**: Toda idea tomada de terceros debe incluir su correspondiente cita parentética o narrativa, independientemente de que se haya parafraseado.
3. **Citas Textuales Justificadas**: Emplear citas directas únicamente cuando la literalidad del texto original resulte indispensable, acompañadas de su respectiva página.
4. **Filtros Institucionales**: Verificar que en los ajustes del informe se excluya la bibliografía y las coincidencias menores de 1% según el reglamento de titulación.`,

  software: `💻 **Software recomendado en el Mini Ecosistema 05 (Toolbox)**

- **Jamovi**: Software libre y gratuito de interfaz moderna basado en R. Es ideal para pruebas de normalidad (Shapiro-Wilk), correlaciones de Pearson/Spearman, regresiones lineales y pruebas T.
- **SPSS**: Estándar comercial para estadística descriptiva, tablas de contingencia, fiabilidad de instrumentos (Alfa de Cronbach, Omega de McDonald) y análisis factorial.
- **VOSviewer**: Genera mapas bibliométricos para el estado del arte mostrando redes de co-citación de autores y palabras clave indexadas.
- **Connected Papers**: Permite descubrir artículos seminales y derivados a partir de un artículo semilla mediante grafos visuales de citas.
- **Zotero**: Gestor de referencias bibliográficas de código abierto para redactar sin errores en APA 7.`,

  revision_borrador: `📝 **Cómo funciona el Revisor de Borrador (Módulo 07)**

Sube tu Avance 1 o Avance 2 en \`.docx\` o pega el texto, y el módulo emite un diagnóstico automatizado de **forma y estructura**. Todo se procesa en tu navegador: el documento no se sube a ningún servidor.

**Qué revisa, por área**
- **Estructura**: presencia de las secciones obligatorias del formato (Resumen, Abstract, 1.1 Descripción, 1.2 Propósito, 1.3 Base conceptual, 2.1 Requerimientos, 3.1 Metodología, 3.2 Diseño, 3.3 Desarrollo, Conclusiones, Recomendaciones, Referencias, Anexos y Anexo de información académica).
- **Resumen y abstract**: extensión entre 150 y 250 palabras, presencia de palabras clave y keywords.
- **Objetivos**: que el general inicie con verbo en infinitivo de Bloom, que existan 3 específicos y que no repitan verbo.
- **Requerimientos**: codificación RF/RNF, columna de prioridad y referencia al estándar IEEE 830.
- **Metodología**: metodología nombrada, justificada y desglosada en fases o sprints, más cronograma.
- **Diseño y desarrollo**: cobertura de diagramas, arquitectura declarada, diccionario de datos y casos de prueba.
- **Citas y referencias**: número de citas frente a referencias, vigencia de las fuentes, presencia de DOI y uso correcto de *et al.*
- **Redacción académica**: primera persona, verbos en futuro donde debería ir pasado, oraciones largas y conectores.
- **Formato editorial**: numeración de tablas y figuras, declaración de fuente e informe de originalidad.

⚠️ El diagnóstico es **orientativo**: revisa la forma, no el fondo científico. Un puntaje alto no significa que el trabajo esté aprobado; esa decisión es siempre del docente o tutor.`,

  estructura_documento: `🏛️ **Estructura completa del documento de titulación**

**Preliminares**
1. Portada institucional con facultad, carrera, modalidad, autores y tutor.
2. Ficha de registro del repositorio nacional (título, autores, áreas temáticas, palabras clave, resumen y abstract).
3. Certificado del sistema antiplagio y certificado del tutor.
4. Declaración de autoría con la bitácora fechada de tutorías y sus evidencias.
5. Tabla de contenido, índice de tablas e índice de figuras, todos con paginado automático.

**Cuerpo**
6. **RESUMEN** (150-250 palabras) + Palabras clave.
7. **ABSTRACT** + Keywords.
8. **1. Introducción**: 1.1 Descripción, 1.2 Propósito del caso (objetivo general y específicos), 1.3 Base conceptual.
9. **2. Análisis del caso**: 2.1 Requerimientos (alternativas evaluadas, RF y RNF).
10. **3. Diseño y desarrollo del trabajo práctico**: 3.1 Metodología, 3.2 Diseño, 3.3 Desarrollo.
11. **4. Conclusiones y recomendaciones**.
12. **Referencias** en APA 7ª edición.
13. **Anexos** y **Anexo de información académica** (aporte de cada asignatura, innovación y producto desarrollado).

*Cada capítulo responde una pregunta distinta*: el 1 explica por qué el problema existe, el 2 qué debe hacer la solución, el 3 cómo se construyó y el 4 qué se logró. Si un contenido no responde la pregunta del capítulo, está en el lugar equivocado.`,

  objetivos: `🎯 **Cómo redactar los objetivos de investigación**

**Fórmula del objetivo general**
\`Verbo en infinitivo + qué se hace + para qué + en qué población y contexto\`

Debe ser **uno solo**, medible y alcanzable con el trabajo que efectivamente vas a entregar. Ronda las 25 a 35 palabras porque tiene que cerrar el "para qué" y la unidad de análisis.

**Verbos según el nivel de Bloom**
- Diagnóstico: *Identificar, Describir, Caracterizar, Diagnosticar*
- Análisis: *Analizar, Comparar, Evaluar, Determinar*
- Creación: *Diseñar, Desarrollar, Implementar, Proponer, Construir*

**Objetivos específicos**
Son **tres**, secuenciales, y sumados deben producir el objetivo general:
1. Uno diagnostica o identifica los parámetros del problema.
2. Uno diseña la arquitectura o el modelo.
3. Uno desarrolla, implementa o valida el producto.

**Errores que se marcan de inmediato**
- Empezar con "El objetivo de este trabajo es..." en lugar del infinitivo directo.
- Repetir el mismo verbo en dos objetivos: revela que ambos miden lo mismo.
- Usar el mismo verbo del general en un específico.
- Formular un objetivo que no se pueda evidenciar con un entregable del documento.
- Incluir dos propósitos en una sola oración unidos por "y".

Cada objetivo específico debe tener después **su propia conclusión** en el capítulo 4.`,

  requerimientos: `📋 **Requerimientos funcionales y no funcionales (IEEE 830)**

**Requerimientos funcionales (RF)**: lo que el sistema *hace*. Tabla de cuatro columnas:
| ID | Nombre del módulo | Descripción de la función | Prioridad |

Se codifican RF-01, RF-02... y lo esperado ronda **12 a 15**. Recorre cada rol del sistema y cada operación CRUD que ejecuta; los que casi siempre faltan son reportes, auditoría y control de acceso.

**Requerimientos no funcionales (RNF)**: atributos de *calidad*, y cada uno necesita una **métrica numérica verificable**:
- **Rendimiento**: tiempo de respuesta menor a X segundos con Y usuarios concurrentes.
- **Seguridad**: cifrado de contraseñas, autenticación con expiración, comunicación HTTPS.
- **Disponibilidad**: porcentaje de uptime mensual comprometido.
- **Escalabilidad**: número de usuarios concurrentes y volumen de registros soportado.
- **Usabilidad**: tiempo máximo para completar una tarea o para capacitar a un usuario.
- **Mantenibilidad**: separación de responsabilidades y cobertura de pruebas.
- **Portabilidad** e **Interoperabilidad**: entornos de despliegue y APIs expuestas.

"El sistema debe ser rápido y seguro" no es un requerimiento: es un deseo. Sin número no es verificable.

**Antes de los requerimientos** va la comparación de **alternativas de solución** (al menos tres) con ventajas, desventajas y la decisión tomada. Sin ese cuadro tu elección tecnológica queda sin sustento.`,

  redaccion: `✍️ **Redacción académica: los errores más frecuentes**

**1. Primera persona.** La redacción científica es impersonal. Cambia "nosotros desarrollamos" por "se desarrolló", "nuestro sistema" por "el sistema".

**2. Tiempo verbal equivocado.** El futuro solo cabe en las recomendaciones. Desarrollo, resultados y conclusiones van en **pasado**: si ya lo hiciste, escríbelo como hecho. "Se implementará" en un capítulo de desarrollo delata que copiaste tu propio anteproyecto.

**3. Oraciones interminables.** Más de 45 palabras y se pierde el hilo. Divide: una oración que afirma y otra que explica.

**4. Ausencia de conectores.** *Asimismo, No obstante, En consecuencia, Por consiguiente, De igual forma.* Uno por párrafo es suficiente para dar continuidad argumentativa.

**5. Lenguaje impreciso.** Sustituye el intensificador por el dato: en lugar de "muy rápido", escribe "con un tiempo de respuesta menor a 2 segundos".

**6. Marco teórico como diccionario.** No enumeres definiciones: haz que los autores dialoguen. "Mientras X sostiene que..., Y evidencia que...".

**7. Párrafos sin cita.** Toda afirmación que no sea un dato propio necesita respaldo. Prioriza citar en la descripción del problema, la base conceptual y la discusión.

**8. Tablas y figuras huérfanas.** Toda tabla lleva número y título arriba, la fuente abajo, y debe anunciarse en el texto antes de aparecer ("ver Tabla 3").`,

  videoteca: `🎬 **Videoteca guiada (Módulo 06)**

Rutas de video organizadas por el momento del proceso en el que conviene verlas:
- **Estructura del documento**: capítulos, estudio de caso, resumen y abstract, conclusiones.
- **Metodología**: planteamiento con la técnica del embudo, objetivos con Bloom, matriz de consistencia, operacionalización de variables, requerimientos IEEE 830.
- **Revisión de literatura**: Scopus y cuartiles, ecuaciones booleanas, SciELO y Redalyc, Connected Papers y VOSviewer, revisión sistemática con PRISMA.
- **Herramientas**: Zotero 7, normas APA 7, Word académico, parafraseo y control de similitud, Jamovi y SPSS, uso ético de IA.
- **Sustentación**: diapositivas en 10 minutos, preguntas frecuentes de la defensa, cómo atender observaciones.

Cada tarjeta abre YouTube con los términos exactos del tema en lugar de un video fijo, de modo que el material siempre esté vigente y ningún enlace quede roto.`,

  defensa: `🎤 **Preparación de la sustentación**

**Distribución para 10 minutos**
1. Problema y justificación — 2 min
2. Objetivos — 1 min
3. Metodología y diseño — 2 min
4. Producto y resultados (demostración) — 3 min
5. Conclusiones — 2 min

**Preguntas que se repiten**
- ¿Por qué elegiste esta metodología y no otra?
- ¿Cómo calculaste la muestra o por qué ese caso de estudio?
- ¿Qué limitaciones tuvo tu trabajo?
- ¿Cómo validaste que el producto funciona?
- ¿Qué harías diferente si empezaras de nuevo?

**Recomendaciones**
- Domina tu propio documento: la mayoría de las preguntas sale de lo que escribiste.
- Ten el prototipo funcionando y con datos de demostración cargados de antemano.
- Reconoce las limitaciones abiertamente: declararlas demuestra criterio, ocultarlas genera desconfianza.
- Si no sabes algo, dilo y explica cómo lo averiguarías. Improvisar se nota.`,

  asesoria: `🤝 **Ayuda directa**

Este portal es un recurso de acceso libre para los estudiantes universitarios del Ecuador en proceso de titulación.

Si quieres que te ayuden con **un tema en específico** o con **el desarrollo de tu proyecto de titulación**, usa el botón de WhatsApp de la barra superior.

Ten presente que las indicaciones de tu docente o tutor siempre tienen la última palabra sobre tu trabajo.`,

  default: `🎓 **Tutor IA Metodológico para estudiantes universitarios del Ecuador**

Este módulo te orienta con rigor sobre todos los componentes de la plataforma:
- **Ecosistema 01**: Viabilidad del tema y Matriz de Consistencia del Avance 1.
- **Ecosistema 02**: Estructura de los 5 capítulos de titulación y entregables.
- **Ecosistema 03**: Ecuaciones booleanas de búsqueda en Scopus (AND, OR, NOT, sintaxis TITLE-ABS-KEY).
- **Ecosistema 04**: Normas APA 7ª edición, regla del *et al.* y gestor bibliográfico Zotero 7.
- **Ecosistema 05**: Software para tesis (Jamovi, SPSS, VOSviewer, Connected Papers y Turnitin).
- **Ecosistema 06**: Videoteca guiada por etapa del proceso.
- **Ecosistema 07**: Revisor de borrador, para diagnosticar tu Avance 1 o 2 antes de entregarlo.

*Pregúntame cualquier concepto*: por ejemplo "¿Qué es una ecuación booleana?", "¿Cómo hacer los objetivos con Bloom?", "¿Cómo citar en APA 7?" o "¿Qué lleva el Avance 1?".`,
};

const HISTORY_KEY = 'tesis-ecuador-tutor-ia-historial';

/**
 * Palabras que delatan que el usuario ya está introduciendo un tema nuevo
 * (no es una continuación). Si aparecen, la frase se trata como consulta nueva.
 */
const TOPIC_HINT_WORDS = [
  'boole', 'scopus', 'wos', 'matriz', 'consistencia', 'avance', 'zotero', 'gestor',
  'apa', 'et al', 'cita', 'referencia', 'jamovi', 'spss', 'vosviewer', 'connected',
  'variable', 'independiente', 'dependiente', 'capitulo', 'estructura', 'cuantitativ',
  'cualitativ', 'enfoque', 'turnitin', 'plagio', 'borrador', 'revisor', 'revisa',
  'objetivo', 'bloom', 'infinitivo', 'requerimiento', 'requisito', 'ieee', 'funcional',
  'redaccion', 'ortograf', 'video', 'youtube', 'tutorial', 'sustenta', 'defensa',
  'diapositiva', 'exposicion', 'formato', 'secciones', 'indice', 'asesoria', 'whatsapp',
  'cuartil', 'draft', 'metodologia', 'hipotesis', 'muestra', 'turnitin',
];

/**
 * Detecta si el usuario respondió con una AFIRMACIÓN de continuación explícita
 * ("sí", "sigamos", "dale", "adelante") y quiere retomar/avanzar el último tema.
 *
 * Regla clave: un interrogante en lenguaje natural ("¿hasta dónde vamos a
 * avanzar?", "¿qué sigue?") NO es un "sí, sigamos". Antes esta función aceptaba
 * casi cualquier mensaje corto (≤6 palabras) como continuación, y por eso el
 * tutor "avanzaba solo" ante preguntas reales → sonaba a robot. Ahora exige una
 * afirmación explícita y rechaza cualquier señal de pregunta o tema nuevo.
 */
const isLikelyContinuation = (raw: string): boolean => {
  const original = raw.trim();
  const text = original.replace(/^[¡¿]+|[!?¡¿.]+$/g, '').toLowerCase();
  if (!text) return false;
  // Cortesías no son continuaciones de tema.
  if (/^(hola|hi|hello|hey|buenas|buenos dias|saludos|gracias)\b/.test(text)) return false;
  // Signo de pregunta en cualquier posición → el usuario preguntó, no afirmó.
  if (/[?¿]/.test(original)) return false;
  // Palabras interrogativas en cualquier lugar ("hasta donde vamos", "cual",
  // "cuando", "cuanto", "puedes", "dime") → no es continuación.
  if (
    /(^|\s)(donde|dónde|cuando|cuándo|como|cómo|cual|cuál|cuales|cuáles|por que|por qué|para que|para qué|que sigue|qué sigue|que viene|qué viene|hasta donde|hasta dónde|cuanto|cuánto|cuantos|cuántos|explica|explícame|dime|cuentame|cuéntame|puedes|puede|ayudame|ayúdame)\b/.test(
      text,
    )
  ) {
    return false;
  }
  // Un tema nuevo, aunque sea corto ("zotero que es"), es consulta nueva.
  if (TOPIC_HINT_WORDS.some((w) => text.includes(w))) return false;
  // Afirmación explícita de continuar (es lo único que avanza el flujo).
  const affirmation =
    /^(s[ií]|s[ií]\,?[ ]?(sigamos|dale|vamos|adelante|continua|continuemos|seguimos)|sigamos|continuemos|seguimos|dale|vamos|adelante|claro|de acuerdo|ok|okay|vale|perfecto|listo|entendido|bueno|yes|continue|go ahead|let's go)\b/.test(
      text,
    );
  if (!affirmation) return false;
  return text.split(/\s+/).filter(Boolean).length <= 6;
};

const WELCOME_MESSAGE_ES = `🎓 **Bienvenido al módulo de orientación metodológica**

Estoy preparado para asistirte en:
- Normas APA 7ª edición y normalización bibliográfica.
- Ecuaciones booleanas en Scopus y Web of Science.
- Estructura capitular canónica (Capítulos 1 al 5).
- Operacionalización de variables y enfoques de investigación.

*Recordatorio ético*: Como tutor virtual te oriento conceptualmente, pero no realizo tesis ni redacciones por encargo. ¿Qué duda metodológica deseas resolver?`;

const buildWelcomeMessage = (tf: (key: string, fallback: string) => string): Message => ({
  id: 'welcome',
  sender: 'ai',
  text: tf('tutor.welcome', WELCOME_MESSAGE_ES),
  timestamp: 'Ahora',
});

/** Recupera la conversación previa; ante cualquier dato corrupto vuelve al saludo. */
const loadHistory = (tf: (key: string, fallback: string) => string): Message[] => {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [buildWelcomeMessage(tf)];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // El saludo guardado pudo quedar "pegado" en otro idioma: se re-localiza al activo.
      const welcome = buildWelcomeMessage(tf);
      return (parsed as Message[]).map((m) =>
        m && m.id === 'welcome' ? { ...m, text: welcome.text } : m,
      );
    }
  } catch {
    // Historial ilegible: se descarta en silencio.
  }
  return [buildWelcomeMessage(tf)];
};

export const ThesisAiTutorModal: React.FC<ThesisAiTutorModalProps> = ({
  isOpen,
  onClose,
  onOpenWhatsApp,
  activeEcosystem = 'feasibility',
  viewMode = 'home',
}) => {
  const { t, tf, locale } = usePreferences();
  const [messages, setMessages] = useState<Message[]>(() => loadHistory(tf));
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tono contextual por módulo: la apertura personalizada se emite una sola vez
  // por módulo activo (y con plantillas alternas) para no volverse repetitiva.
  const toneTurnRef = useRef<EcosystemId | null>(null);
  const toneVariantRef = useRef(0);

  // Última intención resuelta ('topic:<claveKB>', 'free' = IA del servidor,
  // 'system' = motor determinista). Permite retomar el hilo en las continuaciones.
  const lastIntentRef = useRef<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // La conversación sobrevive al cierre del panel y a la recarga de la página.
  useEffect(() => {
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
    } catch {
      // Sin almacenamiento disponible el chat sigue funcionando en memoria.
    }
  }, [messages]);

  // Si el usuario cambia de idioma con el chat abierto, el saludo se re-localiza al instante
  // (antes quedaba congelado en el idioma en que se generó la primera vez).
  const welcomeText = tf('tutor.welcome', WELCOME_MESSAGE_ES);
  useEffect(() => {
    setMessages((prev) =>
      prev.some((m) => m.id === 'welcome' && m.text !== welcomeText)
        ? prev.map((m) => (m.id === 'welcome' ? { ...m, text: welcomeText } : m))
        : prev,
    );
  }, [welcomeText]);

  // Con la conversación avanzada, las sugerencias estorban: se pliegan solas.
  useEffect(() => {
    if (messages.length > 3) setShowSuggestions(false);
  }, [messages.length]);

  const handleClearHistory = () => {
    setMessages([buildWelcomeMessage(tf)]);
    setInputValue('');
    setShowSuggestions(true);
    try {
      window.localStorage.removeItem(HISTORY_KEY);
    } catch {
      // Sin almacenamiento disponible no hay nada que limpiar.
    }
  };

  const hasHistory = messages.length > 1;

  // Close on Escape for a cleaner keyboard experience
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  /**
   * Nombre corto del módulo activo, traducido al idioma de la interfaz. Solo
   * aplica dentro de un módulo concreto ('module'), nunca en 'all' ni en el panel.
   */
  const activeModuleItem = ECOSYSTEMS_LIST.find((e) => e.id === activeEcosystem);
  const focusedModuleLabel =
    viewMode === 'module' && activeEcosystem !== 'all' && activeModuleItem
      ? (() => {
          const key = `module.${activeEcosystem}.shortName`;
          const localized = t(key);
          // `t` devuelve la propia clave si el módulo aún no tiene traducción.
          return localized === key ? activeModuleItem.shortName : localized;
        })()
      : null;

  /** Apertura contextual del módulo (una sola vez por módulo) o null si no aplica. */
  const toneOpener = (): string | null => {
    if (!focusedModuleLabel) return null;
    if (toneTurnRef.current === activeEcosystem) return null;
    toneTurnRef.current = activeEcosystem;
    const variant = toneVariantRef.current % 2 === 0 ? 'tutor.moduleOpenerA' : 'tutor.moduleOpenerB';
    toneVariantRef.current += 1;
    return t(variant, { module: focusedModuleLabel });
  };

  const withTone = (body: string): string => {
    const opener = toneOpener();
    return opener ? `${opener}\n\n${body}` : body;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputValue('');
    setIsLoading(true);

    // "Pensado" mínimo del asistente: las preguntas breves se sienten naturales casi
    // al momento, pero las extensas aguardan hasta ~2 s para que el Tutor no parezca
    // un mensaje pregrabado. `since` marca el inicio y `hold()` completa lo que falte.
    const since = Date.now();
    const MIN_HOLD_MS = Math.min(2000, 650 + Math.max(0, query.length - 15) * 18);
    const hold = async () => {
      const rest = since + MIN_HOLD_MS - Date.now();
      if (rest > 0) await new Promise<void>((r) => setTimeout(r, rest));
    };

    const lowerQuery = query.toLowerCase();

    // Check if user is demanding unacademic homework solving
    const isDemandingWork =
      lowerQuery.includes('haz mi tesis') ||
      lowerQuery.includes('hazme la tesis') ||
      lowerQuery.includes('escribe mi') ||
      lowerQuery.includes('redacta mi') ||
      lowerQuery.includes('haz mi tarea') ||
      lowerQuery.includes('hazme el resumen') ||
      lowerQuery.includes('corrígeme toda mi tesis');

    if (isDemandingWork) {
      void (async () => {
        await hold();
        const rejectionMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: tf(
            'tutor.rejection',
            `⚠️ **Aviso de integridad académica institucional**

El asistente virtual tiene como propósito exclusivo orientar en teoría, estructura y normas metodológicas científicas. Por principios deontológicos, **no redacta tesis ni sustituye el trabajo intelectual del investigador**.

Si quieres que te ayuden con un tema en específico o con el desarrollo de tu proyecto, puedes escribir por WhatsApp desde la barra superior.`
          ),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, rejectionMsg]);
        setIsLoading(false);
      })();
      return;
    }

    // Cortesías (saludo, agradecimiento, despedida): las clasifica el mini-agente
    // (matchMetaKey), no ramas sueltas. El welcome ya mostró las herramientas al
    // abrir, así que aquí solo se responde cordial en el idioma activo. La
    // clasificación es a prueba de temas: "hola, qué es la matriz" deja de ser
    // saludo porque arrastra contenido, y cae al flujo de temas de abajo.
    const metaKey = matchMetaKey(lowerQuery);
    if (metaKey !== 'none') {
      const metaText: Record<string, string> = {
        greeting: tf('tutor.greeting', '¡Hola! 👋 ¿En qué parte de tu tesis o de la plataforma quieres que te oriente hoy?'),
        thanks: tf('tutor.thanks', '¡Con gusto! 😊 Aquí estoy para lo que necesites de tu tesis.'),
        farewell: tf('tutor.farewell', '¡Hasta pronto! 👋 Mucho éxito con tu titulación. Cuando quieras seguimos.'),
      };
      void (async () => {
        await hold();
        const metaMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: metaText[metaKey],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, metaMsg]);
        setIsLoading(false);
      })();
      return;
    }

    // Continuación conversacional: si la persona responde algo breve ("sí,
    // sigamos", "dale") sin introducir un tema nuevo, se retoma la última
    // intención en lugar de caer en "fuera de alcance". Si el último tema tiene
    // un siguiente paso en el flujo guiado (TOPIC_NEXT), se AVANZA a ese tema en
    // vez de repetir el mismo cuerpo (máquina de estados del proceso de tesis).
    const lastIntent = lastIntentRef.current;
    if (lastIntent && isLikelyContinuation(lowerQuery)) {
      if (lastIntent.startsWith('topic:')) {
        const topicKey = lastIntent.slice('topic:'.length);
        const nextKey = nextTopicKey(topicKey);
        const targetKey = nextKey ?? topicKey;
        void (async () => {
          await hold();
          const header = nextKey
            ? tf('tutor.stepAdvance', '¡Perfecto! Avanzamos al siguiente paso del proceso:')
            : tf('tutor.continueAck', '¡Claro! Retomamos donde íbamos:');
          const body = tf(`tutor.kb.${targetKey}`, KNOWLEDGE_RESPONSES_ES[targetKey]);
          // Sin CTA aquí: el usuario ya afirmó que continúa, así que preguntarle de
          // nuevo "¿siguiente paso?" es justo lo que sonaba a robot. Si quiere
          // avanzar otra vez, vuelve a decir "sí, sigamos" y la máquina de estados
          // seguirá (lastIntentRef ya apunta al paso alcanzado).
          const contMsg: Message = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: `${header}\n\n${body}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          lastIntentRef.current = nextKey ? `topic:${nextKey}` : `topic:${topicKey}`;
          setMessages((prev) => [...prev, contMsg]);
          setIsLoading(false);
        })();
        return;
      }
      // 'free' (IA del servidor) o 'system' (determinista): se deja pasar al
      // flujo normal; el servidor ahora reconoce la continuación por el historial.
    }

    // Motor determinista del sistema: las preguntas sobre hitos (Avance 1/2/3) y
    // el panorama de la plataforma se responden al instante y sin servidor, con
    // redacción rotativa para que nunca suene a mensaje grabado. Su contenido está
    // escrito en español, así que solo actúa en español; en otros idiomas se deja
    // pasar a la base de conocimiento localizada (tutor.kb.*), que sí está traducida.
    const platformReply = locale === 'es' ? platformKnowledgeIntent(lowerQuery) : null;
    if (platformReply) {
      void (async () => {
        await hold();
        const aiResponse: Message = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: withTone(platformReply),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        lastIntentRef.current = 'system';
        setMessages((prev) => [...prev, aiResponse]);
        setIsLoading(false);
      })();
      return;
    }

    // La base de conocimiento localizada corre ANTES que el servidor: los temas
    // curados (tutor.kb.*) se responden al instante y en el idioma activo, sin
    // depender de la red. El servidor solo se consulta abajo, para el texto libre
    // que la KB no reconoce.

    // Offline Knowledge Matcher → motor de intención (normalización + sinónimos).
    void (async () => {
      await hold();
      const matchedKey = matchTopicKey(lowerQuery);

      // Texto libre (sin tema curado): se consulta al servidor indicándole el
      // idioma activo, para que la IA responda en él. Si no hay servidor o falla,
      // se responde con el mensaje genérico localizado de la KB.
      if (matchedKey === 'default') {
        try {
          const response = await fetch('/api/ask-tutor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: query,
              conversationHistory: messages.slice(-4),
              locale,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.reply) {
              await hold();
              const serverReply: Message = {
                id: `ai-${Date.now()}`,
                sender: 'ai',
                text: withTone(data.reply),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };
              lastIntentRef.current = 'free';
              setMessages((prev) => [...prev, serverReply]);
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // Sin servidor disponible: cae al mensaje genérico localizado.
        }
      }

      const matchedResponse = tf(`tutor.kb.${matchedKey}`, KNOWLEDGE_RESPONSES_ES[matchedKey]);
      if (matchedKey !== 'default') lastIntentRef.current = `topic:${matchedKey}`;

      // CTA de flujo guiado: si el tema respondido tiene un siguiente paso en la
      // máquina de estados, se invita a continuar ("sí, sigamos" avanzará a él).
      const nextCta = nextTopicKey(matchedKey)
        ? `\n\n${tf('tutor.nextStepCta', '**¿Siguiente paso?** Responde "sí, sigamos" y avanzo en el proceso.')}`
        : '';

      const aiResponse: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `${withTone(matchedResponse)}${nextCta}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    })();
  };

  return (
    /* Compact assistant panel: docked bottom-right on desktop, centered card on mobile.
       It never spans the full viewport height, so it reads as a floating widget. */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:items-end sm:justify-end sm:p-6 sm:pb-24 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="surface rounded-3xl w-full max-w-xl overflow-hidden flex flex-col h-[82vh] max-h-[720px] sm:h-[min(calc(100dvh-7.5rem),680px)] bg-white shadow-2xl ring-1 ring-black/5">
        {/* Panel header */}
        <div className="relative flex items-start justify-between gap-3 px-4 py-4 bg-gradient-to-r from-[#001726] via-[#002B49] to-[#001726] text-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-11 h-11 rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
              <RobotFace className="w-5 h-5" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#002B49]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-black text-white tracking-tight truncate">
                {t('tutor.title')}
              </h3>
              <p className="text-[11px] text-blue-200 truncate">{t('tutor.subtitle')}</p>
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {tf('tutor.onlineStatus', 'En línea · respondo sobre toda la plataforma')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={handleClearHistory}
              disabled={!hasHistory}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title={t('tutor.clearHistory')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenWhatsApp();
              }}
              className="p-2 rounded-lg text-emerald-300 hover:text-white hover:bg-white/10 transition-colors"
              title={t('tutor.whatsapp')}
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title={t('tutor.close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat history */}
        <div className="flex-1 px-3.5 py-4 overflow-y-auto space-y-3.5 bg-slate-50 thin-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-[#002B49] text-amber-300 flex items-center justify-center shrink-0 mt-0.5 border border-amber-400/30">
                  <RobotFace className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-3 text-xs leading-relaxed shadow-xs break-words ${
                  msg.sender === 'user'
                    ? 'bg-[#002B49] text-white rounded-br-sm'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                }`}
              >
                {msg.sender === 'ai' ? (
                  <FormattedAcademicText content={msg.text} />
                ) : (
                  <div>{msg.text}</div>
                )}
                <div
                  className={`text-[10px] mt-1.5 text-right ${
                    msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-lg bg-[#002B49] text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
                <RobotFace className="w-3.5 h-3.5" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3.5 py-3 text-xs text-slate-500 flex items-center gap-2 shadow-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>{t('tutor.analyzing')}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Composer: quick chips + input grouped in a single block */}
        <div className="border-t border-slate-200 bg-white">
          {/* Sugerencias plegables. Antes eran una tira con scroll horizontal y los
              botones quedaban cortados en el borde; ahora envuelven en varias líneas. */}
          <div className="px-3.5 pt-2.5">
            <button
              onClick={() => setShowSuggestions((v) => !v)}
              className="w-full flex items-center justify-between gap-2 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
              aria-expanded={showSuggestions}
            >
              <span className="flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                {t('tutor.faq')}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${showSuggestions ? 'rotate-180' : ''}`}
              />
            </button>

            {showSuggestions && (
              <div className="mt-2 flex flex-wrap gap-1.5 max-h-[104px] overflow-y-auto scrollbar-none">
                {PRESET_QUESTIONS.map((q) => (
                  <button
                    key={q.key}
                    onClick={() => handleSendMessage(q.query)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-600 border-slate-200 text-[11px] font-semibold transition-all border text-left"
                  >
                    {t(`tutor.q.${q.key}`)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="px-3.5 pb-3.5 pt-1 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('tutor.placeholder')}
              className="field flex-1 min-w-0 rounded-xl px-3.5 py-2.5 text-xs"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="w-10 h-10 rounded-xl bg-[#002B49] hover:bg-[#001a2e] disabled:opacity-40 text-amber-300 flex items-center justify-center shadow-sm transition-all shrink-0"
              title={t('tutor.sendTitle')}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
