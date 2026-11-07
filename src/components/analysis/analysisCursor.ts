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

/**
 * Branche une courbe en distance sur le curseur commun : survol -> point sur
 * la carte (et la mini-carte) ; survol de la carte -> trait sur la courbe.
 */
export function useChartCursor(min: number, max: number) {
  const cursor = useAnalysisCursor();
  const span = Math.max(1e-6, max - min);
  return {
    cursorX: cursor?.source === "map" ? min + cursor.frac * span : null,
    onMouseMove: (st: { activeLabel?: string | number } | null) => {
      if (st?.activeLabel == null) return;
      const f = (Number(st.activeLabel) - min) / span;
      if (Number.isFinite(f)) setAnalysisCursor({ frac: Math.min(1, Math.max(0, f)), source: "chart" });
    },
    onMouseLeave: () => {
      if (getAnalysisCursor()?.source === "chart") setAnalysisCursor(null);
    },
  };
}
