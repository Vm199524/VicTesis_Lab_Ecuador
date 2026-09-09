/**
 * authRoutes — endpoints de sesión del portal.
 *
 * Solo lo importa `server.ts`. Correo y contraseña están siempre disponibles;
 * Google y GitHub se activan automáticamente en cuanto existen sus credenciales
 * en el entorno. La sesión viaja en una cookie HttpOnly firmada, de modo que el
 * token nunca queda expuesto al JavaScript del navegador.
 */

import type { Express, Request, Response } from 'express';
import {
  appUrl,
  createOAuthState,
  createSessionToken,
  createVerificationToken,
  findUserByEmail,
  findUserById,
  getOAuthConfig,
  loginWithPassword,
  markVerified,
  readCookie,
  readSessionToken,
  readVerificationToken,
  registerWithPassword,
  sessionCookie,
  toPublicUser,
  upsertOAuthUser,
  verifyOAuthState,
  type PublicUser,
  type StoredUser,
} from './authService';
import {
  checkEmailPolicy,
  checkPasswordPolicy,
  clearRateLimit,
  emailVerificationRequired,
  mailerConfigured,
  passwordSignupEnabled,
  rateLimit,
} from './accountPolicy';
import { sendMail, verificationMessage } from './mailer';

/** Clave del limitador: la IP del visitante, detrás de proxy incluida. */
function clientKey(req: Request, scope: string): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : (forwarded || '').split(',')[0].trim() || req.socket.remoteAddress || 'desconocido';
  return `${scope}:${ip}`;
}

/**
 * Entrega el enlace de confirmación.
 *
 * Devuelve el enlace cuando NO se pudo enviar por correo y el portal está en
 * desarrollo: así se puede probar el circuito completo sin servidor SMTP. En
 * producción nunca se devuelve — sería regalar la confirmación a quien registra.
 */
async function deliverVerification(user: StoredUser): Promise<string | undefined> {
  const link = `${appUrl()}/api/auth/verify?token=${createVerificationToken(user.id)}`;

  if (mailerConfigured()) {
    try {
      await sendMail({ to: user.email, ...verificationMessage(user.name, link) });
      return undefined;
    } catch (error) {
      console.error('[auth] No se pudo enviar el correo de confirmación:', (error as Error).message);
    }
  }

  console.log(`[auth] Enlace de confirmación para ${user.email}: ${link}`);
  return process.env.NODE_ENV === 'production' ? undefined : link;
}

function setSessionCookie(res: Response, userId: string): void {
  res.cookie(sessionCookie.name, createSessionToken(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: sessionCookie.maxAge,
    path: '/',
  });
}

function currentUser(req: Request): PublicUser | null {
  const token = readCookie(req.headers.cookie, sessionCookie.name);
  const userId = readSessionToken(token);
  if (!userId) return null;
  const user = findUserById(userId);
  return user ? toPublicUser(user) : null;
}

function resolveProvider(value: string): 'google' | 'github' | null {
  if (value === 'google') return 'google';
  if (value === 'github') return 'github';
  return null;
}

export function registerAuthRoutes(app: Express): void {
  /** Qué formas de iniciar sesión están realmente disponibles en este despliegue. */
  app.get('/api/auth/providers', (_req, res) => {
    res.json({
      password: true,
      passwordSignup: passwordSignupEnabled(),
      google: getOAuthConfig('google') !== null,
      github: getOAuthConfig('github') !== null,
    });
  });

  app.get('/api/auth/me', (req, res) => {
    res.json({ user: currentUser(req) });
  });

  app.post('/api/auth/register', async (req, res) => {
    const limited = rateLimit(clientKey(req, 'register'));
    if (!limited.ok) {
      res.status(429).json({ error: limited.error });
      return;
    }

    if (!passwordSignupEnabled()) {
      res.status(403).json({
        error:
          'El registro con correo y contraseña está cerrado en este portal. Entra con Google o con GitHub.',
      });
      return;
    }

    const name = typeof req.body?.name === 'string' ? req.body.name : '';
    const email = typeof req.body?.email === 'string' ? req.body.email : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (name.trim().length < 2) {
      res.status(400).json({ error: 'Escribe tu nombre.' });
      return;
    }

    const emailPolicy = checkEmailPolicy(email);
    if (!emailPolicy.ok) {
      res.status(400).json({ error: emailPolicy.error });
      return;
    }

    const passwordPolicy = checkPasswordPolicy(password);
    if (!passwordPolicy.ok) {
      res.status(400).json({ error: passwordPolicy.error });
      return;
    }

    const needsVerification = emailVerificationRequired();
    const result = registerWithPassword(name, email, password, !needsVerification);
    if (!result.ok || !result.user) {
      res.status(409).json({ error: result.error });
      return;
    }

    if (!needsVerification) {
      setSessionCookie(res, result.user.id);
      res.json({ user: toPublicUser(result.user) });
      return;
    }

    // Sin sesión: la cuenta existe pero no sirve hasta confirmar el correo.
    const link = await deliverVerification(result.user);
    res.json({
      pendingVerification: true,
      email: result.user.email,
      verifyUrl: link,
      message: link
        ? 'Cuenta creada. No hay servidor de correo configurado, así que aquí tienes el enlace de confirmación.'
        : `Cuenta creada. Te enviamos un enlace de confirmación a ${result.user.email}. Ábrelo para poder entrar.`,
    });
  });

  /** Reenvía el enlace de confirmación a una cuenta que aún no lo abrió. */
  app.post('/api/auth/resend-verification', async (req, res) => {
    const limited = rateLimit(clientKey(req, 'resend'));
    if (!limited.ok) {
      res.status(429).json({ error: limited.error });
      return;
    }

    const email = typeof req.body?.email === 'string' ? req.body.email : '';
    const user = findUserByEmail(email);

    // Respuesta idéntica exista o no la cuenta: no se revela quién está registrado.
    if (user && user.provider === 'password' && user.verified === false) {
      await deliverVerification(user);
    }
    res.json({ ok: true, message: 'Si esa cuenta existe y falta confirmarla, el enlace va en camino.' });
  });

  /** Destino del enlace del correo. Confirma la cuenta y deja la sesión abierta. */
  app.get('/api/auth/verify', (req, res) => {
    const token = typeof req.query.token === 'string' ? req.query.token : undefined;
    const userId = readVerificationToken(token);
    if (!userId) {
      res.redirect('/?auth=verify-expired');
      return;
    }

    const user = markVerified(userId);
    if (!user) {
      res.redirect('/?auth=verify-expired');
      return;
    }

    setSessionCookie(res, user.id);
    res.redirect('/?auth=verified');
  });

  app.post('/api/auth/login', (req, res) => {
    const key = clientKey(req, 'login');
    const limited = rateLimit(key);
    if (!limited.ok) {
      res.status(429).json({ error: limited.error });
      return;
    }

    const email = typeof req.body?.email === 'string' ? req.body.email : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    const result = loginWithPassword(email, password);
    if (!result.ok || !result.user) {
      res.status(result.needsVerification ? 403 : 401).json({
        error: result.error,
        needsVerification: result.needsVerification ?? false,
      });
      return;
    }

    clearRateLimit(key);
    setSessionCookie(res, result.user.id);
    res.json({ user: toPublicUser(result.user) });
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.clearCookie(sessionCookie.name, { path: '/' });
    res.json({ ok: true });
  });

  // -------------------------------------------------------------- OAuth: inicio

  app.get('/api/auth/:provider', (req, res) => {
    const provider = resolveProvider(req.params.provider);
    if (!provider) {
      res.status(404).json({ error: 'Proveedor no reconocido.' });
      return;
    }

    const config = getOAuthConfig(provider);
    if (!config) {
      res.status(503).json({
        error:
          provider === 'google'
            ? 'Google aún no está configurado. Define GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en tu archivo .env.'
            : 'GitHub aún no está configurado. Define GITHUB_CLIENT_ID y GITHUB_CLIENT_SECRET en tu archivo .env.',
      });
      return;
    }

    const state = createOAuthState();
    const redirectUri = `${appUrl()}/api/auth/${provider}/callback`;

    const url =
      provider === 'google'
        ? `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'openid email profile',
            state,
            prompt: 'select_account',
          }).toString()}`
        : `https://github.com/login/oauth/authorize?${new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: redirectUri,
            scope: 'read:user user:email',
            state,
          }).toString()}`;

    res.redirect(url);
  });

  // ------------------------------------------------------------ OAuth: callback

  app.get('/api/auth/:provider/callback', async (req, res) => {
    const provider = resolveProvider(req.params.provider);
    const config = provider ? getOAuthConfig(provider) : null;

    if (!provider || !config) {
      res.redirect('/?auth=error');
      return;
    }
    if (!verifyOAuthState(typeof req.query.state === 'string' ? req.query.state : undefined)) {
      res.redirect('/?auth=state');
      return;
    }

    const code = typeof req.query.code === 'string' ? req.query.code : '';
    if (!code) {
      res.redirect('/?auth=cancelled');
      return;
    }

    try {
      const redirectUri = `${appUrl()}/api/auth/${provider}/callback`;
      let profile: { id: string; name: string; email: string };

      if (provider === 'google') {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: config.clientId,
            client_secret: config.clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });
        const tokens = (await tokenResponse.json()) as { access_token?: string };
        if (!tokens.access_token) throw new Error('Google no devolvió un token de acceso');

        const infoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const info = (await infoResponse.json()) as { sub: string; name?: string; email?: string };
        if (!info.email) throw new Error('Google no devolvió el correo');

        profile = { id: info.sub, name: info.name ?? '', email: info.email };
      } else {
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            code,
            client_id: config.clientId,
            client_secret: config.clientSecret,
            redirect_uri: redirectUri,
          }),
        });
        const tokens = (await tokenResponse.json()) as { access_token?: string };
        if (!tokens.access_token) throw new Error('GitHub no devolvió un token de acceso');

        const headers = {
          Authorization: `Bearer ${tokens.access_token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'tesis-ecuador-portal-universitario',
        };

        const userResponse = await fetch('https://api.github.com/user', { headers });
        const githubUser = (await userResponse.json()) as {
          id: number;
          name?: string;
          login: string;
          email?: string;
        };

        let email = githubUser.email ?? undefined;
        if (!email) {
          // El correo puede estar oculto en el perfil público: se pide el verificado.
          const emailsResponse = await fetch('https://api.github.com/user/emails', { headers });
          const emails = (await emailsResponse.json()) as Array<{
            email: string;
            primary: boolean;
            verified: boolean;
          }>;
          email = emails.find((item) => item.primary && item.verified)?.email;
        }
        if (!email) throw new Error('GitHub no devolvió un correo verificado');

        profile = { id: String(githubUser.id), name: githubUser.name || githubUser.login, email };
      }

      const user = upsertOAuthUser(provider, profile.id, profile.name, profile.email);
      setSessionCookie(res, user.id);
      res.redirect('/?auth=ok');
    } catch (error) {
      console.error(`Error en el callback de ${provider}:`, error);
      res.redirect('/?auth=error');
    }
  });
}
