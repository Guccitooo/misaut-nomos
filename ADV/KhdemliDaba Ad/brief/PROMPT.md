# KhdemliDaba — Spec Ad · BRIEF v1

**Estado: esperando tu OK. No se ha construido nada, no se han gastado créditos.**
Fecha: 2026-10-02 · Duración objetivo: 18,0 s + end card ~2 s · 60 fps · 16:9 + 9:16

---

## 0. Datos de marca verificados (hoy, no inventados)

Fuente: HTML de producción (`khdemlidaba.vercel.app` / `khdemlidaba.ma`) + base de datos KhdemliDaba (Supabase `eiacoozyubxkbjwhgkml`), consultados el 2026-10-02.

| Dato | Valor real |
|---|---|
| Marca | **KhdemliDaba** — wordmark en minúsculas `khdemli` + `daba` |
| Dominio canónico | khdemlidaba.ma (también .com, khdmli.ma) |
| App iOS | App Store id `6800660020` |
| Claim FR | *Trouvez un professionnel de confiance au Maroc* |
| Subclaim | Profils et avis, contact **WhatsApp direct**. Gratuit. |
| Idiomas | FR (default) + AR (`/ar`) |
| Naranja marca | `#E8590C` (theme-color) |
| Naranja profundo | `#C1410C` (la sílaba “daba” del wordmark) |
| Crema / fondo claro | `#FCFAF7` · borde `#EFE7DC` |
| Tinta | `#141210` · muted `#7A6F63` |
| Oscuro marca | `#15110D` · texto `#F6F0E6` |
| Tipografías | **Inter** (latin) + **Tajawal** (árabe), self-hosted |
| Logo | `https://khdemlidaba.ma/logo.svg` + favicon.svg + apple-touch-icon |

**Cifras reales utilizables en pantalla** (BD, 2026-10-02):
1 396 perfiles de profesionales · 1 792 usuarios · 118 oficios · 70 ciudades · 1 345 contactos generados · 52 reseñas.
Top ciudades: Casablanca 244 · Marrakech 126 · Nador 86 · Rabat 77 · Agadir 60 · Tánger 54.
Top oficios: infirmier 310 · pâtissier 51 · chauffeur 42 · aide-soignant 38 · électricien 34 · livreur 33.

**Oferta monetizable real** (tabla `promo_settings`):
- **En vedette** — 50 DH / 30 días, **solo 3 plazas por ciudad**.
- **Promo Instagram** — 150 DH, presupuesto ads 100 DH, alcance objetivo ~10 000, 10 plazas/semana, 1–2 días de plazo.
- **Annonce emploi** — 200 DH, presupuesto ads 150 DH.

> Decisión de negocio detrás del anuncio: tu objetivo es **suscripciones**, así que el héroe del spot es el **pro que paga**, no el cliente que busca gratis. El gancho de conversión es la escasez que ya existe en producto: *3 plazas por ciudad, 50 DH al mes*.

---

## 1. Tres ideas (elige una; mi recomendación es la A)

**A. «Daba» — el momento exacto en que te encuentran.** ⭐ recomendada
La pantalla es la búsqueda de un marroquí cualquiera: `plombier · Casablanca`. El texto cinético teclea, filtra, y de la nada **una tarjeta de perfil sube al primer puesto** con el halo naranja de la marca. Entran pings de WhatsApp apilándose. Cierre: *3 plazas por ciudad. 50 DH al mes.* Es la promesa más vendible que tienes y la única que un pro entiende en 2 segundos: *tú arriba, el teléfono suena*.

**B. «Khdem li daba» — la revelación del nombre.** El wordmark se parte y la palabra `daba` (= *ahora*) se convierte en el motor del anuncio: cada cifra aterriza en un «ahora» (1 396 pros · 70 ciudades · 118 oficios). Muy bonito de animar, más branding que conversión.

**C. «El país que busca».** Marruecos dibujado con los nombres de las 70 ciudades en tipografía; las búsquedas se encienden ciudad a ciudad (Casa, Marrakech, Nador…) hasta cubrir el mapa. Épico, el más caro de animar, el mejor para notoriedad nacional (tu segundo objetivo) pero vende menos suscripción.

Si quieres las dos cosas: **A para pagar (Instagram/TikTok ads a pros) y C como pieza de marca** para portada, prensa y vallas. Puedo hacer C después reutilizando el motor tipográfico de A.

---

## 2. Concepto A — desarrollo

**Logline.** En Marruecos la gente ya no pregunta al vecino: busca. El anuncio muestra los 4 segundos en que una búsqueda encuentra a un pro, y pone precio a estar en esos 4 segundos.

**Tono.** Oscuro, limpio, Apple-like, con el naranja de la marca como única fuente de luz. Nada folclórico, nada de clichés de zoco: KhdemliDaba debe sentirse como una plataforma seria y nacional.

**Lenguaje visual.**
- Escenario oscuro `#15110D` con deriva lenta de glow naranja `#E8590C` (muy suave, 8 % opacidad, se mueve 1 px/frame).
- Tipografía cinética **Inter** pesos 800/700, tracking −2 %, motion blur fuerte en cada entrada.
- Capa de motion graphics por encima: retículas finas `#2A231C`, barridos de scanline, chips de ciudad/oficio como píldoras (el mismo lenguaje de píldora que ya usa tu propio HTML, así el anuncio y el producto son la misma cosa).
- Tarjetas de perfil reales (layout del producto: avatar, nombre, oficio, ciudad, estrellas, botón WhatsApp verde). **Fotos fotorrealistas de personas marroquíes trabajando** (ver §6: te pido permiso antes de descargar nada).
- El botón WhatsApp es el único color ajeno permitido (`#25D366`), y solo 1,5 s.

**Deviación que necesita tu OK (punto 1 de 2):** tus reglas fijas dicen SF Pro Display. Aquí propongo **Inter + Tajawal**, que son las tipografías reales de KhdemliDaba y además cubren el árabe para la versión darija. El acabado «familia Spotify/Shopify/Huel» se mantiene intacto. Si prefieres SF Pro, lo cambio, pero el anuncio dejará de parecerse al producto.

---

## 3. Beat sheet (16:9, 60 fps — se re-ajustará a la voz, no al contrario)

| # | t (s) | Imagen | Tipo / UI | Sonido |
|---|---|---|---|---|
| 1 | 0,0–1,4 | Negro marca. Cursor parpadea en un campo de búsqueda vacío que flota en el vacío. | `|` + placeholder tenue “Je cherche…” | whoosh de entrada + tecla seca |
| 2 | 1,4–3,6 | Se teclea en kinetic type, letra a letra con blur: **plombier** → píldora. Luego **Casablanca** → píldora. | 2 píldoras naranja borde `#C1410C` | tick por letra (bajo), hit al cerrar cada píldora |
| 3 | 3,6–5,4 | Tres chips de ciudad pasan a toda velocidad en profundidad (Nador, Marrakech, Rabat) — el país entero buscando. | contador fantasma “1 345 contactos” | riser corto + swoosh doppler |
| 4 | 5,4–8,0 | Rejilla de 6 tarjetas de perfil en gris, desenfocadas. **Una** se enfoca y **sube al puesto 1** con el halo naranja. | badge `EN VEDETTE` entra con snap | impacto grave + shimmer de badge |
| 5 | 8,0–10,2 | Primer plano de la tarjeta: avatar real, nombre, `Électricien · Casablanca`, ★ 4,8. El botón WhatsApp pulsa. | ★ cuenta de 0 a 4,8 | pulso de UI, 2 notas |
| 6 | 10,2–12,4 | Tres burbujas de WhatsApp caen apiladas (texto real corto y creíble en darija latina: “Salam, wach m3ak daba?”). | contador de mensajes 1→3 | 3 pings reales, cada uno más grave |
| 7 | 12,4–14,6 | Corte a tipografía pura: **3 plazas por ciudad.** El número 3 vive, los otros huecos se tachan. | números grandes 800 | hit metálico + tachado |
| 8 | 14,6–16,6 | **50 DH / mois** aterriza enorme, el `DH` en naranja profundo. Debajo, pequeño: *annulable, sans engagement*. | precio + microcopy | sub-bass landing |
| 9 | 16,6–18,0 | Wordmark `khdemli·daba` se compone desde las dos mitades + `khdemlidaba.ma` y badge App Store. | logo oficial SVG | acorde final + whoosh de logo |
| 10 | 18,0–20,0 | **End card animada «made by / riccardo bosso»** (Spotify end card v2), último acorde sonando por debajo. | — | cola de reverb |

Versión 9:16: mismos beats, tarjeta de perfil a pantalla completa en el beat 5, precio centrado, y el beat 3 pasa a scroll vertical de ciudades (más natural en móvil).

---

## 4. Guion

### 4.1 FR (versión principal — es el idioma por defecto del sitio)

> Au Maroc, personne ne demande plus au voisin. **On cherche.**
> Un plombier à Casa. Une infirmière à Nador. Maintenant.
> Et on trouve — sur KhdemliDaba.
> Ton métier, ta ville, ton WhatsApp.
> **Trois places par ville.** Cinquante dirhams par mois.
> KhdemliDaba. Khdem li daba.

(≈ 300 caracteres, 17,6 s a ritmo natural con las pausas marcadas. Cada frase es cerrada y clara: se entiende en el altavoz de un móvil.)

### 4.2 Darija / AR (versión 9:16 para alcance real en Marruecos)

> فالمغرب، حد ما بقى يسول الجار. **كاين البحث.**
> سباط فكازا. فرملية فالناظور. **دابا.**
> وكايلقاو — فخدملي دابا.
> الخدمة ديالك، المدينة ديالك، الواتساب ديالك.
> **ثلاث بلايص فكل مدينة.** خمسين درهم فالشهر.
> خدملي دابا.

Nota: la línea 2 debe revisarla un hablante nativo antes de generar voz — propongo sustituir «سباط» por el oficio que tú prefieras (plombier/ترّاح). **Dime si quieres que la versión darija sea la principal**: para pros de Nador, Casa y Marrakech probablemente convierta más que el francés.

### 4.3 Microcopy en pantalla (sin voz)
`plombier` · `Casablanca` · `EN VEDETTE` · `3 places / ville` · `50 DH / mois` · `sans engagement` · `khdemlidaba.ma`

---

## 5. Voz, música y sonido

**Voz (ElevenLabs).**
Tu lista estándar (Jessica / Lauren / Siren) es inglés-US; en francés con acento marroquí/francés suenan prestadas. Propongo escucharlo así, y decides tú:
1. Voz femenina francófona, cálida y baja — tono «plataforma de confianza».
2. Voz masculina francófona, joven, directa — tono «esto es para ti, pro».
3. **Jessica** en multilingüe, como control, para que compares con tu familia de anuncios anterior.

- Modelo `eleven_multilingual_v2`, 2 tomas por voz en **una sola llamada**.
- Respelling obligatorio: **KhdemliDaba → «Kdem-lee DA-ba»** (acento en DA). `Casa` → «Ka-za». `Nador` → «Na-DOR». `dirhams` → «dir-ham».
- **Estimación de créditos:** ~300 caracteres × 2 tomas × 3 voces ≈ **1 800–2 000 créditos** (1 crédito/carácter en multilingual v2). La versión darija añade ~1 200 más. No se gasta nada hasta tu «go».
- La imagen se re-temporiza a la voz final, no al revés.

**Música (original, hecha en código).**
Pad oscuro en Fa menor, pulso de 8ª nota filtrado que arranca en el beat 3, bajo sub que entra con el impacto del beat 4, y un acorde de resolución (Fa mayor add9) en el beat 9 que queda sonando bajo la end card. Arreglada alrededor de la voz: **−15 dB mínimo bajo la VO mientras habla**, sidechain suave en lugar de limitador, nada que apriete la voz.

**SFX.** Solo de tu librería `/Volumes/Extreme Pro/EDITING PACK/FOUR Editors Sound Effects`, copiados al proyecto al principio. Plan denso: whoosh en cada entrada de palabra/título (10), hit en cada aterrizaje (7), un sonido en cada movimiento de tarjeta (4), ping de WhatsApp ×3, shimmer del badge, acorde + whoosh del logo. Se colocan y se ecualizan (HPF 120 Hz en los whooshes, dip 2–4 kHz cuando coinciden con la voz); no se quitan.

**Master.** −14 LUFS / −1 dBTP, 16:9 y 9:16 por separado + stems (VO, música, SFX por categoría).

---

## 6. Lista de assets (nada se descarga sin tu OK — punto 2 de 2)

**Ya disponibles, oficiales, sin descargas de terceros:**
- `logo.svg`, `favicon.svg`, `apple-touch-icon.png`, `og-default.png` de khdemlidaba.ma.
- Badge App Store (Apple Marketing Resources, uso permitido con la app id 6800660020).
- Paleta y tipografías exactas (§0) — Inter y Tajawal son libres (OFL), ya auto-alojadas por ti.
- Capturas del producto real: las recreo vectorialmente a partir del layout de tu web, para que la tarjeta de perfil del anuncio sea idéntica a la real.

**Necesito tu permiso para descargar (3–5 fotos fotorrealistas, Unsplash/Pexels, licencia libre, registradas en `assets_in/CREDITS.md`):**
1. Electricista marroquí/norteafricano trabajando, luz natural.
2. Enfermera en uniforme, retrato cálido.
3. Fontanero con herramientas, manos en primer plano.
4. Mujer joven usando WhatsApp en la calle.
5. Vista urbana de Casablanca al atardecer (solo si hace falta en el beat 3).

Alternativa mejor y gratuita: **fotos reales de tus propios pros suscritos** (con su permiso escrito). Un anuncio con caras reales de tu directorio vende más y te da material para 10 posts. Si me das 3–4 avatares autorizados, los uso en lugar de stock.

---

## 7. Lo que necesito de ti para seguir

1. ¿Concepto **A**, B o C? (recomiendo A)
2. ¿Inter+Tajawal (marca) o SF Pro (tu regla fija)?
3. ¿Idioma principal: **FR** o **darija**? (y si hacemos las dos)
4. ¿Apruebas las descargas de §6, o me das fotos de tus pros?
5. ¿Qué voz escuchamos primero (1, 2, 3 o las tres)?
6. Confirmar que el gancho comercial es **Vedette 50 DH / 3 plazas**, y no Promo Instagram 150 DH.

Con tu «go» sigo el orden habitual: assets → opciones de voz → PREVIEW v1 16:9 + contact sheet → finales 16:9/9:16 + stems + README → Resolve solo si lo pides.

---

## 8. Nota honesta sobre la máquina

Este brief se ha escrito desde una sesión en la nube (Linux). Desde aquí **no** puedo: llamar a ElevenLabs, leer tu SSD con la librería de SFX, abrir DaVinci Resolve, ni escribir en `~/Desktop/ADV/`. Por eso el brief está en el repo (`ADV/KhdemliDaba Ad/brief/PROMPT.md`): descárgalo o haz `git pull` en el Mac y la construcción se ejecuta allí, donde están la voz, los SFX y Resolve. Todo lo verificable de marca (colores, tipos, logo, cifras, precios) ya está hecho y es real.

---

## 9. Extra de crecimiento (no pedido, pero es tu objetivo)

El mismo render da cuatro piezas sin trabajo adicional:
- **6 cortes de ciudad** (Casa, Marrakech, Nador, Rabat, Agadir, Tánger): se cambia una sola píldora de texto. Ideal para Instagram ads segmentadas por ciudad: el pro de Nador ve «Nador».
- **Un cut de 6 s** (beats 4, 7, 8) para Reels/TikTok y como pre-roll.
- **Un still 1080×1350** con el frame «3 places / ville — 50 DH» para carrusel y WhatsApp Status.
- **El beat 3** (el país buscando) suelto, en loop, como cabecera animada de la home.
