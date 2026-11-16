import lap from "../data/adria-lap.json";

/** points[i] = [x, y, vT4_kmh, tT4_s, tT9_s, vT9_kmh] — boîte 1000×1000, nord en haut. */
export type Pt = [number, number, number, number, number, number];
export const PTS = lap.points as unknown as Pt[];
export const N = PTS.length;
export const CORNERS = lap.corners as Array<{
  n: number;
  i: number;
  x: number;
  y: number;
  distM: number;
  dir: "G" | "D";
  apexKmh: number;
  deltaGainS: number;
}>;
export const LOSS = lap.lossSegments as Array<[number, number]>;
export const LAP_T4 = lap.lapTimesS.T4;
export const LAP_T9 = lap.lapTimesS.T9;
export const DELTA_FINAL = lap.deltaFinalS;
export const PATH_D: string = lap.pathD;

/** Copie de speedToColor() de l'app (trackMapColors.ts) : coloration par rang percentile. */
const sortedSpeeds = PTS.map((p) => p[2]).sort((a, b) => a - b);
const QUANTILES = Array.from({ length: 21 }, (_, k) => sortedSpeeds[Math.round((k / 20) * (sortedSpeeds.length - 1))]);

function percentileRank(speed: number, quantiles: number[]): number {
  const n = quantiles.length;
  if (speed <= quantiles[0]) return 0;
  if (speed >= quantiles[n - 1]) return 1;
  let lo = 0;
  let hi = n - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (quantiles[mid] <= speed) lo = mid;
    else hi = mid;
  }
  return lo / (n - 1);
}

export function speedToColor(speed: number): string {
  const t = Math.max(0, Math.min(1, percentileRank(speed, QUANTILES)));
  let r: number, g: number;
  if (t < 0.35) {
    r = 255;
    g = Math.round((t / 0.35) * 128);
  } else if (t < 0.65) {
    r = 255;
    g = 128 + Math.round(((t - 0.35) / 0.3) * 127);
  } else {
    r = 255 - Math.round(((t - 0.65) / 0.35) * 255);
    g = 255;
  }
  return `rgb(${r}, ${g}, 0)`;
}

export const SPEED_COLORS = PTS.map((p) => speedToColor(p[2]));

/** Position (x, y, index fractionnaire) d'un tour au temps de course τ. col = 3 (T4) ou 4 (T9). */
export function posAt(tau: number, col: 3 | 4, lapTime: number) {
  if (tau <= 0) return { x: PTS[0][0], y: PTS[0][1], fi: 0, done: false };
  if (tau >= lapTime) return { x: PTS[0][0], y: PTS[0][1], fi: N, done: true };
  let lo = 0;
  let hi = N - 1;
  if (tau >= PTS[N - 1][col]) {
    const f = (tau - PTS[N - 1][col]) / (lapTime - PTS[N - 1][col]);
    return {
      x: PTS[N - 1][0] + (PTS[0][0] - PTS[N - 1][0]) * f,
      y: PTS[N - 1][1] + (PTS[0][1] - PTS[N - 1][1]) * f,
      fi: N - 1 + f,
      done: false,
    };
  }
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (PTS[mid][col] <= tau) lo = mid;
    else hi = mid;
  }
  const a = PTS[lo];
  const b = PTS[hi];
  const f = (tau - a[col]) / Math.max(1e-6, b[col] - a[col]);
  return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, fi: lo + f, done: false };
}

/** Écart T9 − T4 à l'index (fractionnaire) du Tour 9. */
export function deltaAtIndex(fi: number, finished: boolean) {
  if (finished) return DELTA_FINAL;
  const i = Math.max(0, Math.min(N - 1, Math.floor(fi)));
  return PTS[i][4] - PTS[i][3];
}

/** Sous-chemin de i0 à i1 (indices entiers) en commande SVG. */
export function polyline(i0: number, i1: number) {
  const pts: string[] = [];
  for (let i = i0; i <= i1; i++) {
    const p = PTS[Math.min(i, N - 1)];
    pts.push(`${p[0]},${p[1]}`);
  }
  return `M${pts.join(" L")}`;
}

/** Chemin fermé complet (pour evolvePath). */
export const FULL_PATH = `M${PTS.map((p) => `${p[0]},${p[1]}`).join(" L")} Z`;

/**
 * Trajectoire « Tour IA » (dorée) : la ligne réelle décalée vers l'intérieur des virages,
 * proportionnellement à la courbure — elle coupe les apex comme la trajectoire cible de l'app.
 */
function buildGold(): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const curv: number[] = [];
  for (let i = 0; i < N; i++) {
    const a = PTS[(i - 3 + N) % N];
    const b = PTS[i];
    const c = PTS[(i + 3) % N];
    const h1 = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const h2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
    let d = h2 - h1;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    curv.push(d);
  }
  // lissage
  const sm = curv.map((_, i) => {
    let acc = 0;
    for (let k = -6; k <= 6; k++) acc += curv[(i + k + N) % N];
    return acc / 13;
  });
  for (let i = 0; i < N; i++) {
    const a = PTS[(i - 1 + N) % N];
    const c = PTS[(i + 1) % N];
    const tx = c[0] - a[0];
    const ty = c[1] - a[1];
    const len = Math.hypot(tx, ty) || 1;
    // normale à droite du sens de marche (y vers le bas) : côté intérieur d'un virage à droite
    const nx = -ty / len;
    const ny = tx / len;
    const off = Math.max(-9, Math.min(9, sm[i] * 70));
    out.push([PTS[i][0] + nx * off, PTS[i][1] + ny * off]);
  }
  return out;
}

export const GOLD_PTS = buildGold();
export const GOLD_PATH = `M${GOLD_PTS.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" L")} Z`;
