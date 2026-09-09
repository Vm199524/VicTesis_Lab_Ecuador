import React, { useId } from 'react';

interface AcademicIntegrityLogoProps {
  /** Tamaño del sello. `sm` para barras y cabeceras, `md` para portadas. */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES: Record<'sm' | 'md' | 'lg', number> = { sm: 44, md: 64, lg: 96 };

/**
 * Sello de Integridad Académica: anillo azul marino, aro dorado giratorio, libro
 * abierto y lupa que barre la página.
 *
 * Todo el movimiento vive en CSS (sin JS, sin librería de animación) y se apaga
 * por completo con `prefers-reduced-motion`, porque es un elemento decorativo
 * permanente en pantalla: una animación que no se puede detener es una barrera
 * de accesibilidad, no un adorno.
 */
export const AcademicIntegrityLogo: React.FC<AcademicIntegrityLogoProps> = ({
  size = 'sm',
  className = '',
}) => {
  // Los degradados y máscaras se identifican por instancia: dos logos en la misma
  // página con ids repetidos se roban los defs entre sí.
  const uid = useId().replace(/:/g, '');
  const px = SIZES[size];

  return (
    <span
      className={`ai-seal inline-flex shrink-0 ${className}`}
      style={{ width: px, height: px }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes ai-seal-spin { to { transform: rotate(360deg); } }
        @keyframes ai-seal-sweep {
          0%, 62%, 100% { transform: translate(0, 0); }
          20% { transform: translate(5px, 2.5px); }
          42% { transform: translate(-4px, 3px); }
        }
        @keyframes ai-seal-glint {
          0%   { opacity: 0; transform: rotate(0deg); }
          8%   { opacity: .85; }
          26%  { opacity: 0; }
          100% { opacity: 0; transform: rotate(360deg); }
        }
        .ai-seal svg { width: 100%; height: 100%; display: block; }
        .ai-seal .ai-ring   { transform-origin: 50% 50%; animation: ai-seal-spin 14s linear infinite; }
        .ai-seal .ai-glass  { transform-origin: 50% 50%; animation: ai-seal-sweep 6.5s ease-in-out infinite; }
        .ai-seal .ai-glint  { transform-origin: 50% 50%; animation: ai-seal-glint 7s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ai-seal .ai-ring, .ai-seal .ai-glass, .ai-seal .ai-glint { animation: none; }
          .ai-seal .ai-glint { opacity: 0; }
        }
      `}</style>

      <svg viewBox="0 0 100 100" role="img">
        <defs>
          <linearGradient id={`navy-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0f4c81" />
            <stop offset="100%" stopColor="#0b2f52" />
          </linearGradient>
          <linearGradient id={`gold-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f4d778" />
            <stop offset="50%" stopColor="#c9a227" />
            <stop offset="100%" stopColor="#9a7b18" />
          </linearGradient>
        </defs>

        {/* Disco base */}
        <circle cx="50" cy="50" r="48" fill={`url(#navy-${uid})`} />

        {/* Aro dorado dentado que gira */}
        <g className="ai-ring">
          <circle
            cx="50"
            cy="50"
            r="43"
            fill="none"
            stroke={`url(#gold-${uid})`}
            strokeWidth="3"
            strokeDasharray="5.5 3.2"
            strokeLinecap="round"
          />
        </g>

        {/* Destello que recorre el aro */}
        <g className="ai-glint">
          <circle
            cx="50"
            cy="50"
            r="43"
            fill="none"
            stroke="#fff6d5"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeDasharray="16 254"
          />
        </g>

        <circle cx="50" cy="50" r="37" fill="none" stroke="#ffffff" strokeOpacity=".28" strokeWidth="1.2" />

        {/* Libro abierto */}
        <g>
          <path d="M22 60 Q50 52 50 62 Q50 52 78 60 L78 70 Q50 62 50 72 Q50 62 22 70 Z" fill="#f8fafc" />
          <path d="M50 62 Q50 52 78 60 L78 70 Q50 62 50 72 Z" fill="#e2e8f0" />
          <line x1="50" y1="62" x2="50" y2="72" stroke="#94a3b8" strokeWidth="1.1" />
          <g stroke="#c53030" strokeWidth="1.6" strokeLinecap="round" opacity=".85">
            <line x1="29" y1="62.5" x2="43" y2="60.5" />
            <line x1="29" y1="66" x2="39" y2="64.5" />
          </g>
          <g stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round">
            <line x1="57" y1="60.5" x2="71" y2="62.5" />
            <line x1="57" y1="64.5" x2="67" y2="66" />
          </g>
        </g>

        {/* Lupa que barre la página */}
        <g className="ai-glass">
          <circle cx="44" cy="40" r="13" fill="#dbeafe" fillOpacity=".55" stroke={`url(#gold-${uid})`} strokeWidth="3.2" />
          <path d="M53.5 49.5 L64 60" stroke={`url(#gold-${uid})`} strokeWidth="5" strokeLinecap="round" />
          <path d="M37 36 q6 -5 13 -1" stroke="#ffffff" strokeOpacity=".75" strokeWidth="2" strokeLinecap="round" fill="none" />
        </g>
      </svg>
    </span>
  );
};
