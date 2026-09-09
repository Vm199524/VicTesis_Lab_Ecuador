import React, { useEffect, useState } from 'react';
import { MessageSquare, X, Send, HelpCircle, FolderOpen, MessagesSquare } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';

interface PeerSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Opciones deliberadamente neutrales: abren la conversación sin comprometer
 * alcances, entregables ni condiciones de ningún tipo.
 */
const CONTACT_OPTIONS = [
  { id: 'tema', icon: HelpCircle },
  { id: 'proyecto', icon: FolderOpen },
  { id: 'consulta', icon: MessagesSquare },
];

export const PeerSupportModal: React.FC<PeerSupportModalProps> = ({ isOpen, onClose }) => {
  const { t } = usePreferences();
  const [selectedId, setSelectedId] = useState<string>('tema');

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const current = CONTACT_OPTIONS.find((option) => option.id === selectedId) || CONTACT_OPTIONS[0];
  const currentMessage = t(`peer.option.${current.id}.message`);

  const handleOpenWhatsApp = () => {
    window.open(`https://wa.me/593985976227?text=${encodeURIComponent(currentMessage)}`, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="surface rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] bg-white">
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-3 px-4 py-3 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-white tracking-tight leading-tight">
              {t('peer.header')}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title={t('action.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-4 overflow-y-auto space-y-3 thin-scrollbar">
          <p className="text-xs text-slate-700 leading-relaxed">
            {t('peer.question')}
          </p>

          <div className="space-y-1.5">
            {CONTACT_OPTIONS.map((option) => {
              const OptionIcon = option.icon;
              const selected = selectedId === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedId(option.id)}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                    selected
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <OptionIcon
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      selected ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="min-w-0">
                    <span className="text-[12px] font-extrabold text-slate-900 block leading-tight">
                      {t(`peer.option.${option.id}.title`)}
                    </span>
                    <span className="text-[10px] text-slate-500 leading-snug block mt-0.5">
                      {t(`peer.option.${option.id}.desc`)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="inset-surface rounded-xl p-2.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              {t('peer.messagePreviewLabel')}
            </span>
            <div className="bg-[#d9fdd3] text-[#111b21] p-2.5 rounded-xl rounded-tr-none text-[11px] leading-relaxed border border-[#c4ebb9]">
              {currentMessage}
            </div>
          </div>

          <p className="text-[10px] text-slate-500 leading-snug">
            {t('peer.footerNote')}
          </p>
        </div>

        {/* Pie */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-lg text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          >
            {t('peer.back')}
          </button>

          <button
            onClick={handleOpenWhatsApp}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            {t('peer.openWhatsapp')}
          </button>
        </div>
      </div>
    </div>
  );
};
