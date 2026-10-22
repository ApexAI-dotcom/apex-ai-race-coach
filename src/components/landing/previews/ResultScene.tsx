import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrackMapPro } from "@/components/analysis/TrackMapPro";
import { CoachingAdvice } from "@/components/analysis/CoachingAdvice";
import { SpeedTraceChart } from "@/components/analysis/SpeedTraceChart";
import { TimeDeltaLapsChart } from "@/components/analysis/TimeDeltaLapsChart";
import { buildCornerOverlays } from "@/components/analysis/cornerOverlays";
import { UnlockedChartsScope } from "@/hooks/useSubscription.tsx";
import { DEMO_ANALYSIS, DEMO_BEST_LAP } from "../data/demoAnalysis";

/**
 * Étape 3 — « Tu sais quoi corriger ». Rien n'est redessiné : ce sont les
 * composants de la page de résultat de l'app (carte du circuit et ses quatre
 * vues, conseils de coaching, graphiques) alimentés par la VRAIE analyse d'une
 * session de démo. Les trois onglets disent d'emblée ce que contient un
 * résultat ; la carte est fixe (pas de zoom) pour ne pas capter le défilement.
 */

const TAB =
  "-mb-px rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-0 text-sm font-medium text-muted-foreground shadow-none transition-colors " +
  "hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none";

// Hauteur commune : le cadre ne saute pas quand on change d'onglet.
const CONTENT = "mt-5 sm:min-h-[690px]";

const SECTION_TITLE = "mb-3 text-base font-semibold text-foreground";

// Les deux courbes affichées : le meilleur tour et celui qui s'en écarte le plus
// à l'arrivée (l'écart se lit mieux quand il est net).
const CHART_LAPS = (() => {
  const others = DEMO_ANALYSIS.plot_data!.time_delta_laps!.laps.filter((l) => l.lap_number !== DEMO_BEST_LAP);
  const gap = (l: { delta_s: number[] }) => Math.abs(l.delta_s[l.delta_s.length - 1]);
  const pick = others.reduce((best, l) => (gap(l) > gap(best) ? l : best), others[0]);
  return [DEMO_BEST_LAP, pick.lap_number];
})();

// Le contexte de session + les deux conseils les plus coûteux : l'aperçu reste
// de la taille de la carte, la page de résultat complète les liste tous.
const TOP_ADVICE = (() => {
  const all = DEMO_ANALYSIS.coaching_advice;
  const info = all.filter((a) => a.category === "info" && !a.corner);
  const actionable = all.filter((a) => !(a.category === "info" && !a.corner));
  return [...info, ...actionable.slice(0, 2)];
})();

export default function ResultScene(_props: { play?: boolean }) {
  const plot = DEMO_ANALYSIS.plot_data!;

  // Bandes de virages sur les graphiques : même calcul que la page de résultat.
  const overlays = useMemo(() => {
    const trajLaps = plot.trajectory_2d.laps ?? [];
    const speedLaps = plot.speed_trace.laps;
    const refTraj = trajLaps.find((l) => l.lap_number === DEMO_BEST_LAP) ?? trajLaps[0];
    const refSpeed = speedLaps.find((l) => l.lap_number === DEMO_BEST_LAP) ?? speedLaps[0];
    const dist = refSpeed?.distance_m ?? [];
    return buildCornerOverlays({
      trajectoryCorners: plot.trajectory_2d.corners,
      trajectoryLaps: trajLaps,
      referenceTrajectoryLap: refTraj,
      referenceSpeedLap: refSpeed,
      cornerAnalysis: DEMO_ANALYSIS.corner_analysis as unknown[],
      domainMin: dist[0],
      domainMax: dist[dist.length - 1],
    });
  }, [plot]);

  return (
    <UnlockedChartsScope>
      <Tabs defaultValue="carte" className="p-3 sm:p-5">
        <TabsList className="flex h-auto w-full justify-start gap-5 rounded-none border-b border-white/10 bg-transparent p-0 sm:gap-8">
          <TabsTrigger value="carte" className={TAB}>
            Carte<span className="hidden sm:inline">&nbsp;du circuit</span>
          </TabsTrigger>
          <TabsTrigger value="coaching" className={TAB}>
            Conseils<span className="hidden sm:inline">&nbsp;de coaching</span>
          </TabsTrigger>
          <TabsTrigger value="graphiques" className={TAB}>
            Graphiques
          </TabsTrigger>
        </TabsList>

        <TabsContent value="carte" className={CONTENT}>
          <div className="mx-auto w-full max-w-[640px]">
            <TrackMapPro
              corners={plot.trajectory_2d.corners}
              margins={plot.apex_margin?.corners}
              laps={plot.trajectory_2d.laps}
              cornerAnalysis={DEMO_ANALYSIS.corner_analysis as unknown[]}
              bestLapNumber={DEMO_BEST_LAP}
              trackEdges={plot.track_edges ?? null}
              racingLineMeta={plot.racing_line_meta ?? null}
              idealLap={DEMO_ANALYSIS.ideal_lap ?? null}
              readOnly
            />
          </div>
        </TabsContent>

        <TabsContent value="coaching" className={CONTENT}>
          <CoachingAdvice advice={TOP_ADVICE} fastestLapNumber={DEMO_BEST_LAP} />
        </TabsContent>

        <TabsContent value="graphiques" className={`${CONTENT} space-y-8`}>
          <section>
            <h3 className={SECTION_TITLE}>Trace de vitesse</h3>
            <SpeedTraceChart
              data={plot.speed_trace}
              selectedLaps={CHART_LAPS}
              bestLapNumber={DEMO_BEST_LAP}
              cornerOverlays={overlays}
            />
          </section>
          <section>
            <h3 className={SECTION_TITLE}>Delta temps</h3>
            <TimeDeltaLapsChart
              data={plot.time_delta_laps!}
              selectedLaps={CHART_LAPS}
              cornerOverlays={overlays}
            />
          </section>
        </TabsContent>
      </Tabs>
    </UnlockedChartsScope>
  );
}
