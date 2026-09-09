/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, Suspense } from 'react';
import { Navbar } from './components/Navbar';
import { HomeDashboard } from './components/HomeDashboard';
import { PeerSupportModal } from './components/PeerSupportModal';
import { ThesisAiTutorModal } from './components/ThesisAiTutorModal';
import { AuthModal } from './components/AuthModal';
import { AboutModal } from './components/AboutModal';
import { ModuleRail } from './components/ModuleRail';
import { EcosystemPagination } from './components/EcosystemPagination';
import { ViewMode, EcosystemId } from './types';
import { usePreferences } from './context/PreferencesContext';
import { useAuth } from './context/AuthContext';
import { RobotFace } from './components/RobotFace';
import { Sparkles } from 'lucide-react';

// Lazy-load componentes pesados que se cargan bajo demanda
const SlideViewer = React.lazy(() => import('./components/SlideViewer').then(m => ({ default: m.SlideViewer })));
const TopicFeasibilityCalculator = React.lazy(() => import('./components/TopicFeasibilityCalculator').then(m => ({ default: m.TopicFeasibilityCalculator })));
const ChapterCascadeExplorer = React.lazy(() => import('./components/ChapterCascadeExplorer').then(m => ({ default: m.ChapterCascadeExplorer })));
const ScopusQueryBuilder = React.lazy(() => import('./components/ScopusQueryBuilder').then(m => ({ default: m.ScopusQueryBuilder })));
const Apa7ReferenceHelper = React.lazy(() => import('./components/Apa7ReferenceHelper').then(m => ({ default: m.Apa7ReferenceHelper })));
const ToolboxGrid = React.lazy(() => import('./components/ToolboxGrid').then(m => ({ default: m.ToolboxGrid })));
const VideoLibraryGrid = React.lazy(() => import('./components/VideoLibraryGrid').then(m => ({ default: m.VideoLibraryGrid })));
const DraftReviewWorkbench = React.lazy(() => import('./components/DraftReviewWorkbench').then(m => ({ default: m.DraftReviewWorkbench })));
const OriginalityChecker = React.lazy(() => import('./components/OriginalityChecker').then(m => ({ default: m.OriginalityChecker })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-96 text-slate-400">
    <div className="animate-pulse">Cargando...</div>
  </div>
);

export default function App() {
  const { t } = usePreferences();
  const { user, loading: authLoading } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [activeEcosystem, setActiveEcosystem] = useState<EcosystemId>('feasibility');
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [isAiTutorModalOpen, setIsAiTutorModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  /**
   * Herramienta que el visitante pidio antes de tener sesion. Se guarda para
   * abrirla sola en cuanto entre, en lugar de dejarlo en el panel sin saber
   * donde habia hecho clic.
   */
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const goHome = () => {
    setViewMode('home');
    scrollToTop();
  };

  const goSlides = () => {
    requireSession(() => {
      setViewMode('slides');
      scrollToTop();
    });
  };

  /**
   * Puerta de entrada unica: las herramientas solo se abren con sesion iniciada.
   * Sin ella se pide el ingreso y la accion queda en espera, no se descarta.
   */
  const requireSession = (action: () => void) => {
    if (user) {
      action();
      return;
    }
    // Mientras se resuelve /api/auth/me no se sabe si hay sesion: no se bloquea.
    if (authLoading) return;
    setPendingAction(() => action);
    setIsAuthModalOpen(true);
  };

  useEffect(() => {
    if (user && pendingAction) {
      const action = pendingAction;
      setPendingAction(null);
      setIsAuthModalOpen(false);
      action();
    }
  }, [user, pendingAction]);

  /**
   * El ingreso con Google o GitHub sale del portal y vuelve con la página
   * recargada, así que el módulo pendiente no sobrevive en memoria. Se anota en
   * `sessionStorage` antes de salir y se recupera al volver con sesión.
   */
  const PENDING_MODULE_KEY = 'tesis-ecuador:modulo-pendiente';

  useEffect(() => {
    if (!user || authLoading) return;
    const saved = sessionStorage.getItem(PENDING_MODULE_KEY);
    if (!saved) return;
    sessionStorage.removeItem(PENDING_MODULE_KEY);
    setActiveEcosystem(saved as EcosystemId);
    setViewMode('module');
  }, [user, authLoading]);

  /** Abre un módulo desde el panel principal, la barra superior o el riel lateral. */
  const openModule = (id: EcosystemId) => {
    if (!user && !authLoading) sessionStorage.setItem(PENDING_MODULE_KEY, id);
    requireSession(() => {
      setActiveEcosystem(id);
      setViewMode('module');
      requestAnimationFrame(() => {
        const element = document.getElementById('module-workspace');
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else scrollToTop();
      });
    });
  };

  const handleNavigateToTool = (targetId: string) => {
    let eco: EcosystemId = 'feasibility';
    if (targetId.includes('chapter')) eco = 'chapters';
    else if (targetId.includes('scopus')) eco = 'scopus';
    else if (targetId.includes('apa')) eco = 'apa7';
    else if (targetId.includes('toolbox') || targetId.includes('software')) eco = 'toolbox';
    else if (targetId.includes('video')) eco = 'videos';
    else if (targetId.includes('draft') || targetId.includes('borrador')) eco = 'draft';
    else if (targetId.includes('plagio') || targetId.includes('plagiarism') || targetId.includes('originalidad'))
      eco = 'plagiarism';
    openModule(eco);
  };

  return (
    /* overflow-x-clip (no -hidden): `hidden` crea un contenedor de scroll que anula
       position: sticky en todos los descendientes. `clip` recorta sin romperlo. */
    <div className="min-h-screen text-slate-900 font-sans antialiased selection:bg-[#002B49] selection:text-white w-full overflow-x-clip">
      <Navbar
        viewMode={viewMode}
        activeEcosystem={activeEcosystem}
        onGoHome={goHome}
        onGoSlides={goSlides}
        onOpenModule={openModule}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full">
        {viewMode === 'home' && (
          <HomeDashboard
            onOpenModule={openModule}
            onGoSlides={goSlides}
            onOpenTutor={() => requireSession(() => setIsAiTutorModalOpen(true))}
            onOpenWhatsapp={() => setIsWhatsappModalOpen(true)}
          />
        )}

        {viewMode === 'slides' && (
          <Suspense fallback={<LoadingFallback />}>
            <div className="animate-in fade-in duration-300 w-full">
              <SlideViewer
                onNavigateToTool={handleNavigateToTool}
              />
            </div>
          </Suspense>
        )}

        {viewMode === 'module' && (
          <div
            id="module-workspace"
            className="flex flex-col lg:flex-row gap-3 lg:gap-4 w-full scroll-mt-[76px] animate-in fade-in duration-300"
          >
            <ModuleRail activeEcosystem={activeEcosystem} onSelectEcosystem={openModule} />

            <div className="flex-1 min-w-0 space-y-3">
              <div className="w-full">
                {activeEcosystem === 'feasibility' && (
                  <Suspense fallback={<LoadingFallback />}>
                    <TopicFeasibilityCalculator />
                  </Suspense>
                )}
                {activeEcosystem === 'chapters' && (
                  <Suspense fallback={<LoadingFallback />}>
                    <ChapterCascadeExplorer />
                  </Suspense>
                )}
                {activeEcosystem === 'scopus' && (
                  <Suspense fallback={<LoadingFallback />}>
                    <ScopusQueryBuilder />
                  </Suspense>
                )}
                {activeEcosystem === 'apa7' && (
                  <Suspense fallback={<LoadingFallback />}>
                    <Apa7ReferenceHelper />
                  </Suspense>
                )}
                {activeEcosystem === 'toolbox' && (
                  <Suspense fallback={<LoadingFallback />}>
                    <ToolboxGrid />
                  </Suspense>
                )}
                {activeEcosystem === 'videos' && (
                  <Suspense fallback={<LoadingFallback />}>
                    <VideoLibraryGrid />
                  </Suspense>
                )}
                {activeEcosystem === 'draft' && (
                  <Suspense fallback={<LoadingFallback />}>
                    <DraftReviewWorkbench onOpenWhatsApp={() => setIsWhatsappModalOpen(true)} />
                  </Suspense>
                )}
                {activeEcosystem === 'plagiarism' && (
                  <Suspense fallback={<LoadingFallback />}>
                    <OriginalityChecker />
                  </Suspense>
                )}
                {activeEcosystem === 'all' && (
                  <Suspense fallback={<LoadingFallback />}>
                    <div className="space-y-6 animate-in fade-in">
                      <TopicFeasibilityCalculator />
                      <ChapterCascadeExplorer />
                      <ScopusQueryBuilder />
                      <Apa7ReferenceHelper />
                      <ToolboxGrid />
                      <VideoLibraryGrid />
                      <DraftReviewWorkbench onOpenWhatsApp={() => setIsWhatsappModalOpen(true)} />
                      <OriginalityChecker />
                    </div>
                  </Suspense>
                )}
              </div>

              <EcosystemPagination
                currentId={activeEcosystem}
                onSelectEcosystem={openModule}
                onOpenWhatsapp={() => setIsWhatsappModalOpen(true)}
              />
            </div>
          </div>
        )}
      </main>

      {/* Pie delgado: la identidad completa del portal vive en "Acerca del portal". */}
      <footer className="mt-10 border-t border-slate-200 bg-white py-5 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px] text-slate-500">
          <span className="font-semibold text-slate-700">
            {t('brand.name')} · {t('footer.tagline')}
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAboutModalOpen(true)}
              className="hover:text-slate-900 transition-colors"
            >
              {t('nav.about')}
            </button>
            <span className="text-slate-400">Victor Manuel LL.</span>
          </div>
        </div>
      </footer>

      {/* Lanzador flotante del Tutor IA */}
      <button
        onClick={() => requireSession(() => setIsAiTutorModalOpen(true))}
        className="tutor-launcher fixed bottom-6 right-6 z-40 flex items-center gap-2 pl-4 pr-4.5 py-3 rounded-full bg-gradient-to-br from-[#00375d] to-[#001b30] text-white font-bold text-[13px] border border-[#c9a227]/40"
        title={t('tutor.title')}
      >
        <span className="relative flex items-center justify-center">
          <RobotFace className="w-5 h-5 text-[#f0cf62]" />
          <Sparkles className="tutor-spark absolute -top-1.5 -right-2 w-3 h-3 text-[#f0cf62]" />
        </span>
        <span className="hidden sm:inline">{t('tutor.launcherShort')}</span>
      </button>

      <PeerSupportModal
        isOpen={isWhatsappModalOpen}
        onClose={() => setIsWhatsappModalOpen(false)}
      />

      <ThesisAiTutorModal
        isOpen={isAiTutorModalOpen}
        onClose={() => setIsAiTutorModalOpen(false)}
        onOpenWhatsApp={() => setIsWhatsappModalOpen(true)}
        activeEcosystem={activeEcosystem}
        viewMode={viewMode}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingAction(null);
          sessionStorage.removeItem(PENDING_MODULE_KEY);
        }}
        reason={pendingAction ? t('auth.gateNotice') : undefined}
      />

      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
    </div>
  );
}
