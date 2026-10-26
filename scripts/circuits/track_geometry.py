#!/usr/bin/env python3
"""
Géométrie d'un tracé de karting : longueur, virages et leur nature, à partir
d'une ligne (liste de points lat/lon) — tracé OpenStreetMap ou trajectoire GPS
d'un tour.

Pourquoi la géométrie et pas la vitesse : la classification actuelle de
l'analyse compte une « épingle » quand la vitesse au point de corde passe sous
45 km/h. Sur un circuit rapide (Adria, Plessé) aucun virage ne descend aussi
bas avec un kart à boîte ou un X30 : on obtient « 12 virages, 0 épingle », et
les virages moyens ne sont comptés nulle part. Le rayon et l'angle d'un virage,
eux, ne dépendent ni du kart ni du pilote.

Classification (angle total A, rayon minimal R) :
    épingle : A >= 130°
    rapide  : A < 60°, ou R >= 28 m et A <= 100° (courbe large)
    moyen   : le reste
"""
from __future__ import annotations

import math
from typing import Dict, List, Sequence, Tuple

EARTH = 6371008.8


def to_xy(points: Sequence[Tuple[float, float]]) -> List[Tuple[float, float]]:
    lat0 = sum(p[0] for p in points) / len(points)
    lon0 = sum(p[1] for p in points) / len(points)
    k = math.cos(math.radians(lat0))
    return [(math.radians(lon - lon0) * EARTH * k, math.radians(lat - lat0) * EARTH) for lat, lon in points]


def polyline_length(xy: Sequence[Tuple[float, float]]) -> float:
    return sum(math.dist(xy[i], xy[i + 1]) for i in range(len(xy) - 1))


def resample(xy: Sequence[Tuple[float, float]], step: float) -> List[Tuple[float, float]]:
    out = [xy[0]]
    carry = 0.0
    for i in range(len(xy) - 1):
        a, b = xy[i], xy[i + 1]
        seg = math.dist(a, b)
        if seg == 0:
            continue
        d = step - carry
        while d <= seg:
            t = d / seg
            out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
            d += step
        carry = seg - (d - step)
    return out


def smooth(xy: List[Tuple[float, float]], half: int, closed: bool) -> List[Tuple[float, float]]:
    n = len(xy)
    out = []
    for i in range(n):
        sx = sy = 0.0
        c = 0
        for j in range(i - half, i + half + 1):
            if closed:
                p = xy[j % n]
            else:
                if j < 0 or j >= n:
                    continue
                p = xy[j]
            sx += p[0]
            sy += p[1]
            c += 1
        out.append((sx / c, sy / c))
    return out


def classify(angle_deg: float, min_radius_m: float) -> str:
    """Épingle, moyen ou rapide. L'angle prime : sur un tracé OSM, les sommets
    dessinés à la main donnent des rayons trop petits, l'angle reste juste."""
    if angle_deg >= 130:
        return "epingle"
    if angle_deg < 60 or (min_radius_m >= 28 and angle_deg <= 100):
        return "rapide"
    return "moyen"


def _wrap(a: float) -> float:
    while a > math.pi:
        a -= 2 * math.pi
    while a < -math.pi:
        a += 2 * math.pi
    return a


def analyze(points: Sequence[Tuple[float, float]], closed: bool | None = None, step: float = 1.0) -> Dict:
    """points : [(lat, lon), …] dans l'ordre du tracé."""
    if len(points) < 4:
        return {"length_m": None, "corners": []}
    xy = to_xy(points)
    if closed is None:
        closed = math.dist(xy[0], xy[-1]) < 25.0
    if closed and math.dist(xy[0], xy[-1]) > 0.5:
        xy = list(xy) + [xy[0]]
    length = polyline_length(xy)
    rs = resample(xy, step)
    if closed:
        rs = rs[:-1] if math.dist(rs[0], rs[-1]) < step * 0.5 else rs
    sm = smooth(rs, half=int(6 / step), closed=closed)
    n = len(sm)
    # Cap local puis courbure sur une fenêtre de ±4 m
    w = max(2, int(4 / step))
    kappa = [0.0] * n
    for i in range(n):
        if closed:
            a, b, c = sm[(i - w) % n], sm[i], sm[(i + w) % n]
        else:
            if i - w < 0 or i + w >= n:
                continue
            a, b, c = sm[i - w], sm[i], sm[i + w]
        h1 = math.atan2(b[1] - a[1], b[0] - a[0])
        h2 = math.atan2(c[1] - b[1], c[0] - b[0])
        kappa[i] = _wrap(h2 - h1) / (w * step)

    K_IN = 1 / 150.0  # entrée dans un virage : rayon < 150 m (les courbes prises à fond comptent)
    corners = []
    i = 0
    visited = [False] * n
    # Sur une boucle, on part d'un point en ligne droite pour ne pas couper un virage
    start = 0
    if closed:
        start = min(range(n), key=lambda j: abs(kappa[j]))
    order = [(start + j) % n for j in range(n)] if closed else list(range(n))
    seq = [kappa[j] for j in order]
    j = 0
    while j < len(seq):
        if abs(seq[j]) < K_IN:
            j += 1
            continue
        sign = 1 if seq[j] > 0 else -1
        k0 = j
        gap = 0
        k = j
        while k < len(seq):
            if seq[k] * sign >= K_IN:
                gap = 0
            elif seq[k] * sign <= -K_IN:
                break  # le virage repart dans l'autre sens : virage suivant
            else:
                gap += 1
                if gap > int(6 / step):  # 6 m de ligne droite : fin du virage
                    break
            k += 1
        k1 = k - gap
        seg = seq[k0:k1 + 1]
        angle = abs(sum(seg) * step)
        kmax = max(abs(x) for x in seg)
        if math.degrees(angle) >= 20:
            apex_local = k0 + max(range(len(seg)), key=lambda t: abs(seg[t]))
            apex_idx = order[apex_local]
            corners.append({
                "start_m": round(order[k0] * step, 1),
                "end_m": round(order[min(k1, len(order) - 1)] * step, 1),
                "apex_m": round(apex_idx * step, 1),
                "apex_xy": sm[apex_idx],
                "angle_deg": round(math.degrees(angle)),
                "min_radius_m": round(1 / kmax, 1),
                "direction": "gauche" if sign > 0 else "droite",
            })
        j = k1 + 1
    for c in corners:
        c["kind"] = classify(c["angle_deg"], c["min_radius_m"])
    corners.sort(key=lambda c: c["apex_m"])
    # Sens de rotation de la ligne telle que fournie (aire signée)
    area = 0.0
    for p, q in zip(rs, rs[1:] + rs[:1]):
        area += p[0] * q[1] - q[0] * p[1]
    return {
        "length_m": round(length, 1),
        "closed": closed,
        "corners": corners,
        "corners_count": len(corners),
        "hairpins_count": sum(c["kind"] == "epingle" for c in corners),
        "medium_count": sum(c["kind"] == "moyen" for c in corners),
        "fast_corners_count": sum(c["kind"] == "rapide" for c in corners),
        "orientation_of_line": "anti-horaire" if area > 0 else "horaire",
    }


if __name__ == "__main__":
    import json, sys
    pts = json.load(open(sys.argv[1]))
    r = analyze([tuple(p) for p in pts])
    print(json.dumps({k: v for k, v in r.items() if k != "corners"}, ensure_ascii=False))
    for c in r["corners"]:
        print(c["kind"], c["direction"], c["angle_deg"], "°", "R", c["min_radius_m"], "m @", c["apex_m"])
