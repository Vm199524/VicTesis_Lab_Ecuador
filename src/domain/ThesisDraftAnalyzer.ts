/**
 * ThesisDraftAnalyzer
 *
 * Motor de diagnóstico automatizado para borradores de titulación (Avance 1 / Avance 2).
 * Evalúa ÚNICAMENTE la estructura formal y metodológica exigida por el formato de
 * titulación de las universidades del Ecuador: secciones obligatorias, formulación de objetivos, matriz de
 * requerimientos, metodología, diagramas, citación APA 7 y redacción académica.
 *
 * No almacena, transmite ni compara el contenido del documento con ningún corpus externo:
 * todo el análisis es determinista y se ejecuta sobre el texto en el navegador del usuario.
 */

export type FindingSeverity = 'critica' | 'alta' | 'media' | 'baja';

/**
 * Etapa de entrega del documento.
 *
 * Es la pieza central de la calificación: un Avance 1 no contiene desarrollo, pruebas
 * ni conclusiones, y evaluarlo contra el documento completo produce un puntaje
 * artificialmente bajo que no describe nada útil. Cada etapa define qué se exige,
 * cuánto pesa y qué se deja explícitamente para después.
 */
export type DraftStage = 'avance1' | 'avance2' | 'final';

export type FindingArea =
  | 'Estructura'
  | 'Resumen y abstract'
  | 'Objetivos'
  | 'Requerimientos'
  | 'Metodología'
  | 'Diseño y desarrollo'
  | 'Citas y referencias'
  | 'Redacción académica'
  | 'Formato editorial';

export interface DraftFinding {
  id: string;
  area: FindingArea;
  severity: FindingSeverity;
  /** Qué se detectó. Siempre visible. */
  title: string;
  /** Medición concreta que respalda el hallazgo. Siempre visible. */
  evidence: string;
}

export interface AreaScore {
  area: FindingArea;
  score: number;
  max: number;
  findings: number;
}

export interface SectionFlag {
  label: string;
  key: string;
  present: boolean;
  required: boolean;
  /** Etapa a partir de la cual el formato ya espera esta sección. */
  stage: DraftStage;
  /** Si la etapa evaluada ya debería incluirla. */
  expectedNow: boolean;
}

export interface DraftMetrics {
  words: number;
  characters: number;
  paragraphs: number;
  estimatedPages: number;
  inTextCitations: number;
  referenceEntries: number;
  functionalRequirements: number;
  nonFunctionalRequirements: number;
  specificObjectives: number;
  tables: number;
  figures: number;
  diagrams: number;
  recentReferenceRatio: number;
}

export interface DraftDiagnosis {
  /** Etapa contra la que se evaluó el documento. */
  stage: DraftStage;
  metrics: DraftMetrics;
  areas: AreaScore[];
  /** Hallazgos que sí cuentan para el puntaje de esta etapa. */
  findings: DraftFinding[];
  /** Detectados pero fuera del alcance de la etapa: se informan y NO penalizan. */
  deferred: DraftFinding[];
  sections: SectionFlag[];
  strengths: string[];
  score: number;
  level: string;
  levelHint: string;
  /** Secciones esperadas en esta etapa y cuántas ya están presentes. */
  sectionsExpected: number;
  sectionsPresent: number;
}

const AREA_WEIGHTS: Record<FindingArea, number> = {
  Estructura: 20,
  'Resumen y abstract': 8,
  Objetivos: 16,
  Requerimientos: 12,
  Metodología: 10,
  'Diseño y desarrollo': 12,
  'Citas y referencias': 14,
  'Redacción académica': 5,
  'Formato editorial': 3,
};

export interface StageProfile {
  id: DraftStage;
  label: string;
  shortLabel: string;
  /** Qué se está entregando en esta etapa, en una línea. */
  scope: string;
  /** Pesos renormalizados a 100 sobre las áreas que sí aplican. */
  weights: Partial<Record<FindingArea, number>>;
  /** Hallazgos que en esta etapa se informan pero no restan puntaje. */
  exempt: string[];
}

/**
 * Pesos por etapa. Suman 100 en cada caso: el puntaje siempre se lee sobre lo que
 * de verdad se exige en ese momento del proceso, no sobre el documento terminado.
 */
export const STAGE_PROFILES: Record<DraftStage, StageProfile> = {
  avance1: {
    id: 'avance1',
    label: 'Avance 1 — Introducción y planteamiento',
    shortLabel: 'Avance 1',
    scope: 'Capítulo 1 completo: descripción del caso, propósito, objetivos, alcance y base conceptual con sus fuentes.',
    weights: {
      Estructura: 30,
      Objetivos: 30,
      'Citas y referencias': 22,
      'Redacción académica': 12,
      'Formato editorial': 6,
    },
    exempt: ['referencias-pocas', 'sin-tablas', 'sin-figuras', 'sin-fuente-tablas', 'sin-originalidad'],
  },
  avance2: {
    id: 'avance2',
    label: 'Avance 2 — Análisis, metodología y diseño',
    shortLabel: 'Avance 2',
    scope: 'Todo lo del Avance 1 más el análisis del caso, la matriz de requerimientos, la metodología elegida y el diseño de la solución.',
    weights: {
      Estructura: 20,
      Objetivos: 18,
      Requerimientos: 16,
      'Metodología': 12,
      'Diseño y desarrollo': 12,
      'Citas y referencias': 14,
      'Redacción académica': 5,
      'Formato editorial': 3,
    },
    exempt: ['sin-pruebas', 'sin-versiones', 'sin-originalidad'],
  },
  final: {
    id: 'final',
    label: 'Documento completo — Versión de entrega',
    shortLabel: 'Documento completo',
    scope: 'El documento íntegro, incluidos resumen, abstract, desarrollo, pruebas, conclusiones, anexos y el informe de originalidad.',
    weights: {
      Estructura: 20,
      'Resumen y abstract': 8,
      Objetivos: 16,
      Requerimientos: 12,
      'Metodología': 10,
      'Diseño y desarrollo': 12,
      'Citas y referencias': 14,
      'Redacción académica': 5,
      'Formato editorial': 3,
    },
    exempt: [],
  },
};

const STAGE_ORDER: Record<DraftStage, number> = { avance1: 0, avance2: 1, final: 2 };

/** ¿La etapa evaluada ya alcanzó el momento en que se exige algo? */
function stageReached(required: DraftStage, current: DraftStage): boolean {
  return STAGE_ORDER[current] >= STAGE_ORDER[required];
}

const SEVERITY_PENALTY: Record<FindingSeverity, number> = {
  critica: 12,
  alta: 8,
  media: 4,
  baja: 2,
};

const SEVERITY_ORDER: Record<FindingSeverity, number> = {
  critica: 0,
  alta: 1,
  media: 2,
  baja: 3,
};

/** Verbos en infinitivo aceptados para objetivos según la taxonomía de Bloom. */
const BLOOM_VERBS = [
  'determinar', 'analizar', 'evaluar', 'disenar', 'desarrollar', 'implementar',
  'establecer', 'identificar', 'proponer', 'comparar', 'elaborar', 'validar',
  'caracterizar', 'describir', 'aplicar', 'construir', 'optimizar', 'automatizar',
  'sistematizar', 'medir', 'verificar', 'diagnosticar', 'formular', 'seleccionar',
  'clasificar', 'integrar', 'modelar', 'documentar', 'levantar', 'estructurar',
];

const METHODOLOGIES = [
  { key: 'scrum', label: 'Scrum' },
  { key: 'cascada', label: 'Cascada (Waterfall)' },
  { key: 'waterfall', label: 'Cascada (Waterfall)' },
  { key: 'incremental', label: 'Incremental' },
  { key: 'espiral', label: 'Espiral' },
  { key: 'kanban', label: 'Kanban' },
  { key: 'extreme programming', label: 'XP' },
  { key: 'programacion extrema', label: 'XP' },
  { key: 'rup', label: 'RUP' },
  { key: 'devops', label: 'DevOps' },
  { key: 'design thinking', label: 'Design Thinking' },
  { key: 'domain-driven', label: 'Domain-Driven Design' },
  { key: 'domain driven', label: 'Domain-Driven Design' },
];

const DIAGRAM_TYPES = [
  { key: 'casos de uso', label: 'Casos de uso' },
  { key: 'secuencia', label: 'Secuencia' },
  { key: 'entidad-relacion', label: 'Entidad-Relación' },
  { key: 'entidad relacion', label: 'Entidad-Relación' },
  { key: 'clases', label: 'Clases' },
  { key: 'arquitectura', label: 'Arquitectura' },
  { key: 'actividades', label: 'Actividades' },
  { key: 'estados', label: 'Estados' },
  { key: 'componentes', label: 'Componentes' },
  { key: 'despliegue', label: 'Despliegue' },
  { key: 'colaboracion', label: 'Colaboración' },
  { key: 'flujo', label: 'Flujo' },
];

const CONNECTORS = [
  'asimismo', 'por consiguiente', 'en consecuencia', 'sin embargo', 'no obstante',
  'por lo tanto', 'de igual forma', 'en este sentido', 'adicionalmente', 'finalmente',
  'en primer lugar', 'por otro lado', 'cabe senalar', 'de esta manera',
];

/** Quita acentos y pasa a minúsculas para hacer las búsquedas tolerantes a tildes. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function countMatches(text: string, pattern: RegExp): number {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

function uniqueCount(values: string[]): number {
  return new Set(values).size;
}

/**
 * Extrae las líneas que se comportan como encabezado: cortas, no vacías y sin
 * puntuación de párrafo al final. Evita falsos positivos al buscar secciones
 * cuyo nombre también aparece en la prosa (por ejemplo "desarrollo" o "diseño").
 */
function headingCandidates(lines: string[]): string[] {
  return lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line.length <= 140);
}

function analyzeStructure(
  headings: string[],
  normalizedText: string,
  stage: DraftStage
): { sections: SectionFlag[]; findings: DraftFinding[] } {
  const has = (pattern: RegExp) =>
    headings.some((line) => pattern.test(normalize(line))) || pattern.test(normalizedText);

  const definitions: Array<{
    label: string;
    key: string;
    /** Etapa a partir de la cual el formato ya espera esta sección. */
    stage: DraftStage;
    pattern: RegExp;
    required: boolean;
    severity: FindingSeverity;
  }> = [
    {
      label: 'RESUMEN',
      key: 'resumen',
      stage: 'final',
      pattern: /(^|\n|\s)resumen\b/,
      required: true,
      severity: 'critica',
    },
    {
      label: 'ABSTRACT',
      key: 'abstract',
      stage: 'final',
      pattern: /\babstract\b/,
      required: true,
      severity: 'critica',
    },
    {
      label: '1. Introducción',
      key: 'introduccion',
      stage: 'avance1',
      pattern: /introducci[oó]n/,
      required: true,
      severity: 'critica',
    },
    {
      label: '1.1 Descripción',
      key: 'descripcion',
      stage: 'avance1',
      pattern: /1\.?\s*1\s*descripci[oó]n|^descripci[oó]n$/,
      required: true,
      severity: 'alta',
    },
    {
      label: '1.2 Propósito del caso',
      key: 'proposito',
      stage: 'avance1',
      pattern: /prop[oó]sito del caso/,
      required: true,
      severity: 'alta',
    },
    {
      label: '1.3 Base conceptual',
      key: 'base-conceptual',
      stage: 'avance1',
      pattern: /base conceptual/,
      required: true,
      severity: 'alta',
    },
    {
      label: '2. Análisis del caso',
      key: 'analisis-caso',
      stage: 'avance2',
      pattern: /an[aá]lisis del caso/,
      required: true,
      severity: 'critica',
    },
    {
      label: '2.1 Requerimientos',
      key: 'requerimientos',
      stage: 'avance2',
      pattern: /requerimientos|requisitos/,
      required: true,
      severity: 'critica',
    },
    {
      label: '3.1 Metodología',
      key: 'metodologia',
      stage: 'avance2',
      pattern: /metodolog[ií]a/,
      required: true,
      severity: 'critica',
    },
    {
      label: '3.2 Diseño',
      key: 'diseno',
      stage: 'avance2',
      pattern: /3\.?\s*2\s*dise[nñ]o|^dise[nñ]o$/,
      required: true,
      severity: 'alta',
    },
    {
      label: '3.3 Desarrollo',
      key: 'desarrollo',
      stage: 'final',
      pattern: /3\.?\s*3\s*desarrollo|^desarrollo$/,
      required: true,
      severity: 'alta',
    },
    {
      label: '4. Conclusiones',
      key: 'conclusiones',
      stage: 'final',
      pattern: /conclusion(es)?\b/,
      required: true,
      severity: 'critica',
    },
    {
      label: 'Recomendaciones',
      key: 'recomendaciones',
      stage: 'final',
      pattern: /recomendaciones/,
      required: true,
      severity: 'alta',
    },
    {
      label: 'Referencias',
      key: 'referencias',
      stage: 'avance1',
      pattern: /referencias|bibliograf[ií]a/,
      required: true,
      severity: 'critica',
    },
    {
      label: 'Anexos',
      key: 'anexos',
      stage: 'final',
      pattern: /\banexos?\b/,
      required: true,
      severity: 'media',
    },
    {
      label: 'Anexo de información académica',
      key: 'anexo-academico',
      stage: 'final',
      pattern: /anexo de informaci[oó]n acad[eé]mica/,
      required: true,
      severity: 'alta',
    },
    {
      label: 'Tabla de contenido',
      key: 'tabla-contenido',
      stage: 'final',
      pattern: /tabla de contenido|[ií]ndice/,
      required: false,
      severity: 'media',
    },
    {
      label: 'Declaración de autoría',
      key: 'declaracion-autoria',
      stage: 'final',
      pattern: /declaraci[oó]n de autor[ií]a/,
      required: false,
      severity: 'media',
    },
  ];

  const sections: SectionFlag[] = [];
  const findings: DraftFinding[] = [];

  definitions.forEach((definition) => {
    const present = has(definition.pattern);
    const expectedNow = stageReached(definition.stage, stage);

    sections.push({
      label: definition.label,
      key: definition.key,
      present,
      required: definition.required,
      stage: definition.stage,
      expectedNow,
    });

    // Una sección que el formato todavía no pide en esta etapa no genera hallazgo:
    // marcarla como falta sería castigar al estudiante por ir en orden.
    if (!present && expectedNow) {
      findings.push({
        id: `estructura-${definition.key}`,
        area: 'Estructura',
        severity: definition.severity,
        title: `No se detecta la sección "${definition.label}"`,
        evidence: definition.required
          ? 'Es una sección obligatoria del formato de titulación y el documento no la declara como encabezado.'
          : 'Es una sección esperada en esta etapa del documento.',
      });
    }
  });

  return { sections, findings };
}

function analyzeAbstract(raw: string, normalizedText: string): DraftFinding[] {
  const findings: DraftFinding[] = [];

  const resumenStart = normalizedText.search(/(^|\n)\s*resumen\b/);
  const abstractStart = normalizedText.search(/(^|\n)\s*abstract\b/);

  if (resumenStart >= 0 && abstractStart > resumenStart) {
    const resumen = raw.slice(resumenStart, abstractStart);
    const resumenWords = resumen.split(/\s+/).filter(Boolean).length;

    if (resumenWords < 130) {
      findings.push({
        id: 'resumen-corto',
        area: 'Resumen y abstract',
        severity: 'media',
        title: 'El RESUMEN está por debajo de la extensión exigida',
        evidence: `Se contabilizaron aproximadamente ${resumenWords} palabras y el formato pide entre 150 y 250.`,
      });
    } else if (resumenWords > 320) {
      findings.push({
        id: 'resumen-largo',
        area: 'Resumen y abstract',
        severity: 'media',
        title: 'El RESUMEN excede la extensión exigida',
        evidence: `Se contabilizaron aproximadamente ${resumenWords} palabras y el máximo recomendado es 250.`,
      });
    }
  }

  if (!/palabras\s*clave|palabras\s*claves/.test(normalizedText)) {
    findings.push({
      id: 'palabras-clave',
      area: 'Resumen y abstract',
      severity: 'alta',
      title: 'No se detectan las palabras clave del estudio',
      evidence: 'No aparece la línea "Palabras clave:" al cierre del RESUMEN.',
    });
  }

  if (!/\bkeywords\b/.test(normalizedText)) {
    findings.push({
      id: 'keywords',
      area: 'Resumen y abstract',
      severity: 'media',
      title: 'No se detectan las keywords en inglés',
      evidence: 'No aparece la línea "Keywords:" al cierre del ABSTRACT.',
    });
  }

  return findings;
}

interface ObjectiveAnalysis {
  findings: DraftFinding[];
  specificObjectives: number;
}

function analyzeObjectives(lines: string[], normalizedText: string): ObjectiveAnalysis {
  const findings: DraftFinding[] = [];
  const trimmed = lines.map((line) => line.trim()).filter(Boolean);

  const generalIndex = trimmed.findIndex((line) => /objetivo\s+general/.test(normalize(line)));
  const specificIndex = trimmed.findIndex((line) =>
    /objetivos?\s+espec[ií]ficos?/.test(normalize(line))
  );

  const isHeadingLike = (line: string) => {
    const n = normalize(line);
    return (
      /^\d+(\.\d+)*\s/.test(line) ||
      /^(base conceptual|an[aá]lisis del caso|prop[oó]sito|metodolog[ií]a|dise[nñ]o|desarrollo|resumen|abstract)/.test(
        n
      )
    );
  };

  const stripBullet = (line: string) =>
    line.replace(/^[\s•·▪◦\-–—*✓>»]+/, '').replace(/^\d+[.)]\s*/, '').trim();

  const firstWord = (line: string) => normalize(stripBullet(line).split(/\s+/)[0] || '');

  const looksInfinitive = (word: string) =>
    BLOOM_VERBS.includes(word) || (word.length > 4 && /(ar|er|ir)$/.test(word));

  // --- Objetivo general ---
  if (generalIndex < 0) {
    findings.push({
      id: 'objetivo-general-ausente',
      area: 'Objetivos',
      severity: 'critica',
      title: 'No se identifica el objetivo general',
      evidence: 'No existe una línea que declare explícitamente "Objetivo general".',
    });
  } else {
    const sameLine = stripBullet(trimmed[generalIndex].replace(/objetivo\s+general\s*:?/i, ''));
    const generalText = sameLine.length > 12 ? sameLine : stripBullet(trimmed[generalIndex + 1] || '');
    const verb = firstWord(generalText);

    if (!generalText) {
      findings.push({
        id: 'objetivo-general-vacio',
        area: 'Objetivos',
        severity: 'alta',
        title: 'El objetivo general está declarado pero sin redacción',
        evidence: 'El encabezado "Objetivo general" no va seguido de un enunciado.',
      });
    } else if (!looksInfinitive(verb)) {
      findings.push({
        id: 'objetivo-general-verbo',
        area: 'Objetivos',
        severity: 'alta',
        title: 'El objetivo general no inicia con un verbo en infinitivo',
        evidence: `El enunciado comienza con "${verb || 'un término no verbal'}", lo que rompe la fórmula exigida.`,
      });
    }

    const wordCount = generalText.split(/\s+/).filter(Boolean).length;
    if (generalText && wordCount < 12) {
      findings.push({
        id: 'objetivo-general-incompleto',
        area: 'Objetivos',
        severity: 'media',
        title: 'El objetivo general parece incompleto',
        evidence: `Contiene ${wordCount} palabras, insuficientes para delimitar acción, propósito, población y contexto.`,
      });
    }
  }

  // --- Objetivos específicos ---
  let specificObjectives = 0;

  if (specificIndex < 0) {
    findings.push({
      id: 'objetivos-especificos-ausentes',
      area: 'Objetivos',
      severity: 'critica',
      title: 'No se identifican los objetivos específicos',
      evidence: 'No existe una línea que declare explícitamente "Objetivos específicos".',
    });
  } else {
    const collected: string[] = [];
    for (let i = specificIndex + 1; i < trimmed.length && collected.length < 12; i += 1) {
      const line = trimmed[i];
      if (isHeadingLike(line)) break;
      const candidate = stripBullet(line);
      if (candidate.length < 10) continue;
      collected.push(candidate);
    }

    const objectives = collected.filter((line) => looksInfinitive(firstWord(line)));
    specificObjectives = objectives.length;

    if (specificObjectives < 3) {
      findings.push({
        id: 'objetivos-especificos-insuficientes',
        area: 'Objetivos',
        severity: 'alta',
        title: 'Los objetivos específicos son insuficientes o no inician en infinitivo',
        evidence: `Se reconocieron ${specificObjectives} objetivos con verbo en infinitivo y el formato espera 3.`,
      });
    }

    const verbs = objectives.map((line) => firstWord(line));
    if (verbs.length >= 2 && uniqueCount(verbs) < verbs.length) {
      findings.push({
        id: 'objetivos-verbos-repetidos',
        area: 'Objetivos',
        severity: 'media',
        title: 'Hay verbos repetidos entre los objetivos específicos',
        evidence: `Se detectaron ${verbs.length} objetivos con solo ${uniqueCount(verbs)} verbos distintos.`,
      });
    }
  }

  if (!/alcance/.test(normalizedText)) {
    findings.push({
      id: 'alcance-ausente',
      area: 'Objetivos',
      severity: 'media',
      title: 'No se declara el alcance del trabajo',
      evidence: 'No aparece ninguna mención al alcance o delimitación de la propuesta.',
    });
  }

  return { findings, specificObjectives };
}

interface RequirementAnalysis {
  findings: DraftFinding[];
  functional: number;
  nonFunctional: number;
}

function analyzeRequirements(raw: string, normalizedText: string): RequirementAnalysis {
  const findings: DraftFinding[] = [];

  const rfCodes = raw.match(/\bRF\s?-?\s?\d{1,2}\b/gi) || [];
  const rnfCodes = raw.match(/\bRNF\s?-?\s?\d{1,2}\b/gi) || [];

  const functional = uniqueCount(rfCodes.map((code) => normalize(code).replace(/[\s-]/g, '')));
  const nonFunctional = uniqueCount(rnfCodes.map((code) => normalize(code).replace(/[\s-]/g, '')));

  if (functional === 0) {
    findings.push({
      id: 'rf-ausentes',
      area: 'Requerimientos',
      severity: 'critica',
      title: 'No se detecta la matriz de requerimientos funcionales',
      evidence: 'No se encontró ninguna codificación tipo RF-01, RF-02 en el documento.',
    });
  } else if (functional < 8) {
    findings.push({
      id: 'rf-pocos',
      area: 'Requerimientos',
      severity: 'media',
      title: 'La matriz de requerimientos funcionales parece corta',
      evidence: `Se identificaron ${functional} requerimientos funcionales; los trabajos aprobados suelen documentar entre 12 y 15.`,
    });
  }

  if (nonFunctional === 0) {
    findings.push({
      id: 'rnf-ausentes',
      area: 'Requerimientos',
      severity: 'critica',
      title: 'No se detecta la matriz de requerimientos no funcionales',
      evidence: 'No se encontró ninguna codificación tipo RNF-01 en el documento.',
    });
  } else if (nonFunctional < 5) {
    findings.push({
      id: 'rnf-pocos',
      area: 'Requerimientos',
      severity: 'media',
      title: 'Los requerimientos no funcionales están incompletos',
      evidence: `Se identificaron ${nonFunctional} requerimientos no funcionales y se esperan al menos 8 atributos de calidad.`,
    });
  }

  if (functional > 0 && !/prioridad/.test(normalizedText)) {
    findings.push({
      id: 'rf-sin-prioridad',
      area: 'Requerimientos',
      severity: 'media',
      title: 'Los requerimientos no declaran prioridad',
      evidence: 'La matriz de requerimientos no incluye una columna de prioridad.',
    });
  }

  if (functional > 0 && !/ieee\s?830/.test(normalizedText)) {
    findings.push({
      id: 'rf-sin-estandar',
      area: 'Requerimientos',
      severity: 'baja',
      title: 'No se declara el estándar de especificación de requisitos',
      evidence: 'No se menciona el estándar IEEE 830 ni otro marco equivalente.',
    });
  }

  if (!/alternativa/.test(normalizedText)) {
    findings.push({
      id: 'alternativas-ausentes',
      area: 'Requerimientos',
      severity: 'alta',
      title: 'No se documentan las alternativas de solución evaluadas',
      evidence: 'No aparece ninguna comparación de alternativas en el análisis del caso.',
    });
  }

  return { findings, functional, nonFunctional };
}

function analyzeMethodology(normalizedText: string): DraftFinding[] {
  const findings: DraftFinding[] = [];

  const detected = METHODOLOGIES.filter((item) => normalizedText.includes(item.key));
  const labels = uniqueCount(detected.map((item) => item.label));

  if (labels === 0) {
    findings.push({
      id: 'metodologia-sin-nombre',
      area: 'Metodología',
      severity: 'critica',
      title: 'No se declara una metodología de desarrollo reconocible',
      evidence: 'No se menciona Scrum, Cascada, Incremental, XP ni ningún otro marco de desarrollo.',
    });
  } else if (labels > 2) {
    findings.push({
      id: 'metodologia-multiple',
      area: 'Metodología',
      severity: 'media',
      title: 'Se mencionan varias metodologías sin definir la principal',
      evidence: `Se detectaron ${labels} marcos de desarrollo distintos en el texto.`,
    });
  }

  const hasJustification = /(se eligi[oó]|se seleccion[oó]|se opt[oó] por|justificaci[oó]n de (la|el) (uso|metodolog[ií]a)|se fundamenta)/.test(
    normalizedText
  );
  if (labels > 0 && !hasJustification) {
    findings.push({
      id: 'metodologia-sin-justificacion',
      area: 'Metodología',
      severity: 'alta',
      title: 'La metodología se nombra pero no se justifica',
      evidence: 'No se detecta un enunciado que explique por qué se eligió ese marco de trabajo.',
    });
  }

  const phaseMentions = countMatches(normalizedText, /\b(sprint|fase)\b/g);
  if (phaseMentions < 4) {
    findings.push({
      id: 'metodologia-sin-fases',
      area: 'Metodología',
      severity: 'alta',
      title: 'No se detalla la planificación por fases o sprints',
      evidence: `Solo se registran ${phaseMentions} menciones a fases o sprints en todo el documento.`,
    });
  }

  if (!/(cronograma|gantt)/.test(normalizedText)) {
    findings.push({
      id: 'sin-cronograma',
      area: 'Metodología',
      severity: 'media',
      title: 'No se evidencia el cronograma del proyecto',
      evidence: 'No se menciona cronograma ni diagrama de Gantt.',
    });
  }

  if (!/(riesgo)/.test(normalizedText)) {
    findings.push({
      id: 'sin-riesgos',
      area: 'Metodología',
      severity: 'baja',
      title: 'No se documenta la gestión de riesgos',
      evidence: 'No aparece ninguna referencia a riesgos del proyecto.',
    });
  }

  return findings;
}

interface DesignAnalysis {
  findings: DraftFinding[];
  diagrams: number;
}

function analyzeDesign(normalizedText: string): DesignAnalysis {
  const findings: DraftFinding[] = [];

  const detected = DIAGRAM_TYPES.filter(
    (item) =>
      normalizedText.includes(`diagrama de ${item.key}`) ||
      normalizedText.includes(`diagrama ${item.key}`) ||
      normalizedText.includes(`modelo ${item.key}`)
  );
  const diagrams = uniqueCount(detected.map((item) => item.label));

  if (diagrams === 0) {
    findings.push({
      id: 'sin-diagramas',
      area: 'Diseño y desarrollo',
      severity: 'critica',
      title: 'No se detectan diagramas de diseño',
      evidence: 'No se referencia ningún diagrama UML ni modelo de datos en el documento.',
    });
  } else if (diagrams < 3) {
    findings.push({
      id: 'diagramas-insuficientes',
      area: 'Diseño y desarrollo',
      severity: 'alta',
      title: 'La cobertura de diagramas es insuficiente',
      evidence: `Se identificaron ${diagrams} tipos de diagrama y el formato espera al menos 3 vistas complementarias.`,
    });
  }

  const hasArchitecture = /(arquitectura (de|del) (software|sistema)|tres capas|n-capas|microservicio|cliente-servidor|mvc|monol[ií]tic)/.test(
    normalizedText
  );
  if (!hasArchitecture) {
    findings.push({
      id: 'sin-arquitectura',
      area: 'Diseño y desarrollo',
      severity: 'alta',
      title: 'No se declara la arquitectura del sistema',
      evidence: 'No se menciona ningún estilo arquitectónico (capas, MVC, cliente-servidor, microservicios).',
    });
  }

  if (!/diccionario de datos/.test(normalizedText)) {
    findings.push({
      id: 'sin-diccionario',
      area: 'Diseño y desarrollo',
      severity: 'media',
      title: 'No se incluye el diccionario de datos',
      evidence: 'No aparece la sección de diccionario de datos junto al modelo entidad-relación.',
    });
  }

  const hasTests = /(caso de prueba|casos de prueba|pruebas (unitarias|funcionales|de integraci[oó]n|de aceptaci[oó]n)|caja negra|\bcp-?\d)/.test(
    normalizedText
  );
  if (!hasTests) {
    findings.push({
      id: 'sin-pruebas',
      area: 'Diseño y desarrollo',
      severity: 'critica',
      title: 'No se evidencian pruebas del sistema',
      evidence: 'No se detecta ninguna tabla de casos de prueba ni mención a pruebas ejecutadas.',
    });
  }

  const hasVersions = countMatches(normalizedText, /\b\d+\.\d+(\.\d+)?\b/g) >= 4;
  if (!hasVersions) {
    findings.push({
      id: 'sin-versiones',
      area: 'Diseño y desarrollo',
      severity: 'baja',
      title: 'Las tecnologías no declaran versión',
      evidence: 'Se detectan pocas o ninguna referencia a versiones de las herramientas empleadas.',
    });
  }

  return { findings, diagrams };
}

interface ReferenceAnalysis {
  findings: DraftFinding[];
  citations: number;
  references: number;
  recentRatio: number;
}

function analyzeReferences(raw: string, normalizedText: string): ReferenceAnalysis {
  const findings: DraftFinding[] = [];
  const currentYear = new Date().getFullYear();

  const parenthetical =
    raw.match(/\([^()]{3,90},\s*(19|20)\d{2}[a-z]?\s*\)/g) || [];
  const narrative =
    raw.match(/[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ'’-]+(?:\s+(?:et\s+al\.?|y\s+[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ'’-]+))?\s*\((19|20)\d{2}[a-z]?\)/g) ||
    [];
  const citations = parenthetical.length + narrative.length;

  const referenceEntries =
    raw.match(/[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ'’-]+,\s*[A-ZÁÉÍÓÚÑ]\.[^\n]{0,200}\((19|20)\d{2}[a-z]?\)/g) ||
    [];
  const references = referenceEntries.length;

  const years = (raw.match(/\((19|20)\d{2}[a-z]?\)/g) || [])
    .map((token) => parseInt(token.replace(/[^\d]/g, ''), 10))
    .filter((year) => year >= 1990 && year <= currentYear + 1);

  const recent = years.filter((year) => year >= currentYear - 5).length;
  const recentRatio = years.length > 0 ? recent / years.length : 0;

  if (citations < 10) {
    findings.push({
      id: 'citas-insuficientes',
      area: 'Citas y referencias',
      severity: 'critica',
      title: 'El documento tiene muy pocas citas en el texto',
      evidence: `Se reconocieron ${citations} citas con formato (Autor, año) o Autor (año); un trabajo sustentado supera las 25.`,
    });
  }

  if (references === 0) {
    findings.push({
      id: 'referencias-ausentes',
      area: 'Citas y referencias',
      severity: 'critica',
      title: 'No se reconoce una lista de referencias en formato APA',
      evidence: 'No se detectaron entradas con el patrón "Apellido, N. (año)." propio de APA 7.',
    });
  } else if (references < 15) {
    findings.push({
      id: 'referencias-pocas',
      area: 'Citas y referencias',
      severity: 'alta',
      title: 'La lista de referencias es corta para un estudio de caso',
      evidence: `Se reconocieron ${references} entradas y los trabajos aprobados suelen presentar entre 17 y 25.`,
    });
  }

  if (citations > 0 && references > 0 && citations < references) {
    findings.push({
      id: 'referencias-huerfanas',
      area: 'Citas y referencias',
      severity: 'alta',
      title: 'Hay más referencias listadas que citas en el texto',
      evidence: `Se contabilizaron ${citations} citas frente a ${references} entradas en la lista de referencias.`,
    });
  }

  if (years.length >= 5 && recentRatio < 0.6) {
    findings.push({
      id: 'referencias-desactualizadas',
      area: 'Citas y referencias',
      severity: 'alta',
      title: 'La bibliografía está desactualizada',
      evidence: `Solo el ${Math.round(recentRatio * 100)}% de las fuentes es de los últimos 5 años y se exige un mínimo del 70%.`,
    });
  }

  const doiCount = countMatches(normalizedText, /doi\.org|doi:/g);
  if (references >= 5 && doiCount < Math.ceil(references * 0.3)) {
    findings.push({
      id: 'referencias-sin-doi',
      area: 'Citas y referencias',
      severity: 'media',
      title: 'Faltan identificadores DOI en las referencias',
      evidence: `Se detectaron ${doiCount} identificadores DOI para ${references} referencias.`,
    });
  }

  if (/et\.\s*al|\bet als?\b(?!\.)/i.test(raw)) {
    findings.push({
      id: 'et-al-malformado',
      area: 'Citas y referencias',
      severity: 'baja',
      title: 'La abreviatura "et al." está mal escrita',
      evidence: 'Se detectaron variantes como "et. al" o "et al" sin punto final.',
    });
  }

  return { findings, citations, references, recentRatio };
}

function analyzeWriting(raw: string, normalizedText: string): DraftFinding[] {
  const findings: DraftFinding[] = [];

  const firstPerson = countMatches(
    normalizedText,
    /\b(yo|nosotros|hicimos|realizamos|hemos hecho|nuestro|nuestra|nuestros|nuestras|creo que|pienso que|mi trabajo|mi proyecto)\b/g
  );
  if (firstPerson > 3) {
    findings.push({
      id: 'primera-persona',
      area: 'Redacción académica',
      severity: 'media',
      title: 'El documento usa primera persona',
      evidence: `Se detectaron ${firstPerson} expresiones en primera persona ("nuestro", "realizamos", "creo que").`,
    });
  }

  const futureTense = countMatches(
    normalizedText,
    /\b(se (desarrollar[aá]|implementar[aá]|dise[nñ]ar[aá]|realizar[aá]|construir[aá])|permitir[aá]|contribuir[aá]|garantizar[aá]|incluir[aá])\b/g
  );
  if (futureTense > 5) {
    findings.push({
      id: 'tiempo-futuro',
      area: 'Redacción académica',
      severity: 'alta',
      title: 'Hay secciones redactadas en tiempo futuro',
      evidence: `Se detectaron ${futureTense} verbos en futuro ("se desarrollará", "permitirá") en un documento que reporta trabajo ya ejecutado.`,
    });
  }

  const sentences = raw.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  const longSentences = sentences.filter((s) => s.split(/\s+/).length > 45).length;
  if (longSentences > 5) {
    findings.push({
      id: 'oraciones-largas',
      area: 'Redacción académica',
      severity: 'media',
      title: 'Hay oraciones excesivamente largas',
      evidence: `Se detectaron ${longSentences} oraciones de más de 45 palabras.`,
    });
  }

  const connectors = CONNECTORS.filter((connector) => normalizedText.includes(connector)).length;
  if (connectors < 4) {
    findings.push({
      id: 'sin-conectores',
      area: 'Redacción académica',
      severity: 'baja',
      title: 'El texto usa pocos conectores lógicos',
      evidence: `Solo se identificaron ${connectors} conectores académicos distintos en todo el documento.`,
    });
  }

  const colloquial = countMatches(normalizedText, /\b(muy|bastante|cosas|obviamente|un poco|algo as[ií]|etc\.)/g);
  if (colloquial > 12) {
    findings.push({
      id: 'lenguaje-coloquial',
      area: 'Redacción académica',
      severity: 'baja',
      title: 'Se detecta lenguaje coloquial o impreciso',
      evidence: `Se contabilizaron ${colloquial} expresiones vagas ("muy", "bastante", "cosas", "etc.").`,
    });
  }

  return findings;
}

interface FormatAnalysis {
  findings: DraftFinding[];
  tables: number;
  figures: number;
}

function analyzeFormat(raw: string, normalizedText: string): FormatAnalysis {
  const findings: DraftFinding[] = [];

  const tables = uniqueCount(
    (raw.match(/\bTabla\s+\d{1,2}\b/gi) || []).map((token) => normalize(token))
  );
  const figures = uniqueCount(
    (raw.match(/\b(Figura|Ilustraci[oó]n)\s+\d{1,2}\b/gi) || []).map((token) => normalize(token))
  );

  if (tables === 0) {
    findings.push({
      id: 'sin-tablas',
      area: 'Formato editorial',
      severity: 'media',
      title: 'No se detectan tablas numeradas',
      evidence: 'No aparece ninguna referencia con el formato "Tabla 1", "Tabla 2".',
    });
  }

  if (figures === 0) {
    findings.push({
      id: 'sin-figuras',
      area: 'Formato editorial',
      severity: 'media',
      title: 'No se detectan figuras numeradas',
      evidence: 'No aparece ninguna referencia con el formato "Figura 1" o "Ilustración 1".',
    });
  }

  if ((tables > 0 || figures > 0) && !/(fuente:|elaborado por|elaboraci[oó]n propia)/.test(normalizedText)) {
    findings.push({
      id: 'sin-fuente-tablas',
      area: 'Formato editorial',
      severity: 'media',
      title: 'Las tablas y figuras no declaran su fuente',
      evidence: 'No se encontró la línea "Fuente:" ni "Elaborado por" junto a los elementos gráficos.',
    });
  }

  const doubleSpaces = countMatches(raw, /[^\S\n]{2,}/g);
  const spaceBeforePunct = countMatches(raw, /\s+[,;.](?=\s|$)/g);
  if (doubleSpaces > 25 || spaceBeforePunct > 8) {
    findings.push({
      id: 'errores-tipograficos',
      area: 'Formato editorial',
      severity: 'baja',
      title: 'Hay errores tipográficos de espaciado',
      evidence: `Se detectaron ${doubleSpaces} espacios dobles y ${spaceBeforePunct} espacios antes de un signo de puntuación.`,
    });
  }

  if (!/(originalidad|antiplagio|anti-plagio|turnitin|similitud)/.test(normalizedText)) {
    findings.push({
      id: 'sin-originalidad',
      area: 'Formato editorial',
      severity: 'media',
      title: 'No se evidencia el informe de originalidad',
      evidence: 'No se menciona el informe de similitud, antiplagio ni Turnitin.',
    });
  }

  return { findings, tables, figures };
}

function buildStrengths(
  metrics: DraftMetrics,
  sections: SectionFlag[],
  stage: DraftStage
): string[] {
  const strengths: string[] = [];
  const expected = sections.filter((s) => s.expectedNow);
  const presentExpected = expected.filter((s) => s.present).length;
  const stageName = STAGE_PROFILES[stage].shortLabel;

  if (expected.length > 0 && presentExpected >= Math.ceil(expected.length * 0.7)) {
    strengths.push(
      `La arquitectura va bien encaminada: ${presentExpected} de ${expected.length} secciones que exige el ${stageName} ya están presentes.`
    );
  }

  // Reconocer el trabajo adelantado motiva más que señalar solo lo que falta.
  const aheadOfSchedule = sections.filter((s) => !s.expectedNow && s.present).length;
  if (aheadOfSchedule >= 2) {
    strengths.push(
      `Vas adelantado: ya escribiste ${aheadOfSchedule} secciones que ni siquiera se te exigen todavía en esta etapa.`
    );
  }
  if (metrics.functionalRequirements >= 10) {
    strengths.push(
      `La matriz de requerimientos funcionales tiene buena cobertura (${metrics.functionalRequirements} requerimientos codificados).`
    );
  }
  if (metrics.referenceEntries >= 15) {
    strengths.push(
      `El respaldo bibliográfico es sólido (${metrics.referenceEntries} referencias reconocidas en formato APA).`
    );
  }
  if (metrics.recentReferenceRatio >= 0.7) {
    strengths.push(
      `La bibliografía está vigente: el ${Math.round(metrics.recentReferenceRatio * 100)}% de las fuentes es de los últimos 5 años.`
    );
  }
  if (metrics.diagrams >= 3) {
    strengths.push(`El diseño se sustenta en ${metrics.diagrams} tipos de diagrama distintos.`);
  }
  if (metrics.tables >= 5 && metrics.figures >= 5) {
    strengths.push(
      `El aparato gráfico está bien construido (${metrics.tables} tablas y ${metrics.figures} figuras numeradas).`
    );
  }
  if (metrics.specificObjectives === 3) {
    strengths.push('Los tres objetivos específicos están correctamente formulados en infinitivo.');
  }

  return strengths;
}

function resolveLevel(score: number, stage: DraftStage): { level: string; hint: string } {
  const stageName = STAGE_PROFILES[stage].shortLabel;

  if (score >= 85) {
    return {
      level: 'En forma para entregar',
      hint: `Tu ${stageName} cumple lo que el formato pide en esta etapa. Lo que queda son ajustes de precisión.`,
    };
  }
  if (score >= 70) {
    return {
      level: 'Bien encaminado',
      hint: `La base de tu ${stageName} está bien planteada. Hay puntos concretos por cerrar, ninguno de fondo.`,
    };
  }
  if (score >= 50) {
    return {
      level: 'En construcción',
      hint: `Tu ${stageName} ya tiene cuerpo, pero faltan piezas que el formato exige en esta etapa. Es un punto normal para seguir trabajando.`,
    };
  }
  return {
    level: 'Etapa inicial',
    hint: `Tu ${stageName} está empezando. Trabaja primero el esqueleto de secciones: es lo que más mueve el resultado.`,
  };
}

/** Punto de entrada: recibe el texto del borrador y la etapa, y devuelve el diagnóstico. */
export function analyzeThesisDraft(text: string, stage: DraftStage = 'final'): DraftDiagnosis {
  const profile = STAGE_PROFILES[stage];
  const raw = text.replace(/\r\n/g, '\n');
  const normalizedText = normalize(raw);
  const lines = raw.split('\n');
  const headings = headingCandidates(lines);

  const words = raw.split(/\s+/).filter(Boolean).length;
  const paragraphs = raw.split(/\n{2,}/).filter((block) => block.trim().length > 80).length;

  const structure = analyzeStructure(headings, normalizedText, stage);
  const abstract = analyzeAbstract(raw, normalizedText);
  const objectives = analyzeObjectives(lines, normalizedText);
  const requirements = analyzeRequirements(raw, normalizedText);
  const methodology = analyzeMethodology(normalizedText);
  const design = analyzeDesign(normalizedText);
  const references = analyzeReferences(raw, normalizedText);
  const writing = analyzeWriting(raw, normalizedText);
  const format = analyzeFormat(raw, normalizedText);

  const allFindings = [
    ...structure.findings,
    ...abstract,
    ...objectives.findings,
    ...requirements.findings,
    ...methodology,
    ...design.findings,
    ...references.findings,
    ...writing,
    ...format.findings,
  ].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  // Un hallazgo cuenta solo si su área se evalúa en esta etapa y no está exceptuado.
  // El resto se conserva aparte: se informa como "todavía no aplica", nunca como falta.
  const inScope = (finding: DraftFinding) =>
    profile.weights[finding.area] !== undefined && !profile.exempt.includes(finding.id);

  const findings = allFindings.filter(inScope);
  const deferred = allFindings.filter((finding) => !inScope(finding));

  const metrics: DraftMetrics = {
    words,
    characters: raw.length,
    paragraphs,
    estimatedPages: Math.max(1, Math.round(words / 320)),
    inTextCitations: references.citations,
    referenceEntries: references.references,
    functionalRequirements: requirements.functional,
    nonFunctionalRequirements: requirements.nonFunctional,
    specificObjectives: objectives.specificObjectives,
    tables: format.tables,
    figures: format.figures,
    diagrams: design.diagrams,
    recentReferenceRatio: references.recentRatio,
  };

  const areas: AreaScore[] = (Object.keys(profile.weights) as FindingArea[]).map((area) => {
    const areaFindings = findings.filter((finding) => finding.area === area);
    const penalty = areaFindings.reduce(
      (total, finding) => total + SEVERITY_PENALTY[finding.severity],
      0
    );
    const max = profile.weights[area] as number;
    const ratio = Math.max(0, 1 - penalty / (max + 8));
    return {
      area,
      max,
      score: Math.round(max * ratio * 10) / 10,
      findings: areaFindings.length,
    };
  });

  const score = Math.round(areas.reduce((total, area) => total + area.score, 0));
  const { level, hint } = resolveLevel(score, stage);

  const expectedSections = structure.sections.filter((section) => section.expectedNow);

  return {
    stage,
    metrics,
    areas,
    findings,
    deferred,
    sections: structure.sections,
    strengths: buildStrengths(metrics, structure.sections, stage),
    score,
    level,
    levelHint: hint,
    sectionsExpected: expectedSections.length,
    sectionsPresent: expectedSections.filter((section) => section.present).length,
  };
}

export const SEVERITY_LABEL: Record<FindingSeverity, string> = {
  critica: 'Crítica',
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};
