#!/usr/bin/env python3
"""
Base circuits — étape 2 : récupère, pour chaque circuit de karting FFSA, les
objets OpenStreetMap autour de son adresse (API OSM « map », petite emprise).

Entrée  : ffsa_karting.json (étape 1)
Sortie  : osm/<ffsa_id>.xml (cache : un fichier déjà présent n'est pas
          retéléchargé)

Politesse : 1 requête toutes les 1,5 s, User-Agent identifiant le projet,
emprise réduite automatiquement si la zone est trop dense.
Données OSM : © les contributeurs OpenStreetMap, licence ODbL.
"""
import json, os, sys, time, urllib.request, urllib.error

UA = "ApexAI-circuits/1.0 (contact@apexai.racing)"
API = "https://api.openstreetmap.org/api/0.6/map?bbox={},{},{},{}"

def fetch(lat, lon, half_lat, half_lon):
    url = API.format(lon - half_lon, lat - half_lat, lon + half_lon, lat + half_lat)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()

def main(src, outdir):
    os.makedirs(outdir, exist_ok=True)
    circuits = json.load(open(src))
    for i, c in enumerate(circuits):
        path = os.path.join(outdir, f"{c['ffsa_id']}.xml")
        if os.path.exists(path) and os.path.getsize(path) > 0:
            continue
        lat, lon = c["lat"], c["lon"]
        if lat is None or lon is None:
            continue
        # ~1,6 km × 1,6 km, puis plus petit si l'API refuse (zone trop dense)
        for half_lat, half_lon in ((0.0075, 0.011), (0.0045, 0.0065), (0.0025, 0.0035)):
            try:
                data = fetch(lat, lon, half_lat, half_lon)
                open(path, "wb").write(data)
                print(f"{i+1}/{len(circuits)} {c['name']}: {len(data)//1024} Ko", flush=True)
                break
            except urllib.error.HTTPError as e:
                print(f"{i+1}/{len(circuits)} {c['name']}: HTTP {e.code}, emprise réduite", flush=True)
                time.sleep(2)
            except Exception as e:  # réseau
                print(f"{i+1}/{len(circuits)} {c['name']}: {e}", flush=True)
                time.sleep(5)
        time.sleep(1.5)

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
