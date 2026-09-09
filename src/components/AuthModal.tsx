import React, { useEffect, useState } from 'react';
import { X, Mail, Lock, User, Loader2, AlertCircle, Github, MailCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Motivo por el que se pide la sesion, cuando el modal lo abre un modulo bloqueado. */
  reason?: string;
}

/** Logotipo oficial de Google en SVG: los botones de acceso deben usar la marca real. */
const GoogleMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5a11 11 0 0 0-9.82 6.55l3.66 2.84c.87-2.6 3.3-4.14 6.16-4.14Z"
    />
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, reason }) => {
  const { t, tf } = usePreferences();
  const { providers, signIn, signUp, resendVerification } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** Cuenta creada a la espera de que el estudiante abra el enlace del correo. */
  const [pending, setPending] = useState<{ message: string; verifyUrl?: string } | null>(null);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setPending(null);
      setResent(false);
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const result =
      mode === 'signin' ? await signIn(email, password) : await signUp(name, email, password);

    setBusy(false);
    setPassword('');

    if (result.ok) {
      onClose();
      return;
    }
    if (result.pending) {
      setPending({
        message: result.message ?? t('auth.verifySent'),
        verifyUrl: result.verifyUrl,
      });
      return;
    }
    setError(result.error ?? null);
  };

  const socialButton =
    'w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[13.5px] font-bold text-slate-700 transition-colors';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="surface w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {mode === 'signin' ? t('auth.signInTitle') : t('auth.signUpTitle')}
            </h2>
            <p className="text-[12.5px] text-slate-500 mt-0.5 leading-snug">
              {t('auth.subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1 -mt-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
            title={t('action.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {pending ? (
          /* Cuenta creada pero inservible hasta confirmar: no hay sesión todavía. */
          <div className="px-5 pb-5 pt-4 space-y-3">
            <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-3">
              <MailCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <p className="text-[12.5px] text-emerald-900 leading-snug font-semibold">
                {pending.message}
              </p>
            </div>

            {pending.verifyUrl && (
              <a
                href={pending.verifyUrl}
                className="block text-center px-4 py-2.5 rounded-xl bg-[#002B49] hover:bg-[#001f35] text-white text-[13.5px] font-bold transition-colors"
              >
                {t('auth.verifyOpenLink')}
              </a>
            )}

            <button
              onClick={() => {
                void resendVerification(email);
                setResent(true);
              }}
              className="w-full text-[12.5px] font-bold text-blue-700 hover:underline"
            >
              {resent ? t('auth.verifyResent') : t('auth.verifyResend')}
            </button>

            <button
              onClick={() => {
                setPending(null);
                setMode('signin');
              }}
              className="w-full text-[12.5px] text-slate-500 hover:text-slate-900"
            >
              {t('auth.signIn')}
            </button>
          </div>
        ) : (
        <div className="px-5 pb-5 pt-4 space-y-3">
          {reason && (
            <p className="flex items-start gap-2 text-[12px] font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 leading-snug">
              <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
              <span>{reason}</span>
            </p>
          )}

          {/* Proveedores externos */}
          <div className="space-y-2">
            <a
              href={providers.google ? '/api/auth/google' : undefined}
              onClick={(event) => {
                if (!providers.google) {
                  event.preventDefault();
                  setError(t('auth.googleUnavailable'));
                }
              }}
              className={`${socialButton} ${providers.google ? '' : 'opacity-60 cursor-not-allowed'}`}
            >
              <GoogleMark className="w-4 h-4" />
              <span>{t('auth.continueGoogle')}</span>
            </a>

            <a
              href={providers.github ? '/api/auth/github' : undefined}
              onClick={(event) => {
                if (!providers.github) {
                  event.preventDefault();
                  setError(t('auth.githubUnavailable'));
                }
              }}
              className={`${socialButton} ${providers.github ? '' : 'opacity-60 cursor-not-allowed'}`}
            >
              <Github className="w-4 h-4" />
              <span>{t('auth.continueGithub')}</span>
            </a>
          </div>

          <div className="flex items-center gap-3 py-0.5">
            <span className="h-px bg-slate-200 flex-1" />
            <span className="text-[10.5px] font-bold uppercase tracking-widest text-slate-400">
              {t('auth.or')}
            </span>
            <span className="h-px bg-slate-200 flex-1" />
          </div>

          {/* Correo y contraseña */}
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {mode === 'signup' && (
              <label className="block">
                <span className="sr-only">{t('auth.name')}</span>
                <span className="relative block">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={t('auth.name')}
                    autoComplete="name"
                    required
                    className="field w-full rounded-xl pl-9 pr-3 py-2.5 text-[13.5px]"
                  />
                </span>
              </label>
            )}

            <label className="block">
              <span className="sr-only">{t('auth.email')}</span>
              <span className="relative block">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t('auth.email')}
                  autoComplete="email"
                  required
                  className="field w-full rounded-xl pl-9 pr-3 py-2.5 text-[13.5px]"
                />
              </span>
            </label>

            <label className="block">
              <span className="sr-only">{t('auth.password')}</span>
              <span className="relative block">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t('auth.password')}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  minLength={mode === 'signup' ? 10 : 8}
                  required
                  className="field w-full rounded-xl pl-9 pr-10 py-2.5 text-[13.5px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? tf('auth.hidePassword', 'Ocultar contraseña') : tf('auth.showPassword', 'Mostrar contraseña')
                  }
                  title={
                    showPassword ? tf('auth.hidePassword', 'Ocultar contraseña') : tf('auth.showPassword', 'Mostrar contraseña')
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </span>
            </label>

            {mode === 'signup' && (
              <p className="text-[11px] text-slate-500 leading-snug">{t('auth.passwordHint')}</p>
            )}

            {mode === 'signup' && !providers.passwordSignup && (
              <p className="text-[11.5px] text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 leading-snug">
                {t('auth.signupClosed')}
              </p>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-[12px] text-rose-800">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy || (mode === 'signup' && !providers.passwordSignup)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#002B49] hover:bg-[#001f35] disabled:opacity-60 text-white text-[13.5px] font-bold transition-colors"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'signin' ? t('auth.signIn') : t('auth.createAccount')}
            </button>
          </form>

          <p className="text-[12.5px] text-slate-500 text-center">
            {mode === 'signin' ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
            <button
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="font-bold text-blue-700 hover:underline"
            >
              {mode === 'signin' ? t('auth.createAccount') : t('auth.signIn')}
            </button>
          </p>
        </div>
        )}
      </div>
    </div>
  );
};
