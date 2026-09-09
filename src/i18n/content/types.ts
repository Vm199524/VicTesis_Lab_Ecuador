/** Forma común de los diccionarios de contenido. */
import type { Locale } from '../translations';

export type ContentDict = Record<string, Record<Locale, string>>;
