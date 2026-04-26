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
  /** Distance relative to lap start (metres, 0-based). Add chart lapStart to get absolute. */
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
 * Compute corner positions as distances relative to the lap start (0-based metres).
 *
 * Uses GPS coordinates from trajectory_2d.corners snapped to the nearest point in the
 * reference lap's GPS trajectory. Cumulative distance is computed via haversine so this
 * works even when trajectory_2d.laps[i].distance_m is absent.
 *
 * Each chart adds its own lapStart (= series[0].distance_m) to get absolute coordinates
 * that align with that chart's X axis, regardless of which lap is displayed.
 */
export function computeCornerMarkersRelative(
  trajectoryCorners: { id: number; label: string; lat: number; lon: number }[] | undefined,
  trajectoryLaps:
    | { is_best?: boolean; lap_number?: number; lat: number[]; lon: number[] }[]
    | undefined,
): CornerMarker[] {
  if (!trajectoryCorners?.length || !trajectoryLaps?.length) return [];

  // Prefer the best lap; fall back to the first lap with enough GPS points
  const refLap =
    trajectoryLaps.find((l) => l.is_best && l.lat?.length > 10) ??
    trajectoryLaps.find((l) => l.lat?.length > 10) ??
    trajectoryLaps[0];

  if (!refLap?.lat?.length || !refLap?.lon?.length) return [];

  const lat = refLap.lat;
  const lon = refLap.lon;
  const n = Math.min(lat.length, lon.length);
  if (n < 2) return [];

  // Build 0-based cumulative distance array via haversine
  const dist = new Array<number>(n);
  dist[0] = 0;
  for (let i = 1; i < n; i++) {
    dist[i] = dist[i - 1] + haversineDistance(lat[i - 1], lon[i - 1], lat[i], lon[i]);
  }

  // Snap each corner's GPS to the nearest trajectory point
  return trajectoryCorners.map((c) => {
    let bestIdx = 0;
    let bestSq = Infinity;
    for (let i = 0; i < n; i++) {
      const dLat = lat[i] - c.lat;
      const dLon = lon[i] - c.lon;
      const sq = dLat * dLat + dLon * dLon;
      if (sq < bestSq) { bestSq = sq; bestIdx = i; }
    }
    return { id: c.id, label: c.label, distance_m: dist[bestIdx] };
  });
}
