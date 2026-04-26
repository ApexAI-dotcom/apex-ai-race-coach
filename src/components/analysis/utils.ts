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
  distance_m: number;
}

/**
 * Compute the cumulative distance (absolute, in the X-axis coordinate system used by
 * speed_trace / throttle_brake / time_delta charts) of each corner apex by snapping its
 * GPS coordinates to the nearest point in a reference lap's trajectory.
 *
 * Returns markers in the SAME coordinate system as `lap.distance_m` — no offset needed
 * downstream.
 */
export function computeCornerMarkers(
  trajectoryCorners: { id: number; label: string; lat: number; lon: number }[] | undefined,
  trajectoryLaps:
    | { lap_number?: number; lat: number[]; lon: number[]; distance_m?: number[] }[]
    | undefined,
  refLapNumber: number | undefined
): CornerMarker[] {
  if (!trajectoryCorners?.length || !trajectoryLaps?.length) return [];

  const refLap =
    (refLapNumber != null && trajectoryLaps.find((l) => l.lap_number === refLapNumber)) ||
    (refLapNumber != null && trajectoryLaps[refLapNumber - 1]) ||
    trajectoryLaps.find((l) => l.distance_m && l.distance_m.length > 0 && l.lat?.length > 0) ||
    trajectoryLaps[0];

  if (!refLap?.lat?.length || !refLap?.lon?.length || !refLap.distance_m?.length) return [];
  const lat = refLap.lat;
  const lon = refLap.lon;
  const dist = refLap.distance_m;
  const n = Math.min(lat.length, lon.length, dist.length);
  if (n === 0) return [];

  return trajectoryCorners.map((c) => {
    let bestIdx = 0;
    let bestSq = Infinity;
    for (let i = 0; i < n; i++) {
      const dLat = lat[i] - c.lat;
      const dLon = lon[i] - c.lon;
      const sq = dLat * dLat + dLon * dLon;
      if (sq < bestSq) {
        bestSq = sq;
        bestIdx = i;
      }
    }
    return { id: c.id, label: c.label, distance_m: dist[bestIdx] };
  });
}
