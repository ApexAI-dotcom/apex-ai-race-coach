import { speedToColor } from "@/components/analysis/TrackMapPro/trackMapColors";
import { DEMO_CHART, DEMO_LAP, DEMO_POINTS, DEMO_SPEED, DEMO_XY } from "./demoSession";

/**
 * Géométrie dérivée de la session de démo : tout est calculé une seule fois,
 * à l'import, puis réutilisé par chaque aperçu.
 */

const N = DEMO_POINTS;

export const trackX = (i: number) => DEMO_XY[2 * ((i + N) % N)];
export const trackY = (i: number) => DEMO_XY[2 * ((i + N) % N) + 1];

/** Position sur la boucle pour un indice fractionnaire (interpolée). */
export function trackPointAt(index: number): { x: number; y: number } {
  const f = ((index % N) + N) % N;
  const i = Math.floor(f);
  const k = f - i;
  return {
    x: trackX(i) + (trackX(i + 1) - trackX(i)) * k,
    y: trackY(i) + (trackY(i + 1) - trackY(i)) * k,
  };
}

/** Tracé complet, fermé. */
export const TRACK_D = (() => {
  let d = `M${trackX(0)},${trackY(0)}`;
  for (let i = 1; i < N; i++) d += `L${trackX(i)},${trackY(i)}`;
  return `${d}Z`;
})();

const sortedSpeeds = [...DEMO_SPEED].sort((a, b) => a - b);
const QUANTILES = Array.from({ length: 101 }, (_, r) =>
  sortedSpeeds[Math.round((r / 100) * (sortedSpeeds.length - 1))]
);
const MEDIAN = QUANTILES[50];

export interface SpeedSegment {
  d: string;
  color: string;
}

/**
 * Le tracé découpé en petits tronçons colorés selon la vitesse du meilleur
 * tour — même échelle (rang de la vitesse) et mêmes couleurs que la carte de
 * l'app : rouge là où l'on est lent, vert là où l'on est rapide.
 */
export const SPEED_SEGMENTS: SpeedSegment[] = (() => {
  const STEP = 5;
  const out: SpeedSegment[] = [];
  for (let a = 0; a < N; a += STEP) {
    const b = Math.min(a + STEP, N);
    let d = `M${trackX(a)},${trackY(a)}`;
    let sum = 0;
    for (let i = a; i <= b; i++) {
      if (i > a) d += `L${trackX(i)},${trackY(i)}`;
      sum += DEMO_SPEED[i % N];
    }
    const avg = sum / (b - a + 1);
    out.push({
      d,
      color: speedToColor(avg, DEMO_LAP.speedMin, DEMO_LAP.speedMax, MEDIAN, QUANTILES),
    });
  }
  return out;
})();

/** Chrono cumulé du tour 4 en chaque point des courbes (un point sur deux). */
const T4 = DEMO_CHART.t4;
const LAST = T4.length - 1;

/** Durée parcourue par le tour 4 dans les données de démo (secondes). */
export const DEMO_LAP_SECONDS = T4[LAST];

/**
 * Indice (0..N) du tracé atteint à l'instant `t` (secondes depuis la ligne).
 * Sans `delta`, c'est le tour 4 ; avec l'écart du tour 9 sur le tour 4, c'est
 * le tour 9 — plus lent, il arrive donc plus tard à chaque point.
 */
export function indexAtTime(t: number, delta: readonly number[] | null = null): number {
  const timeAt = (k: number) => T4[k] + (delta ? delta[k] : 0);
  const tt = Math.max(0, Math.min(t, timeAt(LAST)));
  let lo = 0;
  let hi = LAST;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (timeAt(mid) <= tt) lo = mid;
    else hi = mid;
  }
  const span = timeAt(hi) - timeAt(lo) || 1;
  const k = lo + (tt - timeAt(lo)) / span;
  return k * 2; // les courbes sont échantillonnées un point sur deux
}
