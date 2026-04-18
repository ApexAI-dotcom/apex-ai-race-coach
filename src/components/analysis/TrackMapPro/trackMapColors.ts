/**
 * TrackMapPro — Color utilities
 * Apex AI ADN: Vibrant neon on dark background, clean readable gradients
 */

// ── Brand Colors ──
export const APEX_ORANGE = '#f97316';
export const APEX_RED = '#ff2020';
export const MODEL_GOLD = '#00e5ff';    // Tour IA: Cyan vif — DOIT trancher avec le gradient Rouge→Vert
export const TRACK_GREEN = '#00ff40';
export const TRACK_YELLOW = '#ffee00';
export const TRACK_GRAY = '#475569';
export const TRACK_BG_DARK = '#0a0a0f';
export const REF_WHITE = '#ffffff';

// ── Speed gradient: Clean 3-stop (Red → Orange → Green) ──
// No purple, no cyan, no blue. Just brake-to-gas.
export function speedToColor(speed: number, minSpeed: number, maxSpeed: number, medianSpeed?: number): string {
  if (maxSpeed <= minSpeed) return APEX_RED;
  
  let t: number;
  if (medianSpeed && speed > minSpeed && speed < maxSpeed) {
    // Piecewise: ensures median maps to exact midpoint for visible contrast
    if (speed <= medianSpeed) {
      t = 0.5 * ((speed - minSpeed) / (medianSpeed - minSpeed));
    } else {
      t = 0.5 + 0.5 * ((speed - medianSpeed) / (maxSpeed - medianSpeed));
    }
  } else {
    t = (speed - minSpeed) / (maxSpeed - minSpeed);
  }
  
  t = Math.max(0, Math.min(1, t));
  
  // Simple 3-stop gradient: Red (0°) → Orange (30°) → Yellow (55°) → Green (120°)
  // Keeps it readable: slow = red, medium = orange/yellow, fast = green
  const hue = t * 120;  // 0=red, 60=yellow, 120=green
  
  // Slight brightness boost in the middle range so orange/yellow pops on dark bg
  const lightness = 48 + Math.sin(t * Math.PI) * 8;
  
  return `hsl(${hue}, 100%, ${lightness}%)`;
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
