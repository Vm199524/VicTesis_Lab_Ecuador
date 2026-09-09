import type { Express, Request, Response } from 'express';
import { Readable } from 'stream';
import { ensureOriginalityService } from './originalityService';

/**
 * Puente hacia el servicio de Verificación de Originalidad.
 *
 * El detector es un servicio aparte (Express + SQLite + modelos ONNX) que vive en
 * `services/originality/`. En lugar de duplicar su lógica dentro del portal, el
 * portal la expone bajo `/api/originality/*` y reenvía la petición.
 *
 * Así el navegador nunca necesita conocer el puerto del servicio ni saltarse el
 * mismo origen, y el detector puede desplegarse en otra máquina cambiando una
 * sola variable de entorno.
 */

const ORIGINALITY_URL = (
  process.env.ORIGINALITY_API_URL || 'http://127.0.0.1:5000'
).replace(/\/+$/, '');

/** Rutas del servicio que el portal deja alcanzar. Todo lo demás queda fuera. */
const ALLOWED = new Set([
  'limits',
  'extract',
  'plagiarism-check',
  'report',
  'report-overlay',
  'ai-detect',
  'ai-report',
]);

/**
 * Un análisis completo consulta ocho proveedores externos y puede tardar varios
 * minutos en documentos largos; el tiempo de espera por defecto de `fetch` lo
 * cortaría a mitad de camino.
 */
const TIMEOUT_MS = Number(process.env.ORIGINALITY_TIMEOUT_MS) || 10 * 60 * 1000;

/**
 * El portal arranca el detector solo (`originalityService.ts`), así que este
 * mensaje ya no es una instrucción sino un diagnóstico: si aparece, el servicio
 * murió o todavía está cargando sus modelos.
 */
const OFFLINE_MESSAGE =
  'El verificador aún no responde. Suele estar cargando sus modelos en el primer arranque: espera unos segundos y vuelve a intentarlo. Si persiste, revisa la consola del servidor.';

async function forward(req: Request, res: Response, endpoint: string): Promise<void> {
  if (!ALLOWED.has(endpoint)) {
    res.status(404).json({ error: 'Endpoint no disponible.' });
    return;
  }

  // Lazy-loading: asegurar que el servicio está en marcha
  try {
    await ensureOriginalityService();
  } catch (error) {
    console.error('[originalidad] Error al iniciar el servicio:', error);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const isJson = req.method !== 'GET' && !req.is('multipart/form-data');
    const headers: Record<string, string> = {};

    let body: BodyInit | Readable | undefined;
    if (req.method !== 'GET') {
      if (isJson) {
        // `express.json()` ya consumió el flujo: se reenvía el objeto ya parseado.
        headers['content-type'] = 'application/json';
        body = JSON.stringify(req.body ?? {});
      } else {
        // La subida de archivos viaja tal cual, sin pasar por memoria del portal.
        const contentType = req.headers['content-type'];
        if (contentType) headers['content-type'] = contentType;
        body = req;
      }
    }

    const upstream = await fetch(`${ORIGINALITY_URL}/api/${endpoint}`, {
      method: req.method,
      headers,
      body: body as BodyInit | undefined,
      // Requisito de Node para enviar un flujo como cuerpo de la petición.
      ...(body && !isJson ? { duplex: 'half' } : {}),
      signal: controller.signal,
    } as RequestInit);

    res.status(upstream.status);

    // El informe vuelve como PDF: se conservan tipo y nombre de archivo.
    const passthrough = ['content-type', 'content-disposition', 'content-length'];
    for (const header of passthrough) {
      const value = upstream.headers.get(header);
      if (value) res.setHeader(header, value);
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.end(buffer);
  } catch (error) {
    const aborted = (error as Error).name === 'AbortError';
    console.error(`[originalidad] ${endpoint} falló:`, (error as Error).message);
    res.status(aborted ? 504 : 502).json({
      error: aborted
        ? 'El análisis superó el tiempo máximo de espera. Prueba con un fragmento más corto.'
        : OFFLINE_MESSAGE,
    });
  } finally {
    clearTimeout(timer);
  }
}

export function registerOriginalityRoutes(app: Express): void {
  app.get('/api/originality/limits', (req, res) => void forward(req, res, 'limits'));
  app.post('/api/originality/extract', (req, res) => void forward(req, res, 'extract'));
  app.post('/api/originality/plagiarism-check', (req, res) =>
    void forward(req, res, 'plagiarism-check')
  );
  app.post('/api/originality/report', (req, res) => void forward(req, res, 'report'));
  app.post('/api/originality/report-overlay', (req, res) =>
    void forward(req, res, 'report-overlay')
  );
  app.post('/api/originality/ai-detect', (req, res) => void forward(req, res, 'ai-detect'));
  app.post('/api/originality/ai-report', (req, res) => void forward(req, res, 'ai-report'));
}
