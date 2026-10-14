import fr from './fr.json';
import en from './en.json';
import nl from './nl.json';
import de from './de.json';
import ar from './ar.json';
import type { Lang } from './routes';

export * from './routes';

type Dict = typeof fr;
const DICTS: Record<Lang, Dict> = { fr, en, nl, de, ar };

function lookup(dict: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((node, part) => {
    if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) {
      return (node as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export type Vars = Record<string, string | number>;

export interface Translator {
  lang: Lang;
  /** Texte brut (pour attributs, title, alt…). Les {variables} sont remplacées telles quelles. */
  (key: string, vars?: Vars): string;
  /**
   * HTML sûr : le texte est échappé et chaque {variable} est isolée dans un <bdi dir="ltr">
   * (noms de marque, numéros, prix restent lisibles en arabe). À utiliser avec set:html.
   */
  html: (key: string, vars?: Vars, opts?: { isolate?: boolean }) => string;
}

export function useT(lang: Lang): Translator {
  const dict = DICTS[lang];
  const get = (key: string): string => {
    const v = lookup(dict, key);
    if (typeof v !== 'string') {
      throw new Error(`[i18n] Clé manquante ou non textuelle « ${key} » (${lang}).`);
    }
    return v;
  };
  const t = ((key: string, vars?: Vars) =>
    get(key).replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? String(vars[k]) : m))) as Translator;
  t.lang = lang;
  t.html = (key, vars, opts = { isolate: true }) =>
    escapeHtml(get(key)).replace(/\{(\w+)\}/g, (m, k) => {
      if (!vars || !(k in vars)) return m;
      const val = escapeHtml(String(vars[k]));
      return opts.isolate === false ? val : `<bdi dir="ltr">${val}</bdi>`;
    });
  return t;
}

/** Nom de la langue dans sa propre langue (« Français », « العربية »…). */
export function nativeName(lang: Lang): string {
  return DICTS[lang].meta.nativeName;
}

export function dictFor(lang: Lang): Dict {
  return DICTS[lang];
}
