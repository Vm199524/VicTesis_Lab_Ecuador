/**
 * Domain Model: FeasibilityReport
 * Encapsulates the institutional viability evaluation for university thesis topics in Ecuador.
 */

export type FeasibilityLevel = 'APROBADO' | 'REQUIERE_AJUSTE' | 'RIESGO_CRITICO';

export interface CriterionBreakdown {
  score: number;
  maxScore: number;
  status: 'Aprobado' | 'Regular' | 'Crítico';
  label: string;
}

export class FeasibilityReport {
  public readonly totalScore: number;
  public readonly level: FeasibilityLevel;
  public readonly title: string;
  public readonly badgeClass: string;
  public readonly bgClass: string;
  public readonly textClass: string;
  public readonly advice: string;
  public readonly criteria: {
    access: CriterionBreakdown;
    literature: CriterionBreakdown;
    relevance: CriterionBreakdown;
  };

  constructor(accessScore: number, literatureScore: number, relevanceScore: number) {
    this.totalScore = Math.min(100, Math.max(0, accessScore + literatureScore + relevanceScore));

    this.criteria = {
      access: {
        score: accessScore,
        maxScore: 35,
        status: accessScore >= 35 ? 'Aprobado' : accessScore >= 20 ? 'Regular' : 'Crítico',
        label: 'Acceso a Datos y Muestra',
      },
      literature: {
        score: literatureScore,
        maxScore: 35,
        status: literatureScore >= 35 ? 'Aprobado' : literatureScore >= 15 ? 'Regular' : 'Crítico',
        label: 'Literatura Scopus/WoS (< 5 años)',
      },
      relevance: {
        score: relevanceScore,
        maxScore: 30,
        status: relevanceScore >= 30 ? 'Aprobado' : relevanceScore >= 15 ? 'Regular' : 'Crítico',
        label: 'Relevancia Práctica',
      },
    };

    if (this.totalScore >= 80) {
      this.level = 'APROBADO';
      this.title = 'Tema Viable y Aprobable';
      this.badgeClass = 'bg-emerald-100 text-emerald-900 border border-emerald-300';
      this.bgClass = 'bg-emerald-50/70 border-emerald-300';
      this.textClass = 'text-emerald-800';
      this.advice =
        'El proyecto reúne las condiciones epistemológicas y operativas que suelen exigir las comisiones de titulación universitarias. Se recomienda proceder de inmediato a la formulación del problema y matriz de consistencia del Avance 1.';
    } else if (this.totalScore >= 50) {
      this.level = 'REQUIERE_AJUSTE';
      this.title = 'Requiere Ajustes Metodológicos';
      this.badgeClass = 'bg-amber-100 text-amber-900 border border-amber-300';
      this.bgClass = 'bg-amber-50/70 border-amber-300';
      this.textClass = 'text-amber-800';
      this.advice =
        'El objeto de estudio presenta debilidades en el acceso a la muestra o escasez de literatura indexada reciente. Conviene redefinir el contexto geográfico hacia el cantón o la provincia donde sí puedas levantar los datos y asegurar su disponibilidad antes de registrar el perfil.';
    } else {
      this.level = 'RIESGO_CRITICO';
      this.title = 'Riesgo Crítico de Rechazo';
      this.badgeClass = 'bg-rose-100 text-rose-900 border border-rose-300';
      this.bgClass = 'bg-rose-50/70 border-rose-300';
      this.textClass = 'text-rose-800';
      this.advice =
        'El planteamiento presenta inviabilidad operativa (falta de datos primarios o nula literatura arbitrada), lo que compromete su aprobación. Se aconseja replantear las variables o seleccionar un caso de estudio con autorización formal demostrable.';
    }
  }

  public isApproved(): boolean {
    return this.level === 'APROBADO';
  }

  public needsAdjustment(): boolean {
    return this.level === 'REQUIERE_AJUSTE';
  }

  public isCritical(): boolean {
    return this.level === 'RIESGO_CRITICO';
  }
}
