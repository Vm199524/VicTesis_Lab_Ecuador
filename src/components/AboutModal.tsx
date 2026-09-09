import React, { useEffect } from 'react';
import { X, Info, ShieldCheck, Scale, UserCircle2 } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * "Acerca del portal": qué es, cómo trata los documentos, hasta dónde llega y quién
 * lo hizo. Vive en la barra superior, en un único lugar, en vez de repetirse como
 * texto de pie en todas las pantallas.
 */
export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const { t } = usePreferences();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sections = [
    { icon: Info, title: t('about.whatTitle'), body: t('about.whatBody'), tone: 'text-blue-600 bg-blue-50' },
    { icon: ShieldCheck, title: t('about.privacyTitle'), body: t('about.privacyBody'), tone: 'text-emerald-600 bg-emerald-50' },
    { icon: Scale, title: t('about.limitsTitle'), body: t('about.limitsBody'), tone: 'text-amber-600 bg-amber-50' },
    { icon: UserCircle2, title: t('about.authorTitle'), body: t('about.authorBody'), tone: 'text-violet-600 bg-violet-50' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="surface w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-black text-slate-900 tracking-tight">{t('about.title')}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
            title={t('action.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto thin-scrollbar">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="flex items-start gap-3">
                <span
                  className={`w-8 h-8 rounded-lg ${section.tone} flex items-center justify-center shrink-0`}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[13px] font-black text-slate-900">{section.title}</h3>
                  <p className="text-[12.5px] text-slate-600 leading-relaxed mt-0.5">
                    {section.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
