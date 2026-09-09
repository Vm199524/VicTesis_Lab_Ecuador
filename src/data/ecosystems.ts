import {
  Target,
  Layers,
  Search,
  BookOpen,
  Laptop,
  PlayCircle,
  FileCheck2,
  ShieldCheck,
  LayoutList,
} from 'lucide-react';
import type { ElementType } from 'react';
import type { EcosystemId } from '../types';

/**
 * Color de identidad de cada módulo sobre superficie blanca. El color vive en el
 * icono, el borde al pasar el cursor y los acentos tipográficos; nunca inunda el
 * fondo de la tarjeta, para que la retícula se lea como un sistema y no como un
 * mosaico de colores compitiendo entre sí.
 */
export interface ModuleTint {
  /** Fondo suave del chip del icono. */
  soft: string;
  /** Color del icono y de los acentos de texto. */
  text: string;
  /** Fondo saturado (botones y estados activos). */
  solid: string;
  /** Borde al pasar el cursor. */
  hoverBorder: string;
  /** Barra o punto de color. */
  bar: string;
}

export interface EcosystemItem {
  id: EcosystemId;
  number: string;
  name: string;
  shortName: string;
  badge: string;
  icon: ElementType;
  description: string;
  tint: ModuleTint;
  /** Tamaño que ocupa la tarjeta en la retícula bento del panel principal. */
}

export const ECOSYSTEMS_LIST: EcosystemItem[] = [
  {
    id: 'feasibility',
    number: '01',
    name: 'Evaluación de Viabilidad & Matriz de Consistencia',
    shortName: 'Viabilidad & Matriz',
    badge: 'Fase de inicio · Avance 1',
    icon: Target,
    description:
      'Diagnóstico ponderado de acceso a la muestra, literatura indexada y consistencia metodológica en 4 fases progresivas.',
    tint: {
      soft: 'bg-amber-50',
      text: 'text-amber-600',
      solid: 'bg-amber-500',
      hoverBorder: 'hover:border-amber-300',
      bar: 'bg-amber-500',
    },
  },
  {
    id: 'chapters',
    number: '02',
    name: 'Estructura Canónica: Los 5 Capítulos',
    shortName: 'Los 5 Capítulos',
    badge: 'Arquitectura capitular',
    icon: Layers,
    description:
      'Entregables obligatorios, errores críticos a evitar, fórmulas y checklist de aprobación por capítulo.',
    tint: {
      soft: 'bg-blue-50',
      text: 'text-blue-600',
      solid: 'bg-blue-600',
      hoverBorder: 'hover:border-blue-300',
      bar: 'bg-blue-600',
    },
  },
  {
    id: 'scopus',
    number: '03',
    name: 'Sintetizador de Ecuaciones Scopus & WoS',
    shortName: 'Scopus & Booleanos',
    badge: 'Recuperación Q1/Q2',
    icon: Search,
    description:
      'Constructor booleano con operadores AND/OR/AND NOT, filtros de acceso abierto y enlaces directos de búsqueda.',
    tint: {
      soft: 'bg-emerald-50',
      text: 'text-emerald-600',
      solid: 'bg-emerald-600',
      hoverBorder: 'hover:border-emerald-300',
      bar: 'bg-emerald-600',
    },
  },
  {
    id: 'apa7',
    number: '04',
    name: 'Simulador de Citación APA 7ª Edición & Zotero',
    shortName: 'APA 7 & Zotero',
    badge: 'Normalización bibliográfica',
    icon: BookOpen,
    description:
      'Citas parentéticas, narrativas, directas y en bloque, aplicación de et al. e integración con Zotero 7.',
    tint: {
      soft: 'bg-violet-50',
      text: 'text-violet-600',
      solid: 'bg-violet-600',
      hoverBorder: 'hover:border-violet-300',
      bar: 'bg-violet-600',
    },
  },
  {
    id: 'toolbox',
    number: '05',
    name: 'Suite Digital & Herramientas de Investigación',
    shortName: 'Software & Toolbox',
    badge: 'Ecosistema tecnológico',
    icon: Laptop,
    description:
      'Gestores bibliográficos, análisis estadístico (Jamovi, SPSS), mapas de literatura e IA ética.',
    tint: {
      soft: 'bg-fuchsia-50',
      text: 'text-fuchsia-600',
      solid: 'bg-fuchsia-600',
      hoverBorder: 'hover:border-fuchsia-300',
      bar: 'bg-fuchsia-600',
    },
  },
  {
    id: 'videos',
    number: '06',
    name: 'Videoteca Guiada por Etapa del Proceso',
    shortName: 'Videoteca',
    badge: 'Aprendizaje audiovisual',
    icon: PlayCircle,
    description:
      'Rutas de video curadas para estructura, metodología, revisión de literatura, herramientas y sustentación.',
    tint: {
      soft: 'bg-rose-50',
      text: 'text-rose-600',
      solid: 'bg-rose-600',
      hoverBorder: 'hover:border-rose-300',
      bar: 'bg-rose-600',
    },
  },
  {
    id: 'draft',
    number: '07',
    name: 'Revisor de Borrador: Diagnóstico de tu Avance',
    shortName: 'Revisor de Borrador',
    badge: 'Diagnóstico previo a entrega',
    icon: FileCheck2,
    description:
      'Sube tu Avance 1, Avance 2 o documento completo y recibe un diagnóstico de forma y estructura. Se procesa en tu navegador.',
    tint: {
      soft: 'bg-cyan-50',
      text: 'text-cyan-600',
      solid: 'bg-cyan-600',
      hoverBorder: 'hover:border-cyan-300',
      bar: 'bg-cyan-600',
    },
  },
  {
    id: 'plagiarism',
    number: '08',
    name: 'Verificador de Originalidad Académica',
    shortName: 'Originalidad & Plagio',
    badge: 'Integridad académica',
    icon: ShieldCheck,
    description:
      'Contrasta tu documento contra Wikipedia, CORE, arXiv, Semantic Scholar, DOAJ, CrossRef, OpenAlex y Europe PMC, y estima el uso de IA generativa.',
    tint: {
      soft: 'bg-teal-50',
      text: 'text-teal-600',
      solid: 'bg-teal-600',
      hoverBorder: 'hover:border-teal-300',
      bar: 'bg-teal-600',
    },
  },
  {
    id: 'all',
    number: '09',
    name: 'Compendio Integral',
    shortName: 'Ver Todo',
    badge: 'Modo continuo',
    icon: LayoutList,
    description: 'Todos los módulos desplegados en un único lienzo continuo de trabajo.',
    tint: {
      soft: 'bg-slate-100',
      text: 'text-slate-600',
      solid: 'bg-slate-700',
      hoverBorder: 'hover:border-slate-300',
      bar: 'bg-slate-500',
    },
  },
];
