/**
 * TrackMapPro — Color utilities
 * Télémétrie F1 Style: Plats, Nette, Couleurs franches.
 */

// ── Brand Colors ──
export const APEX_ORANGE = '#f97316';
export const APEX_RED = '#ff2020';      // F1 Slow / Brake
export const MODEL_CYAN = '#00e5ff';    // AI Lap (Laser bright cyan)
export const TRACK_GREEN = '#00ff40';   // F1 Fast / Acceleration
export const TRACK_YELLOW = '#ffee00';  // F1 Medium
export const TRACK_GRAY = '#475569';
export const TRACK_BG_DARK = '#0a0a0f'; // Dark flat 
export const REF_WHITE = '#ffffff';

// ── Speed gradient: Red (slow) → Yellow (medium) → Green (fast) ──
export function speedToColor(speed: number, minSpeed: number, maxSpeed: number, medianSpeed?: number): string {
  if (maxSpeed <= minSpeed) return APEX_RED;
  
  let t: number;
  if (medianSpeed && speed > minSpeed && speed < maxSpeed) {
    // Piecewise strict linear interpolation forcing median to exactly t=0.5 (Yellow)
    if (speed <= medianSpeed) {
      t = 0.5 * ((speed - minSpeed) / (medianSpeed - minSpeed));
    } else {
      t = 0.5 + 0.5 * ((speed - medianSpeed) / (maxSpeed - medianSpeed));
    }
  } else {
    t = (speed - minSpeed) / (maxSpeed - minSpeed);
  }
  
  t = Math.max(0, Math.min(1, t));
  
  // HSL: 0 = Red, 60 = Yellow, 120 = Green.
  // We want pure vibrant hue shift from 0 to 120.
  const hue = Math.round(t * 120);
  
  // In F1, colors are pure bright spots, no luminosity dips.
  return `hsl(${hue}, 100%, 50%)`;
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
