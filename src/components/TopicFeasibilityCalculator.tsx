import React, { useState, useMemo } from 'react';
import {
  Check,
  Copy,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Layers,
  FileSpreadsheet,
  Award,
  BookOpen,
  Send,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import campusBg from '../assets/images/campus_universitario_bg.jpg';
import {
  ThesisProject,
  APPROACHES,
  APPROACH_LIST,
  type ResearchApproach,
  type TitleSlots,
} from '../domain/ThesisProject';
import { FeasibilityReport } from '../domain/FeasibilityReport';
import { usePreferences } from '../context/PreferencesContext';

interface StepOption {
  /** Clave estable para buscar la traducción de tag/label/description/advisorTip. */
  id: string;
  value: number;
  label: string;
  tag: string;
  description: string;
  badgeColor: string;
  advisorTip: string;
}

const CRITERION_1_OPTIONS: StepOption[] = [
  {
    id: 'c1-optimal',
    value: 35,
    tag: 'Óptimo (+35 pts)',
    label: 'Acceso Directo y Autorización Formal Garantizada',
    description:
      'El investigador cuenta con permiso formal escrito, vinculación laboral en la entidad o convenios institucionales para aplicar cuestionarios y entrevistas sin restricciones de acceso.',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    advisorTip: 'Ideal para titulación directa. Permite levantar la muestra en el Capítulo 3 con solvencia.',
  },
  {
    id: 'c1-moderate',
    value: 20,
    tag: 'Moderado (+20 pts)',
    label: 'Factible pero Requiere Trámite Administrativo u Oficio',
    description:
      'El acceso a la muestra es factible, pero depende de la emisión y aceptación de oficios formales tramitados por la facultad o decanato hacia la entidad receptora.',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    advisorTip: 'Se aconseja gestionar la carta de auspicio académico desde las primeras semanas del Avance 1.',
  },
  {
    id: 'c1-critical',
    value: 0,
    tag: 'Crítico (0 pts)',
    label: 'Sin Acceso Confirmado o Muestra con Alta Incertidumbre',
    description:
      'No se dispone de vinculación directa con la unidad de análisis o los datos requeridos tienen carácter reservado. Existe alto riesgo de paralización del proyecto.',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-400/30',
    advisorTip: 'Si no es factible medir a los sujetos de estudio, el perfil no se sostiene por más sólido que sea el tema.',
  },
];

const CRITERION_2_OPTIONS: StepOption[] = [
  {
    id: 'c2-optimal',
    value: 35,
    tag: 'Óptimo (+35 pts)',
    label: 'Abundante Literatura Indexada Contemporánea (Scopus / WoS / Latindex)',
    description:
      'Se identifican antecedentes científicos arbitrados publicados en los últimos 5 años (2021-2026) que abordan las variables y sus dimensiones empíricas.',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    advisorTip: 'El Capítulo 2 (Marco Teórico y Estado del Arte) se cimentará con máxima solidez científica.',
  },
  {
    id: 'c2-moderate',
    value: 15,
    tag: 'Moderado (+15 pts)',
    label: 'Literatura Científica Limitada o Predominio de Repositorios Locales',
    description:
      'Se hallan menos de 8 artículos de impacto o la mayor parte de referencias corresponde a tesis no publicadas en revistas indexadas.',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    advisorTip: 'Ampliar los términos booleanos al inglés en Scopus para captar la literatura internacional.',
  },
  {
    id: 'c2-critical',
    value: 0,
    tag: 'Crítico (0 pts)',
    label: 'Escasa o Nula Producción Científica Indexada',
    description:
      'El constructo no se encuentra tipificado internacionalmente o se carece de instrumentos psicométricos validados para operacionalizar las variables.',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-400/30',
    advisorTip: 'Se recomienda redefinir las variables hacia conceptos consolidados en la literatura científica.',
  },
];

const CRITERION_3_OPTIONS: StepOption[] = [
  {
    id: 'c3-optimal',
    value: 30,
    tag: 'Óptimo (+30 pts)',
    label: 'Alta Relevancia Social, Empresarial o Académica en el Entorno',
    description:
      'Los resultados permitirán resolver un nudo crítico de gestión, aportar a las líneas de investigación de tu universidad y beneficiar al tejido productivo o comunitario.',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    advisorTip: 'Garantiza una justificación robusta en el Capítulo 1, con impacto en la toma de decisiones.',
  },
  {
    id: 'c3-moderate',
    value: 15,
    tag: 'Moderado (+15 pts)',
    label: 'Relevancia Local Acotada o Aporte Principalmente Teórico',
    description:
      'El impacto se circunscribe a un ámbito muy restringido y los beneficiarios directos no se encuentran definidos con claridad empírica.',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    advisorTip: 'Conectar la investigación con los Objetivos de Desarrollo Sostenible y con las líneas de investigación de tu universidad.',
  },
  {
    id: 'c3-critical',
    value: 0,
    tag: 'Crítico (0 pts)',
    label: 'Baja Trascendencia Práctica o Tema Saturado sin Enfoque Novedoso',
    description:
      'La temática ha sido abordada de forma recurrente sin aportar una perspectiva metodológica o contextual innovadora.',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-400/30',
    advisorTip: 'Incorporar una variable emergente o focalizarse en un nicho productivo específico de la región.',
  },
];

export const TopicFeasibilityCalculator: React.FC = () => {
  const { tf } = usePreferences();
  // Stepper State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isFullView, setIsFullView] = useState<boolean>(false);

  // Criteria State
  const [q1, setQ1] = useState<number>(35);
  const [q2, setQ2] = useState<number>(35);
  const [q3, setQ3] = useState<number>(30);

  // Enfoque del proyecto y componentes del titulo. El enfoque decide como se
  // redacta todo lo demas: un titulo de ingenieria y uno de un estudio de
  // prevalencia no comparten estructura.
  const [approach, setApproach] = useState<ResearchApproach>('technological');
  const [slots, setSlots] = useState<TitleSlots>(APPROACHES.technological.sample);
  const spec = APPROACHES[approach];

  /** Cambiar de enfoque recarga el ejemplo de esa familia: los campos de uno no
   *  significan lo mismo en el otro y arrastrarlos produce titulos hibridos. */
  const changeApproach = (next: ResearchApproach) => {
    setApproach(next);
    setSlots(APPROACHES[next].sample);
  };

  const setSlot = (key: keyof TitleSlots, value: string) =>
    setSlots((prev) => ({ ...prev, [key]: value }));

  const [copiedTitle, setCopiedTitle] = useState<boolean>(false);
  const [copiedMatrix, setCopiedMatrix] = useState<boolean>(false);

  // OOP Domain Instance: encapsulated business logic and consistency calculations
  const thesisProject = useMemo(() => {
    return new ThesisProject({
      approach,
      ...slots,
      accessScore: q1,
      literatureScore: q2,
      relevanceScore: q3,
    });
  }, [approach, slots, q1, q2, q3]);

  // Derived outputs from Domain Model
  const fullTitle = thesisProject.generateFormalTitle();
  const researchQuestion = thesisProject.generateResearchQuestion();
  const generalObjective = thesisProject.generateGeneralObjective();
  const generalHypothesis = thesisProject.generateGeneralHypothesis();
  const specificObjectives = thesisProject.generateSpecificObjectives();
  const titleReview = thesisProject.assessTitle();
  const report: FeasibilityReport = thesisProject.evaluateFeasibility();
  const totalScore = report.totalScore;

  const copyToClipboard = (text: string, isMatrix = false) => {
    navigator.clipboard.writeText(text);
    if (isMatrix) {
      setCopiedMatrix(true);
      setTimeout(() => setCopiedMatrix(false), 2000);
    } else {
      setCopiedTitle(true);
      setTimeout(() => setCopiedTitle(false), 2000);
    }
  };

  const stepsList = [
    { num: 1, title: tf('feasibility.step.1.title', 'Acceso a Datos'), short: tf('feasibility.step.1.short', 'Acceso') },
    { num: 2, title: tf('feasibility.step.2.title', 'Literatura Scopus'), short: tf('feasibility.step.2.short', 'Scopus') },
    { num: 3, title: tf('feasibility.step.3.title', 'Relevancia Práctica'), short: tf('feasibility.step.3.short', 'Aporte') },
    { num: 4, title: tf('feasibility.step.4.title', 'Matriz de Variables'), short: tf('feasibility.step.4.short', 'Variables') },
    { num: 5, title: tf('feasibility.step.5.title', 'Dictamen Metodológico'), short: tf('feasibility.step.5.short', 'Dictamen') },
  ];

  return (
    <section id="feasibility-tool" className="py-6 sm:py-8 scroll-mt-20 w-full max-w-full overflow-hidden">
      <div className="surface rounded-3xl overflow-hidden w-full max-w-full">
        {/* Banner de cabecera con fondo arquitectónico de un CRAI universitario.
            Estilo suave y claro: degradado azul #10324D→#0B2438 (menos negro),
            ámbar reducido a acento mínimo y píldoras redondeadas con área táctil
            mayor para los controles. */}
        <div className="relative p-5 sm:p-8 bg-[#0d2b46] border-b border-white/10 overflow-hidden text-white">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity scale-105 pointer-events-none"
            style={{ backgroundImage: `url(${campusBg})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#10324D] via-[#14406a] to-[#0B2438] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/10 text-blue-50 border border-white/20 shadow-xs">
                <GraduationCap className="w-4 h-4 text-amber-300" />
                <span>{tf('feasibility.header.badge', 'Metodología de Investigación para Estudiantes Universitarios del Ecuador')}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight break-words">
                {tf('feasibility.header.title', 'Simulador de Viabilidad & Matriz de Consistencia 🎓')}
              </h2>
              <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl leading-relaxed">
                {tf('feasibility.header.subtitle', 'Evaluación diagnóstica basada en los criterios de titulación comunes a las universidades del Ecuador. Contrasta siempre el resultado con el formato de titulación de tu universidad.')}
              </p>
            </div>

            {/* Mode Switcher — píldora activa azul suave #2E5A87 con texto blanco */}
            <div className="flex items-center gap-1 bg-black/20 p-1.5 rounded-full border border-white/15 shrink-0 self-start md:self-auto shadow-inner">
              <button
                onClick={() => setIsFullView(false)}
                className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-1.5 ${
                  !isFullView
                    ? 'bg-[#2E5A87] text-white shadow-md hover:bg-[#1F4466]'
                    : 'text-blue-100/70 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>{tf('feasibility.mode.stepByStep', 'Paso a Paso')}</span>
              </button>
              <button
                onClick={() => setIsFullView(true)}
                className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-1.5 ${
                  isFullView
                    ? 'bg-[#2E5A87] text-white shadow-md hover:bg-[#1F4466]'
                    : 'text-blue-100/70 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{tf('feasibility.mode.fullView', 'Vista Completa')}</span>
              </button>
            </div>
          </div>

          {/* Stepper Progress Bar (Step-by-Step Mode) - Fully responsive with min-w-0 */}
          {!isFullView && (
            <div className="relative z-10 mt-6 pt-5 border-t border-white/15 w-full">
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2 w-full">
                {stepsList.map((st) => {
                  const isActive = currentStep === st.num;
                  const isCompleted = currentStep > st.num;
                  return (
                    <button
                      key={st.num}
                      onClick={() => setCurrentStep(st.num)}
                      className={`text-left px-2 py-2 rounded-2xl transition-all border min-w-0 ${
                        isActive
                          ? 'bg-[#2E5A87] text-white border-white/30 font-black shadow-md'
                          : isCompleted
                          ? 'bg-white/10 text-white border-white/15 hover:bg-white/20'
                          : 'bg-transparent text-blue-100/45 border-white/10 hover:bg-white/10 hover:text-blue-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <span
                          className={`w-5 h-5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition-colors ${
                            isActive
                              ? 'bg-white text-[#2E5A87]'
                              : isCompleted
                              ? 'bg-emerald-400/90 text-emerald-950'
                              : 'bg-white/15 text-blue-100/70'
                          }`}
                        >
                          {isCompleted ? '✓' : st.num}
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-bold truncate">
                          <span className="hidden sm:inline">{st.title}</span>
                          <span className="sm:hidden">{st.short}</span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-blue-100/80 mt-3">
                <span className="truncate">
                  {tf('feasibility.progress.step', 'Paso')} {currentStep} {tf('feasibility.progress.of5', 'de 5')}: {stepsList[currentStep - 1].title}
                </span>
                <span className="bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20 shrink-0">
                  {tf('feasibility.progress.score', 'Puntaje acumulado:')} {totalScore} / 100 pts
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 lg:p-8 bg-[#f8fafc] w-full max-w-full overflow-hidden">
          {!isFullView ? (
            /* STEP-BY-STEP PROGRESSIVE VIEW */
            <AnimatePresence mode="wait">
              {/* STEP 1: Acceso a Datos */}
              {currentStep === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6 w-full"
                >
                  <div className="surface border-2 border-blue-100 rounded-3xl p-5 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200 inline-block mb-1">
                          {tf('feasibility.step1.badge', 'Criterio 1 de 3 (Máx. 35 puntos)')}
                        </span>
                        <h3 className="text-lg sm:text-xl font-black text-slate-900">
                          {tf('feasibility.step1.title', 'Acceso a Datos y Unidad de Análisis')}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                          {tf('feasibility.step1.question', '¿El investigador cuenta con autorización formal demostrable para encuestar, entrevistar o acceder a los registros empíricos?')}
                        </p>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-2xl font-black text-[#002B49]">
                          {q1} <span className="text-sm font-semibold text-slate-400">/ 35 pts</span>
                        </span>
                      </div>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 gap-3.5 mt-6">
                      {CRITERION_1_OPTIONS.map((opt) => {
                        const isSelected = q1 === opt.value;
                        return (
                          <div
                            key={opt.value}
                            onClick={() => setQ1(opt.value)}
                            className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all hover-lift ${
                              isSelected
                                ? 'bg-blue-50/70 border-[#002B49] shadow-md ring-2 ring-blue-500/20'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`px-2 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider ${
                                      opt.value === 35
                                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                        : opt.value === 20
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                        : 'bg-rose-100 text-rose-900 border border-rose-300'
                                    }`}
                                  >
                                    {tf(`feasibility.criterion1.${opt.id}.tag`, opt.tag)}
                                  </span>
                                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                                    {tf(`feasibility.criterion1.${opt.id}.label`, opt.label)}
                                  </h4>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                  {tf(`feasibility.criterion1.${opt.id}.description`, opt.description)}
                                </p>
                                <div className="pt-2 text-xs font-bold text-blue-700 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                  <span>{tf('feasibility.recommendation.label', 'Recomendación metodológica:')} {tf(`feasibility.criterion1.${opt.id}.advisorTip`, opt.advisorTip)}</span>
                                </div>
                              </div>
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${
                                  isSelected
                                    ? 'bg-[#002B49] border-[#002B49] text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Next Button */}
                    <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-100">
                      <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                        {tf('feasibility.step1.helper', 'Selecciona el nivel de acceso para proceder al Criterio 2')}
                      </span>
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#002B49] hover:bg-[#001f35] text-amber-300 font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all hover-lift ml-auto"
                      >
                        <span>{tf('feasibility.nav.next1', 'Siguiente: Literatura Indexada')}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Literatura Scopus */}
              {currentStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6 w-full"
                >
                  <div className="surface border-2 border-purple-100 rounded-3xl p-5 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200 inline-block mb-1">
                          {tf('feasibility.step2.badge', 'Criterio 2 de 3 (Máx. 35 puntos)')}
                        </span>
                        <h3 className="text-lg sm:text-xl font-black text-slate-900">
                          {tf('feasibility.step2.title', 'Literatura Científica Indexada Contemporánea (< 5 años)')}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                          {tf('feasibility.step2.question', '¿Se identifican artículos en bases de datos indexadas (Scopus, Web of Science, Latindex) sobre las variables en estudio?')}
                        </p>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-2xl font-black text-[#002B49]">
                          {q2} <span className="text-sm font-semibold text-slate-400">/ 35 pts</span>
                        </span>
                      </div>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 gap-3.5 mt-6">
                      {CRITERION_2_OPTIONS.map((opt) => {
                        const isSelected = q2 === opt.value;
                        return (
                          <div
                            key={opt.value}
                            onClick={() => setQ2(opt.value)}
                            className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all hover-lift ${
                              isSelected
                                ? 'bg-purple-50/70 border-[#002B49] shadow-md ring-2 ring-purple-500/20'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`px-2 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider ${
                                      opt.value === 35
                                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                        : opt.value === 15
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                        : 'bg-rose-100 text-rose-900 border border-rose-300'
                                    }`}
                                  >
                                    {tf(`feasibility.criterion2.${opt.id}.tag`, opt.tag)}
                                  </span>
                                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                                    {tf(`feasibility.criterion2.${opt.id}.label`, opt.label)}
                                  </h4>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                  {tf(`feasibility.criterion2.${opt.id}.description`, opt.description)}
                                </p>
                                <div className="pt-2 text-xs font-bold text-purple-700 flex items-center gap-1.5">
                                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                                  <span>{tf('feasibility.recommendation.label', 'Recomendación metodológica:')} {tf(`feasibility.criterion2.${opt.id}.advisorTip`, opt.advisorTip)}</span>
                                </div>
                              </div>
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${
                                  isSelected
                                    ? 'bg-[#002B49] border-[#002B49] text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-100">
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>{tf('feasibility.nav.previous', 'Anterior')}</span>
                      </button>
                      <button
                        onClick={() => setCurrentStep(3)}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#002B49] hover:bg-[#001f35] text-amber-300 font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all hover-lift"
                      >
                        <span>{tf('feasibility.nav.next2', 'Siguiente: Relevancia Práctica')}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Relevancia Práctica */}
              {currentStep === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6 w-full"
                >
                  <div className="surface border-2 border-emerald-100 rounded-3xl p-5 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 inline-block mb-1">
                          {tf('feasibility.step3.badge', 'Criterio 3 de 3 (Máx. 30 puntos)')}
                        </span>
                        <h3 className="text-lg sm:text-xl font-black text-slate-900">
                          {tf('feasibility.step3.title', 'Relevancia Práctica y Aporte a la Toma de Decisiones')}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                          {tf('feasibility.step3.question', '¿Los resultados aportarán a resolver una problemática tangible del entorno y respaldar la toma de decisiones organizacionales?')}
                        </p>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-2xl font-black text-[#002B49]">
                          {q3} <span className="text-sm font-semibold text-slate-400">/ 30 pts</span>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 mt-6">
                      {CRITERION_3_OPTIONS.map((opt) => {
                        const isSelected = q3 === opt.value;
                        return (
                          <div
                            key={opt.value}
                            onClick={() => setQ3(opt.value)}
                            className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all hover-lift ${
                              isSelected
                                ? 'bg-emerald-50/70 border-[#002B49] shadow-md ring-2 ring-emerald-500/20'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`px-2 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider ${
                                      opt.value === 30
                                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                        : opt.value === 15
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                        : 'bg-rose-100 text-rose-900 border border-rose-300'
                                    }`}
                                  >
                                    {tf(`feasibility.criterion3.${opt.id}.tag`, opt.tag)}
                                  </span>
                                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                                    {tf(`feasibility.criterion3.${opt.id}.label`, opt.label)}
                                  </h4>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                  {tf(`feasibility.criterion3.${opt.id}.description`, opt.description)}
                                </p>
                                <div className="pt-2 text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                                  <span>{tf('feasibility.recommendation.label', 'Recomendación metodológica:')} {tf(`feasibility.criterion3.${opt.id}.advisorTip`, opt.advisorTip)}</span>
                                </div>
                              </div>
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${
                                  isSelected
                                    ? 'bg-[#002B49] border-[#002B49] text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-100">
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>{tf('feasibility.nav.previous', 'Anterior')}</span>
                      </button>
                      <button
                        onClick={() => setCurrentStep(4)}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#002B49] hover:bg-[#001f35] text-amber-300 font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all hover-lift"
                      >
                        <span>{tf('feasibility.nav.next3', 'Siguiente: Matriz de Variables')}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Matriz de Variables */}
              {currentStep === 4 && (
                <motion.div
                  key="step-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6 w-full"
                >
                  <div className="surface border-2 border-amber-200/80 rounded-3xl p-5 sm:p-8">
                    <div className="pb-4 border-b border-slate-100">
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 inline-block mb-1">
                        {tf('feasibility.step4.badge', 'Paso 4: Formulación Metodológica')}
                      </span>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900">
                        {tf('feasibility.step4.title', 'Matriz de Consistencia & Formulación de Variables')}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                        {tf('feasibility.step4.subtitle', 'Ingresa los componentes clave. El modelo orientado a objetos genera el Título Institucional, la Pregunta de Investigación, el Objetivo SMART y la Hipótesis en cascada.')}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                      {/* Inputs */}
                      <div className="inset-surface rounded-2xl p-4 sm:p-5 space-y-4">
                        {/* Enfoque: decide la estructura de todo lo que sigue. */}
                        <div>
                          <label className="text-xs font-extrabold text-slate-700 block mb-1.5">
                            {tf('feasibility.step4.approachLabel', 'Enfoque de tu proyecto (según tu carrera)')}
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {APPROACH_LIST.map((item) => {
                              const isActive = item.id === approach;
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => changeApproach(item.id)}
                                  className={`text-left px-3 py-2 rounded-xl border transition-all ${
                                    isActive
                                      ? 'bg-[#002B49] border-[#002B49] text-white shadow-md'
                                      : 'bg-white border-slate-300 text-slate-700 hover:border-[#002B49]/50 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="block text-[11.5px] font-black leading-tight">
                                    {item.label}
                                  </span>
                                  <span
                                    className={`block text-[9.5px] leading-tight mt-0.5 ${
                                      isActive ? 'text-blue-100' : 'text-slate-500'
                                    }`}
                                  >
                                    {item.careers}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[10.5px] text-slate-500 mt-1.5 leading-snug">
                            <strong className="text-slate-700">{spec.summary}</strong> {tf('feasibility.step4.structurePrefix', 'Estructura del título:')}{' '}
                            <span className="font-mono text-[9.5px]">{spec.pattern}</span>
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-extrabold text-slate-700 block mb-1">
                            {spec.fields.subject.label}
                          </label>
                          <input
                            type="text"
                            value={slots.subject}
                            onChange={(e) => setSlot('subject', e.target.value)}
                            className="field w-full rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-1 focus:ring-blue-600"
                            placeholder={spec.fields.subject.placeholder}
                          />
                          <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                            {spec.fields.subject.hint}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-extrabold text-slate-700 block mb-1">
                              {spec.fields.qualifier.label}
                            </label>
                            {spec.fields.qualifier.options ? (
                              <select
                                value={slots.qualifier}
                                onChange={(e) => setSlot('qualifier', e.target.value)}
                                className="field w-full rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-blue-600 font-medium"
                              >
                                {spec.fields.qualifier.options.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={slots.qualifier}
                                onChange={(e) => setSlot('qualifier', e.target.value)}
                                className="field w-full rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-1 focus:ring-blue-600"
                                placeholder={spec.fields.qualifier.placeholder}
                              />
                            )}
                          </div>

                          <div>
                            <label className="text-xs font-extrabold text-slate-700 block mb-1">
                              {spec.fields.target.label}
                            </label>
                            <input
                              type="text"
                              value={slots.target}
                              onChange={(e) => setSlot('target', e.target.value)}
                              className="field w-full rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-1 focus:ring-blue-600"
                              placeholder={spec.fields.target.placeholder}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-extrabold text-slate-700 block mb-1">
                            {spec.fields.scope.label}
                          </label>
                          <input
                            type="text"
                            value={slots.scope}
                            onChange={(e) => setSlot('scope', e.target.value)}
                            className="field w-full rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-1 focus:ring-blue-600"
                            placeholder={spec.fields.scope.placeholder}
                          />
                          <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                            {spec.fields.scope.hint}
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-extrabold text-slate-700 block mb-1">
                            {tf('feasibility.step4.contextLabel', 'Lugar y año')}{' '}
                            <span className="font-normal text-slate-400">{tf('feasibility.step4.contextOptional', '(el año es opcional)')}</span>
                          </label>
                          <input
                            type="text"
                            value={slots.context}
                            onChange={(e) => setSlot('context', e.target.value)}
                            className="field w-full rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-1 focus:ring-blue-600"
                            placeholder="Ej: de la provincia del Guayas, 2026"
                          />
                          <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                            {tf('feasibility.step4.contextHint', 'No todos los formatos de titulación exigen el año. Si tu carrera no lo pide, escribe solo el lugar (ej: "de la provincia del Guayas") y bórralo del ejemplo.')}
                          </p>
                        </div>
                      </div>

                      {/* Live Generated Outputs */}
                      <div className="surface rounded-2xl p-4 sm:p-5 space-y-3.5 min-w-0">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-xs font-black uppercase tracking-wider text-[#002B49] flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>{tf('feasibility.outputs.title', 'Generación en Cascada')}</span>
                          </span>
                          <button
                            onClick={() => copyToClipboard(fullTitle, false)}
                            className="flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-all"
                          >
                            {copiedTitle ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedTitle ? tf('feasibility.outputs.copied', '¡Copiado!') : tf('feasibility.outputs.copyTitle', 'Copiar Título')}</span>
                          </button>
                        </div>

                        {/* Title Card */}
                        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs sm:text-sm font-bold text-slate-900 leading-snug break-words">
                          <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 block mb-1">
                            {tf('feasibility.outputs.formalTitleLabel', 'Título Formal de Titulación:')}
                          </span>
                          {fullTitle}
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="p-3 rounded-xl inset-surface">
                            <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block mb-0.5">
                              {tf('feasibility.outputs.questionLabel', 'Pregunta General del Problema (Cap. 1)')}
                            </span>
                            <p className="text-slate-800 font-medium break-words">{researchQuestion}</p>
                          </div>

                          <div className="p-3 rounded-xl inset-surface">
                            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block mb-0.5">
                              {tf('feasibility.outputs.objectiveLabel', 'Objetivo General (SMART)')}
                            </span>
                            <p className="text-slate-800 font-medium break-words">{generalObjective}</p>
                          </div>

                          <div className="p-3 rounded-xl inset-surface">
                            <span className="text-[10px] font-black text-teal-800 uppercase tracking-wider block mb-1">
                              {tf('feasibility.outputs.specificsLabel', 'Objetivos Específicos')}
                            </span>
                            <ol className="space-y-1 list-decimal list-inside">
                              {specificObjectives.map((objective, index) => (
                                <li key={index} className="text-slate-800 font-medium break-words">
                                  {objective}
                                </li>
                              ))}
                            </ol>
                          </div>

                          <div className="p-3 rounded-xl inset-surface">
                            <span className="text-[10px] font-black text-indigo-800 uppercase tracking-wider block mb-0.5">
                              {thesisProject.getClaimLabel()}
                            </span>
                            <p className="text-slate-800 font-medium break-words">{generalHypothesis}</p>
                          </div>

                          {/* Auditoría del título: comprueba que la redacción cumpla el patrón académico */}
                          <div className="p-3 rounded-xl inset-surface">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                                {tf('feasibility.outputs.auditLabel', 'Auditoría de Redacción')}
                              </span>
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  titleReview.score >= 80
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : titleReview.score >= 55
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {titleReview.score}/100 · {titleReview.verdict}
                              </span>
                            </div>
                            <ul className="space-y-1">
                              {titleReview.signals.map((signal, index) => (
                                <li key={index} className="flex items-start gap-1.5 text-slate-700 font-medium">
                                  {signal.level === 'ok' ? (
                                    <Check className="w-3 h-3 text-emerald-600 mt-0.5 shrink-0" />
                                  ) : signal.level === 'warn' ? (
                                    <AlertTriangle className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
                                  ) : (
                                    <XCircle className="w-3 h-3 text-rose-600 mt-0.5 shrink-0" />
                                  )}
                                  <span className="break-words">
                                    <strong className="text-slate-900">{signal.label}:</strong> {signal.detail}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-100">
                      <button
                        onClick={() => setCurrentStep(3)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>{tf('feasibility.nav.previous', 'Anterior')}</span>
                      </button>
                      <button
                        onClick={() => setCurrentStep(5)}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#002B49] font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all hover-lift"
                      >
                        <span>{tf('feasibility.nav.next4', 'Generar Dictamen Metodológico')}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 5: Dictamen Diagnóstico Metodológico */}
              {currentStep === 5 && (
                <motion.div
                  key="step-5"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6 w-full"
                >
                  <div className={`p-5 sm:p-8 rounded-3xl border-2 ${report.bgClass} shadow-md`}>
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/60">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-200 shrink-0">
                          {report.isApproved() ? (
                            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                          ) : report.needsAdjustment() ? (
                            <AlertTriangle className="w-7 h-7 text-amber-600" />
                          ) : (
                            <XCircle className="w-7 h-7 text-rose-600" />
                          )}
                        </div>
                        <div>
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                            {tf('feasibility.step5.badge', 'DICTAMEN TÉCNICO METODOLÓGICO')}
                          </span>
                          <h3 className={`text-xl sm:text-2xl font-black ${report.textClass}`}>
                            {report.title}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-xs text-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {tf('feasibility.step5.finalScore', 'Puntaje Final')}
                          </span>
                          <span className="text-2xl font-black text-[#002B49]">
                            {report.totalScore} <span className="text-xs text-slate-500">/ 100</span>
                          </span>
                        </div>
                        <span className={`px-3 py-2 rounded-2xl text-xs font-black uppercase tracking-wider ${report.badgeClass} shadow-xs`}>
                          {report.level}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6">
                      <div className="surface p-4 rounded-2xl">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                          {tf('feasibility.step5.breakdown1', '1. Acceso a Datos')}
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-black text-slate-900">{report.criteria.access.score} / 35 pts</span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                              report.criteria.access.score >= 35
                                ? 'bg-emerald-100 text-emerald-800'
                                : report.criteria.access.score >= 20
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {report.criteria.access.status}
                          </span>
                        </div>
                      </div>

                      <div className="surface p-4 rounded-2xl">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                          {tf('feasibility.step5.breakdown2', '2. Literatura Scopus')}
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-black text-slate-900">{report.criteria.literature.score} / 35 pts</span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                              report.criteria.literature.score >= 35
                                ? 'bg-emerald-100 text-emerald-800'
                                : report.criteria.literature.score >= 15
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {report.criteria.literature.status}
                          </span>
                        </div>
                      </div>

                      <div className="surface p-4 rounded-2xl">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                          {tf('feasibility.step5.breakdown3', '3. Relevancia Práctica')}
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-black text-slate-900">{report.criteria.relevance.score} / 30 pts</span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                              report.criteria.relevance.score >= 30
                                ? 'bg-emerald-100 text-emerald-800'
                                : report.criteria.relevance.score >= 15
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {report.criteria.relevance.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Advice */}
                    <div className="surface p-5 rounded-2xl mt-5">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-1 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>{tf('feasibility.step5.adviceTitle', 'Dictamen & Recomendaciones para el Investigador:')}</span>
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                        {report.advice}
                      </p>
                    </div>

                    {/* Summary box */}
                    <div className="surface p-5 rounded-2xl mt-4 space-y-3">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#002B49] block">
                        {tf('feasibility.step5.summaryTitle', 'Resumen de la Matriz de Consistencia para el Plan:')}
                      </span>
                      <div className="text-xs text-slate-800 space-y-1.5 font-medium break-words">
                        <p><strong className="text-slate-900 font-extrabold">{tf('feasibility.step5.titleLabel', 'Título:')}</strong> {fullTitle}</p>
                        <p><strong className="text-slate-900 font-extrabold">{tf('feasibility.step5.questionLabel', 'Pregunta:')}</strong> {researchQuestion}</p>
                        <p><strong className="text-slate-900 font-extrabold">{tf('feasibility.step5.objectiveLabel', 'Objetivo General:')}</strong> {generalObjective}</p>
                        <p><strong className="text-slate-900 font-extrabold">{thesisProject.getClaimLabel()}:</strong> {generalHypothesis}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <button
                          onClick={() => copyToClipboard(thesisProject.exportConsistencyMatrixText(), true)}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#002B49] hover:bg-[#001f35] text-amber-300 font-extrabold text-xs shadow-sm transition-all"
                        >
                          {copiedMatrix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedMatrix ? tf('feasibility.step5.copiedMatrix', '¡Matriz Copiada!') : tf('feasibility.step5.copyMatrix', 'Copiar Matriz Completa')}</span>
                        </button>

                        <button
                          onClick={() => setCurrentStep(1)}
                          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{tf('feasibility.step5.reevaluate', 'Reevaluar Criterios')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Contacto directo por WhatsApp */}
                    <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-200 block">
                          {tf('feasibility.step5.helpTitle', '¿Te ayudo a revisar este resultado?')}
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-white mt-0.5">
                          {tf('feasibility.step5.helpBody', 'Si quieres que te ayude con el planteamiento antes de presentarlo, escríbeme y lo vemos.')}
                        </p>
                      </div>
                      <a
                        href={`https://wa.me/593985976227?text=${encodeURIComponent(
                          tf(
                            'feasibility.whatsapp.message',
                            '¡Hola! Realicé la evaluación de viabilidad en el portal Tesis Ecuador. Mi tema es: "{title}" con puntaje {score}/100 ({level}). Quisiera que me ayudes con el desarrollo de mi proyecto de titulación.'
                          )
                            .replace('{title}', fullTitle)
                            .replace('{score}', String(totalScore))
                            .replace('{level}', report.level)
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-black text-xs shadow-sm transition-all flex items-center gap-1.5 shrink-0 hover-lift"
                      >
                        <Send className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{tf('feasibility.step5.whatsapp', 'Consultar en WhatsApp')}</span>
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            /* FULL VIEW MODE (All-in-one executive view) */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 w-full">
              {/* Left Column */}
              <div className="lg:col-span-6 space-y-5 min-w-0">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-base font-black text-[#002B49] flex items-center gap-2">
                    <span>{tf('feasibility.full.section1Title', '1. Criterios de Viabilidad Institucional')}</span>
                  </h4>
                  <span className="text-xs font-black bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
                    {tf('feasibility.full.totalLabel', 'Total:')} {totalScore} / 100 pts
                  </span>
                </div>

                {/* Q1 */}
                <div className="surface rounded-2xl p-4 sm:p-5">
                  <label className="text-xs font-black text-slate-800 block mb-2.5 uppercase tracking-wide">
                    {tf('feasibility.full.q1Label', '1. Acceso a Datos y Unidad de Análisis:')}
                  </label>
                  <div className="space-y-2">
                    {CRITERION_1_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setQ1(opt.value)}
                        className={`w-full text-left p-3 rounded-xl text-xs transition-all border ${
                          q1 === opt.value
                            ? 'bg-blue-50 border-[#002B49] text-blue-950 font-extrabold shadow-xs'
                            : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="font-black text-blue-700 mr-2">[{tf(`feasibility.criterion1.${opt.id}.tag`, opt.tag)}]</span>
                        {tf(`feasibility.criterion1.${opt.id}.label`, opt.label)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q2 */}
                <div className="surface rounded-2xl p-4 sm:p-5">
                  <label className="text-xs font-black text-slate-800 block mb-2.5 uppercase tracking-wide">
                    {tf('feasibility.full.q2Label', '2. Literatura Científica Indexada (< 5 años):')}
                  </label>
                  <div className="space-y-2">
                    {CRITERION_2_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setQ2(opt.value)}
                        className={`w-full text-left p-3 rounded-xl text-xs transition-all border ${
                          q2 === opt.value
                            ? 'bg-purple-50 border-[#002B49] text-purple-950 font-extrabold shadow-xs'
                            : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="font-black text-purple-700 mr-2">[{tf(`feasibility.criterion2.${opt.id}.tag`, opt.tag)}]</span>
                        {tf(`feasibility.criterion2.${opt.id}.label`, opt.label)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q3 */}
                <div className="surface rounded-2xl p-4 sm:p-5">
                  <label className="text-xs font-black text-slate-800 block mb-2.5 uppercase tracking-wide">
                    {tf('feasibility.full.q3Label', '3. Relevancia Práctica & Aporte:')}
                  </label>
                  <div className="space-y-2">
                    {CRITERION_3_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setQ3(opt.value)}
                        className={`w-full text-left p-3 rounded-xl text-xs transition-all border ${
                          q3 === opt.value
                            ? 'bg-emerald-50 border-[#002B49] text-emerald-950 font-extrabold shadow-xs'
                            : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="font-black text-emerald-700 mr-2">[{tf(`feasibility.criterion3.${opt.id}.tag`, opt.tag)}]</span>
                        {tf(`feasibility.criterion3.${opt.id}.label`, opt.label)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status card */}
                <div className={`p-4 sm:p-5 rounded-2xl border-2 ${report.bgClass} shadow-xs`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-black ${report.textClass}`}>
                      {report.level}: {report.title}
                    </span>
                    <span className="text-xs font-black text-[#002B49] px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-xs">
                      {totalScore} / 100 pts
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {report.advice}
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-6 space-y-5 min-w-0">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-base font-black text-[#002B49] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>{tf('feasibility.full.section2Title', '2. Sintetizador de Matriz en Cascada')}</span>
                  </h4>
                  <button
                    onClick={() => setIsFullView(false)}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    {tf('feasibility.full.backToStep', 'Volver a Modo Paso a Paso')}
                  </button>
                </div>

                <div className="surface rounded-2xl p-4 sm:p-5 space-y-3.5">
                  <div>
                    <label className="text-xs font-extrabold text-slate-700 block mb-1.5">
                      {tf('feasibility.full.projectTypeLabel', 'Tipo de proyecto:')}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {APPROACH_LIST.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => changeApproach(item.id)}
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all text-left leading-tight ${
                            approach === item.id
                              ? 'bg-[#002B49] text-white shadow-sm'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5 leading-snug">{spec.pattern}</p>
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-700 block mb-1">
                      {spec.fields.subject.label}
                    </label>
                    <input
                      type="text"
                      value={slots.subject}
                      onChange={(e) => setSlot('subject', e.target.value)}
                      className="field w-full rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-blue-600"
                      placeholder={spec.fields.subject.placeholder}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-extrabold text-slate-700 block mb-1">
                        {spec.fields.qualifier.label}
                      </label>
                      {spec.fields.qualifier.options ? (
                        <select
                          value={slots.qualifier}
                          onChange={(e) => setSlot('qualifier', e.target.value)}
                          className="field w-full rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600"
                        >
                          {spec.fields.qualifier.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={slots.qualifier}
                          onChange={(e) => setSlot('qualifier', e.target.value)}
                          className="field w-full rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-blue-600"
                          placeholder={spec.fields.qualifier.placeholder}
                        />
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-extrabold text-slate-700 block mb-1">
                        {spec.fields.target.label}
                      </label>
                      <input
                        type="text"
                        value={slots.target}
                        onChange={(e) => setSlot('target', e.target.value)}
                        className="field w-full rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-blue-600"
                        placeholder={spec.fields.target.placeholder}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-700 block mb-1">
                      {spec.fields.scope.label}
                    </label>
                    <input
                      type="text"
                      value={slots.scope}
                      onChange={(e) => setSlot('scope', e.target.value)}
                      className="field w-full rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-blue-600"
                      placeholder={spec.fields.scope.placeholder}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-700 block mb-1">
                      {tf('feasibility.step4.contextLabel', 'Lugar y año')}:
                    </label>
                    <input
                      type="text"
                      value={slots.context}
                      onChange={(e) => setSlot('context', e.target.value)}
                      className="field w-full rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Outputs */}
                <div className="surface rounded-2xl p-4 sm:p-5 space-y-3.5 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-[#002B49]">
                      {tf('feasibility.full.titleOutputLabel', 'Título Académico Formal')}
                    </span>
                    <button
                      onClick={() => copyToClipboard(fullTitle, false)}
                      className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg"
                    >
                      {copiedTitle ? tf('feasibility.full.copied', '¡Copiado!') : tf('feasibility.full.copy', 'Copiar')}
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 bg-blue-50/60 p-3 rounded-xl border border-blue-200 break-words">
                    {fullTitle}
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 inset-surface rounded-xl">
                      <span className="text-[10px] font-black text-amber-800 block">{tf('feasibility.full.questionLabel', 'Pregunta General:')}</span>
                      <p className="font-medium text-slate-800 break-words">{researchQuestion}</p>
                    </div>
                    <div className="p-2.5 inset-surface rounded-xl">
                      <span className="text-[10px] font-black text-emerald-800 block">{tf('feasibility.full.objectiveLabel', 'Objetivo General:')}</span>
                      <p className="font-medium text-slate-800 break-words">{generalObjective}</p>
                    </div>
                    <div className="p-2.5 inset-surface rounded-xl">
                      <span className="text-[10px] font-black text-indigo-800 block">{thesisProject.getClaimLabel()}:</span>
                      <p className="font-medium text-slate-800 break-words">{generalHypothesis}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => copyToClipboard(thesisProject.exportConsistencyMatrixText(), true)}
                    className="w-full py-2.5 rounded-xl bg-[#002B49] hover:bg-[#001f35] text-amber-300 font-extrabold text-xs transition-all shadow-sm"
                  >
                    {copiedMatrix ? tf('feasibility.full.copiedMatrixFull', '¡Matriz Copiada al Portapapeles!') : tf('feasibility.full.copyMatrixFull', 'Copiar Matriz de Consistencia Completa')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
