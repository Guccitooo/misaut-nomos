/**
 * Langues et adresses localisées — table unique.
 * Le français est la langue par défaut (à la racine `/`), les autres ont un préfixe (`/en/`…).
 */

export const LANGS = ['fr', 'en', 'nl', 'de', 'ar'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'fr';
export const RTL_LANGS: readonly Lang[] = ['ar'];

export const PAGES = ['home', 'menu', 'gallery', 'contact'] as const;
export type PageKey = (typeof PAGES)[number];

/** Slug de chaque page, par langue ('' = accueil). */
export const SLUGS: Record<PageKey, Record<Lang, string>> = {
  home: { fr: '', en: '', nl: '', de: '', ar: '' },
  menu: { fr: 'carte', en: 'menu', nl: 'menukaart', de: 'speisekarte', ar: 'menu' },
  gallery: { fr: 'galerie', en: 'gallery', nl: 'galerij', de: 'galerie', ar: 'gallery' },
  contact: { fr: 'contact', en: 'contact', nl: 'contact', de: 'kontakt', ar: 'contact' },
};

/** Sections de l'accueil : identifiants neutres, identiques dans toutes les langues. */
export const SECTION_IDS = ['intro', 'menu', 'gallery', 'visit', 'instagram'] as const;

export function isRtl(lang: Lang): boolean {
  return RTL_LANGS.includes(lang);
}

/** Chemin public d'une page, toujours avec slash final : '/', '/carte/', '/en/menu/'. */
export function pathFor(page: PageKey, lang: Lang): string {
  const slug = SLUGS[page][lang];
  const prefix = lang === DEFAULT_LANG ? '' : `/${lang}`;
  return `${prefix}/${slug ? `${slug}/` : ''}`;
}

/** Chemins équivalents d'une page dans toutes les langues. */
export function alternatesFor(page: PageKey): Record<Lang, string> {
  return Object.fromEntries(LANGS.map((l) => [l, pathFor(page, l)])) as Record<Lang, string>;
}

/** Paramètre `path` pour la route `[...path].astro` (undefined = racine). */
export function routeParam(page: PageKey, lang: Lang): string | undefined {
  const p = pathFor(page, lang).replace(/^\/|\/$/g, '');
  return p === '' ? undefined : p;
}
