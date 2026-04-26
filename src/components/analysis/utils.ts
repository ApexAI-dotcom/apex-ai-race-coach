const MAX_POINTS = 100;

/**
 * Downsample arrays to at most MAX_POINTS by taking evenly spaced indices.
 */
export function downsample<T>(arr: T[], maxPoints: number = MAX_POINTS): T[] {
  if (arr.length <= maxPoints) return arr;
  const step = arr.length / maxPoints;
  const result: T[] = [];
  for (let i = 0; i < maxPoints; i++) {
    result.push(arr[Math.min(Math.floor(i * step), arr.length - 1)]);
  }
  return result;
}

/**
 * Downsample two arrays in sync (same indices).
 */
export function downsamplePair<T, U>(
  a: T[],
  b: U[],
  maxPoints: number = MAX_POINTS
): { a: T[]; b: U[] } {
  const len = Math.min(a.length, b.length);
  if (len <= maxPoints) return { a, b };
  const step = len / maxPoints;
  const outA: T[] = [];
  const outB: U[] = [];
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.min(Math.floor(i * step), len - 1);
    outA.push(a[idx]);
    outB.push(b[idx]);
  }
  return { a: outA, b: outB };
}

export const GRADE_COLORS: Record<string, string> = {
  A: "#22c55e",
  B: "#3b82f6",
  C: "#f97316",
  D: "#ef4444",
  F: "#ef4444",
};

export const STATUS_COLORS: Record<string, string> = {
  optimal: "#22c55e",
  good: "#3b82f6",
  warning: "#f97316",
};

export function enrichCornersWithCornerAnalysis(plotData: any, analysis: any) {
  if (!plotData.apex_margin?.corners) return [];
  return plotData.apex_margin.corners.map((c: any) => ({
    ...c,
    // Add fallback or derived fields if needed for the CornerDetailsGrid
  }));
}

export interface CornerMarker {
  id: number;
  label: string;
  /** Distance relative to lap start (0-based metres). Each chart adds its own lapStart. */
  distance_m: number;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = Math.PI / 180;
  const φ1 = lat1 * toRad, φ2 = lat2 * toRad;
  const Δφ = (lat2 - lat1) * toRad, Δλ = (lon2 - lon1) * toRad;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Find exactly `targetCount` speed minima using a progressive window search.
 * Returns distances relative to the first point (0-based).
 */
function findSpeedMinima(
  distArr: number[],
  speedArr: number[],
  targetCount: number,
): number[] {
  const n = Math.min(distArr.length, speedArr.length);
  if (n < 3 || targetCount === 0) return [];

  // Smooth with light moving average
  const sw = Math.max(1, Math.floor(n / 80));
  const smoothed = speedArr.map((_, i) => {
    let s = 0, c = 0;
    for (let j = Math.max(0, i - sw); j <= Math.min(n - 1, i + sw); j++) { s += speedArr[j]; c++; }
    return s / c;
  });

  // Try progressively smaller detection windows until we have >= targetCount candidates
  for (const win of [10, 7, 5, 3, 2, 1]) {
    const candidates: { d: number; v: number }[] = [];
    for (let i = win; i < n - win; i++) {
      const v = smoothed[i];
      let ok = true;
      for (let j = i - win; j <= i + win; j++) {
        if (j !== i && smoothed[j] < v) { ok = false; break; }
      }
      if (ok) candidates.push({ d: distArr[i] - distArr[0], v });
    }
    if (candidates.length >= targetCount) {
      // Keep deepest targetCount, sorted back by position
      return candidates
        .sort((a, b) => a.v - b.v)
        .slice(0, targetCount)
        .sort((a, b) => a.d - b.d)
        .map(c => c.d);
    }
  }
  return [];
}

/**
 * Compute corner marker positions relative to lap start (0-based metres).
 *
 * Strategy:
 *  1. GPS + haversine: snap trajectory_2d.corners (GPS) to nearest point in a real
 *     trajectory lap and compute cumulative distance. Exact same corners as the track map.
 *  2. Speed-minima fallback: if no trajectory lap GPS data is available, detect the N
 *     lowest-speed points in the speed trace. N is forced to match corner count.
 *
 * Each chart adds series[0].distance_m (lapStart) to get absolute X-axis coordinates.
 */
export function computeCornerMarkersRelative(
  trajectoryCorners: { id: number; label: string; lat: number; lon: number }[] | undefined,
  trajectoryLaps: { is_best?: boolean; is_synthetic?: boolean; lat: number[]; lon: number[] }[] | undefined,
  speedDistArr?: number[],
  speedArr?: number[],
): CornerMarker[] {
  if (!trajectoryCorners?.length) return [];

  // ── 1. GPS approach ──────────────────────────────────────────────────────
  const realLaps = trajectoryLaps?.filter(l => !l.is_synthetic && l.lat?.length > 20);
  const refLap =
    realLaps?.find(l => l.is_best) ??
    realLaps?.[0];

  if (refLap?.lat?.length && refLap?.lon?.length) {
    const lat = refLap.lat;
    const lon = refLap.lon;
    const n = Math.min(lat.length, lon.length);
    if (n >= 2) {
      const dist = new Array<number>(n);
      dist[0] = 0;
      for (let i = 1; i < n; i++) {
        dist[i] = dist[i - 1] + haversineDistance(lat[i - 1], lon[i - 1], lat[i], lon[i]);
      }
      return trajectoryCorners.map(c => {
        let bestIdx = 0, bestSq = Infinity;
        for (let i = 0; i < n; i++) {
          const sq = (lat[i] - c.lat) ** 2 + (lon[i] - c.lon) ** 2;
          if (sq < bestSq) { bestSq = sq; bestIdx = i; }
        }
        return { id: c.id, label: c.label, distance_m: dist[bestIdx] };
      });
    }
  }

  // ── 2. Speed-minima fallback ─────────────────────────────────────────────
  if (speedDistArr?.length && speedArr?.length) {
    const positions = findSpeedMinima(speedDistArr, speedArr, trajectoryCorners.length);
    return positions.map((d, i) => ({
      id: trajectoryCorners[i]?.id ?? i + 1,
      label: trajectoryCorners[i]?.label ?? `V${i + 1}`,
      distance_m: d,
    }));
  }

  return [];
}
