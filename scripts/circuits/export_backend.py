#!/usr/bin/env python3
"""
Base circuits — étape 6 : fichier lu par l'API (dépôt backend,
src/data/circuit_catalog.json). Tracé allégé à 200 points.

Usage : python3 export_backend.py circuits.json sortie.json
"""
import hashlib, json, sys


def thin(line, n=200):
    if len(line) <= n:
        return line
    st = len(line) / n
    return [line[int(i * st)] for i in range(n)]


def main(src, out):
    rows = []
    for x in json.load(open(src)):
        try:
            width = float(str(x.get("width_m") or "").replace(",", ".")) or None
        except ValueError:
            width = None
        rows.append({
            "slug": x["slug"], "name": x["name"], "city": x.get("city") or None, "postal_code": x.get("postal_code") or None,
            "department_code": x.get("department_code") or None, "department": x.get("department") or None,
            "region": x.get("region") or None, "country": x.get("country") or "FR", "lat": x.get("lat"), "lon": x.get("lon"),
            "indoor": x.get("indoor"), "surface": x.get("surface") or None, "width_m": width, "length_m": x.get("length_m"),
            "trace_status": x["trace_status"], "corners_count": x.get("corners_count"), "hairpins_count": x.get("hairpins_count"),
            "medium_count": x.get("medium_count"), "fast_corners_count": x.get("fast_corners_count"),
            "corners": x.get("corners") or [], "centerline": [[round(p[0], 6), round(p[1], 6)] for p in thin(x.get("line") or [])],
            "ffsa_structures": x.get("ffsa_structures") or [], "website": x.get("website") or None, "phone": x.get("phone") or None,
            "osm_url": x.get("osm_url") or None, "source": x.get("source") or "OSM",
        })
    blob = json.dumps(rows, ensure_ascii=False, separators=(",", ":"))
    version = hashlib.sha256(blob.encode()).hexdigest()[:16]
    json.dump({"version": version, "license": "Tracés © contributeurs OpenStreetMap (ODbL) ; annuaire FFSA « Où pratiquer ».",
               "circuits": rows}, open(out, "w"), ensure_ascii=False, separators=(",", ":"))
    print(len(rows), "fiches, version", version)


if __name__ == "__main__":
    main(*sys.argv[1:3])
