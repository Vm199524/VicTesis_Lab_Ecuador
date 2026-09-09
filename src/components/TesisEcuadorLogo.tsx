import React from 'react';
import { usePreferences } from '../context/PreferencesContext';

interface TesisEcuadorLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

/**
 * Emblema de «Tesis Ecuador».
 *
 * Sello académico circular: disco azul marino institucional (#002B49), aro
 * dorado (#c9a227) que gira lentamente, libro abierto con una marca de
 * verificación que se dibuja al montar y un arco fino con los colores de la
 * bandera del Ecuador en la base del anillo.
 *
 * Toda la animación es CSS (keyframes `te-*` definidos en `src/index.css`) y se
 * desactiva por completo bajo `prefers-reduced-motion: reduce`.
 */
export const TesisEcuadorLogo: React.FC<TesisEcuadorLogoProps> = ({
  size = 'sm',
  showSubtitle = false,
}) => {
  const { t } = usePreferences();

  // Mismas dimensiones responsivas que el emblema anterior: reemplazo directo.
  const dimensions = {
    sm: 'w-12 h-12 sm:w-14 sm:h-14',
    md: 'w-16 h-16 sm:w-20 sm:h-20',
    lg: 'w-24 h-24 sm:w-28 sm:h-28',
  };

  return (
    <div
      className="relative flex items-center gap-3 select-none shrink-0 group"
      title={`${t('brand.name')} · ${t('footer.tagline')}`}
    >
      <div className={`relative ${dimensions[size]} flex items-center justify-center shrink-0`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          role="img"
          aria-label={`${t('brand.name')}, ${t('footer.tagline').toLowerCase()}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="teDisc" cx="38%" cy="30%" r="78%">
              <stop offset="0%" stopColor="#0a4d7a" />
              <stop offset="55%" stopColor="#00365c" />
              <stop offset="100%" stopColor="#002B49" />
            </radialGradient>
            <linearGradient id="teGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e6c765" />
              <stop offset="50%" stopColor="#c9a227" />
              <stop offset="100%" stopColor="#a8811a" />
            </linearGradient>
          </defs>

          {/* Disco del sello */}
          <circle cx="50" cy="50" r="47" fill="url(#teDisc)" />

          {/* Filo dorado exterior */}
          <circle cx="50" cy="50" r="45.5" stroke="url(#teGold)" strokeWidth="1.4" />

          {/* Guiño a la bandera del Ecuador: arco fino en la base del anillo */}
          <g strokeWidth="2.4" strokeLinecap="butt" opacity="0.95">
            <path d="M 71.00 86.37 A 42 42 0 0 1 57.29 91.36" stroke="#FFD100" />
            <path d="M 57.29 91.36 A 42 42 0 0 1 42.71 91.36" stroke="#0033A0" />
            <path d="M 42.71 91.36 A 42 42 0 0 1 29.00 86.37" stroke="#EF3340" />
          </g>

          {/* Aro dorado punteado: gira lento (16 s lineales) */}
          <circle
            className="te-ring"
            cx="50"
            cy="50"
            r="41"
            stroke="url(#teGold)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeDasharray="1.2 7"
            opacity="0.85"
          />

          {/* Destello que recorre el anillo periódicamente */}
          <circle
            className="te-shine"
            cx="50"
            cy="50"
            r="41"
            stroke="#fff7e0"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="16 242"
            opacity="0"
          />

          {/* Medallón interior */}
          <circle cx="50" cy="50" r="33" fill="#002B49" fillOpacity="0.55" />
          <circle cx="50" cy="50" r="33" stroke="#c9a227" strokeWidth="0.9" opacity="0.55" />

          {/* Libro abierto estilizado */}
          <g>
            <path
              d="M 50 60 C 44 55.5 37 54.5 30.5 55 L 30.5 41 C 37 40.5 44 41.5 50 46 Z"
              fill="#F8FAFC"
              stroke="#c9a227"
              strokeWidth="1"
              strokeLinejoin="round"
            />
            <path
              d="M 50 60 C 56 55.5 63 54.5 69.5 55 L 69.5 41 C 63 40.5 56 41.5 50 46 Z"
              fill="#E9EFF6"
              stroke="#c9a227"
              strokeWidth="1"
              strokeLinejoin="round"
            />
            <path d="M 50 46 L 50 60" stroke="#002B49" strokeWidth="1.1" strokeLinecap="round" />
            {/* Renglones sugeridos */}
            <g stroke="#94a3b8" strokeWidth="0.8" strokeLinecap="round" opacity="0.7">
              <path d="M 35 46.5 C 39.5 46.8 43.5 47.8 46.5 49.4" />
              <path d="M 35 51 C 39.5 51.3 43.5 52.3 46.5 53.9" />
              <path d="M 65 46.5 C 60.5 46.8 56.5 47.8 53.5 49.4" />
              <path d="M 65 51 C 60.5 51.3 56.5 52.3 53.5 53.9" />
            </g>
          </g>

          {/* Marca de verificación dorada: se dibuja al montar */}
          <path
            className="te-check"
            d="M 38.5 50.5 L 46.5 58.5 L 63 40"
            stroke="url(#teGold)"
            strokeWidth="4.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      {showSubtitle && (
        <div className="flex flex-col min-w-0">
          <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
            {t('brand.name')}
          </span>
          <span className="text-xs text-slate-500 font-medium truncate">{t('footer.tagline')}</span>
        </div>
      )}
    </div>
  );
};
