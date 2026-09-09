/**
 * Videoteca guiada.
 *
 * Cada tarjeta abre YouTube con una consulta de búsqueda curada en lugar de apuntar a
 * un video fijo. Se eligió este enfoque a propósito: los videos individuales se
 * eliminan, se vuelven privados o quedan obsoletos, y un enlace roto dentro de una
 * guía metodológica resta credibilidad. La consulta curada siempre devuelve el
 * material vigente sobre el tema exacto.
 */

export type VideoTrack = 'Estructura' | 'Metodología' | 'Literatura científica' | 'Herramientas' | 'Sustentación';

export interface VideoResource {
  id: string;
  track: VideoTrack;
  title: string;
  /** Qué vas a poder hacer después de ver el material. */
  outcome: string;
  /** Términos exactos con los que se abre la búsqueda en YouTube. */
  query: string;
  /** Momento del proceso en el que conviene verlo. */
  moment: string;
}

/**
 * Paleta por ruta. Cada ruta tiene su propio color para que la rejilla se lea de un
 * vistazo; antes todas las tarjetas eran rojas y el color no comunicaba nada.
 * Las clases se escriben completas porque Tailwind analiza el código fuente.
 */
export interface TrackTheme {
  /** Etiqueta de la ruta dentro de la tarjeta. */
  chip: string;
  /** Icono de reproducción. */
  icon: string;
  /** Punto de color usado en el filtro de rutas. */
  dot: string;
  /** Borde y fondo al pasar el cursor. */
  hover: string;
  /** Texto del enlace "Ver". */
  link: string;
  /** Título al pasar el cursor. */
  title: string;
}

export const TRACK_THEME: Record<VideoTrack, TrackTheme> = {
  Estructura: {
    chip: 'text-blue-700 bg-blue-100',
    icon: 'text-blue-500',
    dot: 'bg-blue-500',
    hover: 'hover:border-blue-400 hover:bg-blue-50/50',
    link: 'text-blue-700',
    title: 'group-hover:text-blue-800',
  },
  Metodología: {
    chip: 'text-emerald-700 bg-emerald-100',
    icon: 'text-emerald-500',
    dot: 'bg-emerald-500',
    hover: 'hover:border-emerald-400 hover:bg-emerald-50/50',
    link: 'text-emerald-700',
    title: 'group-hover:text-emerald-800',
  },
  'Literatura científica': {
    chip: 'text-indigo-700 bg-indigo-100',
    icon: 'text-indigo-500',
    dot: 'bg-indigo-500',
    hover: 'hover:border-indigo-400 hover:bg-indigo-50/50',
    link: 'text-indigo-700',
    title: 'group-hover:text-indigo-800',
  },
  Herramientas: {
    chip: 'text-violet-700 bg-violet-100',
    icon: 'text-violet-500',
    dot: 'bg-violet-500',
    hover: 'hover:border-violet-400 hover:bg-violet-50/50',
    link: 'text-violet-700',
    title: 'group-hover:text-violet-800',
  },
  Sustentación: {
    chip: 'text-orange-700 bg-orange-100',
    icon: 'text-orange-500',
    dot: 'bg-orange-500',
    hover: 'hover:border-orange-400 hover:bg-orange-50/50',
    link: 'text-orange-700',
    title: 'group-hover:text-orange-800',
  },
};

export const VIDEO_TRACKS: { id: VideoTrack; label: string; description: string }[] = [
  {
    id: 'Estructura',
    label: 'Estructura del documento',
    description: 'Cómo se arma el documento y qué va en cada capítulo.',
  },
  {
    id: 'Metodología',
    label: 'Metodología y diseño',
    description: 'Problema, objetivos, variables y marco metodológico.',
  },
  {
    id: 'Literatura científica',
    label: 'Revisión de literatura',
    description: 'Búsqueda, filtrado y organización de fuentes indexadas.',
  },
  {
    id: 'Herramientas',
    label: 'Herramientas',
    description: 'Zotero, gestores, análisis estadístico y antiplagio.',
  },
  {
    id: 'Sustentación',
    label: 'Sustentación',
    description: 'Preparación de la defensa y manejo de observaciones.',
  },
];

export const VIDEO_LIBRARY: VideoResource[] = [
  // --- Estructura ---
  {
    id: 'estructura-capitulos',
    track: 'Estructura',
    title: 'Los capítulos de una tesis explicados uno por uno',
    outcome: 'Identificar qué contenido corresponde a cada capítulo y dejar de mezclar marco teórico con resultados.',
    query: 'estructura de una tesis capitulo 1 2 3 4 5 explicacion completa',
    moment: 'Antes de escribir la primera página',
  },
  {
    id: 'estructura-estudio-caso',
    track: 'Estructura',
    title: 'Estudio de caso como modalidad de titulación',
    outcome: 'Entender en qué se diferencia un estudio de caso de una tesis tradicional y qué evidencias exige.',
    query: 'estudio de caso practico titulacion ingenieria como se estructura',
    moment: 'Al definir tu modalidad',
  },
  {
    id: 'estructura-resumen',
    track: 'Estructura',
    title: 'Cómo redactar el resumen y el abstract',
    outcome: 'Escribir un resumen de 150 a 250 palabras que declare problema, método, resultado y conclusión.',
    query: 'como redactar resumen y abstract de tesis 250 palabras',
    moment: 'Al final, cuando el documento ya está escrito',
  },
  {
    id: 'estructura-conclusiones',
    track: 'Estructura',
    title: 'Conclusiones y recomendaciones que responden a los objetivos',
    outcome: 'Redactar una conclusión por objetivo específico sin repetir el marco teórico.',
    query: 'como escribir conclusiones y recomendaciones de tesis segun objetivos',
    moment: 'Cierre del documento',
  },

  // --- Metodología ---
  {
    id: 'metodo-problema',
    track: 'Metodología',
    title: 'Planteamiento del problema con la técnica del embudo',
    outcome: 'Bajar del contexto internacional al caso concreto de tu institución sin perder el hilo.',
    query: 'planteamiento del problema tecnica del embudo macro meso micro tesis',
    moment: 'Capítulo 1',
  },
  {
    id: 'metodo-objetivos',
    track: 'Metodología',
    title: 'Objetivos de investigación con la taxonomía de Bloom',
    outcome: 'Formular un objetivo general y tres específicos con verbos en infinitivo y niveles distintos.',
    query: 'como formular objetivos generales y especificos taxonomia de bloom tesis',
    moment: 'Capítulo 1',
  },
  {
    id: 'metodo-matriz',
    track: 'Metodología',
    title: 'Matriz de consistencia paso a paso',
    outcome: 'Alinear problema, objetivos, hipótesis, variables e indicadores en una sola tabla.',
    query: 'matriz de consistencia tesis como se llena paso a paso ejemplo',
    moment: 'Antes de presentar el Avance 1',
  },
  {
    id: 'metodo-variables',
    track: 'Metodología',
    title: 'Operacionalización de variables',
    outcome: 'Descomponer cada variable en dimensiones, indicadores e ítems medibles.',
    query: 'operacionalizacion de variables dimensiones indicadores ejemplo tesis',
    moment: 'Capítulo 3',
  },
  {
    id: 'metodo-marco',
    track: 'Metodología',
    title: 'Marco teórico: cómo dialogar con los autores',
    outcome: 'Pasar de una lista de definiciones a una discusión crítica entre autores.',
    query: 'como redactar marco teorico tesis dialogo entre autores no copiar definiciones',
    moment: 'Capítulo 2',
  },
  {
    id: 'metodo-requerimientos',
    track: 'Metodología',
    title: 'Requerimientos funcionales y no funcionales (IEEE 830)',
    outcome: 'Documentar la matriz de requerimientos con código, descripción, prioridad y métrica verificable.',
    query: 'requerimientos funcionales y no funcionales IEEE 830 ejemplo software',
    moment: 'Análisis del caso',
  },

  // --- Literatura científica ---
  {
    id: 'lit-scopus',
    track: 'Literatura científica',
    title: 'Buscar en Scopus y filtrar por cuartiles',
    outcome: 'Recuperar artículos Q1 y Q2 de los últimos cinco años y descartar el resto desde el filtro.',
    query: 'como buscar articulos en Scopus filtros cuartiles Q1 Q2 tutorial',
    moment: 'Antes de escribir el marco teórico',
  },
  {
    id: 'lit-booleanos',
    track: 'Literatura científica',
    title: 'Ecuaciones booleanas: AND, OR, NOT y truncamiento',
    outcome: 'Construir ecuaciones con TITLE-ABS-KEY que devuelvan resultados manejables y pertinentes.',
    query: 'operadores booleanos AND OR NOT busqueda bases de datos cientificas tutorial',
    moment: 'Al iniciar la revisión de literatura',
  },
  {
    id: 'lit-scielo',
    track: 'Literatura científica',
    title: 'SciELO, Latindex y Redalyc para fuentes en español',
    outcome: 'Encontrar antecedentes nacionales y regionales cuando el tema tiene poca literatura en inglés.',
    query: 'como buscar articulos cientificos SciELO Redalyc Latindex tutorial',
    moment: 'Antecedentes nacionales',
  },
  {
    id: 'lit-mapas',
    track: 'Literatura científica',
    title: 'Connected Papers y VOSviewer para el estado del arte',
    outcome: 'Detectar los artículos seminales de tu tema y visualizar las redes de coautoría.',
    query: 'Connected Papers VOSviewer tutorial estado del arte revision bibliometrica',
    moment: 'Cuando no encuentras suficientes antecedentes',
  },
  {
    id: 'lit-sistematica',
    track: 'Literatura científica',
    title: 'Revisión sistemática y PRISMA',
    outcome: 'Aplicar criterios de inclusión y exclusión y documentar cuántas fuentes se descartaron y por qué.',
    query: 'revision sistematica de literatura PRISMA criterios inclusion exclusion tutorial',
    moment: 'Si tu trabajo exige mapeo sistemático',
  },

  // --- Herramientas ---
  {
    id: 'tool-zotero',
    track: 'Herramientas',
    title: 'Zotero 7 desde cero e integración con Word',
    outcome: 'Insertar citas con un atajo y generar la bibliografía en APA 7 sin corregir comas a mano.',
    query: 'Zotero 7 tutorial completo español integracion Word citas APA',
    moment: 'Antes de escribir la primera cita',
  },
  {
    id: 'tool-apa',
    track: 'Herramientas',
    title: 'Normas APA 7: citas, referencias y sangría francesa',
    outcome: 'Aplicar la regla del et al., las citas en bloque y el formato exacto de referencias.',
    query: 'normas APA 7 edicion citas y referencias tutorial completo español',
    moment: 'Durante toda la redacción',
  },
  {
    id: 'tool-word',
    track: 'Herramientas',
    title: 'Word académico: índice automático, estilos y numeración',
    outcome: 'Generar la tabla de contenido automática y numerar tablas y figuras con títulos vinculados.',
    query: 'Word tesis indice automatico estilos titulos numeracion tablas figuras tutorial',
    moment: 'Al armar el documento final',
  },
  {
    id: 'tool-turnitin',
    track: 'Herramientas',
    title: 'Parafraseo correcto y control de similitud',
    outcome: 'Reducir el porcentaje de coincidencia sin caer en el reemplazo mecánico de sinónimos.',
    query: 'como parafrasear correctamente tesis reducir similitud Turnitin sin plagio',
    moment: 'Antes de subir al sistema antiplagio',
  },
  {
    id: 'tool-estadistica',
    track: 'Herramientas',
    title: 'Jamovi y SPSS para el análisis de resultados',
    outcome: 'Ejecutar pruebas de normalidad, correlaciones y alfa de Cronbach e interpretar las salidas.',
    query: 'Jamovi SPSS tutorial español normalidad correlacion alfa de Cronbach tesis',
    moment: 'Capítulo 4',
  },
  {
    id: 'tool-ia-etica',
    track: 'Herramientas',
    title: 'Uso ético de IA en trabajos académicos',
    outcome: 'Saber en qué puedes apoyarte y qué constituye una falta académica al usar IA generativa.',
    query: 'uso etico de inteligencia artificial en tesis que si y que no citar IA',
    moment: 'Antes de usar cualquier IA',
  },

  // --- Sustentación ---
  {
    id: 'defensa-presentacion',
    track: 'Sustentación',
    title: 'Diapositivas de sustentación en 10 minutos',
    outcome: 'Distribuir el tiempo entre problema, método, resultados y conclusiones sin saturar las diapositivas.',
    query: 'como preparar diapositivas sustentacion de tesis 10 minutos estructura',
    moment: 'Dos semanas antes de la defensa',
  },
  {
    id: 'defensa-preguntas',
    track: 'Sustentación',
    title: 'Preguntas frecuentes en la defensa y cómo responderlas',
    outcome: 'Anticipar las preguntas sobre muestra, metodología y limitaciones con respuestas preparadas.',
    query: 'preguntas frecuentes defensa de tesis como responder sustentacion',
    moment: 'Antes de la defensa',
  },
  {
    id: 'defensa-observaciones',
    track: 'Sustentación',
    title: 'Cómo atender observaciones sin rehacer todo',
    outcome: 'Interpretar el comentario de fondo detrás de cada observación y priorizar las correcciones.',
    query: 'como corregir observaciones de tesis del tutor priorizar correcciones',
    moment: 'Después de cada revisión',
  },
];

/** Construye la URL de búsqueda de YouTube para un recurso. */
export function buildYoutubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
