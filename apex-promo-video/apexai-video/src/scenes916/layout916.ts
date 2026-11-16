/**
 * Géométrie du 9:16 (1080 × 1920).
 * Zone sûre (§11) : tout texte et tout élément clé reste dans x ∈ [80, 940] et y ∈ [260, 1480].
 * Le centre horizontal de la zone sûre est donc x = 510 (et non 540).
 */
export const W9 = 1080;
export const H9 = 1920;
export const SAFE = { x0: 80, x1: 940, y0: 260, y1: 1480 };
export const SX = (SAFE.x0 + SAFE.x1) / 2; // 510
export const SW = SAFE.x1 - SAFE.x0; // 860

/** Carte d'import de V04 : V03 rétrécit son panneau rouge exactement sur ce rectangle. */
export const V04_CARD = {
  x: SAFE.x0,
  y: 610,
  w: SW,
  k: 1.25,
  /** hauteur à l'état vide : marges 24k × 2 + zone de dépôt 190k */
  hEmpty: (24 * 2 + 190) * 1.25,
};

/** Carte du circuit (V02, V06, V07). */
export const MAP9 = 860;
