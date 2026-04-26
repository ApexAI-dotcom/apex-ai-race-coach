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
  /**
   * Distance from the START of the lap in metres (0-based relative).
   * Charts must add their own `lapStart` (series[0].distance_m) to obtain
   * the absolute X coordinate used by Recharts.
   */
  distance_m: number;
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Snap each corner (by GPS lat/lon) to the nearest point on any available
 * trajectory lap and return its cumulative distance from lap start (0-based).
 * This guarantees exact visual alignment with the track map corner labels.
 *
 * Returns null when trajectory laps are unavailable or have insufficient GPS data.
 */
export function computeCornerMarkersFromGPS(
  laps: Array<{ lat: number[]; lon: number[]; is_synthetic?: boolean }> | null | undefined,
  corners: Array<{ lat: number; lon: number; label: string }> | null | undefined,
): CornerMarker[] | null {
  if (!laps?.length || !corners?.length) return null;

  // Prefer a real lap; fall back to synthetic as last resort
  const lap =
    laps.find(l => !l.is_synthetic && l.lat?.length > 5 && l.lon?.length > 5) ??
    laps.find(l => l.lat?.length > 5 && l.lon?.length > 5);
  if (!lap) return null;

  const n = Math.min(lap.lat.length, lap.lon.length);

  // Cumulative haversine distance along the GPS path (0-based)
  const cumDist = new Array<number>(n).fill(0);
  for (let i = 1; i < n; i++) {
    cumDist[i] = cumDist[i - 1] + haversineMeters(lap.lat[i - 1], lap.lon[i - 1], lap.lat[i], lap.lon[i]);
  }

  return corners.map((c, i) => {
    let minD = Infinity;
    let minIdx = 0;
    for (let j = 0; j < n; j++) {
      const d = haversineMeters(c.lat, c.lon, lap.lat[j], lap.lon[j]);
      if (d < minD) { minD = d; minIdx = j; }
    }
    return { id: i + 1, label: c.label, distance_m: cumDist[minIdx] };
  });
}

/**
 * Detect corner apexes from a speed trace by finding the N deepest speed minima.
 * Returns distances relative to the start of the provided arrays (0-based).
 * Falls back when GPS corner snapping is unavailable.
 */
export function computeCornerMarkersFromSpeed(
  distArr: number[],
  speedArr: number[],
  cornerLabels: string[],
): CornerMarker[] {
  const n = Math.min(distArr.length, speedArr.length);
  if (n < 5 || cornerLabels.length === 0) return [];

  const lapStart0 = distArr[0];

  // 5-point moving-average smoothing to suppress GPS/telemetry jitter
  const smoothed = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const lo = Math.max(0, i - 2), hi = Math.min(n - 1, i + 2);
    let s = 0, c = 0;
    for (let j = lo; j <= hi; j++) { s += speedArr[j]; c++; }
    smoothed[i] = s / c;
  }

  // Collect strict local minima (win=1: lower than both immediate neighbours)
  const candidates: { d: number; v: number }[] = [];
  for (let i = 1; i < n - 1; i++) {
    if (smoothed[i] < smoothed[i - 1] && smoothed[i] < smoothed[i + 1]) {
      candidates.push({ d: distArr[i] - lapStart0, v: smoothed[i] });
    }
  }
  if (candidates.length === 0) return [];

  // Keep the N deepest and re-sort by track position
  const count = cornerLabels.length;
  const selected = candidates
    .sort((a, b) => a.v - b.v)
    .slice(0, count)
    .sort((a, b) => a.d - b.d);

  return selected.map((m, i) => ({
    id: i + 1,
    label: cornerLabels[i] ?? `V${i + 1}`,
    distance_m: m.d,
  }));
}
