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
 * Detect corner apex positions from the speed trace by finding local speed minima.
 * This works entirely from the chart's own data — no GPS or optional fields needed.
 *
 * Algorithm:
 *  1. Smooth the speed signal to remove noise
 *  2. Find all local minima with an adaptive window
 *  3. Merge minima that are too close (keep lowest speed)
 *  4. Keep the N deepest, re-sorted by position, labelled from cornerLabels
 */
export function computeCornerMarkersFromSpeed(
  distArr: number[],
  speedArr: number[],
  cornerLabels: string[],
): CornerMarker[] {
  const n = Math.min(distArr.length, speedArr.length);
  if (n < 10 || cornerLabels.length === 0) return [];

  const expectedCount = cornerLabels.length;
  const totalDist = distArr[n - 1] - distArr[0];

  // Moving-average smoothing to reduce sensor noise
  const smoothWin = Math.max(2, Math.floor(n / 60));
  const smoothed = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let sum = 0, cnt = 0;
    for (let j = Math.max(0, i - smoothWin); j <= Math.min(n - 1, i + smoothWin); j++) {
      sum += speedArr[j]; cnt++;
    }
    smoothed[i] = sum / cnt;
  }

  // Find local minima (strict: lower than all neighbours in window)
  const localWin = Math.max(2, Math.floor(n / (expectedCount * 5)));
  const candidates: { distance_m: number; speed: number }[] = [];
  for (let i = localWin; i < n - localWin; i++) {
    const v = smoothed[i];
    let isMin = true;
    for (let j = i - localWin; j <= i + localWin; j++) {
      if (j !== i && smoothed[j] <= v) { isMin = false; break; }
    }
    if (isMin) candidates.push({ distance_m: distArr[i], speed: v });
  }
  if (candidates.length === 0) return [];

  // Merge candidates closer than minGap, keeping lowest speed
  const minGap = totalDist / (expectedCount * 3);
  const merged: { distance_m: number; speed: number }[] = [];
  for (const c of candidates) {
    const last = merged[merged.length - 1];
    if (last && c.distance_m - last.distance_m < minGap) {
      if (c.speed < last.speed) merged[merged.length - 1] = c;
    } else {
      merged.push(c);
    }
  }

  // Keep the N deepest minima, re-sort by track position
  let selected = merged;
  if (merged.length > expectedCount) {
    selected = [...merged].sort((a, b) => a.speed - b.speed).slice(0, expectedCount);
    selected.sort((a, b) => a.distance_m - b.distance_m);
  }

  return selected.map((m, i) => ({
    id: i + 1,
    label: cornerLabels[i] ?? `V${i + 1}`,
    distance_m: m.distance_m,
  }));
}
