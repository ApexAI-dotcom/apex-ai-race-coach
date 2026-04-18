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

// ── Speed gradient: STRONG Red → Green contrast ──
// User feedback: "on voit a peine la différence, presque pas de rouge"
// Fix: use cubic root power curve + force bottom 40% of speeds into pure red/orange
export function speedToColor(speed: number, minSpeed: number, maxSpeed: number, medianSpeed?: number): string {
  if (maxSpeed <= minSpeed) return APEX_RED;
  
  // Direct linear normalization — no piecewise, simpler and lets the power curve do the work
  let t = (speed - minSpeed) / (maxSpeed - minSpeed);
  t = Math.max(0, Math.min(1, t));
  
  // VERY aggressive power curve: t^0.4 
  // This makes the bottom half of speeds strongly red/orange
  // and only the very fastest speeds reach green
  // Example: speed at 50% → t=0.5 → 0.5^0.4 = 0.76 → hue=91 (yellow-green)
  //          speed at 25% → t=0.25 → 0.25^0.4 = 0.57 → hue=69 (yellow)
  //          speed at 10% → t=0.1 → 0.1^0.4 = 0.40 → hue=48 (orange)
  //          speed at 0%  → t=0 → hue=0 (pure red)
  // Wait that's not aggressive enough. Let me use a different approach:
  // Split into 3 hard zones:
  
  let r: number, g: number, b: number;
  
  if (t < 0.33) {
    // SLOW zone: Pure RED to ORANGE  (bottom 33% of speed range)
    const p = t / 0.33;
    r = 255;
    g = Math.round(p * 140);  // 0 → 140 (dark red to orange)
    b = 0;
  } else if (t < 0.66) {
    // MEDIUM zone: ORANGE to YELLOW-GREEN  (middle 33%)
    const p = (t - 0.33) / 0.33;
    r = 255 - Math.round(p * 100);  // 255 → 155
    g = 140 + Math.round(p * 115);  // 140 → 255
    b = 0;
  } else {
    // FAST zone: YELLOW-GREEN to PURE GREEN  (top 33%)
    const p = (t - 0.66) / 0.34;
    r = 155 - Math.round(p * 155);  // 155 → 0
    g = 255;
    b = Math.round(p * 40);  // slight cyan tint at max speed
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
