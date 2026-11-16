#!/usr/bin/env python3
"""
Repères son des nouvelles vidéos (reels, stories, stings, pubs), calés sur les timecodes des compositions.

  python3 reel_cues.py <dossier de sortie>   → cues-<id>.json
"""
import json
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
lap = json.load(open(os.path.join(PROJECT, "src", "data", "adria-lap.json"), encoding="utf-8"))
film = json.load(open(os.path.join(HERE, "..", "..", "..", "src", "audio", "cues.json"), encoding="utf-8"))
PTS = lap["points"]
N = len(PTS)
CORNERS = lap["corners"]
LAP_T9 = lap["lapTimesS"]["T9"]


def bez(p1x, p1y, p2x, p2y):
    s = np.linspace(0, 1, 4001)
    bx = 3 * p1x * s * (1 - s) ** 2 + 3 * p2x * s**2 * (1 - s) + s**3
    by = 3 * p1y * s * (1 - s) ** 2 + 3 * p2y * s**2 * (1 - s) + s**3
    return bx, by


IN_OUT = bez(0.65, 0, 0.35, 1)
DUEL = bez(0.3, 0, 0.7, 1)


def inv(curve, y):
    bx, by = curve
    return float(np.interp(y, by, bx))


def c(t, f, **kw):
    d = {"t": round(t, 3), "file": f}
    d.update(kw)
    return d


def film_cues(fmt, a, b, offset):
    """Repères du film 9:16 compris dans [a, b), décalés de `offset` (impact-shimmer → signature sonore)."""
    out = []
    for x in film[fmt]:
        if x["kind"] != "sfx" or not x.get("file"):
            continue
        if a <= x["t"] < b:
            f = "sonic-logo" if x["file"] == "impact-shimmer" else x["file"]
            out.append(c(x["t"] + offset, f, note=x.get("name", "")))
    return out


def g4():
    cues = [c(0.0, "soft-impact"), c(0.25, "swish"), c(0.5, "swish", pitch=2), c(1.2, "whoosh"), c(1.42, "electric-sweep", dur=2.0)]
    for k, co in enumerate(CORNERS):
        t = 1.45 + 2.0 * inv(IN_OUT, co["i"] / N)
        cues.append(c(t, "tick-corner", gain=-25, pitch=round(6 * k / 11, 2), pan=round(-0.3 + 0.6 * k / 11, 2)))
    for i in range(12):
        cues.append(c(3.75 + i * 0.15, "tick-corner", gain=-20, pitch=i, note=f"mini-secteur {i + 1}"))
    cues += [
        c(3.8, "shimmer", dur=2.0),
        c(4.2, "ui-tick"),
        c(6.5, "glitch-blip", gain=-18),
        c(6.6, "impact", gain=-7),
        c(7.0, "ui-tick"),
        c(8.5, "swoosh"),
        c(8.65, "swish"),
        c(9.55, "swish", pitch=-2),
        c(10.7, "reverse-whoosh", dur=0.4),
        c(11.0, "sonic-logo"),
        c(11.4, "ui-tick"),
        c(12.05, "click-ding"),
        c(13.0, "whoosh-soft"),
        c(13.3, "swish"),
    ]
    return {"duration": 14.0, "fps": 60, "bed": {"drop": 1.25, "break": None, "hit": None, "fade": [13.6, 14.0]}, "fade_out": [13.75, 14.0], "cues": sorted(cues, key=lambda x: x["t"])}


def g7():
    start, end = 1.3, 4.4
    cues = [c(0.0, "impact-low", gain=-8), c(0.95, "whoosh"), c(1.4, "riser", dur=3.0, gain=-17, note="tension du duel")]
    deltas = [PTS[co["i"]][4] - PTS[co["i"]][3] for co in CORNERS]
    dmax = max(max(deltas), 1e-6)
    for co, dl in zip(CORNERS, deltas):
        y = PTS[co["i"]][3] / LAP_T9
        t = start + (end - start) * inv(DUEL, y)
        cues.append(c(t, "tick-corner", pitch=round(7 * max(0, dl) / dmax, 2), pan=round(-0.3 + 0.6 * co["n"] / 12, 2), note=f"virage {co['n']}"))
    cues += [
        c(4.45, "impact", gain=-8),
        c(4.88, "hit"),
        c(5.2, "whoosh-dive"),
        c(5.5, "pings"),
        c(5.72, "soft-impact", gain=-12, note="+0,28 s au virage 2"),
        c(6.45, "swish", pitch=-2),
        c(6.7, "swoosh"),
        c(7.3, "ui-tick"),
        c(7.9, "marker", gain=-19),
        c(9.0, "swoosh"),
        c(9.6, "ui-tick"),
        c(10.4, "reverse-whoosh", dur=0.3),
        c(10.7, "sonic-logo"),
        c(11.75, "click-ding"),
        c(12.45, "whoosh-soft"),
        c(12.65, "swish"),
    ]
    return {"duration": 13.5, "fps": 60, "bed": {"drop": 1.25, "break": None, "hit": None, "fade": [13.1, 13.5]}, "fade_out": [13.25, 13.5], "cues": sorted(cues, key=lambda x: x["t"])}


def dnmp():
    cues = [
        c(0.0, "soft-impact"),
        c(1.2, "whoosh"),
        c(1.45, "swish"),
        c(1.5, "pops"),
        c(2.4, "ui-tick"),
        c(3.65, "whoosh"),
        c(3.9, "swoosh"),
        c(4.15, "swish"),
        c(4.7, "ui-tick"),
        c(6.1, "whoosh"),
        c(6.4, "swish"),
        c(7.3, "swish", pitch=2),
        c(9.1, "reverse-whoosh", dur=0.3),
        c(9.35, "soft-impact", gain=-12),
        c(10.6, "whoosh-soft"),
        c(10.85, "sonic-logo"),
        c(11.9, "click-ding"),
        c(12.2, "whoosh-soft"),
        c(12.45, "swish"),
    ]
    return {"duration": 13.0, "fps": 60, "bed": {"drop": 1.2, "break": None, "hit": None, "fade": [12.6, 13.0]}, "fade_out": [12.75, 13.0], "cues": cues}


def s1():
    cues = film_cues("9x16", 6.0, 8.05, -6.0)
    for x in cues:
        if x["file"] == "decode-chirps":
            x["dur"] = 0.6
    cues += [c(1.95, "swoosh"), c(2.2, "swish"), c(2.4, "swish", pitch=2), c(3.0, "ui-tick"), c(3.25, "ui-tick")]
    return {"duration": 6.0, "fps": 60, "bed": {"drop": 0.0, "break": None, "hit": None, "fade": [5.6, 6.0]}, "fade_out": [5.7, 6.0], "cues": sorted(cues, key=lambda x: x["t"])}


def s3():
    off = 1.3 - 8.5
    cues = [c(0.0, "soft-impact"), c(0.2, "swish"), c(1.15, "whoosh")]
    for x in film_cues("9x16", 8.5, 13.65, off):
        if x["file"] == "drag":
            x["dur"] = 0.8
        if x["file"] == "processing":
            x["dur"] = 1.05
        if x["file"] == "counter-ticks":
            x["dur"] = 0.8
        cues.append(x)
    cues += [c(6.45, "whoosh"), c(6.75, "sonic-logo")]
    return {"duration": 8.5, "fps": 60, "bed": {"drop": 0.0, "break": None, "hit": None, "fade": [8.1, 8.5]}, "fade_out": [8.2, 8.5], "cues": sorted(cues, key=lambda x: x["t"])}


def sting():
    return {"duration": 2.5, "fps": 60, "bed": None, "fade_out": [2.3, 2.5], "cues": [c(0.0, "sonic-logo"), c(0.22, "glitch-blip", gain=-20), c(1.35, "ui-tick")]}


def pub_g1():
    segs = [(0.0, 8.0), (11.6, 13.6), (14.05, 17.6), (22.0, 24.0)]
    xf = 0.3
    t = 0.0
    cues = []
    starts = []
    for i, (a, b) in enumerate(segs):
        starts.append(t)
        cues += film_cues("9x16", a, b, t - a)
        t += b - a - (xf if i < len(segs) - 1 else 0)
    dur = starts[-1] + (segs[-1][1] - segs[-1][0])
    for s0 in starts[1:]:
        cues.append(c(s0 - 0.1, "whoosh-soft", note="raccord"))
    for x in cues:
        if x["file"] == "riser-short" and abs(x["t"] - 5.2) < 0.01:
            x["dur"] = 0.76
            x["pre"] = 0
        if x["file"] == "decode-chirps":
            x["dur"] = 0.6
        if x["file"] == "counter-ticks":
            x["dur"] = 0.8
        if x["file"] == "whip" and abs(x["t"] - (starts[1] + 13.7 - 11.6)) < 0.05:
            x["file"] = "whip-rl"
    hit = starts[-1]
    return {
        "duration": round(dur, 3),
        "fps": 60,
        "bed": {"drop": 6.0, "break": None, "hit": None, "fade": [dur - 0.4, dur]},
        "silences": [5.967],
        "fade_out": [dur - 0.4, dur],
        "cues": sorted(cues, key=lambda x: x["t"]),
        "note": f"segments du film 9:16 {segs}, hit final à {hit:.2f} s",
    }


if __name__ == "__main__":
    dst = sys.argv[1] if len(sys.argv) > 1 else "."
    os.makedirs(dst, exist_ok=True)
    for name, fn in {"g4": g4, "pub-g4": g4, "g7": g7, "dnmp": dnmp, "s1": s1, "s3": s3, "sting": sting, "pub-g1": pub_g1}.items():
        cfg = fn()
        json.dump(cfg, open(os.path.join(dst, f"cues-{name}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(name, cfg["duration"], "s", len(cfg["cues"]), "repères")
