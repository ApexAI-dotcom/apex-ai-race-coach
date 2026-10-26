#!/usr/bin/env python3
"""
Base circuits — étape 6 : fichiers SQL d'import dans public.circuit_catalog
(upsert par slug), découpés en lots. Le tracé est allégé à 160 points.

Usage : python3 export_sql.py circuits.json dossier_sortie [taille_lot]
"""
import json, math, sys


def q(v):
    if v is None or v == "":
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return "null" if (isinstance(v, float) and math.isnan(v)) else repr(v)
    return "'" + str(v).replace("'", "''") + "'"


def thin(line, n=160):
    if len(line) <= n:
        return line
    step = len(line) / n
    return [line[int(i * step)] for i in range(n)]


def main(src, out_dir, size=100):
    circuits = json.load(open(src))
    cols = ["slug", "name", "city", "postal_code", "department_code", "department", "region", "country", "lat", "lon",
            "indoor", "surface", "width_m", "length_m", "trace_status", "corners_count", "hairpins_count", "medium_count",
            "fast_corners_count", "corners", "centerline", "ffsa_structures", "website", "phone", "osm_url", "source"]
    files = []
    for k in range(0, len(circuits), size):
        rows = []
        for c in circuits[k:k + size]:
            width = None
            try:
                width = float(str(c.get("width_m") or "").replace(",", ".")) or None
            except ValueError:
                width = None
            line = [[round(p[0], 6), round(p[1], 6)] for p in thin(c.get("line") or [])]
            corners = [{k2: v for k2, v in x.items()} for x in (c.get("corners") or [])]
            vals = [c["slug"], c["name"], c.get("city"), c.get("postal_code"), c.get("department_code"), c.get("department"),
                    c.get("region"), c.get("country") or "FR", c.get("lat"), c.get("lon"), c.get("indoor"), c.get("surface"),
                    width, c.get("length_m"), c["trace_status"], c.get("corners_count"), c.get("hairpins_count"),
                    c.get("medium_count"), c.get("fast_corners_count")]
            sql_vals = [q(v) for v in vals] + [
                q(json.dumps(corners, ensure_ascii=False)) + "::jsonb",
                q(json.dumps(line)) + "::jsonb",
                q(json.dumps(c.get("ffsa_structures") or [], ensure_ascii=False)) + "::jsonb",
                q(c.get("website")), q(c.get("phone")), q(c.get("osm_url")), q(c.get("source") or "OSM"),
            ]
            rows.append("(" + ", ".join(sql_vals) + ")")
        upd = ", ".join(f"{c} = excluded.{c}" for c in cols if c != "slug") + ", updated_at = now()"
        sql = (f"insert into public.circuit_catalog ({', '.join(cols)}) values\n" + ",\n".join(rows)
               + f"\non conflict (slug) do update set {upd}\n  where public.circuit_catalog.verified = false;\n")
        path = f"{out_dir}/catalog_{k // size + 1:02d}.sql"
        open(path, "w").write(sql)
        files.append(path)
    print(len(circuits), "fiches,", len(files), "lots")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 100)
