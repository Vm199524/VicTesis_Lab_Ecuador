import React, { useEffect, useRef } from 'react';
import { usePreferences } from '../context/PreferencesContext';

interface AdSlotProps {
  /** Identificador del bloque creado en AdSense (campo «data-ad-slot»). */
  slot: string;
  /** Formato del bloque. «auto» deja que AdSense elija según el ancho disponible. */
  format?: string;
  className?: string;
}

/**
 * Espacio publicitario de Google AdSense.
 *
 * El portal se sostiene con publicidad, no con cobros al estudiante, así que el
 * anuncio tiene que convivir con el trabajo académico sin estorbarlo: ocupa una
 * franja propia, va rotulado y nunca se mete entre los controles de una
 * herramienta.
 *
 * Sin `VITE_ADSENSE_CLIENT` configurado el componente no pinta nada. Eso importa:
 * durante el desarrollo y mientras AdSense revisa el sitio no aparece ni el
 * recuadro vacío, y el portal funciona igual para quien lo despliegue sin cuenta
 * de publicidad.
 */
export const AdSlot: React.FC<AdSlotProps> = ({ slot, format = 'auto', className = '' }) => {
  const { t } = usePreferences();
  const client = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;
  const pushed = useRef(false);

  useEffect(() => {
    if (!client || pushed.current) return;

    // El script global se carga una sola vez para todo el portal.
    const scriptId = 'adsbygoogle-loader';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
      document.head.appendChild(script);
    }

    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
      pushed.current = true;
    } catch {
      // Un bloqueador de anuncios rompe el push: el hueco simplemente queda vacío.
    }
  }, [client]);

  if (!client) return null;

  return (
    <aside
      className={`rounded-2xl border border-dashed border-slate-300 bg-white/60 p-3 overflow-hidden ${className}`}
      aria-label={t('ads.label')}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
        {t('ads.label')}
      </p>
      <ins
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </aside>
  );
};
