#!/usr/bin/env bash
# Frames + audio -> masters. Run after render.mjs (both aspects) and audio.py.
set -euo pipefail
cd "$(dirname "$0")/../out"

# --- audio: two-pass loudnorm to -14 LUFS / -1 dBTP (no limiter on the voice) --
M=$(ffmpeg -hide_banner -i mix_raw.wav -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
g() { echo "$M" | grep "$1" | cut -d'"' -f4; }
ffmpeg -y -loglevel error -i mix_raw.wav -af \
  "loudnorm=I=-14:TP=-1:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):linear=true" \
  -ar 48000 -c:a pcm_s16le mix_master.wav

enc() { # enc <frames dir> <output>
  ffmpeg -y -loglevel error -framerate 60 -i "$1/f%05d.jpg" -i mix_master.wav \
    -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
    -movflags +faststart -c:a aac -b:a 320k -shortest "$2"
  echo "-> $2"
}

enc frames_16x9 KhdemliDaba_ConceptA_darija_16x9_60fps.mp4
enc frames_9x16 KhdemliDaba_ConceptA_darija_9x16_60fps.mp4

# --- 6 s social cut: scarcity -> price -> mark (frames 744..1104) --------------
ffmpeg -y -loglevel error -framerate 60 -start_number 744 -i frames_16x9/f%05d.jpg \
  -ss 12.4 -i mix_master.wav -frames:v 360 \
  -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 320k -shortest KhdemliDaba_ConceptA_darija_16x9_6s_cut.mp4
echo "-> 6 s cut"

# --- feed still 1080x1350 from the price beat --------------------------------
ffmpeg -y -loglevel error -i frames_9x16/f00960.jpg -vf "crop=1080:1350:0:285" -q:v 2 \
  still_price_1080x1350.jpg
echo "-> still"

# --- contact sheet -----------------------------------------------------------
ffmpeg -y -loglevel error -i KhdemliDaba_ConceptA_darija_16x9_60fps.mp4 \
  -vf "select='eq(n\,54)+eq(n\,126)+eq(n\,174)+eq(n\,246)+eq(n\,294)+eq(n\,420)+eq(n\,474)+eq(n\,570)+eq(n\,660)+eq(n\,714)+eq(n\,828)+eq(n\,930)+eq(n\,990)+eq(n\,1044)+eq(n\,1110)+eq(n\,1170)',scale=600:-1,tile=4x4:margin=10:padding=8:color=#0b0906" \
  -frames:v 1 -q:v 3 contact_sheet_16x9.jpg
echo "-> contact sheet"
