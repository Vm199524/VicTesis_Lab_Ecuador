/**
 * Vistas del portal: el panel principal (retícula bento), el área de trabajo de un
 * módulo y la presentación metodológica en diapositivas.
 */
export type ViewMode = 'home' | 'module' | 'slides';

export type EcosystemId =
  | 'feasibility'
  | 'chapters'
  | 'scopus'
  | 'apa7'
  | 'toolbox'
  | 'videos'
  | 'draft'
  | 'plagiarism'
  | 'all';

export interface SlideItem {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  keyRule: string;
  bulletPoints: {
    title: string;
    description: string;
    highlight?: string;
  }[];
  proTip: string;
  actionableResource?: {
    label: string;
    actionType: 'tool' | 'link';
    targetId?: string;
    url?: string;
  };
}

export interface ChapterInfo {
  number: string;
  roman: string;
  title: string;
  question: string;
  purpose: string;
  deliverables: string[];
  keyMistake: string;
  formulaOrTemplate: string;
  checklist: string[];
}

export interface AcademicTool {
  id: string;
  name: string;
  category: 'Busqueda' | 'Citas' | 'Redaccion' | 'Analisis';
  badge: string;
  description: string;
  keyBenefit: string;
  recommendedUse: string;
  url: string;
  pricing: 'Gratuito' | 'Freemium' | 'Institucional';
  proTip: string;
}

export interface BooleanOperatorSample {
  field: string;
  topic: string;
  equation: string;
  explanation: string;
}

export interface FeasibilityResult {
  score: number;
  verdict: 'Viabilidad Alta (Aprobado)' | 'Viabilidad Media (Ajustar Alcance)' | 'Riesgo Crítico (Rediseñar)';
  recommendations: string[];
}
