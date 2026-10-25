#!/usr/bin/env python3
"""
Base circuits — étape 1 quater : transforme les résultats Nominatim par nom
(name_hits.json) en points à télécharger, en écartant ce qui n'est
manifestement pas une piste (arrêt de bus, rue « du Karting »…), ce qui est
trop loin de l'adresse FFSA (> 40 km) et ce qui est déjà couvert.

Usage : python3 name_points.py ffsa_candidates.json name_hits.json fetch_points*.json sortie.json
"""
import json, math, sys

GOOD = {("leisure", "track"), ("leisure", "sports_centre"), ("highway", "raceway"), ("leisure", "pitch"),
        ("leisure", "sports_hall"), ("leisure", "racetrack"), ("amenity", "events_venue"), ("tourism", "attraction")}

def dist(a, b):
    k = math.cos(math.radians((a[0] + b[0]) / 2))
    return math.hypot((a[1] - b[1]) * k, a[0] - b[0]) * 111195

def main(cands_path, hits_path, out, *fetched_paths):
    cands = {str(c["ffsa_id"]): c for c in json.load(open(cands_path))}
    hits = json.load(open(hits_path))
    done = [(p["lat"], p["lon"]) for fp in fetched_paths for p in json.load(open(fp))]
    pts, links = [], {}
    for fid, res in hits.items():
        c = cands.get(fid)
        if not c:
            continue
        best = None
        for h in res:
            kind = (h.get("category"), h.get("type"))
            sport = (h.get("extratags") or {}).get("sport", "")
            name = (h.get("name") or "").lower()
            if kind not in GOOD and "karting" not in sport:
                continue
            p = (float(h["lat"]), float(h["lon"]))
            if dist(p, (c["lat"], c["lon"])) > 40000:
                continue
            score = (2 if "karting" in sport else 0) + (1 if "kart" in name else 0) + (1 if kind in {("leisure", "track"), ("highway", "raceway")} else 0)
            if best is None or score > best[0]:
                best = (score, p, h)
        if not best:
            continue
        p = best[1]
        links[fid] = {"lat": p[0], "lon": p[1], "osm": f"{best[2]['osm_type']}/{best[2]['osm_id']}", "name": best[2].get("name")}
        if min((dist(p, d) for d in done), default=1e9) > 900:
            pts.append({"ffsa_id": f"name-{fid}", "name": c["name"], "lat": p[0], "lon": p[1]})
            done.append(p)
    json.dump(pts, open(out, "w"), ensure_ascii=False)
    json.dump(links, open(out.replace(".json", "_links.json"), "w"), ensure_ascii=False)
    print(len(links), "structures relocalisées ;", len(pts), "nouveaux points à télécharger")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3], *sys.argv[4:])
