# Données du reel « 9 sur 49 » (28/11) : tracé du tour 8 découpé en 49 secteurs, tour d'origine de chaque secteur
# (ideal_beacons.json = moteur de l'app relancé le 28/11 avec les balises).
# Usage : python build_data.py <fichier_session.csv>
import csv, json, math, sys
import numpy as np

rows = list(csv.reader(open(sys.argv[1], encoding="utf-8", errors="ignore")))
hi = next(i for i, x in enumerate(rows) if x and x[0] == "Time" and len(x) > 5)
h = rows[hi]
D = np.array([[float(v) for v in x] for x in rows[hi + 1:] if len(x) == len(h) and x[0].replace(".", "", 1).isdigit()])
col = lambda n: D[:, h.index(n)]
t, la, lo = col("Time"), col("GPS Latitude"), col("GPS Longitude")
B = [float(x) for x in next(x for x in rows if x and x[0] == "Beacon Markers")[1].split()]
il = json.load(open("ideal_beacons.json", encoding="utf-8"))
best = il["best_lap_number"]
assert il["n_sectors"] == 49 and best == 8 and len(il["laps_used"]) == 9
assert abs((B[best] - B[best - 1]) - il["best_real_lap_time_s"]) < 0.002
sec = il["sectors"]
assert [s["index"] for s in sec if s["from_lap"] == best] == [4, 10, 14, 15, 19, 30, 41, 42, 43]
assert sec[37]["from_lap"] == 7 and sec[38]["from_lap"] == 5

tt = np.arange(B[best - 1], B[best], 0.01)
lat, lon = np.interp(tt, t, la), np.interp(tt, t, lo)
k = math.cos(math.radians(float(lat.mean())))
X, Y = lon * k * 111320.0, -lat * 111320.0  # mètres, nord en haut
d = np.concatenate(([0], np.cumsum(np.hypot(np.diff(X), np.diff(Y)))))
print("longueur GPS du tour", round(d[-1], 1), "moteur", il["track_length_m"])
xs, ys = X - X.min(), Y - Y.min()
w, hh = xs.max(), ys.max()
s = 1000 / max(w, hh)
W, H = round(w * s, 1), round(hh * s, 1)
# position le long du tour ramenée à la longueur du moteur
dm = d * il["track_length_m"] / d[-1]
segs = []
for q in sec:
    g = np.linspace(q["start_m"], q["end_m"], 14)
    pts = [[round(float(np.interp(a, dm, xs) * s), 1), round(float(np.interp(a, dm, ys) * s), 1)] for a in g]
    segs.append({"i": q["index"], "lap": q["from_lap"], "pts": pts})
json.dump({"w": W, "h": H, "best": best, "segs": segs},
          open("../../../apex-promo-video/apexai-video/src/data/morceaux49.json", "w", encoding="utf-8"), separators=(",", ":"))
print("boite", W, H)
for i in (37, 38):
    print(i, segs[i]["pts"][0], segs[i]["pts"][-1])

# temps des 9 passages sur les deux secteurs du zoom (même interpolation que le moteur, vérifiée :
# le passage le plus rapide désigne le tour 7 au secteur 37 et le tour 5 au secteur 38). Aucune valeur n'est affichée.
Z = {37: [1.362, 1.438, 1.343, 1.244, 1.42, 1.336, 1.166, 1.279, 1.32],
     38: [1.516, 1.437, 1.488, 1.498, 1.419, 1.442, 1.718, 1.509, 1.455]}
for i, v in Z.items():
    assert v.index(min(v)) + 1 == sec[i]["from_lap"] and abs(min(v) - sec[i]["ideal_time_s"]) < 0.002
p = "../../../apex-promo-video/apexai-video/src/data/morceaux49.json"
o = json.load(open(p, encoding="utf-8"))
o["zoom"] = {str(i): v for i, v in Z.items()}
json.dump(o, open(p, "w", encoding="utf-8"), separators=(",", ":"))
