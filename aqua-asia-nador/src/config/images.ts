/**
 * Emplacements photo / vidéo du site.
 *
 * Tant que `src` vaut `null`, le site affiche des visuels d'attente dessinés (dégradés expresso,
 * motif de vagues seigaiha et soleil sur les vagues) — jamais de photo de banque d'images ni de
 * photo d'un autre établissement.
 *
 * Ajouter une vraie photo :
 *   1. déposer le fichier original (JPG/PNG/WebP, 2400 px de large idéalement) dans
 *      `src/assets/photos/` (ex. `src/assets/photos/salle-01.jpg`) ;
 *   2. indiquer son nom de fichier dans `src` ci-dessous (ex. `src: 'salle-01.jpg'`) ;
 *   3. écrire le texte alternatif dans les 5 fichiers `src/i18n/*.json` (clé `altKey`).
 * Astro génère automatiquement AVIF/WebP, plusieurs tailles (srcset) et le lazy-loading.
 *
 * Vidéo du hero : déposer `hero.mp4` (+ éventuellement `hero.webm`) dans `public/video/`, mettre
 * `type: 'video'`, `video: { mp4: '/video/hero.mp4' }` et une image `src` qui sert de poster
 * (affichée seule quand l'utilisateur a demandé moins d'animations).
 *
 * `focal` = point d'intérêt (CSS object-position), ex. '50% 40%'.
 */

export interface ImageSlot {
  /** Nom du fichier dans src/assets/photos/, ou null. */
  src: string | null;
  /** Clé i18n du texte alternatif. */
  altKey: string;
  focal: string;
}

export interface HeroSlot extends ImageSlot {
  type: 'image' | 'video';
  video: { mp4: string | null; webm?: string | null };
}

export const images = {
  hero: {
    type: 'image',
    src: null,
    video: { mp4: null, webm: null },
    altKey: 'images.hero',
    focal: '50% 50%',
  } as HeroSlot,

  intro: { src: null, altKey: 'images.intro', focal: '50% 50%' } as ImageSlot,

  /** Image de partage (Open Graph), 1200×630 conseillé. null = image de partage par défaut du site. */
  og: { src: null, altKey: 'images.og', focal: '50% 50%' } as ImageSlot,

  /** Galerie : l'ordre ici = l'ordre d'affichage. Les 6 premières alimentent l'aperçu de l'accueil. */
  gallery: [
    { src: null, altKey: 'images.gallery.g01', focal: '50% 50%' },
    { src: null, altKey: 'images.gallery.g02', focal: '50% 50%' },
    { src: null, altKey: 'images.gallery.g03', focal: '50% 50%' },
    { src: null, altKey: 'images.gallery.g04', focal: '50% 50%' },
    { src: null, altKey: 'images.gallery.g05', focal: '50% 50%' },
    { src: null, altKey: 'images.gallery.g06', focal: '50% 50%' },
    { src: null, altKey: 'images.gallery.g07', focal: '50% 50%' },
    { src: null, altKey: 'images.gallery.g08', focal: '50% 50%' },
  ] as ImageSlot[],
};
