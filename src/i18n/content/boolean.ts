/**
 * Ejemplos de ecuaciones booleanas, traducidos.
 *
 * La ecuación en sí (`equation`) no se traduce nunca: es sintaxis de Scopus y sus
 * descriptores están en inglés porque así se indexa la literatura. Lo que se
 * traduce es el campo disciplinar, el tema y la explicación de por qué la
 * ecuación está construida así.
 *
 * Claves `boolean.<índice>.<campo>`, con el índice de `BOOLEAN_SAMPLES`.
 */

import type { ContentDict } from './types';

export const BOOLEAN_TRANSLATIONS: ContentDict = {
  'boolean.0.field': { es: 'Administración & Marketing', en: 'Business & Marketing', pt: 'Administração & Marketing', fr: 'Gestion & Marketing', it: 'Management & Marketing' },
  'boolean.0.topic': { es: 'Inteligencia Artificial y Fidelización de Clientes', en: 'Artificial intelligence and customer loyalty', pt: 'Inteligência artificial e fidelização de clientes', fr: 'Intelligence artificielle et fidélisation client', it: 'Intelligenza artificiale e fidelizzazione dei clienti' },
  'boolean.0.explanation': { es: 'Interseca el constructo principal de Inteligencia Artificial con descriptores afines de retención y lealtad, acotando a publicaciones indexadas recientes.', en: 'Intersects the core AI construct with related retention and loyalty descriptors, narrowed to recent indexed publications.', pt: 'Cruza o construto principal de inteligência artificial com descritores afins de retenção e lealdade, limitando a publicações indexadas recentes.', fr: 'Croise le construit central d\'intelligence artificielle avec les descripteurs de rétention et de fidélité, en se limitant aux publications indexées récentes.', it: 'Incrocia il costrutto principale di intelligenza artificiale con descrittori affini di retention e fedeltà, limitando alle pubblicazioni indicizzate recenti.' },

  'boolean.1.field': { es: 'Recursos Humanos & Gestión Organizacional', en: 'Human Resources & Organisational Management', pt: 'Recursos Humanos & Gestão Organizacional', fr: 'Ressources humaines & Management organisationnel', it: 'Risorse umane & Gestione organizzativa' },
  'boolean.1.topic': { es: 'Teletrabajo y Compromiso Laboral (Engagement)', en: 'Telework and work engagement', pt: 'Teletrabalho e engajamento no trabalho', fr: 'Télétravail et engagement au travail', it: 'Telelavoro e work engagement' },
  'boolean.1.explanation': { es: 'Agrupa descriptores sinónimos de trabajo a distancia asociados al constructo de engagement, delimitando a fuentes en acceso abierto.', en: 'Groups synonymous remote-work descriptors around the engagement construct, restricted to open-access sources.', pt: 'Agrupa descritores sinônimos de trabalho remoto associados ao construto de engajamento, limitando a fontes em acesso aberto.', fr: 'Regroupe les descripteurs synonymes du travail à distance autour du construit d\'engagement, en se limitant aux sources en libre accès.', it: 'Raggruppa descrittori sinonimi di lavoro da remoto attorno al costrutto di engagement, limitando alle fonti ad accesso aperto.' },

  'boolean.2.field': { es: 'Tecnologías de la Información & Ciberseguridad', en: 'Information Technology & Cybersecurity', pt: 'Tecnologias da Informação & Cibersegurança', fr: 'Technologies de l\'information & Cybersécurité', it: 'Tecnologie dell\'informazione & Cybersicurezza' },
  'boolean.2.topic': { es: 'Seguridad de la Información en el Sector Bancario', en: 'Information security in the banking sector', pt: 'Segurança da informação no setor bancário', fr: 'Sécurité de l\'information dans le secteur bancaire', it: 'Sicurezza dell\'informazione nel settore bancario' },
  'boolean.2.explanation': { es: 'Excluye la literatura sobre criptoactivos para focalizar el análisis en la infraestructura de seguridad de la banca institucional.', en: 'Excludes the crypto-asset literature to focus on the security infrastructure of institutional banking.', pt: 'Exclui a literatura sobre criptoativos para focar na infraestrutura de segurança da banca institucional.', fr: 'Exclut la littérature sur les cryptoactifs pour se concentrer sur l\'infrastructure de sécurité bancaire institutionnelle.', it: 'Esclude la letteratura sulle criptoattività per concentrarsi sull\'infrastruttura di sicurezza della banca istituzionale.' },

  'boolean.3.field': { es: 'Educación Superior & Pedagogía', en: 'Higher Education & Pedagogy', pt: 'Educação Superior & Pedagogia', fr: 'Enseignement supérieur & Pédagogie', it: 'Istruzione superiore & Pedagogia' },
  'boolean.3.topic': { es: 'Tecnologías Educativas y Rendimiento Académico', en: 'Educational technology and academic performance', pt: 'Tecnologias educacionais e desempenho acadêmico', fr: 'Technologies éducatives et performance académique', it: 'Tecnologie educative e rendimento accademico' },
  'boolean.3.explanation': { es: 'Delimita la población de estudio al nivel de educación superior e incorpora métricas estandarizadas de rendimiento académico.', en: 'Restricts the study population to higher education and brings in standardised academic-performance metrics.', pt: 'Delimita a população de estudo ao ensino superior e incorpora métricas padronizadas de desempenho acadêmico.', fr: 'Restreint la population d\'étude à l\'enseignement supérieur et intègre des métriques standardisées de performance.', it: 'Delimita la popolazione di studio all\'istruzione superiore e integra metriche standardizzate di rendimento.' },
};
