#!/usr/bin/env python3
"""
Base circuits — étape 3 : dans chaque extrait OpenStreetMap, trouve les pistes
de karting et reconstitue leur tracé.

Une piste OSM est une ligne `highway=raceway` (souvent avec `sport=karting`)
ou une ligne/surface `leisure=track` + `sport=karting`. Elle est parfois
découpée en plusieurs tronçons : on les recolle par leurs nœuds communs. Le
site autour (`leisure=sports_centre` + `sport=karting`) donne souvent le nom,
le site web et le caractère couvert (`indoor`/`building`).

Sortie : tracks.json — une entrée par piste (dédoublonnée entre extraits).
"""
import json, math, os, sys
import xml.etree.ElementTree as ET

def parse(path):
    nodes, ways = {}, {}
    for ev, el in ET.iterparse(path, events=("end",)):
        if el.tag == "node":
            nodes[int(el.get("id"))] = (float(el.get("lat")), float(el.get("lon")))
            el.clear()
        elif el.tag == "way":
            tags = {t.get("k"): t.get("v") for t in el.findall("tag")}
            refs = [int(n.get("ref")) for n in el.findall("nd")]
            ways[int(el.get("id"))] = (tags, refs)
            el.clear()
        elif el.tag == "relation":
            el.clear()
    return nodes, ways

def is_track(tags):
    sport = tags.get("sport", "")
    kart = "karting" in sport
    if tags.get("highway") == "raceway" and (kart or not sport or "motor" in sport):
        return True
    if tags.get("leisure") == "track" and kart:
        return True
    if tags.get("area:highway") == "raceway" and kart:
        return True
    return False

def is_site(tags):
    return "karting" in tags.get("sport", "") and tags.get("leisure") in ("sports_centre", "pitch", "sports_hall", "track") or (
        tags.get("leisure") == "sports_centre" and "kart" in (tags.get("name", "") + tags.get("description", "")).lower())

def chain(segments):
    """Recolle des listes de nœuds qui se touchent par leurs extrémités."""
    segs = [list(s) for s in segments if len(s) > 1]
    out = []
    while segs:
        cur = segs.pop(0)
        changed = True
        while changed:
            changed = False
            for i, s in enumerate(segs):
                if cur[-1] == s[0]:
                    cur += s[1:]
                elif cur[-1] == s[-1]:
                    cur += s[::-1][1:]
                elif cur[0] == s[-1]:
                    cur = s[:-1] + cur
                elif cur[0] == s[0]:
                    cur = s[::-1][:-1] + cur
                else:
                    continue
                segs.pop(i)
                changed = True
                break
        out.append(cur)
    return out

def length(pts):
    tot = 0.0
    for (a, b), (c, d) in zip(pts, pts[1:]):
        k = math.cos(math.radians((a + c) / 2))
        tot += math.hypot((d - b) * k, c - a) * 111195
    return tot

def centroid(pts):
    return (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))

def point_in_poly(p, poly):
    x, y = p[1], p[0]
    inside = False
    for (a, b), (c, d) in zip(poly, poly[1:] + poly[:1]):
        xi, yi, xj, yj = b, a, d, c
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-12) + xi:
            inside = not inside
    return inside

def main(osmdir, out):
    tracks = {}
    files = sorted(os.listdir(osmdir))
    for fi, fn in enumerate(files):
        try:
            nodes, ways = parse(os.path.join(osmdir, fn))
        except ET.ParseError:
            print("extrait illisible, ignoré :", fn, flush=True)
            continue
        track_ways = {wid: w for wid, w in ways.items() if is_track(w[0])}
        if not track_ways:
            continue
        sites = [(w[0], [nodes[r] for r in w[1] if r in nodes]) for w in ways.values() if is_site(w[0])]
        buildings = [[nodes[r] for r in w[1] if r in nodes] for w in ways.values() if "building" in w[0]]
        # Regroupe les tronçons qui se touchent
        by_node = {}
        for wid, (tags, refs) in track_ways.items():
            for r in (refs[0], refs[-1]):
                by_node.setdefault(r, set()).add(wid)
        groups, seen = [], set()
        for wid in track_ways:
            if wid in seen:
                continue
            stack, grp = [wid], set()
            while stack:
                w = stack.pop()
                if w in grp:
                    continue
                grp.add(w)
                refs = track_ways[w][1]
                for r in (refs[0], refs[-1]):
                    stack.extend(by_node.get(r, ()))
            seen |= grp
            groups.append(sorted(grp))
        for grp in groups:
            key = tuple(grp)
            if key in tracks:
                continue
            chains = chain([track_ways[w][1] for w in grp])
            main_chain = max(chains, key=lambda c: len(c))
            pts = [nodes[r] for r in main_chain if r in nodes]
            if len(pts) < 4:
                continue
            tagsets = [track_ways[w][0] for w in grp]
            merged = {}
            for t in tagsets:
                for k, v in t.items():
                    merged.setdefault(k, v)
            c = centroid(pts)
            site = next((s for s in sites if len(s[1]) > 2 and point_in_poly(c, s[1])), None)
            indoor = merged.get("indoor") == "yes" or merged.get("covered") == "yes" or any(
                len(b) > 2 and point_in_poly(c, b) for b in buildings)
            tracks[key] = {
                "osm_ways": list(key),
                "osm_url": f"https://www.openstreetmap.org/way/{key[0]}",
                "name": merged.get("name") or (site[0].get("name") if site else "") or "",
                "site_name": site[0].get("name", "") if site else "",
                "website": merged.get("website") or (site[0].get("website", "") if site else "") or merged.get("contact:website", ""),
                "sport": merged.get("sport", ""),
                "surface": merged.get("surface", ""),
                "width_tag": merged.get("width", ""),
                "oneway": merged.get("oneway", ""),
                "indoor": bool(indoor),
                "closed": main_chain[0] == main_chain[-1],
                "length_osm_m": round(length(pts)),
                "n_segments": len(grp),
                "n_chains": len(chains),
                "lat": round(c[0], 6),
                "lon": round(c[1], 6),
                "line": [[round(a, 6), round(b, 6)] for a, b in pts],
            }
        if fi % 50 == 0:
            print(fi, len(tracks), flush=True)
    json.dump(list(tracks.values()), open(out, "w"), ensure_ascii=False)
    print("pistes trouvées :", len(tracks))

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
