/**
 * Local document corpus.
 *
 * Every public provider shares one blind spot: work that was never published.
 * The most common case an institution actually faces is a student reusing a
 * classmate's thesis from two years ago, or resubmitting their own earlier
 * assignment. No web index will ever contain those documents.
 *
 * This module keeps a local store of previously seen work and searches it the
 * same way MOSS does: winnowing fingerprints in an inverted index, so a passage
 * is matched against the whole corpus by hash lookup rather than by comparing
 * it to every document.
 *
 * Retention is deliberate policy, not a default. Storing student work has real
 * consequences -- consent, data protection, and the right of a student to have
 * their submission removed -- so nothing is retained unless the caller asks for
 * it explicitly, and `forget` exists so a record can actually be deleted.
 */

import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { tokenize, winnow } from "./text.js";

const DB_PATH = process.env.CORPUS_DB || "./data/corpus.db";

/** Fingerprints shared before two documents are considered related at all. */
const MIN_SHARED_FINGERPRINTS = 3;

let db = null;

/**
 * Monotonic counter bumped on every write.
 *
 * Search results are cached upstream, and a cached result that still names a
 * deleted document would keep serving it after an erasure request. Including
 * this value in the cache key makes any corpus change invalidate those entries
 * immediately, without coupling the cache to this module.
 */
let version = 0;

export function corpusVersion() {
  return version;
}

function connect() {
  if (db) return db;

  if (DB_PATH !== ":memory:") mkdirSync(dirname(DB_PATH), { recursive: true });
  db = new DatabaseSync(DB_PATH);

  // WAL keeps reads from blocking behind an indexing write.
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA synchronous = NORMAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      checksum    TEXT NOT NULL UNIQUE,
      title       TEXT NOT NULL DEFAULT '',
      author      TEXT NOT NULL DEFAULT '',
      url         TEXT NOT NULL DEFAULT '',
      origin      TEXT NOT NULL DEFAULT 'submission',
      words       INTEGER NOT NULL DEFAULT 0,
      indexed_at  TEXT NOT NULL,
      body        TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fingerprints (
      hash    INTEGER NOT NULL,
      doc_id  INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_fp_hash ON fingerprints(hash);
    CREATE INDEX IF NOT EXISTS idx_fp_doc  ON fingerprints(doc_id);
    CREATE INDEX IF NOT EXISTS idx_doc_origin ON documents(origin);
  `);

  return db;
}

/** Content address of a document, so the same text is never stored twice. */
export function checksumOf(text) {
  return createHash("sha256").update(text.trim()).digest("hex");
}

/**
 * Add a document to the corpus.
 *
 * @param {string} text
 * @param {{title?: string, author?: string, url?: string, origin?: string}} [meta]
 * @returns {{id: number, added: boolean, fingerprints: number}}
 */
export function indexDocument(text, meta = {}) {
  const database = connect();
  const checksum = checksumOf(text);

  const existing = database.prepare("SELECT id FROM documents WHERE checksum = ?").get(checksum);
  if (existing) return { id: existing.id, added: false, fingerprints: 0 };

  const tokens = tokenize(text);
  if (tokens.length < 40) {
    // Too short to fingerprint meaningfully; indexing it would only produce
    // spurious matches against common phrasing.
    return { id: 0, added: false, fingerprints: 0 };
  }

  const info = database
    .prepare(
      `INSERT INTO documents (checksum, title, author, url, origin, words, indexed_at, body)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      checksum,
      meta.title ?? "",
      meta.author ?? "",
      meta.url ?? "",
      meta.origin ?? "submission",
      text.split(/\s+/).filter(Boolean).length,
      new Date().toISOString(),
      text
    );

  const docId = Number(info.lastInsertRowid);
  const hashes = winnow(tokens);

  const insert = database.prepare("INSERT INTO fingerprints (hash, doc_id) VALUES (?, ?)");
  database.exec("BEGIN");
  try {
    for (const hash of hashes) insert.run(hash, docId);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }

  version++;
  return { id: docId, added: true, fingerprints: hashes.size };
}

/**
 * Find corpus documents that share fingerprints with a passage.
 *
 * The inverted index makes this a hash lookup rather than a scan, so cost
 * grows with the number of matches rather than with the size of the corpus.
 *
 * @returns {Array<{url: string, title: string, content: string, shared: number}>}
 */
export function searchCorpus(passage, limit = 3, { excludeChecksum = "" } = {}) {
  const database = connect();

  const tokens = tokenize(passage);
  if (tokens.length < 8) return [];

  const hashes = [...winnow(tokens)];
  if (hashes.length === 0) return [];

  const placeholders = hashes.map(() => "?").join(",");
  const rows = database
    .prepare(
      `SELECT d.id, d.title, d.author, d.url, d.origin, d.body, d.checksum,
              COUNT(*) AS shared
         FROM fingerprints f
         JOIN documents d ON d.id = f.doc_id
        WHERE f.hash IN (${placeholders})
        GROUP BY d.id
       HAVING shared >= ?
        ORDER BY shared DESC
        LIMIT ?`
    )
    .all(...hashes, MIN_SHARED_FINGERPRINTS, limit + 1);

  return rows
    // A document must never match against its own stored copy.
    .filter((row) => row.checksum !== excludeChecksum)
    .slice(0, limit)
    .map((row) => ({
      url: row.url || `corpus://${row.id}`,
      title: row.title || `Documento ${row.id} del repositorio local`,
      content: row.body,
      shared: row.shared,
      origin: row.origin,
      author: row.author,
      provider: "corpus",
    }));
}

/** Remove a document and its fingerprints. Needed for erasure requests. */
export function forget(checksum) {
  const database = connect();
  const row = database.prepare("SELECT id FROM documents WHERE checksum = ?").get(checksum);
  if (!row) return false;

  database.prepare("DELETE FROM fingerprints WHERE doc_id = ?").run(row.id);
  database.prepare("DELETE FROM documents WHERE id = ?").run(row.id);
  version++;
  return true;
}

export function corpusStats() {
  const database = connect();
  const documents = database.prepare("SELECT COUNT(*) AS n FROM documents").get().n;
  const fingerprints = database.prepare("SELECT COUNT(*) AS n FROM fingerprints").get().n;
  const byOrigin = database
    .prepare("SELECT origin, COUNT(*) AS n FROM documents GROUP BY origin")
    .all();

  return { documents, fingerprints, byOrigin };
}

export function closeCorpus() {
  if (db) {
    db.close();
    db = null;
  }
}
