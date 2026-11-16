"""
Bibliothèque de synthèse sonore ApexAI — 100 % générée par calcul, donc libre de droits.

Intention : fluide, aérien, précis, premium. Des souffles qui suivent le mouvement,
des clics d'interface feutrés, des impacts graves et ronds, des scintillements légers.

Chaque fonction renvoie un tableau float32 (n, 2) à 48 kHz, crête normalisée à 0 dBFS
(le niveau final est fixé au mixage). Tout est déterministe : mêmes paramètres, même son.
"""
from __future__ import annotations

import zlib

import numpy as np
import pedalboard as pb
from scipy import signal

SR = 48000
PENTA = [1.0, 9 / 8, 5 / 4, 3 / 2, 5 / 3]  # gamme pentatonique majeure (rapports)


# ───────────────────────── utilitaires ─────────────────────────
def rng(seed: str) -> np.random.Generator:
    return np.random.default_rng(zlib.crc32(seed.encode("utf-8")))


def n_of(dur: float) -> int:
    return max(1, int(round(dur * SR)))


def t_axis(n: int) -> np.ndarray:
    return np.arange(n) / SR


def pink(n: int, r: np.random.Generator) -> np.ndarray:
    w = r.standard_normal(n)
    W = np.fft.rfft(w)
    f = np.fft.rfftfreq(n, 1 / SR)
    f[0] = f[1] if len(f) > 1 else 1.0
    p = np.fft.irfft(W / np.sqrt(f), n)
    return p / (np.max(np.abs(p)) + 1e-12)


def white(n: int, r: np.random.Generator) -> np.ndarray:
    return r.uniform(-1, 1, n)


def sos_filter(x: np.ndarray, kind: str, f, order: int = 2) -> np.ndarray:
    sos = signal.butter(order, f, btype=kind, fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def sweep_filter(x: np.ndarray, fc: np.ndarray, bw_oct: np.ndarray, nperseg: int = 1024) -> np.ndarray:
    """Passe-bande variable dans le temps (masque gaussien en octaves dans le domaine STFT)."""
    n = len(x)
    pad = nperseg
    xp = np.concatenate([np.zeros(pad), x, np.zeros(pad)])
    f, tt, Z = signal.stft(xp, SR, nperseg=nperseg, noverlap=nperseg * 3 // 4)
    ts = (np.arange(n) + pad) / SR
    fcs = np.interp(tt, ts, fc)
    bws = np.interp(tt, ts, bw_oct)
    lf = np.log2(np.maximum(f, 20.0)[:, None] / fcs[None, :])
    sigma = (bws / 2.355)[None, :]
    Z = Z * np.exp(-0.5 * (lf / sigma) ** 2)
    _, y = signal.istft(Z, SR, nperseg=nperseg, noverlap=nperseg * 3 // 4)
    return y[pad : pad + n]


def swell(n: int, peak: float = 0.55, a: float = 1.6, d: float = 1.4) -> np.ndarray:
    """Enveloppe douce 0 → 1 → 0 avec maximum à `peak` (fraction de la durée)."""
    t = np.linspace(0, 1, n)
    up = np.sin(np.pi / 2 * np.clip(t / max(peak, 1e-6), 0, 1)) ** a
    dn = np.cos(np.pi / 2 * np.clip((t - peak) / max(1 - peak, 1e-6), 0, 1)) ** d
    return np.where(t < peak, up, dn)


def fade(x: np.ndarray, fin: float = 0.002, fout: float = 0.004) -> np.ndarray:
    n = len(x)
    a, b = min(n, n_of(fin)), min(n, n_of(fout))
    env = np.ones(n)
    if a > 1:
        env[:a] = np.linspace(0, 1, a)
    if b > 1:
        env[-b:] *= np.linspace(1, 0, b)
    return x * (env[:, None] if x.ndim == 2 else env)


def stereo(mono: np.ndarray) -> np.ndarray:
    return np.stack([mono, mono], axis=1)


def pan(st: np.ndarray, p) -> np.ndarray:
    """Panoramique à puissance constante ; p scalaire ou courbe (-1 gauche → +1 droite)."""
    p = np.broadcast_to(np.asarray(p, dtype=float), (len(st),))
    th = (np.clip(p, -1, 1) + 1) * np.pi / 4
    gl, gr = np.cos(th) * np.sqrt(2), np.sin(th) * np.sqrt(2)
    out = st.copy()
    out[:, 0] *= np.minimum(gl, 1.0)
    out[:, 1] *= np.minimum(gr, 1.0)
    return out


def widen(st: np.ndarray, w: float) -> np.ndarray:
    mid = (st[:, 0] + st[:, 1]) / 2
    side = (st[:, 0] - st[:, 1]) / 2 * w
    return np.stack([mid + side, mid - side], axis=1)


def fx(st: np.ndarray, *plugins, tail: float = 0.0) -> np.ndarray:
    x = st
    if tail > 0:
        # fondu anti-clic sur la fin du signal sec avant d'ajouter la queue de réverbération
        x = np.concatenate([fade(x, 0.0, 0.015), np.zeros((n_of(tail), 2))])
    board = pb.Pedalboard(list(plugins))
    y = board(x.T.astype(np.float32), SR)
    return y.T.astype(np.float64)


def reverb(st: np.ndarray, wet: float = 0.15, size: float = 0.28, damp: float = 0.55, tail: float = 0.6) -> np.ndarray:
    return fx(st, pb.Reverb(room_size=size, damping=damp, wet_level=wet, dry_level=1.0 - wet * 0.4, width=1.0), tail=tail)


def trim_tail(st: np.ndarray, thresh_db: float = -70.0) -> np.ndarray:
    a = np.max(np.abs(st), axis=1)
    thr = 10 ** (thresh_db / 20) * (np.max(a) + 1e-12)
    idx = np.where(a > thr)[0]
    end = (idx[-1] + n_of(0.01)) if len(idx) else len(st)
    return fade(st[: min(len(st), end)], 0.0005, 0.01)


def norm(st: np.ndarray, peak_db: float = 0.0) -> np.ndarray:
    m = np.max(np.abs(st)) + 1e-12
    return (st / m * 10 ** (peak_db / 20)).astype(np.float32)


def place(dst: np.ndarray, src: np.ndarray, at: float, gain: float = 1.0) -> None:
    i = n_of(at) if at > 0 else 0
    j = min(len(dst), i + len(src))
    if j > i:
        dst[i:j] += src[: j - i] * gain


def silence(dur: float) -> np.ndarray:
    return np.zeros((n_of(dur), 2))


def sine_glide(f0: float, f1: float, dur: float, curve: float = 0.0) -> np.ndarray:
    """Sinusoïde glissant de f0 à f1 (curve > 0 : chute exponentielle rapide)."""
    n = n_of(dur)
    t = np.linspace(0, 1, n)
    if curve > 0:
        f = f1 + (f0 - f1) * np.exp(-t * curve)
    else:
        f = f0 * (f1 / f0) ** t
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def bell(freq: float, dur: float, ratio: float = 3.5, index: float = 1.6, decay: float = 0.7, idx_decay: float = 0.18) -> np.ndarray:
    n = n_of(dur)
    t = t_axis(n)
    I = index * np.exp(-t / idx_decay)
    m = np.sin(2 * np.pi * freq * ratio * t)
    c = np.sin(2 * np.pi * freq * t + I * m)
    a = np.minimum(1, t / 0.002)
    end = np.ones(n)
    m = min(n, n_of(0.03))
    end[-m:] = 0.5 * (1 + np.cos(np.linspace(0, np.pi, m)))
    return c * np.exp(-t / decay) * a * end


def soft_clip(x: np.ndarray, drive: float) -> np.ndarray:
    return np.tanh(drive * x) / np.tanh(drive)


def bezier_ease(p1x, p1y, p2x, p2y):
    """Courbe d'accélération CSS cubic-bezier : renvoie y(x)."""
    s = np.linspace(0, 1, 2001)
    bx = 3 * p1x * s * (1 - s) ** 2 + 3 * p2x * s**2 * (1 - s) + s**3
    by = 3 * p1y * s * (1 - s) ** 2 + 3 * p2y * s**2 * (1 - s) + s**3
    return lambda x: np.interp(x, bx, by)


OUT_EXPO = bezier_ease(0.16, 1, 0.3, 1)


# ───────────────────────── souffles ─────────────────────────
def whoosh(
    dur: float = 0.5,
    f_lo: float = 350,
    f_hi: float = 3200,
    peak: float = 0.55,
    bw: float = 1.3,
    seed: str = "whoosh",
    width: float = 0.7,
    pan_from: float = 0.0,
    pan_to: float = 0.0,
    sub: float = 0.0,
    verb: float = 0.14,
    a: float = 1.6,
    d: float = 1.4,
    tone: float = 0.0,
) -> np.ndarray:
    n = n_of(dur)
    r = rng(seed)
    t = np.linspace(0, 1, n)
    pos = np.where(t < peak, t / peak, 1 - (t - peak) / (1 - peak))
    pos = np.clip(pos, 0, 1)
    fc = f_lo * (f_hi / f_lo) ** (pos**1.15)
    bwc = bw * (0.85 + 0.35 * pos)
    L = sweep_filter(pink(n, r), fc, bwc)
    R = sweep_filter(pink(n, r), fc, bwc)
    env = swell(n, peak, a, d)
    st = widen(np.stack([L, R], 1), width) * env[:, None]
    st /= np.max(np.abs(st)) + 1e-12
    if tone > 0:
        # léger souffle tonal (sifflement du vent) qui suit la bande
        ph = 2 * np.pi * np.cumsum(fc * 0.5) / SR
        st += stereo(np.sin(ph) * env * tone)
    if sub > 0:
        sb = np.sin(2 * np.pi * np.cumsum(np.linspace(62, 41, n)) / SR) * swell(n, min(0.9, peak + 0.1), 1.2, 1.0)
        st += stereo(soft_clip(sb, 1.6) * sub)
    if pan_from or pan_to:
        st = pan(st, pan_from + (pan_to - pan_from) * t)
    st = reverb(st, wet=verb, size=0.3, tail=0.5)
    return norm(trim_tail(fade(st, 0.003, 0.02)))


def reverse_whoosh(dur: float = 0.6, seed: str = "rev") -> np.ndarray:
    w = whoosh(dur, 300, 3600, peak=0.6, seed=seed, verb=0.25, a=1.4, d=1.2)
    r = w[::-1].copy()
    # coupe nette à la fin (comme une aspiration)
    return norm(fade(r, 0.01, 0.006))


def whip(dur: float = 0.3, pan_from: float = 0.0, pan_to: float = 0.0, seed: str = "whip") -> np.ndarray:
    return whoosh(dur, 500, 5200, peak=0.45, bw=1.1, seed=seed, width=0.5, pan_from=pan_from, pan_to=pan_to, verb=0.1, a=1.3, d=1.8)


def whoosh_dive(dur: float = 0.5, seed: str = "dive") -> np.ndarray:
    n = n_of(dur)
    t = np.linspace(0, 1, n)
    base = whoosh(dur, 450, 3600, peak=0.4, seed=seed, verb=0.12, sub=0.35, a=1.3, d=1.2)
    # glissement tonal descendant (plongée)
    g = sine_glide(520, 140, dur) * swell(n, 0.45, 1.2, 1.4) * 0.22
    st = base[:n] + stereo(g)[: len(base[:n])]
    return norm(fade(st, 0.003, 0.02))


def fly_through(dur: float = 0.9, seed: str = "fly") -> np.ndarray:
    return whoosh(dur, 250, 4200, peak=0.5, bw=1.6, seed=seed, width=0.9, pan_from=-0.75, pan_to=0.75, sub=0.45, verb=0.18, a=2.2, d=1.6, tone=0.08)


def whooshes(seed: str = "ws") -> np.ndarray:
    out = silence(1.1)
    for k, (at, p) in enumerate([(0.0, -0.45), (0.15, 0.0), (0.3, 0.45)]):
        w = whoosh(0.5, 380, 3000 + 300 * k, peak=0.55, seed=f"{seed}{k}", pan_from=p * 0.6, pan_to=p, verb=0.12)
        place(out, w, at, 0.8)
    return norm(trim_tail(out))


def drag(dur: float = 1.1, seed: str = "drag") -> np.ndarray:
    n = n_of(dur)
    r = rng(seed)
    t = np.linspace(0, 1, n)
    fc = 1300 + 500 * np.sin(2 * np.pi * 0.7 * t)
    L = sweep_filter(pink(n, r), fc, np.full(n, 1.6))
    R = sweep_filter(pink(n, r), fc, np.full(n, 1.6))
    grain = 0.75 + 0.25 * sos_filter(r.standard_normal(n), "low", 18)
    grain /= np.max(np.abs(grain)) + 1e-9
    env = swell(n, 0.5, 0.8, 0.8) * (0.7 + 0.3 * grain)
    st = widen(np.stack([L, R], 1), 0.5) * env[:, None]
    return norm(fade(reverb(st, 0.08, tail=0.2), 0.03, 0.08))


# ───────────────────────── impacts ─────────────────────────
def impact(
    dur: float = 1.0,
    f0: float = 110,
    f1: float = 45,
    sweep: float = 14.0,
    decay: float = 0.35,
    click: float = 0.5,
    noise: float = 0.35,
    drive: float = 2.0,
    verb: float = 0.18,
    body: float = 0.35,
    seed: str = "impact",
) -> np.ndarray:
    n = n_of(dur)
    t = t_axis(n)
    r = rng(seed)
    s = sine_glide(f0, f1, dur, curve=sweep) * np.exp(-t / decay)
    s = soft_clip(s, drive)
    # partiel de corps (audible sur un haut-parleur de téléphone)
    b = sine_glide(f0 * 2.02, f1 * 2.4, dur, curve=sweep * 1.4) * np.exp(-t / (decay * 0.45)) * body
    # transitoire : clic + souffle filtré
    c = np.sin(2 * np.pi * 2400 * t) * np.exp(-t / 0.0025) * click
    nz = sos_filter(white(n, r), "low", 3000) * np.exp(-t / 0.03) * noise
    mono = s + b + c + nz
    st = widen(stereo(mono), 1.0)
    st = reverb(st, wet=verb, size=0.42, damp=0.6, tail=0.8)
    return norm(trim_tail(fade(st, 0.0005, 0.05)))


def impact_low(seed: str = "impact-low") -> np.ndarray:
    return impact(1.4, 92, 36, sweep=9.0, decay=0.55, click=0.35, noise=0.4, drive=1.8, verb=0.24, body=0.4, seed=seed)


def soft_impact(seed: str = "soft") -> np.ndarray:
    return impact(0.9, 96, 50, sweep=12, decay=0.3, click=0.15, noise=0.15, drive=1.3, verb=0.25, body=0.3, seed=seed)


def hit(seed: str = "hit") -> np.ndarray:
    n = n_of(0.45)
    t = t_axis(n)
    r = rng(seed)
    k = soft_clip(sine_glide(165, 52, 0.45, curve=40) * np.exp(-t / 0.16), 2.4)
    c = np.sin(2 * np.pi * 2200 * t) * np.exp(-t / 0.002) * 0.55
    sn = sos_filter(white(n, r), "high", 1200) * np.exp(-t / 0.018) * 0.3
    st = reverb(stereo(k + c + sn), wet=0.12, size=0.25, tail=0.4)
    return norm(trim_tail(fade(st, 0.0003, 0.03)))


def thunk(seed: str = "thunk") -> np.ndarray:
    n = n_of(0.32)
    t = t_axis(n)
    r = rng(seed)
    s = soft_clip(sine_glide(210, 85, 0.32, curve=30) * np.exp(-t / 0.07), 1.8)
    wood = sos_filter(white(n, r), "band", [700, 1300]) * np.exp(-t / 0.012) * 0.6
    st = reverb(stereo(s + wood), wet=0.1, size=0.2, tail=0.3)
    return norm(trim_tail(fade(st, 0.0003, 0.02)))


def impact_shimmer(seed: str = "ish") -> np.ndarray:
    base = impact(1.6, 108, 44, decay=0.38, verb=0.2, seed=seed)
    n = len(base)
    bl = bell(1318.5, n / SR, decay=0.65) + 0.8 * bell(1975.5, n / SR, decay=0.55)
    shim = fx(stereo(bl), pb.Chorus(rate_hz=0.9, depth=0.18, centre_delay_ms=8, feedback=0.0, mix=0.4))[:n]
    shim = reverb(shim, wet=0.3, size=0.5, tail=0.6)[:n]
    st = base + shim / (np.max(np.abs(shim)) + 1e-9) * 0.42
    return norm(trim_tail(st))


# ───────────────────────── interface ─────────────────────────
def tick(f: float = 3200, decay: float = 0.004, body_f: float = 520, body: float = 0.25, dur: float = 0.04, seed: str = "tick") -> np.ndarray:
    n = n_of(dur)
    t = t_axis(n)
    r = rng(seed)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t / decay)
    b = np.sin(2 * np.pi * body_f * t) * np.exp(-t / 0.012) * body
    nz = sos_filter(white(n, r), "high", 4000) * np.exp(-t / 0.0015) * 0.12
    st = stereo(s + b + nz)
    return norm(fade(st, 0.0002, 0.003))


def ui_tick(seed: str = "ui") -> np.ndarray:
    return norm(reverb(tick(3300, 0.004, 540, 0.28, seed=seed), wet=0.08, size=0.15, tail=0.15))


def click(seed: str = "click") -> np.ndarray:
    out = silence(0.12)
    place(out, tick(2600, 0.003, 820, 0.4, seed=seed + "a"), 0.0, 1.0)
    place(out, tick(3400, 0.002, 900, 0.25, seed=seed + "b"), 0.032, 0.45)
    return norm(trim_tail(reverb(out, wet=0.07, size=0.15, tail=0.12)))


def pop(f0: float = 300, f1: float = 900, dur: float = 0.06) -> np.ndarray:
    n = n_of(dur)
    t = t_axis(n)
    g = sine_glide(f0, f1, dur)
    env = np.minimum(1, t / 0.003) * np.exp(-t / 0.022)
    return stereo(g * env)


def pops(seed: str = "pops") -> np.ndarray:
    out = silence(0.4)
    for k, ratio in enumerate([1.0, 9 / 8, 5 / 4, 3 / 2]):
        place(out, pop(300 * ratio * 1.6, 900 * ratio * 1.6), 0.045 * k, 0.85)
    return norm(trim_tail(reverb(out, wet=0.1, size=0.2, tail=0.2)))


def glitch_blip(seed: str = "glitch") -> np.ndarray:
    r = rng(seed)
    out = silence(0.22)
    tt = 0.0
    freqs = [660, 880, 1320, 1760, 2640]
    while tt < 0.17:
        d = r.uniform(0.008, 0.024)
        f = freqs[r.integers(0, len(freqs))] * r.choice([0.5, 1.0, 1.0, 2.0])
        n = n_of(d)
        t = t_axis(n)
        sq = np.sign(np.sin(2 * np.pi * f * t)) * r.uniform(0.45, 1.0)
        place(out, stereo(fade(sq, 0.0008, 0.002)) * np.array([r.uniform(0.6, 1), r.uniform(0.6, 1)]), tt)
        tt += d + r.uniform(0.002, 0.008)
    out = fx(out, pb.Bitcrush(bit_depth=7), pb.LowpassFilter(cutoff_frequency_hz=6500), pb.HighpassFilter(cutoff_frequency_hz=300))
    return norm(trim_tail(reverb(out, wet=0.08, size=0.15, tail=0.15)))


def decode_chirps(dur: float = 0.8, seed: str = "decode") -> np.ndarray:
    r = rng(seed)
    out = silence(dur + 0.2)
    base = 1760
    k = 0
    tt = 0.0
    while tt < dur:
        f = base * PENTA[r.integers(0, 5)] * r.choice([1.0, 1.0, 1.5])
        n = n_of(0.016)
        g = sine_glide(f, f * r.choice([0.92, 1.08]), 0.016)
        env = np.minimum(1, t_axis(n) / 0.002) * np.exp(-t_axis(n) / 0.008)
        place(out, pan(stereo(g * env), r.uniform(-0.4, 0.4)), tt, r.uniform(0.5, 1.0) * (1 - 0.35 * tt / dur))
        tt += 0.05
        k += 1
    return norm(trim_tail(reverb(out, wet=0.14, size=0.25, tail=0.25)))


def counter_ticks(dur: float = 0.9, count: int = 20, seed: str = "count") -> np.ndarray:
    out = silence(dur + 0.15)
    xs = np.linspace(0, 1, 4001)
    ys = OUT_EXPO(xs)
    for k in range(1, count + 1):
        x = float(np.interp(k / count, ys, xs))
        place(out, tick(2500 + 700 * k / count, 0.003, 600, 0.2, dur=0.03, seed=f"{seed}{k}"), x * dur, 0.55 + 0.45 * (1 - k / count))
    return norm(trim_tail(reverb(out, wet=0.06, size=0.15, tail=0.12)))


def blips(count: int = 8, span: float = 0.7, seed: str = "blips") -> np.ndarray:
    out = silence(span + 0.25)
    for k in range(count):
        f = 1400 * (1.5 ** (k / max(1, count - 1)))
        n = n_of(0.05)
        t = t_axis(n)
        s = np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.004) * np.exp(-t / 0.02)
        place(out, pan(stereo(s), -0.5 + k / max(1, count - 1)), k * span / count, 0.8)
    return norm(trim_tail(reverb(out, wet=0.12, size=0.2, tail=0.2)))


def pings(seed: str = "pings") -> np.ndarray:
    out = silence(0.9)
    for k, at in enumerate([0.0, 0.22]):
        n = n_of(0.4)
        t = t_axis(n)
        s = sine_glide(1260, 1200, 0.4) * np.minimum(1, t / 0.002) * np.exp(-t / 0.13)
        place(out, stereo(s), at, 1.0 - 0.3 * k)
    return norm(trim_tail(reverb(out, wet=0.28, size=0.45, tail=0.5)))


def success_chime(seed: str = "success") -> np.ndarray:
    out = silence(1.3)
    place(out, stereo(bell(1046.5, 1.1, ratio=2.0, index=1.0, decay=0.45)), 0.0, 0.9)
    place(out, stereo(bell(1568.0, 1.1, ratio=2.0, index=1.0, decay=0.55)), 0.11, 1.0)
    out = fx(out, pb.Chorus(rate_hz=0.7, depth=0.12, centre_delay_ms=7, feedback=0.0, mix=0.3))
    return norm(trim_tail(reverb(out, wet=0.22, size=0.4, tail=0.6)))


def click_ding(seed: str = "cd") -> np.ndarray:
    out = silence(1.0)
    place(out, click(seed), 0.0, 1.0)
    place(out, stereo(bell(1760, 0.8, ratio=2.0, index=0.8, decay=0.32)), 0.03, 0.45)
    return norm(trim_tail(reverb(out, wet=0.15, size=0.3, tail=0.4)))


def marker(dur: float = 0.45, seed: str = "marker") -> np.ndarray:
    n = n_of(dur)
    r = rng(seed)
    t = np.linspace(0, 1, n)
    nz = sos_filter(white(n, r), "band", [2300, 6500], order=2)
    scratch = 0.6 + 0.4 * np.abs(sos_filter(r.standard_normal(n), "band", [35, 90]))
    scratch /= np.max(scratch)
    env = swell(n, 0.3, 0.7, 0.9) * scratch
    st = widen(stereo(nz * env), 0.3)
    return norm(fade(reverb(st, wet=0.06, size=0.15, tail=0.15), 0.01, 0.04))


def processing(dur: float = 1.9, seed: str = "proc") -> np.ndarray:
    n = n_of(dur)
    t = t_axis(n)
    r = rng(seed)
    hum = sum(a * np.sin(2 * np.pi * 98 * h * t) for h, a in [(1, 1.0), (2, 0.5), (3, 0.3), (5, 0.12)])
    hum *= 0.75 + 0.25 * np.sin(2 * np.pi * 7 * t)
    hum *= swell(n, 0.5, 0.35, 0.5) * 0.35
    out = stereo(hum)
    tt = 0.03
    while tt < dur - 0.08:
        f = r.uniform(1800, 4200)
        m = n_of(0.028)
        s = np.sin(2 * np.pi * f * t_axis(m)) * np.minimum(1, t_axis(m) / 0.003) * np.exp(-t_axis(m) / 0.01)
        place(out, pan(stereo(s), r.uniform(-0.6, 0.6)), tt, r.uniform(0.35, 0.8))
        tt += r.uniform(0.05, 0.11)
    return norm(fade(reverb(out, wet=0.1, size=0.2, tail=0.2), 0.08, 0.2))


def electric_sweep(dur: float = 1.5, seed: str = "elec") -> np.ndarray:
    n = n_of(dur)
    t = np.linspace(0, 1, n)
    r = rng(seed)
    f = 180 * (1500 / 180) ** (t**1.3)
    ph = 2 * np.pi * np.cumsum(f) / SR
    saw = sum(np.sin(h * ph) / h for h in range(1, 9))
    saw = sos_filter(saw, "low", 2400)
    band = sweep_filter(pink(n, r), f * 2.0, np.full(n, 1.0)) * 0.6
    crack = np.zeros(n)
    for _ in range(int(40 * dur)):
        i = r.integers(0, n - 300)
        m = r.integers(60, 250)
        crack[i : i + m] += r.uniform(-1, 1, m) * np.exp(-np.arange(m) / (m / 4))
    crack = sos_filter(crack, "high", 3000) * 0.35
    env = swell(n, 0.82, 1.4, 0.8)
    st = widen(np.stack([saw * 0.5 + band + crack, saw * 0.5 + band * 0.9 - crack], 1), 0.6) * env[:, None]
    return norm(fade(reverb(st, wet=0.16, size=0.35, tail=0.4), 0.02, 0.05))


def shimmer(dur: float = 1.2, seed: str = "shim") -> np.ndarray:
    r = rng(seed)
    out = silence(dur + 0.3)
    for k in range(70):
        tt = (r.random() ** 1.7) * dur
        f = 2637 * PENTA[r.integers(0, 5)] * r.choice([1.0, 1.0, 2.0, 0.5])
        m = n_of(r.uniform(0.03, 0.09))
        s = np.sin(2 * np.pi * f * t_axis(m)) * np.sin(np.pi * np.linspace(0, 1, m)) ** 2
        place(out, pan(stereo(s), r.uniform(-0.8, 0.8)), tt, r.uniform(0.2, 0.6) * (1 - 0.6 * tt / dur))
    place(out, stereo(bell(1318.5, dur, decay=0.5)) * 0.25, 0.0)
    place(out, stereo(bell(1975.5, dur, decay=0.45)) * 0.2, 0.06)
    out = fx(out, pb.Chorus(rate_hz=1.1, depth=0.2, centre_delay_ms=6, feedback=0.0, mix=0.35))
    return norm(trim_tail(reverb(out, wet=0.3, size=0.5, tail=0.6)))


def riser(dur: float = 2.2, seed: str = "riser") -> np.ndarray:
    n = n_of(dur)
    t = np.linspace(0, 1, n)
    r = rng(seed)
    fc = 200 * (4200 / 200) ** t
    nz = sweep_filter(pink(n, r), fc, np.full(n, 2.2))
    nz2 = sweep_filter(pink(n, r), fc * 1.03, np.full(n, 2.2))
    tone = sine_glide(200, 2000, dur) * 0.45 + sine_glide(201.5, 2015, dur) * 0.3
    env = (10 ** (-30 / 20)) ** (1 - t) * (t**0.3)
    st = np.stack([nz + tone, nz2 + tone], 1) * env[:, None]
    st = fx(st, pb.Chorus(rate_hz=3.5, depth=0.25, centre_delay_ms=5, feedback=0.0, mix=0.3))[:n]
    return norm(fade(st, 0.02, 0.003))


def kart_pass(dur: float = 1.1, seed: str = "kart") -> np.ndarray:
    n = n_of(dur)
    t = np.linspace(0, 1, n)
    r = rng(seed)
    f = 205 * (1 + 0.08 * np.tanh((0.5 - t) * 7))
    ph = 2 * np.pi * np.cumsum(f) / SR
    eng = sum(np.sin(h * ph + 0.3 * h) / h ** 0.9 for h in range(1, 14))
    eng *= 0.7 + 0.3 * np.tanh(3 * np.sin(ph / 2))  # caractère 2-temps
    eng = sos_filter(eng, "low", 3400)
    exhaust = sweep_filter(pink(n, r), f * 2.0, np.full(n, 1.2)) * 0.5
    env = swell(n, 0.52, 2.4, 2.0)
    mono = (eng / (np.max(np.abs(eng)) + 1e-9) + exhaust) * env
    st = pan(stereo(mono), -0.85 + 1.7 * t)
    return norm(fade(reverb(st, wet=0.18, size=0.5, tail=0.5), 0.02, 0.05))


def sonic_logo(seed: str = "sonic") -> np.ndarray:
    """Signature sonore (≈ 1,6 s) : impact grave et rond, scintillement en quinte, crépitement de l'éclair."""
    dur = 1.7
    n = n_of(dur)
    t = t_axis(n)
    r = rng(seed)
    low = soft_clip(sine_glide(86, 48, dur, curve=10) * np.exp(-t / 0.42), 1.6)
    body = sine_glide(172, 110, dur, curve=14) * np.exp(-t / 0.16) * 0.35
    zap = sine_glide(4200, 700, 0.07) * np.exp(-t_axis(n_of(0.07)) / 0.025) * 0.35
    out = stereo(low + body)
    place(out, stereo(zap), 0.0)
    for k in range(9):
        at = r.uniform(0.0, 0.22)
        m = n_of(r.uniform(0.003, 0.008))
        c = sos_filter(r.uniform(-1, 1, m), "high", 4500) * np.exp(-np.arange(m) / (m / 3))
        place(out, pan(stereo(c), r.uniform(-0.6, 0.6)), at, r.uniform(0.25, 0.55))
    bl = stereo(bell(1318.5, dur, ratio=3.5, index=1.4, decay=0.7) + 0.85 * bell(1975.5, dur, ratio=3.5, index=1.2, decay=0.6))
    bl = fx(bl, pb.Chorus(rate_hz=0.8, depth=0.16, centre_delay_ms=8, feedback=0.0, mix=0.4))[:n]
    place(out, bl * 0.32, 0.02)
    out = reverb(out, wet=0.24, size=0.5, damp=0.55, tail=0.7)
    return norm(trim_tail(fade(out, 0.0005, 0.08)))


# ───────────────────────── catalogue ─────────────────────────
LIBRARY = {
    "whoosh-soft": lambda: whoosh(0.6, 320, 1900, peak=0.5, seed="whoosh-soft", verb=0.16, a=1.8, d=1.3),
    "swish": lambda: whoosh(0.28, 900, 5200, peak=0.45, bw=1.0, seed="swish", width=0.5, verb=0.1, a=1.2, d=1.6),
    "swoosh": lambda: whoosh(0.45, 420, 3000, peak=0.5, seed="swoosh", verb=0.14),
    "whoosh": lambda: whoosh(0.5, 380, 3400, peak=0.55, seed="whoosh", verb=0.14),
    "whoosh-deep": lambda: whoosh(0.75, 220, 1700, peak=0.5, seed="whoosh-deep", sub=0.5, verb=0.2, bw=1.6),
    "whoosh-dive": lambda: whoosh_dive(0.5),
    "reverse-whoosh": lambda: reverse_whoosh(0.6),
    "whip": lambda: whip(0.3, -0.15, 0.15),
    "whip-lr": lambda: whip(0.3, -0.75, 0.75, seed="whip-lr"),
    "whip-rl": lambda: whip(0.3, 0.75, -0.75, seed="whip-rl"),
    "fly-through": lambda: fly_through(0.9),
    "whooshes": lambda: whooshes(),
    "drag": lambda: drag(1.1),
    "riser": lambda: riser(2.2),
    "riser-short": lambda: riser(0.8, seed="riser-short"),
    "impact-low": lambda: impact_low(),
    "impact": lambda: impact(),
    "soft-impact": lambda: soft_impact(),
    "hit": lambda: hit(),
    "thunk": lambda: thunk(),
    "impact-shimmer": lambda: impact_shimmer(),
    "ui-tick": lambda: ui_tick(),
    "click": lambda: click(),
    "pops": lambda: pops(),
    "glitch-blip": lambda: glitch_blip(),
    "decode-chirps": lambda: decode_chirps(0.8),
    "counter-ticks": lambda: counter_ticks(0.9),
    "blips": lambda: blips(),
    "pings": lambda: pings(),
    "success-chime": lambda: success_chime(),
    "click-ding": lambda: click_ding(),
    "marker": lambda: marker(),
    "processing": lambda: processing(1.9),
    "electric-sweep": lambda: electric_sweep(1.5),
    "shimmer": lambda: shimmer(1.2),
    "kart-pass": lambda: kart_pass(1.1),
    "tick-corner": lambda: norm(reverb(tick(2900, 0.0035, 560, 0.22, seed="corner"), wet=0.06, size=0.12, tail=0.1)),
    "sonic-logo": lambda: sonic_logo(),
}

# Sons dont la durée s'adapte au repère (paramètre `dur` du mixage).
PARAMETRIC = {
    "riser": lambda d: riser(d),
    "riser-short": lambda d: riser(d, seed="riser-short"),
    "processing": lambda d: processing(d),
    "decode-chirps": lambda d: decode_chirps(d),
    "counter-ticks": lambda d: counter_ticks(d),
    "drag": lambda d: drag(d),
    "electric-sweep": lambda d: electric_sweep(d),
    "whoosh": lambda d: whoosh(d, 380, 3400, peak=0.55, seed="whoosh-p"),
    "whip": lambda d: whip(d),
    "whip-lr": lambda d: whip(d, -0.75, 0.75, seed="whip-lr"),
    "whip-rl": lambda d: whip(d, 0.75, -0.75, seed="whip-rl"),
    "swoosh": lambda d: whoosh(d, 420, 3000, peak=0.5, seed="swoosh-p"),
    "whoosh-dive": lambda d: whoosh_dive(d),
    "reverse-whoosh": lambda d: reverse_whoosh(d),
    "shimmer": lambda d: shimmer(d),
}

CATEGORY = {
    # crête visée au mixage (dBFS), avant normalisation du bus
    "impact-low": -6, "impact": -6, "impact-shimmer": -6, "sonic-logo": -6, "hit": -8, "soft-impact": -9, "thunk": -12,
    "whoosh-soft": -14, "swish": -15, "swoosh": -13, "whoosh": -12, "whoosh-deep": -11, "whip": -12, "whip-lr": -12, "whip-rl": -12,
    "whoosh-dive": -12, "reverse-whoosh": -13, "fly-through": -10, "whooshes": -13, "drag": -21,
    "riser": -10, "riser-short": -11, "electric-sweep": -16, "shimmer": -16, "kart-pass": -15,
    "ui-tick": -18, "click": -16, "pops": -18, "glitch-blip": -16, "decode-chirps": -20, "counter-ticks": -20, "blips": -20,
    "pings": -18, "success-chime": -14, "click-ding": -14, "marker": -20, "tick-corner": -21, "processing": -22,
}

# Pré-roll (images à 60 i/s) : les souffles commencent un peu avant le mouvement.
PREROLL_FRAMES = {k: 3 for k in CATEGORY if any(w in k for w in ("whoosh", "swish", "swoosh", "whip", "fly", "drag"))}


# ───────────────────────── nappe d'ambiance (pas une musique) ─────────────────────────
def bed(duration: float, drop: float, brk: float | None, hit: float | None, end_fade: tuple[float, float], bpm: float = 120, seed: str = "bed") -> np.ndarray:
    """
    Nappe discrète qui lie les effets : pulsation grave + tic-tac de chrono avant le drop,
    souffle d'air filtré ensuite, filtre qui se ferme pendant le break, queue au fondu.
    """
    n = n_of(duration)
    r = rng(seed)
    t = t_axis(n)
    beat = 60 / bpm
    out = np.zeros((n, 2))
    # 1) Intro : sub qui pulse sur chaque temps + tic-tac sur les croches, crescendo.
    k = 0
    while k * beat < drop - 0.05:
        at = k * beat
        cres = 0.35 + 0.65 * (at / max(drop, 1e-6)) ** 1.5
        m = n_of(0.4)
        tm = t_axis(m)
        pulse = soft_clip(np.sin(2 * np.pi * 55 * tm) * np.exp(-tm / 0.16), 1.8) + 0.25 * np.sin(2 * np.pi * 110 * tm) * np.exp(-tm / 0.08)
        place(out, stereo(pulse * np.minimum(1, tm / 0.004)), at, 0.55 * cres)
        for half in (0.0, 0.5):
            hh = sos_filter(white(n_of(0.03), r), "high", 7000) * np.exp(-t_axis(n_of(0.03)) / 0.006)
            place(out, pan(stereo(hh), 0.25 if half else -0.25), at + half * beat, 0.16 * cres * (1.0 if half == 0 else 0.7))
        k += 1
    # 2) Souffle d'air (après le drop), légèrement mouvant.
    air_l = pink(n, r)
    air_r = pink(n, r)
    cutoff = 700 + 350 * np.sin(2 * np.pi * 0.07 * t + 1.0)
    if brk is not None and hit is not None:
        close = np.clip((t - brk) / max(hit - brk, 1e-6), 0, 1)
        cutoff = cutoff * (1 - 0.7 * close * (t < hit))
    air = np.stack([sweep_filter(air_l, cutoff, np.full(n, 2.4)), sweep_filter(air_r, cutoff * 1.05, np.full(n, 2.4))], 1)
    air /= np.max(np.abs(air)) + 1e-9
    lvl = np.clip((t - drop) / 0.6, 0, 1) * 0.11
    if brk is not None and hit is not None:
        lvl = lvl * np.where((t >= brk) & (t < hit), 0.7, 1.0)
    out += air * lvl[:, None]
    # 3) Break : pulsation grave à mi-niveau.
    if brk is not None and hit is not None:
        k = 0
        while brk + k * beat < hit - 0.1:
            at = brk + k * beat
            m = n_of(0.35)
            tm = t_axis(m)
            pulse = soft_clip(np.sin(2 * np.pi * 52 * tm) * np.exp(-tm / 0.14), 1.6)
            place(out, stereo(pulse), at, 0.3)
            k += 1
    # 4) Fondu de fin.
    f0, f1 = end_fade
    g = np.clip(1 - (t - f0) / max(f1 - f0, 1e-6), 0, 1)
    return out * g[:, None]


def pad_bed(duration: float, end_fade: tuple[float, float], seed: str = "pad") -> np.ndarray:
    """
    Nappe douce (v2) : accord ouvert de ré (ré-la-ré-la-do#-mi) en sinus légèrement désaccordés,
    attaque lente, filtre passe-bas qui respire, souffle à peine audible. Aucune pulsation, aucun tic.
    """
    n = n_of(duration)
    r = rng(seed)
    t = t_axis(n)
    voices = [(73.42, 0.55), (110.0, 0.45), (146.83, 0.35), (220.0, 0.22), (277.18, 0.12), (329.63, 0.10)]
    out = np.zeros((n, 2))
    for k, (f, a) in enumerate(voices):
        for ch, det in ((0, 1 - 0.0016), (1, 1 + 0.0016)):
            ph = r.uniform(0, 2 * np.pi)
            lfo = 1 + 0.18 * np.sin(2 * np.pi * (0.07 + 0.013 * k) * t + ph)
            out[:, ch] += a * lfo * (np.sin(2 * np.pi * f * det * t + ph) + 0.18 * np.sin(4 * np.pi * f * det * t + ph))
    out = sos_filter(out, "low", 1400)
    air = np.stack([sos_filter(pink(n, r), "low", 900), sos_filter(pink(n, r), "low", 950)], 1)
    air /= np.max(np.abs(air)) + 1e-9
    out /= np.max(np.abs(out)) + 1e-9
    out = out + 0.08 * air
    g = np.clip(t / 1.2, 0, 1) ** 2
    f0, f1 = end_fade
    g *= np.clip(1 - (t - f0) / max(f1 - f0, 1e-6), 0, 1)
    return out * g[:, None]
