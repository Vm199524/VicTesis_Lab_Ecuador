/**
 * Traducciones del contenido académico.
 *
 * Separadas de `translations.ts` por volumen y por ritmo: la interfaz es corta y
 * cambia poco, el catálogo es largo y crece. Cada archivo cubre un módulo y se
 * consulta con `tf(clave, textoEnEspañol)`, que devuelve el español si todavía no
 * hay traducción. Un módulo sin traducir no rompe nada: se ve como hoy.
 */

import type { ContentDict } from './types';
import { TOOL_TRANSLATIONS } from './tools';
import { VIDEO_TRANSLATIONS } from './videos';
import { CHAPTER_TRANSLATIONS } from './chapters';
import { BOOLEAN_TRANSLATIONS } from './boolean';
import { MODULE_UI_TRANSLATIONS } from './modules';
import { SLIDE_TRANSLATIONS } from './slides';
import { DRAFT_REVIEW_TRANSLATIONS } from './draftReview';
import { TUTOR_RESPONSE_TRANSLATIONS } from './tutorResponses';
import { FEASIBILITY_TRANSLATIONS } from './feasibility';

export const CONTENT_TRANSLATIONS: ContentDict = {
  ...TOOL_TRANSLATIONS,
  ...VIDEO_TRANSLATIONS,
  ...CHAPTER_TRANSLATIONS,
  ...BOOLEAN_TRANSLATIONS,
  ...MODULE_UI_TRANSLATIONS,
  ...SLIDE_TRANSLATIONS,
  ...DRAFT_REVIEW_TRANSLATIONS,
  ...TUTOR_RESPONSE_TRANSLATIONS,
  ...FEASIBILITY_TRANSLATIONS,
};
