/**
 * sitemap.xml — généré UNIQUEMENT en mode launch avec `site.siteUrl` défini (sinon aucun fichier :
 * en preview les pages sont en noindex, on ne les annonce pas).
 * Chaque URL liste ses équivalents dans les autres langues (hreflang).
 */
import type { APIRoute } from 'astro';
import { site } from '../config/site';
import { LANGS, PAGES, DEFAULT_LANG, alternatesFor } from '../i18n';

export function getStaticPaths() {
  return site.mode === 'launch' && site.siteUrl ? [{ params: { file: 'sitemap' } }] : [];
}

export const GET: APIRoute = () => {
  const base = site.siteUrl!.replace(/\/$/, '');
  const urls = PAGES.flatMap((page) => {
    const alts = alternatesFor(page);
    const links = [
      ...LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${base}${alts[l]}"/>`),
      `<xhtml:link rel="alternate" hreflang="x-default" href="${base}${alts[DEFAULT_LANG]}"/>`,
    ].join('');
    return LANGS.map((l) => `<url><loc>${base}${alts[l]}</loc>${links}</url>`);
  });
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    urls.join('\n') +
    '\n</urlset>\n';
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
