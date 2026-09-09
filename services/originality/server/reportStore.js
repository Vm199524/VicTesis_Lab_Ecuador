/**
 * Short-lived holding area for the buffer + layout an overlay report needs.
 *
 * `/api/extract` reads a PDF once; `/api/report-overlay` needs that same
 * buffer and its geometry again, minutes later, to draw on the original
 * instead of reprinting it. Passing the buffer back and forth through the
 * client would mean re-uploading a 25MB file just to run a check, so it is
 * kept here instead, addressed by an opaque token the client holds.
 *
 * The store is intentionally not the analysis text: if the author edits the
 * pasted text after upload, that text no longer lines up with the PDF's
 * pages one for one. The overlay always marks the literal uploaded file, so
 * it is keyed to what was extracted then, not to whatever the client sends
 * later.
 */

import { randomUUID } from "node:crypto";

const MAX_ENTRIES = 50;
const TTL_MS = 30 * 60 * 1000;

/** @type {Map<string, { buffer: Buffer, layout: object, text: string, filename: string, expiresAt: number }>} */
const store = new Map();

function sweep() {
  const now = Date.now();
  for (const [token, entry] of store) {
    if (entry.expiresAt <= now) store.delete(token);
  }
  // Belt-and-suspenders against a burst of large uploads outliving their TTL:
  // drop the oldest insertions first once the cap is hit.
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    store.delete(oldest);
  }
}

/** @returns {string} the token to hand back to the client. */
export function storeLayout({ buffer, layout, text, filename }) {
  sweep();
  const token = randomUUID();
  store.set(token, { buffer, layout, text, filename, expiresAt: Date.now() + TTL_MS });
  return token;
}

/** @returns {{ buffer: Buffer, layout: object, text: string, filename: string } | null} */
export function takeLayout(token) {
  if (typeof token !== "string" || !token) return null;
  sweep();
  const entry = store.get(token);
  return entry && entry.expiresAt > Date.now() ? entry : null;
}
