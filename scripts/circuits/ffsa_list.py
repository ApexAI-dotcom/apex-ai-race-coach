#!/usr/bin/env python3
"""
Base circuits — étape 1 : liste des circuits de karting déclarés à la FFSA.

Source : la page publique « Où pratiquer » de ffsa.org, qui embarque toutes
les structures (circuits, clubs, écoles) avec leur adresse et leurs
coordonnées. On garde les circuits dont le type de piste contient « Karting ».

Usage : python3 ffsa_list.py <page_ou_pratiquer.html> <sortie.json>
"""
import json, re, sys

def objects(html):
    for m in re.finditer(r'\{"id":\d+,"slug":"[^"]+","typology":"(?:circuit|club|ecole)"', html):
        st, depth, i = m.start(), 0, m.start()
        while True:
            ch = html[i]
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    break
            elif ch == '"':
                i += 1
                while html[i] != '"':
                    if html[i] == "\\":
                        i += 1
                    i += 1
            i += 1
        yield json.loads(html[st:i + 1])

def main(src, out):
    html = open(src, encoding="utf-8", errors="ignore").read()
    seen = {}
    for o in objects(html):
        seen[o["id"]] = o
    rows = []
    for o in seen.values():
        if o["typology"] != "circuit" or "Karting" not in (o.get("trackType") or []):
            continue
        a = o.get("address") or {}
        rows.append({
            "ffsa_id": o["id"],
            "ffsa_slug": o["slug"],
            "name": " ".join(o["name"].split()),
            "street": a.get("street") or "",
            "postal_code": a.get("postalCode") or "",
            "city": a.get("city") or "",
            "lat": a.get("latitude"),
            "lon": a.get("longitude"),
            "website": o.get("website") or "",
            "phone": o.get("phone") or "",
            "email": o.get("email") or "",
            "ffsa_url": f"https://www.ffsa.org/pratiquer/ou-pratiquer/{o['slug']}",
        })
    rows.sort(key=lambda r: (r["postal_code"], r["name"]))
    json.dump(rows, open(out, "w"), ensure_ascii=False, indent=1)
    print(len(rows), "circuits de karting FFSA")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
