# Aqua Asia — Nador · site vitrine

Site statique multilingue (fr · en · nl · de · ar) du restaurant **Aqua Asia** (cuisine fusion asiatique, Nador).
Réalisé par **BayenDaba**. Construit avec [Astro](https://astro.build) (sortie 100 % statique), CSS simple à base de
variables, très peu de JavaScript.

> Guide simplifié en espagnol pour le client : [`GUIDE_ES.md`](./GUIDE_ES.md).

---

## 1. Démarrer

Prérequis : **Node.js ≥ 22.12** (npm inclus).

```bash
npm install          # une seule fois
npm run dev          # développement : http://localhost:4321
npm run build        # génère le site final dans dist/
npm run preview      # sert dist/ localement pour vérifier
npm run check:i18n   # vérifie que les 5 fichiers de traduction ont exactement les mêmes clés
npm run check:css    # vérifie le CSS compilé (aucun sélecteur RTL / arabe « mort » ou fragile)
npm run check        # build + vérifications i18n et CSS (à lancer avant toute livraison)
```

Le dossier `dist/` se dépose tel quel sur n'importe quel hébergement statique (Netlify, Vercel, Cloudflare Pages,
OVH, serveur Apache/Nginx…). La page `404.html` est générée à la racine.

## 2. Où se trouve quoi

```
aqua-asia-nador/
├─ astro.config.ts            configuration + rapport des données non confirmées au build
├─ public/                    fichiers servis tels quels (favicon, image de partage og-image.jpg)
├─ scripts/check-i18n.mjs     contrôle de parité des traductions
├─ scripts/check-css.mjs      contrôle du CSS compilé ([dir=rtl] et :lang(ar) dans les composants : écrire :global(…))
└─ src/
   ├─ config/site.ts          DONNÉES de l'établissement (+ confirmed/source), mode preview/launch, domaine, crédit
   ├─ config/images.ts        emplacements photo/vidéo (hero, intro, galerie, partage)
   ├─ content/menu.ts         LA CARTE (vide pour l'instant)
   ├─ i18n/{fr,en,nl,de,ar}.json   TOUS les textes publics (y compris alt, aria, SEO, 404)
   ├─ i18n/routes.ts          langues + adresses localisées (/carte, /en/menu, /nl/menukaart…)
   ├─ assets/photos/          déposer ici les photos originales
   ├─ components/             en-tête, menu mobile, hero, sections, pied de page…
   ├─ views/                  contenu de chaque page (accueil, carte, galerie, contact)
   ├─ layouts/BaseLayout.astro  <head> SEO, polices, structure commune
   ├─ pages/[...path].astro   génère les 20 pages (5 langues × 4 pages) depuis routes.ts
   ├─ pages/404.astro, robots.txt.ts, [file].xml.ts (sitemap : seulement en launch avec domaine connu)
   ├─ scripts/main.ts         le seul JS : en-tête, menu, langues, apparitions, barre mobile
   └─ styles/                 tokens.css (couleurs, typo, espacements), base.css, fonts.css
```

## 3. Données et mode « preview » / « launch »

Toutes les informations pratiques sont dans `src/config/site.ts`. Chaque champ porte :

- `value` — la valeur ;
- `confirmed` — `true` **seulement** quand le propriétaire l'a validée ;
- `source` — d'où vient l'info (jamais affiché sur le site).

État actuel :

| Champ | Valeur | Source | Statut |
|---|---|---|---|
| Nom | Aqua Asia | Instagram | confirmé |
| Instagram | @aqua.asia.nador | compte existant | confirmé |
| Quartier | Hay Al Matar | bio Instagram | **non confirmé** |
| Adresse | Bd Grand Rif, 62000 Nador | fiche Google | **non confirmé** |
| Itinéraire | lien de la fiche Google | fiche Google | **non confirmé** |
| Téléphone | +212 6 37 43 61 40 | Google (client) | **non confirmé** — pas un WhatsApp |
| Horaires | tous les jours 18:00–01:00 | Instagram (Google : fermeture 00:00) | **non confirmé, conflit** |
| Services | salon privé, plats végans | attributs Google | **non confirmé, `show: false`** (jamais affiché) |

`mode: 'preview'` (actuel) : les valeurs non confirmées s'affichent normalement pour que le propriétaire voie le
vrai rendu ; toutes les pages ont `noindex, nofollow`. `robots.txt` laisse volontairement les robots lire les pages
(sinon ils ne verraient jamais ce `noindex` et pourraient indexer l'adresse nue d'un lien partagé) ; si l'hébergement
le permet, ajouter aussi l'en-tête HTTP `X-Robots-Tag: noindex` sur l'adresse de prévisualisation. Pas de sitemap.

`mode: 'launch'` : toute valeur non confirmée est **masquée**, ainsi que ce qui en dépend ; le `noindex` disparaît.
Le build affiche alors dans le terminal la liste de ce qui reste à confirmer. Aucune note interne n'est jamais affichée
sur le site. Concrètement, tant que le **téléphone** n'est pas confirmé : aucun bouton « Réserver » (en-tête, hero, menu
mobile — il n'existe pas d'autre moyen réel de réserver), le hero garde « Découvrir la carte » comme action principale,
et la page contact s'intitule « Contact » sans jamais parler de réservation (titre, accroche, SEO : clés `*NoPhone`).
Sans **adresse, horaires ni téléphone** confirmés, la section « Nous rendre visite » n'est pas affichée du tout, et
aucun JSON-LD `Restaurant` n'est émis (Google exige une adresse).

Pour confirmer une donnée : corriger `value` si besoin, puis passer `confirmed: true`.
Le quartier (`district`) n'est **affiché nulle part** pour l'instant : la correspondance Bd Grand Rif / Hay Al Matar
n'est pas vérifiée. Le panneau décoratif de « Nous rendre visite » ne montre que le nom de la ville (`visit.city`,
traduit : « Nador », « الناظور »…), qui sert aussi dans la ligne « code postal + ville » de l'adresse (`visit.postalLine`).

## 4. Langues

- Français à la racine `/`, puis `/en/`, `/nl/`, `/de/`, `/ar/` (arabe en `dir="rtl"`).
- Adresses localisées dans `src/i18n/routes.ts` (une seule table).
- Le sélecteur garde la page équivalente **et** la section que le visiteur est en train de regarder (`#visit`…,
  calculée au moment du clic), mémorise le choix (localStorage) et, à l'arrivée sur le site (pas de référent interne,
  navigation « fraîche » : jamais sur Précédent/Suivant ni rechargement), redirige vers la langue mémorisée en gardant
  la chaîne de requête (`?utm…`). Sans choix mémorisé, `/` reste en français.
- **Traduire** : les 5 langues sont traduites. Pour modifier un texte : `src/i18n/<langue>.json`. Garder exactement
  les mêmes clés et les mêmes `{variables}` ; `npm run check:i18n` échoue sinon, et liste aussi le nombre de valeurs
  identiques au français (normal pour « Instagram », « Contact », « Nador »…).
- Arabe : une seule forme d'adresse, le pluriel de politesse (« احجزوا », « تابعونا »…), boutons compris.
- Carte : un plat sans traduction s'affiche en français, balisé `lang="fr"` (bonne prononciation, ponctuation correcte
  en arabe) ; le build liste les textes de la carte qui n'ont pas encore de traduction.
- Arabe : polices IBM Plex Sans Arabic (texte) et Noto Kufi Arabic (titres) ; les mots latins, chiffres, noms de
  marque, téléphones, heures et prix restent en Manrope et isolés en LTR (`<bdi dir="ltr">`).

## 5. Photos et vidéo

Aucune photo n'est fournie pour l'instant : le site affiche des visuels d'attente dessinés (dégradés expresso,
motif de vagues seigaiha, soleil sur les vagues). Jamais de photo de banque d'images ni d'un autre restaurant.

1. Déposer l'original (JPG/PNG/WebP, ~2400 px de large) dans `src/assets/photos/`, ex. `salle-01.jpg`.
2. Dans `src/config/images.ts`, mettre `src: 'salle-01.jpg'` sur l'emplacement voulu (`hero`, `intro`, `gallery[…]`, `og`).
3. Écrire le texte alternatif dans les 5 fichiers `src/i18n/*.json` (clés `images.*`).

Astro produit automatiquement AVIF/WebP, plusieurs tailles et le chargement différé (sauf le hero).
Dès qu'au moins une photo de galerie existe, la galerie n'affiche que les vraies photos et la visionneuse s'active.

**Vidéo du hero** : `public/video/hero.mp4`, puis dans `images.ts` : `type: 'video'`, `video: { mp4: '/video/hero.mp4' }`
et une image `src` (version optimisée affichée derrière la vidéo). La vidéo n'est **téléchargée** que si le visiteur
n'a pas demandé moins d'animations et n'est pas en mode économie de données ; sinon seule l'image fixe s'affiche.

## 6. Ajouter la carte

Remplir `src/content/menu.ts` (rien d'autre à toucher). Tant que `categories` est vide, le site affiche « La carte en
ligne arrive bientôt » avec les liens Instagram et téléphone. Exemple **entièrement fictif**, à ne pas copier tel quel :

```ts
// src/content/menu.ts — EXEMPLE FICTIF (noms, prix, allergènes inventés pour l'illustration)
export const menu: Menu = {
  currency: 'MAD',
  categories: [
    {
      id: 'entrees',                                  // ancre #cat-entrees, identique dans toutes les langues
      name: { fr: 'Entrées', en: 'Starters', ar: 'مقبلات' },
      items: [
        {
          id: 'exemple-1',
          name: { fr: 'Plat exemple' },               // seul le français est obligatoire
          description: { fr: 'Description fournie par le restaurant.' },
          price: 95,                                  // nombre en dirhams → « 95 MAD » / « 95 درهم »
          tags: ['vegetarian', 'spicy1'],             // uniquement ce que le propriétaire indique
          allergens: ['soy', 'sesame'],               // idem (liste des 14 allergènes)
          available: true,                            // false = « Momentanément indisponible »
          photo: null,                                // ou 'plat-exemple.jpg' (dans src/assets/photos/)
        },
      ],
    },
  ],
};
```

Étiquettes possibles : `vegetarian`, `vegan`, `spicy1`, `spicy2`, `spicy3`, `containsNuts`, `glutenFree`.
Allergènes : `gluten`, `crustaceans`, `eggs`, `fish`, `peanuts`, `soy`, `milk`, `nuts`, `celery`, `mustard`, `sesame`,
`sulphites`, `lupin`, `molluscs`. Leurs libellés traduits sont dans `menu.tags.*` / `menu.allergens.*`.

## 7. Domaine, SEO, crédit

- **Domaine** : `siteUrl` dans `site.ts` (ex. `'https://www.exemple.ma'`, sans `/` final). Tant qu'il vaut `null` :
  pas de canonical, pas de hreflang, pas d'`og:url`/`og:image` absolus, pas de `sitemap.xml`. Une fois renseigné, tout
  est généré automatiquement (hreflang + `x-default`, sitemap avec alternates).
- Titres et descriptions par langue : `seo.*` dans les fichiers i18n. JSON-LD `Restaurant` sur l'accueil et le contact,
  seulement si l'adresse est affichable (en launch : uniquement les champs confirmés).
- **Crédit** : « Réalisé par BayenDaba » (traduit) est toujours le dernier élément de la page. Pour en faire un lien :
  `credit.url` dans `site.ts`.

## 8. Identité visuelle et référence

- Le client a demandé un rendu proche de https://www.aquaasiaclub.nl/ (Rotterdam). Ce site n'est pas accessible depuis
  notre environnement : **une seule capture du hero (desktop)** a pu être étudiée. L'en-tête, le hero (photo sous voile
  sombre, mot-symbole blanc géant avec emblème or au centre, signature or très espacée, pilule ambre « Réserver »,
  filet ambre sous l'élément actif) en reprennent les proportions mesurées. Tout le reste (sections, pied de page, en-tête
  au défilement, mobile, pages intérieures, animations) a été dessiné dans le même langage **sans prétendre copier la
  référence**. Aucune photo, aucun texte, logo ou code de la référence n'est utilisé.
- **Emblème provisoire** : `src/components/Emblem.astro` dessine un ornement (soleil en arche sur des vagues) inspiré du
  logo de Nador ; ce n'est pas le logo officiel. Fournir les fichiers officiels puis renseigner `brand.logoSrc` et
  `brand.emblemSrc` dans `site.ts` (fichiers dans `public/brand/`).
- **Quand le logo officiel arrive, remplacer aussi deux fichiers fixes** qui contiennent l'ornement provisoire :
  `public/favicon.svg` (icône d'onglet) et `public/og-image.jpg` (image de partage 1200×630, sans aucun texte de
  langue : mot-symbole + emblème seulement). Pour l'image de partage, on peut aussi indiquer une vraie photo dans
  `images.ts` → `og.src` : elle est alors recadrée automatiquement en 1200×630.
- Couleurs (tokens dans `src/styles/tokens.css`) : surfaces expresso/brun Nador, ivoire, or `#C9A24A`, ambre `#E4A154`.
  **Contraste** : blanc sur ambre = 2,2:1 (insuffisant). On garde l'ambre exact de la référence et on écrit en
  expresso `#1A120E` (8,4:1, AA/AAA).
- Polices auto-hébergées (@fontsource) : Manrope (interface), Arimo (mot-symbole, titres de page ; sous-ensemble latin
  seul), IBM Plex Sans Arabic 400/600 et Noto Kufi Arabic (arabe ; téléchargées seulement sur les pages arabes).

## 9. Accessibilité et qualité

Lien d'évitement, repères (header/nav/main/footer), un seul `h1` par page, focus visible, cibles ≥ 44 px, contraste AA,
menu mobile au clavier (piège du focus, Échap, défilement bloqué), `prefers-reduced-motion` respecté (aucune animation,
pas de vidéo), `lang` sur chaque nom de langue, propriétés CSS logiques pour le RTL. Contrôlé sans débordement horizontal
à 360, 390, 768, 1024, 1280, 1440 et 1920 px dans les 5 langues (à refaire une fois les traductions définitives en place).

Ce projet a ses propres outils : il est exclu du lint de l'application racine (`eslint.config.js` à la racine du dépôt).
