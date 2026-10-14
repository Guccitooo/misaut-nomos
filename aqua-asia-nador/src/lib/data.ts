/**
 * Ce qui est réellement affiché, selon le mode (preview / launch).
 * Les composants ne lisent JAMAIS `site.*.value` directement pour une donnée non garantie :
 * ils passent par `visible` ci-dessous.
 */
import { site, type Field, type OpeningSlot } from '../config/site';
import { images, type ImageSlot } from '../config/images';
import { menu, type Localized } from '../content/menu';
import type { Translator, Lang } from '../i18n';

export const isLaunch = site.mode === 'launch';
export const isPreview = !isLaunch;

/** Règle unique : show=false → jamais ; preview → affiché ; launch → seulement si confirmé. */
export function isShown(field: Field<unknown>): boolean {
  if (field.show === false) return false;
  return isPreview || field.confirmed;
}

const addressShown = isShown(site.address);
const phoneShown = isShown(site.phone);

export const visible = {
  name: site.name.value,
  instagram: site.instagram.value,
  district: isShown(site.district) ? site.district.value : null,
  address: addressShown ? site.address.value : null,
  phone: phoneShown ? site.phone.value : null,
  hours: isShown(site.hours) ? site.hours.value : null,
  services: isShown(site.services) ? site.services.value : null,
  /** L'itinéraire dépend de l'adresse. Lien de la fiche si montrable, sinon recherche Maps de l'adresse. */
  directionsUrl: addressShown
    ? isShown(site.directions)
      ? site.directions.value
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${site.address.value.street}, ${site.address.value.postalCode} ${site.address.value.city}, Morocco`,
        )}`
    : null,
  mapEmbedUrl: addressShown ? site.map.embedUrl : null,
};

export const telHref = (p: { e164: string }) => `tel:${p.e164}`;

/** Lignes d'horaires localisées : [{ days: 'Tous les jours', range: '18:00 – 01:00' }]. */
export function hoursLines(slots: OpeningSlot[], t: Translator) {
  return slots.map((s) => ({
    days:
      s.days === 'daily'
        ? t('hours.days.daily')
        : s.days.map((d) => t(`hours.days.${d}`)).join(t('list.separator')),
    opens: s.opens,
    closes: s.closes,
  }));
}

/** Prix : nombre au format de la langue, chiffres latins (usage marocain), devise via l'i18n. */
export function formatAmount(amount: number, lang: Lang): string {
  const locale = { fr: 'fr-FR', en: 'en-GB', nl: 'nl-NL', de: 'de-DE', ar: 'ar-MA-u-nu-latn' }[lang];
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export const hasMenu = menu.categories.some((c) => c.items.length > 0);

/**
 * Texte de la carte dans la langue de la page, ou repli sur le français. `lang` = langue réellement
 * utilisée : quand elle diffère de celle de la page, le composant la déclare (lang + dir) pour que
 * les lecteurs d'écran prononcent correctement et que la ponctuation ne saute pas en arabe.
 */
export function localized(v: Localized | undefined, lang: Lang): { text: string; lang: Lang } | null {
  if (!v) return null;
  const own = v[lang as keyof Localized];
  return own ? { text: own, lang } : { text: v.fr, lang: 'fr' };
}


/* ---------- Photos ---------- */

const photoFiles = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/photos/*.{jpg,jpeg,png,webp,avif}',
  { eager: true },
);

/** Résout `src: 'salle-01.jpg'` vers l'image importée (pipeline Astro), ou null. */
export function resolvePhoto(src: string | null | undefined): ImageMetadata | null {
  if (!src) return null;
  const hit = photoFiles[`/src/assets/photos/${src}`];
  if (!hit) {
    throw new Error(`[images] Fichier introuvable : src/assets/photos/${src}`);
  }
  return hit.default;
}

export const galleryPhotos = images.gallery
  .map((slot: ImageSlot, i) => ({ slot, index: i, image: resolvePhoto(slot.src) }))
  .filter((g) => g.image !== null);

export const hasGalleryPhotos = galleryPhotos.length > 0;
