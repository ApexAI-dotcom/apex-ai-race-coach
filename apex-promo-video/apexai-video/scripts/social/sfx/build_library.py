#!/usr/bin/env python3
"""
Exporte la bibliothèque d'effets ApexAI :
  - WAV 48 kHz / 24 bits dans <apex-social>/out/07-son/sfx/ (+ sonic-logo.wav dans out/07-son/)
  - MP3 320 kb/s dans public/sfx/ (lus par Remotion si FLAGS.withSfx)
  - une planche de spectrogrammes pour contrôle visuel

Usage : python3 scripts/social/sfx/build_library.py <dossier apex-social>
"""
import os
import subprocess
import sys

import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import sfxlib as S  # noqa: E402

PROJECT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
OUT = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(PROJECT, "..", "..", "apex-social")
WAV_DIR = os.path.join(OUT, "out", "07-son", "sfx")
MP3_DIR = os.path.join(PROJECT, "public", "sfx")
os.makedirs(WAV_DIR, exist_ok=True)
os.makedirs(MP3_DIR, exist_ok=True)


def main():
    rows = []
    for name, fn in S.LIBRARY.items():
        x = fn()
        if name == "sonic-logo":
            path = os.path.join(OUT, "out", "07-son", "sonic-logo.wav")
        else:
            path = os.path.join(WAV_DIR, f"{name}.wav")
        sf.write(path, x, S.SR, subtype="PCM_24")
        mp3 = os.path.join(MP3_DIR, f"{name}.mp3")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-c:a", "libmp3lame", "-b:a", "320k", mp3], check=True)
        peak = 20 * np.log10(np.max(np.abs(x)) + 1e-12)
        rms = 20 * np.log10(np.sqrt(np.mean(x**2)) + 1e-12)
        rows.append((name, len(x) / S.SR, peak, rms))
        print(f"{name:16s} {len(x) / S.SR:5.2f} s  crête {peak:6.1f} dBFS  RMS {rms:6.1f} dBFS")
    print(f"{len(rows)} sons")


if __name__ == "__main__":
    main()
