/**
 * Domain Model: ScopusQueryGenerator
 * Object-Oriented class for building indexed academic search syntax for Scopus and Web of Science.
 */

export interface ScopusQueryConfig {
  term1: string;
  operator: 'AND' | 'OR' | 'AND NOT';
  term2: string;
  contextTerm?: string;
  synonyms1?: string;
  synonyms2?: string;
  openAccessOnly?: boolean;
  last5Years?: boolean;
  articlesOnly?: boolean;
}

export class ScopusQueryGenerator {
  private term1: string;
  private operator: 'AND' | 'OR' | 'AND NOT';
  private term2: string;
  private contextTerm: string;
  /** Sinónimos, familias de palabras o variantes del tesauro para el bloque 1, unidos con OR. */
  private synonyms1: string;
  /** Igual que `synonyms1`, para el bloque 2. */
  private synonyms2: string;
  private openAccessOnly: boolean;
  private last5Years: boolean;
  private articlesOnly: boolean;

  constructor(config: Partial<ScopusQueryConfig> = {}) {
    this.term1 = config.term1 ?? '"Artificial Intelligence" OR "AI"';
    this.operator = config.operator ?? 'AND';
    this.term2 = config.term2 ?? '"Customer Loyalty" OR "Customer Retention"';
    this.contextTerm = config.contextTerm ?? '"Retail" OR "E-commerce"';
    this.synonyms1 = config.synonyms1 ?? '';
    this.synonyms2 = config.synonyms2 ?? '';
    this.openAccessOnly = config.openAccessOnly ?? true;
    this.last5Years = config.last5Years ?? true;
    this.articlesOnly = config.articlesOnly ?? true;
  }

  public setTerm1(term: string): void {
    this.term1 = term.trim();
  }

  public setTerm2(term: string): void {
    this.term2 = term.trim();
  }

  public setSynonyms1(terms: string): void {
    this.synonyms1 = terms.trim();
  }

  public setSynonyms2(terms: string): void {
    this.synonyms2 = terms.trim();
  }

  public setOperator(op: 'AND' | 'OR' | 'AND NOT'): void {
    this.operator = op;
  }

  public setContextTerm(context: string): void {
    this.contextTerm = context.trim();
  }

  public setOpenAccessOnly(flag: boolean): void {
    this.openAccessOnly = flag;
  }

  public setLast5Years(flag: boolean): void {
    this.last5Years = flag;
  }

  public setArticlesOnly(flag: boolean): void {
    this.articlesOnly = flag;
  }

  /** Une un bloque conceptual con sus sinónimos/familia de palabras mediante OR. */
  private static withSynonyms(term: string, synonyms: string): string {
    return synonyms ? `${term} OR ${synonyms}` : term;
  }

  public buildCoreSyntax(): string {
    const block1 = ScopusQueryGenerator.withSynonyms(this.term1, this.synonyms1);
    const block2 = ScopusQueryGenerator.withSynonyms(this.term2, this.synonyms2);
    let core = `( ${block1} ) ${this.operator} ( ${block2} )`;
    if (this.contextTerm) {
      core += ` AND ( ${this.contextTerm} )`;
    }
    return core;
  }

  public buildFullScopusQuery(): string {
    const core = this.buildCoreSyntax();
    let query = `TITLE-ABS-KEY ( ${core} )`;

    const limiters: string[] = [];
    if (this.openAccessOnly) {
      limiters.push('LIMIT-TO ( OA , "all" )');
    }
    if (this.last5Years) {
      limiters.push(
        'LIMIT-TO ( PUBYEAR , 2026 ) OR LIMIT-TO ( PUBYEAR , 2025 ) OR LIMIT-TO ( PUBYEAR , 2024 ) OR LIMIT-TO ( PUBYEAR , 2023 ) OR LIMIT-TO ( PUBYEAR , 2022 )'
      );
    }
    if (this.articlesOnly) {
      limiters.push('LIMIT-TO ( DOCTYPE , "ar" ) OR LIMIT-TO ( DOCTYPE , "re" )');
    }

    if (limiters.length > 0) {
      query += ` AND ( ${limiters.join(' AND ')} )`;
    }

    return query;
  }

  public getGoogleScholarUrl(): string {
    return `https://scholar.google.com/scholar?q=${encodeURIComponent(`${this.term1} ${this.operator} ${this.term2}`)}`;
  }

  public getScopusAdvancedUrl(): string {
    return 'https://www.scopus.com/search/form.uri?display=advanced';
  }

  public getWebOfScienceUrl(): string {
    return 'https://www.webofscience.com/';
  }
}
