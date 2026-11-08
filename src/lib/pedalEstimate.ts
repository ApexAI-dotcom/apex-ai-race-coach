/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Analyses enregistrées avant le 8 nov. 2026 : leur « accélérateur / frein »
 * venait d'un calcul grossier (écart de vitesse × 20) qui ne dépassait jamais
 * ~45 % pied au plancher. On le recalcule à l'affichage avec la même lecture
 * que le serveur (src/analysis/pedals.py), à partir de la vitesse du tour :
 * gaz = accélération rapportée au maximum obtenu à cette vitesse sur la
 * séance, frein = décélération au-delà de la traînée rapportée au plus fort
 * freinage. Les analyses récentes (champ `source`) sont laissées telles quelles.
 */
const G = 9.81;
const ROLLING_G = 0.02;
const AERO_K = (0.5 * 1.2 * 0.6) / (165 * G);

const smooth = (x: number[], n: number) =>
  x.map((_, i) => {
    let s = 0;
    let c = 0;
    for (let k = Math.max(0, i - (n >> 1)); k <= Math.min(x.length - 1, i + (n >> 1)); k++) {
      s += x[k];
      c++;
    }
    return s / c;
  });

const pct = (arr: number[], p: number) => {
  const s = [...arr].sort((a, b) => a - b);
  if (!s.length) return 0;
  return s[Math.min(s.length - 1, Math.max(0, Math.round((p / 100) * (s.length - 1))))];
};

export function withPedalEstimate(plotData: any): any {
  const tb = plotData?.throttle_brake;
  const st = plotData?.speed_trace?.laps;
  if (!tb?.laps?.length || tb.source || !st?.length) return plotData;

  // Accélération longitudinale de chaque tour : a = v·dv/ds.
  const perLap = new Map<number, { d: number[]; kmh: number[]; a: number[] }>();
  for (const l of st) {
    const d: number[] = (l.distance_m || []).map(Number);
    const kmh: number[] = smooth((l.speed_kmh || []).map(Number), 3);
    if (d.length < 10 || kmh.length !== d.length) continue;
    const v = kmh.map((x) => x / 3.6);
    const a = v.map((vi, i) => {
      const i0 = Math.max(0, i - 1);
      const i1 = Math.min(v.length - 1, i + 1);
      const ds = d[i1] - d[i0];
      return ds > 0 ? (vi * (v[i1] - v[i0])) / ds / G : 0;
    });
    perLap.set(Number(l.lap_number), { d, kmh, a });
  }
  if (!perLap.size) return plotData;

  // Enveloppe « pleins gaz » par tranche de 10 km/h, sur toute la séance.
  const all = [...perLap.values()];
  const kmhAll = all.flatMap((x) => x.kmh);
  const aAll = all.flatMap((x) => x.a);
  const drag = (kmh: number) => ROLLING_G + AERO_K * (kmh / 3.6) ** 2;
  const top = pct(kmhAll, 99.5);
  const centers: number[] = [];
  let env: number[] = [];
  for (let lo = 0; lo < top + 10; lo += 10) {
    const vals = aAll.filter((a, i) => kmhAll[i] >= lo && kmhAll[i] < lo + 10 && a > -drag(kmhAll[i]));
    if (vals.length >= 15) {
      centers.push(lo + 5);
      env.push(pct(vals, 90));
    }
  }
  for (let i = env.length - 2; i >= 0; i--) env[i] = Math.max(env[i], env[i + 1]);
  env = env.map((e) => Math.max(e, 0));
  const full = (kmh: number) => {
    if (centers.length < 2) return 0.3;
    if (kmh <= centers[0]) return env[0];
    for (let i = 1; i < centers.length; i++) {
      if (kmh <= centers[i]) return env[i - 1] + ((env[i] - env[i - 1]) * (kmh - centers[i - 1])) / (centers[i] - centers[i - 1]);
    }
    return env[env.length - 1];
  };
  const brakeMax = Math.max(pct(aAll.map((a) => -a), 99), 0.3) - drag(pct(kmhAll, 50));

  const laps = tb.laps.map((l: any) => {
    const s = perLap.get(Number(l.lap_number));
    if (!s) return l;
    const at = (dist: number) => {
      // point du tracé de vitesse le plus proche en distance
      let lo = 0;
      let hi = s.d.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (s.d[mid] < dist) lo = mid;
        else hi = mid;
      }
      return Math.abs(s.d[lo] - dist) < Math.abs(s.d[hi] - dist) ? lo : hi;
    };
    const thr: number[] = [];
    const brk: number[] = [];
    for (const dist of l.distance_m as number[]) {
      const i = at(Number(dist));
      const kmh = s.kmh[i];
      const a = s.a[i];
      const dr = drag(kmh);
      let t = Math.min(1, Math.max(0, (a + dr) / Math.max(full(kmh) + dr, 0.05))) * 100;
      if (kmh >= 0.9 * top && a >= -0.03) t = 100;
      const dec = -a - dr;
      const b = dec < 0.08 ? 0 : Math.min(1, dec / Math.max(brakeMax, 0.2)) * 100;
      if (b > 0) t = 0;
      thr.push(Math.round(t * 10) / 10);
      brk.push(Math.round(b * 10) / 10);
    }
    return { ...l, throttle_pct: thr, brake_pct: brk };
  });
  return { ...plotData, throttle_brake: { ...tb, laps, source: "estimé" } };
}
