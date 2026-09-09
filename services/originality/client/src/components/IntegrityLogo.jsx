import { cn } from "@/lib/utils";

// Tamaños admitidos para reutilizar el sello en distintos contextos (cabecera, favicon, etc.).
const SIZES = {
  sm: 32,
  md: 44,
};

/**
 * Sello de "Integridad Académica": anillo dorado giratorio sobre un aro azul
 * marino, con un libro abierto y una lupa superpuesta en el centro. Toda la
 * animación es CSS puro (ver reglas .integrity-logo* en index.css) y respeta
 * prefers-reduced-motion.
 */
export default function IntegrityLogo({ size = "md", className }) {
  const px = SIZES[size] ?? SIZES.md;

  return (
    <svg
      viewBox="0 0 100 100"
      width={px}
      height={px}
      className={cn("integrity-logo shrink-0", className)}
      role="img"
      aria-label="Sello de Integridad Académica"
    >
      {/* Aro exterior azul marino */}
      <circle cx="50" cy="50" r="47" fill="#1e3a5f" />

      {/* Aro dorado giratorio (discontinuo, sugiere movimiento) */}
      <circle
        className="integrity-logo__ring"
        cx="50"
        cy="50"
        r="43.5"
        fill="none"
        stroke="#c9a227"
        strokeWidth="3"
        strokeDasharray="7 6"
      />

      {/* Destello dorado que recorre el aro */}
      <circle className="integrity-logo__shine" cx="50" cy="6.5" r="2.4" fill="#fde68a" />

      {/* Disco central claro */}
      <circle cx="50" cy="50" r="36" fill="#f8fafc" />

      {/* Libro abierto estilizado */}
      <g stroke="#1e3a5f" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M50 40c-5.5-3.6-12-4.6-17.5-2.8v18.4c5.5-1.8 12-0.8 17.5 2.8" />
        <path d="M50 40c5.5-3.6 12-4.6 17.5-2.8v18.4c-5.5-1.8-12-0.8-17.5 2.8" />
        <line x1="50" y1="40" x2="50" y2="58.4" />
      </g>

      {/* Lupa con leve barrido, superpuesta sobre el libro */}
      <g className="integrity-logo__glass">
        <circle cx="61" cy="54" r="7.5" fill="rgba(248,250,252,0.85)" stroke="#c9a227" strokeWidth="3" />
        <line x1="66.3" y1="59.3" x2="72" y2="65" stroke="#c9a227" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}
