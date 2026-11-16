#!/usr/bin/env python3
"""
Planche de contrôle de la synchro : forme d'onde globale avec les repères,
puis une vignette par repère (image de la vidéo à cet instant + forme d'onde ±0,4 s).

  python3 sync_sheet.py cues.json mix.wav video.mp4 out.png
"""
import json
import os
import subprocess
import sys
import tempfile

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import soundfile as sf  # noqa: E402
from PIL import Image  # noqa: E402

cues_p, wav_p, video_p, out_p = sys.argv[1:5]
cfg = json.load(open(cues_p, encoding="utf-8"))
x, sr = sf.read(wav_p, always_2d=True)
m = x.mean(1)
dur = len(m) / sr
cues = cfg["cues"]

tmp = tempfile.mkdtemp()
thumbs = []
for k, c in enumerate(cues):
    t = min(max(0.0, c["t"]), dur - 0.02)
    p = os.path.join(tmp, f"{k:03d}.jpg")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", video_p, "-frames:v", "1", "-vf", "scale=-2:200", p], check=True)
    thumbs.append(p)

cols = 6
rows = (len(cues) + cols - 1) // cols
fig = plt.figure(figsize=(cols * 3.1, 2.4 + rows * 2.75), facecolor="#0A0A0A")
gs = fig.add_gridspec(rows * 2 + 1, cols, height_ratios=[1.6] + [1.9, 0.75] * rows, hspace=0.35, wspace=0.08)
ax = fig.add_subplot(gs[0, :])
t = np.arange(len(m)) / sr
ax.plot(t, x[:, 0], color="#FF4242", lw=0.3, alpha=0.8)
ax.plot(t, x[:, 1], color="#FF9933", lw=0.3, alpha=0.5)
for c in cues:
    ax.axvline(c["t"], color="#FAFAFA", lw=0.4, alpha=0.35)
for s0 in cfg.get("silences", []):
    ax.axvspan(s0, s0 + 2 / cfg.get("fps", 60), color="#22C55E", alpha=0.6)
ax.set_xlim(0, dur)
ax.set_facecolor("#0A0A0A")
ax.tick_params(colors="#999", labelsize=7)
ax.set_title(f"{os.path.basename(wav_p)} — {len(cues)} repères (traits blancs), silences avant drop (vert)", color="#FAFAFA", fontsize=10, loc="left")
for k, c in enumerate(cues):
    r, col = divmod(k, cols)
    a1 = fig.add_subplot(gs[1 + r * 2, col])
    a1.imshow(Image.open(thumbs[k]))
    a1.axis("off")
    a1.set_title(f"{c['t']:.2f} s · {c['file']}", color="#FAFAFA", fontsize=7)
    a2 = fig.add_subplot(gs[2 + r * 2, col])
    i0, i1 = int(max(0, (c["t"] - 0.4) * sr)), int(min(len(m), (c["t"] + 0.4) * sr))
    tt = np.arange(i0, i1) / sr - c["t"]
    a2.plot(tt, m[i0:i1], color="#FF4242", lw=0.5)
    a2.axvline(0, color="#FAFAFA", lw=0.8)
    a2.set_xlim(-0.4, 0.4)
    a2.set_ylim(-1, 1)
    a2.axis("off")
fig.savefig(out_p, dpi=80, facecolor="#0A0A0A")
print(out_p)
