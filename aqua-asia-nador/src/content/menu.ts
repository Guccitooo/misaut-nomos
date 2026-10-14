/**
 * La carte du restaurant — données uniquement.
 *
 * VIDE pour l'instant : la carte n'a pas encore été transmise par le propriétaire. Tant que
 * `categories` est vide, le site affiche l'état « La carte en ligne arrive bientôt » (traduit).
 * Ajouter la carte = remplir ce fichier, rien d'autre. Un exemple commenté (fictif) se trouve
 * dans le README, section « Ajouter la carte ».
 *
 * Règles :
 *   - `name.fr` est obligatoire ; les autres langues sont facultatives (repli sur le français).
 *   - `price` en dirhams (nombre, ex. 120 ou 89.5) ; l'affichage « 120 MAD » / « 120 درهم » est
 *     automatique selon la langue.
 *   - `tags` et `allergens` : uniquement ce que le propriétaire a fourni, dans les listes ci-dessous
 *     (libellés traduits dans `src/i18n/*.json` → `menu.tags.*` et `menu.allergens.*`).
 *   - `available: false` garde le plat visible avec la mention « momentanément indisponible ».
 *   - `photo` : nom de fichier dans `src/assets/photos/` (facultatif).
 */

export type Lang = 'fr' | 'en' | 'nl' | 'de' | 'ar';
export type Localized = { fr: string } & Partial<Record<Exclude<Lang, 'fr'>, string>>;

export const DIETARY_TAGS = [
  'vegetarian',
  'vegan',
  'spicy1',
  'spicy2',
  'spicy3',
  'containsNuts',
  'glutenFree',
] as const;
export type DietaryTag = (typeof DIETARY_TAGS)[number];

/** Les 14 allergènes de référence. */
export const ALLERGENS = [
  'gluten',
  'crustaceans',
  'eggs',
  'fish',
  'peanuts',
  'soy',
  'milk',
  'nuts',
  'celery',
  'mustard',
  'sesame',
  'sulphites',
  'lupin',
  'molluscs',
] as const;
export type Allergen = (typeof ALLERGENS)[number];

export interface MenuItem {
  /** Identifiant stable (lettres, chiffres, tirets). */
  id: string;
  name: Localized;
  description?: Localized;
  price?: number;
  tags?: DietaryTag[];
  allergens?: Allergen[];
  available?: boolean;
  photo?: string | null;
}

export interface MenuCategory {
  /** Identifiant stable, sert d'ancre (#cat-<id>) identique dans toutes les langues. */
  id: string;
  name: Localized;
  note?: Localized;
  items: MenuItem[];
}

export interface Menu {
  currency: 'MAD';
  categories: MenuCategory[];
}

export const menu: Menu = {
  currency: 'MAD',
  categories: [],
};
