/**
 * Text analysis primitives: tokenization, chunking, and the similarity
 * metrics used by the plagiarism engine.
 *
 * The metrics are deliberately complementary:
 *   - containment      catches verbatim copying (order-sensitive n-grams)
 *   - tfidfCosine      catches paraphrase / reordering (bag of weighted terms)
 *   - winnowing        catches partial reuse inside a long source document
 */

// Function words carry no signal for similarity and dominate raw term counts.
const STOPWORDS = new Set([
  // English
  "a", "about", "above", "after", "again", "all", "also", "am", "an", "and", "any",
  "are", "as", "at", "be", "because", "been", "before", "being", "below", "between",
  "both", "but", "by", "can", "did", "do", "does", "doing", "down", "during", "each",
  "few", "for", "from", "further", "had", "has", "have", "having", "he", "her", "here",
  "hers", "him", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself",
  "just", "me", "more", "most", "my", "no", "nor", "not", "now", "of", "off", "on",
  "once", "only", "or", "other", "our", "ours", "out", "over", "own", "same", "she",
  "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them",
  "then", "there", "these", "they", "this", "those", "through", "to", "too", "under",
  "until", "up", "very", "was", "we", "were", "what", "when", "where", "which",
  "while", "who", "whom", "why", "will", "with", "would", "you", "your", "yours",
  // Spanish
  "al", "algo", "ante", "antes", "aqui", "asi", "aun", "cada", "como", "con", "cual",
  "cuando", "de", "del", "desde", "donde", "dos", "el", "ella", "ellos", "en", "entre",
  "era", "es", "esa", "ese", "eso", "esta", "estan", "este", "esto", "estos", "fue",
  "fueron", "ha", "han", "hasta", "hay", "la", "las", "le", "les", "lo", "los", "mas",
  "me", "mi", "mucho", "muy", "ni", "no", "nos", "o", "otra", "otro", "para", "pero",
  "poco", "por", "porque", "que", "quien", "se", "segun", "ser", "si", "sin", "sobre",
  "solo", "son", "su", "sus", "también", "tambien", "tiene", "todo", "todos", "tras",
  "un", "una", "uno", "unos", "ya", "yo",
]);

/** Strip diacritics so "análisis" and "analisis" hash identically. */
function deaccent(word) {
  return word.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Light suffix stripping. Not a linguistically correct stemmer — the goal is
 * only to collapse the inflections that would otherwise split a term's counts.
 */
function stem(word) {
  if (word.length <= 4) return word;

  const suffixes = [
    "amiento", "imiento", "aciones", "iciones", "mente",
    "ación", "acion", "ición", "icion", "ando", "endo",
    "ness", "ment", "tion", "sion", "ing", "ies", "ed", "es", "s",
  ];

  for (const suffix of suffixes) {
    if (word.length - suffix.length >= 4 && word.endsWith(suffix)) {
      return word.slice(0, -suffix.length);
    }
  }
  return word;
}

/**
 * @param {string} text
 * @param {{ keepStopwords?: boolean, stemming?: boolean }} [options]
 * @returns {string[]}
 */
export function tokenize(text, options = {}) {
  const { keepStopwords = false, stemming = true } = options;

  const words = deaccent(text.toLowerCase())
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const result = [];
  for (const word of words) {
    if (!keepStopwords && STOPWORDS.has(word)) continue;
    if (word.length < 2) continue;
    result.push(stemming ? stem(word) : word);
  }
  return result;
}

/**
 * Split a document into overlapping passages.
 *
 * Sentence-level analysis misses plagiarism that straddles a sentence
 * boundary, so passages group consecutive sentences up to a word budget and
 * overlap by one sentence.
 *
 * @returns {Array<{ text: string, start: number, end: number }>}
 */
export function chunkText(text, { minWords = 12, maxWords = 60 } = {}) {
  // Protect common abbreviations from the sentence splitter.
  const guarded = text
    .replace(/\b(Dr|Mr|Mrs|Ms|Prof|Sr|Sra|Dra|St|vs|etc|ej|Fig|No|op|cit|al)\./gi, "$1<%D%>")
    .replace(/\b([A-Z])\./g, "$1<%D%>")
    .replace(/(\d)\.(\d)/g, "$1<%D%>$2");

  const sentences = [];
  const regex = /[^.!?\n]+(?:[.!?]+|\n|$)/g;
  let match;
  while ((match = regex.exec(guarded)) !== null) {
    const raw = match[0].replace(/<%D%>/g, ".").trim();
    if (raw) sentences.push({ text: raw, offset: match.index });
  }

  const chunks = [];
  let i = 0;
  while (i < sentences.length) {
    let words = 0;
    let j = i;
    const parts = [];

    while (j < sentences.length) {
      const count = sentences[j].text.split(/\s+/).length;
      if (parts.length > 0 && words + count > maxWords) break;
      parts.push(sentences[j].text);
      words += count;
      j++;
      if (words >= maxWords) break;
    }

    const body = parts.join(" ");
    if (words >= minWords) {
      chunks.push({ text: body, start: sentences[i].offset, end: sentences[j - 1].offset });
    }

    // Overlap by one sentence so boundary-straddling matches are still seen.
    i = j > i + 1 ? j - 1 : j;
  }

  return chunks;
}

/** Word n-grams as a Set of joined strings. */
export function ngrams(tokens, n) {
  const set = new Set();
  for (let i = 0; i + n <= tokens.length; i++) {
    set.add(tokens.slice(i, i + n).join(" "));
  }
  return set;
}

/**
 * Containment coefficient: |A ∩ B| / |A|.
 *
 * This is the correct asymmetric measure when comparing a short passage
 * against a long source document. Jaccard (or normalizing by the larger set)
 * drives the score toward zero purely because the source page is long, which
 * is why a naive implementation reports ~0% on obvious verbatim copies.
 */
export function containment(setA, setB) {
  if (setA.size === 0) return 0;

  let hits = 0;
  for (const gram of setA) {
    if (setB.has(gram)) hits++;
  }
  return hits / setA.size;
}

/**
 * Cosine similarity over TF-IDF weighted term vectors.
 *
 * @param {string[]} tokensA
 * @param {string[]} tokensB
 * @param {Map<string, number>} idf Precomputed inverse document frequencies.
 */
export function tfidfCosine(tokensA, tokensB, idf) {
  const vectorize = (tokens) => {
    const tf = new Map();
    for (const token of tokens) tf.set(token, (tf.get(token) || 0) + 1);

    const vector = new Map();
    let norm = 0;
    for (const [term, count] of tf) {
      // Sublinear TF damps the effect of a term repeated many times.
      const weight = (1 + Math.log(count)) * (idf.get(term) ?? Math.log(2));
      vector.set(term, weight);
      norm += weight * weight;
    }
    return { vector, norm: Math.sqrt(norm) };
  };

  const a = vectorize(tokensA);
  const b = vectorize(tokensB);
  if (a.norm === 0 || b.norm === 0) return 0;

  // Iterate the smaller vector; the intersection is what matters.
  const [small, large] = a.vector.size <= b.vector.size ? [a.vector, b.vector] : [b.vector, a.vector];

  let dot = 0;
  for (const [term, weight] of small) {
    const other = large.get(term);
    if (other !== undefined) dot += weight * other;
  }

  return dot / (a.norm * b.norm);
}

/** Build IDF weights from a corpus of token arrays. */
export function buildIdf(documents) {
  const df = new Map();
  for (const tokens of documents) {
    for (const term of new Set(tokens)) {
      df.set(term, (df.get(term) || 0) + 1);
    }
  }

  const total = documents.length || 1;
  const idf = new Map();
  for (const [term, count] of df) {
    // Smoothed IDF, floored at a small positive value.
    idf.set(term, Math.log((total + 1) / (count + 0.5)) + 0.1);
  }
  return idf;
}

/**
 * Winnowing fingerprints (Schleimer, Wilkerson & Aiken, 2003) — the algorithm
 * behind MOSS.
 *
 * Hashes every k-gram, then keeps only the minimum hash in each sliding window
 * of w. This guarantees any shared substring of length >= k + w - 1 is
 * detected while storing a fraction of the hashes, so comparison stays cheap
 * on long source documents.
 *
 * @param {string[]} tokens
 * @param {number} k Token n-gram width.
 * @param {number} w Winnowing window.
 * @returns {Set<number>}
 */
export function winnow(tokens, k = 4, w = 4) {
  if (tokens.length < k) return new Set();

  // Rolling polynomial hash over token n-grams.
  const BASE = 31;
  const MOD = 2147483647;

  const codes = tokens.map((token) => {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash * BASE + token.charCodeAt(i)) % MOD;
    }
    return hash;
  });

  let highest = 1;
  for (let i = 0; i < k - 1; i++) highest = (highest * BASE) % MOD;

  const hashes = [];
  let rolling = 0;
  for (let i = 0; i < codes.length; i++) {
    if (i < k) {
      rolling = (rolling * BASE + codes[i]) % MOD;
      if (i === k - 1) hashes.push(rolling);
    } else {
      rolling = (rolling - ((codes[i - k] * highest) % MOD) + MOD) % MOD;
      rolling = (rolling * BASE + codes[i]) % MOD;
      hashes.push(rolling);
    }
  }

  const fingerprints = new Set();
  if (hashes.length < w) {
    fingerprints.add(Math.min(...hashes));
    return fingerprints;
  }

  // Select the minimum of each window; ties resolve to the rightmost value,
  // which keeps the selection stable across insertions.
  let previousIndex = -1;
  for (let i = 0; i + w <= hashes.length; i++) {
    let minIndex = i;
    for (let j = i; j < i + w; j++) {
      if (hashes[j] <= hashes[minIndex]) minIndex = j;
    }
    if (minIndex !== previousIndex) {
      fingerprints.add(hashes[minIndex]);
      previousIndex = minIndex;
    }
  }

  return fingerprints;
}

/**
 * Longest run of consecutive tokens from A that appears verbatim in B.
 * Reported to the user as concrete evidence rather than an abstract score.
 */
export function longestVerbatimRun(tokensA, tokensB) {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  // Index B by token so we only probe positions that can start a match.
  const positions = new Map();
  for (let i = 0; i < tokensB.length; i++) {
    const list = positions.get(tokensB[i]);
    if (list) list.push(i);
    else positions.set(tokensB[i], [i]);
  }

  let best = 0;
  for (let i = 0; i < tokensA.length; i++) {
    const starts = positions.get(tokensA[i]);
    if (!starts) continue;

    for (const start of starts) {
      let length = 0;
      while (
        i + length < tokensA.length &&
        start + length < tokensB.length &&
        tokensA[i + length] === tokensB[start + length]
      ) {
        length++;
      }
      if (length > best) best = length;
    }

    // Already found a run reaching the end of A; nothing longer exists.
    if (best >= tokensA.length - i) break;
  }

  return best;
}

/**
 * Build the search queries for a passage.
 *
 * Feeding a whole passage to a search engine is the single biggest cause of
 * missed detections: engines treat it as a long conjunctive term list and
 * return nothing. Two complementary queries are issued instead —
 *
 *   phrase   an exact-match window, high precision, finds verbatim copies
 *   keywords the most distinctive content words, high recall, finds rewrites
 *
 * @param {string} text
 * @returns {{ phrase: string, keywords: string }}
 */
export function buildQueries(text, { phraseWords = 8, keywordCount = 10 } = {}) {
  const words = text.split(/\s+/).filter(Boolean);

  // Slide a window forward until it holds enough content words to be
  // distinctive; a window of "and of the in a to" matches everything.
  let phrase = "";
  for (let i = 0; i + phraseWords <= words.length; i++) {
    const window = words.slice(i, i + phraseWords);
    const contentWords = window.filter(
      (word) => !STOPWORDS.has(deaccent(word.toLowerCase()).replace(/[^a-z0-9]/g, ""))
    );
    if (contentWords.length >= 4) {
      phrase = window.join(" ");
      break;
    }
  }
  if (!phrase) phrase = words.slice(0, phraseWords).join(" ");

  // Trim punctuation that would break an exact-match query.
  phrase = phrase.replace(/^[^\w]+|[^\w]+$/g, "").replace(/["""]/g, "");

  // Keywords: distinctive content words, longest first, original order kept.
  const seen = new Set();
  const candidates = [];
  for (const [index, raw] of words.entries()) {
    const clean = raw.replace(/[^\p{L}\p{N}-]/gu, "");
    if (clean.length < 4) continue;

    const key = deaccent(clean.toLowerCase());
    if (STOPWORDS.has(key) || seen.has(key)) continue;
    seen.add(key);

    // A capitalized word mid-sentence is usually a proper noun: highly selective.
    const isProperNoun = index > 0 && /^[A-ZÁÉÍÓÚÑ]/.test(clean);
    candidates.push({ word: clean, index, score: clean.length + (isProperNoun ? 4 : 0) });
  }

  const keywords = candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, keywordCount)
    .sort((a, b) => a.index - b.index)
    .map((candidate) => candidate.word)
    .join(" ");

  return { phrase, keywords };
}

/** Remove quoted spans and bracketed/parenthetical citations. */
export function stripCitations(text) {
  return text
    .replace(/[""][^""]{10,}[""]/g, " ")
    .replace(/"[^"]{10,}"/g, " ")
    .replace(/\[\d+(?:\s*[,–-]\s*\d+)*\]/g, " ")
    .replace(/\([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ.\s&]+,\s*\d{4}[a-z]?(?:,\s*p{1,2}\.\s*\d+(?:-\d+)?)?\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
