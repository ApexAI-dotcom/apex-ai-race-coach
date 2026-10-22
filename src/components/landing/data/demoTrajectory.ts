import type {
  IdealLap,
  RacingLineMeta,
  TrackEdges,
  TrajectoryCorner,
  TrajectoryLap,
} from "@/types/analysis";
import { DEMO_CORNERS, DEMO_LAP, DEMO_LENGTH_M, DEMO_POINTS, DEMO_SPEED, DEMO_XY } from "./demoSession";

/**
 * La session de démo (Adria Karting Raceway) remise dans le format exact que
 * l'analyse envoie à la « Carte du circuit » : c'est ainsi le VRAI composant de
 * l'app qui dessine l'aperçu de l'accueil, pas une copie.
 *
 * Réel : le tracé, la vitesse du meilleur tour (tour 4), les 12 virages et les
 * chronos du Tour parfait IA (49.68 s → 48.45 s, −1.23 s).
 * Reconstitué : la trajectoire jaune et les bords de piste. L'app les calcule
 * côté serveur ; ici on les dérive du tracé réel (ligne un peu moins courbée,
 * piste de 8 m) pour montrer ce qu'on voit, sans prétendre afficher leurs
 * valeurs exactes.
 */

const N = DEMO_POINTS;

// Le tracé est en unités 1000 x 1000 ; l'app attend des coordonnées GPS. Une
// projection linéaire suffit : la carte les remet à l'échelle de toute façon.
const LAT0 = 45;
const LON0 = 12.3;
const DEG_PER_UNIT = 1e-5;
const COS_LAT = Math.cos((LAT0 * Math.PI) / 180);
const toLat = (y: number) => LAT0 + (1000 - y) * DEG_PER_UNIT;
const toLon = (x: number) => LON0 + (x * DEG_PER_UNIT) / COS_LAT;

const xs = Array.from({ length: N }, (_, i) => DEMO_XY[2 * i]);
const ys = Array.from({ length: N }, (_, i) => DEMO_XY[2 * i + 1]);

/** Mètres par unité du tracé (longueur affichée du circuit / longueur du tracé). */
const M_PER_UNIT = (() => {
  let len = 0;
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    len += Math.hypot(xs[j] - xs[i], ys[j] - ys[i]);
  }
  return DEMO_LENGTH_M / len;
})();

const wrap = (i: number) => ((i % N) + N) % N;

/** Moyenne glissante sur une boucle fermée. */
function smoothLoop(values: number[], radius: number): number[] {
  return values.map((_, i) => {
    let s = 0;
    for (let k = -radius; k <= radius; k++) s += values[wrap(i + k)];
    return s / (2 * radius + 1);
  });
}

/** Normale unitaire à la trajectoire en chaque point (repère x droite, y bas). */
const normals = Array.from({ length: N }, (_, i) => {
  const dx = xs[wrap(i + 1)] - xs[wrap(i - 1)];
  const dy = ys[wrap(i + 1)] - ys[wrap(i - 1)];
  const d = Math.hypot(dx, dy) || 1;
  return { x: -dy / d, y: dx / d };
});

/** Tour parfait : le tracé réel, lissé (virages un peu moins serrés), à 1,6 m près. */
const aiPath = (() => {
  const MAX_UNITS = 1.6 / M_PER_UNIT;
  const sx = smoothLoop(smoothLoop(xs, 9), 9);
  const sy = smoothLoop(smoothLoop(ys, 9), 9);
  let dx = xs.map((x, i) => sx[i] - x);
  let dy = ys.map((y, i) => sy[i] - y);
  const clampedX: number[] = [];
  const clampedY: number[] = [];
  for (let i = 0; i < N; i++) {
    const m = Math.hypot(dx[i], dy[i]);
    const k = m > MAX_UNITS ? MAX_UNITS / m : 1;
    clampedX.push(dx[i] * k);
    clampedY.push(dy[i] * k);
  }
  dx = smoothLoop(clampedX, 5);
  dy = smoothLoop(clampedY, 5);
  return { x: xs.map((x, i) => x + dx[i]), y: ys.map((y, i) => y + dy[i]) };
})();

const lap = (px: number[], py: number[]) => ({
  lat: py.map(toLat),
  lon: px.map(toLon),
});

/** Les tours transmis à la carte : le meilleur tour (T4) et le Tour parfait IA. */
export const DEMO_TRAJECTORY_LAPS: TrajectoryLap[] = [
  { lap_number: 4, is_best: true, ...lap(xs, ys), speed_kmh: [...DEMO_SPEED] },
  {
    lap_number: 0,
    is_synthetic: true,
    reference_type: "model",
    label: "Tour Parfait IA",
    ...lap(aiPath.x, aiPath.y),
    speed_kmh: [...DEMO_SPEED],
  },
];

/** Les 12 virages, numérotés comme dans l'app. */
export const DEMO_TRAJECTORY_CORNERS: TrajectoryCorner[] = DEMO_CORNERS.map((c) => ({
  id: c.n,
  lat: toLat(c.y),
  lon: toLon(c.x),
  label: `V${c.n}`,
  grade: "B",
  corner_type: c.dir === "D" ? "right" : "left",
  apex_speed: c.apexKmh,
}));

/** Bords de piste estimés : 8 m de large autour du tracé. */
export const DEMO_TRACK_EDGES: TrackEdges = (() => {
  const half = 4 / M_PER_UNIT;
  const side = (sign: 1 | -1) => ({
    lat: ys.map((y, i) => toLat(y + sign * normals[i].y * half)),
    lon: xs.map((x, i) => toLon(x + sign * normals[i].x * half)),
  });
  return { left: side(1), right: side(-1) };
})();

/** Chronos du Tour parfait IA, tels que l'app les affiche sur cette session. */
export const DEMO_IDEAL_LAP: IdealLap = {
  available: true,
  laps_used: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  best_lap_number: 4,
  best_real_lap_time_s: DEMO_LAP.best,
  ideal_lap_time_s: DEMO_LAP.ideal,
  potential_gain_s: DEMO_LAP.gain,
};

/** La trajectoire jaune reste dans la piste et ne raccourcit aucun des 12 virages. */
export const DEMO_RACING_LINE_META: RacingLineMeta = {
  corners_total: DEMO_CORNERS.length,
  corners_preserved: DEMO_CORNERS.length,
};
