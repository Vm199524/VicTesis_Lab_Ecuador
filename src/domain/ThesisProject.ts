/**
 * Modelo de dominio: ThesisProject
 *
 * Representa un proyecto de titulación universitaria en Ecuador y encapsula la
 * generación en cascada (título → pregunta → objetivo general → objetivos
 * específicos → hipótesis o criterio de validación) y la evaluación de
 * viabilidad.
 *
 * Por qué hay cinco enfoques y no una plantilla única
 * ---------------------------------------------------
 * Un título de titulación no se escribe igual en Software que en Enfermería,
 * Administración o Agropecuaria. Redactarlos todos como «X y su incidencia en Y»
 * produce títulos que ningún tribunal de ingeniería aprueba, y al revés: un
 * título de artefacto no tiene sentido en un estudio de prevalencia. Cada
 * enfoque define su propia plantilla de título, su pregunta, sus objetivos
 * específicos y —esto es lo que más devoluciones evita— el tipo de enunciado
 * final que le corresponde: hipótesis contrastable en unos, criterio de
 * validación o de aceptación en otros.
 *
 * Los cinco slots son deliberadamente genéricos (`subject`, `qualifier`,
 * `target`, `scope`, `context`): cada enfoque los reetiqueta para su disciplina,
 * de modo que añadir una familia nueva no obliga a tocar la interfaz.
 */

import { FeasibilityReport } from './FeasibilityReport';

export type ResearchApproach =
  | 'technological'
  | 'proposal'
  | 'correlational'
  | 'diagnostic'
  | 'experimental';

/** Los cinco componentes que alimentan cualquier plantilla de título. */
export interface TitleSlots {
  subject: string;
  qualifier: string;
  target: string;
  scope: string;
  context: string;
}

interface FieldSpec {
  label: string;
  hint: string;
  placeholder: string;
  /** Si existe, el campo se presenta como lista cerrada. */
  options?: string[];
  /** Un campo opcional no penaliza la revisión de forma si va vacío. */
  optional?: boolean;
}

export interface ApproachSpec {
  id: ResearchApproach;
  label: string;
  /** Qué produce el proyecto, en una línea. */
  summary: string;
  /** Carreras donde esta familia es la habitual. */
  careers: string;
  /** Estructura del título, para mostrarla como guía. */
  pattern: string;
  fields: {
    subject: FieldSpec;
    qualifier: FieldSpec;
    target: FieldSpec;
    scope: FieldSpec;
  };
  claimLabel: string;
  /** El título debe nombrar un producto entregable. */
  expectsArtifact: boolean;
  sample: TitleSlots;
  buildTitle: (s: TitleSlots) => string;
  buildQuestion: (s: TitleSlots) => string;
  buildObjective: (s: TitleSlots) => string;
  buildSpecifics: (s: TitleSlots) => string[];
  buildClaim: (s: TitleSlots) => string;
}

const withContext = (context: string, prefix = ' ') => (context ? `${prefix}${context}` : '');
const lower = (value: string) => (value ? value.charAt(0).toLowerCase() + value.slice(1) : value);

/**
 * Catálogo de enfoques.
 *
 * Los ejemplos son inventados y de dominios variados: sirven para enseñar la
 * forma, no para que nadie los copie tal cual.
 */
export const APPROACHES: Record<ResearchApproach, ApproachSpec> = {
  /* ------------------------------------------------------------------ */
  technological: {
    id: 'technological',
    label: 'Desarrollo tecnológico',
    summary: 'Entregas un artefacto que resuelve un proceso concreto.',
    careers: 'Software · TI · Sistemas · Redes · Industrial · Mecatrónica · Diseño',
    pattern: 'ARTEFACTO + rasgo técnico + PARA + FUNCIÓN + EN + DOMINIO + ÁMBITO',
    fields: {
      subject: {
        label: 'Artefacto (qué vas a entregar)',
        hint: 'Nombra el producto, no la intención: prototipo, sistema, aplicación, arquitectura, modelo, módulo.',
        placeholder: 'Ej: Prototipo de sistema web',
      },
      qualifier: {
        label: 'Rasgo técnico distintivo',
        hint: 'Lo que separa tu propuesta de cualquier otra igual: tecnología base, restricción de diseño o método.',
        placeholder: 'Ej: basado en microservicios / ligero / con panel administrativo',
        optional: true,
      },
      target: {
        label: 'Función o proceso que resuelve',
        hint: 'El verbo del negocio: gestión, trazabilidad, monitoreo, detección temprana, asignación.',
        placeholder: 'Ej: la gestión y trazabilidad del inventario perecible',
      },
      scope: {
        label: 'Dominio de aplicación',
        hint: 'Sector y tipo de organización. De aquí sale tu muestra y tu literatura.',
        placeholder: 'Ej: microempresas de distribución de alimentos',
      },
    },
    claimLabel: 'Criterio de validación',
    expectsArtifact: true,
    sample: {
      subject: 'Prototipo de sistema web',
      qualifier: 'con módulo de alertas automáticas',
      target: 'la gestión y trazabilidad del inventario perecible',
      scope: 'microempresas de distribución de alimentos',
      context: 'del Ecuador, 2026',
    },
    buildTitle: (s) =>
      `${s.subject || '[Artefacto]'}${s.qualifier ? ` ${s.qualifier}` : ''} para ${s.target || '[función que resuelve]'}${s.scope ? ` en ${s.scope}` : ''}${withContext(s.context)}`,
    buildQuestion: (s) =>
      `¿Cómo diseñar, construir y validar un ${lower(s.subject) || 'artefacto'}${s.qualifier ? ` ${s.qualifier}` : ''} que mejore ${s.target || 'el proceso identificado'}${s.scope ? ` en ${s.scope}` : ''}${withContext(s.context)}?`,
    buildObjective: (s) =>
      `Desarrollar un ${lower(s.subject) || 'artefacto'}${s.qualifier ? ` ${s.qualifier}` : ''} para ${s.target || 'el proceso identificado'}${s.scope ? ` en ${s.scope}` : ''}${withContext(s.context)}, validando su funcionamiento con usuarios reales del proceso.`,
    buildSpecifics: (s) => [
      `Diagnosticar cómo se ejecuta hoy ${s.target || 'el proceso'} en ${s.scope || 'la organización de estudio'}, levantando requisitos funcionales y no funcionales con los usuarios.`,
      `Diseñar la arquitectura y el modelo de datos del ${lower(s.subject) || 'artefacto'}, justificando las decisiones técnicas frente a alternativas.`,
      `Implementar el ${lower(s.subject) || 'artefacto'} con las funcionalidades priorizadas en el diagnóstico.`,
      `Validar el ${lower(s.subject) || 'artefacto'} con usuarios reales mediante pruebas funcionales y métricas de uso, contrastando el resultado con la situación inicial.`,
    ],
    buildClaim: (s) =>
      `El ${lower(s.subject) || 'artefacto'} se considerará válido si cubre los requisitos priorizados, supera las pruebas funcionales definidas y reduce de forma medible el tiempo o los errores de ${s.target || 'el proceso'} frente a la situación inicial documentada en el diagnóstico.`,
  },

  /* ------------------------------------------------------------------ */
  proposal: {
    id: 'proposal',
    label: 'Propuesta de intervención',
    summary: 'Entregas un plan, modelo o estrategia aplicable a una organización.',
    careers: 'Administración · Contabilidad · Marketing · Turismo · Educación · Comunicación',
    pattern: 'PROPUESTA + PARA + PROBLEMA A RESOLVER + EN + ORGANIZACIÓN + ÁMBITO',
    fields: {
      subject: {
        label: 'Propuesta (qué vas a entregar)',
        hint: 'Plan, modelo, manual, estrategia, programa o sistema de gestión. Debe ser algo aplicable, no una opinión.',
        placeholder: 'Ej: Plan de mejora de procesos',
      },
      qualifier: {
        label: 'Enfoque o metodología base',
        hint: 'La metodología que sostiene la propuesta y la vuelve defendible.',
        placeholder: 'Ej: basado en la metodología Lean / bajo el enfoque de Balanced Scorecard',
        optional: true,
      },
      target: {
        label: 'Problema que resuelve',
        hint: 'El problema concreto y medible que la propuesta viene a corregir.',
        placeholder: 'Ej: la reducción de tiempos de atención al cliente',
      },
      scope: {
        label: 'Organización o sector',
        hint: 'Dónde se aplica. Cuanto más concreto, más defendible el alcance.',
        placeholder: 'Ej: cooperativas de ahorro y crédito del segmento 4',
      },
    },
    claimLabel: 'Criterio de aceptación de la propuesta',
    expectsArtifact: true,
    sample: {
      subject: 'Plan de mejora de procesos',
      qualifier: 'basado en la metodología Lean',
      target: 'la reducción de tiempos de atención al cliente',
      scope: 'cooperativas de ahorro y crédito del segmento 4',
      context: 'de la provincia del Azuay, 2026',
    },
    buildTitle: (s) =>
      `${s.subject || '[Propuesta]'}${s.qualifier ? ` ${s.qualifier}` : ''} para ${s.target || '[problema que resuelve]'}${s.scope ? ` en ${s.scope}` : ''}${withContext(s.context)}`,
    buildQuestion: (s) =>
      `¿Qué ${lower(s.subject) || 'propuesta'} permite lograr ${s.target || 'la mejora buscada'}${s.scope ? ` en ${s.scope}` : ''}${withContext(s.context)}?`,
    buildObjective: (s) =>
      `Diseñar un ${lower(s.subject) || 'plan'}${s.qualifier ? ` ${s.qualifier}` : ''} para ${s.target || 'la mejora buscada'}${s.scope ? ` en ${s.scope}` : ''}${withContext(s.context)}.`,
    buildSpecifics: (s) => [
      `Diagnosticar la situación actual de ${s.target || 'el problema identificado'} en ${s.scope || 'la organización de estudio'} mediante instrumentos aplicados a los actores involucrados.`,
      `Fundamentar teóricamente el ${lower(s.subject) || 'plan'} a partir de literatura indexada y de experiencias comparables.`,
      `Estructurar la propuesta con sus fases, responsables, recursos e indicadores de seguimiento.`,
      `Validar la propuesta mediante juicio de expertos o socialización con los responsables del proceso.`,
    ],
    buildClaim: (s) =>
      `La propuesta se considerará aceptada si es valorada como pertinente y aplicable por los expertos consultados, y si sus indicadores permiten verificar el avance sobre ${s.target || 'el problema identificado'} en el plazo previsto.`,
  },

  /* ------------------------------------------------------------------ */
  correlational: {
    id: 'correlational',
    label: 'Correlacional o explicativo',
    summary: 'Estudias la relación entre dos variables en una población.',
    careers: 'Psicología · Educación · Administración · Sociología · Economía · RR. HH.',
    pattern: 'VARIABLE 1 + CONECTOR + VARIABLE 2 + POBLACIÓN + ÁMBITO',
    fields: {
      subject: {
        label: 'Variable independiente (V1)',
        hint: 'La causa o el factor que se estudia. Debe ser medible con un instrumento.',
        placeholder: 'Ej: Clima organizacional',
      },
      qualifier: {
        label: 'Conector metodológico',
        hint: 'Define el alcance del estudio: correlacional, causal o propositivo.',
        placeholder: 'y su incidencia en',
        options: [
          'y su relación con',
          'y su incidencia en',
          'y su impacto en',
          'en la mejora de',
        ],
      },
      target: {
        label: 'Variable dependiente (V2)',
        hint: 'El efecto o resultado que se mide. También necesita instrumento.',
        placeholder: 'Ej: el desempeño laboral',
      },
      scope: {
        label: 'Población o sujetos de estudio',
        hint: 'Quiénes responden. Sin población definida no hay muestra ni capítulo 3.',
        placeholder: 'Ej: en docentes de bachillerato de instituciones fiscales',
      },
    },
    claimLabel: 'Hipótesis general (H1)',
    expectsArtifact: false,
    sample: {
      subject: 'Clima organizacional',
      qualifier: 'y su incidencia en',
      target: 'el desempeño laboral',
      scope: 'en docentes de bachillerato de instituciones fiscales',
      context: 'de la provincia de Manabí, 2026',
    },
    buildTitle: (s) =>
      `${s.subject || '[Variable 1]'} ${s.qualifier || 'y su relación con'} ${s.target || '[Variable 2]'}${s.scope ? ` ${s.scope}` : ''}${s.context ? `, ${s.context}` : ''}`,
    buildQuestion: (s) => {
      const tail = `${s.scope ? ` ${s.scope}` : ''}${s.context ? ` ${s.context}` : ''}`;
      const v1 = s.subject || 'la variable independiente';
      const v2 = s.target || 'la variable dependiente';
      if (s.qualifier.includes('incidencia') || s.qualifier.includes('impacto')) {
        return `¿De qué manera incide ${lower(v1)} en ${v2}${tail}?`;
      }
      if (s.qualifier.includes('mejora')) {
        return `¿En qué medida contribuye ${lower(v1)} a la mejora de ${v2}${tail}?`;
      }
      return `¿Cuál es la relación existente entre ${lower(v1)} y ${v2}${tail}?`;
    },
    buildObjective: (s) => {
      const tail = `${s.scope ? ` ${s.scope}` : ''}${s.context ? ` ${s.context}` : ''}`;
      const v1 = lower(s.subject) || 'la variable independiente';
      const v2 = s.target || 'la variable dependiente';
      if (s.qualifier.includes('incidencia') || s.qualifier.includes('impacto')) {
        return `Determinar la incidencia de ${v1} en ${v2}${tail}.`;
      }
      if (s.qualifier.includes('mejora')) {
        return `Evaluar el aporte de ${v1} para optimizar ${v2}${tail}.`;
      }
      return `Establecer la relación existente entre ${v1} y ${v2}${tail}.`;
    },
    buildSpecifics: (s) => [
      `Diagnosticar el nivel de ${lower(s.subject) || 'la variable independiente'} en ${s.scope || 'la población de estudio'} mediante un instrumento validado.`,
      `Medir el nivel de ${s.target || 'la variable dependiente'} en la misma población.`,
      `Analizar estadísticamente la relación entre ambas variables aplicando la prueba que corresponda a su nivel de medición.`,
      `Formular recomendaciones a partir de los hallazgos obtenidos.`,
    ],
    buildClaim: (s) => {
      const tail = `${s.scope ? ` ${s.scope}` : ''}${s.context ? ` ${s.context}` : ''}`;
      const v1 = lower(s.subject) || 'la variable independiente';
      const v2 = s.target || 'la variable dependiente';
      if (s.qualifier.includes('incidencia') || s.qualifier.includes('impacto')) {
        return `H1: ${s.subject || 'La variable independiente'} incide de manera directa y estadísticamente significativa en ${v2}${tail}.`;
      }
      if (s.qualifier.includes('mejora')) {
        return `H1: La implementación de ${v1} mejora significativamente ${v2}${tail}.`;
      }
      return `H1: Existe una correlación positiva y estadísticamente significativa entre ${v1} y ${v2}${tail}.`;
    },
  },

  /* ------------------------------------------------------------------ */
  diagnostic: {
    id: 'diagnostic',
    label: 'Diagnóstico o caracterización',
    summary: 'Mides un fenómeno en una población y describes su magnitud.',
    careers: 'Enfermería · Medicina · Nutrición · Trabajo Social · Derecho · Ambiental',
    pattern: 'FENÓMENO MEDIDO + FACTOR ASOCIADO + EN + POBLACIÓN + ÁMBITO',
    fields: {
      subject: {
        label: 'Fenómeno que mides',
        hint: 'Lo que vas a cuantificar o caracterizar: prevalencia, nivel, incidencia, factores, calidad.',
        placeholder: 'Ej: Prevalencia de sedentarismo',
      },
      qualifier: {
        label: 'Factores o dimensiones asociadas',
        hint: 'Lo que analizas junto al fenómeno. Vacío si solo caracterizas.',
        placeholder: 'Ej: y factores sociodemográficos asociados',
        optional: true,
      },
      target: {
        label: 'Instrumento o criterio de medición',
        hint: 'Con qué lo mides. Un diagnóstico sin instrumento definido no es replicable.',
        placeholder: 'Ej: mediante el cuestionario IPAQ versión corta',
      },
      scope: {
        label: 'Población estudiada',
        hint: 'Grupo humano concreto, con su criterio de inclusión.',
        placeholder: 'Ej: en estudiantes universitarios de primer año',
      },
    },
    claimLabel: 'Supuesto de partida',
    expectsArtifact: false,
    sample: {
      subject: 'Prevalencia de sedentarismo',
      qualifier: 'y factores sociodemográficos asociados',
      target: 'mediante el cuestionario IPAQ versión corta',
      scope: 'en estudiantes universitarios de primer año',
      context: 'de la ciudad de Loja, 2026',
    },
    buildTitle: (s) =>
      `${s.subject || '[Fenómeno medido]'}${s.qualifier ? ` ${s.qualifier}` : ''}${s.scope ? ` ${s.scope}` : ''}${s.target ? `, ${s.target}` : ''}${s.context ? `, ${s.context}` : ''}`,
    buildQuestion: (s) =>
      `¿Cuál es ${lower(s.subject) || 'la magnitud del fenómeno'}${s.qualifier ? ` ${s.qualifier}` : ''}${s.scope ? ` ${s.scope}` : ''}${withContext(s.context)}?`,
    buildObjective: (s) =>
      `Determinar ${lower(s.subject) || 'la magnitud del fenómeno'}${s.qualifier ? ` ${s.qualifier}` : ''}${s.scope ? ` ${s.scope}` : ''}${s.target ? `, ${s.target}` : ''}${withContext(s.context)}.`,
    buildSpecifics: (s) => [
      `Caracterizar el perfil de ${s.scope || 'la población de estudio'} según sus variables sociodemográficas.`,
      `Medir ${lower(s.subject) || 'el fenómeno'} ${s.target || 'con el instrumento seleccionado'}.`,
      `Identificar la asociación entre el fenómeno medido y las dimensiones consideradas.`,
      `Elaborar recomendaciones dirigidas a los responsables del ámbito estudiado.`,
    ],
    buildClaim: (s) =>
      `Se parte del supuesto de que ${lower(s.subject) || 'el fenómeno'} presenta una magnitud relevante ${s.scope || 'en la población de estudio'} y muestra asociación con las dimensiones consideradas; el estudio lo confirmará o lo descartará con los datos recogidos.`,
  },

  /* ------------------------------------------------------------------ */
  experimental: {
    id: 'experimental',
    label: 'Experimental o comparativo',
    summary: 'Aplicas un tratamiento y mides su efecto frente a un control.',
    careers: 'Agropecuaria · Biotecnología · Química · Alimentos · Ciencias Básicas · Salud',
    pattern: 'EFECTO DE + TRATAMIENTO + SOBRE + RESPUESTA MEDIDA + EN + SUJETO + ÁMBITO',
    fields: {
      subject: {
        label: 'Tratamiento o factor aplicado',
        hint: 'Lo que manipulas, con sus niveles o dosis. Sin niveles no hay diseño experimental.',
        placeholder: 'Ej: Tres dosis de abono orgánico',
      },
      qualifier: {
        label: 'Diseño experimental',
        hint: 'El diseño estadístico que sostiene la comparación.',
        placeholder: 'Ej: bajo un diseño de bloques completos al azar',
        optional: true,
      },
      target: {
        label: 'Variable respuesta que mides',
        hint: 'El efecto medible, con su unidad. Debe poder cuantificarse.',
        placeholder: 'Ej: el rendimiento y la calidad poscosecha',
      },
      scope: {
        label: 'Sujeto o material experimental',
        hint: 'Cultivo, especie, material o grupo sobre el que se aplica.',
        placeholder: 'Ej: en el cultivo de tomate riñón bajo invernadero',
      },
    },
    claimLabel: 'Hipótesis experimental',
    expectsArtifact: false,
    sample: {
      subject: 'Tres dosis de abono orgánico',
      qualifier: 'bajo un diseño de bloques completos al azar',
      target: 'el rendimiento y la calidad poscosecha',
      scope: 'en el cultivo de tomate riñón bajo invernadero',
      context: 'en la provincia de Tungurahua, 2026',
    },
    buildTitle: (s) =>
      `Efecto de ${lower(s.subject) || '[tratamiento]'}${s.qualifier ? ` ${s.qualifier}` : ''} sobre ${s.target || '[variable respuesta]'}${s.scope ? ` ${s.scope}` : ''}${s.context ? `, ${s.context}` : ''}`,
    buildQuestion: (s) =>
      `¿Qué efecto produce ${lower(s.subject) || 'el tratamiento aplicado'} sobre ${s.target || 'la variable respuesta'}${s.scope ? ` ${s.scope}` : ''}${withContext(s.context)}?`,
    buildObjective: (s) =>
      `Evaluar el efecto de ${lower(s.subject) || 'el tratamiento aplicado'}${s.qualifier ? ` ${s.qualifier}` : ''} sobre ${s.target || 'la variable respuesta'}${s.scope ? ` ${s.scope}` : ''}${withContext(s.context)}.`,
    buildSpecifics: (s) => [
      `Establecer las unidades experimentales y los tratamientos ${s.qualifier || 'según el diseño estadístico seleccionado'}.`,
      `Medir ${s.target || 'la variable respuesta'} en cada tratamiento durante el periodo de evaluación.`,
      `Comparar los tratamientos mediante el análisis de varianza y la prueba de separación de medias correspondiente.`,
      `Determinar el tratamiento de mejor comportamiento y estimar su conveniencia técnica y económica.`,
    ],
    buildClaim: (s) =>
      `H1: Al menos uno de los tratamientos de ${lower(s.subject) || 'el factor aplicado'} produce una diferencia estadísticamente significativa en ${s.target || 'la variable respuesta'} frente al testigo.`,
  },
};

export const APPROACH_LIST: ApproachSpec[] = [
  APPROACHES.technological,
  APPROACHES.proposal,
  APPROACHES.correlational,
  APPROACHES.diagnostic,
  APPROACHES.experimental,
];

/* ------------------------------------------------------------------ *
 * Revisión de la forma del título
 * ------------------------------------------------------------------ */

export interface TitleSignal {
  level: 'ok' | 'warn' | 'error';
  label: string;
  detail: string;
}

export interface TitleAssessment {
  score: number;
  verdict: string;
  signals: TitleSignal[];
}

/**
 * Aperturas que anuncian un estudio descriptivo. En los enfoques que esperan un
 * producto entregable, un título que empieza así casi siempre termina en
 * observación redactada y vuelve con observaciones.
 */
const VAGUE_OPENERS = [
  'estudio de',
  'estudio sobre',
  'análisis de',
  'analisis de',
  'investigación sobre',
  'investigacion sobre',
  'revisión de',
  'revision de',
  'importancia de',
  'uso de',
];

/** Palabras que indican que el título nombra algo entregable. */
const ARTIFACT_MARKERS = [
  'prototipo',
  'sistema',
  'aplicación',
  'aplicacion',
  'plataforma',
  'arquitectura',
  'modelo',
  'módulo',
  'modulo',
  'herramienta',
  'framework',
  'algoritmo',
  'dashboard',
  'portal',
  'plan',
  'programa',
  'estrategia',
  'manual',
  'guía',
  'guia',
  'protocolo',
];

/** Términos tan amplios que no delimitan ninguna muestra. */
const VAGUE_SCOPES = ['empresas', 'personas', 'la sociedad', 'el país', 'organizaciones', 'gente'];

export interface ThesisProjectProps {
  approach?: ResearchApproach;
  subject?: string;
  qualifier?: string;
  target?: string;
  scope?: string;
  context?: string;
  accessScore?: number;
  literatureScore?: number;
  relevanceScore?: number;
}

export class ThesisProject {
  private approach: ResearchApproach;
  private slots: TitleSlots;
  private accessScore: number;
  private literatureScore: number;
  private relevanceScore: number;

  constructor(props: ThesisProjectProps = {}) {
    this.approach = props.approach ?? 'technological';
    const sample = APPROACHES[this.approach].sample;
    this.slots = {
      subject: props.subject ?? sample.subject,
      qualifier: props.qualifier ?? sample.qualifier,
      target: props.target ?? sample.target,
      scope: props.scope ?? sample.scope,
      context: props.context ?? sample.context,
    };
    this.accessScore = props.accessScore ?? 35;
    this.literatureScore = props.literatureScore ?? 35;
    this.relevanceScore = props.relevanceScore ?? 30;
  }

  /* ---------------- Acceso encapsulado ---------------- */

  public getApproach(): ResearchApproach {
    return this.approach;
  }

  public getSpec(): ApproachSpec {
    return APPROACHES[this.approach];
  }

  public getSlots(): TitleSlots {
    return { ...this.slots };
  }

  public setScores(access: number, literature: number, relevance: number): void {
    this.accessScore = access;
    this.literatureScore = literature;
    this.relevanceScore = relevance;
  }

  public getScores() {
    return {
      access: this.accessScore,
      literature: this.literatureScore,
      relevance: this.relevanceScore,
    };
  }

  /* ---------------- Generación en cascada ---------------- */

  public generateFormalTitle(): string {
    return this.getSpec().buildTitle(this.slots).replace(/\s+/g, ' ').trim();
  }

  public generateResearchQuestion(): string {
    return this.getSpec().buildQuestion(this.slots).replace(/\s+/g, ' ').trim();
  }

  public generateGeneralObjective(): string {
    return this.getSpec().buildObjective(this.slots).replace(/\s+/g, ' ').trim();
  }

  /**
   * Objetivos específicos: el eslabón que más devoluciones evita. Sin ellos el
   * objetivo general no tiene forma de demostrarse cumplido.
   */
  public generateSpecificObjectives(): string[] {
    return this.getSpec()
      .buildSpecifics(this.slots)
      .map((item) => item.replace(/\s+/g, ' ').trim());
  }

  public getClaimLabel(): string {
    return this.getSpec().claimLabel;
  }

  /**
   * Enunciado final. No toda tesis lleva hipótesis: un prototipo se acepta
   * contra criterios verificables y un diagnóstico parte de un supuesto. Forzar
   * una hipótesis correlacional donde no toca es un error metodológico clásico.
   */
  public generateGeneralHypothesis(): string {
    return this.getSpec().buildClaim(this.slots).replace(/\s+/g, ' ').trim();
  }

  /**
   * Revisa la FORMA del título, no su mérito científico: qué se entrega, dónde
   * se aplica y si el enunciado corresponde al enfoque elegido.
   */
  public assessTitle(): TitleAssessment {
    const spec = this.getSpec();
    const title = this.generateFormalTitle();
    const text = title.toLowerCase();
    const words = title.split(/\s+/).filter(Boolean).length;
    const signals: TitleSignal[] = [];
    let score = 100;

    if (spec.expectsArtifact) {
      if (ARTIFACT_MARKERS.some((marker) => text.includes(marker))) {
        signals.push({
          level: 'ok',
          label: 'Nombra lo que entregas',
          detail: 'El título dice qué se produce, no solo qué se va a estudiar.',
        });
      } else {
        score -= 30;
        signals.push({
          level: 'error',
          label: 'No se sabe qué entregas',
          detail: `Empieza nombrando el producto. Estructura esperada: ${spec.pattern}.`,
        });
      }

      const opener = VAGUE_OPENERS.find((verb) => text.startsWith(verb));
      if (opener) {
        score -= 25;
        signals.push({
          level: 'error',
          label: `Arranca con «${opener}»`,
          detail:
            'Ese arranque anuncia un estudio descriptivo. En este enfoque se espera un producto: sustitúyelo por lo que vas a construir.',
        });
      }
    }

    if (!this.slots.subject || this.slots.subject.length < 4) {
      score -= 25;
      signals.push({
        level: 'error',
        label: `Falta ${spec.fields.subject.label.toLowerCase()}`,
        detail: spec.fields.subject.hint,
      });
    }

    if (!this.slots.target || this.slots.target.length < 4) {
      score -= 20;
      signals.push({
        level: 'error',
        label: `Falta ${spec.fields.target.label.toLowerCase()}`,
        detail: spec.fields.target.hint,
      });
    }

    if (!this.slots.qualifier && !spec.fields.qualifier.optional) {
      score -= 10;
      signals.push({
        level: 'warn',
        label: `Sin ${spec.fields.qualifier.label.toLowerCase()}`,
        detail: spec.fields.qualifier.hint,
      });
    } else if (!this.slots.qualifier) {
      score -= 8;
      signals.push({
        level: 'warn',
        label: 'Propuesta poco diferenciada',
        detail: spec.fields.qualifier.hint,
      });
    } else {
      signals.push({
        level: 'ok',
        label: 'Propuesta diferenciada',
        detail: 'Hay un rasgo que distingue tu trabajo de otro con el mismo tema.',
      });
    }

    const scopeText = this.slots.scope.toLowerCase();
    const scopeIsVague =
      !this.slots.scope ||
      this.slots.scope.length < 8 ||
      VAGUE_SCOPES.some((vague) => scopeText.trim() === vague || scopeText.trim() === `en ${vague}`);

    if (scopeIsVague) {
      score -= 20;
      signals.push({
        level: 'error',
        label: `${spec.fields.scope.label} sin delimitar`,
        detail: `${spec.fields.scope.hint} Un término amplio no acota ninguna muestra.`,
      });
    } else {
      signals.push({
        level: 'ok',
        label: 'Ámbito de aplicación delimitado',
        detail: 'Se identifica dónde se aplica y de dónde saldrán los datos.',
      });
    }

    if (!this.slots.context) {
      score -= 12;
      signals.push({
        level: 'warn',
        label: 'Sin lugar ni año',
        detail:
          'El ámbito geográfico y el periodo delimitan tu compromiso y evitan que se te exija generalizar a todo el país.',
      });
    } else {
      signals.push({
        level: 'ok',
        label: 'Alcance acotado',
        detail: 'El lugar y el periodo dejan claro hasta dónde llega el estudio.',
      });
    }

    if (words < 10) {
      score -= 15;
      signals.push({
        level: 'warn',
        label: `Demasiado corto (${words} palabras)`,
        detail:
          'Un título de titulación suele necesitar entre 15 y 30 palabras para nombrar todos sus componentes sin ambigüedad.',
      });
    } else if (words > 35) {
      score -= 10;
      signals.push({
        level: 'warn',
        label: `Demasiado largo (${words} palabras)`,
        detail: 'Por encima de 35 palabras el título deja de leerse. Quita lo que ya se sobreentiende.',
      });
    } else {
      signals.push({
        level: 'ok',
        label: `Extensión adecuada (${words} palabras)`,
        detail: 'Cabe en una portada y sigue siendo específico.',
      });
    }

    score = Math.max(0, Math.min(100, score));
    const verdict =
      score >= 85
        ? 'Título listo para presentar'
        : score >= 60
          ? 'Título presentable con ajustes'
          : 'Título aún genérico: reformúlalo antes de entregarlo';

    return { score, verdict, signals };
  }

  /* ---------------- Salidas ---------------- */

  public evaluateFeasibility(): FeasibilityReport {
    return new FeasibilityReport(this.accessScore, this.literatureScore, this.relevanceScore);
  }

  public exportConsistencyMatrixText(): string {
    const spec = this.getSpec();
    const report = this.evaluateFeasibility();
    const assessment = this.assessTitle();

    return [
      '==========================================================',
      'TESIS ECUADOR · PORTAL UNIVERSITARIO',
      'MATRIZ DE CONSISTENCIA Y EVALUACIÓN DE VIABILIDAD',
      '==========================================================',
      '',
      `ENFOQUE: ${spec.label} — ${spec.summary}`,
      `CARRERAS HABITUALES: ${spec.careers}`,
      `ESTRUCTURA DEL TÍTULO: ${spec.pattern}`,
      '',
      'TÍTULO FORMAL:',
      this.generateFormalTitle(),
      '',
      'PREGUNTA GENERAL (Capítulo 1):',
      this.generateResearchQuestion(),
      '',
      'OBJETIVO GENERAL:',
      this.generateGeneralObjective(),
      '',
      'OBJETIVOS ESPECÍFICOS:',
      ...this.generateSpecificObjectives().map((item, index) => `${index + 1}. ${item}`),
      '',
      `${spec.claimLabel.toUpperCase()}:`,
      this.generateGeneralHypothesis(),
      '',
      'DESGLOSE DE COMPONENTES:',
      `- ${spec.fields.subject.label}: ${this.slots.subject || '(sin definir)'}`,
      `- ${spec.fields.qualifier.label}: ${this.slots.qualifier || '(sin definir)'}`,
      `- ${spec.fields.target.label}: ${this.slots.target || '(sin definir)'}`,
      `- ${spec.fields.scope.label}: ${this.slots.scope || '(sin definir)'}`,
      `- Ámbito espacio-temporal: ${this.slots.context || '(sin definir)'}`,
      '',
      'REVISIÓN DE FORMA DEL TÍTULO:',
      `- Puntaje de forma: ${assessment.score}/100 (${assessment.verdict})`,
      ...assessment.signals.map(
        (signal) =>
          `  [${signal.level === 'ok' ? 'OK' : signal.level === 'warn' ? 'REVISAR' : 'CORREGIR'}] ${signal.label}: ${signal.detail}`
      ),
      '',
      'DICTAMEN DE VIABILIDAD:',
      `- Puntaje Total: ${report.totalScore}/100 pts (${report.level})`,
      `- Acceso a Datos: ${this.accessScore}/35 pts`,
      `- Literatura Indexada: ${this.literatureScore}/35 pts`,
      `- Relevancia Práctica: ${this.relevanceScore}/30 pts`,
      `- Dictamen: ${report.title}`,
      `- Recomendación: ${report.advice}`,
      '',
      'Nota: esta matriz revisa forma y consistencia, no el mérito científico.',
      'La decisión sobre tu proyecto corresponde a tu docente o tutor.',
      '==========================================================',
    ].join('\n');
  }
}
