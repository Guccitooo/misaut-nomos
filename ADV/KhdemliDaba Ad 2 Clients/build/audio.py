#!/usr/bin/env python3
"""
KhdemliDaba «كاين» — client spot. Original score + sound design in code.

Different film, different music: D major, 128 BPM, a dry percussive groove
(kick / clap / hat / a hand-drum tone) with a plucked bass and a bright
arpeggio, so it feels like a phone ad and not like the pro film. Every
«كاين» stamp gets a brass-ish stab. VO slots (4 questions + 2 lines) are
left open: the pulse steps back there. Writes stems + raw mix to ../out.
"""
import numpy as np, wave, os

SR, DUR = 48000, 24.0
N = int(SR * DUR)


def env_ad(n, a, d, k=2.5):
    a = max(1, int(a * SR)); e = np.ones(n); e[:a] = np.linspace(0, 1, a) ** .6
    return e * np.exp(-np.arange(n) / max(1e-6, d * SR) * k)


def lp(x, c, poles=2):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(x.size, 1 / SR)
    return np.fft.irfft(X / (1 + (f / c) ** 2) ** (poles / 2), x.size)


def hp(x, c, poles=2):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(x.size, 1 / SR)
    with np.errstate(divide='ignore'):
        r = 1 / (1 + (c / np.maximum(f, 1e-9)) ** 2) ** (poles / 2)
    return np.fft.irfft(X * r, x.size)


def lp_sweep(x, c0, c1):
    """one-pole lowpass with a linear cutoff sweep (explicit loop)"""
    c = np.linspace(c0, c1, x.size); a = 1 - np.exp(-2 * np.pi * c / SR)
    y = np.empty_like(x); acc = 0.0
    for i in range(x.size):
        acc += a[i] * (x[i] - acc); y[i] = acc
    return y


def reverb(x, length=1.4, damp=5000, mix=.25):
    n = int(length * SR); rng = np.random.default_rng(3)
    ir = lp(rng.standard_normal(n) * np.exp(-np.arange(n) / (length * SR / 4)), damp)
    ir /= np.abs(ir).max() * 30
    return (1 - mix) * x + mix * np.convolve(x, ir)[:x.size]


def add(buf, at, sig, g=1.0):
    i0 = int(at * SR); i1 = min(N, i0 + sig.size)
    if i1 > i0: buf[i0:i1] += sig[:i1 - i0] * g


def saw(f, d, det=0):
    n = int(d * SR); tt = np.arange(n) / SR; o = np.zeros(n); f *= 1 + det
    for h in range(1, 12):
        if f * h > SR / 2.2: break
        o += np.sin(2 * np.pi * f * h * tt) / h
    return o * .6


def sine(f, d): tt = np.arange(int(d * SR)) / SR; return np.sin(2 * np.pi * f * tt)
def tri(f, d): tt = np.arange(int(d * SR)) / SR; return 2 / np.pi * np.arcsin(np.sin(2 * np.pi * f * tt))


NOTE = dict(D1=36.71, D2=73.42, A2=110.0, B2=123.47, G2=98.0, D3=146.83, F3s=185.0, A3=220.0, B3=246.94,
            D4=293.66, E4=329.63, F4s=369.99, G4=392.0, A4=440.0, B4=493.88, D5=587.33, F5s=739.99, A5=880.0)

musL, musR = np.zeros(N), np.zeros(N)
sfxL, sfxR = np.zeros(N), np.zeros(N)
rng = np.random.default_rng(21)

BPM = 128; BEAT = 60 / BPM; STEP = BEAT / 2            # eighth notes
Q_SLOTS = [(0.0, 1.4), (3.2, 4.4), (6.0, 7.2), (8.8, 10.0), (12.4, 13.2), (15.6, 16.6)]  # VO windows


def in_vo(t): return any(a <= t < b for a, b in Q_SLOTS)


# ---- drums ----------------------------------------------------------------
def kick(at, g=.9):
    n = int(.32 * SR); tt = np.arange(n) / SR
    v = np.sin(2 * np.pi * (52 * tt + 90 * np.exp(-tt * 18))) * env_ad(n, .001, .09, 2.4)
    add(musL, at, v, g); add(musR, at, v, g)


def clap(at, g=.5):
    n = int(.22 * SR); v = np.zeros(n)
    for k in range(4):
        d = int(k * .008 * SR); v[d:] += hp(rng.standard_normal(n - d), 900) * env_ad(n - d, .0005, .03, 3) * .6
    v = reverb(v, .5, 7000, .3); v /= np.abs(v).max() + 1e-9
    add(musL, at, v, g); add(musR, at, v, g * .9)


def hat(at, g=.22, open_=False):
    n = int((.16 if open_ else .05) * SR)
    v = hp(rng.standard_normal(n), 6500) * env_ad(n, .0005, .06 if open_ else .012, 3)
    v /= np.abs(v).max() + 1e-9
    add(musL, at, v, g * .95); add(musR, at, v, g)


def tone_drum(at, f=190, g=.45):
    """a short pitched hand-drum hit, the north-african flavour"""
    n = int(.18 * SR); tt = np.arange(n) / SR
    v = np.sin(2 * np.pi * (f * tt + 60 * np.exp(-tt * 40))) * env_ad(n, .001, .05, 3)
    v += .3 * hp(rng.standard_normal(n), 3000) * env_ad(n, .0005, .01, 4)
    add(musL, at, v, g); add(musR, at, v, g * .85)


# groove: 1 bar = 4 beats; kick on 1, 2.5, 3 ; clap on 2, 4 ; hats on 8ths ; drum tones syncopated
t = 0.0; bar = 0
while t < 21.6:
    duck = .5 if in_vo(t) else 1.0
    for b, g in ((0, 1), (1.5, .8), (2, .9), (3.5, .7)): kick(t + b * BEAT, .95 * g * duck)
    for b in (1, 3): clap(t + b * BEAT, .5 * duck)
    for s in range(8):
        hat(t + s * STEP, .16 if s % 2 else .26, open_=(s == 7))
    for b, f in ((0.5, 210), (2.25, 170), (2.75, 230), (3.25, 190)):
        tone_drum(t + b * BEAT, f, .4 * duck)
    t += 4 * BEAT; bar += 1

# ---- bass : plucked, follows D – B – G – A ---------------------------------
prog = [('D2', 'D3'), ('B2', 'B3'), ('G2', 'G4'), ('A2', 'A3')]
t = 0.0; i = 0
while t < 21.6:
    root = prog[i % 4][0]
    for s, l in ((0, .32), (1.5, .22), (2, .32), (2.75, .18), (3.5, .22)):
        n = int(l * SR); v = lp_sweep(saw(NOTE[root], l), 1400, 180) * env_ad(n, .003, l / 1.6, 2)
        g = .5 if in_vo(t + s * BEAT) else .62
        add(musL, t + s * BEAT, v, g); add(musR, t + s * BEAT, v, g)
    t += 4 * BEAT; i += 1

# ---- arpeggio : bright 16ths, enters at the numbers, lifts the ending --------
arp_notes = ['D4', 'F4s', 'A4', 'D5', 'A4', 'F4s']
t = 12.4; k = 0
while t < 21.6:
    f = NOTE[arp_notes[k % 6]]; n = int(.16 * SR)
    v = tri(f, .16) * env_ad(n, .002, .05, 3)
    g = .09 if in_vo(t) else .17
    add(musL, t, v, g * (1 if k % 2 else .8)); add(musR, t, v, g * (.8 if k % 2 else 1))
    t += STEP / 2; k += 1

# ---- pad : thin D major bed from the fan beat to the logo --------------------
for f, g in (('D3', .05), ('A3', .04), ('F4s', .035)):
    n = int(11.5 * SR); v = lp(saw(NOTE[f], 11.5, .003) + saw(NOTE[f], 11.5, -.003), 1800) * env_ad(n, 1.2, 9, 1.2)
    add(musL, 9.0, v, g); add(musR, 9.2, v, g)

# ---- final chord : D major add9, rings under the end card --------------------
n = int(3.6 * SR); ch = np.zeros(n)
for f, g in (('D3', 1), ('A3', .7), ('F4s', .6), ('E4', .45), ('D5', .35)):
    ch += tri(NOTE[f], 3.6) * env_ad(n, .006, 1.6, 1.4) * g
ch = reverb(hp(ch, 150), 2.8, 4500, .45)
add(musL, 20.6, ch, .2); add(musR, 20.6, ch, .2)


# ---- sound design -----------------------------------------------------------
def whoosh(at, d=.4, f0=250, f1=5000, g=.5, pan=0, vertical=False):
    n = int(d * SR); v = lp_sweep(rng.standard_normal(n), f0, f1) * env_ad(n, d * .35, d * .3, 2)
    v = reverb(hp(v, 200), .8, 6000, .2); v /= np.abs(v).max() + 1e-9
    add(sfxL, at, v, g * (1 - max(0, pan))); add(sfxR, at, v, g * (1 + min(0, pan)))


def stab(at, g=.6):
    """the «كاين» stamp: a brass-ish stab + floor hit + shake rattle"""
    n = int(.5 * SR); v = np.zeros(n)
    for f, w in (('D3', 1), ('A3', .8), ('D4', .7), ('F4s', .5)):
        v += lp_sweep(saw(NOTE[f], .5), 3800, 500, ) * w
    v = v * env_ad(n, .004, .16, 2.2)
    tt = np.arange(n) / SR
    v += np.sin(2 * np.pi * (48 * tt + 80 * np.exp(-tt * 20))) * env_ad(n, .001, .12, 2.5) * 1.4
    v += hp(rng.standard_normal(n), 2500) * env_ad(n, .0005, .02, 4) * .5
    v = reverb(v, 1.1, 5000, .25); v /= np.abs(v).max() + 1e-9
    add(sfxL, at, v, g); add(sfxR, at, v, g)


def swipe(at, g=.4, pan=.3):
    n = int(.3 * SR); v = lp_sweep(rng.standard_normal(n), 600, 7000) * env_ad(n, .02, .08, 2.5)
    v = hp(v, 500); v /= np.abs(v).max() + 1e-9
    add(sfxL, at, v, g * (1 - max(0, pan))); add(sfxR, at, v, g * (1 + min(0, pan)))


def tap(at, g=.5):
    n = int(.09 * SR); tt = np.arange(n) / SR
    v = np.sin(2 * np.pi * 1100 * tt) * env_ad(n, .0005, .012, 4) + np.sin(2 * np.pi * 420 * tt) * env_ad(n, .001, .03, 3) * .6
    v /= np.abs(v).max() + 1e-9
    add(sfxL, at, v, g); add(sfxR, at, v, g)


def ping(at, f=1046, g=.42):
    n = int(.7 * SR); tt = np.arange(n) / SR
    v = np.sin(2 * np.pi * f * tt) * env_ad(n, .002, .12, 3) + .5 * np.sin(2 * np.pi * f * 1.5 * tt) * env_ad(n, .004, .16, 3)
    v = reverb(v, 1, 7000, .3); v /= np.abs(v).max() + 1e-9
    add(sfxL, at, v, g); add(sfxR, at, v, g * .9)


def tick(at, g=.16, f=2400):
    n = int(.04 * SR); tt = np.arange(n) / SR
    v = (np.sin(2 * np.pi * f * tt) + .5 * rng.standard_normal(n)) * env_ad(n, .0004, .008, 4)
    v = hp(v, 900); v /= np.abs(v).max() + 1e-9
    add(sfxL, at, v, g); add(sfxR, at, v, g * .9)


def pop_(at, g=.4):
    n = int(.14 * SR); tt = np.arange(n) / SR
    v = np.sin(2 * np.pi * (300 * tt + 500 * np.exp(-tt * 60))) * env_ad(n, .001, .03, 3)
    v /= np.abs(v).max() + 1e-9
    add(sfxL, at, v, g); add(sfxR, at, v, g)


# B1–B3 : question slam / stamp / card swipe / tap / ping
for t0 in (0.0, 3.2, 6.0):
    whoosh(t0 + .0, .55, 180, 5200, .55, 0, True)
    stab(t0 + 1.0, .62)
    swipe(t0 + 1.55, .42, .4)
    pop_(t0 + 2.22, .34)
    tap(t0 + 2.55, .5)
    ping(t0 + 2.72, 1046 if t0 < 1 else (880 if t0 < 5 else 988), .4)
# B4 : fan
whoosh(8.8, .55, 180, 5200, .55, 0, True)
for i in range(3): swipe(9.55 + i * .28, .38, .4 if i % 2 == 0 else -.4)
stab(10.95, .66)
# B5 : odometer ticks + three landings
whoosh(12.35, .5, 200, 4800, .45)
for i in range(3):
    base = 12.6 + i * .55
    for k in range(14): tick(base + k * .085, .14, 2000 + k * 60)
    pop_(base + 1.3, .42)
# B6 : phone + steps + tap + ping
whoosh(15.55, .6, 180, 4200, .5)
for i in range(3): pop_(16.15 + i * .7, .42)
pop_(18.35, .4); tap(18.9, .55); ping(19.05, 1175, .46)
# B7 : logo
whoosh(19.55, .55, 220, 5200, .5)
tap(20.6, .35); stab(20.65, .4)
pop_(20.6, .4)
whoosh(21.95, .7, 300, 2600, .24)


# ---- mix ---------------------------------------------------------------------
def fade(buf):
    f = np.ones(N); f[:int(.04 * SR)] = np.linspace(0, 1, int(.04 * SR)); f[-int(.35 * SR):] = np.linspace(1, 0, int(.35 * SR))
    return buf * f


music = np.stack([fade(musL), fade(musR)], 1); sfx = np.stack([fade(sfxL), fade(sfxR)], 1)
music *= .9 / (np.abs(music).max() + 1e-9); sfx *= .95 / (np.abs(sfx).max() + 1e-9)
mix = music * .72 + sfx * .78
mix *= min(1, .98 / (np.abs(mix).max() + 1e-9))


def write(path, d):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(d, -1, 1) * 32767).astype('<i2').tobytes())
    print(path, f'{d.shape[0]/SR:.2f}s peak {np.abs(d).max():.3f}')


OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'out')
write(os.path.join(OUT, 'stems', 'music.wav'), music)
write(os.path.join(OUT, 'stems', 'sfx.wav'), sfx)
write(os.path.join(OUT, 'mix_raw.wav'), mix)
