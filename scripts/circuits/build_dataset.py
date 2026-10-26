#!/usr/bin/env python3
"""
Base circuits — étape 4 : assemble la base des circuits de karting de France.

Entrées : ffsa_candidates.json (étape 1, circuits/clubs/écoles FFSA de
karting), tracks.json (étape 3, pistes OpenStreetMap).

Règles :
  - une fiche = une piste OSM de karting (ou une ligne FFSA « circuit de
    karting » dont la piste n'est pas encore dessinée dans OSM) ;
  - chaque structure FFSA est rattachée à la piste la plus proche (< 1,2 km) ;
  - la géométrie (longueur, virages, épingles…) n'est calculée que pour un
    tracé fermé de 300 à 2 500 m : un tracé partiel donnerait des chiffres faux.

Sortie : circuits.json (fiches) + clubs.json (structures FFSA, avec la fiche
de rattachement).
"""
import json, math, re, sys, unicodedata
from track_geometry import analyze

def dist_m(a, b):
    k = math.cos(math.radians((a[0] + b[0]) / 2))
    return math.hypot((a[1] - b[1]) * k, a[0] - b[0]) * 111195

def min_dist_to_line(p, line):
    step = max(1, len(line) // 200)
    return min(dist_m(p, q) for q in line[::step])

def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

def title(s):
    small = {"de", "du", "des", "la", "le", "les", "d", "l", "et", "sur", "en", "à", "a"}
    words = re.split(r"(\s+|-|')", s.lower())
    out = []
    for i, w in enumerate(words):
        if w.strip() and (i == 0 or w not in small):
            w = w[0].upper() + w[1:]
        out.append(w)
    t = "".join(out)
    for k in ("Ffsa", "Asa", "Ask", "Kc ", "Gp ", "Sarl", "Sas", "Efk"):
        t = t.replace(k, k.upper())
    return t

DEPTS = None  # rempli par main()

def main(cand_path, tracks_path, depts_path, out_dir, links_path=None, measured_path=None, pilot_sites_path=None):
    global DEPTS
    DEPTS = json.load(open(depts_path))
    cands = json.load(open(cand_path))
    tracks = json.load(open(tracks_path))

    EXCLUDE = re.compile(r"moto|cross|drift|\(old\)|ancien|quad|bmx|vélo|velo|rc |mini.?moto", re.I)

    def is_kart_track(t):
        if EXCLUDE.search(t["name"] or "") or EXCLUDE.search(t["site_name"] or ""):
            return False
        if t["indoor"]:
            return "karting" in t["sport"]
        if "karting" in t["sport"]:
            return t["length_osm_m"] >= 120
        return False

    kt = [t for t in tracks if is_kart_track(t)]
    # Pistes « motor » ou sans sport : retenues seulement si une structure FFSA
    # de karting est tout près et qu'elles ont une taille de piste de kart.
    for t in tracks:
        if t in kt or t["indoor"]:
            continue
        if EXCLUDE.search(t["name"] or ""):
            continue
        if 300 <= t["length_osm_m"] <= 2000 and t["closed"]:
            near = [c for c in cands if dist_m((c["lat"], c["lon"]), (t["lat"], t["lon"])) < 700]
            if near:
                kt.append(t)

    # Un même site a souvent plusieurs tracés (piste principale, piste enfants,
    # tronçons de stand) : on garde une fiche par site, la plus longue boucle
    # fermée faisant foi, et on note les autres tracés comme pistes annexes.
    def score(t):
        return (t["closed"], t["length_osm_m"] if t["length_osm_m"] <= 2500 else 0)
    kt.sort(key=score, reverse=True)
    sites = []
    for t in kt:
        host = next((h for h in sites if min_dist_to_line((t["lat"], t["lon"]), h["line"]) < 250
                     or dist_m((t["lat"], t["lon"]), (h["lat"], h["lon"])) < 350), None)
        if host is None:
            t["annexes"] = []
            sites.append(t)
        elif t["length_osm_m"] >= 150 and t["closed"]:
            host["annexes"].append(t["length_osm_m"])
    kt = sites

    # Tracés mesurés par une session de pilote : ils remplacent le tracé OSM du
    # même site (ou créent la piste si OSM ne l'a pas).
    for m in (json.load(open(measured_path)) if measured_path else []):
        c = (sum(p[0] for p in m["line"]) / len(m["line"]), sum(p[1] for p in m["line"]) / len(m["line"]))
        host = next((h for h in kt if dist_m(c, (h["lat"], h["lon"])) < 400), None)
        if host is None:
            host = {"osm_ways": [], "osm_url": "", "name": m["name"], "site_name": m["name"], "website": "", "sport": "karting",
                    "surface": "", "width_tag": "", "oneway": "", "indoor": False, "annexes": []}
            kt.append(host)
        host.update({"line": m["line"], "closed": True, "lat": round(c[0], 6), "lon": round(c[1], 6),
                     "length_osm_m": round(sum(dist_m(a, b) for a, b in zip(m["line"], m["line"][1:] + m["line"][:1]))),
                     "measured_source": m["source"]})
        if not host.get("name"):
            host["name"] = m["name"]

    # Positions relocalisées par leur nom (adresse FFSA = siège, pas la piste)
    links = json.load(open(links_path)) if links_path else {}

    # Rattachement FFSA → piste la plus proche (adresse ou position relocalisée)
    for c in cands:
        points = [(c["lat"], c["lon"])]
        if str(c["ffsa_id"]) in links:
            l = links[str(c["ffsa_id"])]
            points.append((l["lat"], l["lon"]))
            c["relocated"] = l
        best, bd = None, 1e9
        for i, t in enumerate(kt):
            for p in points:
                if dist_m(p, (t["lat"], t["lon"])) > 3000:
                    continue
                d = min_dist_to_line(p, t["line"])
                if d < bd:
                    best, bd = i, d
        c["track_index"] = best if bd < 1200 else None
        c["track_distance_m"] = round(bd) if best is not None and bd < 1200 else None

    circuits = []
    for i, t in enumerate(kt):
        linked = sorted([c for c in cands if c["track_index"] == i], key=lambda c: c["track_distance_m"])
        ffsa_circuit = next((c for c in linked if c["kind"] == "circuit"), None) or next(
            (c for c in linked if c["kind"] == "circuit_autre"), None)

        def usable(n):
            n = (n or "").strip()
            return len(n) >= 4 and not n.replace(" ", "").isdigit()

        ref = ffsa_circuit or (linked[0] if linked else None)
        candidates_names = [ffsa_circuit and title(ffsa_circuit["name"]), t["site_name"], t["name"]] + [
            title(c["name"]) for c in linked if c["kind"] == "ecole"] + [title(c["name"]) for c in linked]
        name = next((n for n in candidates_names if usable(n)), "") or (
            f"Piste de karting de {title(ref['city'])}" if ref else "Piste de karting")
        geo = None
        if t["closed"] and 300 <= t["length_osm_m"] <= 2500:
            geo = analyze([tuple(p) for p in t["line"]], closed=True, step=1.0)
        circuits.append({
            "name": name,
            "osm_name": t["name"] or t["site_name"],
            "city": title(ref["city"]) if ref else "",
            "postal_code": ref["postal_code"] if ref else "",
            "lat": t["lat"], "lon": t["lon"],
            "indoor": t["indoor"],
            "surface": t["surface"],
            "width_m": t["width_tag"],
            "length_m": round(geo["length_m"]) if geo else (t["length_osm_m"] if t["closed"] else None),
            "trace_status": "complet" if geo else ("fermé hors gabarit" if t["closed"] else "partiel"),
            "corners_count": geo["corners_count"] if geo else None,
            "hairpins_count": geo["hairpins_count"] if geo else None,
            "medium_count": geo["medium_count"] if geo else None,
            "fast_corners_count": geo["fast_corners_count"] if geo else None,
            "corners": [{k: v for k, v in c.items() if k != "apex_xy"} for c in geo["corners"]] if geo else [],
            "ffsa_circuit": bool(ffsa_circuit),
            "ffsa_structures": [{"name": title(c["name"]), "kind": c["kind"], "url": c["ffsa_url"]} for c in linked],
            "website": t["website"] or (ffsa_circuit or {}).get("website", "") or "",
            "phone": (ref or {}).get("phone", ""),
            "osm_url": t["osm_url"],
            "annex_tracks_m": sorted(t.get("annexes", []), reverse=True),
            "line": t["line"],
            "source": ("Session pilote" + (" + FFSA" if linked else "")) if t.get("measured_source") else ("OSM + FFSA" if linked else "OSM"),
            "measured_from": t.get("measured_source", ""),
        })

    # Circuits de karting FFSA sans piste dessinée dans OSM. La FFSA liste parfois
    # la même piste deux fois, et une piste OSM porte parfois le nom de la
    # structure à quelques km de son adresse : dans ces cas on complète la fiche
    # existante au lieu d'en créer une seconde.
    def same_site(fiche, c):
        a = slugify(fiche["name"]).replace("-", "")
        b = slugify(title(c["name"])).replace("-", "")
        # Même nom, ou l'un contient l'autre (« Solokart » / « Solo Kart Chateaubriand »)
        if not (a == b or (min(len(a), len(b)) >= 6 and (a in b or b in a))):
            return False
        if fiche["city"] and slugify(fiche["city"]) == slugify(title(c["city"])):
            return True
        return fiche["lat"] is not None and dist_m((fiche["lat"], fiche["lon"]), (c["lat"], c["lon"])) < 15000

    for c in cands:
        if c["kind"] != "circuit" or c["track_index"] is not None:
            continue
        twin = next((f for f in circuits if same_site(f, c)), None)
        if twin:
            if c["ffsa_url"] not in {s["url"] for s in twin["ffsa_structures"]}:
                twin["ffsa_structures"].append({"name": title(c["name"]), "kind": "circuit", "url": c["ffsa_url"]})
            twin["ffsa_circuit"] = True
            twin["city"] = twin["city"] or title(c["city"])
            twin["postal_code"] = twin["postal_code"] or c["postal_code"]
            twin["website"] = twin["website"] or c["website"]
            twin["phone"] = twin["phone"] or c["phone"]
            if twin["source"] == "OSM":
                twin["source"] = "OSM + FFSA"
            continue
        circuits.append({
            "name": title(c["name"]), "osm_name": "", "city": title(c["city"]), "postal_code": c["postal_code"],
            "lat": (c.get("relocated") or c)["lat"], "lon": (c.get("relocated") or c)["lon"], "indoor": None, "surface": "", "width_m": "",
            "length_m": None, "trace_status": "à dessiner", "corners_count": None, "hairpins_count": None,
            "medium_count": None, "fast_corners_count": None, "corners": [], "ffsa_circuit": True,
            "ffsa_structures": [{"name": title(c["name"]), "kind": "circuit", "url": c["ffsa_url"]}],
            "website": c["website"], "phone": c["phone"], "osm_url": "", "annex_tracks_m": [], "line": [], "source": "FFSA", "measured_from": "",
        })

    pilot_sites = json.load(open(pilot_sites_path)) if pilot_sites_path else []
    # Chaque site pilote compte pour la fiche la plus proche (2,5 km au plus :
    # certaines positions viennent d'une adresse approximative).
    for c in circuits:
        c["pilot_sessions"] = 0
    located = [c for c in circuits if c["lat"] is not None]
    for ps in pilot_sites:
        best = min(located, key=lambda c: dist_m((ps["lat"], ps["lon"]), (c["lat"], c["lon"])), default=None)
        if best and dist_m((ps["lat"], ps["lon"]), (best["lat"], best["lon"])) < 2500:
            best["pilot_sessions"] += ps.get("sessions", 0)
    for c in circuits:
        cp = (c["postal_code"] or "")[:2]
        if cp in ("97", "98"):
            cp = c["postal_code"][:3]
        if cp == "20" and c["postal_code"]:
            cp = "2A" if c["postal_code"] < "20200" else "2B"
        d = DEPTS.get(cp)
        c["department_code"] = cp
        c["department"] = d["nom"] if d else ""
        c["region"] = d["region"] if d else ""
        c["slug"] = slugify(f"{c['name']}-{c['city']}") if c["city"] else slugify(c["name"] or c["osm_url"])

    circuits.sort(key=lambda c: (c["department_code"] or "zz", c["name"]))
    json.dump(circuits, open(f"{out_dir}/circuits.json", "w"), ensure_ascii=False)
    json.dump([{k: v for k, v in c.items() if k != "track_index"} | {"circuit": (kt and c["track_index"] is not None) and circuits_name(circuits, kt, c)} for c in cands],
              open(f"{out_dir}/clubs.json", "w"), ensure_ascii=False)
    print(len(circuits), "fiches ;", sum(c["trace_status"] == "complet" for c in circuits), "tracés complets")

def circuits_name(circuits, kt, c):
    t = kt[c["track_index"]]
    for ci in circuits:
        if ci["osm_url"] == t["osm_url"]:
            return ci["name"]
    return ""

if __name__ == "__main__":
    main(*sys.argv[1:8])
