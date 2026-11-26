# Extrait de l'analyse du 22/11 les seules données montrées à l'écran :
# tracé du meilleur tour, position et note des 12 virages, ordre des priorités.
# Aucune vitesse, aucun temps, aucun score n'est exporté.
import json, math, sys
SRC = sys.argv[1]
d = json.load(open(SRC, encoding="utf-8"))
t = d["plot_data"]["trajectory_2d"]
lap = next(l for l in t["laps"] if l["lap_number"] == d["ideal_lap"]["best_lap_number"])
lat0 = sum(lap["lat"]) / len(lap["lat"])
k = math.cos(math.radians(lat0))
P = lambda la, lo: (lo * k, -la)
pts = [P(a, o) for a, o in zip(lap["lat"], lap["lon"])]
xs, ys = [p[0] for p in pts], [p[1] for p in pts]
w, h = max(xs) - min(xs), max(ys) - min(ys)
s = 920 / max(w, h)
N = lambda p: [round((p[0] - min(xs)) * s + (1000 - w * s) / 2, 1), round((p[1] - min(ys)) * s + (1000 - h * s) / 2, 1)]
corners = []
for c in d["corner_analysis"]:
    x, y = N(P(c["apex_lat"], c["apex_lon"]))
    corners.append({"n": c["corner_number"], "grade": c["grade"], "x": x, "y": y})
adv = sorted((a for a in d["coaching_advice"] if a.get("corner")), key=lambda a: a["priority"])
prio = [a["corner"] for a in adv]
grade = {c["n"]: c["grade"] for c in corners}
lowest = min(d["corner_analysis"], key=lambda c: c["score"])["corner_number"]
assert prio == [7, 5, 10, 2] and lowest == 11 and len(corners) == 12
assert [grade[n] for n in prio] == ["A", "B", "B", "A"] and grade[11] == "B"
assert [a["impact_seconds"] for a in adv] == sorted((a["impact_seconds"] for a in adv), reverse=True)
out = {"track": [N(p) for p in pts], "corners": corners,
       "priorities": [{"p": a["priority"], "n": a["corner"], "grade": grade[a["corner"]], "category": a["category"]} for a in adv],
       "lowest": lowest}
dst = "../../../apex-promo-video/apexai-video/src/data/analysis-2211.json"
json.dump(out, open(dst, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(out["priorities"], grade, len(out["track"]))
