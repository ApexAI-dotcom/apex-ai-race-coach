#!/usr/bin/env python3
"""
Mixeur ApexAI : place les effets sur une liste de repères, ajoute la nappe, traite le bus
(compression douce + limiteur true-peak), normalise à −14 LUFS et assemble avec la vidéo.

  python3 mix.py cues.json --wav out.wav [--video in.mp4 --mux out-son.mp4] [--ig out-ig.mp4] [--music music.mp3]

Format de cues.json :
{
  "duration": 24.0, "fps": 60,
  "bed": {"drop": 6.0, "break": 20.5, "hit": 22.0, "fade": [23.6, 24.0]},   (ou null)
  "silences": [5.967],                       (2 images de silence avant un drop)
  "cues": [{"t": 0.1, "file": "whoosh-soft", "gain": -14, "pan": 0, "pitch": 0, "dur": null, "pre": 3}]
}
"""
import argparse
import json
import os
import subprocess
import sys

import numpy as np
import pedalboard as pb
import pyloudnorm as pyln
import soundfile as sf
from scipy import ndimage, signal

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import sfxlib as S  # noqa: E402

SR = S.SR


def load_lib(root):
    lib = {}
    sfx_dir = os.path.join(root, "out", "07-son", "sfx")
    for f in os.listdir(sfx_dir):
        if f.endswith(".wav"):
            x, sr = sf.read(os.path.join(sfx_dir, f), always_2d=True)
            assert sr == SR
            lib[f[:-4]] = x
    logo = os.path.join(root, "out", "07-son", "sonic-logo.wav")
    if os.path.exists(logo):
        lib["sonic-logo"], _ = sf.read(logo, always_2d=True)
    return lib


def pitch_shift(x, semis):
    if abs(semis) < 1e-3:
        return x
    r = 2 ** (semis / 12)
    n = int(len(x) / r)
    src = np.arange(n) * r
    return np.stack([np.interp(src, np.arange(len(x)), x[:, c]) for c in range(2)], 1)


def true_peak(x, os_factor=4):
    up = signal.resample_poly(x, os_factor, 1, axis=0)
    return 20 * np.log10(np.max(np.abs(up)) + 1e-12)


def tp_limit(x, ceiling_db=-1.2, lookahead_ms=4.0, release_ms=90.0, os_factor=4):
    up = signal.resample_poly(x, os_factor, 1, axis=0)
    n = len(x)
    peak = np.max(np.abs(up[: n * os_factor]).reshape(n, os_factor, 2), axis=(1, 2))
    ceiling = 10 ** (ceiling_db / 20)
    need = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    la = max(1, int(lookahead_ms * SR / 1000))
    g = ndimage.minimum_filter1d(need, size=2 * la + 1, mode="nearest")
    rel = np.exp(-1.0 / (release_ms * SR / 1000))
    out = np.empty_like(g)
    prev = 1.0
    for i in range(n):
        gi = g[i]
        prev = gi if gi < prev else rel * prev + (1 - rel) * gi
        out[i] = prev
    # lissage de l'attaque (évite la distorsion de la réduction instantanée)
    out = ndimage.uniform_filter1d(out, size=la, mode="nearest")
    return x * out[:, None]


def build(cfg, lib, music=None):
    dur = float(cfg["duration"])
    fps = float(cfg.get("fps", 60))
    n = S.n_of(dur)
    mix = np.zeros((n, 2))
    cache = {}
    for c in cfg["cues"]:
        name = c["file"]
        d = c.get("dur")
        key = (name, d)
        if key not in cache:
            if d and name in S.PARAMETRIC:
                cache[key] = np.asarray(S.PARAMETRIC[name](float(d)), dtype=float)
            else:
                cache[key] = lib[name]
        x = cache[key]
        if d and name not in S.PARAMETRIC:
            m = min(len(x), S.n_of(d))
            x = S.fade(x[:m].copy(), 0.0, min(0.15, d * 0.3))
        x = pitch_shift(x, c.get("pitch", 0.0))
        p = c.get("pan", 0.0)
        if p:
            x = S.pan(x, p)
        gain_db = c.get("gain")
        if gain_db is None:
            gain_db = S.CATEGORY.get(name, -14)
        pre = c.get("pre")
        if pre is None:
            pre = S.PREROLL_FRAMES.get(name, 0)
        at = float(c["t"]) - pre / fps
        S.place(mix, x, max(0.0, at), 10 ** (gain_db / 20))
    bed = cfg.get("bed")
    if bed:
        if bed.get("style") == "pad":
            b = S.pad_bed(dur, tuple(bed["fade"]))
        else:
            b = S.bed(dur, bed["drop"], bed.get("break"), bed.get("hit"), tuple(bed["fade"]))
        mix += b * 10 ** (bed.get("gain", -8) / 20)
    if music:
        m, sr = sf.read(music, always_2d=True)
        if sr != SR:
            m = signal.resample_poly(m, SR, sr, axis=0)
        m = m[:n]
        mix *= 10 ** (-6 / 20)  # les effets passent sous la musique
        S.place(mix, m, 0.0, 10 ** (-3 / 20))
    # bus
    mix = S.sos_filter(mix, "high", 28)
    if cfg.get("soft"):
        # v2 « doux » : aigus adoucis, petite réverbération qui lie les sons entre eux
        mix = S.fx(mix, pb.HighShelfFilter(cutoff_frequency_hz=4500, gain_db=-5.0), pb.LowpassFilter(cutoff_frequency_hz=11000),
                   pb.Reverb(room_size=0.35, damping=0.7, wet_level=0.12, dry_level=0.9, width=1.0))[:n]
    mix = S.fx(mix, pb.Compressor(threshold_db=-20, ratio=2.0, attack_ms=8, release_ms=160))[:n]
    # fondu final et silences avant les drops
    env = np.ones(n)
    for s0 in cfg.get("silences", []):
        a, b = S.n_of(s0), S.n_of(s0 + 2 / fps)
        r = S.n_of(0.002)
        env[max(0, a - r) : a] *= np.linspace(1, 0, min(r, a))
        env[a:b] = 0
        env[b : b + r] *= np.linspace(0, 1, len(env[b : b + r]))
    fo = cfg.get("fade_out")
    if fo:
        t = np.arange(n) / SR
        env *= np.clip(1 - (t - fo[0]) / max(fo[1] - fo[0], 1e-6), 0, 1)
    mix *= env[:, None]
    # loudness
    meter = pyln.Meter(SR)
    target = cfg.get("lufs", -14.0)
    for _ in range(4):
        lufs = meter.integrated_loudness(mix)
        mix = mix * 10 ** ((target - lufs) / 20)
        mix = tp_limit(mix, -1.2)
    lufs = meter.integrated_loudness(mix)
    tp = true_peak(mix)
    return mix.astype(np.float32), lufs, tp


def ffmpeg(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cues")
    ap.add_argument("--root", default=os.environ.get("APEX_SOCIAL", os.path.join(HERE, "..", "..", "..", "..", "..", "apex-social")))
    ap.add_argument("--wav", required=True)
    ap.add_argument("--video")
    ap.add_argument("--mux")
    ap.add_argument("--ig")
    ap.add_argument("--music")
    a = ap.parse_args()
    cfg = json.load(open(a.cues, encoding="utf-8"))
    lib = load_lib(os.path.abspath(a.root))
    mix, lufs, tp = build(cfg, lib, a.music)
    os.makedirs(os.path.dirname(os.path.abspath(a.wav)), exist_ok=True)
    sf.write(a.wav, mix, SR, subtype="PCM_24")
    print(f"{os.path.basename(a.wav)} : {lufs:.1f} LUFS intégrés, crête vraie {tp:.1f} dBTP, {len(mix) / SR:.2f} s")
    if a.video and a.mux:
        os.makedirs(os.path.dirname(os.path.abspath(a.mux)), exist_ok=True)
        ffmpeg("-i", a.video, "-i", a.wav, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-shortest", "-movflags", "+faststart", a.mux)
        print(f"  → {a.mux}")
    if a.video and a.ig:
        os.makedirs(os.path.dirname(os.path.abspath(a.ig)), exist_ok=True)
        ffmpeg(
            "-i", a.video, "-i", a.wav, "-map", "0:v:0", "-map", "1:a:0",
            "-vf", "fps=30", "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", "17", "-maxrate", "14M", "-bufsize", "28M",
            "-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
            "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-shortest", "-movflags", "+faststart", a.ig,
        )
        print(f"  → {a.ig}")


if __name__ == "__main__":
    main()
