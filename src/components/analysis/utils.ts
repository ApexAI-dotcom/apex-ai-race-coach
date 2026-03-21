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
