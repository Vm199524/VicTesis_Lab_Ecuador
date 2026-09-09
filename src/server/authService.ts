/**
 * authService — sesión de estudiantes del portal.
 *
 * IMPORTANTE: este módulo lo importa ÚNICAMENTE `server.ts`. Nunca debe llegar al
 * bundle del navegador: contiene hashes, secretos de sesión y credenciales OAuth.
 *
 * El hash de contraseña usa `scrypt` de `node:crypto` y la sesión es una cookie
 * firmada con HMAC-SHA256 (stateless). El almacén de cuentas es un archivo JSON
 * local en desarrollo o Firestore en producción (Cloud Run), intercambiable sin
 * tocar los endpoints: authService expone funciones síncronas sobre una caché que
 * Firestore mantiene al día (ver `initUserStore`).
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export type AuthProvider = 'password' | 'google' | 'github';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  provider: AuthProvider;
  /** Solo para provider 'password': `salt:hash`. */
  passwordHash?: string;
  /** Identificador del proveedor externo, para reconocer al mismo usuario. */
  providerId?: string;
  /**
   * El correo esta confirmado. Google y GitHub lo entregan ya verificado; una
   * cuenta con contrasena nace en `false` hasta que se abre el enlace enviado.
   */
  verified?: boolean;
  createdAt: string;
}

/** Resultado de un intento de registro o inicio de sesión. */
export interface AuthResult {
  ok: boolean;
  user?: StoredUser;
  error?: string;
  /** El correo y la contrasena son correctos, pero falta confirmar la direccion. */
  needsVerification?: boolean;
}

/** Lo único que se expone al navegador. Nunca incluye hash ni providerId. */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  provider: AuthProvider;
  verified: boolean;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSION_COOKIE = 'tesis_ecuador_session';
const SESSION_MAX_AGE_DAYS = 30;

function sessionSecret(): string {
  // En desarrollo se deriva un secreto estable del directorio del proyecto para no
  // invalidar las sesiones en cada reinicio; en producción debe venir del entorno.
  return process.env.AUTH_SECRET || `tesis-ecuador-dev-secret::${process.cwd()}`;
}

// ---------------------------------------------------------------- almacenamiento
//
// Dos respaldos para las cuentas, elegidos con USER_STORE:
//  * 'file'      — archivo JSON en .data/users.json (desarrollo local, igual que antes).
//  * 'firestore' — cada usuario es un documento en la colección `users`. authService
//                  sigue exponiendo funciones síncronas apoyándose en una caché en
//                  memoria que Firestore mantiene al día (onSnapshot): varias
//                  instancias de Cloud Run se ven entre sí sin cambiar los endpoints.
//
// Por defecto: file en desarrollo, firestore en producción (NODE_ENV=production).

function resolveStoreMode(): 'file' | 'firestore' {
  if (process.env.USER_STORE === 'file') return 'file';
  if (process.env.USER_STORE === 'firestore') return 'firestore';
  return process.env.NODE_ENV === 'production' ? 'firestore' : 'file';
}

let storeMode: 'file' | 'firestore' = resolveStoreMode();
let db: any = null;
let usersCache: StoredUser[] = [];

function readFileUsers(): StoredUser[] {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')) as StoredUser[];
  } catch {
    return [];
  }
}

function writeFileUsers(users: StoredUser[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

function readUsers(): StoredUser[] {
  return storeMode === 'firestore' ? usersCache : readFileUsers();
}

/** Firestore rechaza `undefined`; los campos opcionales se omiten al guardar. */
function sanitizeForStore(user: StoredUser): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(user) as (keyof StoredUser)[]) {
    const value = user[key];
    if (value !== undefined) out[key] = value;
  }
  return out;
}

/**
 * Persiste la lista de cuentas. En modo archivo reescribe users.json (comportamiento
 * histórico). En modo Firestore escribe un documento por usuario (set) sin borrar:
 * así dos instancias que registran cuentas distintas no se pisan entre sí.
 */
function writeUsers(users: StoredUser[]): void {
  if (storeMode !== 'firestore') {
    writeFileUsers(users);
    return;
  }
  usersCache = users.slice();
  if (!db) return; // aun sin conectar: la caché ya quedo al dia.
  const col = db.collection('users');
  const batch = db.batch();
  for (const user of users) {
    batch.set(col.doc(user.id), sanitizeForStore(user));
  }
  batch.commit().catch((err: Error) => {
    console.error('[auth] Fallo al guardar usuarios en Firestore:', err.message);
  });
}

/**
 * Conecta el almacén antes de atender tráfico. En desarrollo es un no-op (modo
 * archivo). En producción carga `users` desde Firestore y deja un listener que
 * mantiene `usersCache` sincronizada entre instancias. Si Firestore no está
 * disponible (p. ej. sin credenciales o sin base creada) cae a archivo local y el
 * servidor arranca igual, registrando el motivo.
 */
export async function initUserStore(): Promise<void> {
  if (storeMode !== 'firestore') return;

  try {
    const { initializeApp, applicationDefault, getApps } = await import('firebase-admin');
    const { getFirestore } = await import('firebase-admin/firestore');
    if (getApps().length === 0) {
      initializeApp({ credential: applicationDefault() });
    }
    db = getFirestore(getApps()[0]);
  } catch (err) {
    console.error('[auth] Firestore no disponible, usando archivo local:', (err as Error).message);
    storeMode = 'file';
    usersCache = readFileUsers();
    return;
  }

  await new Promise<void>(async (resolve) => {
    // Siembra inicial: lectura directa. El onSnapshot por sí solo no garantiza
    // entregar los documentos ya existentes a una instancia recién arrancada.
    try {
      const snap = await db.collection('users').get();
      usersCache = snap.docs.map((doc: any) => doc.data() as StoredUser);
    } catch (err) {
      console.error('[auth] No se pudo leer Firestore al arrancar:', (err as Error).message);
    }

    db.collection('users').onSnapshot(
      (snapshot: any) => {
        usersCache = snapshot.docs.map((doc: any) => doc.data() as StoredUser);
      },
      (err: Error) => {
        console.error('[auth] Listener de Firestore caído, usando archivo local:', err.message);
        storeMode = 'file';
        usersCache = readFileUsers();
      }
    );

    console.log(`[auth] Almacén de usuarios: firestore (${usersCache.length} cargados)`);
    resolve();
  });
}

export function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    provider: user.provider,
    verified: user.verified !== false,
  };
}

// -------------------------------------------------------------------- contraseñas

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, expected] = stored.split(':');
  if (!salt || !expected) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, 'hex');
  // Comparación en tiempo constante: evita filtrar información por el tiempo de respuesta.
  if (derived.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(derived, expectedBuffer);
}

// ----------------------------------------------------------------------- sesiones

function sign(value: string): string {
  return crypto.createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

export function createSessionToken(userId: string): string {
  const expiresAt = Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, expiresAt, signature] = parts;
  const payload = `${userId}.${expiresAt}`;

  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length) return null;
  if (!crypto.timingSafeEqual(expected, received)) return null;
  if (Number(expiresAt) < Date.now()) return null;

  return userId;
}

export const sessionCookie = {
  name: SESSION_COOKIE,
  maxAge: SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
};

/** Extrae una cookie del encabezado sin depender de cookie-parser. */
export function readCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

// ------------------------------------------------------------------------- cuentas

export function findUserById(id: string): StoredUser | undefined {
  return readUsers().find((user) => user.id === id);
}

export function registerWithPassword(
  name: string,
  email: string,
  password: string,
  verified: boolean
): AuthResult {
  const normalized = email.trim().toLowerCase();
  const users = readUsers();

  if (users.some((user) => user.email === normalized)) {
    return { ok: false, error: 'Ya existe una cuenta con este correo.' };
  }

  const user: StoredUser = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalized,
    provider: 'password',
    passwordHash: hashPassword(password),
    verified,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  writeUsers(users);
  return { ok: true, user };
}

export function loginWithPassword(email: string, password: string): AuthResult {
  const normalized = email.trim().toLowerCase();
  const user = readUsers().find((candidate) => candidate.email === normalized);

  // Mismo mensaje para correo inexistente y contraseña incorrecta: no se revela
  // qué correos están registrados.
  const genericError: AuthResult = { ok: false, error: 'Correo o contraseña incorrectos.' };

  if (!user) return genericError;
  if (user.provider !== 'password' || !user.passwordHash) {
    return {
      ok: false,
      error: `Esta cuenta se creó con ${user.provider === 'google' ? 'Google' : 'GitHub'}. Inicia sesión por esa vía.`,
    };
  }
  if (!verifyPassword(password, user.passwordHash)) return genericError;
  if (user.verified === false) {
    return {
      ok: false,
      error: 'Confirma tu correo antes de entrar. Revisa el mensaje que te enviamos.',
      needsVerification: true,
    };
  }

  return { ok: true, user };
}

/** Crea o recupera la cuenta asociada a un proveedor externo. */
export function upsertOAuthUser(
  provider: 'google' | 'github',
  providerId: string,
  name: string,
  email: string
): StoredUser {
  const users = readUsers();
  const normalized = email.trim().toLowerCase();

  const existing = users.find(
    (user) =>
      (user.provider === provider && user.providerId === providerId) || user.email === normalized
  );

  if (existing) {
    existing.name = name || existing.name;
    existing.providerId = providerId;
    // Entrar por Google o GitHub prueba el control del correo: la cuenta queda
    // confirmada aunque se hubiera creado antes con contrasena.
    existing.verified = true;
    writeUsers(users);
    return existing;
  }

  const user: StoredUser = {
    id: crypto.randomUUID(),
    name: name || normalized.split('@')[0],
    email: normalized,
    provider,
    providerId,
    verified: true,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  writeUsers(users);
  return user;
}

// -------------------------------------------------------- verificacion de correo

/**
 * Token de confirmacion del correo.
 *
 * Va firmado y lleva su propio vencimiento, asi que no hace falta guardarlo: el
 * servidor puede validarlo sin consultar nada. Caduca a las 24 horas.
 */
export function createVerificationToken(userId: string): string {
  const payload = `${userId}.${Date.now() + 24 * 60 * 60 * 1000}`;
  return `${payload}.${sign(payload)}`;
}

export function readVerificationToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, expiresAt, signature] = parts;
  const payload = `${userId}.${expiresAt}`;

  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length) return null;
  if (!crypto.timingSafeEqual(expected, received)) return null;
  if (Number(expiresAt) < Date.now()) return null;

  return userId;
}

/** Marca la cuenta como confirmada. Devuelve el usuario ya actualizado. */
export function markVerified(userId: string): StoredUser | null {
  const users = readUsers();
  const user = users.find((candidate) => candidate.id === userId);
  if (!user) return null;
  user.verified = true;
  writeUsers(users);
  return user;
}

export function findUserByEmail(email: string): StoredUser | undefined {
  const normalized = email.trim().toLowerCase();
  return readUsers().find((user) => user.email === normalized);
}

// --------------------------------------------------------------------------- OAuth

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
}

export function getOAuthConfig(provider: 'google' | 'github'): OAuthConfig | null {
  const prefix = provider === 'google' ? 'GOOGLE' : 'GITHUB';
  const clientId = process.env[`${prefix}_CLIENT_ID`];
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`];
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function appUrl(): string {
  return (process.env.APP_URL || `http://127.0.0.1:${process.env.PORT || 3000}`).replace(/\/$/, '');
}

/** Estado firmado del flujo OAuth: evita CSRF en el callback. */
export function createOAuthState(): string {
  const nonce = crypto.randomBytes(16).toString('base64url');
  const payload = `${nonce}.${Date.now() + 10 * 60 * 1000}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyOAuthState(state: string | undefined): boolean {
  if (!state) return false;
  const parts = state.split('.');
  if (parts.length !== 3) return false;
  const [nonce, expiresAt, signature] = parts;
  const payload = `${nonce}.${expiresAt}`;

  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length) return false;
  if (!crypto.timingSafeEqual(expected, received)) return false;
  return Number(expiresAt) >= Date.now();
}
