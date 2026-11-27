# Données du reel « Plus de 2 g au virage 6 » (27/11) : tracé du tour 4, passage au virage 6,
# g latéral GPS (voie « GPS LatAcc », moyenne glissante 0,5 s) des 10 tours, au même point de piste.
# Usage : python build_data.py <fichier_session.csv>
import csv, json, math, sys
import numpy as np

rows = list(csv.reader(open(sys.argv[1], encoding="utf-8", errors="ignore")))
hi = next(i for i, x in enumerate(rows) if x and x[0] == "Time" and len(x) > 5)
h = rows[hi]
D = np.array([[float(v) for v in x] for x in rows[hi + 2:] if len(x) == len(h)])
col = lambda n: D[:, h.index(n)]
t, la, lo, v = col("Time"), col("GPS Latitude"), col("GPS Longitude"), col("GPS Speed") * 3.6
raw = col("GPS LatAcc")
signed = np.convolve(raw, np.ones(50) / 50, "same")
g = np.convolve(np.abs(raw), np.ones(50) / 50, "same")
B = [float(x) for x in next(x for x in rows if x and x[0] == "Beacon Markers")[1].split()]
edges = [0.0] + B + [float(t[-1])]
lap = {n: (t >= edges[n]) & (t < edges[n + 1]) for n in range(1, 11)}

k = math.cos(math.radians(float(la[lap[4]].mean())))
X, Y = lo * k * 111320.0, -la * 111320.0  # mètres, nord en haut
# point de référence : pic du tour 4 au virage 6 (24,5 s après le début du tour)
win = lap[4] & (t > edges[4] + 22) & (t < edges[4] + 27)
ref = np.flatnonzero(win)[np.argmax(g[win])]

laps = []
for n in range(1, 11):
    idx = np.flatnonzero(lap[n])
    dist = np.hypot(X[idx] - X[ref], Y[idx] - Y[ref])
    c = idx[np.argmin(dist)]
    assert dist.min() < 8, (n, dist.min())
    near = (t >= t[c] - 1.0) & (t <= t[c] + 1.0)
    pk = float(g[near].max())
    above = float((g[(t >= t[c] - 1.5) & (t <= t[c] + 1.5)] > 2).sum() / 100)
    laps.append({"n": n, "g": round(pk, 2), "vmin": round(float(v[near].min())), "above": round(above, 2)})
for x in laps:
    print(x)

# contrôles contre la section Données de la fiche
fiche = [1.78, 1.84, 1.79, 2.29, 2.19, 2.20, 2.22, 2.23, 2.21, 2.24]
assert all(abs(a["g"] - b) <= 0.015 for a, b in zip(laps, fiche)), [a["g"] for a in laps]
assert [a["n"] for a in laps if a["g"] > 2] == [4, 5, 6, 7, 8, 9, 10]
assert max(a["vmin"] for a in laps[:3]) < min(a["vmin"] for a in laps[3:])

# tracé du tour 4 ramené dans une boîte 1000 x 1000
xs, ys = X[lap[4]], Y[lap[4]]
w, hh = xs.max() - xs.min(), ys.max() - ys.min()
s = 920 / max(w, hh)
N = lambda i: [round(float((X[i] - xs.min()) * s + (1000 - w * s) / 2), 1), round(float((Y[i] - ys.min()) * s + (1000 - hh * s) / 2), 1)]
track = [N(i) for i in np.flatnonzero(lap[4])[::10]]
# passage animé : de 3,0 s avant le pic à 1,6 s après, à 20 Hz
seg = np.arange(ref - 300, ref + 161, 5)
run = [{"t": round(float(t[i] - t[ref]), 2), "p": N(i), "g": round(float(g[i]), 3)} for i in seg]
turn = float(signed[ref])
print("pic", round(float(g[ref]), 3), "signe LatAcc", round(turn, 2), "point", N(ref))
i0, i1 = ref - 50, ref + 50
a = np.array([X[ref] - X[i0], Y[ref] - Y[i0]]); b = np.array([X[i1] - X[ref], Y[i1] - Y[ref]])
cross = float(a[0] * b[1] - a[1] * b[0])  # repère écran (y vers le bas) : > 0 = virage à droite
print("virage a", "droite" if cross > 0 else "gauche")
out = {"track": track, "v6": N(ref), "run": run, "right": cross > 0, "laps": [{"n": a["n"], "g": a["g"]} for a in laps]}
dst = "../../../apex-promo-video/apexai-video/src/data/virage6-g.json"
json.dump(out, open(dst, "w", encoding="utf-8"), separators=(",", ":"))
