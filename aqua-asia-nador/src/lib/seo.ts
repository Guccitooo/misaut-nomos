/**
 * SEO : URLs absolues (seulement si `siteUrl`), alternates hreflang, JSON-LD Restaurant.
 * JSON-LD : en preview toutes les données (pages en noindex de toute façon) ; en launch
 * uniquement les champs confirmés (via `visible`, qui applique déjà la règle du mode).
 */
import { site } from '../config/site';
import { visible } from './data';
import { LANGS, DEFAULT_LANG, alternatesFor, type PageKey } from '../i18n';

export const siteUrl = site.siteUrl ? site.siteUrl.replace(/\/$/, '') : null;

export const absolute = (path: string) => (siteUrl ? `${siteUrl}${path}` : null);

export function hreflangLinks(page: PageKey) {
  if (!siteUrl) return [];
  const alts = alternatesFor(page);
  return [
    ...LANGS.map((l) => ({ hreflang: l, href: `${siteUrl}${alts[l]}` })),
    { hreflang: 'x-default', href: `${siteUrl}${alts[DEFAULT_LANG]}` },
  ];
}

const DAYS: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

/**
 * JSON-LD Restaurant — seulement si l'adresse est affichable (Google exige `address` pour un
 * LocalBusiness ; sans elle, mieux vaut ne rien déclarer qu'un balisage invalide). `@id` stable :
 * les 5 versions linguistiques décrivent la même entité.
 */
export function restaurantJsonLd(homePath: string, imageUrl: string | null) {
  if (!visible.address) return null;
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: visible.name,
    servesCuisine: 'Asian fusion',
    sameAs: [visible.instagram.profileUrl],
  };
  if (siteUrl) data['@id'] = `${siteUrl}/#restaurant`;
  const url = absolute(homePath);
  if (url) data.url = url;
  if (imageUrl) data.image = imageUrl;
  data.address = {
    '@type': 'PostalAddress',
    streetAddress: visible.address.street,
    postalCode: visible.address.postalCode,
    addressLocality: visible.address.city,
    addressCountry: visible.address.countryCode,
  };
  if (visible.phone) data.telephone = visible.phone.e164;
  if (visible.hours) {
    data.openingHoursSpecification = visible.hours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days === 'daily' ? Object.values(DAYS) : h.days.map((d) => DAYS[d]),
      opens: h.opens,
      closes: h.closes,
    }));
  }
  if (visible.directionsUrl) data.hasMap = visible.directionsUrl;
  return data;
}
