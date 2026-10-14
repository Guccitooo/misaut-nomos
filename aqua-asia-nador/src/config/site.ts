/**
 * Données de l'établissement — SOURCE UNIQUE.
 *
 * Chaque information porte :
 *   - `value`     : la valeur affichée ;
 *   - `confirmed` : `true` uniquement quand le propriétaire l'a validée ;
 *   - `source`    : d'où vient l'information (pour l'équipe, jamais affiché sur le site).
 *
 * Mode `preview` (par défaut) : les valeurs non confirmées sont affichées normalement pour que le
 * propriétaire voie le vrai rendu, et toutes les pages portent `noindex,nofollow`.
 * Mode `launch` : toute valeur non confirmée (et tout ce qui en dépend : bouton d'appel, horaires,
 * adresse, itinéraire…) est masquée, le `noindex` disparaît et le build affiche la liste de ce qui
 * reste à confirmer.
 *
 * Aucun texte public ici : les libellés sont dans `src/i18n/<langue>.json`.
 */

export type SiteMode = 'preview' | 'launch';

export interface Field<T> {
  value: T;
  confirmed: boolean;
  source: string;
  /** `false` = jamais rendu, même en preview (prêt à être activé). */
  show?: boolean;
}

export interface Address {
  street: string;
  postalCode: string;
  city: string;
  /** Code pays ISO (MA). Le nom du pays affiché vient de l'i18n (`visit.country`). */
  countryCode: string;
}

export interface Phone {
  /** Affichage, toujours isolé en LTR. */
  display: string;
  /** Format E.164 pour le lien `tel:`. */
  e164: string;
}

export interface OpeningSlot {
  /** `daily` ou liste de jours (`mon`…`sun`) — les libellés viennent de l'i18n (`hours.days.*`). */
  days: 'daily' | Array<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'>;
  opens: string; // "18:00"
  closes: string; // "01:00" (après minuit = lendemain)
}

export type ServiceKey = 'privateDining' | 'veganDishes';

export const site = {
  /** 'preview' maintenant ; passer à 'launch' quand le propriétaire a tout validé. */
  mode: 'preview' as SiteMode,

  /**
   * Domaine définitif, sans slash final (ex. 'https://www.aquaasia-nador.ma').
   * `null` = pas de canonical, pas de hreflang absolus, pas de sitemap, pas d'og:url.
   */
  siteUrl: null as string | null,

  name: {
    value: 'Aqua Asia',
    confirmed: true,
    source: 'Instagram @aqua.asia.nador',
  } satisfies Field<string>,

  instagram: {
    value: {
      handle: 'aqua.asia.nador',
      profileUrl: 'https://www.instagram.com/aqua.asia.nador/',
      dmUrl: 'https://ig.me/m/aqua.asia.nador',
    },
    confirmed: true,
    source: 'Capture du compte Instagram (le compte existe)',
  } satisfies Field<{ handle: string; profileUrl: string; dmUrl: string }>,

  district: {
    value: 'Hay Al Matar',
    confirmed: false,
    source: 'Bio Instagram',
  } satisfies Field<string>,

  address: {
    value: { street: 'Bd Grand Rif', postalCode: '62000', city: 'Nador', countryCode: 'MA' },
    confirmed: false,
    source: 'Fiche Google Business Profile (Bd Grand Rif dans Hay Al Matar : non vérifié)',
  } satisfies Field<Address>,

  /** Lien « Itinéraire ». Si non confirmé en launch, on retombe sur une recherche Maps de l'adresse. */
  directions: {
    value: 'https://maps.app.goo.gl/sM2CFwnfRP7Ns6m6',
    confirmed: false,
    source: 'Lien exact de la fiche Google Business Profile',
  } satisfies Field<string>,

  phone: {
    value: { display: '+212 6 37 43 61 40', e164: '+212637436140' },
    confirmed: false,
    source: 'Google (texte transmis par le client) — ce n\'est PAS un numéro WhatsApp',
  } satisfies Field<Phone>,

  /**
   * Conflit connu : Instagram = 18:00–01:00 tous les jours ; Google = fermeture 00:00.
   * En preview on affiche la version Instagram (canal du propriétaire). À trancher avec lui.
   */
  hours: {
    value: [{ days: 'daily', opens: '18:00', closes: '01:00' }] as OpeningSlot[],
    confirmed: false,
    source: 'Bio Instagram (Google indique une fermeture à 00:00 : conflit)',
  } satisfies Field<OpeningSlot[]>,

  /** Carte intégrée (iframe). `null` = aucune carte, seulement le bouton Itinéraire. */
  map: {
    embedUrl: null as string | null,
  },

  /** Attributs Google « Comedor privado · Platos veganos » — jamais rendus tant que show=false. */
  services: {
    value: ['privateDining', 'veganDishes'] as ServiceKey[],
    confirmed: false,
    show: false,
    source: 'Attributs de la fiche Google Business Profile',
  } satisfies Field<ServiceKey[]>,

  brand: {
    /** Logo officiel (SVG/PNG dans /public/brand/…), ex. '/brand/aqua-asia-logo.svg'. null = logo provisoire. */
    logoSrc: null as string | null,
    /**
     * Emblème officiel affiché entre AQUA et ASIA dans le hero, ex. '/brand/aqua-asia-emblem.svg'.
     * null = ornement provisoire (soleil en arche sur des vagues), dessiné dans
     * src/components/Emblem.astro. Ce n'est PAS le logo officiel : à remplacer par le fichier fourni.
     */
    emblemSrc: null as string | null,
  },

  /** Crédit agence, dernier élément de chaque page. url null = texte simple. */
  credit: {
    name: 'BayenDaba',
    url: null as string | null,
  },
};

export type Site = typeof site;
