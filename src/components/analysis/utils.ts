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
  /** Absolute cumulative distance in metres — same coordinate system as the chart X axis. */
  distance_m: number;
}

/**
 * Detect corner apexes from a speed trace by finding the N speed minima
 * (lowest-speed points = apex of each corner).
 *
 * Uses win=1 (strict local minimum = lower than both immediate neighbours) so
 * ALL minima are found regardless of how close corners are, then keeps the N
 * with lowest speed. Returns ABSOLUTE distances matching the chart X axis.
 *
 * cornerLabels must be ordered along the track (V1 first, Vn last).
 */
export function computeCornerMarkersFromSpeed(
  distArr: number[],
  speedArr: number[],
  cornerLabels: string[],
): CornerMarker[] {
  const n = Math.min(distArr.length, speedArr.length);
  if (n < 5 || cornerLabels.length === 0) return [];

  // Light moving-average smoothing (3-point window) to remove GPS jitter
  const smoothed = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const lo = Math.max(0, i - 1), hi = Math.min(n - 1, i + 1);
    let s = 0, c = 0;
    for (let j = lo; j <= hi; j++) { s += speedArr[j]; c++; }
    smoothed[i] = s / c;
  }

  // Collect ALL strict local minima (lower than both immediate neighbours)
  const candidates: { d: number; v: number }[] = [];
  for (let i = 1; i < n - 1; i++) {
    if (smoothed[i] < smoothed[i - 1] && smoothed[i] < smoothed[i + 1]) {
      candidates.push({ d: distArr[i], v: smoothed[i] });
    }
  }
  if (candidates.length === 0) return [];

  // Keep the N deepest (lowest speed) and re-sort by track position
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
