import { describe, it, expect } from "vitest";
import { DEMO_ANALYSIS, DEMO_BEST_LAP } from "@/components/landing/data/demoAnalysis";
import raw from "@/components/landing/data/demoAnalysis.json";

/**
 * L'étape 3 de l'accueil montre la VRAIE sortie du moteur d'analyse sur une
 * session de démonstration. Ces tests gardent cette donnée cohérente (le gain
 * annoncé, les virages cités par les conseils, les tours de chaque courbe) et
 * rappellent qu'elle ne doit jamais contenir le nom du pilote du fichier source.
 */
describe("analyse de démo de la page d'accueil", () => {
  const plot = DEMO_ANALYSIS.plot_data!;
  const ideal = DEMO_ANALYSIS.ideal_lap!;

  it("le gain annoncé est l'écart entre le meilleur tour et le tour idéal", () => {
    expect(ideal.available).toBe(true);
    expect(ideal.best_real_lap_time_s! - ideal.ideal_lap_time_s!).toBeCloseTo(ideal.potential_gain_s!, 2);
    expect(ideal.ideal_lap_time_s!).toBeLessThan(ideal.best_real_lap_time_s!);
    expect(ideal.laps_used).toContain(DEMO_BEST_LAP);
  });

  it("chaque tour retenu a sa trajectoire, sa trace de vitesse, plus le Tour Parfait IA", () => {
    const used = ideal.laps_used!;
    const traj = plot.trajectory_2d.laps!;
    expect(traj.filter((l) => !l.is_synthetic).map((l) => l.lap_number)).toEqual(used);
    expect(traj.filter((l) => l.is_synthetic)).toHaveLength(1);
    expect(plot.speed_trace.laps.map((l) => l.lap_number)).toEqual(used);
    for (const l of plot.speed_trace.laps) expect(l.speed_kmh).toHaveLength(l.distance_m.length);
    for (const l of traj) expect(l.lat).toHaveLength(l.lon.length);
  });

  it("les 12 virages sont numérotés de 1 à 12 et chaque conseil cite un virage de la carte", () => {
    const onMap = plot.trajectory_2d.corners.map((c) => Number(c.label.replace("V", "")));
    expect(onMap).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
    for (const a of DEMO_ANALYSIS.coaching_advice) {
      if (a.corner != null) expect(onMap).toContain(a.corner);
    }
  });

  it("le temps perdu annoncé par un conseil est celui mesuré sur ce virage", () => {
    const loss = (ideal as unknown as { per_corner_loss_s: Record<string, number> }).per_corner_loss_s;
    for (const a of DEMO_ANALYSIS.coaching_advice) {
      if (a.corner == null || !a.impact_seconds) continue;
      expect(a.impact_seconds).toBeCloseTo(loss[String(a.corner)], 2);
    }
  });

  it("les mini-secteurs sont fournis pour la vue du même nom", () => {
    expect((ideal.sectors ?? []).length).toBeGreaterThan(10);
  });

  it("le nom du pilote du fichier source n'est jamais embarqué", () => {
    const txt = JSON.stringify(raw);
    // Aucun champ pilote, et aucune chaîne du type « A.NOM » (initiale + nom en capitales).
    expect(txt).not.toMatch(/"(driver|driver_name|racer|pilot|pilote)"/i);
    expect(txt).not.toMatch(/\b[A-Z]\.[A-Z]{3,}\b/);
  });
});
