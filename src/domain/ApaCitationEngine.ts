/**
 * Domain Model: ApaCitationEngine
 * Object-Oriented class for generating APA 7th Edition citations and bibliographic entries.
 */

export type CitationStyle = 'parenthetical' | 'narrative' | 'directShort' | 'directBlock';
export type AuthorCountCategory = 1 | 2 | 3; // 3 represents 3 or more authors

export interface CitationPayload {
  authorCount: AuthorCountCategory;
  citationStyle: CitationStyle;
  year?: string;
  page?: string;
  sampleTopic?: string;
}

export class ApaCitationEngine {
  private authorCount: AuthorCountCategory;
  private citationStyle: CitationStyle;
  private year: string;
  private page: string;

  constructor(payload: Partial<CitationPayload> = {}) {
    this.authorCount = payload.authorCount ?? 3;
    this.citationStyle = payload.citationStyle ?? 'parenthetical';
    this.year = payload.year ?? '2024';
    this.page = payload.page ?? '42';
  }

  public setAuthorCount(count: AuthorCountCategory): void {
    this.authorCount = count;
  }

  public setCitationStyle(style: CitationStyle): void {
    this.citationStyle = style;
  }

  public getAuthorString(): string {
    if (this.authorCount === 1) {
      return 'Gómez';
    } else if (this.authorCount === 2) {
      return 'Gómez y Velasco';
    }
    return 'Gómez et al.';
  }

  public generateInTextCitation(): string {
    const authorString = this.getAuthorString();

    switch (this.citationStyle) {
      case 'narrative':
        return `Según ${authorString} (${this.year}), la adopción estratégica de herramientas digitales potencia la productividad del capital humano en un 28% anual en contextos organizacionales.`;
      case 'parenthetical':
        return `La adopción estratégica de herramientas digitales potencia la productividad del capital humano en un 28% anual en contextos organizacionales (${authorString}, ${this.year}).`;
      case 'directShort':
        return `Al respecto, se concluye que "la integración sistemática de analítica de datos optimiza la toma de decisiones organizacionales" (${authorString}, ${this.year}, p. ${this.page}).`;
      case 'directBlock':
        return `Sangría izquierda completa de 1.27 cm (sin comillas):\nLa transformación digital en las organizaciones contemporáneas no constituye únicamente un cambio tecnológico, sino una reconfiguración profunda de los modelos de gobernanza, procesos operativos y cultura interna orientada al aprendizaje continuo y la adaptabilidad. (${authorString}, ${this.year}, p. ${this.page})`;
    }
  }

  public generateReferenceListEntry(): string {
    if (this.authorCount === 1) {
      return `Gómez, M. A. (${this.year}). Liderazgo transformacional y desempeño laboral en América Latina. Revista Iberoamericana de Administración, 18(2), 115-132. https://doi.org/10.1016/j.ria.2024.01.004`;
    } else if (this.authorCount === 2) {
      return `Gómez, M. A., & Velasco, R. J. (${this.year}). Transformación digital y retención de talento humano en el sector bancario. Cuadernos de Gestión Estratégica, 29(4), 88-104. https://doi.org/10.1108/CGE-2023-0189`;
    }
    return `Gómez, M. A., Velasco, R. J., & Paredes, S. C. (${this.year}). Modelos de regresión aplicados a la toma de decisiones empresariales. Journal of Business Analytics, 12(1), 45-63. https://doi.org/10.1080/20476965.2024.2189045`;
  }

  /**
   * Texto en espanol de la regla aplicable. La interfaz lo traduce con la clave
   * que devuelve `getRuleKey()`; este metodo se mantiene como texto de reserva.
   */
  public getRuleExplanation(): string {
    if (this.authorCount >= 3) {
      return 'Regla APA 7 (3+ autores): Desde la primera mención en el texto, se cita únicamente el apellido del primer autor seguido de "et al." y el año. En la lista de referencias final, se listan hasta 20 autores.';
    } else if (this.authorCount === 2) {
      return 'Regla APA 7 (2 autores): Se citan siempre ambos autores en todas las ocasiones usando la conjunción "y" en español (o "&" dentro de paréntesis en inglés).';
    }
    return 'Regla APA 7 (1 autor): Se cita el apellido principal del autor y el año de publicación en cada ocasión.';
  }

  /** Clave de traduccion de la regla aplicable segun el numero de autores. */
  public getRuleKey(): string {
    if (this.authorCount >= 3) return 'apa.rule.three';
    if (this.authorCount === 2) return 'apa.rule.two';
    return 'apa.rule.one';
  }
}
