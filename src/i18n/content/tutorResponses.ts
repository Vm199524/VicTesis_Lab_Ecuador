/**
 * Respuestas del tutor de IA: preguntas frecuentes y orientación académica.
 *
 * Dos grupos de claves:
 *  - `tutor.query.*`: las preguntas rápidas del modal (texto corto).
 *  - `tutor.welcome`, `tutor.rejection`, `tutor.kb.*`: el contenido real que
 *    responde el tutor (mensaje de bienvenida, aviso de integridad académica
 *    y las ~20 respuestas de la base de conocimiento). Son bloques Markdown
 *    largos; se traducen completos manteniendo intactos los fragmentos de
 *    código, fórmulas y ecuaciones de búsqueda (van entre backticks y no
 *    cambian de un idioma a otro).
 */

import type { ContentDict } from './types';

export const TUTOR_RESPONSE_TRANSLATIONS: ContentDict = {
  'tutor.query.draftReview': { es: '¿Cómo reviso mi borrador?', en: 'How do I review my draft?', pt: 'Como faço para revisar meu rascunho?', fr: 'Comment puis-je réviser mon brouillon ?', it: 'Come posso revisionare la mia bozza?' },
  'tutor.query.objectives': { es: '¿Cómo redacto los objetivos?', en: 'How do I write the objectives?', pt: 'Como escrevo os objetivos?', fr: 'Comment puis-je rédiger les objectifs ?', it: 'Come scrivo gli obiettivi?' },
  'tutor.query.writingErrors': { es: 'Errores de redacción académica', en: 'Academic writing errors', pt: 'Erros de escrita acadêmica', fr: 'Erreurs de rédaction académique', it: 'Errori di scrittura accademica' },
  'tutor.query.boolean': { es: '¿Qué es una ecuación booleana?', en: 'What is a boolean equation?', pt: 'O que é uma equação booleana?', fr: 'Qu\'est-ce qu\'une équation booléenne ?', it: 'Cos\'è un\'equazione booleana?' },
  'tutor.query.chapters': { es: 'Los 5 capítulos de la tesis', en: 'The 5 chapters of the thesis', pt: 'Os 5 capítulos da tese', fr: 'Les 5 chapitres du mémoire', it: 'I 5 capitoli della tesi' },

  // -------------------------------- Mensaje de bienvenida y aviso de integridad
  'tutor.welcome': {
    es: `🎓 **Bienvenido al módulo de orientación metodológica**

Estoy preparado para asistirte en:
- Normas APA 7ª edición y normalización bibliográfica.
- Ecuaciones booleanas en Scopus y Web of Science.
- Estructura capitular canónica (Capítulos 1 al 5).
- Operacionalización de variables y enfoques de investigación.

*Recordatorio ético*: Como tutor virtual te oriento conceptualmente, pero no realizo tesis ni redacciones por encargo. ¿Qué duda metodológica deseas resolver?`,
    en: `🎓 **Welcome to the methodology guidance module**

I'm ready to help you with:
- APA 7th edition standards and bibliographic formatting.
- Boolean search strings in Scopus and Web of Science.
- Canonical chapter structure (Chapters 1 through 5).
- Variable operationalization and research approaches.

*Ethical reminder*: As a virtual tutor I guide you conceptually, but I don't write theses or papers on request. What methodology question would you like to resolve?`,
    pt: `🎓 **Bem-vindo ao módulo de orientação metodológica**

Estou preparado para ajudá-lo com:
- Normas APA 7ª edição e normalização bibliográfica.
- Equações booleanas no Scopus e na Web of Science.
- Estrutura capitular canônica (Capítulos 1 a 5).
- Operacionalização de variáveis e abordagens de pesquisa.

*Lembrete ético*: Como tutor virtual, oriento você conceitualmente, mas não redijo teses nem trabalhos por encomenda. Qual dúvida metodológica você deseja resolver?`,
    fr: `🎓 **Bienvenue dans le module d'orientation méthodologique**

Je suis prêt à vous aider sur :
- Les normes APA 7e édition et la normalisation bibliographique.
- Les équations booléennes dans Scopus et Web of Science.
- La structure canonique des chapitres (Chapitres 1 à 5).
- L'opérationnalisation des variables et les approches de recherche.

*Rappel éthique* : En tant que tuteur virtuel, je vous oriente sur le plan conceptuel, mais je ne rédige ni mémoire ni travaux sur commande. Quelle question méthodologique souhaitez-vous résoudre ?`,
    it: `🎓 **Benvenuto nel modulo di orientamento metodologico**

Sono pronto ad aiutarti con:
- Norme APA 7ª edizione e normalizzazione bibliografica.
- Equazioni booleane in Scopus e Web of Science.
- Struttura capitolare canonica (Capitoli da 1 a 5).
- Operazionalizzazione delle variabili e approcci di ricerca.

*Promemoria etico*: Come tutor virtuale ti oriento concettualmente, ma non scrivo tesi né elaborati su commissione. Quale dubbio metodologico vuoi risolvere?`,
  },

  'tutor.rejection': {
    es: `⚠️ **Aviso de integridad académica institucional**

El asistente virtual tiene como propósito exclusivo orientar en teoría, estructura y normas metodológicas científicas. Por principios deontológicos, **no redacta tesis ni sustituye el trabajo intelectual del investigador**.

Si quieres que te ayuden con un tema en específico o con el desarrollo de tu proyecto, puedes escribir por WhatsApp desde la barra superior.`,
    en: `⚠️ **Institutional academic integrity notice**

This virtual assistant's sole purpose is to guide you on theory, structure and scientific methodology standards. On deontological grounds, **it does not write theses or replace the researcher's own intellectual work**.

If you'd like help with a specific topic or with developing your project, you can message me on WhatsApp from the top bar.`,
    pt: `⚠️ **Aviso institucional de integridade acadêmica**

O assistente virtual tem como propósito exclusivo orientar sobre teoria, estrutura e normas metodológicas científicas. Por princípios deontológicos, **não redige teses nem substitui o trabalho intelectual do pesquisador**.

Se quiser ajuda com um tema específico ou com o desenvolvimento do seu projeto, você pode escrever pelo WhatsApp na barra superior.`,
    fr: `⚠️ **Avis institutionnel d'intégrité académique**

Cet assistant virtuel a pour seul objectif de vous guider sur la théorie, la structure et les normes méthodologiques scientifiques. Pour des raisons déontologiques, **il ne rédige pas de mémoire et ne remplace pas le travail intellectuel du chercheur**.

Si vous souhaitez de l'aide sur un sujet précis ou sur le développement de votre projet, vous pouvez écrire par WhatsApp depuis la barre supérieure.`,
    it: `⚠️ **Avviso istituzionale di integrità accademica**

L'assistente virtuale ha come unico scopo quello di orientare sulla teoria, la struttura e le norme metodologiche scientifiche. Per principi deontologici, **non redige tesi né sostituisce il lavoro intellettuale del ricercatore**.

Se vuoi aiuto su un tema specifico o sullo sviluppo del tuo progetto, puoi scrivere su WhatsApp dalla barra superiore.`,
  },
  'tutor.kb.ecuacion_booleana': {
    es: `🔍 **¿Qué es una Ecuación Booleana de Búsqueda Científica?**

Una ecuación booleana es una expresión lógica estructurada basada en el álgebra de George Boole, utilizada en motores de búsqueda académica y bases de datos arbitradas de alto impacto (como **Scopus**, **Web of Science**, **PubMed** e **IEEE Xplore**) para recuperar con máxima precisión la literatura indexada sobre las variables de tu tesis.

**Los 3 operadores lógicos fundamentales**

1. **AND (Intersección obligatoria)**:
   - Exige que todos los términos conectados aparezcan simultáneamente en el documento (título, resumen o palabras clave).
   - *Función*: Reduce y delimita los resultados a la intersección exacta.
   - *Ejemplo*: \`"machine learning" AND "credit risk"\` (solo recupera artículos que traten de ambos temas a la vez).

2. **OR (Unión de sinónimos)**:
   - Recupera artículos que contengan al menos uno de los términos indicados. Se utiliza para enlazar sinónimos, acrónimos o variantes conceptuales.
   - *Función*: Amplía la cobertura para no perder artículos clave redactados con otros términos.
   - *Ejemplo*: \`("pyme" OR "sme" OR "small business" OR "pequeña y mediana empresa")\`.

3. **NOT / AND NOT (Exclusión temática)**:
   - Descarta documentos que contengan un término indeseado que pueda sesgar el estudio.
   - *Función*: Depura el ruido metodológico.
   - *Ejemplo*: \`"educacion superior" AND NOT "primaria"\`.

**Signos de puntuación y sintaxis clave en Scopus**
- **Comillas dobles (\`"..."\` )**: Obligan al motor a buscar la frase textual continua y exacta, no palabras sueltas dispersas (ej: \`"supply chain management"\`).
- **Paréntesis \`( )\`**: Agrupan términos y definen la jerarquía lógica, exactamente como en una fórmula matemática: \`(A OR B) AND (C OR D)\`.
- **Asterisco (\`*\` / Comodín de truncamiento)**: Captura la raíz léxica y todas sus derivaciones (ej: \`educat*\` recupera *education, educational, educator, educative*).
- **Prefijo de campo \`TITLE-ABS-KEY(...)\`**: Ordena a Scopus buscar exclusivamente dentro del Título, Resumen (Abstract) y Palabras Clave (Keywords).

*Ejemplo integral para tu Avance 1 en Scopus*:
\`TITLE-ABS-KEY(("artificial intelligence" OR "machine learning") AND ("academic performance" OR "learning assessment") AND ("higher education" OR "university"))\`

En el **Mini Ecosistema 03 (Scopus & Booleanos)** de esta plataforma dispones de un generador interactivo que traduce automáticamente tus variables a esta sintaxis.`,
    en: `🔍 **What Is a Boolean Search Equation for Scientific Research?**

A Boolean equation is a structured logical expression based on the algebra of George Boole, used in academic search engines and peer-reviewed high-impact databases (such as **Scopus**, **Web of Science**, **PubMed** and **IEEE Xplore**) to retrieve, with maximum precision, the indexed literature on your thesis variables.

**The 3 fundamental logical operators**

1. **AND (mandatory intersection)**:
   - Requires that all connected terms appear simultaneously in the document (title, abstract or keywords).
   - *Function*: Narrows and delimits the results to the exact intersection.
   - *Example*: \`"machine learning" AND "credit risk"\` (only retrieves articles that address both topics at once).

2. **OR (union of synonyms)**:
   - Retrieves articles containing at least one of the listed terms. Used to link synonyms, acronyms or conceptual variants.
   - *Function*: Widens coverage so key articles written with other terms aren't missed.
   - *Example*: \`("pyme" OR "sme" OR "small business" OR "small and medium enterprise")\`.

3. **NOT / AND NOT (thematic exclusion)**:
   - Discards documents containing an unwanted term that could bias the study.
   - *Function*: Filters out methodological noise.
   - *Example*: \`"higher education" AND NOT "primary"\`.

**Key punctuation and syntax in Scopus**
- **Double quotes (\`"..."\`)**: Force the engine to search for the exact continuous phrase, not scattered loose words (e.g. \`"supply chain management"\`).
- **Parentheses \`( )\`**: Group terms and define logical hierarchy, exactly like a mathematical formula: \`(A OR B) AND (C OR D)\`.
- **Asterisk (\`*\`, truncation wildcard)**: Captures the lexical root and all its derivations (e.g. \`educat*\` retrieves *education, educational, educator, educative*).
- **Field prefix \`TITLE-ABS-KEY(...)\`**: Tells Scopus to search exclusively within the Title, Abstract and Keywords.

*Full example for your Advance 1 in Scopus*:
\`TITLE-ABS-KEY(("artificial intelligence" OR "machine learning") AND ("academic performance" OR "learning assessment") AND ("higher education" OR "university"))\`

The **Mini Ecosystem 03 (Scopus & Booleans)** on this platform has an interactive generator that automatically translates your variables into this syntax.`,
    pt: `🔍 **O que é uma Equação Booleana de Busca Científica?**

Uma equação booleana é uma expressão lógica estruturada, baseada na álgebra de George Boole, utilizada em motores de busca acadêmicos e bases de dados arbitradas de alto impacto (como **Scopus**, **Web of Science**, **PubMed** e **IEEE Xplore**) para recuperar com máxima precisão a literatura indexada sobre as variáveis da sua tese.

**Os 3 operadores lógicos fundamentais**

1. **AND (interseção obrigatória)**:
   - Exige que todos os termos conectados apareçam simultaneamente no documento (título, resumo ou palavras-chave).
   - *Função*: Reduz e delimita os resultados à interseção exata.
   - *Exemplo*: \`"machine learning" AND "credit risk"\` (recupera apenas artigos que tratem dos dois temas ao mesmo tempo).

2. **OR (união de sinônimos)**:
   - Recupera artigos que contenham pelo menos um dos termos indicados. Usado para ligar sinônimos, siglas ou variantes conceituais.
   - *Função*: Amplia a cobertura para não perder artigos-chave redigidos com outros termos.
   - *Exemplo*: \`("pyme" OR "sme" OR "small business" OR "pequena e média empresa")\`.

3. **NOT / AND NOT (exclusão temática)**:
   - Descarta documentos que contenham um termo indesejado que possa enviesar o estudo.
   - *Função*: Depura o ruído metodológico.
   - *Exemplo*: \`"educacao superior" AND NOT "primaria"\`.

**Sinais de pontuação e sintaxe-chave no Scopus**
- **Aspas duplas (\`"..."\`)**: Obrigam o motor a buscar a frase textual contínua e exata, não palavras soltas dispersas (ex.: \`"supply chain management"\`).
- **Parênteses \`( )\`**: Agrupam termos e definem a hierarquia lógica, exatamente como em uma fórmula matemática: \`(A OR B) AND (C OR D)\`.
- **Asterisco (\`*\`, curinga de truncamento)**: Captura a raiz lexical e todas as suas derivações (ex.: \`educat*\` recupera *education, educational, educator, educative*).
- **Prefixo de campo \`TITLE-ABS-KEY(...)\`**: Ordena ao Scopus buscar exclusivamente dentro do Título, Resumo (Abstract) e Palavras-chave (Keywords).

*Exemplo integral para o seu Avanço 1 no Scopus*:
\`TITLE-ABS-KEY(("artificial intelligence" OR "machine learning") AND ("academic performance" OR "learning assessment") AND ("higher education" OR "university"))\`

No **Mini Ecossistema 03 (Scopus & Booleanos)** desta plataforma você tem um gerador interativo que traduz automaticamente suas variáveis para essa sintaxe.`,
    fr: `🔍 **Qu'est-ce qu'une équation booléenne de recherche scientifique ?**

Une équation booléenne est une expression logique structurée fondée sur l'algèbre de George Boole, utilisée dans les moteurs de recherche académiques et les bases de données arbitrées à fort impact (comme **Scopus**, **Web of Science**, **PubMed** et **IEEE Xplore**) pour récupérer avec une précision maximale la littérature indexée sur les variables de votre mémoire.

**Les 3 opérateurs logiques fondamentaux**

1. **AND (intersection obligatoire)** :
   - Exige que tous les termes reliés apparaissent simultanément dans le document (titre, résumé ou mots-clés).
   - *Fonction* : Réduit et délimite les résultats à l'intersection exacte.
   - *Exemple* : \`"machine learning" AND "credit risk"\` (ne récupère que les articles traitant des deux sujets à la fois).

2. **OR (union de synonymes)** :
   - Récupère les articles contenant au moins un des termes indiqués. Utilisé pour relier synonymes, acronymes ou variantes conceptuelles.
   - *Fonction* : Élargit la couverture pour ne pas manquer d'articles clés rédigés avec d'autres termes.
   - *Exemple* : \`("pyme" OR "sme" OR "small business" OR "petite et moyenne entreprise")\`.

3. **NOT / AND NOT (exclusion thématique)** :
   - Écarte les documents contenant un terme indésirable pouvant biaiser l'étude.
   - *Fonction* : Épure le bruit méthodologique.
   - *Exemple* : \`"enseignement superieur" AND NOT "primaire"\`.

**Ponctuation et syntaxe clés dans Scopus**
- **Guillemets doubles (\`"..."\`)** : Obligent le moteur à chercher la phrase exacte et continue, et non des mots isolés dispersés (ex. : \`"supply chain management"\`).
- **Parenthèses \`( )\`** : Regroupent les termes et définissent la hiérarchie logique, exactement comme une formule mathématique : \`(A OR B) AND (C OR D)\`.
- **Astérisque (\`*\`, joker de troncature)** : Capture la racine lexicale et toutes ses dérivations (ex. : \`educat*\` récupère *education, educational, educator, educative*).
- **Préfixe de champ \`TITLE-ABS-KEY(...)\`** : Indique à Scopus de chercher exclusivement dans le Titre, le Résumé (Abstract) et les Mots-clés (Keywords).

*Exemple complet pour votre premier jalon dans Scopus* :
\`TITLE-ABS-KEY(("artificial intelligence" OR "machine learning") AND ("academic performance" OR "learning assessment") AND ("higher education" OR "university"))\`

Le **Mini-écosystème 03 (Scopus & Booléens)** de cette plateforme propose un générateur interactif qui traduit automatiquement vos variables dans cette syntaxe.`,
    it: `🔍 **Che cos'è un'equazione booleana di ricerca scientifica?**

Un'equazione booleana è un'espressione logica strutturata basata sull'algebra di George Boole, utilizzata nei motori di ricerca accademici e nelle banche dati arbitrate ad alto impatto (come **Scopus**, **Web of Science**, **PubMed** e **IEEE Xplore**) per recuperare con la massima precisione la letteratura indicizzata sulle variabili della tua tesi.

**I 3 operatori logici fondamentali**

1. **AND (intersezione obbligatoria)**:
   - Richiede che tutti i termini collegati compaiano simultaneamente nel documento (titolo, abstract o parole chiave).
   - *Funzione*: Riduce e delimita i risultati all'intersezione esatta.
   - *Esempio*: \`"machine learning" AND "credit risk"\` (recupera solo articoli che trattano entrambi i temi contemporaneamente).

2. **OR (unione di sinonimi)**:
   - Recupera articoli che contengono almeno uno dei termini indicati. Si usa per collegare sinonimi, acronimi o varianti concettuali.
   - *Funzione*: Amplia la copertura per non perdere articoli chiave scritti con altri termini.
   - *Esempio*: \`("pyme" OR "sme" OR "small business" OR "piccola e media impresa")\`.

3. **NOT / AND NOT (esclusione tematica)**:
   - Scarta i documenti che contengono un termine indesiderato che potrebbe distorcere lo studio.
   - *Funzione*: Ripulisce il rumore metodologico.
   - *Esempio*: \`"istruzione superiore" AND NOT "primaria"\`.

**Segni di punteggiatura e sintassi chiave in Scopus**
- **Virgolette doppie (\`"..."\`)**: Obbligano il motore a cercare la frase testuale continua ed esatta, non parole sparse (es.: \`"supply chain management"\`).
- **Parentesi \`( )\`**: Raggruppano i termini e definiscono la gerarchia logica, esattamente come una formula matematica: \`(A OR B) AND (C OR D)\`.
- **Asterisco (\`*\`, carattere jolly di troncamento)**: Cattura la radice lessicale e tutte le sue derivazioni (es.: \`educat*\` recupera *education, educational, educator, educative*).
- **Prefisso di campo \`TITLE-ABS-KEY(...)\`**: Ordina a Scopus di cercare esclusivamente in Titolo, Abstract e Parole chiave (Keywords).

*Esempio completo per il tuo primo avanzamento su Scopus*:
\`TITLE-ABS-KEY(("artificial intelligence" OR "machine learning") AND ("academic performance" OR "learning assessment") AND ("higher education" OR "university"))\`

Nel **Mini Ecosistema 03 (Scopus & Booleani)** di questa piattaforma trovi un generatore interattivo che traduce automaticamente le tue variabili in questa sintassi.`,
  },

  'tutor.kb.scopus': {
    es: `🔍 **Fórmula recomendada para Scopus y Web of Science**

1. Usa comillas dobles para términos compuestos: \`"supply chain"\` o \`"machine learning"\`.
2. Emplea el operador **AND** para intersecar tus variables obligatorias: \`"variable A" AND "variable B"\`.
3. Emplea el operador **OR** para agrupar sinónimos: \`("fintech" OR "digital banking")\`.
4. Filtra por los últimos 5 años (2021-2026) y revistas indexadas en cuartiles Q1 o Q2.

*Recomendación metodológica*: Traducir las ecuaciones al idioma inglés permite acceder a más del 85% de la producción científica global arbitrada.`,
    en: `🔍 **Recommended formula for Scopus and Web of Science**

1. Use double quotes for compound terms: \`"supply chain"\` or \`"machine learning"\`.
2. Use the **AND** operator to intersect your mandatory variables: \`"variable A" AND "variable B"\`.
3. Use the **OR** operator to group synonyms: \`("fintech" OR "digital banking")\`.
4. Filter by the last 5 years (2021-2026) and journals indexed in Q1 or Q2 quartiles.

*Methodological tip*: Translating your search strings into English gives you access to more than 85% of the world's peer-reviewed scientific output.`,
    pt: `🔍 **Fórmula recomendada para Scopus e Web of Science**

1. Use aspas duplas para termos compostos: \`"supply chain"\` ou \`"machine learning"\`.
2. Use o operador **AND** para cruzar suas variáveis obrigatórias: \`"variable A" AND "variable B"\`.
3. Use o operador **OR** para agrupar sinônimos: \`("fintech" OR "digital banking")\`.
4. Filtre pelos últimos 5 anos (2021-2026) e por periódicos indexados em quartis Q1 ou Q2.

*Recomendação metodológica*: Traduzir as equações para o inglês permite acessar mais de 85% da produção científica global arbitrada.`,
    fr: `🔍 **Formule recommandée pour Scopus et Web of Science**

1. Utilisez des guillemets doubles pour les termes composés : \`"supply chain"\` ou \`"machine learning"\`.
2. Utilisez l'opérateur **AND** pour croiser vos variables obligatoires : \`"variable A" AND "variable B"\`.
3. Utilisez l'opérateur **OR** pour regrouper les synonymes : \`("fintech" OR "digital banking")\`.
4. Filtrez sur les 5 dernières années (2021-2026) et les revues indexées en quartiles Q1 ou Q2.

*Recommandation méthodologique* : Traduire les équations en anglais permet d'accéder à plus de 85 % de la production scientifique mondiale arbitrée.`,
    it: `🔍 **Formula consigliata per Scopus e Web of Science**

1. Usa le virgolette doppie per i termini composti: \`"supply chain"\` o \`"machine learning"\`.
2. Usa l'operatore **AND** per intersecare le tue variabili obbligatorie: \`"variable A" AND "variable B"\`.
3. Usa l'operatore **OR** per raggruppare i sinonimi: \`("fintech" OR "digital banking")\`.
4. Filtra per gli ultimi 5 anni (2021-2026) e riviste indicizzate nei quartili Q1 o Q2.

*Raccomandazione metodologica*: Tradurre le equazioni in inglese permette di accedere a oltre l'85% della produzione scientifica globale arbitrata.`,
  },

  'tutor.kb.matriz': {
    es: `📐 **¿Qué es la Matriz de Consistencia y cómo se estructura?**

La matriz de consistencia es la herramienta metodológica medular del **Avance 1**. Garantiza la coherencia lógica y la alineación matemática entre todos los componentes de la investigación:

1. **Problema General** = **Objetivo General** = **Hipótesis General** (si aplica).
2. **Problemas Específicos** = **Objetivos Específicos** = **Hipótesis Específicas**.
3. **Variables**: Variable Independiente (Causa / X) y Variable Dependiente (Efecto / Y).
4. **Dimensiones e Indicadores**: Los parámetros cuantificables o cualificables que se medirán con los instrumentos de campo.
5. **Metodología**: Enfoque (cuantitativo/cualitativo), tipo (descriptivo, correlacional, explicativo), diseño (no experimental transversal) y muestra.

En el **Mini Ecosistema 01** puedes construir progresivamente tu Matriz de Consistencia en 4 fases secuenciales.`,
    en: `📐 **What is the Consistency Matrix and how is it structured?**

The consistency matrix is the core methodological tool of **Advance 1**. It ensures logical coherence and alignment across every component of the research:

1. **General Problem** = **General Objective** = **General Hypothesis** (if applicable).
2. **Specific Problems** = **Specific Objectives** = **Specific Hypotheses**.
3. **Variables**: Independent Variable (Cause / X) and Dependent Variable (Effect / Y).
4. **Dimensions and Indicators**: The quantifiable or qualifiable parameters that will be measured with the field instruments.
5. **Methodology**: Approach (quantitative/qualitative), type (descriptive, correlational, explanatory), design (cross-sectional non-experimental) and sample.

In **Mini Ecosystem 01** you can progressively build your Consistency Matrix across 4 sequential phases.`,
    pt: `📐 **O que é a Matriz de Consistência e como se estrutura?**

A matriz de consistência é a ferramenta metodológica medular do **Avanço 1**. Garante a coerência lógica e o alinhamento entre todos os componentes da pesquisa:

1. **Problema Geral** = **Objetivo Geral** = **Hipótese Geral** (se aplicável).
2. **Problemas Específicos** = **Objetivos Específicos** = **Hipóteses Específicas**.
3. **Variáveis**: Variável Independente (Causa / X) e Variável Dependente (Efeito / Y).
4. **Dimensões e Indicadores**: Os parâmetros quantificáveis ou qualificáveis que serão medidos com os instrumentos de campo.
5. **Metodologia**: Abordagem (quantitativa/qualitativa), tipo (descritivo, correlacional, explicativo), desenho (não experimental transversal) e amostra.

No **Mini Ecossistema 01** você pode construir progressivamente sua Matriz de Consistência em 4 fases sequenciais.`,
    fr: `📐 **Qu'est-ce que la matrice de cohérence et comment se structure-t-elle ?**

La matrice de cohérence est l'outil méthodologique central du **premier jalon**. Elle garantit la cohérence logique et l'alignement entre toutes les composantes de la recherche :

1. **Problème général** = **Objectif général** = **Hypothèse générale** (le cas échéant).
2. **Problèmes spécifiques** = **Objectifs spécifiques** = **Hypothèses spécifiques**.
3. **Variables** : Variable indépendante (Cause / X) et Variable dépendante (Effet / Y).
4. **Dimensions et indicateurs** : Les paramètres quantifiables ou qualifiables qui seront mesurés avec les instruments de terrain.
5. **Méthodologie** : Approche (quantitative/qualitative), type (descriptif, corrélationnel, explicatif), plan (non expérimental transversal) et échantillon.

Dans le **Mini-écosystème 01**, vous pouvez construire progressivement votre matrice de cohérence en 4 phases successives.`,
    it: `📐 **Che cos'è la Matrice di Coerenza e come si struttura?**

La matrice di coerenza è lo strumento metodologico centrale del **primo avanzamento**. Garantisce la coerenza logica e l'allineamento tra tutte le componenti della ricerca:

1. **Problema Generale** = **Obiettivo Generale** = **Ipotesi Generale** (se applicabile).
2. **Problemi Specifici** = **Obiettivi Specifici** = **Ipotesi Specifiche**.
3. **Variabili**: Variabile Indipendente (Causa / X) e Variabile Dipendente (Effetto / Y).
4. **Dimensioni e Indicatori**: I parametri quantificabili o qualificabili che saranno misurati con gli strumenti di campo.
5. **Metodologia**: Approccio (quantitativo/qualitativo), tipo (descrittivo, correlazionale, esplicativo), disegno (non sperimentale trasversale) e campione.

Nel **Mini Ecosistema 01** puoi costruire progressivamente la tua Matrice di Coerenza in 4 fasi sequenziali.`,
  },

  'tutor.kb.avance1': {
    es: `📋 **¿Qué contiene el Avance 1 de Titulación?**

El Avance 1 representa la fundamentación inicial y la aprobación del plan de tesis:
1. **Título del Proyecto**: Paramétrico y conciso (idealmente entre 15 y 20 palabras), delimitando variables, unidad de análisis, contexto geográfico y temporalidad.
2. **Planteamiento del Problema**: Redactado bajo la técnica del embudo (contexto Macro internacional, Meso nacional y Micro institucional).
3. **Preguntas de Investigación**: Una pregunta rectora central y 3 a 4 subpreguntas específicas.
4. **Objetivos de Investigación**: Un objetivo general (inicia con verbo taxonómico de Bloom en infinitivo) y 3 objetivos específicos secuenciales (diagnosticar, analizar/evaluar y proponer).
5. **Justificación**: Teórica, metodológica, práctica y social.
6. **Matriz de Consistencia Preliminar y Antecedentes**: 5 antecedentes internacionales y 5 nacionales indexados en Scopus, Latindex o SciELO.`,
    en: `📋 **What does Advance 1 of the thesis process include?**

Advance 1 represents the initial groundwork and approval of the thesis plan:
1. **Project Title**: Parametric and concise (ideally 15 to 20 words), delimiting variables, unit of analysis, geographic context and timeframe.
2. **Problem Statement**: Written using the funnel technique (international Macro context, national Meso context, institutional Micro context).
3. **Research Questions**: One central guiding question and 3 to 4 specific sub-questions.
4. **Research Objectives**: One general objective (starts with a Bloom's taxonomy verb in the infinitive) and 3 sequential specific objectives (diagnose, analyze/evaluate and propose).
5. **Rationale**: Theoretical, methodological, practical and social.
6. **Preliminary Consistency Matrix and Background**: 5 international and 5 national precedents indexed in Scopus, Latindex or SciELO.`,
    pt: `📋 **O que compõe o Avanço 1 da Titulação?**

O Avanço 1 representa a fundamentação inicial e a aprovação do plano de tese:
1. **Título do Projeto**: Paramétrico e conciso (idealmente entre 15 e 20 palavras), delimitando variáveis, unidade de análise, contexto geográfico e temporalidade.
2. **Formulação do Problema**: Redigida com a técnica do funil (contexto Macro internacional, Meso nacional e Micro institucional).
3. **Perguntas de Pesquisa**: Uma pergunta central e 3 a 4 subperguntas específicas.
4. **Objetivos de Pesquisa**: Um objetivo geral (inicia com verbo da taxonomia de Bloom no infinitivo) e 3 objetivos específicos sequenciais (diagnosticar, analisar/avaliar e propor).
5. **Justificativa**: Teórica, metodológica, prática e social.
6. **Matriz de Consistência Preliminar e Antecedentes**: 5 antecedentes internacionais e 5 nacionais indexados no Scopus, Latindex ou SciELO.`,
    fr: `📋 **Que contient le premier jalon (Avance 1) de fin d'études ?**

Le premier jalon correspond à la formulation initiale et à l'approbation du plan de mémoire :
1. **Titre du projet** : Paramétrique et concis (idéalement 15 à 20 mots), délimitant les variables, l'unité d'analyse, le contexte géographique et la temporalité.
2. **Énoncé du problème** : Rédigé selon la technique de l'entonnoir (contexte Macro international, Méso national et Micro institutionnel).
3. **Questions de recherche** : Une question directrice centrale et 3 à 4 sous-questions spécifiques.
4. **Objectifs de recherche** : Un objectif général (débutant par un verbe de la taxonomie de Bloom à l'infinitif) et 3 objectifs spécifiques séquentiels (diagnostiquer, analyser/évaluer et proposer).
5. **Justification** : Théorique, méthodologique, pratique et sociale.
6. **Matrice de cohérence préliminaire et antécédents** : 5 antécédents internationaux et 5 nationaux indexés dans Scopus, Latindex ou SciELO.`,
    it: `📋 **Cosa comprende il primo avanzamento di tesi?**

Il primo avanzamento rappresenta la fondazione iniziale e l'approvazione del piano di tesi:
1. **Titolo del Progetto**: Parametrico e conciso (idealmente tra 15 e 20 parole), delimitando variabili, unità di analisi, contesto geografico e temporalità.
2. **Formulazione del Problema**: Redatta con la tecnica dell'imbuto (contesto Macro internazionale, Meso nazionale e Micro istituzionale).
3. **Domande di Ricerca**: Una domanda guida centrale e da 3 a 4 sotto-domande specifiche.
4. **Obiettivi di Ricerca**: Un obiettivo generale (inizia con un verbo della tassonomia di Bloom all'infinito) e 3 obiettivi specifici sequenziali (diagnosticare, analizzare/valutare e proporre).
5. **Giustificazione**: Teorica, metodologica, pratica e sociale.
6. **Matrice di Coerenza Preliminare e Precedenti**: 5 precedenti internazionali e 5 nazionali indicizzati in Scopus, Latindex o SciELO.`,
  },

  'tutor.kb.apa': {
    es: `📑 **Normas APA 7ª Edición: puntos clave de evaluación**

1. **Regla del "et al."**: Para obras con 3 o más autores, desde la PRIMERA cita en el texto se coloca únicamente el primer autor seguido de \`et al.\` y el año (ejemplo: *García et al., 2023*).
2. **Cita Textual Corta (< 40 palabras)**: Se incorpora dentro del párrafo entre comillas, indicando autor, año y número de página: *(Pérez, 2024, p. 45)*.
3. **Cita en Bloque (≥ 40 palabras)**: Se ubica en párrafo independiente con sangría izquierda de 1.27 cm, a doble espacio y sin comillas.
4. **Identificador Digital (DOI)**: Debe presentarse siempre en formato de hipervínculo activo \`https://doi.org/...\`.

*Recomendación*: El uso del gestor bibliográfico **Zotero** previene inconsistencias formales entre las citas en el cuerpo del texto y la lista final de referencias. Revisa el **Mini Ecosistema 04** para ver el simulador interactivo de citas.`,
    en: `📑 **APA 7th edition standards: key evaluation points**

1. **The "et al." rule**: For works with 3 or more authors, from the FIRST in-text citation onward, list only the first author followed by \`et al.\` and the year (example: *García et al., 2023*).
2. **Short direct quote (< 40 words)**: Embedded in the paragraph in quotation marks, indicating author, year and page number: *(Pérez, 2024, p. 45)*.
3. **Block quote (≥ 40 words)**: Set as an independent paragraph with a 1.27 cm left indent, double-spaced and without quotation marks.
4. **Digital Object Identifier (DOI)**: Must always be presented as an active hyperlink \`https://doi.org/...\`.

*Recommendation*: Using the **Zotero** reference manager prevents inconsistencies between in-text citations and the final reference list. Check **Mini Ecosystem 04** for the interactive citation simulator.`,
    pt: `📑 **Normas APA 7ª edição: pontos-chave de avaliação**

1. **Regra do "et al."**: Para trabalhos com 3 ou mais autores, desde a PRIMEIRA citação no texto coloca-se apenas o primeiro autor seguido de \`et al.\` e o ano (exemplo: *García et al., 2023*).
2. **Citação Textual Curta (< 40 palavras)**: Incorporada dentro do parágrafo entre aspas, indicando autor, ano e número de página: *(Pérez, 2024, p. 45)*.
3. **Citação em Bloco (≥ 40 palavras)**: Colocada em parágrafo independente com recuo esquerdo de 1,27 cm, em espaço duplo e sem aspas.
4. **Identificador Digital (DOI)**: Deve sempre ser apresentado em formato de hiperlink ativo \`https://doi.org/...\`.

*Recomendação*: O uso do gerenciador bibliográfico **Zotero** evita inconsistências formais entre as citações no corpo do texto e a lista final de referências. Confira o **Mini Ecossistema 04** para ver o simulador interativo de citações.`,
    fr: `📑 **Normes APA 7e édition : points clés d'évaluation**

1. **Règle du « et al. »** : Pour les ouvrages à 3 auteurs ou plus, dès la PREMIÈRE citation dans le texte, on ne mentionne que le premier auteur suivi de \`et al.\` et de l'année (exemple : *García et al., 2023*).
2. **Citation textuelle courte (< 40 mots)** : Incorporée dans le paragraphe entre guillemets, en indiquant l'auteur, l'année et le numéro de page : *(Pérez, 2024, p. 45)*.
3. **Citation en bloc (≥ 40 mots)** : Placée dans un paragraphe indépendant avec un retrait gauche de 1,27 cm, à double interligne et sans guillemets.
4. **Identifiant numérique (DOI)** : Doit toujours être présenté sous forme de lien hypertexte actif \`https://doi.org/...\`.

*Recommandation* : L'utilisation du gestionnaire bibliographique **Zotero** évite les incohérences entre les citations dans le corps du texte et la liste finale des références. Consultez le **Mini-écosystème 04** pour voir le simulateur interactif de citations.`,
    it: `📑 **Norme APA 7ª edizione: punti chiave di valutazione**

1. **Regola dell'"et al."**: Per opere con 3 o più autori, fin dalla PRIMA citazione nel testo si indica solo il primo autore seguito da \`et al.\` e dall'anno (esempio: *García et al., 2023*).
2. **Citazione testuale breve (< 40 parole)**: Inserita nel paragrafo tra virgolette, indicando autore, anno e numero di pagina: *(Pérez, 2024, p. 45)*.
3. **Citazione in blocco (≥ 40 parole)**: Collocata in un paragrafo indipendente con rientro sinistro di 1,27 cm, a doppia interlinea e senza virgolette.
4. **Identificatore digitale (DOI)**: Deve sempre essere presentato in formato di collegamento ipertestuale attivo \`https://doi.org/...\`.

*Raccomandazione*: L'uso del gestore bibliografico **Zotero** previene incoerenze tra le citazioni nel corpo del testo e l'elenco finale dei riferimenti. Consulta il **Mini Ecosistema 04** per il simulatore interattivo di citazioni.`,
  },

  'tutor.kb.zotero': {
    es: `📚 **¿Qué es Zotero 7 y por qué es indispensable para tu tesis?**

Zotero es un gestor bibliográfico de código abierto que automatiza la recopilación, organización y citación de fuentes académicas:
1. **Zotero Connector**: Extensión de navegador que detecta artículos en Scopus, Google Scholar o repositorios y los guarda con un solo clic con metadatos completos (autores, año, DOI, revista).
2. **Integración con Microsoft Word y Google Docs**: Inserta citas parentéticas y narrativas en formato APA 7ª edición con un atajo de teclado, garantizando que el formato nunca tenga fallas tipográficas.
3. **Generación instantánea de Referencias**: Con un solo clic genera la lista bibliográfica final con sangría francesa y orden alfabético estricto.
4. **Cero discrepancias en Turnitin**: Evita la falta de coincidencia entre autores citados en el texto y autores referenciados al final, una de las observaciones más frecuentes al revisar la bibliografía.

En el **Mini Ecosistema 04** tienes una guía completa de configuración paso a paso de Zotero 7.`,
    en: `📚 **What is Zotero 7 and why is it essential for your thesis?**

Zotero is an open-source reference manager that automates the collection, organization and citation of academic sources:
1. **Zotero Connector**: A browser extension that detects articles on Scopus, Google Scholar or repositories and saves them in one click with full metadata (authors, year, DOI, journal).
2. **Integration with Microsoft Word and Google Docs**: Inserts parenthetical and narrative citations in APA 7th edition format with a keyboard shortcut, ensuring the formatting is never typographically wrong.
3. **Instant reference list generation**: Generates the final bibliography with a hanging indent and strict alphabetical order in one click.
4. **Zero Turnitin discrepancies**: Prevents mismatches between authors cited in the text and authors listed in the references, one of the most frequent observations when reviewing a bibliography.

**Mini Ecosystem 04** has a complete step-by-step Zotero 7 setup guide.`,
    pt: `📚 **O que é o Zotero 7 e por que é indispensável para sua tese?**

O Zotero é um gerenciador bibliográfico de código aberto que automatiza a coleta, organização e citação de fontes acadêmicas:
1. **Zotero Connector**: Extensão de navegador que detecta artigos no Scopus, Google Scholar ou repositórios e os salva com um clique, com metadados completos (autores, ano, DOI, periódico).
2. **Integração com Microsoft Word e Google Docs**: Insere citações parentéticas e narrativas em formato APA 7ª edição com um atalho de teclado, garantindo que o formato nunca tenha falhas tipográficas.
3. **Geração instantânea de Referências**: Com um clique gera a lista bibliográfica final com recuo francês e ordem alfabética estrita.
4. **Zero discrepâncias no Turnitin**: Evita a falta de correspondência entre autores citados no texto e autores referenciados no final, uma das observações mais frequentes ao revisar a bibliografia.

No **Mini Ecossistema 04** você tem um guia completo de configuração passo a passo do Zotero 7.`,
    fr: `📚 **Qu'est-ce que Zotero 7 et pourquoi est-il indispensable pour votre mémoire ?**

Zotero est un gestionnaire bibliographique open source qui automatise la collecte, l'organisation et la citation des sources académiques :
1. **Zotero Connector** : Extension de navigateur qui détecte les articles sur Scopus, Google Scholar ou les dépôts et les enregistre en un clic avec les métadonnées complètes (auteurs, année, DOI, revue).
2. **Intégration avec Microsoft Word et Google Docs** : Insère des citations parenthétiques et narratives au format APA 7e édition via un raccourci clavier, garantissant qu'aucune erreur typographique ne se glisse dans le format.
3. **Génération instantanée des références** : Génère en un clic la liste bibliographique finale avec retrait négatif et ordre alphabétique strict.
4. **Zéro écart dans Turnitin** : Évite les décalages entre les auteurs cités dans le texte et les auteurs référencés en fin de document, l'une des observations les plus fréquentes lors de la révision de la bibliographie.

Le **Mini-écosystème 04** propose un guide complet de configuration pas à pas de Zotero 7.`,
    it: `📚 **Che cos'è Zotero 7 e perché è indispensabile per la tua tesi?**

Zotero è un gestore bibliografico open source che automatizza la raccolta, l'organizzazione e la citazione delle fonti accademiche:
1. **Zotero Connector**: Estensione del browser che rileva articoli su Scopus, Google Scholar o repository e li salva con un clic, con metadati completi (autori, anno, DOI, rivista).
2. **Integrazione con Microsoft Word e Google Docs**: Inserisce citazioni parentetiche e narrative in formato APA 7ª edizione con una scorciatoia da tastiera, garantendo che il formato non abbia mai errori tipografici.
3. **Generazione istantanea dei riferimenti**: Con un clic genera l'elenco bibliografico finale con rientro alla francese e ordine alfabetico rigoroso.
4. **Zero discrepanze su Turnitin**: Evita la mancata corrispondenza tra autori citati nel testo e autori nei riferimenti finali, una delle osservazioni più frequenti nella revisione della bibliografia.

Nel **Mini Ecosistema 04** trovi una guida completa passo-passo alla configurazione di Zotero 7.`,
  },

  'tutor.kb.capitulos': {
    es: `🏛️ **Estructura canónica de los 5 capítulos de titulación**

1. **Capítulo 1: El Problema**: Contextualización macro, meso y micro; formulación de preguntas de investigación, objetivos generales y específicos (SMART), y justificación del estudio.
2. **Capítulo 2: Marco Teórico**: Antecedentes investigativos contemporáneos (artículos indexados de los últimos 5 años), fundamentación teórica y conceptualización de variables.
3. **Capítulo 3: Metodología**: Enfoque epistemológico, tipo y diseño de investigación, delimitación de la población, cálculo de muestra, técnicas e instrumentos de recolección de datos.
4. **Capítulo 4: Resultados**: Procesamiento de datos, estadística descriptiva e inferencial, y comprobación de hipótesis.
5. **Capítulo 5: Discusión y Conclusiones**: Triangulación de los hallazgos con la literatura del Capítulo 2, conclusiones y recomendaciones prácticas.

Puedes explorar cada uno en detalle en el **Mini Ecosistema 02 (Los 5 Capítulos)**. Verifica siempre el número y el orden de capítulos que exige el formato de titulación de tu universidad: esta es la estructura más extendida, pero cada institución la adapta.`,
    en: `🏛️ **Canonical structure of the 5 thesis chapters**

1. **Chapter 1: The Problem**: Macro, Meso and Micro contextualization; formulation of research questions, general and specific (SMART) objectives, and rationale for the study.
2. **Chapter 2: Theoretical Framework**: Contemporary research background (indexed articles from the last 5 years), theoretical foundation and conceptualization of variables.
3. **Chapter 3: Methodology**: Epistemological approach, type and design of the research, population delimitation, sample calculation, and data collection techniques and instruments.
4. **Chapter 4: Results**: Data processing, descriptive and inferential statistics, and hypothesis testing.
5. **Chapter 5: Discussion and Conclusions**: Triangulation of findings with the literature from Chapter 2, conclusions and practical recommendations.

You can explore each one in detail in **Mini Ecosystem 02 (The 5 Chapters)**. Always check the number and order of chapters required by your university's thesis format: this is the most widespread structure, but every institution adapts it.`,
    pt: `🏛️ **Estrutura canônica dos 5 capítulos de titulação**

1. **Capítulo 1: O Problema**: Contextualização macro, meso e micro; formulação de perguntas de pesquisa, objetivos gerais e específicos (SMART), e justificativa do estudo.
2. **Capítulo 2: Marco Teórico**: Antecedentes investigativos contemporâneos (artigos indexados dos últimos 5 anos), fundamentação teórica e conceituação de variáveis.
3. **Capítulo 3: Metodologia**: Abordagem epistemológica, tipo e desenho da pesquisa, delimitação da população, cálculo de amostra, técnicas e instrumentos de coleta de dados.
4. **Capítulo 4: Resultados**: Processamento de dados, estatística descritiva e inferencial, e comprovação de hipóteses.
5. **Capítulo 5: Discussão e Conclusões**: Triangulação dos achados com a literatura do Capítulo 2, conclusões e recomendações práticas.

Você pode explorar cada um em detalhe no **Mini Ecossistema 02 (Os 5 Capítulos)**. Verifique sempre o número e a ordem de capítulos exigidos pelo formato de titulação da sua universidade: esta é a estrutura mais difundida, mas cada instituição a adapta.`,
    fr: `🏛️ **Structure canonique des 5 chapitres du mémoire**

1. **Chapitre 1 : Le problème** : Contextualisation macro, méso et micro ; formulation des questions de recherche, objectifs généraux et spécifiques (SMART), et justification de l'étude.
2. **Chapitre 2 : Cadre théorique** : Antécédents de recherche contemporains (articles indexés des 5 dernières années), fondement théorique et conceptualisation des variables.
3. **Chapitre 3 : Méthodologie** : Approche épistémologique, type et plan de recherche, délimitation de la population, calcul de l'échantillon, techniques et instruments de collecte de données.
4. **Chapitre 4 : Résultats** : Traitement des données, statistiques descriptives et inférentielles, et vérification des hypothèses.
5. **Chapitre 5 : Discussion et conclusions** : Triangulation des résultats avec la littérature du chapitre 2, conclusions et recommandations pratiques.

Vous pouvez explorer chacun en détail dans le **Mini-écosystème 02 (Les 5 chapitres)**. Vérifiez toujours le nombre et l'ordre des chapitres exigés par le format de mémoire de votre université : il s'agit de la structure la plus répandue, mais chaque établissement l'adapte.`,
    it: `🏛️ **Struttura canonica dei 5 capitoli di tesi**

1. **Capitolo 1: Il Problema**: Contestualizzazione macro, meso e micro; formulazione delle domande di ricerca, obiettivi generali e specifici (SMART) e giustificazione dello studio.
2. **Capitolo 2: Quadro Teorico**: Precedenti di ricerca contemporanei (articoli indicizzati degli ultimi 5 anni), fondazione teorica e concettualizzazione delle variabili.
3. **Capitolo 3: Metodologia**: Approccio epistemologico, tipo e disegno della ricerca, delimitazione della popolazione, calcolo del campione, tecniche e strumenti di raccolta dati.
4. **Capitolo 4: Risultati**: Elaborazione dei dati, statistica descrittiva e inferenziale, e verifica delle ipotesi.
5. **Capitolo 5: Discussione e Conclusioni**: Triangolazione dei risultati con la letteratura del Capitolo 2, conclusioni e raccomandazioni pratiche.

Puoi esplorare ciascuno in dettaglio nel **Mini Ecosistema 02 (I 5 Capitoli)**. Verifica sempre il numero e l'ordine dei capitoli richiesti dal formato di tesi della tua università: questa è la struttura più diffusa, ma ogni istituzione la adatta.`,
  },

  'tutor.kb.cuantitativo': {
    es: `📊 **Diferenciación epistemológica: enfoque cuantitativo vs. cualitativo**

**Enfoque Cuantitativo**
- Se orienta a la medición numérica de variables y al análisis estadístico inferencial.
- Busca probar hipótesis preestablecidas mediante muestras probabilísticas representativas.
- Instrumentos característicos: Cuestionarios estructurados con escala Likert y registros estandarizados.

**Enfoque Cualitativo**
- Explora significados, percepciones y experiencias de los sujetos de investigación.
- No busca generalización probabilística ni prueba numérica de hipótesis.
- Instrumentos característicos: Entrevistas a profundidad, grupos focales y análisis documental.`,
    en: `📊 **Epistemological differentiation: quantitative vs. qualitative approach**

**Quantitative Approach**
- Focused on numerical measurement of variables and inferential statistical analysis.
- Seeks to test pre-established hypotheses through representative probabilistic samples.
- Typical instruments: Structured questionnaires with a Likert scale and standardized records.

**Qualitative Approach**
- Explores the meanings, perceptions and experiences of research subjects.
- Does not seek probabilistic generalization or numerical hypothesis testing.
- Typical instruments: In-depth interviews, focus groups and document analysis.`,
    pt: `📊 **Diferenciação epistemológica: abordagem quantitativa vs. qualitativa**

**Abordagem Quantitativa**
- Orienta-se para a medição numérica de variáveis e a análise estatística inferencial.
- Busca comprovar hipóteses pré-estabelecidas por meio de amostras probabilísticas representativas.
- Instrumentos característicos: Questionários estruturados com escala Likert e registros padronizados.

**Abordagem Qualitativa**
- Explora significados, percepções e experiências dos sujeitos de pesquisa.
- Não busca generalização probabilística nem comprovação numérica de hipóteses.
- Instrumentos característicos: Entrevistas em profundidade, grupos focais e análise documental.`,
    fr: `📊 **Différenciation épistémologique : approche quantitative vs qualitative**

**Approche quantitative**
- Vise la mesure numérique des variables et l'analyse statistique inférentielle.
- Cherche à tester des hypothèses préétablies au moyen d'échantillons probabilistes représentatifs.
- Instruments caractéristiques : Questionnaires structurés à échelle de Likert et relevés standardisés.

**Approche qualitative**
- Explore les significations, perceptions et expériences des sujets de recherche.
- Ne cherche ni généralisation probabiliste ni preuve numérique d'hypothèses.
- Instruments caractéristiques : Entretiens approfondis, groupes de discussion et analyse documentaire.`,
    it: `📊 **Differenziazione epistemologica: approccio quantitativo vs. qualitativo**

**Approccio Quantitativo**
- Si orienta verso la misurazione numerica delle variabili e l'analisi statistica inferenziale.
- Cerca di verificare ipotesi prestabilite mediante campioni probabilistici rappresentativi.
- Strumenti caratteristici: Questionari strutturati con scala Likert e registrazioni standardizzate.

**Approccio Qualitativo**
- Esplora significati, percezioni ed esperienze dei soggetti di ricerca.
- Non cerca generalizzazione probabilistica né prova numerica di ipotesi.
- Strumenti caratteristici: Interviste in profondità, focus group e analisi documentale.`,
  },

  'tutor.kb.software': {
    es: `💻 **Software recomendado en el Mini Ecosistema 05 (Toolbox)**

- **Jamovi**: Software libre y gratuito de interfaz moderna basado en R. Es ideal para pruebas de normalidad (Shapiro-Wilk), correlaciones de Pearson/Spearman, regresiones lineales y pruebas T.
- **SPSS**: Estándar comercial para estadística descriptiva, tablas de contingencia, fiabilidad de instrumentos (Alfa de Cronbach, Omega de McDonald) y análisis factorial.
- **VOSviewer**: Genera mapas bibliométricos para el estado del arte mostrando redes de co-citación de autores y palabras clave indexadas.
- **Connected Papers**: Permite descubrir artículos seminales y derivados a partir de un artículo semilla mediante grafos visuales de citas.
- **Zotero**: Gestor de referencias bibliográficas de código abierto para redactar sin errores en APA 7.`,
    en: `💻 **Recommended software in Mini Ecosystem 05 (Toolbox)**

- **Jamovi**: Free and open-source software with a modern interface, based on R. Ideal for normality tests (Shapiro-Wilk), Pearson/Spearman correlations, linear regressions and T-tests.
- **SPSS**: Commercial standard for descriptive statistics, contingency tables, instrument reliability (Cronbach's Alpha, McDonald's Omega) and factor analysis.
- **VOSviewer**: Generates bibliometric maps for the state of the art, showing co-citation networks of authors and indexed keywords.
- **Connected Papers**: Lets you discover seminal and derivative articles from a seed article through visual citation graphs.
- **Zotero**: Open-source bibliographic reference manager for error-free APA 7 writing.`,
    pt: `💻 **Software recomendado no Mini Ecossistema 05 (Toolbox)**

- **Jamovi**: Software livre e gratuito de interface moderna baseado em R. Ideal para testes de normalidade (Shapiro-Wilk), correlações de Pearson/Spearman, regressões lineares e testes T.
- **SPSS**: Padrão comercial para estatística descritiva, tabelas de contingência, confiabilidade de instrumentos (Alfa de Cronbach, Ômega de McDonald) e análise fatorial.
- **VOSviewer**: Gera mapas bibliométricos para o estado da arte, mostrando redes de cocitação de autores e palavras-chave indexadas.
- **Connected Papers**: Permite descobrir artigos seminais e derivados a partir de um artigo semente por meio de grafos visuais de citações.
- **Zotero**: Gerenciador de referências bibliográficas de código aberto para redigir sem erros em APA 7.`,
    fr: `💻 **Logiciels recommandés dans le Mini-écosystème 05 (Toolbox)**

- **Jamovi** : Logiciel libre et gratuit à l'interface moderne basé sur R. Idéal pour les tests de normalité (Shapiro-Wilk), les corrélations de Pearson/Spearman, les régressions linéaires et les tests T.
- **SPSS** : Référence commerciale pour les statistiques descriptives, les tableaux de contingence, la fiabilité des instruments (alpha de Cronbach, oméga de McDonald) et l'analyse factorielle.
- **VOSviewer** : Génère des cartes bibliométriques de l'état de l'art, montrant les réseaux de co-citation d'auteurs et de mots-clés indexés.
- **Connected Papers** : Permet de découvrir des articles fondateurs et dérivés à partir d'un article de départ grâce à des graphes de citations visuels.
- **Zotero** : Gestionnaire de références bibliographiques open source pour rédiger sans erreurs en APA 7.`,
    it: `💻 **Software consigliato nel Mini Ecosistema 05 (Toolbox)**

- **Jamovi**: Software libero e gratuito con interfaccia moderna basato su R. Ideale per test di normalità (Shapiro-Wilk), correlazioni di Pearson/Spearman, regressioni lineari e test T.
- **SPSS**: Standard commerciale per statistica descrittiva, tabelle di contingenza, affidabilità degli strumenti (Alfa di Cronbach, Omega di McDonald) e analisi fattoriale.
- **VOSviewer**: Genera mappe bibliometriche per lo stato dell'arte, mostrando reti di co-citazione di autori e parole chiave indicizzate.
- **Connected Papers**: Permette di scoprire articoli seminali e derivati a partire da un articolo seme tramite grafi visivi di citazioni.
- **Zotero**: Gestore di riferimenti bibliografici open source per scrivere senza errori in APA 7.`,
  },

  'tutor.kb.variables': {
    es: `🎯 **Variables de investigación: independiente vs. dependiente**

- **Variable Independiente (VI - Causa / X)**: Es la variable antecedente que influye, genera o predice un cambio sobre la otra variable (ej: *Estrategias de gamificación docente* o *Implementación de sistemas ERP*).
- **Variable Dependiente (VD - Efecto / Y)**: Es el fenómeno, conducta o métrica observada que se ve alterada por la acción de la variable independiente (ej: *Rendimiento académico* o *Eficiencia operativa financiera*).
- **Operacionalización**: Ambas variables deben desglosarse en la Matriz de Consistencia en: Definición conceptual, Definición operacional, Dimensiones, Indicadores e Ítems del instrumento.`,
    en: `🎯 **Research variables: independent vs. dependent**

- **Independent Variable (IV – Cause / X)**: The antecedent variable that influences, generates or predicts a change in the other variable (e.g. *teacher gamification strategies* or *ERP system implementation*).
- **Dependent Variable (DV – Effect / Y)**: The observed phenomenon, behavior or metric that is altered by the action of the independent variable (e.g. *academic performance* or *financial operating efficiency*).
- **Operationalization**: Both variables must be broken down in the Consistency Matrix into: Conceptual definition, Operational definition, Dimensions, Indicators and Instrument items.`,
    pt: `🎯 **Variáveis de pesquisa: independente vs. dependente**

- **Variável Independente (VI – Causa / X)**: É a variável antecedente que influencia, gera ou prediz uma mudança na outra variável (ex.: *estratégias de gamificação docente* ou *implementação de sistemas ERP*).
- **Variável Dependente (VD – Efeito / Y)**: É o fenômeno, comportamento ou métrica observada que é alterada pela ação da variável independente (ex.: *desempenho acadêmico* ou *eficiência operacional financeira*).
- **Operacionalização**: Ambas as variáveis devem ser desdobradas na Matriz de Consistência em: Definição conceitual, Definição operacional, Dimensões, Indicadores e Itens do instrumento.`,
    fr: `🎯 **Variables de recherche : indépendante vs dépendante**

- **Variable indépendante (VI – Cause / X)** : C'est la variable antécédente qui influence, génère ou prédit un changement sur l'autre variable (ex. : *stratégies de gamification enseignante* ou *mise en œuvre de systèmes ERP*).
- **Variable dépendante (VD – Effet / Y)** : C'est le phénomène, le comportement ou la mesure observée qui est modifié par l'action de la variable indépendante (ex. : *performance académique* ou *efficacité opérationnelle financière*).
- **Opérationnalisation** : Les deux variables doivent être décomposées dans la matrice de cohérence en : Définition conceptuelle, Définition opérationnelle, Dimensions, Indicateurs et Items de l'instrument.`,
    it: `🎯 **Variabili di ricerca: indipendente vs. dipendente**

- **Variabile Indipendente (VI – Causa / X)**: È la variabile antecedente che influenza, genera o predice un cambiamento sull'altra variabile (es.: *strategie di gamification didattica* o *implementazione di sistemi ERP*).
- **Variabile Dipendente (VD – Effetto / Y)**: È il fenomeno, comportamento o metrica osservata che viene alterata dall'azione della variabile indipendente (es.: *rendimento accademico* o *efficienza operativa finanziaria*).
- **Operazionalizzazione**: Entrambe le variabili devono essere scomposte nella Matrice di Coerenza in: Definizione concettuale, Definizione operativa, Dimensioni, Indicatori e Item dello strumento.`,
  },

  'tutor.kb.turnitin': {
    es: `🛡️ **Prevención de similitud inapropiada en Turnitin**

1. **Parafraseo Sintético**: Comprender la idea central de la fuente original y redactarla con léxico propio y análisis crítico, evitando el mero reemplazo de palabras por sinónimos.
2. **Atribución Obligatoria**: Toda idea tomada de terceros debe incluir su correspondiente cita parentética o narrativa, independientemente de que se haya parafraseado.
3. **Citas Textuales Justificadas**: Emplear citas directas únicamente cuando la literalidad del texto original resulte indispensable, acompañadas de su respectiva página.
4. **Filtros Institucionales**: Verificar que en los ajustes del informe se excluya la bibliografía y las coincidencias menores de 1% según el reglamento de titulación.`,
    en: `🛡️ **Preventing improper similarity in Turnitin**

1. **Synthetic paraphrasing**: Understand the source's core idea and rewrite it in your own words with critical analysis, avoiding the mere replacement of words with synonyms.
2. **Mandatory attribution**: Every idea taken from others must include its corresponding parenthetical or narrative citation, regardless of whether it was paraphrased.
3. **Justified direct quotes**: Use direct quotes only when the literal wording of the original text is indispensable, accompanied by the page number.
4. **Institutional filters**: Verify in the report settings that the bibliography and matches under 1% are excluded, per your institution's thesis regulations.`,
    pt: `🛡️ **Prevenção de similaridade inadequada no Turnitin**

1. **Paráfrase Sintética**: Compreender a ideia central da fonte original e redigi-la com léxico próprio e análise crítica, evitando a mera substituição de palavras por sinônimos.
2. **Atribuição Obrigatória**: Toda ideia tomada de terceiros deve incluir sua respectiva citação parentética ou narrativa, independentemente de ter sido parafraseada.
3. **Citações Textuais Justificadas**: Usar citações diretas apenas quando a literalidade do texto original for indispensável, acompanhadas de sua respectiva página.
4. **Filtros Institucionais**: Verificar que, nas configurações do relatório, a bibliografia e as coincidências menores de 1% sejam excluídas, conforme o regulamento de titulação.`,
    fr: `🛡️ **Prévenir une similarité inappropriée dans Turnitin**

1. **Paraphrase synthétique** : Comprendre l'idée centrale de la source originale et la reformuler avec son propre vocabulaire et une analyse critique, en évitant le simple remplacement de mots par des synonymes.
2. **Attribution obligatoire** : Toute idée empruntée à des tiers doit comporter sa citation parenthétique ou narrative correspondante, qu'elle ait été paraphrasée ou non.
3. **Citations textuelles justifiées** : N'utiliser des citations directes que lorsque la littéralité du texte original est indispensable, accompagnées de la page correspondante.
4. **Filtres institutionnels** : Vérifier, dans les paramètres du rapport, que la bibliographie et les correspondances inférieures à 1 % sont exclues, conformément au règlement de fin d'études.`,
    it: `🛡️ **Prevenire una similarità impropria su Turnitin**

1. **Parafrasi sintetica**: Comprendere l'idea centrale della fonte originale e riscriverla con lessico proprio e analisi critica, evitando la mera sostituzione di parole con sinonimi.
2. **Attribuzione obbligatoria**: Ogni idea presa da terzi deve includere la relativa citazione parentetica o narrativa, indipendentemente dal fatto che sia stata parafrasata.
3. **Citazioni testuali giustificate**: Usare citazioni dirette solo quando la letteralità del testo originale è indispensabile, accompagnate dalla relativa pagina.
4. **Filtri istituzionali**: Verificare che nelle impostazioni del report siano esclusi la bibliografia e le corrispondenze inferiori all'1%, secondo il regolamento di tesi.`,
  },

  'tutor.kb.revision_borrador': {
    es: `📝 **Cómo funciona el Revisor de Borrador (Módulo 07)**

Sube tu Avance 1 o Avance 2 en \`.docx\` o pega el texto, y el módulo emite un diagnóstico automatizado de **forma y estructura**. Todo se procesa en tu navegador: el documento no se sube a ningún servidor.

**Qué revisa, por área**
- **Estructura**: presencia de las secciones obligatorias del formato (Resumen, Abstract, 1.1 Descripción, 1.2 Propósito, 1.3 Base conceptual, 2.1 Requerimientos, 3.1 Metodología, 3.2 Diseño, 3.3 Desarrollo, Conclusiones, Recomendaciones, Referencias, Anexos y Anexo de información académica).
- **Resumen y abstract**: extensión entre 150 y 250 palabras, presencia de palabras clave y keywords.
- **Objetivos**: que el general inicie con verbo en infinitivo de Bloom, que existan 3 específicos y que no repitan verbo.
- **Requerimientos**: codificación RF/RNF, columna de prioridad y referencia al estándar IEEE 830.
- **Metodología**: metodología nombrada, justificada y desglosada en fases o sprints, más cronograma.
- **Diseño y desarrollo**: cobertura de diagramas, arquitectura declarada, diccionario de datos y casos de prueba.
- **Citas y referencias**: número de citas frente a referencias, vigencia de las fuentes, presencia de DOI y uso correcto de *et al.*
- **Redacción académica**: primera persona, verbos en futuro donde debería ir pasado, oraciones largas y conectores.
- **Formato editorial**: numeración de tablas y figuras, declaración de fuente e informe de originalidad.

⚠️ El diagnóstico es **orientativo**: revisa la forma, no el fondo científico. Un puntaje alto no significa que el trabajo esté aprobado; esa decisión es siempre del docente o tutor.`,
    en: `📝 **How the Draft Reviewer works (Module 07)**

Upload your Advance 1 or Advance 2 in \`.docx\` format or paste the text, and the module issues an automated diagnosis of its **form and structure**. Everything is processed in your browser: the document is never uploaded to any server.

**What it checks, by area**
- **Structure**: presence of the sections required by the format (Summary, Abstract, 1.1 Description, 1.2 Purpose, 1.3 Conceptual basis, 2.1 Requirements, 3.1 Methodology, 3.2 Design, 3.3 Development, Conclusions, Recommendations, References, Appendices and Academic information appendix).
- **Summary and abstract**: length between 150 and 250 words, presence of keywords and their English equivalent.
- **Objectives**: whether the general one starts with a Bloom's infinitive verb, whether there are 3 specific ones, and that no verb repeats.
- **Requirements**: RF/RNF coding, priority column and reference to the IEEE 830 standard.
- **Methodology**: a named, justified methodology broken into phases or sprints, plus a timeline.
- **Design and development**: coverage of diagrams, declared architecture, data dictionary and test cases.
- **Citations and references**: number of citations vs. references, currency of sources, presence of DOIs and correct use of *et al.*
- **Academic writing**: first person, future-tense verbs where past should be used, run-on sentences and connectors.
- **Editorial format**: numbering of tables and figures, source declaration and originality report.

⚠️ This diagnosis is **guidance only**: it checks form, not scientific substance. A high score doesn't mean the work is approved; that decision always rests with the teacher or advisor.`,
    pt: `📝 **Como funciona o Revisor de Rascunho (Módulo 07)**

Envie seu Avanço 1 ou Avanço 2 em \`.docx\` ou cole o texto, e o módulo emite um diagnóstico automatizado de **forma e estrutura**. Tudo é processado no seu navegador: o documento nunca é enviado a nenhum servidor.

**O que verifica, por área**
- **Estrutura**: presença das seções obrigatórias do formato (Resumo, Abstract, 1.1 Descrição, 1.2 Propósito, 1.3 Base conceitual, 2.1 Requisitos, 3.1 Metodologia, 3.2 Desenho, 3.3 Desenvolvimento, Conclusões, Recomendações, Referências, Anexos e Anexo de informação acadêmica).
- **Resumo e abstract**: extensão entre 150 e 250 palavras, presença de palavras-chave e keywords.
- **Objetivos**: se o geral inicia com verbo no infinitivo de Bloom, se existem 3 específicos e se não repetem verbo.
- **Requisitos**: codificação RF/RNF, coluna de prioridade e referência ao padrão IEEE 830.
- **Metodologia**: metodologia nomeada, justificada e desdobrada em fases ou sprints, mais cronograma.
- **Desenho e desenvolvimento**: cobertura de diagramas, arquitetura declarada, dicionário de dados e casos de teste.
- **Citações e referências**: número de citações frente a referências, atualidade das fontes, presença de DOI e uso correto de *et al.*
- **Redação acadêmica**: primeira pessoa, verbos no futuro onde deveria estar no passado, frases longas e conectores.
- **Formato editorial**: numeração de tabelas e figuras, declaração de fonte e relatório de originalidade.

⚠️ O diagnóstico é **orientativo**: verifica a forma, não o conteúdo científico. Uma pontuação alta não significa que o trabalho está aprovado; essa decisão é sempre do professor ou orientador.`,
    fr: `📝 **Comment fonctionne le réviseur de brouillon (Module 07)**

Téléversez votre premier ou deuxième jalon au format \`.docx\` ou collez le texte, et le module émet un diagnostic automatisé de sa **forme et sa structure**. Tout est traité dans votre navigateur : le document n'est jamais envoyé à un serveur.

**Ce qu'il vérifie, par domaine**
- **Structure** : présence des sections obligatoires du format (Résumé, Abstract, 1.1 Description, 1.2 Objet, 1.3 Base conceptuelle, 2.1 Exigences, 3.1 Méthodologie, 3.2 Conception, 3.3 Développement, Conclusions, Recommandations, Références, Annexes et Annexe d'information académique).
- **Résumé et abstract** : longueur entre 150 et 250 mots, présence de mots-clés et de leurs équivalents anglais.
- **Objectifs** : si l'objectif général commence par un verbe de Bloom à l'infinitif, s'il y a bien 3 objectifs spécifiques et qu'aucun verbe n'est répété.
- **Exigences** : codification RF/RNF, colonne de priorité et référence à la norme IEEE 830.
- **Méthodologie** : une méthodologie nommée, justifiée et découpée en phases ou sprints, plus un calendrier.
- **Conception et développement** : couverture des diagrammes, architecture déclarée, dictionnaire de données et cas de test.
- **Citations et références** : nombre de citations par rapport aux références, actualité des sources, présence de DOI et bon usage de *et al.*
- **Rédaction académique** : première personne, verbes au futur là où le passé conviendrait, phrases trop longues et connecteurs.
- **Format éditorial** : numérotation des tableaux et figures, déclaration de la source et rapport d'originalité.

⚠️ Ce diagnostic est **indicatif** : il vérifie la forme, pas le contenu scientifique. Un score élevé ne signifie pas que le travail est approuvé ; cette décision revient toujours à l'enseignant ou au directeur.`,
    it: `📝 **Come funziona il Revisore di Bozza (Modulo 07)**

Carica il tuo primo o secondo avanzamento in \`.docx\` oppure incolla il testo, e il modulo emette una diagnosi automatizzata di **forma e struttura**. Tutto viene elaborato nel tuo browser: il documento non viene mai caricato su alcun server.

**Cosa verifica, per area**
- **Struttura**: presenza delle sezioni obbligatorie del formato (Riassunto, Abstract, 1.1 Descrizione, 1.2 Scopo, 1.3 Base concettuale, 2.1 Requisiti, 3.1 Metodologia, 3.2 Disegno, 3.3 Sviluppo, Conclusioni, Raccomandazioni, Riferimenti, Allegati e Allegato di informazione accademica).
- **Riassunto e abstract**: lunghezza tra 150 e 250 parole, presenza di parole chiave ed equivalenti in inglese.
- **Obiettivi**: se quello generale inizia con un verbo all'infinito di Bloom, se ci sono 3 specifici e se non ripetono il verbo.
- **Requisiti**: codifica RF/RNF, colonna di priorità e riferimento allo standard IEEE 830.
- **Metodologia**: metodologia nominata, giustificata e suddivisa in fasi o sprint, più cronoprogramma.
- **Disegno e sviluppo**: copertura di diagrammi, architettura dichiarata, dizionario dei dati e casi di test.
- **Citazioni e riferimenti**: numero di citazioni rispetto ai riferimenti, attualità delle fonti, presenza di DOI e uso corretto di *et al.*
- **Scrittura accademica**: prima persona, verbi al futuro dove dovrebbe esserci il passato, frasi lunghe e connettori.
- **Formato editoriale**: numerazione di tabelle e figure, dichiarazione della fonte e report di originalità.

⚠️ La diagnosi è **orientativa**: verifica la forma, non il contenuto scientifico. Un punteggio alto non significa che il lavoro sia approvato; questa decisione spetta sempre al docente o relatore.`,
  },

  'tutor.kb.estructura_documento': {
    es: `🏛️ **Estructura completa del documento de titulación**

**Preliminares**
1. Portada institucional con facultad, carrera, modalidad, autores y tutor.
2. Ficha de registro del repositorio nacional (título, autores, áreas temáticas, palabras clave, resumen y abstract).
3. Certificado del sistema antiplagio y certificado del tutor.
4. Declaración de autoría con la bitácora fechada de tutorías y sus evidencias.
5. Tabla de contenido, índice de tablas e índice de figuras, todos con paginado automático.

**Cuerpo**
6. **RESUMEN** (150-250 palabras) + Palabras clave.
7. **ABSTRACT** + Keywords.
8. **1. Introducción**: 1.1 Descripción, 1.2 Propósito del caso (objetivo general y específicos), 1.3 Base conceptual.
9. **2. Análisis del caso**: 2.1 Requerimientos (alternativas evaluadas, RF y RNF).
10. **3. Diseño y desarrollo del trabajo práctico**: 3.1 Metodología, 3.2 Diseño, 3.3 Desarrollo.
11. **4. Conclusiones y recomendaciones**.
12. **Referencias** en APA 7ª edición.
13. **Anexos** y **Anexo de información académica** (aporte de cada asignatura, innovación y producto desarrollado).

*Cada capítulo responde una pregunta distinta*: el 1 explica por qué el problema existe, el 2 qué debe hacer la solución, el 3 cómo se construyó y el 4 qué se logró. Si un contenido no responde la pregunta del capítulo, está en el lugar equivocado.`,
    en: `🏛️ **Complete structure of the thesis document**

**Preliminary pages**
1. Institutional cover page with faculty, program, mode of study, authors and advisor.
2. National repository registration form (title, authors, subject areas, keywords, summary and abstract).
3. Anti-plagiarism system certificate and advisor's certificate.
4. Declaration of authorship with the dated log of advising sessions and their evidence.
5. Table of contents, list of tables and list of figures, all with automatic pagination.

**Body**
6. **SUMMARY** (150-250 words) + Keywords.
7. **ABSTRACT** + Keywords.
8. **1. Introduction**: 1.1 Description, 1.2 Purpose of the case (general and specific objectives), 1.3 Conceptual basis.
9. **2. Case analysis**: 2.1 Requirements (alternatives evaluated, functional and non-functional requirements).
10. **3. Design and development of the practical work**: 3.1 Methodology, 3.2 Design, 3.3 Development.
11. **4. Conclusions and recommendations**.
12. **References** in APA 7th edition.
13. **Appendices** and **Academic information appendix** (each course's contribution, innovation and product developed).

*Each chapter answers a different question*: Chapter 1 explains why the problem exists, Chapter 2 what the solution should do, Chapter 3 how it was built, and Chapter 4 what was achieved. If a piece of content doesn't answer its chapter's question, it's in the wrong place.`,
    pt: `🏛️ **Estrutura completa do documento de titulação**

**Elementos pré-textuais**
1. Capa institucional com faculdade, curso, modalidade, autores e orientador.
2. Ficha de registro do repositório nacional (título, autores, áreas temáticas, palavras-chave, resumo e abstract).
3. Certificado do sistema antiplágio e certificado do orientador.
4. Declaração de autoria com o registro datado das orientações e suas evidências.
5. Sumário, lista de tabelas e lista de figuras, todos com paginação automática.

**Corpo**
6. **RESUMO** (150-250 palavras) + Palavras-chave.
7. **ABSTRACT** + Keywords.
8. **1. Introdução**: 1.1 Descrição, 1.2 Propósito do caso (objetivo geral e específicos), 1.3 Base conceitual.
9. **2. Análise do caso**: 2.1 Requisitos (alternativas avaliadas, RF e RNF).
10. **3. Desenho e desenvolvimento do trabalho prático**: 3.1 Metodologia, 3.2 Desenho, 3.3 Desenvolvimento.
11. **4. Conclusões e recomendações**.
12. **Referências** em APA 7ª edição.
13. **Anexos** e **Anexo de informação acadêmica** (contribuição de cada disciplina, inovação e produto desenvolvido).

*Cada capítulo responde a uma pergunta diferente*: o 1 explica por que o problema existe, o 2 o que a solução deve fazer, o 3 como foi construída e o 4 o que foi alcançado. Se um conteúdo não responde à pergunta do capítulo, está no lugar errado.`,
    fr: `🏛️ **Structure complète du document de fin d'études**

**Pages liminaires**
1. Page de garde institutionnelle avec faculté, filière, modalité, auteurs et directeur.
2. Fiche d'enregistrement du dépôt national (titre, auteurs, domaines thématiques, mots-clés, résumé et abstract).
3. Certificat du système antiplagiat et certificat du directeur.
4. Déclaration de paternité avec le journal daté des séances d'encadrement et leurs preuves.
5. Table des matières, liste des tableaux et liste des figures, toutes avec pagination automatique.

**Corps du document**
6. **RÉSUMÉ** (150-250 mots) + Mots-clés.
7. **ABSTRACT** + Keywords.
8. **1. Introduction** : 1.1 Description, 1.2 Objet du cas (objectif général et spécifiques), 1.3 Base conceptuelle.
9. **2. Analyse du cas** : 2.1 Exigences (alternatives évaluées, exigences fonctionnelles et non fonctionnelles).
10. **3. Conception et développement du travail pratique** : 3.1 Méthodologie, 3.2 Conception, 3.3 Développement.
11. **4. Conclusions et recommandations**.
12. **Références** en APA 7e édition.
13. **Annexes** et **Annexe d'information académique** (apport de chaque matière, innovation et produit développé).

*Chaque chapitre répond à une question différente* : le 1 explique pourquoi le problème existe, le 2 ce que la solution doit faire, le 3 comment elle a été construite et le 4 ce qui a été accompli. Si un contenu ne répond pas à la question de son chapitre, il n'est pas à sa place.`,
    it: `🏛️ **Struttura completa del documento di tesi**

**Pagine preliminari**
1. Copertina istituzionale con facoltà, corso di laurea, modalità, autori e relatore.
2. Scheda di registrazione del repository nazionale (titolo, autori, aree tematiche, parole chiave, riassunto e abstract).
3. Certificato del sistema antiplagio e certificato del relatore.
4. Dichiarazione di paternità con il registro datato degli incontri di tutoraggio e le relative evidenze.
5. Indice, elenco delle tabelle ed elenco delle figure, tutti con paginazione automatica.

**Corpo**
6. **RIASSUNTO** (150-250 parole) + Parole chiave.
7. **ABSTRACT** + Keywords.
8. **1. Introduzione**: 1.1 Descrizione, 1.2 Scopo del caso (obiettivo generale e specifici), 1.3 Base concettuale.
9. **2. Analisi del caso**: 2.1 Requisiti (alternative valutate, requisiti funzionali e non funzionali).
10. **3. Disegno e sviluppo del lavoro pratico**: 3.1 Metodologia, 3.2 Disegno, 3.3 Sviluppo.
11. **4. Conclusioni e raccomandazioni**.
12. **Riferimenti** in APA 7ª edizione.
13. **Allegati** e **Allegato di informazione accademica** (contributo di ogni materia, innovazione e prodotto sviluppato).

*Ogni capitolo risponde a una domanda diversa*: il 1 spiega perché il problema esiste, il 2 cosa deve fare la soluzione, il 3 come è stata costruita e il 4 cosa è stato raggiunto. Se un contenuto non risponde alla domanda del suo capitolo, si trova nel posto sbagliato.`,
  },

  'tutor.kb.objetivos': {
    es: `🎯 **Cómo redactar los objetivos de investigación**

**Fórmula del objetivo general**
\`Verbo en infinitivo + qué se hace + para qué + en qué población y contexto\`

Debe ser **uno solo**, medible y alcanzable con el trabajo que efectivamente vas a entregar. Ronda las 25 a 35 palabras porque tiene que cerrar el "para qué" y la unidad de análisis.

**Verbos según el nivel de Bloom**
- Diagnóstico: *Identificar, Describir, Caracterizar, Diagnosticar*
- Análisis: *Analizar, Comparar, Evaluar, Determinar*
- Creación: *Diseñar, Desarrollar, Implementar, Proponer, Construir*

**Objetivos específicos**
Son **tres**, secuenciales, y sumados deben producir el objetivo general:
1. Uno diagnostica o identifica los parámetros del problema.
2. Uno diseña la arquitectura o el modelo.
3. Uno desarrolla, implementa o valida el producto.

**Errores que se marcan de inmediato**
- Empezar con "El objetivo de este trabajo es..." en lugar del infinitivo directo.
- Repetir el mismo verbo en dos objetivos: revela que ambos miden lo mismo.
- Usar el mismo verbo del general en un específico.
- Formular un objetivo que no se pueda evidenciar con un entregable del documento.
- Incluir dos propósitos en una sola oración unidos por "y".

Cada objetivo específico debe tener después **su propia conclusión** en el capítulo 4.`,
    en: `🎯 **How to write research objectives**

**General objective formula**
\`Infinitive verb + what is done + for what purpose + in what population and context\`

It must be a **single** objective, measurable and achievable with the work you will actually deliver. Aim for 25 to 35 words, because it needs to close the "for what purpose" and the unit of analysis.

**Verbs by Bloom's level**
- Diagnosis: *Identify, Describe, Characterize, Diagnose*
- Analysis: *Analyze, Compare, Evaluate, Determine*
- Creation: *Design, Develop, Implement, Propose, Build*

**Specific objectives**
There are **three**, sequential, and together they must add up to the general objective:
1. One diagnoses or identifies the problem's parameters.
2. One designs the architecture or model.
3. One develops, implements or validates the product.

**Errors that get flagged immediately**
- Starting with "The objective of this work is..." instead of the direct infinitive.
- Repeating the same verb in two objectives: it reveals that both are measuring the same thing.
- Reusing the general objective's verb in a specific one.
- Formulating an objective that can't be evidenced by a deliverable in the document.
- Including two purposes in a single sentence joined by "and."

Each specific objective must later have **its own conclusion** in Chapter 4.`,
    pt: `🎯 **Como redigir os objetivos de pesquisa**

**Fórmula do objetivo geral**
\`Verbo no infinitivo + o que se faz + para quê + em qual população e contexto\`

Deve ser **um único** objetivo, mensurável e alcançável com o trabalho que você efetivamente vai entregar. Fique em torno de 25 a 35 palavras, porque precisa fechar o "para quê" e a unidade de análise.

**Verbos segundo o nível de Bloom**
- Diagnóstico: *Identificar, Descrever, Caracterizar, Diagnosticar*
- Análise: *Analisar, Comparar, Avaliar, Determinar*
- Criação: *Desenhar, Desenvolver, Implementar, Propor, Construir*

**Objetivos específicos**
São **três**, sequenciais, e somados devem produzir o objetivo geral:
1. Um diagnostica ou identifica os parâmetros do problema.
2. Um desenha a arquitetura ou o modelo.
3. Um desenvolve, implementa ou valida o produto.

**Erros marcados imediatamente**
- Começar com "O objetivo deste trabalho é..." em vez do infinitivo direto.
- Repetir o mesmo verbo em dois objetivos: revela que ambos medem a mesma coisa.
- Usar o mesmo verbo do geral em um específico.
- Formular um objetivo que não possa ser evidenciado com um entregável do documento.
- Incluir dois propósitos em uma única frase unidos por "e".

Cada objetivo específico deve ter depois **sua própria conclusão** no capítulo 4.`,
    fr: `🎯 **Comment rédiger les objectifs de recherche**

**Formule de l'objectif général**
\`Verbe à l'infinitif + ce qui est fait + dans quel but + pour quelle population et contexte\`

Il doit être **unique**, mesurable et atteignable avec le travail que vous allez effectivement livrer. Comptez 25 à 35 mots, car il doit clore le « dans quel but » et l'unité d'analyse.

**Verbes selon le niveau de Bloom**
- Diagnostic : *Identifier, Décrire, Caractériser, Diagnostiquer*
- Analyse : *Analyser, Comparer, Évaluer, Déterminer*
- Création : *Concevoir, Développer, Mettre en œuvre, Proposer, Construire*

**Objectifs spécifiques**
Ils sont **trois**, séquentiels, et leur somme doit produire l'objectif général :
1. L'un diagnostique ou identifie les paramètres du problème.
2. L'un conçoit l'architecture ou le modèle.
3. L'un développe, met en œuvre ou valide le produit.

**Erreurs immédiatement signalées**
- Commencer par « L'objectif de ce travail est... » au lieu de l'infinitif direct.
- Répéter le même verbe dans deux objectifs : cela révèle qu'ils mesurent la même chose.
- Réutiliser le verbe de l'objectif général dans un objectif spécifique.
- Formuler un objectif qui ne peut pas être justifié par un livrable du document.
- Inclure deux finalités dans une seule phrase reliées par « et ».

Chaque objectif spécifique doit ensuite avoir **sa propre conclusion** au chapitre 4.`,
    it: `🎯 **Come redigere gli obiettivi di ricerca**

**Formula dell'obiettivo generale**
\`Verbo all'infinito + cosa si fa + per quale scopo + in quale popolazione e contesto\`

Deve essere **uno solo**, misurabile e raggiungibile con il lavoro che effettivamente consegnerai. Punta a 25-35 parole, perché deve chiudere il "per quale scopo" e l'unità di analisi.

**Verbi secondo il livello di Bloom**
- Diagnosi: *Identificare, Descrivere, Caratterizzare, Diagnosticare*
- Analisi: *Analizzare, Confrontare, Valutare, Determinare*
- Creazione: *Progettare, Sviluppare, Implementare, Proporre, Costruire*

**Obiettivi specifici**
Sono **tre**, sequenziali, e sommati devono produrre l'obiettivo generale:
1. Uno diagnostica o identifica i parametri del problema.
2. Uno progetta l'architettura o il modello.
3. Uno sviluppa, implementa o convalida il prodotto.

**Errori segnalati immediatamente**
- Iniziare con "L'obiettivo di questo lavoro è..." invece dell'infinito diretto.
- Ripetere lo stesso verbo in due obiettivi: rivela che entrambi misurano la stessa cosa.
- Usare lo stesso verbo dell'obiettivo generale in uno specifico.
- Formulare un obiettivo che non può essere dimostrato con un deliverable del documento.
- Includere due scopi in un'unica frase uniti da "e".

Ogni obiettivo specifico deve poi avere **la propria conclusione** nel capitolo 4.`,
  },

  'tutor.kb.requerimientos': {
    es: `📋 **Requerimientos funcionales y no funcionales (IEEE 830)**

**Requerimientos funcionales (RF)**: lo que el sistema *hace*. Tabla de cuatro columnas:
| ID | Nombre del módulo | Descripción de la función | Prioridad |

Se codifican RF-01, RF-02... y lo esperado ronda **12 a 15**. Recorre cada rol del sistema y cada operación CRUD que ejecuta; los que casi siempre faltan son reportes, auditoría y control de acceso.

**Requerimientos no funcionales (RNF)**: atributos de *calidad*, y cada uno necesita una **métrica numérica verificable**:
- **Rendimiento**: tiempo de respuesta menor a X segundos con Y usuarios concurrentes.
- **Seguridad**: cifrado de contraseñas, autenticación con expiración, comunicación HTTPS.
- **Disponibilidad**: porcentaje de uptime mensual comprometido.
- **Escalabilidad**: número de usuarios concurrentes y volumen de registros soportado.
- **Usabilidad**: tiempo máximo para completar una tarea o para capacitar a un usuario.
- **Mantenibilidad**: separación de responsabilidades y cobertura de pruebas.
- **Portabilidad** e **Interoperabilidad**: entornos de despliegue y APIs expuestas.

"El sistema debe ser rápido y seguro" no es un requerimiento: es un deseo. Sin número no es verificable.

**Antes de los requerimientos** va la comparación de **alternativas de solución** (al menos tres) con ventajas, desventajas y la decisión tomada. Sin ese cuadro tu elección tecnológica queda sin sustento.`,
    en: `📋 **Functional and non-functional requirements (IEEE 830)**

**Functional Requirements (FR)**: what the system *does*. Four-column table:
| ID | Module name | Function description | Priority |

They're coded FR-01, FR-02... and you should expect around **12 to 15**. Go through every system role and every CRUD operation it performs; the ones that are almost always missing are reports, auditing and access control.

**Non-Functional Requirements (NFR)**: *quality* attributes, and each one needs a **verifiable numeric metric**:
- **Performance**: response time under X seconds with Y concurrent users.
- **Security**: password encryption, authentication with expiration, HTTPS communication.
- **Availability**: committed monthly uptime percentage.
- **Scalability**: number of concurrent users and record volume supported.
- **Usability**: maximum time to complete a task or to train a user.
- **Maintainability**: separation of concerns and test coverage.
- **Portability** and **Interoperability**: deployment environments and exposed APIs.

"The system must be fast and secure" is not a requirement: it's a wish. Without a number, it isn't verifiable.

**Before the requirements** comes the comparison of **solution alternatives** (at least three) with pros, cons and the decision taken. Without that table your technology choice is left unsupported.`,
    pt: `📋 **Requisitos funcionais e não funcionais (IEEE 830)**

**Requisitos Funcionais (RF)**: o que o sistema *faz*. Tabela de quatro colunas:
| ID | Nome do módulo | Descrição da função | Prioridade |

São codificados RF-01, RF-02... e o esperado gira em torno de **12 a 15**. Percorra cada papel do sistema e cada operação CRUD que executa; os que quase sempre faltam são relatórios, auditoria e controle de acesso.

**Requisitos Não Funcionais (RNF)**: atributos de *qualidade*, e cada um precisa de uma **métrica numérica verificável**:
- **Desempenho**: tempo de resposta menor que X segundos com Y usuários simultâneos.
- **Segurança**: criptografia de senhas, autenticação com expiração, comunicação HTTPS.
- **Disponibilidade**: percentual de uptime mensal comprometido.
- **Escalabilidade**: número de usuários simultâneos e volume de registros suportado.
- **Usabilidade**: tempo máximo para concluir uma tarefa ou para treinar um usuário.
- **Manutenibilidade**: separação de responsabilidades e cobertura de testes.
- **Portabilidade** e **Interoperabilidade**: ambientes de implantação e APIs expostas.

"O sistema deve ser rápido e seguro" não é um requisito: é um desejo. Sem número não é verificável.

**Antes dos requisitos** vem a comparação de **alternativas de solução** (pelo menos três) com vantagens, desvantagens e a decisão tomada. Sem esse quadro, sua escolha tecnológica fica sem sustentação.`,
    fr: `📋 **Exigences fonctionnelles et non fonctionnelles (IEEE 830)**

**Exigences fonctionnelles (EF)** : ce que le système *fait*. Tableau à quatre colonnes :
| ID | Nom du module | Description de la fonction | Priorité |

Elles sont codifiées EF-01, EF-02... et on en attend environ **12 à 15**. Parcourez chaque rôle du système et chaque opération CRUD qu'il exécute ; celles qui manquent presque toujours sont les rapports, l'audit et le contrôle d'accès.

**Exigences non fonctionnelles (ENF)** : des attributs de *qualité*, dont chacun a besoin d'une **métrique numérique vérifiable** :
- **Performance** : temps de réponse inférieur à X secondes avec Y utilisateurs simultanés.
- **Sécurité** : chiffrement des mots de passe, authentification avec expiration, communication HTTPS.
- **Disponibilité** : pourcentage de disponibilité mensuelle engagé.
- **Scalabilité** : nombre d'utilisateurs simultanés et volume d'enregistrements pris en charge.
- **Utilisabilité** : temps maximal pour accomplir une tâche ou pour former un utilisateur.
- **Maintenabilité** : séparation des responsabilités et couverture de tests.
- **Portabilité** et **Interopérabilité** : environnements de déploiement et API exposées.

« Le système doit être rapide et sécurisé » n'est pas une exigence : c'est un souhait. Sans chiffre, ce n'est pas vérifiable.

**Avant les exigences** vient la comparaison des **alternatives de solution** (au moins trois) avec avantages, inconvénients et la décision retenue. Sans ce tableau, votre choix technologique reste sans fondement.`,
    it: `📋 **Requisiti funzionali e non funzionali (IEEE 830)**

**Requisiti Funzionali (RF)**: ciò che il sistema *fa*. Tabella a quattro colonne:
| ID | Nome del modulo | Descrizione della funzione | Priorità |

Sono codificati RF-01, RF-02... e il numero atteso è circa **12-15**. Percorri ogni ruolo del sistema e ogni operazione CRUD che esegue; quelli che mancano quasi sempre sono report, audit e controllo degli accessi.

**Requisiti Non Funzionali (RNF)**: attributi di *qualità*, ciascuno dei quali necessita di una **metrica numerica verificabile**:
- **Prestazioni**: tempo di risposta inferiore a X secondi con Y utenti concorrenti.
- **Sicurezza**: cifratura delle password, autenticazione con scadenza, comunicazione HTTPS.
- **Disponibilità**: percentuale di uptime mensile garantita.
- **Scalabilità**: numero di utenti concorrenti e volume di record supportato.
- **Usabilità**: tempo massimo per completare un'attività o per formare un utente.
- **Manutenibilità**: separazione delle responsabilità e copertura dei test.
- **Portabilità** e **Interoperabilità**: ambienti di distribuzione e API esposte.

"Il sistema deve essere veloce e sicuro" non è un requisito: è un desiderio. Senza un numero non è verificabile.

**Prima dei requisiti** va il confronto delle **alternative di soluzione** (almeno tre) con vantaggi, svantaggi e la decisione presa. Senza questa tabella la tua scelta tecnologica resta senza fondamento.`,
  },

  'tutor.kb.redaccion': {
    es: `✍️ **Redacción académica: los errores más frecuentes**

**1. Primera persona.** La redacción científica es impersonal. Cambia "nosotros desarrollamos" por "se desarrolló", "nuestro sistema" por "el sistema".

**2. Tiempo verbal equivocado.** El futuro solo cabe en las recomendaciones. Desarrollo, resultados y conclusiones van en **pasado**: si ya lo hiciste, escríbelo como hecho. "Se implementará" en un capítulo de desarrollo delata que copiaste tu propio anteproyecto.

**3. Oraciones interminables.** Más de 45 palabras y se pierde el hilo. Divide: una oración que afirma y otra que explica.

**4. Ausencia de conectores.** *Asimismo, No obstante, En consecuencia, Por consiguiente, De igual forma.* Uno por párrafo es suficiente para dar continuidad argumentativa.

**5. Lenguaje impreciso.** Sustituye el intensificador por el dato: en lugar de "muy rápido", escribe "con un tiempo de respuesta menor a 2 segundos".

**6. Marco teórico como diccionario.** No enumeres definiciones: haz que los autores dialoguen. "Mientras X sostiene que..., Y evidencia que...".

**7. Párrafos sin cita.** Toda afirmación que no sea un dato propio necesita respaldo. Prioriza citar en la descripción del problema, la base conceptual y la discusión.

**8. Tablas y figuras huérfanas.** Toda tabla lleva número y título arriba, la fuente abajo, y debe anunciarse en el texto antes de aparecer ("ver Tabla 3").`,
    en: `✍️ **Academic writing: the most frequent errors**

**1. First person.** Scientific writing is impersonal. Change "we developed" to "was developed," "our system" to "the system."

**2. Wrong verb tense.** The future tense only belongs in the recommendations. Development, results and conclusions go in the **past tense**: if you already did it, write it as a fact. "It will be implemented" in a development chapter gives away that you copied your own proposal.

**3. Endless sentences.** More than 45 words and the thread is lost. Split it: one sentence that states, another that explains.

**4. Missing connectors.** *Furthermore, However, Consequently, Therefore, Likewise.* One per paragraph is enough to give argumentative continuity.

**5. Vague language.** Replace the intensifier with the data point: instead of "very fast," write "with a response time under 2 seconds."

**6. Theoretical framework as a dictionary.** Don't just list definitions: make the authors converse. "While X argues that..., Y shows that...".

**7. Paragraphs without a citation.** Any statement that isn't your own data needs support. Prioritize citing in the problem description, the conceptual basis, and the discussion.

**8. Orphan tables and figures.** Every table needs a number and a title above it, the source below, and it must be announced in the text before it appears ("see Table 3").`,
    pt: `✍️ **Redação acadêmica: os erros mais frequentes**

**1. Primeira pessoa.** A redação científica é impessoal. Troque "nós desenvolvemos" por "foi desenvolvido", "nosso sistema" por "o sistema".

**2. Tempo verbal errado.** O futuro só cabe nas recomendações. Desenvolvimento, resultados e conclusões vão no **passado**: se você já fez, escreva como fato consumado. "Será implementado" em um capítulo de desenvolvimento denuncia que você copiou seu próprio anteprojeto.

**3. Frases intermináveis.** Mais de 45 palavras e o fio se perde. Divida: uma frase que afirma e outra que explica.

**4. Ausência de conectores.** *Além disso, No entanto, Consequentemente, Portanto, Da mesma forma.* Um por parágrafo é suficiente para dar continuidade argumentativa.

**5. Linguagem imprecisa.** Substitua o intensificador pelo dado: em vez de "muito rápido", escreva "com tempo de resposta menor que 2 segundos".

**6. Marco teórico como dicionário.** Não enumere definições: faça os autores dialogarem. "Enquanto X sustenta que..., Y evidencia que...".

**7. Parágrafos sem citação.** Toda afirmação que não seja um dado próprio precisa de respaldo. Priorize citar na descrição do problema, na base conceitual e na discussão.

**8. Tabelas e figuras órfãs.** Toda tabela leva número e título acima, a fonte abaixo, e deve ser anunciada no texto antes de aparecer ("ver Tabela 3").`,
    fr: `✍️ **Rédaction académique : les erreurs les plus fréquentes**

**1. Première personne.** La rédaction scientifique est impersonnelle. Remplacez « nous avons développé » par « a été développé », « notre système » par « le système ».

**2. Temps verbal incorrect.** Le futur n'a sa place que dans les recommandations. Développement, résultats et conclusions se rédigent au **passé** : si vous l'avez déjà fait, écrivez-le comme un fait accompli. « Sera mis en œuvre » dans un chapitre de développement trahit que vous avez recopié votre propre avant-projet.

**3. Phrases interminables.** Plus de 45 mots et le fil se perd. Séparez : une phrase qui affirme et une autre qui explique.

**4. Absence de connecteurs.** *De plus, Cependant, Par conséquent, Ainsi, De même.* Un par paragraphe suffit pour assurer la continuité argumentative.

**5. Langage imprécis.** Remplacez l'intensificateur par la donnée : au lieu de « très rapide », écrivez « avec un temps de réponse inférieur à 2 secondes ».

**6. Cadre théorique en forme de dictionnaire.** N'énumérez pas des définitions : faites dialoguer les auteurs. « Tandis que X soutient que..., Y montre que... ».

**7. Paragraphes sans citation.** Toute affirmation qui n'est pas une donnée propre a besoin d'un appui. Privilégiez les citations dans la description du problème, la base conceptuelle et la discussion.

**8. Tableaux et figures orphelins.** Chaque tableau porte un numéro et un titre au-dessus, la source en dessous, et doit être annoncé dans le texte avant d'apparaître (« voir Tableau 3 »).`,
    it: `✍️ **Scrittura accademica: gli errori più frequenti**

**1. Prima persona.** La scrittura scientifica è impersonale. Cambia "noi abbiamo sviluppato" con "è stato sviluppato", "il nostro sistema" con "il sistema".

**2. Tempo verbale sbagliato.** Il futuro trova posto solo nelle raccomandazioni. Sviluppo, risultati e conclusioni vanno al **passato**: se lo hai già fatto, scrivilo come un fatto compiuto. "Sarà implementato" in un capitolo di sviluppo tradisce che hai copiato il tuo stesso anteprogetto.

**3. Frasi interminabili.** Oltre 45 parole e si perde il filo. Dividi: una frase che afferma e un'altra che spiega.

**4. Assenza di connettivi.** *Inoltre, Tuttavia, Di conseguenza, Pertanto, Allo stesso modo.* Uno per paragrafo è sufficiente per dare continuità argomentativa.

**5. Linguaggio impreciso.** Sostituisci l'intensificatore con il dato: invece di "molto veloce", scrivi "con un tempo di risposta inferiore a 2 secondi".

**6. Quadro teorico come dizionario.** Non elencare definizioni: fai dialogare gli autori. "Mentre X sostiene che..., Y dimostra che...".

**7. Paragrafi senza citazione.** Ogni affermazione che non sia un dato proprio necessita di supporto. Dai priorità alle citazioni nella descrizione del problema, nella base concettuale e nella discussione.

**8. Tabelle e figure orfane.** Ogni tabella porta numero e titolo sopra, la fonte sotto, e deve essere annunciata nel testo prima di comparire ("vedi Tabella 3").`,
  },

  'tutor.kb.videoteca': {
    es: `🎬 **Videoteca guiada (Módulo 06)**

Rutas de video organizadas por el momento del proceso en el que conviene verlas:
- **Estructura del documento**: capítulos, estudio de caso, resumen y abstract, conclusiones.
- **Metodología**: planteamiento con la técnica del embudo, objetivos con Bloom, matriz de consistencia, operacionalización de variables, requerimientos IEEE 830.
- **Revisión de literatura**: Scopus y cuartiles, ecuaciones booleanas, SciELO y Redalyc, Connected Papers y VOSviewer, revisión sistemática con PRISMA.
- **Herramientas**: Zotero 7, normas APA 7, Word académico, parafraseo y control de similitud, Jamovi y SPSS, uso ético de IA.
- **Sustentación**: diapositivas en 10 minutos, preguntas frecuentes de la defensa, cómo atender observaciones.

Cada tarjeta abre YouTube con los términos exactos del tema en lugar de un video fijo, de modo que el material siempre esté vigente y ningún enlace quede roto.`,
    en: `🎬 **Guided video library (Module 06)**

Video paths organized by the moment in the process when it's best to watch them:
- **Document structure**: chapters, case study, summary and abstract, conclusions.
- **Methodology**: problem statement with the funnel technique, objectives with Bloom's taxonomy, consistency matrix, variable operationalization, IEEE 830 requirements.
- **Literature review**: Scopus and quartiles, Boolean search strings, SciELO and Redalyc, Connected Papers and VOSviewer, systematic review with PRISMA.
- **Tools**: Zotero 7, APA 7 standards, academic Word, paraphrasing and similarity control, Jamovi and SPSS, ethical use of AI.
- **Defense**: 10-minute slide decks, frequently asked defense questions, how to address observations.

Each card opens YouTube with the exact terms for the topic instead of a fixed video, so the material stays current and no link ever breaks.`,
    pt: `🎬 **Videoteca guiada (Módulo 06)**

Rotas de vídeo organizadas pelo momento do processo em que convém assisti-las:
- **Estrutura do documento**: capítulos, estudo de caso, resumo e abstract, conclusões.
- **Metodologia**: formulação do problema com a técnica do funil, objetivos com Bloom, matriz de consistência, operacionalização de variáveis, requisitos IEEE 830.
- **Revisão de literatura**: Scopus e quartis, equações booleanas, SciELO e Redalyc, Connected Papers e VOSviewer, revisão sistemática com PRISMA.
- **Ferramentas**: Zotero 7, normas APA 7, Word acadêmico, paráfrase e controle de similaridade, Jamovi e SPSS, uso ético de IA.
- **Sustentação**: apresentação de 10 minutos, perguntas frequentes da defesa, como atender observações.

Cada cartão abre o YouTube com os termos exatos do tema em vez de um vídeo fixo, para que o material esteja sempre atualizado e nenhum link fique quebrado.`,
    fr: `🎬 **Vidéothèque guidée (Module 06)**

Parcours vidéo organisés selon le moment du processus où il convient de les regarder :
- **Structure du document** : chapitres, étude de cas, résumé et abstract, conclusions.
- **Méthodologie** : énoncé du problème avec la technique de l'entonnoir, objectifs selon Bloom, matrice de cohérence, opérationnalisation des variables, exigences IEEE 830.
- **Revue de littérature** : Scopus et quartiles, équations booléennes, SciELO et Redalyc, Connected Papers et VOSviewer, revue systématique avec PRISMA.
- **Outils** : Zotero 7, normes APA 7, Word académique, paraphrase et contrôle de similarité, Jamovi et SPSS, usage éthique de l'IA.
- **Soutenance** : diaporama de 10 minutes, questions fréquentes de la soutenance, comment répondre aux observations.

Chaque carte ouvre YouTube avec les termes exacts du sujet plutôt qu'une vidéo fixe, afin que le contenu reste toujours à jour et qu'aucun lien ne soit jamais rompu.`,
    it: `🎬 **Videoteca guidata (Modulo 06)**

Percorsi video organizzati in base al momento del processo in cui conviene guardarli:
- **Struttura del documento**: capitoli, caso di studio, riassunto e abstract, conclusioni.
- **Metodologia**: formulazione del problema con la tecnica dell'imbuto, obiettivi secondo Bloom, matrice di coerenza, operazionalizzazione delle variabili, requisiti IEEE 830.
- **Revisione della letteratura**: Scopus e quartili, equazioni booleane, SciELO e Redalyc, Connected Papers e VOSviewer, revisione sistematica con PRISMA.
- **Strumenti**: Zotero 7, norme APA 7, Word accademico, parafrasi e controllo della similarità, Jamovi e SPSS, uso etico dell'IA.
- **Discussione della tesi**: diapositive in 10 minuti, domande frequenti della discussione, come rispondere alle osservazioni.

Ogni scheda apre YouTube con i termini esatti dell'argomento invece di un video fisso, così il materiale resta sempre aggiornato e nessun link si rompe.`,
  },

  'tutor.kb.defensa': {
    es: `🎤 **Preparación de la sustentación**

**Distribución para 10 minutos**
1. Problema y justificación — 2 min
2. Objetivos — 1 min
3. Metodología y diseño — 2 min
4. Producto y resultados (demostración) — 3 min
5. Conclusiones — 2 min

**Preguntas que se repiten**
- ¿Por qué elegiste esta metodología y no otra?
- ¿Cómo calculaste la muestra o por qué ese caso de estudio?
- ¿Qué limitaciones tuvo tu trabajo?
- ¿Cómo validaste que el producto funciona?
- ¿Qué harías diferente si empezaras de nuevo?

**Recomendaciones**
- Domina tu propio documento: la mayoría de las preguntas sale de lo que escribiste.
- Ten el prototipo funcionando y con datos de demostración cargados de antemano.
- Reconoce las limitaciones abiertamente: declararlas demuestra criterio, ocultarlas genera desconfianza.
- Si no sabes algo, dilo y explica cómo lo averiguarías. Improvisar se nota.`,
    en: `🎤 **Preparing for your thesis defense**

**10-minute breakdown**
1. Problem and rationale — 2 min
2. Objectives — 1 min
3. Methodology and design — 2 min
4. Product and results (demonstration) — 3 min
5. Conclusions — 2 min

**Recurring questions**
- Why did you choose this methodology and not another?
- How did you calculate the sample, or why that case study?
- What limitations did your work have?
- How did you validate that the product works?
- What would you do differently if you started over?

**Recommendations**
- Master your own document: most questions come from what you wrote.
- Have the prototype running with demo data loaded beforehand.
- Acknowledge limitations openly: declaring them shows judgment, hiding them breeds distrust.
- If you don't know something, say so and explain how you'd find out. Improvising is obvious.`,
    pt: `🎤 **Preparação para a sustentação**

**Distribuição para 10 minutos**
1. Problema e justificativa — 2 min
2. Objetivos — 1 min
3. Metodologia e desenho — 2 min
4. Produto e resultados (demonstração) — 3 min
5. Conclusões — 2 min

**Perguntas que se repetem**
- Por que você escolheu essa metodologia e não outra?
- Como você calculou a amostra ou por que esse estudo de caso?
- Que limitações seu trabalho teve?
- Como você validou que o produto funciona?
- O que você faria diferente se começasse de novo?

**Recomendações**
- Domine o seu próprio documento: a maioria das perguntas vem do que você escreveu.
- Tenha o protótipo funcionando e com dados de demonstração já carregados.
- Reconheça as limitações abertamente: declará-las demonstra critério, ocultá-las gera desconfiança.
- Se não souber algo, diga isso e explique como descobriria. Improvisar se percebe.`,
    fr: `🎤 **Préparation de la soutenance**

**Répartition sur 10 minutes**
1. Problème et justification — 2 min
2. Objectifs — 1 min
3. Méthodologie et conception — 2 min
4. Produit et résultats (démonstration) — 3 min
5. Conclusions — 2 min

**Questions récurrentes**
- Pourquoi avez-vous choisi cette méthodologie et pas une autre ?
- Comment avez-vous calculé l'échantillon, ou pourquoi ce cas d'étude ?
- Quelles limites votre travail a-t-il rencontrées ?
- Comment avez-vous validé que le produit fonctionne ?
- Que feriez-vous différemment si vous recommenciez ?

**Recommandations**
- Maîtrisez votre propre document : la plupart des questions viennent de ce que vous avez écrit.
- Ayez le prototype fonctionnel avec des données de démonstration préchargées.
- Reconnaissez ouvertement les limites : les déclarer montre du discernement, les cacher suscite la méfiance.
- Si vous ne savez pas quelque chose, dites-le et expliquez comment vous le découvririez. L'improvisation se voit.`,
    it: `🎤 **Preparazione della discussione di tesi**

**Distribuzione in 10 minuti**
1. Problema e giustificazione — 2 min
2. Obiettivi — 1 min
3. Metodologia e disegno — 2 min
4. Prodotto e risultati (dimostrazione) — 3 min
5. Conclusioni — 2 min

**Domande ricorrenti**
- Perché hai scelto questa metodologia e non un'altra?
- Come hai calcolato il campione, o perché questo caso di studio?
- Quali limiti ha avuto il tuo lavoro?
- Come hai convalidato che il prodotto funziona?
- Cosa faresti diversamente se ricominciassi da capo?

**Raccomandazioni**
- Padroneggia il tuo stesso documento: la maggior parte delle domande nasce da ciò che hai scritto.
- Tieni il prototipo funzionante e con dati dimostrativi già caricati.
- Riconosci apertamente i limiti: dichiararli dimostra giudizio, nasconderli genera diffidenza.
- Se non sai qualcosa, dillo e spiega come lo scopriresti. L'improvvisazione si nota.`,
  },

  'tutor.kb.asesoria': {
    es: `🤝 **Ayuda directa**

Este portal es un recurso de acceso libre para los estudiantes universitarios del Ecuador en proceso de titulación.

Si quieres que te ayuden con **un tema en específico** o con **el desarrollo de tu proyecto de titulación**, usa el botón de WhatsApp de la barra superior.

Ten presente que las indicaciones de tu docente o tutor siempre tienen la última palabra sobre tu trabajo.`,
    en: `🤝 **Direct help**

This portal is a free-access resource for university students in Ecuador going through their thesis process.

If you'd like help with **a specific topic** or with **developing your thesis project**, use the WhatsApp button in the top bar.

Keep in mind that your teacher or advisor's instructions always have the final say over your work.`,
    pt: `🤝 **Ajuda direta**

Este portal é um recurso de acesso livre para estudantes universitários do Equador em processo de titulação.

Se quiser ajuda com **um tema específico** ou com **o desenvolvimento do seu projeto de titulação**, use o botão do WhatsApp na barra superior.

Tenha em mente que as orientações do seu professor ou orientador sempre têm a palavra final sobre o seu trabalho.`,
    fr: `🤝 **Aide directe**

Ce portail est une ressource en accès libre pour les étudiants universitaires d'Équateur en fin d'études.

Si vous souhaitez de l'aide sur **un sujet précis** ou sur **le développement de votre projet de fin d'études**, utilisez le bouton WhatsApp de la barre supérieure.

Gardez à l'esprit que les indications de votre enseignant ou directeur ont toujours le dernier mot sur votre travail.`,
    it: `🤝 **Aiuto diretto**

Questo portale è una risorsa ad accesso libero per gli studenti universitari dell'Ecuador in fase di tesi.

Se vuoi essere aiutato con **un tema specifico** o con **lo sviluppo del tuo progetto di tesi**, usa il pulsante WhatsApp nella barra superiore.

Tieni presente che le indicazioni del tuo docente o relatore hanno sempre l'ultima parola sul tuo lavoro.`,
  },

  'tutor.kb.default': {
    es: `🎓 **Tutor IA Metodológico para estudiantes universitarios del Ecuador**

Este módulo te orienta con rigor sobre todos los componentes de la plataforma:
- **Ecosistema 01**: Viabilidad del tema y Matriz de Consistencia del Avance 1.
- **Ecosistema 02**: Estructura de los 5 capítulos de titulación y entregables.
- **Ecosistema 03**: Ecuaciones booleanas de búsqueda en Scopus (AND, OR, NOT, sintaxis TITLE-ABS-KEY).
- **Ecosistema 04**: Normas APA 7ª edición, regla del *et al.* y gestor bibliográfico Zotero 7.
- **Ecosistema 05**: Software para tesis (Jamovi, SPSS, VOSviewer, Connected Papers y Turnitin).
- **Ecosistema 06**: Videoteca guiada por etapa del proceso.
- **Ecosistema 07**: Revisor de borrador, para diagnosticar tu Avance 1 o 2 antes de entregarlo.

*Pregúntame cualquier concepto*: por ejemplo "¿Qué es una ecuación booleana?", "¿Cómo hacer los objetivos con Bloom?", "¿Cómo citar en APA 7?" o "¿Qué lleva el Avance 1?".`,
    en: `🎓 **Methodology AI Tutor for university students in Ecuador**

This module guides you rigorously through every component of the platform:
- **Ecosystem 01**: Topic feasibility and the Consistency Matrix for Advance 1.
- **Ecosystem 02**: Structure of the 5 thesis chapters and their deliverables.
- **Ecosystem 03**: Boolean search strings in Scopus (AND, OR, NOT, TITLE-ABS-KEY syntax).
- **Ecosystem 04**: APA 7th edition standards, the *et al.* rule, and the Zotero 7 reference manager.
- **Ecosystem 05**: Thesis software (Jamovi, SPSS, VOSviewer, Connected Papers and Turnitin).
- **Ecosystem 06**: Guided video library organized by stage of the process.
- **Ecosystem 07**: Draft reviewer, to diagnose your Advance 1 or 2 before submitting it.

*Ask me anything*: for example "What is a boolean search string?", "How do I write objectives with Bloom's taxonomy?", "How do I cite in APA 7?" or "What does Advance 1 include?".`,
    pt: `🎓 **Tutor de IA Metodológico para estudantes universitários do Equador**

Este módulo orienta você com rigor sobre todos os componentes da plataforma:
- **Ecossistema 01**: Viabilidade do tema e Matriz de Consistência do Avanço 1.
- **Ecossistema 02**: Estrutura dos 5 capítulos de titulação e entregáveis.
- **Ecossistema 03**: Equações booleanas de busca no Scopus (AND, OR, NOT, sintaxe TITLE-ABS-KEY).
- **Ecossistema 04**: Normas APA 7ª edição, regra do *et al.* e gerenciador bibliográfico Zotero 7.
- **Ecossistema 05**: Software para teses (Jamovi, SPSS, VOSviewer, Connected Papers e Turnitin).
- **Ecossistema 06**: Videoteca guiada por etapa do processo.
- **Ecossistema 07**: Revisor de rascunho, para diagnosticar seu Avanço 1 ou 2 antes de entregá-lo.

*Pergunte-me qualquer conceito*: por exemplo "O que é uma equação booleana?", "Como fazer os objetivos com Bloom?", "Como citar em APA 7?" ou "O que compõe o Avanço 1?".`,
    fr: `🎓 **Tuteur IA Méthodologique pour les étudiants universitaires d'Équateur**

Ce module vous guide avec rigueur sur toutes les composantes de la plateforme :
- **Écosystème 01** : Faisabilité du sujet et matrice de cohérence du premier jalon.
- **Écosystème 02** : Structure des 5 chapitres du mémoire et leurs livrables.
- **Écosystème 03** : Équations booléennes de recherche dans Scopus (AND, OR, NOT, syntaxe TITLE-ABS-KEY).
- **Écosystème 04** : Normes APA 7e édition, règle du *et al.* et gestionnaire bibliographique Zotero 7.
- **Écosystème 05** : Logiciels pour mémoires (Jamovi, SPSS, VOSviewer, Connected Papers et Turnitin).
- **Écosystème 06** : Vidéothèque guidée par étape du processus.
- **Écosystème 07** : Réviseur de brouillon, pour diagnostiquer votre premier ou deuxième jalon avant de le remettre.

*Posez-moi n'importe quelle question* : par exemple « Qu'est-ce qu'une équation booléenne ? », « Comment rédiger les objectifs avec Bloom ? », « Comment citer en APA 7 ? » ou « Que contient le premier jalon ? ».`,
    it: `🎓 **Tutor IA Metodologico per studenti universitari dell'Ecuador**

Questo modulo ti orienta con rigore su tutte le componenti della piattaforma:
- **Ecosistema 01**: Fattibilità del tema e Matrice di Coerenza del primo avanzamento.
- **Ecosistema 02**: Struttura dei 5 capitoli di tesi e relativi deliverable.
- **Ecosistema 03**: Equazioni booleane di ricerca su Scopus (AND, OR, NOT, sintassi TITLE-ABS-KEY).
- **Ecosistema 04**: Norme APA 7ª edizione, regola dell'*et al.* e gestore bibliografico Zotero 7.
- **Ecosistema 05**: Software per tesi (Jamovi, SPSS, VOSviewer, Connected Papers e Turnitin).
- **Ecosistema 06**: Videoteca guidata per fase del processo.
- **Ecosistema 07**: Revisore di bozza, per diagnosticare il tuo primo o secondo avanzamento prima di consegnarlo.

*Chiedimi qualsiasi concetto*: per esempio "Che cos'è un'equazione booleana?", "Come si scrivono gli obiettivi con Bloom?", "Come si cita in APA 7?" oppure "Cosa comprende il primo avanzamento?".`,
  },
};
