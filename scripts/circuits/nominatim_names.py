#!/usr/bin/env python3
"""
Base circuits — étape 1 ter : pour chaque structure FFSA sans piste trouvée
autour de son adresse, cherche le site par son nom et sa commune dans
Nominatim (l'adresse FFSA est souvent celle du siège, pas de la piste).

Sortie : name_hits.json  { ffsa_id: [résultats Nominatim] }
"""
import json, re, sys, time, urllib.parse, urllib.request

UA = "ApexAI-circuits/1.0 (contact@apexai.racing)"

def search(q):
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
        {"q": q, "countrycodes": "fr", "format": "jsonv2", "limit": 5, "extratags": 1})
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "fr"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)

def clean(name):
    name = re.sub(r"\b(SARL|SAS|EURL|SA|ASK|ASA|KC|EFK)\b", " ", name, flags=re.I)
    return " ".join(name.split())

def main(cands_path, todo_path, out):
    cands = {c["ffsa_id"]: c for c in json.load(open(cands_path))}
    todo = json.load(open(todo_path))
    try:
        hits = json.load(open(out))
    except Exception:
        hits = {}
    for i, fid in enumerate(todo):
        if str(fid) in hits:
            continue
        c = cands[fid]
        res = []
        for q in (f"{clean(c['name'])} {c['city']}", f"karting {c['city']}"):
            try:
                res = search(q)
            except Exception as e:
                print(fid, "erreur", e, flush=True)
                time.sleep(5)
            time.sleep(1.1)
            if res:
                break
        hits[str(fid)] = res
        print(i + 1, len(todo), c["name"], "→", len(res), flush=True)
        if i % 20 == 0:
            json.dump(hits, open(out, "w"), ensure_ascii=False)
    json.dump(hits, open(out, "w"), ensure_ascii=False)

if __name__ == "__main__":
    main(*sys.argv[1:4])
