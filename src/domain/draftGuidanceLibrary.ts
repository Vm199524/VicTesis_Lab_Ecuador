/**
 * draftGuidanceLibrary
 *
 * Texto de "cómo corregirlo" para cada hallazgo del revisor de borradores.
 *
 * IMPORTANTE: este módulo lo importa ÚNICAMENTE `server.ts`. No debe importarse desde
 * ningún componente de `src/components`, porque entonces Vite lo empaquetaría en el
 * bundle del navegador y cualquiera podría leer la guía completa desde las
 * herramientas de desarrollo. El cliente solo envía identificadores de hallazgo
 * (nunca el contenido del documento) y recibe de vuelta un número acotado de consejos.
 */

export const DRAFT_GUIDANCE: Record<string, string> = {
  'estructura-resumen':
    'Ubica el RESUMEN antes del ABSTRACT, en una página propia, con extensión de 150 a 250 palabras y cerrando con la línea "Palabras clave:".',
  'estructura-abstract':
    'El ABSTRACT es la traducción literal del RESUMEN al inglés y debe cerrar con "Keywords:". Tradúcelo del español ya corregido, nunca al revés.',
  'estructura-introduccion':
    'La Introducción abre el documento y se subdivide obligatoriamente en 1.1 Descripción, 1.2 Propósito del caso y 1.3 Base conceptual.',
  'estructura-descripcion':
    'Redacta la Descripción con la técnica del embudo: contexto macro (internacional), meso (nacional) y micro (la institución o empresa del caso), cerrando con las causas y efectos del problema.',
  'estructura-proposito':
    'El Propósito del caso contiene el objetivo general y los objetivos específicos, más el alcance de lo que sí y lo que no cubre el trabajo.',
  'estructura-base-conceptual':
    'La Base conceptual sostiene el trabajo con literatura indexada y debe cerrar con un cuadro comparativo que contraste tu propuesta frente a los antecedentes revisados.',
  'estructura-analisis-caso':
    'El Análisis del caso presenta las alternativas de solución evaluadas y la matriz de requerimientos que sustenta la decisión técnica.',
  'estructura-requerimientos':
    'Documenta los requerimientos siguiendo el estándar IEEE 830, separando funcionales (RF) y no funcionales (RNF) en tablas con código, descripción y prioridad.',
  'estructura-metodologia':
    'Nombra explícitamente la metodología de desarrollo, justifica por qué la elegiste para este caso y detalla sus fases o sprints con entregables verificables.',
  'estructura-diseno':
    'El Diseño debe declarar la arquitectura elegida y sustentarla con diagramas UML numerados, además del modelo de datos y su diccionario.',
  'estructura-desarrollo':
    'En Desarrollo se documentan las tecnologías con su versión, la estructura real del proyecto y la evidencia de las pruebas ejecutadas.',
  'estructura-conclusiones':
    'Redacta una conclusión por cada objetivo específico, en pasado y sin introducir información nueva ni repetir el marco teórico.',
  'estructura-recomendaciones':
    'Las Recomendaciones son acciones futuras concretas y viables derivadas de tus propias limitaciones, no deseos genéricos.',
  'estructura-referencias':
    'Las Referencias van en orden alfabético estricto, con sangría francesa y DOI activo cuando exista. Toda referencia debe estar citada en el texto.',
  'estructura-anexos':
    'Los Anexos numerados contienen cronograma, evidencias de tutoría, informe de originalidad y enlaces de respaldo del trabajo práctico.',
  'estructura-anexo-academico':
    'Este anexo institucional cruza cada asignatura de la carrera con su aporte concreto al trabajo, más los apartados de Innovación y Producto desarrollado.',
  'estructura-tabla-contenido':
    'Genera la Tabla de contenido con el paginado automático de Word aplicando estilos de título; nunca la escribas a mano.',
  'estructura-declaracion-autoria':
    'La Declaración de autoría incluye la bitácora fechada de tutorías con la evidencia de cada reunión y las firmas de los autores.',
  'resumen-corto':
    'Un resumen completo declara en este orden: problema, objetivo, metodología, tecnologías, resultado obtenido y conclusión. Escribe una o dos oraciones por cada elemento faltante.',
  'resumen-largo':
    'Elimina del resumen las citas, las justificaciones extensas y el detalle del marco teórico: solo van problema, objetivo, método, resultado y conclusión.',
  'palabras-clave':
    'Cierra el resumen con entre 4 y 6 palabras clave separadas por comas: deben ser descriptores reales de tus variables y tecnologías, no palabras del título.',
  'keywords':
    'Las keywords son la traducción técnica de tus palabras clave y deben coincidir una a una con la versión en español.',
  'objetivo-general-ausente':
    'Escribe el objetivo general con la fórmula: verbo en infinitivo + qué se va a hacer + para qué + en qué población y contexto. Debe ser uno solo y medible.',
  'objetivo-general-vacio':
    'Redáctalo en una sola oración, sin punto intermedio ni conjunciones que introduzcan un segundo propósito.',
  'objetivo-general-verbo':
    'Todo objetivo abre con un verbo taxonómico de Bloom en infinitivo (Determinar, Diseñar, Desarrollar, Evaluar, Implementar). Elimina frases previas como "El objetivo de este trabajo es".',
  'objetivo-general-incompleto':
    'Un objetivo general delimitado ronda las 25 a 35 palabras porque debe cerrar el "para qué" y la unidad de análisis. Si no dice dónde ni para quién, aún no está delimitado.',
  'objetivos-especificos-ausentes':
    'Necesitas 3 objetivos específicos secuenciales que, sumados, produzcan el objetivo general: uno diagnostica, uno diseña y uno construye o valida.',
  'objetivos-especificos-insuficientes':
    'Deben ser exactamente 3, cada uno con verbo en infinitivo distinto y en orden de ejecución. Si un objetivo no se puede evidenciar con un entregable del documento, no es un objetivo.',
  'objetivos-verbos-repetidos':
    'Repetir el verbo revela que dos objetivos miden lo mismo. Asigna un nivel cognitivo distinto a cada uno siguiendo la progresión de Bloom.',
  'alcance-ausente':
    'Declara explícitamente qué queda fuera del alcance. Es la sección que te protege cuando se cuestiona por qué no implementaste algún módulo.',
  'rf-ausentes':
    'Los requerimientos funcionales van en una tabla con cuatro columnas: ID, nombre del módulo, descripción de la función y prioridad. Sin codificación no hay trazabilidad hacia el diseño.',
  'rf-pocos':
    'Recorre cada rol del sistema y cada operación CRUD que ejecuta. Los requerimientos que casi siempre faltan son los de reportes, auditoría y control de acceso.',
  'rnf-ausentes':
    'Los no funcionales son atributos de calidad y cada uno necesita una métrica numérica verificable, no una promesa cualitativa.',
  'rnf-pocos':
    'Cubre los atributos que el formato espera: rendimiento, seguridad, disponibilidad, escalabilidad, usabilidad, mantenibilidad, portabilidad y compatibilidad.',
  'rf-sin-prioridad':
    'Clasifica cada requerimiento en Alta, Media o Baja. Esa columna es la que te permite justificar después por qué algunos quedaron como trabajo futuro.',
  'rf-sin-estandar':
    'Declara el estándar bajo el cual documentaste los requisitos. Es una línea que eleva la percepción de rigor sin trabajo adicional.',
  'alternativas-ausentes':
    'El análisis del caso exige comparar al menos tres alternativas con sus ventajas, desventajas y la decisión tomada. Sin ese cuadro, tu elección tecnológica queda sin sustento.',
  'metodologia-sin-nombre':
    'Nombra la metodología, cita al autor que la formaliza y explica por qué encaja con tu caso. Sin metodología nombrada el capítulo 3 no tiene sustento.',
  'metodologia-multiple':
    'Elige una metodología rectora y menciona las demás solo como alternativas descartadas. Mezclarlas sin jerarquía se lee como falta de decisión técnica.',
  'metodologia-sin-justificacion':
    'Justifica con tres razones ligadas a tu caso concreto: estabilidad de los requisitos, tamaño del equipo y necesidad de entregas parciales.',
  'metodologia-sin-fases':
    'Incluye una tabla de fases o sprints con período, duración y entregables. Es la evidencia de que el proyecto se planificó y no se improvisó.',
  'sin-cronograma':
    'Adjunta el cronograma como anexo y refiérelo desde la metodología. Debe coincidir con las fechas de tus reuniones de tutoría.',
  'sin-riesgos':
    'Una tabla breve de riesgo, impacto y mitigación aplicada. Documenta los problemas técnicos reales que enfrentaste: eso demuestra trabajo y no debilidad.',
  'sin-diagramas':
    'El diseño se sostiene en diagramas, no en prosa. El mínimo que se exige es casos de uso, secuencia y entidad-relación, cada uno con su interpretación escrita debajo.',
  'diagramas-insuficientes':
    'Cada diagrama debe responder una pregunta distinta: quién usa el sistema, cómo fluye una operación crítica y cómo se estructuran los datos.',
  'sin-arquitectura':
    'Declara el estilo arquitectónico, dibuja sus capas y explica qué responsabilidad tiene cada una. Es la primera pregunta técnica que recibirás en la sustentación.',
  'sin-diccionario':
    'Por cada tabla o colección: nombre del campo, tipo de dato, longitud, si es clave y su descripción funcional. Es lo que valida que el modelo se implementó de verdad.',
  'sin-pruebas':
    'Documenta una tabla con ID, módulo, caso, resultado esperado, resultado obtenido y estado. Sin pruebas el prototipo no está validado y ese es un motivo frecuente de observación.',
  'sin-versiones':
    'Presenta las tecnologías en tabla con nombre, versión y para qué sirve en tu proyecto. La versión es lo que hace reproducible tu trabajo.',
  'citas-insuficientes':
    'Toda afirmación que no sea un dato tuyo necesita cita. Prioriza citar en la descripción del problema, la base conceptual y la discusión: son las tres zonas que se revisan primero.',
  'referencias-ausentes':
    'Cada entrada abre con Apellido, Inicial., seguido del año en paréntesis, el título en cursiva y el DOI activo. Usa Zotero: escribirlas a mano garantiza inconsistencias.',
  'referencias-pocas':
    'Completa con artículos indexados en Scopus o SciELO de los últimos cinco años. Diez antecedentes bien elegidos (cinco internacionales y cinco nacionales) resuelven este punto.',
  'referencias-huerfanas':
    'Una referencia que no se cita en el cuerpo del texto debe eliminarse. Esa discrepancia es de las primeras que se detecta al revisar la bibliografía.',
  'referencias-desactualizadas':
    'Sustituye las fuentes antiguas por publicaciones recientes, salvo las obras seminales que definen un concepto. Filtra por año directamente en Scopus antes de leer.',
  'referencias-sin-doi':
    'Todo artículo científico tiene DOI y debe ir como hipervínculo activo https://doi.org/... Su ausencia sugiere que la fuente no es arbitrada.',
  'et-al-malformado':
    'La forma correcta es "et al." — sin punto después de "et" y con punto después de "al". Se usa desde la primera cita cuando hay tres o más autores.',
  'primera-persona':
    'La redacción científica es impersonal: "se desarrolló", "se implementó", "el sistema registra". Reemplaza cada ocurrencia por la forma con "se".',
  'tiempo-futuro':
    'El futuro solo cabe en las recomendaciones. Desarrollo, resultados y conclusiones van en pasado: si ya lo hiciste, escríbelo como hecho.',
  'oraciones-largas':
    'Divide cada oración larga en dos: una que afirma y otra que explica. Si necesitas releerla para entenderla, quien te evalúa tampoco la entenderá.',
  'sin-conectores':
    'Los conectores son los que dan continuidad argumentativa: "Asimismo", "No obstante", "En consecuencia", "Por consiguiente". Uno por párrafo es suficiente.',
  'lenguaje-coloquial':
    'Sustituye el intensificador por el dato: en lugar de "muy rápido", escribe "con un tiempo de respuesta menor a 2 segundos".',
  'sin-tablas':
    'Toda tabla lleva número, título descriptivo arriba y la fuente abajo, y debe citarse en el texto antes de aparecer ("ver Tabla 3").',
  'sin-figuras':
    'Numera cada figura y diagrama con su leyenda al pie. Una imagen sin número no se puede referenciar ni discutir en la sustentación.',
  'sin-fuente-tablas':
    'Debajo de cada tabla o figura escribe "Fuente: Elaboración propia" o la cita de origen. Omitirlo se interpreta como apropiación de material ajeno.',
  'errores-tipograficos':
    'Usa Buscar y reemplazar en Word: dos espacios por uno, y " ," por ",". Son los detalles que se marcan en rojo al primer vistazo.',
  'sin-originalidad':
    'El informe de originalidad va como anexo obligatorio. Genéralo antes de entregar: si el porcentaje sale alto, aún tienes tiempo de parafrasear.',
};

/** Consejos publicables para el estudiante: como máximo `limit` por consulta. */
export function getPublicGuidance(ids: string[], limit: number): Array<{ id: string; fix: string }> {
  return ids
    .filter((id) => typeof id === 'string' && id in DRAFT_GUIDANCE)
    .slice(0, limit)
    .map((id) => ({ id, fix: DRAFT_GUIDANCE[id] }));
}
