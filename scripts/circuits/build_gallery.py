#!/usr/bin/env python3
"""Page de vérification visuelle des circuits (artifact)."""
import json, math, sys

circuits = json.load(open(sys.argv[1]))
out = sys.argv[2]

def thin(line, n=140):
    if len(line) <= n:
        return line
    step = len(line) / n
    return [line[int(i * step)] for i in range(n)]

def project(line):
    lat0 = sum(p[0] for p in line) / len(line)
    k = math.cos(math.radians(lat0))
    xs = [p[1] * k for p in line]
    ys = [-p[0] for p in line]
    minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
    span = max(maxx - minx, maxy - miny) or 1
    pts = [((x - minx) / span * 100, (y - miny) / span * 100) for x, y in zip(xs, ys)]
    w, h = (maxx - minx) / span * 100, (maxy - miny) / span * 100
    return [[round(x + (100 - w) / 2, 1), round(y + (100 - h) / 2, 1)] for x, y in pts], (minx, miny, span, w, h, k)

rows = []
for c in circuits:
    item = {
        "n": c["name"], "v": c["city"], "d": c["department"], "dc": c["department_code"], "r": c["region"],
        "L": c["length_m"], "K": c["corners_count"], "E": c["hairpins_count"], "M": c["medium_count"], "R": c["fast_corners_count"],
        "s": c["trace_status"], "o": c["osm_url"], "f": [s["url"] for s in c["ffsa_structures"]][:1],
        "src": c["source"], "ps": c.get("pilot_sessions", 0), "ix": c.get("indoor"),
    }
    if c["line"]:
        pts, (minx, miny, span, w, h, k) = project(thin(c["line"]))
        item["p"] = pts
        # Points de corde : position le long de la ligne (distance) → point projeté le plus proche
        if c["corners"] and c["length_m"]:
            full, _ = project(c["line"])
            # distances cumulées sur la ligne complète
            cum = [0.0]
            for (a, b), (cc, dd) in zip(c["line"], c["line"][1:]):
                kk = math.cos(math.radians(a))
                cum.append(cum[-1] + math.hypot((dd - b) * kk, cc - a) * 111195)
            tot = cum[-1] or 1
            marks = []
            for cn in c["corners"]:
                target = cn["apex_m"] / (c["length_m"] or tot) * tot
                j = min(range(len(cum)), key=lambda i: abs(cum[i] - target))
                marks.append([full[j][0], full[j][1], cn["kind"][0]])
            item["c"] = marks
    rows.append(item)

data = json.dumps(rows, ensure_ascii=False, separators=(",", ":"))
html = open(sys.argv[3]).read().replace("__DATA__", data)
open(out, "w").write(html)
print(len(rows), "fiches,", round(len(html) / 1024), "Ko")
