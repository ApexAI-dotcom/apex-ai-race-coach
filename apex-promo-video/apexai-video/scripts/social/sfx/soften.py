#!/usr/bin/env python3
"""
Version « douce » des repères son (v2) : moins de sons, plus espacés, plus doux.

  python3 soften.py <dossier des cues-*.json>   → cues-<id>-doux.json

Règles : on garde la signature sonore, des impacts doux sur les chiffres clés, des souffles sur les
changements de scène, une seule brillance et le clic du bouton. Plus de tics, bips, glitchs, montées.
Au moins 0,9 s entre deux sons (la montée inversée qui précède la signature fait corps avec elle).
Nappe : accord doux, sans pulsation. Bus adouci, −16 LUFS.
"""
import glob
import json
import os
import sys

MAP = {  # son d'origine → (son v2, priorité, gain dB)
    "sonic-logo": ("sonic-logo", 0, None),
    "impact-shimmer": ("sonic-logo", 0, None),
    "impact": ("soft-impact", 1, -13), "impact-low": ("soft-impact", 1, -13), "soft-impact": ("soft-impact", 1, -13),
    "hit": ("soft-impact", 1, -14), "thunk": ("soft-impact", 1, -14),
    "whoosh": ("whoosh-soft", 2, -16), "whoosh-soft": ("whoosh-soft", 2, -16), "whoosh-dive": ("whoosh-soft", 2, -16),
    "fly-through": ("whoosh-soft", 2, -16), "whooshes": ("whoosh-soft", 2, -16), "swoosh": ("swoosh", 2, -17),
    "reverse-whoosh": ("reverse-whoosh", 2, -18),
    "shimmer": ("shimmer", 3, -21),
    "click-ding": ("click-ding", 3, -22),
}
GAP = 0.9


def soften(cfg):
    cand = []
    for c in cfg["cues"]:
        m = MAP.get(c["file"])
        if not m:
            continue
        f, prio, g = m
        d = {"t": c["t"], "file": f}
        if g is not None:
            d["gain"] = g
        if c.get("dur") and f in ("reverse-whoosh", "shimmer"):
            d["dur"] = c["dur"]
        if c.get("pan"):
            d["pan"] = c["pan"]
        cand.append((prio, c["t"], d))
    logos = [t for p, t, d in cand if d["file"] == "sonic-logo"]
    kept = []
    for prio, t, d in sorted(cand, key=lambda x: (x[0], x[1])):
        lead_in = d["file"] == "reverse-whoosh" and any(0 < L - t <= 0.6 for L in logos)
        if lead_in or all(abs(t - k["t"]) >= GAP or (k["file"] == "sonic-logo" and 0 < k["t"] - t <= 0.6 and d["file"] == "reverse-whoosh") for k in kept):
            kept.append(d)
    kept.sort(key=lambda d: d["t"])
    dur = float(cfg["duration"])
    out = {
        "duration": dur,
        "fps": cfg.get("fps", 60),
        "soft": True,
        "lufs": -16.0,
        "bed": {"style": "pad", "drop": 0, "gain": -27, "fade": [max(0.0, dur - 0.6), dur]} if cfg.get("bed") or dur > 4 else None,
        "fade_out": cfg.get("fade_out"),
        "cues": kept,
    }
    return out


if __name__ == "__main__":
    src = sys.argv[1]
    for p in sorted(glob.glob(os.path.join(src, "cues-*.json"))):
        if p.endswith("-doux.json"):
            continue
        cfg = json.load(open(p, encoding="utf-8"))
        o = soften(cfg)
        q = p[:-5] + "-doux.json"
        json.dump(o, open(q, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(f"{os.path.basename(p):24s} {len(cfg['cues']):3d} → {len(o['cues']):2d} sons : " + ", ".join(f"{d['t']:.2f} {d['file']}" for d in o["cues"]))
