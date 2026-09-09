import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  provider: 'password' | 'google' | 'github';
  /** El correo está confirmado. Google y GitHub llegan siempre confirmados. */
  verified: boolean;
}

export interface AuthProviders {
  password: boolean;
  /** Si está cerrado, la única vía son Google y GitHub. */
  passwordSignup: boolean;
  google: boolean;
  github: boolean;
}

/**
 * Resultado de un intento de acceso.
 *
 * `pending` significa que la cuenta se creó pero todavía no abre sesión: falta
 * que el estudiante confirme su correo. No es un error, es un paso más.
 */
export interface AuthOutcome {
  ok: boolean;
  error?: string;
  pending?: boolean;
  message?: string;
  /** Solo en desarrollo sin SMTP: el enlace que llegaría por correo. */
  verifyUrl?: string;
  /** El acceso falló porque la cuenta existe pero no está confirmada. */
  needsVerification?: boolean;
}

interface AuthContextValue {
  user: SessionUser | null;
  /** Aún no se sabe si hay sesión: evita parpadeos en la barra superior. */
  loading: boolean;
  providers: AuthProviders;
  signIn: (email: string, password: string) => Promise<AuthOutcome>;
  signUp: (name: string, email: string, password: string) => Promise<AuthOutcome>;
  resendVerification: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Firebase Hosting no reenvía la cookie entrante al reescribir hacia Cloud Run,
 * así que el token se guarda además en localStorage y viaja por la cabecera
 * `x-session-token` (el proxy sí la reenvía). La cookie HttpOnly se mantiene como
 * vía para los accesos directos a *.run.app. La sesión siempre se valida en el
 * servidor contra el token firmado; aquí nunca se guarda nada sensible más que
 * el propio token, y el perfil público que devuelve el servidor.
 */
const TOKEN_KEY = 'tesis_session_token';

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Sin almacenamiento local la sesión simplemente no persiste entre pestañas.
  }
}

function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nada que limpiar.
  }
}

function sessionHeaders(): Record<string, string> {
  const token = readStoredToken();
  return token ? { 'x-session-token': token } : {};
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<AuthProviders>({
    password: true,
    passwordSignup: true,
    google: false,
    github: false,
  });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      // Vuelta de OAuth o de verificación: el servidor entrega el token en el
      // fragmento (#s=...) para que sobreviva al hosting. Se guarda y se limpia
      // la URL sin recargar.
      const hashToken = window.location.hash.match(/[#&]s=([^&]+)/);
      if (hashToken) {
        try {
          storeToken(decodeURIComponent(hashToken[1]));
        } catch {
          // Fragmento inválido: se ignora.
        }
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        );
      }

      try {
        const [meResponse, providersResponse] = await Promise.all([
          fetch('/api/auth/me', { headers: sessionHeaders(), credentials: 'same-origin' }),
          fetch('/api/auth/providers', { credentials: 'same-origin' }),
        ]);

        if (cancelled) return;

        if (meResponse.ok) {
          const data = (await meResponse.json()) as { user: SessionUser | null };
          setUser(data.user);
        }
        if (providersResponse.ok) {
          setProviders((await providersResponse.json()) as AuthProviders);
        }
      } catch {
        // Sin servidor de sesión disponible el portal sigue siendo usable sin cuenta.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const post = useCallback(
    async (url: string, body: unknown): Promise<AuthOutcome> => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...sessionHeaders() },
          credentials: 'same-origin',
          body: JSON.stringify(body),
        });
        const data = (await response.json()) as {
          user?: SessionUser;
          token?: string;
          error?: string;
          pendingVerification?: boolean;
          message?: string;
          verifyUrl?: string;
          needsVerification?: boolean;
        };

        if (!response.ok) {
          return {
            ok: false,
            error: data.error ?? 'No se pudo completar la operación.',
            needsVerification: data.needsVerification,
          };
        }
        if (data.pendingVerification) {
          return {
            ok: false,
            pending: true,
            message: data.message,
            verifyUrl: data.verifyUrl,
          };
        }
        if (data.token) storeToken(data.token);
        if (data.user) setUser(data.user);
        return { ok: true };
      } catch {
        return { ok: false, error: 'No hay conexión con el servidor.' };
      }
    },
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      providers,
      signIn: (email, password) => post('/api/auth/login', { email, password }),
      signUp: (name, email, password) => post('/api/auth/register', { name, email, password }),
      resendVerification: async (email) => {
        await post('/api/auth/resend-verification', { email });
      },
      signOut: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
        } catch {
          // Aunque falle la petición, la sesión local se cierra.
        }
        clearStoredToken();
        setUser(null);
      },
    }),
    [user, loading, providers, post]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return context;
}
