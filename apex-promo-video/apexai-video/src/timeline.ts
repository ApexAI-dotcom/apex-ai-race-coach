/**
 * Découpage du film en secondes (storyboard §10 et §11 du prompt).
 * [début, fin] en temps absolu. La durée des séquences ajoute TAIL secondes
 * pour laisser les transitions se chevaucher.
 */
export const TAIL = 0.3;

export const TIMELINE_16x9 = {
  S01: [0.0, 3.0],
  S02: [3.0, 7.75],
  S03: [7.75, 10.0],
  S04: [10.0, 12.5],
  S05: [12.5, 15.0],
  S06: [15.0, 18.0],
  S07: [18.0, 20.5],
  S08: [20.5, 24.0],
  S09: [24.0, 29.0],
  S10: [29.0, 33.0],
  S11: [33.0, 36.0],
  S12: [36.0, 39.0],
  S13: [39.0, 42.0],
  S14: [42.0, 45.0],
  S15: [45.0, 46.0],
} as const;

export const DURATION_16x9 = 46;

export const TIMELINE_9x16 = {
  V01: [0.0, 2.5],
  V02: [2.5, 6.0],
  V03: [6.0, 8.5],
  V04: [8.5, 11.5],
  V05: [11.5, 14.0],
  V06: [14.0, 18.0],
  V07: [18.0, 20.5],
  V08: [20.5, 24.0],
} as const;

export const DURATION_9x16 = 24;

export type SceneId16 = keyof typeof TIMELINE_16x9;
export type SceneId9 = keyof typeof TIMELINE_9x16;
