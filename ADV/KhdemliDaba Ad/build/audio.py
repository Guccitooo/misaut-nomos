#!/usr/bin/env python3
"""
KhdemliDaba — Concept A (darija). Original score + sound design, made in code.

Key: F minor, resolving to F major add9 under the end card.
Everything is arranged around the VO slots of the beat sheet: the music sits
down whenever a line is meant to be spoken, so dropping the ElevenLabs take on
top needs no re-balancing beyond the final -15 dB duck.

Writes:  out/stems/music.wav, out/stems/sfx.wav, out/mix_raw.wav
"""
import numpy as np, wave, os, struct

SR = 48000
DUR = 20.0
N = int(SR * DUR)
t = np.arange(N) / SR


# ---------------------------------------------------------------- utilities
def stereo(mono_l, mono_r=None):
    return np.stack([mono_l, mono_l if mono_r is None else mono_r], axis=1)


def seg(start, length):
    """index slice + local time vector for an event"""
    i0 = int(start * SR)
    i1 = min(N, i0 + int(length * SR))
    return i0, i1, np.arange(i1 - i0) / SR


def env_ad(n, attack, decay, curve=2.5):
    """percussive attack/decay envelope"""
    a = max(1, int(attack * SR))
    e = np.ones(n)
    e[:a] = np.linspace(0, 1, a) ** 0.6
    d = np.exp(-np.arange(n) / max(1e-6, decay * SR) * curve)
    return e * d


def env_adsr(n, a, d, s, r):
    a, d, r = max(1, int(a * SR)), max(1, int(d * SR)), max(1, int(r * SR))
    out = np.zeros(n)
    out[:a] = np.linspace(0, 1, a)
    out[a:a + d] = np.linspace(1, s, d)[:max(0, n - a)]
    out[a + d:n - r] = s
    if r < n:
        out[n - r:] = np.linspace(out[max(0, n - r - 1)], 0, r)
    return out


def lp1(x, cutoff):
    """one-pole lowpass; cutoff may be an array (per-sample sweep)"""
    c = np.atleast_1d(cutoff)
    if c.size == 1:
        c = np.full(x.size, c[0])
    a = np.clip(1 - np.exp(-2 * np.pi * c / SR), 1e-5, 1.0)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(x.size):          # explicit loop: cutoff is time-varying
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def lp_static(x, cutoff, poles=2):
    """fast static lowpass via frequency-domain roll-off"""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(x.size, 1 / SR)
    X *= 1.0 / (1.0 + (f / cutoff) ** 2) ** (poles / 2)
    return np.fft.irfft(X, x.size)


def hp_static(x, cutoff, poles=2):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(x.size, 1 / SR)
    with np.errstate(divide='ignore'):
        resp = 1.0 / (1.0 + (cutoff / np.maximum(f, 1e-9)) ** 2) ** (poles / 2)
    return np.fft.irfft(X * resp, x.size)


def bp_static(x, lo, hi):
    return hp_static(lp_static(x, hi), lo)


def reverb(x, length=1.8, damp=4200, mix=0.3, pre=0.02):
    """convolution reverb with a synthetic exponential-noise impulse"""
    n = int(length * SR)
    rng = np.random.default_rng(7)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / (length * SR / 4.2))
    ir = lp_static(ir, damp)
    ir[:int(pre * SR)] = 0
    ir /= np.abs(ir).max() * 28
    wet = np.convolve(x, ir)[:x.size]
    return (1 - mix) * x + mix * wet


def add(buf, start, sig, gain=1.0):
    i0 = int(start * SR)
    i1 = min(N, i0 + sig.size)
    if i1 > i0:
        buf[i0:i1] += sig[:i1 - i0] * gain


def note(freq, dur, kind='saw', detune=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    f = freq * (1 + detune)
    if kind == 'sine':
        return np.sin(2 * np.pi * f * tt)
    if kind == 'tri':
        return 2 / np.pi * np.arcsin(np.sin(2 * np.pi * f * tt))
    # band-limited-ish saw
    out = np.zeros(n)
    for h in range(1, 14):
        if f * h > SR / 2.2:
            break
        out += np.sin(2 * np.pi * f * h * tt) / h
    return out * 0.6


# ---------------------------------------------------------------- the score
# Beat sheet anchors (seconds) — identical to scene.html
B_SEARCH, B_TYPE, B_CITY = 0.0, 1.30, 3.60
B_RANK, B_CARD, B_MSG = 5.40, 8.00, 10.20
B_SLOTS, B_PRICE, B_LOGO, B_END = 12.40, 14.60, 16.60, 18.00

NOTES = dict(F1=43.65, F2=87.31, Ab2=103.83, C3=130.81, Db3=138.59, Eb3=155.56,
             F3=174.61, Ab3=207.65, Bb3=233.08, C4=261.63, Db4=277.18, F4=349.23,
             G4=392.00, Ab4=415.30, C5=523.25, F5=698.46, G5=784.0, Ab5=830.61)

musL = np.zeros(N)
musR = np.zeros(N)


def pad(start, dur, freqs, gain, cut_from=380, cut_to=2100, spread=0.004):
    """wide, slowly opening pad — the bed of the whole film"""
    n = int(dur * SR)
    sweep = np.linspace(cut_from, cut_to, n)
    e = env_adsr(n, 0.9, 0.6, 0.86, 1.4)
    for k, f in enumerate(freqs):
        for side, det in ((0, -spread), (1, +spread)):
            v = note(f, dur, 'saw', det * (1 + k * 0.3))
            v = lp1(v, sweep) * e
            add(musL if side == 0 else musR, start, v, gain)


# bed 1: F minor (F2 / Ab3 / C4) from the first frame to the price
pad(0.0, 15.0, [NOTES['F2'], NOTES['Ab3'], NOTES['C4']], 0.085)
# bed 2: Db major lift under the scarcity + price beats
pad(12.3, 4.6, [NOTES['Db3'], NOTES['F3'], NOTES['Ab3']], 0.075, 520, 2600)
# resolution: F major add9 rings from the logo through the end card
pad(16.5, 3.5, [NOTES['F2'], NOTES['C4'], NOTES['F4'], NOTES['G4']], 0.10, 700, 3200)

# pulse: eighth notes at 120 BPM, enters with the city rush, locks the cut
BPM, STEP = 120, 0.25
pulse = np.zeros(N)
k = 0
pt = B_CITY
while pt < B_LOGO:
    accent = (k % 4 == 0)
    d = 0.22
    v = note(NOTES['C5'] if accent else NOTES['Ab4'], d, 'tri')
    v = v * env_ad(v.size, 0.002, 0.055, 3.4)
    v = hp_static(v, 300)
    # the pulse steps back while the hero card and the messages play
    duck = 0.45 if B_CARD - .2 < pt < B_MSG + 1.8 else 1.0
    add(pulse, pt, v, (0.085 if accent else 0.05) * duck)
    pt += STEP
    k += 1
pulse = reverb(pulse, 1.2, 5200, 0.22)
musL += pulse * 0.95
musR += np.roll(pulse, 180) * 0.95          # small Haas spread

# sub: one low F under every landing
for at, g, d in ((B_RANK, 0.55, 1.1), (7.05, 0.42, 0.9), (B_CARD, 0.40, 0.8),
                 (B_SLOTS, 0.50, 1.0), (B_PRICE, 0.80, 1.6), (B_LOGO, 0.62, 2.0)):
    n = int(d * SR)
    tt = np.arange(n) / SR
    sub = np.sin(2 * np.pi * NOTES['F1'] * tt + 2.2 * np.exp(-tt * 9))
    sub *= env_ad(n, 0.004, d / 3.1, 2.2)
    add(musL, at, sub, g * 0.5)
    add(musR, at, sub, g * 0.5)

# the final chord: struck once, left ringing under the end card
n = int(3.3 * SR)
chord = np.zeros(n)
for f, g in ((NOTES['F3'], 1.0), (NOTES['Ab4'], 0.0), (NOTES['C5'], 0.7),
             (NOTES['F5'], 0.5), (NOTES['G5'], 0.35)):
    if g == 0:
        continue
    v = note(f, 3.3, 'tri') * env_ad(n, 0.006, 1.5, 1.5)
    chord += v * g
chord = reverb(hp_static(chord, 180), 2.6, 4200, 0.45)
add(musL, 17.15, chord, 0.19)
add(musR, 17.15, chord, 0.19)

# ---------------------------------------------------------------- sound design
sfxL = np.zeros(N)
sfxR = np.zeros(N)
rng = np.random.default_rng(11)


def whoosh(at, dur=0.42, f0=260, f1=5200, gain=0.5, pan=0.0, rev=0.22):
    n = int(dur * SR)
    noise = rng.standard_normal(n)
    sweep = np.linspace(f0, f1, n)
    v = lp1(noise, sweep) * env_ad(n, dur * 0.35, dur * 0.30, 2.0)
    v = hp_static(v, 220)
    v = reverb(v, 0.9, 6000, rev)
    v /= np.abs(v).max() + 1e-9
    add(sfxL, at, v, gain * (1 - max(0, pan)))
    add(sfxR, at, v, gain * (1 + min(0, pan)))


def hit(at, gain=0.6, body=60, dur=0.55, click=0.5):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    v = np.sin(2 * np.pi * body * tt * np.exp(-tt * 1.4)) * env_ad(n, 0.002, dur / 3.4, 2.6)
    tick = bp_static(rng.standard_normal(n), 1800, 9000) * env_ad(n, 0.0005, 0.018, 4.0)
    v = v + tick * click
    v /= np.abs(v).max() + 1e-9
    add(sfxL, at, v, gain)
    add(sfxR, at, v, gain)


def tick(at, gain=0.16, f=2600):
    n = int(0.05 * SR)
    tt = np.arange(n) / SR
    v = (np.sin(2 * np.pi * f * tt) + 0.6 * rng.standard_normal(n)) * env_ad(n, 0.0004, 0.009, 4.0)
    v = bp_static(v, 900, 7000)
    v /= np.abs(v).max() + 1e-9
    add(sfxL, at, v, gain)
    add(sfxR, at, v, gain * 0.92)


def ping(at, f=880, gain=0.34):
    """two-tone message ping (not a trademarked sound — a clean synth bell)"""
    n = int(0.6 * SR)
    tt = np.arange(n) / SR
    v = np.sin(2 * np.pi * f * tt) * env_ad(n, 0.002, 0.10, 3.0)
    v += 0.5 * np.sin(2 * np.pi * f * 1.5 * tt) * env_ad(n, 0.004, 0.14, 3.0)
    v = reverb(v, 1.0, 7000, 0.26)
    v /= np.abs(v).max() + 1e-9
    add(sfxL, at, v, gain)
    add(sfxR, at, v, gain * 0.9)


def shimmer(at, gain=0.26):
    n = int(1.1 * SR)
    tt = np.arange(n) / SR
    v = np.zeros(n)
    for f in (2093, 2637, 3136, 4186):
        v += np.sin(2 * np.pi * f * tt) * env_ad(n, 0.01, 0.35, 2.0) * rng.uniform(.5, 1)
    v = reverb(hp_static(v, 1500), 1.6, 9000, 0.4)
    v /= np.abs(v).max() + 1e-9
    add(sfxL, at, v, gain)
    add(sfxR, at, v, gain)


def swipe(at, gain=0.3):
    n = int(0.22 * SR)
    v = bp_static(rng.standard_normal(n), 1200, 7000) * env_ad(n, 0.004, 0.05, 3.0)
    v /= np.abs(v).max() + 1e-9
    add(sfxL, at, v, gain)
    add(sfxR, at, v, gain * 0.8)


# B1 — the field arrives
whoosh(0.02, 0.60, 180, 3600, 0.42)
tick(1.02, 0.12)
# B2 — one tick per typed letter, then a hit as each pill closes
for i in range(7):
    tick(1.30 + i * 0.107, 0.15, 2300 + i * 120)
whoosh(2.10, 0.34, 300, 6200, 0.34, -0.3)
hit(2.18, 0.42, 72, 0.45, 0.65)
whoosh(2.54, 0.34, 300, 6200, 0.34, 0.3)
hit(2.62, 0.42, 66, 0.45, 0.65)
# B3 — the country rushes past
whoosh(3.46, 0.95, 140, 7200, 0.60, 0.0, 0.3)
whoosh(4.40, 0.55, 400, 3000, 0.26, 0.4)
# B4 — the climb and the badge
whoosh(5.32, 0.55, 200, 4200, 0.44)
hit(5.42, 0.52, 54, 0.75, 0.4)
whoosh(6.30, 0.70, 260, 5200, 0.38)
hit(7.05, 0.56, 62, 0.65, 0.7)
shimmer(7.06, 0.24)
hit(7.30, 0.30, 90, 0.35, 0.8)
# B5 — the hero card fills the frame
whoosh(7.86, 0.52, 220, 5600, 0.40)
hit(8.78, 0.34, 70, 0.5, 0.5)
tick(9.16, 0.14, 1800)
# B6 — the phone starts ringing
for i, (at, f) in enumerate(((10.45, 1046), (11.00, 880), (11.55, 740))):
    whoosh(at - 0.12, 0.26, 400, 5200, 0.22, -0.2 + i * 0.2)
    ping(at, f, 0.32 + i * 0.02)
hit(11.75, 0.26, 110, 0.3, 0.7)
# B7 — scarcity
whoosh(12.34, 0.50, 200, 4800, 0.44)
for i, at in enumerate((13.25, 13.52, 13.79)):
    hit(at, 0.34 + i * 0.03, 80 - i * 6, 0.4, 0.6)
for i, at in enumerate((14.00, 14.07, 14.14)):
    swipe(at, 0.22)
# B8 — the price lands
whoosh(14.46, 0.60, 150, 6400, 0.62)
hit(14.62, 0.80, 48, 1.1, 0.5)
tick(15.38, 0.12, 1500)
# B9 — the mark
whoosh(16.50, 0.56, 220, 5200, 0.48)
hit(16.62, 0.40, 58, 0.7, 0.45)
hit(17.20, 0.46, 74, 0.6, 0.8)
shimmer(17.22, 0.20)
# B10 — the end card
whoosh(17.94, 0.70, 300, 2600, 0.24, 0.0, 0.35)

# ---------------------------------------------------------------- mix
def duck(buf, at, depth=0.55, attack=0.03, hold=0.18, release=0.35):
    """sidechain-style dip (no limiter squashing anything)"""
    i0 = int(at * SR)
    a, h, r = int(attack * SR), int(hold * SR), int(release * SR)
    g = np.ones(N)
    g[i0:i0 + a] = np.linspace(1, 1 - depth, a)
    g[i0 + a:i0 + a + h] = 1 - depth
    g[i0 + a + h:i0 + a + h + r] = np.linspace(1 - depth, 1, r)
    return buf * g


# music gets out of the way of every hit, as a VO would later do
for at in (B_RANK, 7.05, B_PRICE, B_LOGO):
    musL, musR = duck(musL, at, 0.35), duck(musR, at, 0.35)

music = stereo(musL, musR)
sfx = stereo(sfxL, sfxR)

# gentle fade in/out so nothing clicks at the boundaries
fade = np.ones(N)
fade[:int(0.05 * SR)] = np.linspace(0, 1, int(0.05 * SR))
fade[-int(0.35 * SR):] = np.linspace(1, 0, int(0.35 * SR))
music *= fade[:, None]
sfx *= fade[:, None]

mix = music * 0.82 + sfx * 0.80
peak = np.abs(mix).max()
if peak > 0.98:
    mix *= 0.98 / peak


def write_wav(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    d = np.clip(data, -1, 1)
    pcm = (d * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f'{path}  {d.shape[0]/SR:.2f}s  peak {np.abs(d).max():.3f}')


OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'out')
write_wav(os.path.join(OUT, 'stems', 'music.wav'), music)
write_wav(os.path.join(OUT, 'stems', 'sfx.wav'), sfx)
write_wav(os.path.join(OUT, 'mix_raw.wav'), mix)
