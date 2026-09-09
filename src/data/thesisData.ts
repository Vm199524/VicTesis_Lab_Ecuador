import { SlideItem, ChapterInfo, AcademicTool, BooleanOperatorSample } from '../types';

export const SLIDES_DATA: SlideItem[] = [
  {
    id: 1,
    tag: 'METODOLOGÍA & RIGOR CIENTÍFICO',
    title: 'Estructura y Rigor Metodológico en la Investigación de Titulación',
    subtitle: 'Fundamentos epistemológicos y procedimentales para la formulación y sustentación de tesis',
 description: 'La tesis de grado o posgrado constituye una investigación científica rigurosamente delimitada, orientada a responder interrogantes empíricas y teóricas mediante el método científico y la evidencia contrastable.',
    keyRule: 'La solvencia académica no radica en la profusión retórica, sino en la solidez metodológica, la consistencia lógica interna y la viabilidad operativa del proyecto.',
    bulletPoints: [
      {
        title: 'Fase 1: Viabilidad Epistémica y Operativa',
 description: 'El investigador debe constatar la disponibilidad empírica de la unidad de análisis y la existencia de literatura científica previa a la formulación definitiva del plan.',
        highlight: 'Tríada de Viabilidad'
      },
      {
        title: 'Fase 2: Consistencia Lógica Capitular',
 description: 'Se exige la alineación estricta entre la formulación del problema, la pregunta general, los objetivos específicos, las hipótesis y la contrastación empírica.',
        highlight: 'Matriz de Consistencia'
      },
      {
        title: 'Fase 3: Instrumentación y Normalización',
 description: 'La gestión documental se sistematiza mediante gestores bibliográficos automatizados y la recuperación bibliográfica se fundamenta en bases de datos indexadas.',
        highlight: 'Scopus & Zotero'
      }
    ],
 proTip: 'La investigación debe gestionarse con rigor de proyecto técnico: alcance delimitado, cronograma estructurado y entregables verificables en cada hito.',
    actionableResource: {
      label: 'Acceder a la Evaluación de Viabilidad',
      actionType: 'tool',
      targetId: 'feasibility-tool'
    }
  },
  {
    id: 2,
    tag: 'CAPÍTULO I • DELIMITACIÓN DEL PROBLEMA',
    title: 'Delimitación del Objeto de Estudio: Factibilidad y Viabilidad',
    subtitle: 'Criterios metodológicos para prevenir el estancamiento y abandono del proyecto de titulación',
 description: 'La mayor parte de los retrasos en las investigaciones de titulación obedece a la selección de poblaciones inaccesibles, variables difusas o escaso soporte bibliográfico contemporáneo.',
    keyRule: 'Si no se garantiza el acceso directo a la muestra o unidad de análisis en los plazos estipulados, el tema carece de viabilidad metodológica.',
    bulletPoints: [
      {
        title: 'Acceso Confirmado a la Unidad de Análisis',
 description: 'El investigador debe disponer de autorizaciones institucionales formales y convenios para la aplicación de instrumentos de medición.',
        highlight: 'Criterio de Acceso'
      },
      {
        title: 'Literatura Indexada Contemporánea (< 5 años)',
 description: 'Se requiere la existencia comprobable de al menos 15 a 20 artículos en Scopus, Web of Science o SciELO publicados en el último quinquenio.',
        highlight: 'Soporte Teórico'
      },
      {
        title: 'Relevancia y Contribución Práctica',
 description: 'El estudio debe aportar soluciones tangibles a problemáticas organizacionales, técnicas o conceptuales demostrables.',
        highlight: 'Impacto Científico'
      }
    ],
 proTip: 'Estructura sintáctica del título: [Variable Independiente] + [Conector de relación] + [Variable Dependiente] + en [Unidad de análisis / Población], [Contexto geográfico y temporal].',
    actionableResource: {
      label: 'Sintetizador de Título & Ecuación',
      actionType: 'tool',
      targetId: 'scopus-tool'
    }
  },
  {
    id: 3,
    tag: 'ESTRUCTURA & ARQUITECTURA',
    title: 'Estructura Lógica en Cascada: El Modelo de 5 Capítulos',
    subtitle: 'Coherencia interna y correspondencia biunívoca entre secciones de la tesis',
 description: 'Cada capítulo cumple una función epistemológica determinada dentro del método científico, articulándose en una secuencia de causa, fundamentación teórica, medición e inferencia.',
    keyRule: 'Cualquier modificación en la formulación del problema exige el ajuste correlativo inmediato en el objetivo general, las hipótesis y las conclusiones.',
    bulletPoints: [
      {
        title: 'Cap. I: El Problema de Investigación',
 description: 'Planteamiento contextualizado de lo general a lo específico (método deductivo del embudo), delimitación, formulación de preguntas y objetivos SMART.',
        highlight: 'Fundamento Ontológico'
      },
      {
        title: 'Cap. II: Marco Teórico & Estado del Arte',
 description: 'Revisión sistemática de literatura con antecedentes nacionales e internacionales indexados en cuartiles Q1/Q2 y bases conceptuales sólidas.',
        highlight: 'Sustentación Epistémica'
      },
      {
        title: 'Cap. III: Metodología & Diseño',
 description: 'Definición del enfoque (cuantitativo/cualitativo), diseño, cálculo probabilístico de la muestra, operacionalización y validación psicométrica de instrumentos.',
        highlight: 'Rigor Operativo'
      },
      {
        title: 'Cap. IV: Resultados & Análisis Estadístico',
 description: 'Procesamiento estadístico descriptivo e inferencial, verificación de normalidad y contrastación formal de hipótesis mediante pruebas paramétricas o no paramétricas.',
        highlight: 'Evidencia Empírica'
      },
      {
        title: 'Cap. V: Discusión & Conclusiones',
 description: 'Contrastación dialógica de los hallazgos frente a los antecedentes del Capítulo II, deducción de aportes teóricos, limitaciones y recomendaciones prácticas.',
        highlight: 'Inferencia Científica'
      }
    ],
 proTip: 'El marco teórico debe redactarse como una discusión analítica entre autores de referencia y nunca como una mera sucesión enciclopédica de definiciones.',
    actionableResource: {
      label: 'Explorar Arquitectura Capitular',
      actionType: 'tool',
      targetId: 'chapters-cascade'
    }
  },
  {
    id: 4,
    tag: 'INVESTIGACIÓN CIENTÍFICA INDEXADA',
    title: 'Búsqueda Científica en Scopus & WoS con Lógica Booleana',
    subtitle: 'Estrategias avanzadas para la recuperación de artículos en cuartiles de alto impacto (Q1/Q2)',
 description: 'Los repositorios científicos internacionales indexan mediante metadatos normalizados. La recuperación bibliográfica precisa exige la aplicación de operadores lógicos booleanos y descriptores controlados en inglés.',
    keyRule: 'Se deben evitar las búsquedas en lenguaje natural coloquial; la literatura científica se recupera mediante sintaxis estructurada con operadores booleanos.',
    bulletPoints: [
      {
        title: 'Operador AND (Intersección Obligatoria)',
 description: 'Vincula dos variables esenciales de investigación. Ejemplo: "Artificial Intelligence" AND "Customer Retention".',
        highlight: 'Intersección'
      },
      {
        title: 'Operador OR (Términos Sinónimos)',
 description: 'Amplía la exhaustividad agrupando descriptores equivalentes. Ejemplo: ("Telework" OR "Remote Work" OR "Home Office").',
        highlight: 'Exhaustividad'
      },
      {
        title: 'Comillas (" ") para Términos Compuestos',
 description: 'Fija la proximidad sintáctica de locuciones exactas. Ejemplo: "Supply Chain Management".',
        highlight: 'Precisión'
      },
      {
        title: 'Filtros Estratégicos de Scopus',
 description: 'Criterios de refinamiento: 1. "Open Access" (acceso abierto legal) • 2. "Subject Area" • 3. "Publication Year" (último quinquenio).',
        highlight: 'Criterios de Inclusión'
      }
    ],
 proTip: 'Dado que más del 85% de la producción científica indexada de impacto se publica en idioma inglés, se recomienda traducir los descriptores antes de formular la consulta.',
    actionableResource: {
      label: 'Generar Ecuación de Búsqueda',
      actionType: 'tool',
      targetId: 'scopus-tool'
    }
  },
  {
    id: 5,
    tag: 'NORMALIZACIÓN EDITORIAL',
    title: 'Normas APA 7ª Edición: Criterios de Citación y Referenciación',
    subtitle: 'Directrices internacionales para la uniformidad formal y la prevención de similitud académica',
 description: 'El cumplimiento estricto del Manual de Publicación APA (7ª ed.) garantiza la trazabilidad documental, previene observaciones del comité revisor y resguarda la integridad académica.',
    keyRule: 'Se prescribe el empleo de gestores bibliográficos automatizados desde el inicio de la investigación para garantizar la correspondencia exacta entre citas y referencias.',
    bulletPoints: [
      {
        title: 'Aplicación del et al. desde la Primera Cita',
 description: 'Para fuentes con tres o más autores, se adopta la fórmula abreviada (Apellido et al., Año) desde la primera mención en el texto.',
        highlight: 'Criterio APA 7'
      },
      {
        title: 'Supresión de Locuciones Obsoletas',
 description: 'Se prescinde de la mención "Recuperado de" y de la ciudad de edición; se incorpora directamente el enlace activo con prefijo https://doi.org/...',
        highlight: 'Estandarización DOI'
      },
      {
        title: 'Tipología de Citación en Texto',
 description: 'Citas narrativas y parentéticas; las citas textuales de menos de 40 palabras se incorporan entre comillas, mientras que las mayores a 40 palabras forman bloque con sangría.',
        highlight: 'Integridad Textual'
      },
      {
        title: 'Automatización mediante Gestor Zotero',
 description: 'Integración del complemento de citación en procesadores de texto, permitiendo la generación instantánea de la lista bibliográfica con sangría francesa.',
        highlight: 'Eficiencia Metodológica'
      }
    ],
 proTip: 'Toda referencia bibliográfica debe poseer su respectivo hipervínculo DOI activo y verificable. Zotero normaliza mayúsculas, cursivas y sangría francesa automáticamente.',
    actionableResource: {
      label: 'Consultar Guía APA 7 & Zotero',
      actionType: 'tool',
      targetId: 'apa-helper'
    }
  },
  {
    id: 6,
    tag: 'ECOSISTEMA TECNOLÓGICO',
    title: 'Ecosistema Digital de Soporte a la Investigación Científica',
    subtitle: 'Herramientas especializadas para el análisis bibliométrico, síntesis de literatura y redacción',
 description: 'La investigación académica contemporánea demanda el uso de tecnologías computacionales para el mapeo de redes de cocitación, gestión de literatura y refinamiento estilístico.',
    keyRule: 'Las herramientas computacionales y de inteligencia artificial deben emplearse estrictamente para la exploración bibliográfica y la corrección ortotipográfica, preservando siempre el juicio crítico y la autoría del investigador.',
    bulletPoints: [
      {
        title: 'Connected Papers',
 description: 'Permite ingresar el artículo seminal de la temática y genera un grafo interactivo de cocitación para identificar a los autores pioneros y publicaciones contemporáneas.',
        highlight: 'Mapeo Bibliométrico'
      },
      {
        title: 'Consensus.app & SciSpace',
 description: 'Motores de recuperación sustentados en modelos semánticos que extraen afirmaciones empíricas fundamentadas exclusivamente en artículos científicos revisados por pares.',
        highlight: 'Evidencia Contrastada'
      },
      {
        title: 'Zotero & Zotero Connector',
 description: 'Plataforma de código abierto para la captura directa de metadatos desde el navegador web y la inserción automatizada de citas en procesadores de texto.',
        highlight: 'Gestión Documental'
      },
      {
        title: 'DeepL Write',
 description: 'Asistente neuronal para la revisión de cohesión textual, precisión terminológica y adecuación estilística en manuscritos académicos.',
        highlight: 'Corrección Estilística'
      }
    ],
 proTip: 'Toda aseveración conceptual o empírica formulada en el manuscrito debe contar con el respaldo de una cita científica indexada o de datos procesados por el propio investigador.',
    actionableResource: {
      label: 'Explorar Catálogo de Herramientas',
      actionType: 'tool',
      targetId: 'digital-toolbox'
    }
  },
  {
    id: 7,
    tag: 'GESTIÓN DOCUMENTAL',
    title: 'Estructuración y Organización de Repositorios de Investigación',
    subtitle: 'Protocolo de nomenclatura, versionamiento y custodia de evidencias de titulación',
 description: 'Se recomienda establecer una arquitectura estandarizada de directorios en la estación de trabajo local antes de iniciar la redacción formal, asegurando la trazabilidad de los datos y documentos.',
    keyRule: 'Se debe mantener un control de versiones secuencial y respaldos sincronizados en la nube para salvaguardar la integridad de los avances de investigación.',
    bulletPoints: [
      {
        title: '1. ARTICULOS_CIENTIF_PDF',
 description: 'Repositorio exclusivo de literatura indexada con nomenclatura estandarizada: "PrimerAutor_Año_PalabraClave.pdf" para agilizar su catalogación en Zotero.',
        highlight: 'Corpus Bibliográfico'
      },
      {
        title: '2. AVANCES (Control de Versiones)',
 description: 'Alberga las entregas formales con codificación cronológica secuencial: Avance_1_v1.docx, Avance_1_Revision_Tutor.docx.',
        highlight: 'Historial de Cambios'
      },
      {
        title: '3. DATA_SCOPUS',
 description: 'Archivos de exportación CSV/RIS descargados de bases indexadas y el registro documental con la ecuación booleana empleada.',
        highlight: 'Evidencia Metodológica'
      },
      {
        title: '4. CODIGO_FUENTE & 5. FIGURAS',
 description: 'Custodia de scripts estadísticos, prototipos y gráficos vectoriales o diagramas en resolución apta para publicación (300 dpi).',
        highlight: 'Artefactos Técnicos'
      }
    ],
 proTip: 'Se recomienda sincronizar el directorio raíz del proyecto con plataformas de almacenamiento institucional (OneDrive o Google Workspace) para contar con respaldo continuo.',
    actionableResource: {
      label: 'Examinar Arquitectura de Carpetas',
      actionType: 'tool',
      targetId: 'desktop-simulator'
    }
  },
  {
    id: 8,
    tag: 'NORMATIVA INSTITUCIONAL',
    title: 'Estructura Metodológica y Requisitos del Avance 1',
    subtitle: 'Parámetros formales, matrices analíticas y coherencia de objetivos bajo la Taxonomía de Bloom',
 description: 'El Avance 1 evalúa la solidez del planteamiento del problema, la fundamentación bibliográfica preliminar y la pertinencia de los objetivos formulados bajo niveles cognitivos ascendentes.',
    keyRule: 'Los objetivos específicos deben articularse en orden secuencial de complejidad cognitiva: 1) Diagnosticar o analizar la situación actual, 2) Diseñar o modelar la propuesta técnica o conceptual, 3) Desarrollar o evaluar los resultados obtenidos.',
    bulletPoints: [
      {
        title: 'Certificaciones Requeridas',
 description: 'Dictamen de verificación de similitud textual (< 10%), certificación formal de aprobación emitida por el docente tutor y bitácora con sesiones de tutoría debidamente suscritas.',
        highlight: 'Validación Formal'
      },
      {
        title: '1.1 Planteamiento & Tabla 1',
 description: 'Estadísticas contextuales contemporáneas y Tabla 1 de matriz de diagnóstico causa-efecto vinculada a las variables del estudio.',
        highlight: 'Diagnóstico Empírico'
      },
      {
        title: '1.2 Propósito & Delimitación',
 description: 'Formulación del objetivo general y tres objetivos específicos SMART, acompañados de la Tabla 2 de delimitación del alcance.',
        highlight: 'Alcance Operativo'
      },
      {
        title: '1.3 Estado del Arte: Tablas 3, 4 y 5',
 description: 'Tabla 3 de alternativas técnicas, Tabla 4 comparativa de 10 a 14 artículos de Scopus (2021-2026) y Tabla 5 de justificación de impacto.',
        highlight: 'Revisión Sistemática'
      }
    ],
 proTip: 'Si necesitas ayuda para interpretar las observaciones de tu docente, el canal de consulta directa por WhatsApp está disponible (+593 98 597 6227).',
    actionableResource: {
      label: 'Consultar Plantilla de Avance 1',
      actionType: 'tool',
      targetId: 'avance-1-guide'
    }
  },
  {
    id: 9,
    tag: 'SINTAXIS BOOLEANA AVANZADA',
    title: 'Formulación Estructurada de Ecuaciones de Búsqueda Científica',
    subtitle: 'Metodología para la delimitación y recuperación de literatura de alto impacto en bases indexadas',
 description: 'La sintaxis booleana define las instrucciones lógicas interpretadas por los motores de indexación científica internacional (Scopus, Web of Science, IEEE Xplore).',
    keyRule: 'La combinación precisa de operadores booleanos AND/OR/NOT, delimitadores de proximidad y truncamientos optimiza la tasa de recuperación de documentos pertinentes.',
    bulletPoints: [
      {
        title: 'Operadores AND, OR, NOT',
 description: 'AND impone la concurrencia simultánea de conceptos. OR unifica descriptores afines. NOT excluye ramas temáticas divergentes.',
        highlight: 'Álgebra Booleana'
      },
      {
        title: 'Comillas (" ") y Truncamiento (*)',
 description: 'El uso de comillas preserva la secuencia textual exacta ("mobile application"), mientras que el asterisco recupera raíces flexivas (app* comprende app, apps, application, applications).',
        highlight: 'Control de Variantes'
      },
      {
        title: 'Delimitación por Campo TITLE-ABS-KEY',
 description: 'Restringe la búsqueda a título, resumen y palabras clave del autor, suprimiendo falsos positivos derivados del cuerpo secundario del texto.',
        highlight: 'Filtro Semántico'
      },
      {
        title: 'Criterios Temporales y de Acceso',
 description: 'Parámetros LIMIT-TO (PUBYEAR > 2021) y (OA, "all") para asegurar vigencia temporal de 5 años y acceso legítimo al texto completo.',
        highlight: 'Vigencia y Acceso'
      }
    ],
 proTip: 'Se aconseja validar la sintaxis de búsqueda en el sintetizador interactivo para constatar que el volumen de resultados sea analíticamente manejable.',
    actionableResource: {
      label: 'Acceder al Simulador de Ecuaciones',
      actionType: 'tool',
      targetId: 'boolean-deck'
    }
  }
];

export const CHAPTERS_DATA: ChapterInfo[] = [
  {
    number: '1',
    roman: 'Capítulo I',
    title: 'El Problema de Investigación',
    question: '¿Cuál es la problemática identificada, su justificación científica y los objetivos planteados?',
    purpose: 'Establece el fundamento ontológico y práctico de la investigación, delimitando con precisión el perímetro del objeto de estudio.',
    deliverables: [
      'Planteamiento del problema contextualizado (método deductivo del embudo: internacional → regional → local)',
      'Formulación precisa de la pregunta general y preguntas específicas de investigación',
      'Objetivo general y objetivos específicos estructurados según la Taxonomía de Bloom',
      'Justificación tripartita: Teórica (vacío en el conocimiento), Práctica (utilidad tangible), Metodológica (innovación instrumental)',
      'Delimitación espacial, temporal y conceptual de la investigación'
    ],
    keyMistake: 'Formulación de objetivos centrados en actividades operativas (e.g., "revisar bibliografía" o "aplicar cuestionarios"). Los objetivos de investigación deben expresar logros cognitivos: Determinar, Analizar, Evaluar, Establecer.',
    formulaOrTemplate: 'Objetivo General = [Verbo en infinitivo] + [Variable Independiente] + [Conector metodológico] + [Variable Dependiente] + en [Población / Unidad de estudio], [Contexto geográfico y temporal].',
    checklist: [
      '¿La pregunta general incorpora explícitamente las variables de estudio y la unidad de análisis?',
      '¿Los objetivos específicos se articulan de forma lógica y secuencial para dar cumplimiento al objetivo general?',
      '¿La justificación sustenta el impacto tangible en una organización, comunidad o disciplina científica?',
      '¿El planteamiento del problema se encuentra fundamentado en indicadores estadísticos o fuentes bibliográficas de respaldo?'
    ]
  },
  {
    number: '2',
    roman: 'Capítulo II',
    title: 'Marco Teórico & Estado del Arte',
    question: '¿Qué literatura científica previa fundamenta las variables y cuáles son las bases conceptuales?',
    purpose: 'Acredita el dominio del estado contemporáneo del conocimiento y sitúa la investigación en la frontera del desarrollo disciplinar.',
    deliverables: [
      'Antecedentes internacionales (3 a 5 artículos indexados en Scopus/WoS correspondientes al último quinquenio)',
      'Antecedentes nacionales o regionales (3 a 5 investigaciones o publicaciones arbitradas)',
      'Bases teóricas que fundamentan conceptualmente cada variable y dimensión del estudio',
      'Definición de términos básicos y glosario operativo',
      'Hipótesis general e hipótesis específicas (según el alcance correlacional o explicativo del estudio)'
    ],
    keyMistake: 'Yuxtaposición inconexa de resúmenes bibliográficos. Cada antecedente debe articularse mediante la fórmula: Autor (año) + Objetivo + Metodología y Muestra + Hallazgo principal + Contribución concreta a la presente investigación.',
    formulaOrTemplate: 'Estructura por Antecedente: "[Autor] ([Año]), en su investigación titulada [Título], analizó [Objetivo]. Empleando una muestra de [N participantes] y un diseño [Diseño], determinó que [Resultado principal]. Este estudio fundamenta la presente investigación al aportar [Contribución metodológica o teórica]."',
    checklist: [
      '¿Al menos el 70% de las fuentes referenciadas provienen de revistas científicas indexadas en bases reconocidas?',
      '¿Las fuentes bibliográficas corresponden al último quinquenio (salvo autores seminales o canónicos)?',
      '¿Se evidencia un análisis dialógico y crítico entre las teorías revisadas en lugar de un glosario lineal?',
      '¿Cada dimensión de las variables se encuentra respaldada por autores de referencia reconocidos?'
    ]
  },
  {
    number: '3',
    roman: 'Capítulo III',
    title: 'Metodología & Diseño de la Investigación',
    question: '¿Mediante qué procedimientos científicos se recolecta y procesa la evidencia de forma reproducible y válida?',
    purpose: 'Detalla el diseño metodológico estandarizado para permitir la reproducibilidad de las mediciones por parte de la comunidad científica.',
    deliverables: [
      'Enfoque de investigación (Cuantitativo, Cualitativo o Mixto)',
      'Alcance o nivel del estudio (Exploratorio, Descriptivo, Correlacional, Explicativo)',
      'Diseño de investigación (No experimental transeccional o experimental)',
      'Delimitación de la población censal o cálculo probabilístico de la muestra (nivel de confianza 95%, margen de error 5%)',
      'Matriz de operacionalización de variables (Variable → Definición conceptual → Dimensiones → Indicadores → Escala)',
      'Instrumento de recolección de datos (Cuestionario estructurado, guía de entrevista, matriz observacional)',
      'Validez de contenido (Juicio de 3 a 5 expertos) y Confiabilidad psicométrica (Alfa de Cronbach / Omega de McDonald > 0.80)'
    ],
    keyMistake: 'Omitir la justificación del tamaño de la muestra o no reportar los resultados de la prueba piloto de confiabilidad con carácter previo a la aplicación definitiva del instrumento.',
    formulaOrTemplate: 'Criterio Psicométrico de Confiabilidad: Si el coeficiente Alfa de Cronbach u Omega de McDonald es inferior a 0.70, el instrumento carece de consistencia interna y exige reformulación o depuración de reactivos.',
    checklist: [
      '¿La matriz de operacionalización vincula cada ítem del instrumento con su indicador correspondiente?',
      '¿Se explicita la fórmula de muestreo probabilístico o los criterios formales de selección no probabilística?',
      '¿Se describen los protocolos de consentimiento informado y consideraciones éticas?',
      '¿Se especifica el software estadístico o analítico a emplear (SPSS, R, Jamovi, SmartPLS)?'
    ]
  },
  {
    number: '4',
    roman: 'Capítulo IV',
    title: 'Resultados & Análisis Estadístico',
    question: '¿Qué evidencia empírica arrojan los datos procesados y cuál es el dictamen sobre las hipótesis?',
    purpose: 'Expone la evidencia empírica procesada con estricto rigor metodológico, prescindiendo de apreciaciones subjetivas no sustentadas.',
    deliverables: [
      'Análisis descriptivo sociodemográfico de la muestra (distribución de frecuencias y porcentajes)',
      'Análisis descriptivo por variables y dimensiones (medidas de tendencia central, dispersión y niveles)',
      'Prueba de bondad de ajuste y normalidad (Kolmogorov-Smirnov para N > 50, Shapiro-Wilk para N ≤ 50)',
      'Prueba de hipótesis paramétrica (Pearson, t de Student, ANOVA) o no paramétrica (Spearman, Wilcoxon, Chi-cuadrado)',
      'Tablas y figuras elaboradas bajo las directrices estrictas de formato APA 7'
    ],
    keyMistake: 'Reiterar en el texto descriptivo la totalidad de los guarismos consignados en las tablas. La redacción debe focalizarse en los hallazgos críticos: valores extremos, coeficientes y nivel de significancia estadística (p < 0.05).',
    formulaOrTemplate: 'Regla de Decisión Estadística: Si el p-valor (Significancia asintótica bilateral) es inferior a 0.05, se rechaza la hipótesis nula (H0) y se acepta la hipótesis alterna (H1) con un nivel de confianza del 95%.',
    checklist: [
      '¿Todas las tablas y figuras cuentan con numeración correlativa, título en cursiva y nota explicativa en formato APA 7?',
      '¿Se reporta la prueba de normalidad antes de la selección de las pruebas de correlación o comparación?',
      '¿Se explicitan los coeficientes estadísticos y sus respectivos niveles de significancia (p-valor)?',
      '¿Los resultados responden de manera directa y ordenada a cada uno de los objetivos específicos formulados?'
    ]
  },
  {
    number: '5',
    roman: 'Capítulo V',
    title: 'Discusión, Conclusiones & Recomendaciones',
    question: '¿Cuál es la interpretación científica de los hallazgos frente a la literatura y qué deducciones se derivan?',
    purpose: 'Constituye la síntesis analítica de la tesis, en la cual se contrastan los hallazgos empíricos frente al estado del arte documentado en el Capítulo II.',
    deliverables: [
      'Discusión crítica: Contrastación de cada resultado empírico frente a los antecedentes del Capítulo II (convergencias y divergencias)',
      'Conclusión general vinculada de forma estricta al objetivo general',
      'Conclusiones específicas en correspondencia biunívoca con cada objetivo específico',
      'Aportes teóricos, metodológicos y prácticos consolidados por la investigación',
      'Limitaciones metodológicas identificadas durante la ejecución del estudio',
      'Recomendaciones fundamentadas dirigidas a actores institucionales o a futuras líneas de investigación'
    ],
    keyMistake: 'Redactar las conclusiones como un resumen del marco teórico o una reiteración de cifras estadísticas. Las conclusiones deben formularse como deducciones conceptuales definitivas emanadas de los resultados.',
    formulaOrTemplate: 'Estructura del Párrafo de Discusión: El hallazgo empírico [Resultado] concuerda con lo reportado por [Autor (Año)], quien determinó que [Hallazgo antecedente]. Esta coincidencia se fundamenta en [Explicación teórica de la relación].',
    checklist: [
      '¿Cada conclusión responde de manera precisa a un objetivo específico formulado en el Capítulo I?',
      '¿La discusión dialoga explícitamente con los autores citados en el estado del arte del Capítulo II?',
      '¿Se explican las divergencias teóricas o metodológicas con base en argumentos científicos sólidos?',
      '¿Las recomendaciones se presentan como directrices accionables, viables y delimitadas?'
    ]
  }
];

export const ACADEMIC_TOOLS: AcademicTool[] = [
  {
    id: 'zotero',
 name: 'Zotero (Gestor Oficial APA 7)',
    category: 'Citas',
 badge: '¡Imprescindible para tu Tesis!',
 description: 'Software libre para organizar papers y generar citas automáticas. Se integra a Word y Google Docs con un solo clic. ¡Nunca más hagas referencias a mano!',
 keyBenefit: 'Inserta citas en el texto y genera tu bibliografía en formato APA 7 con sangría francesa perfecta al instante.',
 recommendedUse: 'Instálalo desde hoy con la extensión Zotero Connector en tu navegador. Si no usas Zotero, vas a perder horas valiosas corrigiendo comas y años.',
    url: 'https://www.zotero.org',
    pricing: 'Gratuito',
 proTip: 'Arrastra cualquier PDF a Zotero y extraerá automáticamente el autor, año, revista y DOI sin que escribas nada.'
  },
  {
    id: 'scopus',
 name: 'Scopus (Elsevier)',
    category: 'Busqueda',
 badge: 'La Joya de la Corona Q1/Q2',
 description: 'La base de datos científica más prestigiosa del mundo. Aquí encuentras papers indexados con revisión por pares, el respaldo más sólido para tus antecedentes.',
 keyBenefit: 'Garantiza que tus antecedentes tengan el máximo peso académico para aprobar tu defensa con honores.',
 recommendedUse: 'Entra con el correo institucional de tu universidad o desde su red académica para descargar los artículos completos.',
    url: 'https://www.scopus.com',
    pricing: 'Institucional',
 proTip: 'Usa el filtro "Open Access" para encontrar artículos completos y gratuitos listos para citar en tu Cap. 2.'
  },
  {
    id: 'connected-papers',
 name: 'Connected Papers',
    category: 'Busqueda',
 badge: 'Mapeo Visual de Papers',
 description: 'Ingresa un solo artículo clave de tu tema y Connected Papers te dibuja un mapa visual con todos los autores y papers relacionados en el mundo.',
 keyBenefit: 'Descubre en 5 minutos quiénes son los autores principales y qué artículos no pueden faltar en tu estado del arte.',
 recommendedUse: 'Úsalo en la fase inicial cuando sientas que no encuentras suficientes antecedentes sobre tus variables.',
    url: 'https://www.connectedpapers.com',
    pricing: 'Freemium',
 proTip: 'Revisa la sección "Prior Works" para ver las teorías base y "Derivative Works" para los últimos avances del año actual.'
  },
  {
    id: 'consensus-app',
 name: 'Consensus.app',
    category: 'Busqueda',
 badge: 'Buscador IA con Evidencia Real',
 description: 'Motor de búsqueda que responde tus preguntas de investigación sintetizando más de 200 millones de papers científicos reales (nada de alucinaciones).',
 keyBenefit: 'Te muestra el porcentaje de consenso entre científicos para sustentar tu problema y justificación con datos duros.',
 recommendedUse: 'Ideal para redactar la justificación y para discutir tus resultados con lo que dicen otros científicos.',
    url: 'https://consensus.app',
    pricing: 'Freemium',
 proTip: 'Hazle preguntas en inglés sobre la relación de tus variables (ej: "Does digital marketing improve sales in SMEs?").'
  },
  {
    id: 'deepl-write',
 name: 'DeepL Write',
    category: 'Redaccion',
 badge: 'Estilo Académico Impecable',
 description: 'Asistente de redacción basado en IA que mejora tu vocabulario técnico, elimina repeticiones y te ayuda a sonar como un auténtico investigador.',
 keyBenefit: 'Pule la fluidez de tus párrafos para que tu tutor o revisor lea tu tesis con agrado y sin trabas gramaticales.',
 recommendedUse: 'Pasa tus borradores por aquí antes de enviar cada entrega a tu tutor o subir al sistema antiplagio.',
    url: 'https://www.deepl.com/write',
    pricing: 'Gratuito',
 proTip: 'Haz clic sobre cualquier palabra para ver sinónimos formales más elegantes para tu redacción científica.'
  },
  {
    id: 'scispace',
 name: 'SciSpace (Typeset)',
    category: 'Analisis',
 badge: 'Lector Inteligente de PDFs',
 description: 'Sube un paper en inglés o español y chatea con él: pregúntale cuál fue la muestra, qué metodología usaron y cuáles fueron sus conclusiones.',
 keyBenefit: 'Lee papers 5 veces más rápido y extrae la información exacta que necesitas para tu matriz de antecedentes. ⏱',
 recommendedUse: 'Perfecto para cuando tengas que revisar 20 artículos y no dispongas de tiempo para leer cada página de introducción.',
    url: 'https://typeset.io',
    pricing: 'Freemium',
 proTip: 'Pídele: "Resume la muestra, el diseño metodológico y el resultado principal en 3 viñetas" para copiarlo a tu matriz.'
  }
];

export const BOOLEAN_SAMPLES: BooleanOperatorSample[] = [
  {
    field: 'Administración & Marketing',
    topic: 'Inteligencia Artificial y Fidelización de Clientes',
    equation: 'TITLE-ABS-KEY ( "Artificial Intelligence" AND ( "Customer Loyalty" OR "Customer Retention" ) ) AND ( LIMIT-TO ( PUBYEAR , 2024 ) OR LIMIT-TO ( PUBYEAR , 2023 ) OR LIMIT-TO ( PUBYEAR , 2022 ) )',
    explanation: 'Interseca el constructo principal de Inteligencia Artificial con descriptores afines de retención y lealtad, acotando a publicaciones indexadas recientes.'
  },
  {
    field: 'Recursos Humanos & Gestión Organizacional',
    topic: 'Teletrabajo y Compromiso Laboral (Engagement)',
    equation: 'TITLE-ABS-KEY ( ( "Telework" OR "Remote Work" OR "Work from Home" ) AND ( "Work Engagement" OR "Employee Engagement" ) ) AND ( LIMIT-TO ( OA , "all" ) )',
    explanation: 'Agrupa descriptores sinónimos de trabajo a distancia asociados al constructo de engagement, delimitando a fuentes en acceso abierto.'
  },
  {
    field: 'Tecnologías de la Información & Ciberseguridad',
    topic: 'Seguridad de la Información en el Sector Bancario',
    equation: 'TITLE-ABS-KEY ( ( "Cybersecurity" OR "Information Security" ) AND ( "Banking" OR "Financial Sector" ) AND NOT "Cryptocurrency" )',
    explanation: 'Excluye la literatura sobre criptoactivos para focalizar el análisis en la infraestructura de seguridad de la banca institucional.'
  },
  {
    field: 'Educación Superior & Pedagogía',
    topic: 'Tecnologías Educativas y Rendimiento Académico',
    equation: 'TITLE-ABS-KEY ( ( "Educational Technology" OR "Digital Tools" ) AND ( "Academic Performance" OR "Academic Achievement" ) AND "Higher Education" )',
    explanation: 'Delimita la población de estudio al nivel de educación superior e incorpora métricas estandarizadas de rendimiento académico.'
  }
];

export const WHATSAPP_TEMPLATES = [
  {
    id: 'formal-institutional',
    title: 'Difusión Académica Institucional (Recomendado)',
 badge: 'Rigor Profesional',
    content: `Estimados colegas e investigadores:

Se pone a disposición la presente **Plataforma Metodológica de Titulación e Investigación Científica**, desarrollada con el propósito de optimizar la formulación, coherencia estructural y rigor académico en proyectos de grado y posgrado:
Enlace: [LINK_DE_TU_PAGINA]

El entorno digital comprende:
• Evaluación diagnóstica de Viabilidad Metodológica (acceso a muestra, literatura indexada y relevancia).
• Arquitectura lógica de los 5 Capítulos en Cascada.
• Constructor interactivo de Ecuaciones Booleanas para Scopus y Web of Science.
• Manual de citación y referenciación según Normas APA (7ª ed.) y automatización con Zotero.

Para consultas metodológicas específicas o revisión de matrices de consistencia, se encuentra habilitado el canal de atención personalizada vía WhatsApp (+593 98 597 6227). Se agradece su difusión en la comunidad académica.`
  },
  {
    id: 'concise-bulletin',
    title: 'Comunicado Breve de Recursos Metodológicos',
 badge: 'Lectura Ejecutiva',
    content: `Estimada comunidad académica:

Se comparte este compendio interactivo de herramientas metodológicas diseñado para respaldar la estructuración de proyectos de titulación y tesis de investigación:
Enlace: [LINK_DE_TU_PAGINA]

Incluye directrices para el Avance 1, diagnóstico de viabilidad del problema, sintaxis booleana para recuperación de literatura Q1/Q2 y reglas actualizadas de citación APA 7.

Canal de orientación metodológica directa: +593 98 597 6227.`
  },
  {
    id: 'methodological-advisory',
    title: 'Soporte y Orientación Metodológica en Investigación',
 badge: 'Asesoría y Dictamen',
    content: `Estimados colegas y tesistas:

Con el objetivo de contribuir a la calidad científica y solvencia metodológica de las investigaciones de grado, se ha puesto en línea este entorno digital de apoyo técnico:
Enlace: [LINK_DE_TU_PAGINA]

Se recomienda evaluar la viabilidad del tema y contrastar la matriz de coherencia capitular antes de la presentación formal ante el comité evaluador. Consultas metodológicas directas al +593 98 597 6227.`
  }
];
