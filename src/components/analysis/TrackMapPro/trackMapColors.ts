/**
 * TrackMapPro — Color utilities
 * Apex AI ADN: Vibrant neon on dark background, clean readable gradients
 */

// ── Brand Colors ──
export const APEX_ORANGE = '#f97316';
export const APEX_RED = '#ff2020';
export const MODEL_GOLD = '#facc15';    // Tour IA: Or vif
export const TRACK_GREEN = '#00ff40';
export const TRACK_YELLOW = '#ffee00';
export const TRACK_GRAY = '#475569';
export const TRACK_BG_DARK = '#0a0a0f';
export const REF_WHITE = '#ffffff';

// ── Speed gradient: Clean 3-stop (Red → Orange → Green) ──
// Aggressive 3-stop gradient: max red contrast in corners
export function speedToColor(speed: number, minSpeed: number, maxSpeed: number, medianSpeed?: number): string {
  if (maxSpeed <= minSpeed) return APEX_RED;
  
  let t: number;
  if (medianSpeed && speed > minSpeed && speed < maxSpeed) {
    // Piecewise: median maps to t=0.35 (not 0.5!) to push MORE of the track into orange/red
    if (speed <= medianSpeed) {
      t = 0.35 * ((speed - minSpeed) / (medianSpeed - minSpeed));
    } else {
      t = 0.35 + 0.65 * ((speed - medianSpeed) / (maxSpeed - medianSpeed));
    }
  } else {
    t = (speed - minSpeed) / (maxSpeed - minSpeed);
  }
  
  t = Math.max(0, Math.min(1, t));
  
  // Power curve: compress greens, expand reds
  // t^0.7 makes the lower half (red/orange) occupy more visual space
  const tp = Math.pow(t, 0.7);
  
  // Hue: 0=red, 60=yellow, 120=green
  const hue = tp * 120;
  
  // Brighter at extremes, so deep red and bright green both pop
  const lightness = 45 + 15 * Math.sin(tp * Math.PI);
  
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
