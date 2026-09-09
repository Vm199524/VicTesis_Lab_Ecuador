/**
 * mailer — envío del correo de confirmación de cuenta.
 *
 * Cliente SMTP mínimo escrito sobre `node:net` y `node:tls`. Se implementa a mano
 * para no añadir una dependencia (nodemailer arrastra decenas de paquetes) cuando
 * el portal envía exactamente un tipo de mensaje: el enlace de verificación.
 *
 * Soporta las dos formas habituales:
 *   - puerto 465, TLS desde el primer byte (Gmail, Zoho, la mayoría);
 *   - puerto 587, conexión limpia que se eleva a TLS con STARTTLS.
 *
 * Configuración en `.env`:
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=465
 *   SMTP_USER=tucorreo@gmail.com
 *   SMTP_PASS=<contraseña de aplicación, no la del correo>
 *   SMTP_FROM="Tesis Ecuador <tucorreo@gmail.com>"
 */

import net from 'net';
import tls from 'tls';

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

function readConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  return {
    host,
    port: Number(process.env.SMTP_PORT) || 465,
    user,
    pass,
    from: process.env.SMTP_FROM || `Tesis Ecuador <${user}>`,
  };
}

/**
 * Conversación SMTP.
 *
 * El servidor responde con líneas `NNN texto`; una respuesta de varias líneas usa
 * `NNN-` en todas menos la última. Se acumula hasta ver la línea final y se
 * compara el código con el esperado.
 */
function talk(socket: net.Socket | tls.TLSSocket, steps: { send?: string; expect: number }[]) {
  return new Promise<void>((resolve, reject) => {
    let buffer = '';
    let index = 0;
    let settled = false;

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.removeAllListeners('data');
      if (error) reject(error);
      else resolve();
    };

    const timer = setTimeout(() => finish(new Error('El servidor de correo no respondió a tiempo.')), 20000);

    socket.on('error', (error) => finish(error));
    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf-8');

      // Una respuesta está completa cuando su última línea usa espacio, no guion.
      const lines = buffer.split('\r\n').filter(Boolean);
      const last = lines[lines.length - 1];
      if (!last || !/^\d{3} /.test(last)) return;

      const code = Number(last.slice(0, 3));
      const step = steps[index];
      buffer = '';

      if (code !== step.expect) {
        finish(new Error(`SMTP respondió ${code}: ${last.slice(4)}`));
        return;
      }

      index += 1;
      const next = steps[index];
      if (!next) {
        finish();
        return;
      }
      if (next.send !== undefined) socket.write(next.send + '\r\n');
    });

    // El primer paso solo espera el saludo del servidor; no se envía nada.
    if (steps[0].send !== undefined) socket.write(steps[0].send + '\r\n');
  });
}

function b64(value: string): string {
  return Buffer.from(value, 'utf-8').toString('base64');
}

/** Cabeceras con acentos deben ir codificadas o llegan rotas a algunos clientes. */
function encodeHeader(value: string): string {
  // eslint-disable-next-line no-control-regex
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${b64(value)}?=`;
}

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Entrega el mensaje. Devuelve `false` cuando no hay SMTP configurado, para que
 * quien llama decida qué hacer (en desarrollo, mostrar el enlace en consola).
 * Lanza si hay configuración pero el envío falla: ese error sí hay que verlo.
 */
export async function sendMail(message: MailMessage): Promise<boolean> {
  const config = readConfig();
  if (!config) return false;

  const socket: net.Socket | tls.TLSSocket =
    config.port === 465
      ? tls.connect({ host: config.host, port: config.port, servername: config.host })
      : net.connect({ host: config.host, port: config.port });

  await new Promise<void>((resolve, reject) => {
    socket.once('secureConnect', () => resolve());
    socket.once('connect', () => resolve());
    socket.once('error', reject);
  });

  let channel: net.Socket | tls.TLSSocket = socket;

  if (config.port !== 465) {
    // STARTTLS: se negocia en claro y se eleva el mismo socket a TLS.
    await talk(socket, [
      { expect: 220 },
      { send: `EHLO ${config.host}`, expect: 250 },
      { send: 'STARTTLS', expect: 220 },
    ]);
    channel = tls.connect({ socket, servername: config.host });
    await new Promise<void>((resolve, reject) => {
      (channel as tls.TLSSocket).once('secureConnect', () => resolve());
      channel.once('error', reject);
    });
  }

  const boundary = `tesis-${Date.now().toString(36)}`;
  const body = [
    `From: ${config.from}`,
    `To: ${message.to}`,
    `Subject: ${encodeHeader(message.subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    b64(message.text),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    b64(message.html),
    `--${boundary}--`,
    '',
  ].join('\r\n');

  const greeting = config.port === 465 ? [{ expect: 220 }] : [];

  await talk(channel, [
    ...greeting,
    { send: `EHLO ${config.host}`, expect: 250 },
    { send: 'AUTH LOGIN', expect: 334 },
    { send: b64(config.user), expect: 334 },
    { send: b64(config.pass), expect: 235 },
    { send: `MAIL FROM:<${config.user}>`, expect: 250 },
    { send: `RCPT TO:<${message.to}>`, expect: 250 },
    { send: 'DATA', expect: 354 },
    // Un punto solo en una línea cierra el cuerpo del mensaje.
    { send: `${body}\r\n.`, expect: 250 },
    { send: 'QUIT', expect: 221 },
  ]);

  channel.end();
  return true;
}

/** Cuerpo del correo de confirmación. */
export function verificationMessage(name: string, link: string): Omit<MailMessage, 'to'> {
  const saludo = name ? `Hola ${name},` : 'Hola,';
  return {
    subject: 'Confirma tu correo · Tesis Ecuador',
    text: `${saludo}\n\nConfirma tu cuenta abriendo este enlace:\n${link}\n\nEl enlace caduca en 24 horas. Si no fuiste tú, ignora este mensaje.\n\nTesis Ecuador`,
    html: `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;color:#0f172a">
  <p style="font-size:15px">${saludo}</p>
  <p style="font-size:15px;line-height:1.6">Confirma tu cuenta en <strong>Tesis Ecuador</strong> para poder usar los módulos del portal.</p>
  <p style="margin:26px 0"><a href="${link}" style="background:#002B49;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block">Confirmar mi correo</a></p>
  <p style="font-size:12.5px;color:#64748b;line-height:1.6">El enlace caduca en 24 horas. Si no creaste esta cuenta, ignora este mensaje.</p>
</div>`,
  };
}
