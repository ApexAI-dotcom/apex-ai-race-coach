import { useSyncExternalStore } from "react";

/**
 * Curseur commun carte ↔ graphiques (comme Race Studio) : survoler la courbe
 * de vitesse place un point sur la carte, survoler la carte place un trait
 * sur la courbe. La position est une fraction du tour (0 = ligne, 1 = arrivée),
 * seule mesure commune à des séries échantillonnées différemment.
 */
export interface AnalysisCursor {
  frac: number;
  source: "map" | "chart";
}

let current: AnalysisCursor | null = null;
const listeners = new Set<() => void>();

export function setAnalysisCursor(c: AnalysisCursor | null) {
  if (c === current || (c && current && c.source === current.source && Math.abs(c.frac - current.frac) < 1e-4)) return;
  current = c;
  listeners.forEach((l) => l());
}

export function getAnalysisCursor(): AnalysisCursor | null {
  return current;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAnalysisCursor(): AnalysisCursor | null {
  return useSyncExternalStore(subscribe, () => current, () => null);
}

/** Longueurs cumulées d'une polyligne, normalisées de 0 à 1. */
export function cumulativeFractions(points: { x: number; y: number }[]): number[] {
  const out = [0];
  for (let i = 1; i < points.length; i++) {
    out.push(out[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
  }
  const total = out[out.length - 1] || 1;
  return out.map((v) => v / total);
}

/** Index du point dont la fraction est la plus proche (recherche dichotomique). */
export function indexAtFraction(fracs: number[], f: number): number {
  let lo = 0;
  let hi = fracs.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (fracs[mid] < f) lo = mid;
    else hi = mid;
  }
  return Math.abs(fracs[lo] - f) <= Math.abs(fracs[hi] - f) ? lo : hi;
}
