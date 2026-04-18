/**
 * TrackMapPro — Color utilities
 * Télémétrie F1 Style: Plats, Nette, Couleurs franches.
 */

// ── Brand Colors ──
export const APEX_ORANGE = '#f97316';
export const APEX_RED = '#ff2020';
export const MODEL_GOLD = '#facc15';
export const TRACK_GREEN = '#00ff40';
export const TRACK_YELLOW = '#ffee00';
export const TRACK_GRAY = '#475569';
export const TRACK_BG_DARK = '#0a0a0f';
export const REF_WHITE = '#ffffff';

// ── Speed gradient: Neon Apex ADN (Deep Blue → Red → Yellow → Green → Cyan) ──
export function speedToColor(speed: number, minSpeed: number, maxSpeed: number, medianSpeed?: number): string {
  if (maxSpeed <= minSpeed) return APEX_RED;
  
  let t: number;
  if (medianSpeed && speed > minSpeed && speed < maxSpeed) {
    if (speed <= medianSpeed) {
      t = 0.5 * ((speed - minSpeed) / (medianSpeed - minSpeed));
    } else {
      t = 0.5 + 0.5 * ((speed - medianSpeed) / (maxSpeed - medianSpeed));
    }
  } else {
    t = (speed - minSpeed) / (maxSpeed - minSpeed);
  }
  
  t = Math.max(0, Math.min(1, t));
  
  // Apex ADN dynamic multi-hue logic for strong variation
  let hue: number;
  if (t < 0.25) {
    hue = 300 + (t / 0.25) * 60; // Purple to Red
  } else if (t < 0.5) {
    hue = (t - 0.25) / 0.25 * 60; // Red to Yellow
  } else if (t < 0.75) {
    hue = 60 + (t - 0.5) / 0.25 * 80; // Yellow to Green
  } else {
    hue = 140 + (t - 0.75) / 0.25 * 60; // Green to Cyan
  }
  
  const lightness = 45 + Math.sin(t * Math.PI) * 15; 
  return `hsl(${hue % 360}, 100%, ${lightness}%)`;
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
