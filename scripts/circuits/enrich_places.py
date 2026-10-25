#!/usr/bin/env python3
"""
Base circuits — étape 4 bis : commune, code postal et département des fiches
qui n'en ont pas (pistes trouvées dans OSM sans structure FFSA rattachée),
par géocodage inverse Nominatim (1 requête / 1,1 s, cache sur disque).

Usage : python3 enrich_places.py circuits.json departements.json cache.json
"""
import json, sys, time, urllib.parse, urllib.request

UA = "ApexAI-circuits/1.0 (contact@apexai.racing)"

def reverse(lat, lon):
    url = "https://nominatim.openstreetmap.org/reverse?" + urllib.parse.urlencode(
        {"lat": lat, "lon": lon, "format": "jsonv2", "zoom": 14, "addressdetails": 1})
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "fr"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)

def main(circ_path, depts_path, cache_path):
    circuits = json.load(open(circ_path))
    depts = json.load(open(depts_path))
    try:
        cache = json.load(open(cache_path))
    except Exception:
        cache = {}
    for c in circuits:
        if c["postal_code"] and c["city"]:
            continue
        if c["lat"] is None:
            continue
        key = f"{c['lat']:.4f},{c['lon']:.4f}"
        if key not in cache:
            try:
                cache[key] = reverse(c["lat"], c["lon"])
            except Exception as e:
                print("erreur", key, e, flush=True)
                time.sleep(5)
                continue
            time.sleep(1.1)
            json.dump(cache, open(cache_path, "w"), ensure_ascii=False)
        a = cache[key].get("address", {})
        c["city"] = c["city"] or a.get("village") or a.get("town") or a.get("city") or a.get("municipality") or ""
        c["postal_code"] = c["postal_code"] or a.get("postcode", "")
        country = a.get("country_code", "fr")
        c["country"] = country.upper()
        cp = (c["postal_code"] or "")[:2]
        if cp in ("97", "98"):
            cp = c["postal_code"][:3]
        if cp == "20":
            cp = "2A" if c["postal_code"] < "20200" else "2B"
        if c["name"] in ("", "Piste de karting") and c["city"]:
            c["name"] = f"Piste de karting de {c['city']}"
        d = depts.get(cp) if country == "fr" else None
        c["department_code"], c["department"], c["region"] = (cp, d["nom"], d["region"]) if d else (cp, "", "")
    # Hors de France (pistes frontalières captées par une emprise) : retirées
    kept = [c for c in circuits if c.get("country", "FR") == "FR"]
    kept.sort(key=lambda c: (c["department_code"] or "zz", c["name"]))
    json.dump(kept, open(circ_path, "w"), ensure_ascii=False)
    print(len(kept), "fiches en France ;", sum(1 for c in kept if not c["department"]), "sans département")

if __name__ == "__main__":
    main(*sys.argv[1:4])
