import { describe, it, expect } from "vitest";
import {
  DEMO_CORNERS,
  DEMO_LAP,
  DEMO_LENGTH_M,
  DEMO_POINTS,
  DEMO_SPEED,
  DEMO_XY,
} from "@/components/landing/data/demoSession";
import {
  DEMO_IDEAL_LAP,
  DEMO_RACING_LINE_META,
  DEMO_TRACK_EDGES,
  DEMO_TRAJECTORY_CORNERS,
  DEMO_TRAJECTORY_LAPS,
} from "@/components/landing/data/demoTrajectory";

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
});

/**
 * La carte de l'accueil est le vrai composant de l'app : elle exige des tours
 * complets (mêmes longueurs partout), un tour synthétique (la trajectoire jaune)
 * et des bords de piste de même taille à gauche et à droite.
 */
describe("trajectoire de démo transmise à la carte de l'app", () => {
  const [best, ai] = DEMO_TRAJECTORY_LAPS;

  it("le meilleur tour (T4) et le Tour parfait IA couvrent toute la boucle", () => {
    expect(best.is_best).toBe(true);
    expect(best.lap_number).toBe(4);
    expect(ai.is_synthetic).toBe(true);
    for (const l of [best, ai]) {
      expect(l.lat).toHaveLength(DEMO_POINTS);
      expect(l.lon).toHaveLength(DEMO_POINTS);
      expect(l.speed_kmh).toHaveLength(DEMO_POINTS);
    }
  });

  it("la trajectoire jaune reste à moins de 2 m de la trace réelle", () => {
    // Les coordonnées de démo sont des unités du tracé (1 unité = 1e-5 degré) ;
    // la longueur affichée du circuit donne l'échelle réelle en mètres.
    const DEG_PER_UNIT = 1e-5;
    const cos = Math.cos((45 * Math.PI) / 180);
    let pathUnits = 0;
    for (let i = 0; i < DEMO_POINTS; i++) {
      const j = (i + 1) % DEMO_POINTS;
      pathUnits += Math.hypot(DEMO_XY[2 * j] - DEMO_XY[2 * i], DEMO_XY[2 * j + 1] - DEMO_XY[2 * i + 1]);
    }
    const metersPerUnit = DEMO_LENGTH_M / pathUnits;
    let worst = 0;
    for (let i = 0; i < DEMO_POINTS; i++) {
      const dy = (ai.lat[i] - best.lat[i]) / DEG_PER_UNIT;
      const dx = ((ai.lon[i] - best.lon[i]) * cos) / DEG_PER_UNIT;
      worst = Math.max(worst, Math.hypot(dx, dy) * metersPerUnit);
    }
    expect(worst).toBeGreaterThan(0);
    expect(worst).toBeLessThan(2);
  });

  it("les 12 virages, les bords de piste et le tour idéal sont cohérents", () => {
    expect(DEMO_TRAJECTORY_CORNERS.map((c) => c.label)).toEqual(
      Array.from({ length: 12 }, (_, i) => `V${i + 1}`)
    );
    expect(DEMO_TRACK_EDGES.left.lat).toHaveLength(DEMO_POINTS);
    expect(DEMO_TRACK_EDGES.right.lat).toHaveLength(DEMO_POINTS);
    expect(DEMO_IDEAL_LAP.best_real_lap_time_s! - DEMO_IDEAL_LAP.ideal_lap_time_s!).toBeCloseTo(
      DEMO_IDEAL_LAP.potential_gain_s!,
      2
    );
    expect(DEMO_RACING_LINE_META.corners_preserved).toBe(DEMO_RACING_LINE_META.corners_total);
  });
});
