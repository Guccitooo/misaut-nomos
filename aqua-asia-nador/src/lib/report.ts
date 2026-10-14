/**
 * Rapport des données non confirmées — affiché dans le terminal à chaque build
 * (intégration définie dans astro.config.ts). Jamais rendu sur le site.
 */
import { site, type Field } from '../config/site';
import { menu, type Localized } from '../content/menu';

export interface ReportEntry {
  key: string;
  source: string;
  neverShown: boolean;
}

export function unconfirmedFields(): ReportEntry[] {
  return (Object.entries(site) as Array<[string, unknown]>)
    .filter(([, v]) => !!v && typeof v === 'object' && 'confirmed' in (v as object))
    .map(([k, v]) => [k, v as Field<unknown>] as const)
    .filter(([, f]) => !f.confirmed)
    .map(([k, f]) => ({ key: k, source: f.source, neverShown: f.show === false }));
}

/**
 * Plats et catégories dont une traduction manque (repli sur le français, balisé lang="fr" sur la page).
 * Rapport de build uniquement, jamais affiché sur le site.
 */
export function missingMenuTranslations(): string[] {
  const langs = ['en', 'nl', 'de', 'ar'] as const;
  const out: string[] = [];
  const check = (what: string, v?: Localized) => {
    if (!v) return;
    const miss = langs.filter((l) => !v[l]);
    if (miss.length) out.push(`${what} (${miss.join(', ')})`);
  };
  for (const c of menu.categories) {
    check(`catégorie ${c.id} : nom`, c.name);
    check(`catégorie ${c.id} : note`, c.note);
    for (const it of c.items) {
      check(`${c.id}/${it.id} : nom`, it.name);
      check(`${c.id}/${it.id} : description`, it.description);
    }
  }
  return out;
}
