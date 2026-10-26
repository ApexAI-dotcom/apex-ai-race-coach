/**
 * Comparaison de deux tours (deux pilotes, ou deux tours d'un même pilote).
 *
 * Les deux tracés GPS sont recalés point par point : pour chaque point du
 * tour A, on cherche le point le plus proche du tour B en avançant le long de
 * la piste. On en tire l'écart de temps cumulé, les vitesses superposées et,
 * virage par virage, ce qui fait la différence : freinage, vitesse mini,
 * position de la corde, remise des gaz et vitesse en sortie.
 *
 * Tout est calculé sur les données renvoyées par l'analyse (plot_data), sans
 * appel réseau : fonctions pures, testées dans compare.test.ts.
 */
import type { AnalysisResult } from "@/lib/api";

export interface LapTrace {
  lap: number;
  time: number;
  /** Distance depuis la ligne (m). */
  d: number[];
  /** Vitesse (km/h). */
  v: number[];
  lat: number[];
  lon: number[];
  /** « braking » | « acceleration » | « coasting » quand l'analyse le fournit. */
  phase: string[];
  /** Temps écoulé depuis la ligne (s), recalé sur le chrono du tour. */
  t: number[];
}

export interface LapChoice {
  lap: number;
  time: number;
}

export interface CornerRef {
  number: number;
  lat: number;
  lon: number;
}

export interface CornerComparison {
  number: number;
  /** Index du point de corde sur le tour A. */
  apexIndex: number;
  /** Distance du point de corde sur le tour A (m). */
  apexDistance: number;
  /** Temps gagné par A sur B dans ce virage (s) : positif = A plus rapide. */
  gain: number;
  minSpeed: [number, number];
  entrySpeed: [number, number];
  exitSpeed: [number, number];
  /** Distance du début du freinage au point de vitesse mini (m) ; null : virage pris sans freiner. */
  brakeDistance: [number | null, number | null];
  /** Distance du point de vitesse mini à la remise des gaz (m). */
  throttleDistance: [number | null, number | null];
  /** Décalage du point de vitesse mini de B par rapport à A, le long de la piste (m) : positif = B plus tard. */
  apexShift: number;
  /** Écart latéral de B par rapport à A au point de corde (m) : positif = B plus à l'intérieur. */
  lateralOffset: number;
}

export interface LapComparison {
  a: LapTrace;
  b: LapTrace;
  /** Pour chaque point du tour A, l'index correspondant sur le tour B. */
  match: number[];
  /** La même correspondance en index fractionnaire (interpolation). */
  pos: number[];
  /** Écart cumulé (s) le long du tour A : positif = A devant. */
  delta: number[];
  corners: CornerComparison[];
}

const toRad = (x: number) => (x * Math.PI) / 180;

function finite(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

/** Les tours disponibles dans une analyse (hors tour de sortie et tours incomplets). */
export function lapChoices(r: AnalysisResult): LapChoice[] {
  const laps = r.plot_data?.speed_trace?.laps ?? [];
  const valid = laps.filter((l) => l.lap_number > 0 && finite(l.lap_time) && l.lap_time > 0 && l.distance_m?.length > 20);
  if (!valid.length) return [];
  const times = valid.map((l) => l.lap_time).sort((x, y) => x - y);
  const median = times[Math.floor(times.length / 2)];
  // Un tour à plus de 140 % de la médiane : sortie des stands, drapeau, arrêt.
  return valid
    .filter((l) => l.lap_time <= median * 1.4 && l.lap_time >= median * 0.7)
    .map((l) => ({ lap: l.lap_number, time: l.lap_time }));
}

export function bestLap(r: AnalysisResult): number | null {
  const choices = lapChoices(r);
  if (!choices.length) return null;
  return choices.reduce((a, b) => (b.time < a.time ? b : a)).lap;
}

/** Trace d'un tour : distance, vitesse, position GPS et phase de pilotage. */
export function lapTrace(r: AnalysisResult, lap: number): LapTrace | null {
  const st = r.plot_data?.speed_trace?.laps?.find((l) => l.lap_number === lap);
  const tr = r.plot_data?.trajectory_2d?.laps?.find((l) => l.lap_number === lap) as
    | { lat: number[]; lon: number[]; phase?: string[] }
    | undefined;
  if (!st || !tr) return null;
  const n = Math.min(st.distance_m.length, st.speed_kmh.length, tr.lat.length, tr.lon.length);
  if (n < 20) return null;
  const keep: number[] = [];
  for (let i = 0; i < n; i++) {
    if (finite(st.distance_m[i]) && finite(st.speed_kmh[i]) && finite(tr.lat[i]) && finite(tr.lon[i])) keep.push(i);
  }
  if (keep.length < 20) return null;
  const d0 = st.distance_m[keep[0]];
  const d = keep.map((i) => st.distance_m[i] - d0);
  const v = keep.map((i) => Math.max(1, st.speed_kmh[i]));
  // Temps intégré le long du tour, puis recalé sur le chrono officiel.
  const t = [0];
  for (let k = 1; k < keep.length; k++) {
    const ds = Math.max(0, d[k] - d[k - 1]);
    const vm = (v[k] + v[k - 1]) / 2 / 3.6;
    t.push(t[k - 1] + ds / vm);
  }
  const scale = t[t.length - 1] > 0 && finite(st.lap_time) && st.lap_time > 0 ? st.lap_time / t[t.length - 1] : 1;
  return {
    lap,
    time: st.lap_time,
    d,
    v,
    lat: keep.map((i) => tr.lat[i]),
    lon: keep.map((i) => tr.lon[i]),
    phase: keep.map((i) => tr.phase?.[i] ?? ""),
    t: t.map((x) => x * scale),
  };
}

/** Points de corde de l'analyse, dans l'ordre des virages. */
export function cornerRefs(r: AnalysisResult): CornerRef[] {
  return (r.corner_analysis ?? [])
    .filter((c) => finite(c.apex_lat) && finite(c.apex_lon))
    .map((c) => ({ number: c.corner_number ?? c.corner_id, lat: c.apex_lat as number, lon: c.apex_lon as number }))
    .sort((x, y) => x.number - y.number);
}

function projector(lat0: number, lon0: number) {
  const k = Math.cos(toRad(lat0)) * 111320;
  return (lat: number, lon: number): [number, number] => [(lon - lon0) * k, (lat - lat0) * 110540];
}

/**
 * Recalage : pour chaque point de A, la position correspondante sur B
 * (index fractionnaire : projection sur le segment le plus proche), en
 * avançant le long de la piste. La projection évite les sauts d'un point à
 * l'autre, qui donnaient un écart en dents de scie.
 */
export function matchLaps(a: LapTrace, b: LapTrace): number[] {
  const P = projector(a.lat[0], a.lon[0]);
  const pa = a.lat.map((la, i) => P(la, a.lon[i]));
  const pb = b.lat.map((la, i) => P(la, b.lon[i]));
  const project = (p: [number, number], k: number): [number, number] => {
    const [x0, y0] = pb[k];
    const [x1, y1] = pb[Math.min(k + 1, pb.length - 1)];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const L = dx * dx + dy * dy;
    const f = L > 0 ? Math.min(1, Math.max(0, ((p[0] - x0) * dx + (p[1] - y0) * dy) / L)) : 0;
    const qx = x0 + f * dx;
    const qy = y0 + f * dy;
    return [f, (p[0] - qx) ** 2 + (p[1] - qy) ** 2];
  };
  const pos: number[] = [];
  // Départ : le plus proche parmi le premier dixième de B (les deux tours partent de la ligne).
  let j = 0;
  let best = Infinity;
  for (let k = 0; k < Math.max(2, Math.floor(pb.length / 10)); k++) {
    const [, dd] = project(pa[0], k);
    if (dd < best) {
      best = dd;
      j = k;
    }
  }
  pos.push(j + project(pa[0], j)[0]);
  const window = Math.max(8, Math.ceil(pb.length / 25));
  for (let i = 1; i < pa.length; i++) {
    let bp = pos[i - 1];
    let bd = Infinity;
    for (let k = j; k < Math.min(pb.length - 1, j + window); k++) {
      const [f, dd] = project(pa[i], k);
      if (dd < bd && k + f >= pos[i - 1]) {
        bd = dd;
        bp = k + f;
      }
    }
    pos.push(bp);
    j = Math.floor(bp);
  }
  return pos;
}

/** Valeur d'une série de B à une position fractionnaire. */
export function at(arr: number[], pos: number): number {
  const k = Math.min(arr.length - 1, Math.max(0, Math.floor(pos)));
  const k1 = Math.min(arr.length - 1, k + 1);
  const f = pos - k;
  return arr[k] + (arr[k1] - arr[k]) * f;
}

function nearestIndex(trace: LapTrace, lat: number, lon: number): number {
  const P = projector(lat, lon);
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i < trace.lat.length; i++) {
    const [x, y] = P(trace.lat[i], trace.lon[i]);
    const dd = x * x + y * y;
    if (dd < bd) {
      bd = dd;
      best = i;
    }
  }
  return best;
}

function indexAtDistance(trace: LapTrace, from: number, metres: number): number {
  const target = trace.d[from] + metres;
  if (metres >= 0) {
    for (let i = from; i < trace.d.length; i++) if (trace.d[i] >= target) return i;
    return trace.d.length - 1;
  }
  for (let i = from; i >= 0; i--) if (trace.d[i] <= target) return i;
  return 0;
}

function minIndex(v: number[], lo: number, hi: number): number {
  let m = lo;
  for (let i = lo; i <= hi; i++) if (v[i] < v[m]) m = i;
  return m;
}

function maxValue(v: number[], lo: number, hi: number): number {
  let m = -Infinity;
  for (let i = Math.max(0, lo); i <= Math.min(v.length - 1, hi); i++) m = Math.max(m, v[i]);
  return m;
}

/** Début de la zone de freinage qui précède le point de vitesse mini : distance (m), ou null. */
function brakeDistanceBefore(tr: LapTrace, apex: number, lo: number): number | null {
  if (!tr.phase.some(Boolean)) return null;
  let i = apex;
  // Remonter jusqu'au dernier point de freinage avant la corde…
  while (i > lo && tr.phase[i] !== "braking") i--;
  if (tr.phase[i] !== "braking" || tr.d[apex] - tr.d[i] > 120) return null;
  // …puis jusqu'au début de cette zone.
  while (i > lo && tr.phase[i - 1] === "braking") i--;
  return Math.round(tr.d[apex] - tr.d[i]);
}

function throttleDistanceAfter(tr: LapTrace, apex: number, hi: number): number | null {
  if (!tr.phase.some(Boolean)) return null;
  for (let i = apex; i <= hi; i++) {
    if (tr.phase[i] === "acceleration") return Math.round(tr.d[i] - tr.d[apex]);
  }
  return null;
}

/** Écart latéral signé de B par rapport à A au point i de A (positif : du côté vers lequel tourne A). */
function lateralOffset(a: LapTrace, b: LapTrace, i: number, j: number): number {
  const P = projector(a.lat[i], a.lon[i]);
  const i0 = Math.max(0, i - 3);
  const i1 = Math.min(a.lat.length - 1, i + 3);
  const [x0, y0] = P(a.lat[i0], a.lon[i0]);
  const [x1, y1] = P(a.lat[i1], a.lon[i1]);
  const [xa, ya] = P(a.lat[i], a.lon[i]);
  const [xb, yb] = P(b.lat[j], b.lon[j]);
  const tx = x1 - x0;
  const ty = y1 - y0;
  const len = Math.hypot(tx, ty) || 1;
  // Côté de B par rapport à la direction de A
  const side = (tx * (yb - ya) - ty * (xb - xa)) / len;
  // Sens du virage : signe de la courbure de A autour du point
  const [xm0, ym0] = P(a.lat[Math.max(0, i - 6)], a.lon[Math.max(0, i - 6)]);
  const [xm1, ym1] = P(a.lat[Math.min(a.lat.length - 1, i + 6)], a.lon[Math.min(a.lat.length - 1, i + 6)]);
  const turn = (xa - xm0) * (ym1 - ya) - (ya - ym0) * (xm1 - xa);
  return Math.round((turn >= 0 ? side : -side) * 10) / 10;
}

export function compareLaps(a: LapTrace, b: LapTrace, corners: CornerRef[]): LapComparison {
  const pos = matchLaps(a, b);
  const match = pos.map((p) => Math.min(b.d.length - 1, Math.round(p)));
  const delta = pos.map((p, i) => at(b.t, p) - a.t[i]);
  // Le dernier point recalé : l'écart final égale l'écart de chrono.
  const final = b.time - a.time;
  const drift = delta[delta.length - 1] - final;
  for (let i = 0; i < delta.length; i++) delta[i] -= (drift * a.d[i]) / (a.d[a.d.length - 1] || 1);

  const apexes = corners
    .map((c) => ({ number: c.number, i: nearestIndex(a, c.lat, c.lon) }))
    .sort((x, y) => x.i - y.i)
    .filter((c, k, arr) => k === 0 || c.i !== arr[k - 1].i);

  const out: CornerComparison[] = apexes.map((c, k) => {
    const lo = k === 0 ? 0 : Math.round((apexes[k - 1].i + c.i) / 2);
    const hi = k === apexes.length - 1 ? a.d.length - 1 : Math.round((c.i + apexes[k + 1].i) / 2);
    // Point de vitesse mini de chaque pilote autour de la corde
    const ia = minIndex(a.v, indexAtDistance(a, c.i, -30), indexAtDistance(a, c.i, 30));
    const jc = match[c.i];
    const jlo = match[lo];
    const jhi = match[hi];
    const ib = minIndex(b.v, Math.max(jlo, indexAtDistance(b, jc, -30)), Math.min(jhi, indexAtDistance(b, jc, 30)));
    const exitA = a.v[indexAtDistance(a, ia, 40)];
    const exitB = b.v[indexAtDistance(b, ib, 40)];
    // Point de B ramené sur l'abscisse de A : décalage du point de vitesse mini.
    const ibOnA = match.findIndex((j) => j >= ib);
    const apexShift = ibOnA >= 0 ? Math.round(a.d[ibOnA] - a.d[ia]) : 0;
    return {
      number: c.number,
      apexIndex: ia,
      apexDistance: Math.round(a.d[ia]),
      gain: Math.round((delta[hi] - delta[lo]) * 1000) / 1000,
      minSpeed: [Math.round(a.v[ia]), Math.round(b.v[ib])],
      entrySpeed: [
        Math.round(Math.max(a.v[ia], maxValue(a.v, Math.min(lo, ia), ia))),
        Math.round(Math.max(b.v[ib], maxValue(b.v, Math.min(jlo, ib), ib))),
      ],
      exitSpeed: [Math.round(exitA), Math.round(exitB)],
      brakeDistance: [brakeDistanceBefore(a, ia, lo), brakeDistanceBefore(b, ib, jlo)],
      throttleDistance: [throttleDistanceAfter(a, ia, hi), throttleDistanceAfter(b, ib, jhi)],
      apexShift,
      lateralOffset: lateralOffset(a, b, ia, match[ia]),
    };
  });
  return { a, b, match, pos, delta, corners: out };
}

/* ───────────── Lecture en clair ───────────── */

const sec = (x: number) => `${Math.abs(x).toFixed(2).replace(".", ",")} s`;

/**
 * Ce qui explique l'écart dans un virage, en phrases courtes, du point de vue
 * du pilote le plus lent (ce qu'il peut changer). Seuils : 4 m pour un
 * freinage, 2 km/h pour une vitesse, 5 m pour la corde, 0,5 m en latéral.
 */
export function explainCorner(c: CornerComparison, names: [string, string]): string[] {
  const fastIsA = c.gain >= 0;
  const [f, s] = fastIsA ? [0, 1] : [1, 0];
  const slow = names[s];
  const fast = names[f];
  const out: string[] = [];
  const bd = c.brakeDistance;
  if (bd[0] != null && bd[1] != null && Math.abs(bd[f]! - bd[s]!) >= 4) {
    out.push(
      bd[s]! > bd[f]!
        ? `${slow} freine ${bd[s]! - bd[f]!} m plus tôt que ${fast}`
        : `${slow} freine ${bd[f]! - bd[s]!} m plus tard que ${fast}, sans en tirer de vitesse`
    );
  } else if (bd[s] != null && bd[f] == null) {
    out.push(`${fast} passe sans freiner, ${slow} freine`);
  }
  const dmin = c.minSpeed[f] - c.minSpeed[s];
  if (Math.abs(dmin) >= 2) {
    out.push(dmin > 0 ? `${fast} garde ${dmin} km/h de plus au point le plus lent` : `${slow} passe ${-dmin} km/h plus vite au point le plus lent mais le paie après`);
  }
  // Décalage du point de vitesse mini : une corde plus tardive prépare la sortie.
  const shiftForSlow = fastIsA ? c.apexShift : -c.apexShift; // positif : le lent tourne plus tard que le rapide
  if (Math.abs(c.apexShift) >= 5) {
    out.push(
      shiftForSlow < 0
        ? `${slow} prend sa corde ${Math.abs(c.apexShift)} m plus tôt : ${fast} attend, tourne plus tard et ouvre sa sortie`
        : `${slow} prend sa corde ${Math.abs(c.apexShift)} m plus tard que ${fast}`
    );
  }
  const td = c.throttleDistance;
  if (td[0] != null && td[1] != null && Math.abs(td[f]! - td[s]!) >= 4) {
    out.push(td[s]! > td[f]! ? `${fast} remet les gaz ${td[s]! - td[f]!} m plus tôt après la corde` : `${slow} remet les gaz plus tôt mais sort moins vite`);
  }
  const dexit = c.exitSpeed[f] - c.exitSpeed[s];
  if (Math.abs(dexit) >= 2) {
    out.push(dexit > 0 ? `${fast} sort ${dexit} km/h plus vite` : `${slow} sort ${-dexit} km/h plus vite mais perd avant`);
  }
  if (Math.abs(c.lateralOffset) >= 0.5) {
    const inner = c.lateralOffset > 0 ? names[1] : names[0];
    out.push(`au point de corde, ${inner} passe ${Math.abs(c.lateralOffset).toString().replace(".", ",")} m plus à l'intérieur`);
  }
  return out;
}

export function summarize(cmp: LapComparison, names: [string, string]): string {
  const gap = cmp.b.time - cmp.a.time;
  if (Math.abs(gap) < 0.0005) return `${names[0]} et ${names[1]} signent le même temps.`;
  const [fast, slow] = gap > 0 ? names : [names[1], names[0]];
  const key = [...cmp.corners]
    .filter((c) => (gap > 0 ? c.gain > 0.02 : c.gain < -0.02))
    .sort((x, y) => Math.abs(y.gain) - Math.abs(x.gain))
    .slice(0, 3)
    .map((c) => c.number);
  const where = key.length ? ` L'écart se fait surtout ${key.length > 1 ? "aux virages" : "au virage"} ${key.join(", ").replace(/, (\d+)$/, " et $1")}.` : "";
  return `${fast} est devant de ${sec(gap)} sur ce tour, ${slow} derrière.${where}`;
}
