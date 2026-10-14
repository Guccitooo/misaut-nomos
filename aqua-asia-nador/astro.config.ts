import { defineConfig } from 'astro/config';
import type { AstroIntegration } from 'astro';
import { site } from './src/config/site';
import { missingMenuTranslations, unconfirmedFields } from './src/lib/report';

/**
 * Rapport de données au build : liste ce qui n'est pas confirmé.
 * - preview : information (les valeurs sont affichées, pages en noindex) ;
 * - launch  : AVERTISSEMENT (ces valeurs sont masquées sur le site public).
 * Rien de tout cela n'apparaît sur les pages.
 */
function dataReport(): AstroIntegration {
  return {
    name: 'aqua-data-report',
    hooks: {
      'astro:build:start': ({ logger }) => {
        const list = unconfirmedFields();
        const lines = list.map(
          (f) => `  - ${f.key}${f.neverShown ? ' (jamais affiché : show=false)' : ''} — source : ${f.source}`,
        );
        if (site.mode === 'launch') {
          if (list.length) {
            logger.warn(
              `MODE LAUNCH — ${list.length} donnée(s) NON confirmée(s), masquée(s) sur le site :\n${lines.join('\n')}\n` +
                '  → Faire confirmer par le propriétaire puis passer `confirmed: true` dans src/config/site.ts.',
            );
          } else {
            logger.info('MODE LAUNCH — toutes les données sont confirmées.');
          }
          if (!site.siteUrl) {
            logger.warn('MODE LAUNCH sans `siteUrl` : pas de canonical, de hreflang ni de sitemap.');
          }
        } else {
          logger.info(
            `MODE PREVIEW — pages en noindex. Données non confirmées affichées pour validation (${list.length}) :\n${lines.join('\n')}`,
          );
        }
        const missing = missingMenuTranslations();
        if (missing.length) {
          logger.warn(
            `CARTE — ${missing.length} texte(s) sans traduction (affichés en français, balisés lang="fr") :\n` +
              missing.map((m) => `  - ${m}`).join('\n'),
          );
        }
      },
    },
  };
}

export default defineConfig({
  site: site.siteUrl ?? undefined,
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  server: { port: 4321 },
  preview: { port: 4321 },
  devToolbar: { enabled: false },
  integrations: [dataReport()],
});
