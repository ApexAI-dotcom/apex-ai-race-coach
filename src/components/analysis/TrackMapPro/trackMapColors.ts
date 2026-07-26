/**
 * TrackMapPro — Color utilities
 * Apex AI ADN: Vivid neon on dark background
 */

// ── Brand Colors ──
export const APEX_ORANGE = "#f97316";
export const APEX_RED = "#ff0000";
export const MODEL_GOLD = "#facc15"; // Tour IA: Or vif
export const TRACK_GREEN = "#00ff00";
export const TRACK_YELLOW = "#ffee00";
export const TRACK_GRAY = "#475569";
export const TRACK_BG_DARK = "#0a0a0f";
export const REF_WHITE = "#ffffff";

// ── Speed gradient: MAXIMUM contrast Red ↔ Green ──
// Both extremes are at full brightness and saturation
/**
 * Rang d'une vitesse dans la session (0 = la plus lente, 1 = la plus rapide).
 * Colorer selon le rang plutôt que selon la position entre min et max étale les
 * couleurs là où les écarts existent réellement : sur un tracé de karting, une
 * échelle linéaire tasse tout le tour dans les tons orangés.
 */
function percentileRank(speed: number, quantiles: number[]): number {
  const n = quantiles.length;
  if (n < 2) return 0;
  if (speed <= quantiles[0]) return 0;
  if (speed >= quantiles[n - 1]) return 1;
  let lo = 0;
  let hi = n - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (quantiles[mid] <= speed) lo = mid;
    else hi = mid;
  }
  return lo / (n - 1);
}

export function speedToColor(
  speed: number,
  minSpeed: number,
  maxSpeed: number,
  medianSpeed?: number,
  quantiles?: number[]
): string {
  if (maxSpeed <= minSpeed) return "#ff0000";

  let t =
    quantiles && quantiles.length > 1
      ? percentileRank(speed, quantiles)
      : (speed - minSpeed) / (maxSpeed - minSpeed);
  t = Math.max(0, Math.min(1, t));

  // Power curve to compress the middle and expand the edges.
  // We want < 50% speed to be VERY RED, and > 75% speed to be VERY GREEN.

  let r: number, g: number, b: number;

  if (t < 0.35) {
    // 0 to 35% of speed range is almost pure RED to dark ORANGE
    const p = t / 0.35;
    r = 255;
    g = Math.round(p * 128); // 0 to 128 (pure red to dark orange)
    b = 0;
  } else if (t < 0.65) {
    // 35% to 65% is ORANGE to YELLOW
    const p = (t - 0.35) / 0.3;
    r = 255;
    g = 128 + Math.round(p * 127); // 128 to 255
    b = 0;
  } else {
    // 65% to 100% is YELLOW to PURE GREEN. We drop the Red very fast to get pure green.
    const p = (t - 0.65) / 0.35;
    r = 255 - Math.round(p * 255); // 255 to 0
    g = 255;
    b = 0;
  }

  return `rgb(${r}, ${g}, ${b})`;
}

// ── Braking segment color ──
export type BrakingPhase = "braking" | "acceleration" | "coasting";

export function brakingSegmentColor(throttlePct: number, brakePct: number): string {
  if (brakePct > 15) return APEX_RED;
  if (throttlePct > 60) return TRACK_GREEN;
  return TRACK_GRAY;
}

export function brakingPhase(throttlePct: number, brakePct: number): BrakingPhase {
  if (brakePct > 15) return "braking";
  if (throttlePct > 60) return "acceleration";
  return "coasting";
}

// ── Grade → color ──
export function gradeColor(grade: string): string {
  switch (grade.toUpperCase()) {
    case "A":
      return TRACK_GREEN;
    case "B":
      return "#3b82f6";
    case "C":
      return TRACK_YELLOW;
    case "D":
      return APEX_ORANGE;
    case "F":
      return APEX_RED;
    default:
      return TRACK_GRAY;
  }
}
