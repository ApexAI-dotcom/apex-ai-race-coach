/**
 * TrackMapPro — Color utilities
 * Apex AI ADN: Vivid neon on dark background
 */

// ── Brand Colors ──
export const APEX_ORANGE = '#f97316';
export const APEX_RED = '#ff0000';
export const MODEL_GOLD = '#facc15';    // Tour IA: Or vif
export const TRACK_GREEN = '#00ff00';
export const TRACK_YELLOW = '#ffee00';
export const TRACK_GRAY = '#475569';
export const TRACK_BG_DARK = '#0a0a0f';
export const REF_WHITE = '#ffffff';

// ── Speed gradient: MAXIMUM contrast Red ↔ Green ──
// Both extremes are at full brightness and saturation
export function speedToColor(speed: number, minSpeed: number, maxSpeed: number, _medianSpeed?: number): string {
  if (maxSpeed <= minSpeed) return '#ff0000';
  
  let t = (speed - minSpeed) / (maxSpeed - minSpeed);
  t = Math.max(0, Math.min(1, t));
  
  // Direct RGB interpolation through 3 hard stops for maximum contrast:
  // 0.0  = PURE RED        rgb(255, 0, 0)
  // 0.5  = BRIGHT ORANGE   rgb(255, 165, 0)  
  // 1.0  = PURE GREEN      rgb(0, 255, 0)
  
  let r: number, g: number, b: number;
  
  if (t < 0.5) {
    // RED → ORANGE (slow → medium)
    const p = t / 0.5;
    r = 255;
    g = Math.round(p * 165);
    b = 0;
  } else {
    // ORANGE → GREEN (medium → fast)
    const p = (t - 0.5) / 0.5;
    r = Math.round(255 * (1 - p));
    g = 165 + Math.round(90 * p);  // 165 → 255
    b = 0;
  }
  
  return `rgb(${r}, ${g}, ${b})`;
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
    case 'B': return '#3b82f6';
    case 'C': return TRACK_YELLOW;
    case 'D': return APEX_ORANGE;
    case 'F': return APEX_RED;
    default: return TRACK_GRAY;
  }
}
