/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Gaz et frein sans capteur de pédale (MyChron, Alfano) : on affiche la phase
 * de pilotage (freinage / gaz / roue libre) en 0 / 100, jamais un faux
 * pourcentage. Les analyses anciennes portaient des pourcentages tirés de la
 * vitesse : on les remplace par les phases du tracé GPS.
 */
export function pedalPhases(plotData: any): { data: any; phases: boolean } | null {
    const tb = plotData?.throttle_brake as { laps?: any[]; source?: string } | undefined;
    if (!tb?.laps?.length) return null;
    if (tb.source === "capteurs") return { data: tb as any, phases: false };
    if (tb.source === "phases") return { data: tb as any, phases: true };
    const traj = plotData?.trajectory_2d?.laps ?? [];
    const laps = tb.laps.map((l: any) => {
      const t = traj.find((x: any) => x.lap_number === l.lap_number && !x.is_synthetic);
      const ph: string[] | undefined = t?.phase;
      const n = l.distance_m?.length ?? 0;
      if (!ph?.length || !n) {
        return { ...l, throttle_pct: l.throttle_pct.map((v: number) => (v > 0 ? 100 : 0)), brake_pct: l.brake_pct.map((v: number) => (v > 0 ? 100 : 0)) };
      }
      const at = (i: number) => ph[Math.min(ph.length - 1, Math.round((i / Math.max(1, n - 1)) * (ph.length - 1)))];
      return {
        ...l,
        throttle_pct: l.distance_m.map((_: number, i: number) => (at(i) === "acceleration" ? 100 : 0)),
        brake_pct: l.distance_m.map((_: number, i: number) => (at(i) === "braking" ? 100 : 0)),
      };
    });
    return { data: { ...tb, laps }, phases: true };
}
