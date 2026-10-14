# Aqua Asia Nador — Guía rápida (español)

Sitio web del restaurante **Aqua Asia** en 5 idiomas (francés, inglés, neerlandés, alemán y árabe).
Hecho por **BayenDaba**. Esta guía explica lo esencial sin tecnicismos.

---

## 1. Ver el sitio en tu ordenador

Necesitas **Node.js 22.12 o superior** (https://nodejs.org).

```bash
npm install        # solo la primera vez
npm run dev        # abre http://localhost:4321 y verás el sitio
npm run build      # crea la versión final en la carpeta dist/
npm run check      # comprueba que todo está bien antes de publicar
```

Para publicar, se sube la carpeta **`dist/`** a cualquier alojamiento web estático.

## 2. Cambiar las fotos

Ahora el sitio muestra fondos decorativos (no hay fotos todavía). Para poner fotos reales del restaurante:

1. Copia la foto original (JPG, lo más grande posible) en `src/assets/photos/`, por ejemplo `sala-01.jpg`.
2. Abre `src/config/images.ts` y escribe el nombre en el lugar deseado: `src: 'sala-01.jpg'`
   (`hero` = foto grande de inicio, `intro` = foto en arco, `gallery` = galería, `og` = foto para compartir en redes).
3. Escribe una descripción corta de la foto en los 5 archivos de idiomas `src/i18n/*.json` (sección `images`).

El sitio prepara solo las versiones ligeras para móvil. Nunca usar fotos de internet ni del restaurante de Rotterdam.

**Vídeo en la portada**: copiar `hero.mp4` en `public/video/` y en `images.ts` poner `type: 'video'` y
`video: { mp4: '/video/hero.mp4' }` (más una foto en `src` que sirve de imagen fija).

## 3. Datos del restaurante (teléfono, horario, dirección)

Todo está en **`src/config/site.ts`**. Cada dato tiene:

- `value`: el dato;
- `confirmed`: poner **`true`** solo cuando el dueño lo haya confirmado;
- `source`: de dónde viene (no se muestra en la web).

Pendiente de confirmar por el dueño:

- **Teléfono** +212 6 37 43 61 40 (¿es el bueno? no se usa como WhatsApp).
- **Horario**: Instagram dice todos los días 18:00–01:00, Google dice cierre a las 00:00. ¿Cuál es el correcto?
- **Dirección**: Bd Grand Rif, 62000 Nador (Google) y el barrio Hay Al Matar (Instagram).
- **Enlace «Itinerario»** (ficha de Google Maps).
- **Servicios** (salón privado, platos veganos): están ocultos hasta que el dueño los confirme.

## 4. Modo «preview» y modo «launch»

En `src/config/site.ts`, la línea `mode`:

- **`'preview'`** (ahora): se ve todo, incluso los datos sin confirmar, para enseñárselo al dueño. Google no indexa el sitio.
- **`'launch'`** (publicación): los datos sin confirmar **se ocultan** automáticamente y Google puede indexar el sitio.
  Al ejecutar `npm run build`, la terminal muestra la lista de lo que falta por confirmar.
  Mientras el **teléfono** no esté confirmado no aparece ningún botón «Reservar» (no hay otra forma real de reservar)
  y la página de contacto se llama solo «Contacto». Sin dirección, horario ni teléfono confirmados, la sección
  «Visítanos» desaparece.

## 5. La carta (menú)

La carta todavía no existe en la web: se muestra «La carta online llegará pronto» con enlaces a Instagram y teléfono.
Cuando el dueño envíe la carta, solo hay que rellenar **`src/content/menu.ts`** (categorías, platos, precio en dirhams,
etiquetas y alérgenos que indique el dueño). El `README.md` tiene un ejemplo inventado para ver el formato.
Nunca inventar platos, precios ni alérgenos.

## 6. Textos y traducciones

Todos los textos están en `src/i18n/` (un archivo por idioma). Los cinco idiomas ya están traducidos. Para cambiar un
texto, editar el archivo del idioma y después ejecutar `npm run check:i18n`: comprueba que no falta nada y muestra
cuántos textos son iguales al francés (normal para «Instagram», «Contact», «Nador»…).

## 7. Crédito «Hecho por BayenDaba»

Aparece al final de todas las páginas, traducido. Para convertirlo en enlace: en `site.ts`, `credit.url: 'https://…'`.

## 8. Dominio

Cuando se conozca el dominio, escribirlo en `site.ts` → `siteUrl: 'https://www.ejemplo.ma'` (sin `/` al final).
Así se activan automáticamente el mapa del sitio (sitemap), las URL canónicas y los enlaces entre idiomas para Google.

## 9. Logotipo oficial

El círculo dorado con el sol y las olas es un **adorno provisional**, no el logotipo oficial. Cuando el dueño envíe los
archivos del logo (mejor en SVG), copiarlos en `public/brand/` e indicar sus rutas en `site.ts` → `brand.logoSrc`
y `brand.emblemSrc`.

Ese día hay que reemplazar también dos archivos fijos que llevan el adorno provisional: `public/favicon.svg` (icono de
la pestaña) y `public/og-image.jpg` (imagen que aparece al compartir un enlace, 1200×630, sin texto de idioma). Otra
opción para la imagen de compartir: poner una foto real en `src/config/images.ts` → `og.src`.
