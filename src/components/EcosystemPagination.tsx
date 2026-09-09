import React from 'react';
import { EcosystemId } from '../types';
import { ECOSYSTEMS_LIST } from '../data/ecosystems';
import { usePreferences } from '../context/PreferencesContext';
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';

interface EcosystemPaginationProps {
  currentId: EcosystemId;
  onSelectEcosystem: (id: EcosystemId) => void;
  onOpenWhatsapp: () => void;
}

export const EcosystemPagination: React.FC<EcosystemPaginationProps> = ({
  currentId,
  onSelectEcosystem,
  onOpenWhatsapp,
}) => {
  const { t } = usePreferences();
  if (currentId === 'all') return null;

  const validTools = ECOSYSTEMS_LIST.filter((item) => item.id !== 'all');
  const currentIndex = validTools.findIndex((item) => item.id === currentId);

  const prevTool = currentIndex > 0 ? validTools[currentIndex - 1] : null;
  const nextTool = currentIndex < validTools.length - 1 ? validTools[currentIndex + 1] : null;

  const handleNavigate = (targetId: EcosystemId) => {
    onSelectEcosystem(targetId);
  };

  return (
    <div className="surface rounded-xl px-3 py-2.5 flex flex-wrap items-center justify-between gap-2">
      {/* Anterior */}
      <div className="order-1">
        {prevTool ? (
          <button
            onClick={() => handleNavigate(prevTool.id)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-[11px] font-black transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="text-left leading-tight">
              <span className="text-[9px] text-slate-500 uppercase tracking-wide block">
                {t('header.previous')}
              </span>
              {t(`module.${prevTool.id}.shortName`)}
            </span>
          </button>
        ) : (
          <span className="text-[11px] font-bold text-slate-400 px-1">
            {t('pagination.initialPhase')}
          </span>
        )}
      </div>

      {/* Progreso */}
      <div className="order-3 sm:order-2 w-full sm:w-auto text-center">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-black">
          <CheckCircle2 className="w-3 h-3 text-blue-600" />
          <span>{t('pagination.moduleOf', { current: currentIndex + 1, total: validTools.length })}</span>
        </div>
        <p className="text-[10px] text-slate-500 font-medium mt-0.5">
          {t('pagination.stuck')}{' '}
          <button
            onClick={onOpenWhatsapp}
            className="text-emerald-700 hover:text-emerald-800 font-bold underline"
          >
            {t('pagination.writeMeGuide')}
          </button>
        </p>
      </div>

      {/* Siguiente */}
      <div className="order-2 sm:order-3">
        {nextTool ? (
          <button
            onClick={() => handleNavigate(nextTool.id)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-[#001424] to-[#002B49] hover:from-[#00101c] hover:to-[#001f35] text-white text-[11px] font-black shadow-md transition-all"
          >
            <span className="text-right leading-tight">
              <span className="text-[9px] text-blue-200 uppercase tracking-wide block">
                {t('header.next')}
              </span>
              {t(`module.${nextTool.id}.shortName`)}
            </span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        ) : (
          <button
            onClick={() => handleNavigate('feasibility')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-[11px] font-black transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0 text-slate-600" />
            <span>{t('pagination.backToStart')}</span>
          </button>
        )}
      </div>
    </div>
  );
};
