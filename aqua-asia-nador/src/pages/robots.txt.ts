import type { APIRoute } from 'astro';
import { site } from '../config/site';

/**
 * launch : tout est permis (+ sitemap si le domaine est connu).
 * preview : tout est AUSSI permis aux robots, volontairement : chaque page porte
 * <meta name="robots" content="noindex, nofollow">, et un robot ne lit ce noindex que s'il a le droit
 * de télécharger la page (un « Disallow: / » laisserait indexer l'URL nue d'un lien partagé).
 * Si possible, ajouter aussi l'en-tête HTTP `X-Robots-Tag: noindex` sur l'hébergement de prévisualisation.
 */
export const GET: APIRoute = () => {
  const sitemap =
    site.mode === 'launch' && site.siteUrl ? [`Sitemap: ${site.siteUrl.replace(/\/$/, '')}/sitemap.xml`] : [];
  const lines = ['User-agent: *', 'Allow: /', ...sitemap];
  return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
