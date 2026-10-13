#!/usr/bin/env bash
# «كاين» client spot — frames + audio -> masters. Run after render.mjs (both aspects) and audio.py.
set -euo pipefail
cd "$(dirname "$0")/../out"

M=$(ffmpeg -hide_banner -i mix_raw.wav -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
g() { echo "$M" | grep "$1" | cut -d'"' -f4; }
ffmpeg -y -loglevel error -i mix_raw.wav -af \
  "loudnorm=I=-14:TP=-1:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):linear=true" \
  -ar 48000 -c:a pcm_s16le mix_master.wav

enc() {
  ffmpeg -y -loglevel error -framerate 60 -i "$1/f%05d.jpg" -i mix_master.wav \
    -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
    -movflags +faststart -c:a aac -b:a 320k -shortest "$2"
  echo "-> $2"
}
enc frames_9x16 KhdemliDaba_Kayn_clients_darija_9x16_60fps.mp4
enc frames_16x9 KhdemliDaba_Kayn_clients_darija_16x9_60fps.mp4

# 8 s cut for Status / pre-roll: numbers -> steps -> mark (14.0 s .. 22.0 s)
ffmpeg -y -loglevel error -framerate 60 -start_number 840 -i frames_9x16/f%05d.jpg \
  -ss 14.0 -i mix_master.wav -frames:v 480 \
  -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 320k -shortest KhdemliDaba_Kayn_clients_darija_9x16_8s_cut.mp4
echo "-> 8 s cut"

# feed still: the hook question with its stamp
ffmpeg -y -loglevel error -i frames_9x16/f00078.jpg -vf "crop=1080:1350:0:285" -q:v 2 still_hook_1080x1350.jpg
echo "-> still"

ffmpeg -y -loglevel error -i KhdemliDaba_Kayn_clients_darija_9x16_60fps.mp4 \
  -vf "select='eq(n\,42)+eq(n\,78)+eq(n\,156)+eq(n\,276)+eq(n\,330)+eq(n\,456)+eq(n\,540)+eq(n\,612)+eq(n\,700)+eq(n\,864)+eq(n\,1000)+eq(n\,1080)+eq(n\,1140)+eq(n\,1230)+eq(n\,1272)+eq(n\,1380)',scale=300:-1,tile=8x2:margin=10:padding=8:color=#0b0906" \
  -frames:v 1 -q:v 3 contact_sheet_9x16.jpg
echo "-> contact sheet"
