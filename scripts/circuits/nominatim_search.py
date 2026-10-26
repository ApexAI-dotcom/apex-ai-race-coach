#!/usr/bin/env python3
"""
Base circuits — étape 1 bis : repère les sites de karting par département via
Nominatim (OpenStreetMap). Complète la liste FFSA, dont l'adresse est souvent
celle de la société ou du club et pas celle de la piste.

Politesse : 1 requête / 1,1 s, User-Agent du projet (règles Nominatim).
Sortie : nominatim_hits.json

Usage : python3 nominatim_search.py departements.json sortie.json ["karting,kart"]
"""
import json, sys, time, urllib.parse, urllib.request

UA = "ApexAI-circuits/1.0 (contact@apexai.racing)"

def search(q):
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
        {"q": q, "countrycodes": "fr", "format": "jsonv2", "limit": 50, "extratags": 1, "addressdetails": 1})
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "fr"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)

def main(depts_path, out, terms="karting,kart"):
    depts = json.load(open(depts_path))
    hits = {}
    for code, d in depts.items():
        if code in ("20", "75"):
            continue
        for term in terms.split(","):
            try:
                res = search(f"{term} {d['nom']}")
            except Exception as e:
                print(code, term, "erreur", e, flush=True)
                time.sleep(5)
                continue
            for h in res:
                key = f"{h['osm_type']}/{h['osm_id']}"
                hits.setdefault(key, h)
            print(code, term, len(res), "→ total", len(hits), flush=True)
            time.sleep(1.1)
    json.dump(list(hits.values()), open(out, "w"), ensure_ascii=False)

if __name__ == "__main__":
    main(*sys.argv[1:4])
