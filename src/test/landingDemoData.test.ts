import { describe, it, expect } from "vitest";
import {
  DEMO_CHART,
  DEMO_CORNERS,
  DEMO_LAP,
  DEMO_LENGTH_M,
  DEMO_POINTS,
  DEMO_SPEED,
  DEMO_XY,
} from "@/components/landing/data/demoSession";
import { DEMO_LAP_SECONDS, indexAtTime, trackPointAt } from "@/components/landing/data/track";

/**
 * Les aperçus de la page d'accueil affichent des chiffres en clair : le gain du
 * tour parfait, le meilleur tour, le nombre de virages… Ces tests gardent ces
 * chiffres cohérents entre eux, pour qu'une retouche des données de démo ne
 * fasse jamais afficher une promesse qui se contredit.
 */
describe("session de démo de la page d'accueil", () => {
  it("le gain annoncé est bien l'écart entre le meilleur tour et le tour idéal", () => {
    expect(DEMO_LAP.best - DEMO_LAP.ideal).toBeCloseTo(DEMO_LAP.gain, 2);
    expect(DEMO_LAP.ideal).toBeLessThan(DEMO_LAP.best);
  });

  it("les courbes de comparaison ont toutes la même longueur", () => {
    const n = DEMO_CHART.t4.length;
    expect(n).toBeGreaterThan(100);
    expect(DEMO_CHART.v4).toHaveLength(n);
    expect(DEMO_CHART.v9).toHaveLength(n);
    expect(DEMO_CHART.delta).toHaveLength(n);
  });

  it("l'écart final du tour 9 sur le tour 4 correspond à celui affiché", () => {
    const last = DEMO_CHART.delta[DEMO_CHART.delta.length - 1];
    expect(Math.abs(last - DEMO_LAP.deltaFinal)).toBeLessThan(0.02);
  });

  it("le chrono du tour 4 avance, du départ au meilleur tour", () => {
    const t = DEMO_CHART.t4;
    expect(t[0]).toBe(0);
    for (let i = 1; i < t.length; i++) expect(t[i]).toBeGreaterThan(t[i - 1]);
    // Les courbes sont échantillonnées un point sur deux : le dernier point
    // tombe à une fraction de seconde du chrono du meilleur tour.
    expect(Math.abs(DEMO_LAP_SECONDS - DEMO_LAP.best)).toBeLessThan(0.5);
  });

  it("le tracé et les vitesses couvrent tous les points de la boucle", () => {
    expect(DEMO_XY).toHaveLength(DEMO_POINTS * 2);
    expect(DEMO_SPEED).toHaveLength(DEMO_POINTS);
    expect(Math.min(...DEMO_SPEED)).toBeGreaterThanOrEqual(DEMO_LAP.speedMin - 0.5);
    expect(Math.max(...DEMO_SPEED)).toBeLessThanOrEqual(DEMO_LAP.speedMax + 0.5);
    expect(DEMO_LENGTH_M).toBeGreaterThan(500);
  });

  it("les 12 virages sont numérotés de 1 à 12 et posés sur le tracé", () => {
    expect(DEMO_CORNERS.map((c) => c.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    for (const c of DEMO_CORNERS) {
      expect(c.i).toBeGreaterThanOrEqual(0);
      expect(c.i).toBeLessThan(DEMO_POINTS);
      // Le badge du virage est sur la trace GPS elle-même.
      expect(c.x).toBeCloseTo(DEMO_XY[2 * c.i], 0);
      expect(c.y).toBeCloseTo(DEMO_XY[2 * c.i + 1], 0);
    }
  });

  it("indexAtTime avance sans reculer, et le tour 9 arrive plus tard que le tour 4", () => {
    let prev = -1;
    for (let t = 0; t <= DEMO_LAP_SECONDS; t += 0.5) {
      const i = indexAtTime(t);
      expect(i).toBeGreaterThanOrEqual(prev);
      prev = i;
      // Le tour 9 (plus lent) est en retard sur le tour 4. Tout au début du tour
      // il est pourtant quelques millièmes de seconde devant (écart d'environ
      // −0,007 s dans le relevé réel) : on tolère une fraction de point, puis
      // l'ordre doit être strict.
      const late = indexAtTime(t, DEMO_CHART.delta);
      expect(late).toBeLessThanOrEqual(i + 0.2);
      if (t > 3) expect(late).toBeLessThan(i);
    }
    const p = trackPointAt(indexAtTime(DEMO_LAP_SECONDS / 2));
    expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
  });
});
