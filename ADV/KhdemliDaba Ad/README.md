# KhdemliDaba — Spec ad · Concepto A «Daba» · darija — PREVIEW v1

Pieza de 20,0 s (18,0 s de anuncio + 2,0 s de end card), 60 fps, 16:9 y 9:16.
Todo generado en código y reproducible: misma orden → mismo fotograma, mismo sample.

## Entregables (`out/`)

| Archivo | Qué es |
|---|---|
| `KhdemliDaba_ConceptA_darija_16x9_60fps.mp4` | Máster 1920×1080, 60 fps, H.264, audio AAC 320k |
| `KhdemliDaba_ConceptA_darija_9x16_60fps.mp4` | Vertical 1080×1920 para Reels / TikTok / Status |
| `KhdemliDaba_ConceptA_darija_16x9_6s_cut.mp4` | Corte corto (escasez + precio + marca) para pre-roll |
| `contact_sheet_16x9.jpg` | Hoja de contacto, 16 fotogramas clave |
| `still_price_1080x1350.jpg` | Still de feed/carrusel con «50 درهم فالشهر» |
| `mix_master.wav` | Mezcla masterizada a **−13,9 LUFS / −1,0 dBTP** |
| `stems/music.wav`, `stems/sfx.wav` | Stems separados para re-mezclar cuando llegue la voz |

## Cómo se reconstruye

```bash
cd build
node render.mjs --w 1920 --h 1080 --out ../out/frames_16x9 --fps 60   # ~4 min
node render.mjs --w 1080 --h 1920 --out ../out/frames_9x16 --fps 60   # ~4 min
python3 audio.py                                                      # música + SFX
```
`build/scene.html` es la animación entera: una función `setTime(segundos)` pinta
un fotograma exacto, así que el render es determinista y se puede retomar por
tramos. `build/encode.sh` reúne frames + audio y masteriza.

Para verla animada en un navegador: `build/scene.html?play=1`.

## Lo que está hecho

- **Imagen completa**, los 10 beats del brief, con la paleta y las tipografías
  reales de la marca (Tajawal + Inter, los mismos ficheros que sirve tu web).
- **Motion**: blur direccional real por SVG en los movimientos rápidos, overshoot
  en cada aterrizaje, glow naranja a la deriva, capa de retícula + scanlines +
  grano, marcas de esquina, regla de progreso. Ninguna animación repetida del
  anuncio anterior.
- **Música original en código**: Fa menor con subida a Reb mayor en la escasez y
  resolución a Fa mayor add9 que queda sonando bajo la end card; pulso de corcheas
  a 120 BPM que entra con el plano del país; sub en cada aterrizaje; ducking tipo
  sidechain (sin limitador) en los golpes.
- **Diseño de sonido denso**: whoosh en cada entrada, golpe en cada aterrizaje,
  tick por letra tecleada, 3 pings de mensaje, shimmer del badge, swipes en los
  tachados, acorde + whoosh del logo.
- **Master a −14 LUFS / −1 dBTP**, verificado con EBU R128.
- **End card** «made by / riccardo bosso», 2 s, con el último acorde por debajo.

## Lo que falta y por qué (honesto)

1. **Voz**: no hay VO. Esta sesión corre en un contenedor Linux en la nube sin
   acceso a ElevenLabs. El montaje ya reserva los huecos de las 6 frases del
   guion darija y la música está arreglada para dejarlos libres: cuando generes
   la voz, se re-temporiza la imagen a la voz (no al revés) y la música baja
   −15 dB mientras se habla. Estimación: ~300 caracteres × 2 tomas × 3 voces
   ≈ 1 800–2 000 créditos.
2. **SFX**: tu librería `/Volumes/Extreme Pro/EDITING PACK/FOUR Editors Sound
   Effects` no está en esta máquina. Los efectos actuales están **sintetizados en
   código**, son originales y libres de derechos, y están colocados y ecualizados
   en el sitio exacto. Sustituirlos por los de tu librería es cambiar los ficheros
   manteniendo los mismos tiempos: están listados en `build/audio.py`.
3. **Fotos**: ninguna descarga de stock (no las aprobaste). Resuelto por diseño:
   la tarjeta es **«الملف ديالك» — tu propio perfil**, con monograma de marca.
   No inventa ninguna persona, no usa ilustración, y además es mejor publicidad:
   el pro se ve a sí mismo en el primer puesto. Si me das 3–4 avatares de pros
   tuyos con permiso, los monto en los perfiles del fondo.
4. **Resolve**: no instalable aquí. El proyecto editable se hace en tu Mac cuando
   lo pidas (recuerda poner la reproducción a 60 fps).

## Datos de marca usados (verificados el 2026-10-02)

Naranja `#E8590C` · profundo `#C1410C` · oscuro `#15110D` · papel `#F6F0E6` ·
línea `#2A231C` · WhatsApp `#25D366`. Tipos: Tajawal 400/700/800 (árabe),
Inter 700/800 (latino). Wordmark `khdemli` + `daba`. URL `khdemlidaba.ma`.
Cifra en pantalla: **1 345 contactos** (tabla `contact_events`, real).
Oferta en pantalla: **50 DH / 30 días, 3 plazas por ciudad** (`promo_settings`).

## Guion en pantalla (darija)

| Beat | En pantalla |
|---|---|
| 1–2 | `قلّب على محترف…` → `كهربائي` · `الدار البيضاء` |
| 3 | ciudades + `1 345` · `اتصال واصل لمحترفين` |
| 4–5 | `الملف ديالك` · `كهربائي · الدار البيضاء` · `في الواجهة` · `#1` · `واتساب` |
| 6 | `السلام، واش كاين شي حد دابا؟` · `بشحال الخدمة؟` · `عطيني العنوان، جاي دابا` |
| 7 | `غير 3 بلايص ف كل مدينة` · `ديالك` |
| 8 | `50 درهم` · `فالشهر` · `بلا أي التزام · تقدر توقف فأي وقت` |
| 9 | `khdemli daba` · `khdemlidaba.ma` |

> Antes de publicar: que un hablante nativo revise las tres burbujas de WhatsApp
> y la línea `قلّب على محترف`. Son creíbles, pero el darija escrito admite varias
> grafías y aquí tu oído manda sobre el mío.

## Siguiente paso sugerido

Dime qué cambias de la PREVIEW v1 y lo ajusto. En cuanto esté aprobada, en tu
Mac: voz → re-timing → SFX de tu librería → finales. Y con el mismo `scene.html`
salen gratis los **6 cortes por ciudad** (se cambia una sola píldora de texto:
Casablanca → Marrakech, Nador, Rabat, Agadir, Tánger) para segmentar las campañas.
