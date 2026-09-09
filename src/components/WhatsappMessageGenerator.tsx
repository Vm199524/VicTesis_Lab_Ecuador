import React, { useState, useEffect } from 'react';
import { WHATSAPP_TEMPLATES } from '../data/thesisData';
import { MessageSquare, Copy, Check, ExternalLink, X, Sparkles, Send } from 'lucide-react';

interface WhatsappModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsappMessageGenerator: React.FC<WhatsappModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(0);
  const [customLink, setCustomLink] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCustomLink(window.location.href);
    }
  }, []);

  if (!isOpen) return null;

  const currentTemplate = WHATSAPP_TEMPLATES[selectedTemplateIndex];

  // Replace placeholder with actual URL
  const processedMessage = currentTemplate.content.replace(
    /\[LINK_DE_TU_PAGINA\]/g,
    customLink || window.location.href
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(processedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(processedMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Plantillas de Comunicación Académica & Difusión
              </h3>
              <p className="text-xs text-slate-500">
                Formatos preestructurados para la difusión y consulta metodológica en redes académicas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Direct Advisor Callout */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                Orientación Metodológica & Consultoría Académica
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                ¿Requiere orientación metodológica en el diseño de su tesis o en observaciones del comité revisor?
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Este recurso metodológico es de acceso libre. Si se precisa retroalimentación técnica respecto a la formulación de objetivos o consistencia capitular, es posible coordinar asistencia directa.
              </p>
            </div>
            <a
              href="https://wa.me/593985976227?text=Estimado,%20he%20revisado%20el%20portal%20metodol%C3%B3gico.%20Deseo%20coordinar%20una%20consulta%20técnica%20sobre%20la%20investigaci%C3%B3n."
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Contactar vía WhatsApp (+593 98 597 6227)</span>
            </a>
          </div>

          {/* Template Selection Tabs */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Seleccione el formato de difusión adecuado:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {WHATSAPP_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplateIndex(idx)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedTemplateIndex === idx
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-bold block truncate">{tmpl.title}</span>
                  <span className={`text-[10px] block mt-0.5 ${selectedTemplateIndex === idx ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {tmpl.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional URL editor */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Enlace de la guía para incluir en el mensaje:
            </label>
            <input
              type="text"
              value={customLink}
              onChange={(e) => setCustomLink(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="https://tu-pagina.com"
            />
          </div>

          {/* WhatsApp Chat Preview Bubble */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Vista previa como mensaje de WhatsApp:
            </label>
            <div className="bg-[#efeae2] p-4 rounded-xl border border-slate-200">
              <div className="bg-[#d9fdd3] text-[#111b21] p-4 rounded-2xl rounded-tr-none shadow-xs max-w-lg ml-auto text-xs sm:text-sm font-sans whitespace-pre-wrap leading-relaxed border border-[#c4ebb9]">
                {processedMessage}
                <div className="text-[10px] text-[#667781] text-right mt-2 flex items-center justify-end gap-1">
                  <span>Ahora</span>
                  <Check className="w-3 h-3 text-[#53bdeb]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Cerrar
          </button>

          <button
            onClick={handleCopy}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡Texto Copiado!' : 'Copiar Texto al Portapapeles'}</span>
          </button>

          <button
            onClick={handleOpenWhatsApp}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs"
          >
            <Send className="w-4 h-4" />
            <span>Abrir en WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
