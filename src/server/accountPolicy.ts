/**
 * accountPolicy — quién puede abrir una cuenta con correo y contraseña.
 *
 * Sin estas reglas, cualquiera escribe un correo inventado y entra: el formulario
 * no comprueba que la dirección exista ni que sea de una persona real. Eso no es
 * lo normal en un sistema serio, es simplemente un formulario sin validar.
 *
 * Aquí se aplican tres capas, de la más barata a la más costosa:
 *
 *   1. Sintaxis y dominio: se rechaza lo que no puede ser un correo real y los
 *      dominios desechables (10minutemail y compañía), que existen justo para
 *      saltarse cualquier verificación.
 *   2. Lista de dominios permitidos (opcional): si `AUTH_ALLOWED_EMAIL_DOMAINS`
 *      está definida, solo se admiten esos dominios. Poner `edu.ec` restringe el
 *      registro a correos universitarios del Ecuador.
 *   3. Verificación del correo: la cuenta nace sin confirmar y no sirve para
 *      entrar hasta que se abre el enlace que se envía a esa dirección. Es la
 *      única capa que demuestra que quien registra el correo lo controla.
 *
 * Google y GitHub no pasan por aquí: esos proveedores ya verificaron el correo
 * antes de entregárnoslo, y por eso son la puerta recomendada.
 */

export interface PolicyResult {
  ok: boolean;
  error?: string;
}

/** Sintaxis conservadora: un `@`, dominio con punto y TLD de al menos dos letras. */
const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;

/**
 * Dominios de correo temporal más difundidos. No pretende ser exhaustiva —ninguna
 * lista lo es— pero corta el atajo evidente. La verificación por correo es la
 * defensa real; esto solo ahorra trabajo inútil.
 */
const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com',
  '20minutemail.com',
  'anonbox.net',
  'burnermail.io',
  'dispostable.com',
  'emailondeck.com',
  'fakeinbox.com',
  'getnada.com',
  'guerrillamail.com',
  'guerrillamail.info',
  'inboxbear.com',
  'mailcatch.com',
  'maildrop.cc',
  'mailinator.com',
  'mailnesia.com',
  'mintemail.com',
  'mohmal.com',
  'moakt.com',
  'sharklasers.com',
  'spam4.me',
  'tempmail.com',
  'temp-mail.org',
  'tempmailo.com',
  'throwawaymail.com',
  'trashmail.com',
  'yopmail.com',
  'yopmail.net',
]);

function domainOf(email: string): string {
  return email.trim().toLowerCase().split('@')[1] ?? '';
}

/**
 * Dominios admitidos, si el despliegue los limita.
 * Ejemplo: `AUTH_ALLOWED_EMAIL_DOMAINS="edu.ec,espol.edu.ec"`.
 * Se compara por sufijo, así que `edu.ec` cubre a todas las universidades del país.
 */
function allowedDomains(): string[] {
  return (process.env.AUTH_ALLOWED_EMAIL_DOMAINS || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function checkEmailPolicy(email: string): PolicyResult {
  const normalized = email.trim().toLowerCase();

  if (!EMAIL_PATTERN.test(normalized)) {
    return { ok: false, error: 'Escribe un correo electrónico válido.' };
  }

  const domain = domainOf(normalized);

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      ok: false,
      error: 'Los correos temporales no sirven para registrarse. Usa tu correo habitual.',
    };
  }

  const allowed = allowedDomains();
  if (allowed.length > 0) {
    const matches = allowed.some(
      (suffix) => domain === suffix || domain.endsWith(`.${suffix}`)
    );
    if (!matches) {
      return {
        ok: false,
        error: `Este portal solo admite correos de: ${allowed.join(', ')}. También puedes entrar con Google.`,
      };
    }
  }

  return { ok: true };
}

/**
 * Diez caracteres con letras y números. No se exige símbolo: alarga más la
 * contraseña que complicarla, y las reglas barrocas empujan a escribirla en un
 * papel pegado al monitor.
 */
export function checkPasswordPolicy(password: string): PolicyResult {
  if (password.length < 10) {
    return { ok: false, error: 'La contraseña debe tener al menos 10 caracteres.' };
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { ok: false, error: 'La contraseña debe combinar letras y números.' };
  }
  if (/^(.)\1+$/.test(password)) {
    return { ok: false, error: 'Esa contraseña es demasiado predecible.' };
  }
  return { ok: true };
}

/**
 * ¿Se permite abrir cuentas con correo y contraseña?
 *
 * Por defecto sí en desarrollo y no en producción: sin un servidor de correo
 * configurado no se puede entregar el enlace de confirmación, y una cuenta que
 * nadie confirma es exactamente el problema que queremos evitar. Se fuerza con
 * `AUTH_PASSWORD_SIGNUP=on` u `off`.
 */
export function passwordSignupEnabled(): boolean {
  const flag = (process.env.AUTH_PASSWORD_SIGNUP || '').trim().toLowerCase();
  if (flag === 'on' || flag === 'true') return true;
  if (flag === 'off' || flag === 'false') return false;
  return process.env.NODE_ENV !== 'production' || mailerConfigured();
}

/** ¿Hay forma de entregar el enlace de confirmación? */
export function mailerConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/**
 * ¿Hay que confirmar el correo antes de poder entrar?
 * Se apaga solo si alguien lo desactiva a propósito con
 * `AUTH_REQUIRE_EMAIL_VERIFICATION=false`.
 */
export function emailVerificationRequired(): boolean {
  return (process.env.AUTH_REQUIRE_EMAIL_VERIFICATION || '').trim().toLowerCase() !== 'false';
}

/**
 * Límite de intentos por dirección IP. Es memoria del proceso: se pierde al
 * reiniciar y no sirve para varias instancias, pero frena en seco el ataque de
 * fuerza bruta doméstico, que es el que realmente ocurre en un portal como este.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export function rateLimit(key: string): PolicyResult {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }

  entry.count += 1;
  if (entry.count > MAX_ATTEMPTS) {
    const minutes = Math.ceil((entry.resetAt - now) / 60000);
    return {
      ok: false,
      error: `Demasiados intentos. Vuelve a probar en ${minutes} minuto${minutes === 1 ? '' : 's'}.`,
    };
  }
  return { ok: true };
}

/** Un inicio de sesión correcto no debe contar contra el límite. */
export function clearRateLimit(key: string): void {
  attempts.delete(key);
}
