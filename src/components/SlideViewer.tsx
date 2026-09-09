import React, { useEffect, useState, useRef } from 'react';
import { SLIDES_DATA } from '../data/thesisData';
import { SlideItem } from '../types';
import { usePreferences } from '../context/PreferencesContext';
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface SlideViewerProps {
  onNavigateToTool: (targetId: string) => void;
  onOpenWhatsappModal: () => void;
}

export const SlideViewer: React.FC<SlideViewerProps> = ({
  onNavigateToTool,
  onOpenWhatsappModal,
}) => {
  const { t, tf } = usePreferences();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const slideContainerRef = useRef<HTMLDivElement>(null);

  const currentSlide: SlideItem = SLIDES_DATA[currentIndex];
  /** El título se parte por ':' para resaltar la primera mitad: se traduce antes. */
  const slideTitle = tf(`slide.${currentSlide.id}.title`, currentSlide.title);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < SLIDES_DATA.length - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : SLIDES_DATA.length - 1));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      slideContainerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div
      ref={slideContainerRef}
      className={`w-full max-w-6xl mx-auto flex flex-col justify-between transition-all ${
        isFullscreen ? 'h-screen bg-[#05070d] p-6 overflow-y-auto' : 'py-6 px-4'
      }`}
    >
      {/* Slide Top Bar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-100">
            {tf(`slide.${currentSlide.id}.tag`, currentSlide.tag)}
          </span>
          <span className="text-xs font-medium text-slate-500">
            {t('slides.counter', { current: currentIndex + 1, total: SLIDES_DATA.length })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="slide-fullscreen-btn"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-200 text-xs flex items-center gap-1.5 bg-white shadow-xs"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? t('slides.exit') : t('slides.expand')}</span>
          </button>
        </div>
      </div>

      {/* Main Slide Card (16:9 Presentation Frame) */}
      <div
        id={`slide-card-${currentSlide.id}`}
        className="surface relative rounded-2xl p-6 sm:p-10 text-slate-800 flex flex-col justify-between overflow-hidden min-h-[520px] ring-1 ring-slate-900/5 shadow-[0_30px_80px_-34px_rgba(0,43,73,0.45)]"
      >
        {/* Fino filete superior: azul marino a dorado, identidad de la marca. */}
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#002B49] via-[#c9a227] to-transparent" />
        {/* Marca de agua del número de lámina tras el contenido. */}
        <div className="absolute -bottom-8 -right-4 text-[7rem] font-black leading-none text-slate-900/[0.03] select-none pointer-events-none">
          {String(currentIndex + 1).padStart(2, '0')}
        </div>

        {/* Slide Header */}
        <div className="relative z-10 mb-6">
          <h2 className="text-2xl sm:text-4xl font-light text-slate-900 tracking-tight leading-tight">
            {slideTitle.includes(':') ? (
              <>
                {slideTitle.split(':')[0]}:{' '}
                <span className="font-bold bg-gradient-to-r from-[#0a4d7a] to-[#00447a] bg-clip-text text-transparent">
                  {slideTitle.split(':')[1]}
                </span>
              </>
            ) : (
              slideTitle
            )}
          </h2>
          <p className="text-base sm:text-lg text-slate-500 font-medium mt-1.5">
            {tf(`slide.${currentSlide.id}.subtitle`, currentSlide.subtitle)}
          </p>
          <p className="text-sm text-slate-600 mt-2 max-w-4xl leading-relaxed">
            {tf(`slide.${currentSlide.id}.description`, currentSlide.description)}
          </p>
        </div>

        {/* Golden Rule Callout */}
        <div className="relative z-10 mb-6 bg-amber-50/70 border-l-4 border-amber-500 p-4 rounded-r-xl">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                {t('slides.keyRuleLabel')}
              </span>
              <p className="text-sm sm:text-base font-medium text-slate-800 mt-0.5">
                "{tf(`slide.${currentSlide.id}.keyRule`, currentSlide.keyRule)}"
              </p>
            </div>
          </div>
        </div>

        {/* Bullet Points Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {currentSlide.bulletPoints.map((bp, idx) => (
            <div
              key={idx}
              className="inset-surface surface-interactive rounded-xl p-5 transition-all"
            >
              {bp.highlight && (
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-100 mb-2.5">
                  {tf(`slide.${currentSlide.id}.bullet.${idx}.highlight`, bp.highlight)}
                </span>
              )}
              <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{tf(`slide.${currentSlide.id}.bullet.${idx}.title`, bp.title)}</span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {tf(`slide.${currentSlide.id}.bullet.${idx}.description`, bp.description)}
              </p>
            </div>
          ))}
        </div>

        {/* Footer info & interactive tool action */}
        <div className="relative z-10 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-2 max-w-2xl">
            <span className="text-xs font-bold text-slate-400 shrink-0 uppercase tracking-wide">
              {t('slides.proTipLabel')}
            </span>
            <p className="text-xs text-slate-500 italic leading-normal">
              {tf(`slide.${currentSlide.id}.proTip`, currentSlide.proTip)}
            </p>
          </div>

          {currentSlide.actionableResource && (
            <button
              id={`slide-action-btn-${currentSlide.id}`}
              onClick={() => {
                if (currentSlide.actionableResource?.targetId) {
                  onNavigateToTool(currentSlide.actionableResource.targetId);
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs hover:shadow-md transition-all shrink-0"
            >
              <span>
                {tf(`slide.${currentSlide.id}.action`, currentSlide.actionableResource.label)}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Slide Navigation Controls & Thumbnails */}
      <div className="surface sticky bottom-2 z-30 mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl p-2">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="slide-btn-prev"
            onClick={handlePrev}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{t('header.previous')}</span>
          </button>
          <button
            id="slide-btn-next"
            onClick={handleNext}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-all"
          >
            <span>{t('header.next')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Thumbnail Dots */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {SLIDES_DATA.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2.5 rounded-full transition-all ${
                currentIndex === idx
                  ? 'w-8 bg-blue-600'
                  : 'w-2.5 bg-slate-300 hover:bg-slate-400'
              }`}
              title={`${idx + 1}: ${slide.title}`}
            />
          ))}
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenWhatsappModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all"
            title={t('support.title')}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">{t('support.button')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
