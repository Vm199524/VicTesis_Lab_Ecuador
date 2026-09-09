/**
 * originalityService — arranca el detector junto con el portal.
 *
 * El Verificador de Originalidad no es código del portal: es un servicio Express
 * aparte que vive en `services/originality` y escucha en su propio puerto. Antes
 * había que levantarlo a mano en otra terminal, y el módulo aparecía roto para
 * cualquiera que no supiera ese detalle.
 *
 * Aquí el portal lo lanza como proceso hijo al arrancar y lo cierra cuando él se
 * cierra, de modo que `npm run dev` deja el sistema completo en pie.
 *
 * No se toca nada si:
 *   - `ORIGINALITY_AUTOSTART=false`;
 *   - `ORIGINALITY_API_URL` apunta a otra máquina (allí no hay nada que lanzar);
 *   - el servicio ya está respondiendo (alguien lo levantó por su cuenta).
 */

import { spawn, type ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

const SERVICE_DIR = path.join(process.cwd(), 'services', 'originality');

let child: ChildProcess | null = null;
let startingPromise: Promise<void> | null = null;

function serviceUrl(): string {
  return (process.env.ORIGINALITY_API_URL || 'http://127.0.0.1:5000').replace(/\/+$/, '');
}

/** ¿La URL configurada apunta a esta misma máquina? */
function isLocal(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === '127.0.0.1' || host === 'localhost' || host === '::1' || host === '0.0.0.0';
  } catch {
    return false;
  }
}

/** Una llamada corta a `/api/limits`: si contesta, el servicio ya está en pie. */
async function isAlive(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const response = await fetch(`${url}/api/limits`, { signal: controller.signal });
    clearTimeout(timer);
    return response.ok;
  } catch {
    return false;
  }
}

/** Prefija cada línea del hijo para no confundirla con los registros del portal. */
function pipeLogs(process_: ChildProcess): void {
  const write = (prefix: string) => (chunk: Buffer) => {
    const text = chunk.toString('utf-8').trimEnd();
    if (text) console.log(`${prefix} ${text.split('\n').join(`\n${prefix} `)}`);
  };
  process_.stdout?.on('data', write('[originalidad]'));
  process_.stderr?.on('data', write('[originalidad]'));
}

/** Lazy-loading: inicia el servicio bajo demanda solo una vez. */
export async function ensureOriginalityService(): Promise<void> {
  // Si ya está iniciándose, espera a que termine
  if (startingPromise) {
    await startingPromise;
    return;
  }

  // Si ya está vivo, no hacer nada
  const url = serviceUrl();
  if (await isAlive(url)) {
    return;
  }

  // Iniciar una sola vez
  startingPromise = startOriginalityService();
  try {
    await startingPromise;
  } finally {
    startingPromise = null;
  }
}

export async function startOriginalityService(): Promise<void> {
  if ((process.env.ORIGINALITY_AUTOSTART || '').trim().toLowerCase() === 'false') return;

  const url = serviceUrl();

  if (!isLocal(url)) {
    console.log(`[originalidad] Servicio remoto en ${url}: el portal no lo arranca.`);
    return;
  }

  if (await isAlive(url)) {
    console.log(`[originalidad] Ya estaba en marcha en ${url}.`);
    return;
  }

  const entry = path.join(SERVICE_DIR, 'server', 'index.js');
  if (!fs.existsSync(entry)) {
    console.warn(
      `[originalidad] No se encontró el servicio en ${SERVICE_DIR}. El módulo de originalidad quedará sin servicio.`
    );
    return;
  }

  if (!fs.existsSync(path.join(SERVICE_DIR, 'node_modules'))) {
    console.warn(
      `[originalidad] Faltan las dependencias del detector. Ejecuta una vez: npm install --prefix "${SERVICE_DIR}"`
    );
    return;
  }

  // `dist/public` es la interfaz propia del detector. Si está compilada se arranca
  // en modo producción, que es mucho más ligero: no levanta un segundo Vite.
  const built = fs.existsSync(path.join(SERVICE_DIR, 'dist', 'public', 'index.html'));
  const port = (() => {
    try {
      return new URL(url).port || '5000';
    } catch {
      return '5000';
    }
  })();

  console.log(`[originalidad] Arrancando el detector en el puerto ${port}…`);

  child = spawn(process.execPath, [entry], {
    cwd: SERVICE_DIR,
    env: {
      ...process.env,
      PORT: port,
      NODE_ENV: built ? 'production' : 'development',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    // En Windows, matar el padre no arrastra al hijo salvo que se aísle el grupo.
    detached: process.platform !== 'win32',
  });

  pipeLogs(child);

  child.on('exit', (code, signal) => {
    if (code !== 0 && signal === null) {
      console.warn(`[originalidad] El detector terminó con código ${code}.`);
    }
    child = null;
  });

  child.on('error', (error) => {
    console.warn('[originalidad] No se pudo arrancar el detector:', error.message);
    child = null;
  });

  // Haber lanzado el proceso no es lo mismo que que el servicio responda: Express
  // tarda en escuchar y los modelos ONNX en cargar. Antes esta espera corría suelta
  // y `ensureOriginalityService` resolvía en cuanto `spawn` retornaba, así que la
  // primera petición del usuario salía contra un puerto todavía cerrado y moría con
  // «extract falló: fetch failed». Se espera aquí, y quien llame recibe el control
  // cuando el detector ya contesta de verdad.
  await waitUntilAlive(url);
}

/**
 * Sondea hasta que el detector conteste, o se rinde tras un minuto.
 *
 * Los primeros intentos van seguidos porque el caso normal —el servicio ya
 * compilado— levanta en menos de dos segundos; espaciarlos desde el principio
 * añadiría una espera que nadie necesita. A partir de ahí el ritmo baja, que es
 * cuando se están cargando los modelos.
 */
async function waitUntilAlive(url: string): Promise<void> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, attempt < 6 ? 400 : 1500));
    if (!child) return;
    if (await isAlive(url)) {
      console.log(`[originalidad] Listo en ${url}.`);
      return;
    }
  }
  console.warn('[originalidad] El detector no respondió tras un minuto de espera.');
}

/** Cierra el hijo para no dejar un puerto ocupado al parar el portal. */
export function stopOriginalityService(): void {
  if (!child || child.killed) return;
  try {
    if (process.platform === 'win32') child.kill();
    else if (child.pid) process.kill(-child.pid, 'SIGTERM');
  } catch {
    // El hijo ya había terminado.
  }
  child = null;
}
