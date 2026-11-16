#!/usr/bin/env python3
"""
Convertit les repères son des deux films (src/audio/cues.json + ticks de virage de cues.ts)
au format du mixeur, avec la signature sonore sur chaque apparition du logo.

  python3 film_cues.py <dossier de sortie>   → cues-film-16x9.json, cues-film-9x16.json
"""
import json
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
SRC = os.path.join(PROJECT, "src")

cues = json.load(open(os.path.join(SRC, "audio", "cues.json"), encoding="utf-8"))
lap = json.load(open(os.path.join(SRC, "data", "adria-lap.json"), encoding="utf-8"))
PTS = lap["points"]
LAP_T9 = lap["lapTimesS"]["T9"]


def bez(p1x, p1y, p2x, p2y):
    s = np.linspace(0, 1, 4001)
    bx = 3 * p1x * s * (1 - s) ** 2 + 3 * p2x * s**2 * (1 - s) + s**3
    by = 3 * p1y * s * (1 - s) ** 2 + 3 * p2y * s**2 * (1 - s) + s**3
    return bx, by


BX, BY = bez(0.3, 0, 0.7, 1)


def corner_ticks(start, end):
    """Mêmes calculs que cornerTicks() de cues.ts : instant où le Tour 4 passe chaque virage."""
    out = []
    deltas = [PTS[c["i"]][4] - PTS[c["i"]][3] for c in lap["corners"]]
    dmax = max(max(deltas), 1e-6)
    for c, dl in zip(lap["corners"], deltas):
        y = PTS[c["i"]][3] / LAP_T9
        x = float(np.interp(y, BY, BX))
        t = start + (end - start) * x
        out.append({"t": round(t, 3), "file": "tick-corner", "pitch": round(7 * max(0, dl) / dmax, 2), "pan": round(-0.3 + 0.6 * c["n"] / 12, 2), "note": f"virage {c['n']}"})
    return out


OVERRIDES = {
    "16x9": {
        (7.75, "riser"): {"dur": 2.2, "pre": 0},
        (41.3, "riser-short"): {"dur": 0.68, "pre": 0},
        (18.0, "processing"): {"dur": 1.85},
        (12.55, "decode-chirps"): {"dur": 0.75},
        (20.55, "counter-ticks"): {"dur": 0.9},
        (15.3, "drag"): {"dur": 1.1},
        (32.7, "whip"): {"file": "whip-rl"},
        (10.0, "impact-shimmer"): {"file": "sonic-logo"},
        (42.0, "impact-shimmer"): {"file": "sonic-logo"},
    },
    "9x16": {
        (5.2, "riser-short"): {"dur": 0.76, "pre": 0},
        (21.6, "riser-short"): {"dur": 0.38, "pre": 0},
        (10.05, "processing"): {"dur": 1.05},
        (7.02, "decode-chirps"): {"dur": 0.6},
        (11.55, "counter-ticks"): {"dur": 0.8},
        (8.6, "drag"): {"dur": 0.8},
        (13.7, "whip"): {"file": "whip-rl"},
        (6.0, "impact-shimmer"): {"file": "sonic-logo"},
        (22.0, "impact-shimmer"): {"file": "sonic-logo"},
    },
}

FILMS = {
    "16x9": {"duration": 46.0, "duel": (4.1, 6.1), "bed": {"drop": 10.0, "break": 39.0, "hit": 42.0, "fade": [45.0, 46.0]}, "fade_out": [45.0, 46.0]},
    "9x16": {"duration": 24.0, "duel": (3.0, 4.6), "bed": {"drop": 6.0, "break": 20.5, "hit": 22.0, "fade": [23.6, 24.0]}, "fade_out": [23.6, 24.0]},
}


def build(fmt):
    f = FILMS[fmt]
    out = []
    silences = []
    for c in cues[fmt]:
        if c["kind"] == "silence":
            silences.append(c["t"])
            continue
        if c["kind"] != "sfx" or not c.get("file"):
            continue
        cue = {"t": c["t"], "file": c["file"], "note": c.get("name", "")}
        cue.update(OVERRIDES[fmt].get((c["t"], c["file"]), {}))
        out.append(cue)
    out += corner_ticks(*f["duel"])
    out.sort(key=lambda x: x["t"])
    return {"duration": f["duration"], "fps": 60, "bed": f["bed"], "silences": silences, "fade_out": f["fade_out"], "cues": out}


if __name__ == "__main__":
    dst = sys.argv[1] if len(sys.argv) > 1 else "."
    os.makedirs(dst, exist_ok=True)
    for fmt in ("16x9", "9x16"):
        cfg = build(fmt)
        p = os.path.join(dst, f"cues-film-{fmt}.json")
        json.dump(cfg, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(p, len(cfg["cues"]), "repères", "silences", cfg["silences"])
