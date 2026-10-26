import { describe, expect, it } from "vitest";
import { compareLaps, explainCorner, matchLaps, summarize, type LapTrace } from "./compare";

/** Un ovale de 400 m parcouru à vitesse donnée, ralentissement dans les deux virages. */
function oval(slowdown: number, apexShift = 0): LapTrace {
  const n = 200;
  const lat0 = 47.5, lon0 = -1.8;
  const R = 30, straight = 400 / 2 - Math.PI * R;
  const d: number[] = [], v: number[] = [], lat: number[] = [], lon: number[] = [], phase: string[] = [];
  for (let i = 0; i < n; i++) {
    const s = (i / n) * 400;
    d.push(s);
    // vitesse : 100 km/h, minimum au milieu de chaque virage
    const inTurn = (x: number) => {
      const c = straight + (Math.PI * R) / 2 + apexShift;
      const m = (((x - c) % 200) + 200) % 200;
      const dd = Math.min(m, 200 - m);
      return Math.exp(-(dd * dd) / 800);
    };
    v.push(100 - (35 + slowdown) * inTurn(s));
    phase.push(v[i] < v[Math.max(0, i - 1)] ? "braking" : "acceleration");
    // position : ovale centré
    let x = 0, y = 0;
    const u = s % 200;
    const side = s < 200 ? 1 : -1;
    if (u < straight) { x = side * (u - straight / 2); y = -side * R; }
    else { const a = (u - straight) / R; x = side * (straight / 2 + R * Math.sin(a)); y = -side * R * Math.cos(a); }
    lat.push(lat0 + y / 110540);
    lon.push(lon0 + x / (111320 * Math.cos((lat0 * Math.PI) / 180)));
  }
  const t = [0];
  for (let k = 1; k < n; k++) t.push(t[k - 1] + (d[k] - d[k - 1]) / (((v[k] + v[k - 1]) / 2) / 3.6));
  return { lap: 1, time: t[n - 1], d, v, lat, lon, phase, t };
}

describe("comparaison de deux tours", () => {
  it("recale deux tours identiques point par point", () => {
    const a = oval(0);
    const pos = matchLaps(a, a);
    expect(pos.every((p, i) => Math.abs(p - i) < 0.01)).toBe(true);
  });

  it("l'écart final égale l'écart de chrono et se répartit entre les virages", () => {
    const a = oval(0);
    const b = { ...oval(8), lap: 2 };
    const corners = [
      { number: 1, lat: a.lat[76], lon: a.lon[76] },
      { number: 2, lat: a.lat[176], lon: a.lon[176] },
    ];
    const cmp = compareLaps(a, b, corners);
    expect(cmp.delta[cmp.delta.length - 1]).toBeCloseTo(b.time - a.time, 3);
    const total = cmp.corners.reduce((s, c) => s + c.gain, 0);
    expect(total).toBeCloseTo(b.time - a.time, 1);
    expect(cmp.corners.every((c) => c.gain > 0)).toBe(true);
    expect(cmp.corners[0].minSpeed[0]).toBeGreaterThan(cmp.corners[0].minSpeed[1]);
    expect(summarize(cmp, ["Toi", "Lucas"])).toMatch(/^Toi est devant/);
    expect(explainCorner(cmp.corners[0], ["Toi", "Lucas"]).join(" ")).toMatch(/Toi garde \d+ km\/h de plus/);
  });
});
