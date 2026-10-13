# KhdemliDaba — Spot para clientes «كاين» · darija — PREVIEW v1

Objetivo: **clics y llamadas de clientes** hacia los 1 213 perfiles publicados.
24,0 s (22,0 s + end card), 60 fps, 9:16 (principal) y 16:9. Todo en código, reproducible.

## Idea

Cuatro preguntas que un marroquí se hace de verdad, en darija, respondidas con un
sello naranja **«كاين»** (*hay*) y una tarjeta crema con el botón de WhatsApp pulsado.
Perfiles novedosos a propósito: nettoyage Airbnb/riads, livreur en moto, enfermera
a domicilio, traiteur de bodas, hijama a domicilio, técnico de clim. Cierre con las
cifras reales (1 213 profesionales · 57 ciudades · 100 % gratis para el cliente),
los tres pasos dentro de un móvil y el claim **«اللي بغيتي، كاين.»**

## Entregables (`out/`)

| Archivo | Qué es |
|---|---|
| `KhdemliDaba_Kayn_clients_darija_9x16_60fps.mp4` | Máster vertical 1080×1920 — Reels / TikTok / Status |
| `KhdemliDaba_Kayn_clients_darija_16x9_60fps.mp4` | Máster 1920×1080 |
| `KhdemliDaba_Kayn_clients_darija_9x16_8s_cut.mp4` | Corte de 8 s: cifras → pasos → marca |
| `still_hook_1080x1350.jpg` | Still de feed con la pregunta gancho |
| `contact_sheet_9x16.jpg` | 16 fotogramas clave |
| `mix_master.wav`, `stems/music.wav`, `stems/sfx.wav` | Mezcla a −14 LUFS / −1 dBTP y stems |

## Guion de voz (darija) — listo para ElevenLabs

Huecos reservados en el montaje (la música baja sola en ellos):

| t (s) | Línea |
|---|---|
| 0,0–1,4 | شكون غادي ينقي الأبارتمون قبل ما يوصل الضيف؟ |
| 1,0 | **كاينة.** |
| 3,2–4,4 | خاصك ليفرور دابا، فكازا؟ |
| 4,2 | **كاين.** |
| 6,0–7,2 | الوالدة خاصها فرملية تجي للدار؟ |
| 7,0 | **كاينة.** |
| 8,8–10,0 | عرس؟ كليماتيزور طايح؟ حجامة فالدار؟ |
| 10,9 | **كاينين.** |
| 12,4–13,2 | ألف ومائتين محترف، فسبعة وخمسين مدينة. مجانا للزبون. |
| 15,6–16,6 | دخل لخدملي دابا، اختار، وصيفط واتساب. |
| 19,7–21,0 | خدملي دابا. اللي بغيتي، كاين. |

Ajustes ElevenLabs: `eleven_multilingual_v2`, 2 tomas en una llamada, respelling
«Kdem-lee DA-ba». Estimación: ~330 caracteres × 2 tomas × 2 voces ≈ 1 300 créditos.
Cuando esté la voz: re-temporizar la imagen a la voz y bajar la música −15 dB bajo
cada frase (los stems lo permiten sin re-render).

## Por qué no hay voz todavía

Esta sesión corre en la nube: no hay clave de ElevenLabs en el entorno, el host
`api.elevenlabs.io` (y `elevenlabs.io`) no es alcanzable por el proxy de red, y no
hay puente de navegador (Claude in Chrome) en una sesión cloud. Dos caminos:
1. Guardar `ELEVENLABS_API_KEY` como *Network secret* del entorno y permitir
   `api.elevenlabs.io` → la voz se genera desde aquí, por API.
2. Abrir la sesión desde la app de escritorio con Claude in Chrome enlazado →
   se genera desde tu pestaña de ElevenLabs ya logueada.

## Datos usados (reales, BD de producción 2026-10-13)

1 213 perfiles publicados · 57 ciudades con perfiles · 1 181 con WhatsApp · 930 verificados.
Por categoría: infirmier 354 · livreur 42 · femme de ménage 19 · climatisation 9;
hijama a domicilio en Nador y traiteur de bodas existen en el directorio.
Las tarjetas son **roles**, no personas: no se inventa ningún nombre ni valoración.

## Reconstrucción

```bash
cd build
node render.mjs --w 1080 --h 1920 --out ../out/frames_9x16 --fps 60
node render.mjs --w 1920 --h 1080 --out ../out/frames_16x9 --fps 60
python3 audio.py && bash encode.sh
```
