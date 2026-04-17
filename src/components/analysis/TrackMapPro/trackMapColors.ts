/**
 * TrackMapPro — Color utilities
 * Centralise toutes les couleurs et fonctions d'interpolation
 */

// ── Brand Colors ──
export const APEX_ORANGE = '#f97316';
export const APEX_RED = '#dc2626';
export const APEX_DARK_RED = '#991b1b';
export const MODEL_GOLD = '#eab308';
export const MODEL_GOLD_LIGHT = '#facc15';
export const TRACK_GREEN = '#22c55e';
export const TRACK_GRAY = '#64748b';
export const TRACK_BG_DARK = '#0a0a0f';
export const TRACK_BG_CARD = '#111118';
export const REF_WHITE = '#e2e8f0';

// ── Speed gradient: red (slow) → green (fast) ──
// HSL: red = hue 0°, green = hue 120°
export function speedToColor(speed: number, minSpeed: number, maxSpeed: number): string {
  if (maxSpeed <= minSpeed) return APEX_RED;
  const t = Math.max(0, Math.min(1, (speed - minSpeed) / (maxSpeed - minSpeed)));
  // Interpolate hue 0° (red, slow) → 120° (green, fast)
  const hue = t * 120;
  return `hsl(${hue}, 100%, 45%)`;
}

// ── Speed gradient as raw RGB for SVG stops ──
export function speedToRGBArray(speed: number, minSpeed: number, maxSpeed: number): [number, number, number] {
  if (maxSpeed <= minSpeed) return [220, 38, 38]; // APEX_RED
  const t = Math.max(0, Math.min(1, (speed - minSpeed) / (maxSpeed - minSpeed)));
  // Basic linear RGB interpolation for fallback
  const r = Math.round(220 * (1 - t) + 34 * t);
  const g = Math.round(38 * (1 - t) + 197 * t);
  const b = Math.round(38 * (1 - t) + 94 * t);
  return [r, g, b];
}

// ── Braking segment color ──
export type BrakingPhase = 'braking' | 'acceleration' | 'coasting';

export function brakingSegmentColor(throttlePct: number, brakePct: number): string {
  if (brakePct > 15) return APEX_RED;
  if (throttlePct > 60) return TRACK_GREEN;
  return TRACK_GRAY;
}

export function brakingPhase(throttlePct: number, brakePct: number): BrakingPhase {
  if (brakePct > 15) return 'braking';
  if (throttlePct > 60) return 'acceleration';
  return 'coasting';
}

// ── Grade → color ──
export function gradeColor(grade: string): string {
  switch (grade.toUpperCase()) {
    case 'A': return TRACK_GREEN;
    case 'B': return '#3b82f6'; // blue
    case 'C': return MODEL_GOLD;
    case 'D': return APEX_ORANGE;
    case 'F': return APEX_RED;
    default: return TRACK_GRAY;
  }
}

// ── Lap colors for multi-lap comparison ──
const LAP_COLORS = [APEX_ORANGE, '#8b5cf6', TRACK_GREEN, '#06b6d4', '#ec4899', '#f59e0b'];
export function lapColor(index: number): string {
  return LAP_COLORS[index % LAP_COLORS.length];
}
