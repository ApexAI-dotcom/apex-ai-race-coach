import type { AnalysisResponse, CornerMargin, PlotData } from "@/types/analysis";
import { useState, useMemo } from "react";
import { SpeedTraceChart } from "./SpeedTraceChart";
import { ThrottleBrakeChart } from "./ThrottleBrakeChart";
import { TimeDeltaLapsChart } from "./TimeDeltaLapsChart";
import { PerformanceRadar } from "./PerformanceRadar";
import { TrackMap } from "./TrackMap";
import { ApexMarginChart } from "./ApexMarginChart";
import { CornerDetailsGrid } from "./CornerDetailsGrid";
import { Badge } from "@/components/ui/badge";
import { Check, Trophy } from "lucide-react";

interface AnalysisDashboardContentProps {
  analysis: AnalysisResponse;
  embedded?: boolean;
}

function enrichCornersWithCornerAnalysis(
  plotData: PlotData,
  analysis: AnalysisResponse
): CornerMargin[] {
  const corners = plotData.apex_margin?.corners ?? [];
  const cornerAnalysis = (analysis.corner_analysis ?? []) as Array<{
    apex_speed_real?: number;
    apex_speed_optimal?: number;
    time_lost?: number;
    grade?: string;
    entry_speed?: number;
    exit_speed?: number;
    label?: string;
  }>;
  if (corners.length === 0) return [];
  return corners.map((c, i) => ({
    ...c,
    apex_speed_real: c.apex_speed_real ?? cornerAnalysis[i]?.apex_speed_real ?? 0,
    apex_speed_optimal: c.apex_speed_optimal ?? cornerAnalysis[i]?.apex_speed_optimal ?? 0,
    time_lost: c.time_lost ?? cornerAnalysis[i]?.time_lost ?? 0,
    grade: (c.grade ?? cornerAnalysis[i]?.grade ?? "C") as CornerMargin["grade"],
    entry_speed: c.entry_speed ?? cornerAnalysis[i]?.entry_speed ?? 0,
    exit_speed: c.exit_speed ?? cornerAnalysis[i]?.exit_speed ?? 0,
  }));
}

/** Small badge to indicate a section is based on the best lap */
function BestLapBadge({ lapNumber }: { lapNumber: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5 ml-2">
      <Trophy className="w-3 h-3" />
      Meilleur tour (T{lapNumber})
    </span>
  );
}

export function AnalysisDashboardContent({ analysis, embedded = false }: AnalysisDashboardContentProps) {
  const plotData = analysis.plot_data;
  const hasPlotData = !!plotData;

  // Best lap computation
  const bestLapNumber = useMemo(() => {
    if (!analysis.lap_times || analysis.lap_times.length === 0) return 1;
    const minTime = Math.min(...analysis.lap_times);
    return analysis.lap_times.indexOf(minTime) + 1;
  }, [analysis.lap_times]);

  // Global lap selector state — default to best lap
  const [selectedLapNumbers, setSelectedLapNumbers] = useState<number[]>(() => [bestLapNumber]);

  const toggleLap = (lapNum: number) => {
    setSelectedLapNumbers(prev =>
      prev.includes(lapNum)
        ? (prev.length > 1 ? prev.filter(n => n !== lapNum) : prev)
        : [...prev, lapNum].sort((a, b) => a - b)
    );
  };

  // Find the best lap index for TrackMap — use the lap with the most GPS points (non-cut)
  const bestTrackLapIndex = useMemo(() => {
    if (!plotData?.trajectory_2d?.laps?.length) return 0;
    const laps = plotData.trajectory_2d.laps;
    // Prefer the best lap number if it has enough GPS points
    const bestIdx = bestLapNumber - 1;
    if (bestIdx >= 0 && bestIdx < laps.length && laps[bestIdx]?.lat?.length > 50) {
      return bestIdx;
    }
    // Otherwise find the lap with the most points
    let maxPoints = 0;
    let maxIdx = 0;
    laps.forEach((lap, idx) => {
      const pts = lap?.lat?.length ?? 0;
      if (pts > maxPoints) {
        maxPoints = pts;
        maxIdx = idx;
      }
    });
    return maxIdx;
  }, [plotData?.trajectory_2d?.laps, bestLapNumber]);

  const wrapperClass = embedded ? "space-y-6" : "";
  const sectionClass = embedded
    ? "mb-6 md:mb-8 rounded-lg border border-white/5 bg-secondary/50 p-3 md:p-4"
    : "glass-card p-4 md:p-6 mb-6 md:mb-8";
  const sectionClassNoMb = embedded
    ? "rounded-lg border border-white/5 bg-secondary/50 p-3 md:p-4"
    : "glass-card p-4 md:p-6";
  const titleClass = embedded
    ? "text-lg font-semibold text-foreground mb-4"
    : "text-xl font-bold text-foreground mb-4";
  const fallbackTextClass = "text-muted-foreground text-sm";
  const fallbackBlockClass = embedded
    ? "rounded-lg border border-white/5 bg-secondary/50 p-4"
    : "glass-card p-6";

  // Throttle/Brake : check real data
  const hasThrottleBrake = plotData?.throttle_brake?.laps?.[0]?.throttle_pct?.some(
    (v: number) => v > 10
  ) ?? false;



  return (
    <div className={wrapperClass}>
      {hasPlotData ? (
        <>
          {/* ═══ GLOBAL LAP SELECTOR ═══ */}
          <section className={sectionClass}>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h2 className={`${titleClass} mb-0`}>Sélection des tours</h2>
                <span className="text-xs text-muted-foreground">
                  ({selectedLapNumbers.length} tour{selectedLapNumbers.length > 1 ? "s" : ""} sélectionné{selectedLapNumbers.length > 1 ? "s" : ""})
                </span>
              </div>
              <p className="text-sm text-[#8b949e] -mt-2">
                Sélectionnez les tours à superposer sur les graphiques. Le point vert indique le meilleur tour.
              </p>
              <div className="flex flex-wrap gap-1.5 md:gap-2 items-center">
                {analysis.lap_times?.map((time, idx) => {
                  const lapNum = idx + 1;
                  const isSelected = selectedLapNumbers.includes(lapNum);
                  const isBest = lapNum === bestLapNumber;
                  return (
                    <Badge
                      key={lapNum}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer transition-all hover:scale-105 active:scale-95 py-1 px-2 md:py-1.5 md:px-3 flex items-center gap-1 md:gap-1.5 ${
                        isSelected
                          ? "bg-primary text-white border-transparent"
                          : "bg-transparent border-white/10 text-muted-foreground hover:border-[#ff6b35]/50"
                      } ${isBest ? "ring-1 ring-green-500/50" : ""}`}
                      onClick={() => toggleLap(lapNum)}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>T{lapNum}</span>
                      <span className="text-[10px] opacity-60">({time.toFixed(2)}s)</span>
                      {isBest && <div className="w-1.5 h-1.5 rounded-full bg-green-500" title="Meilleur tour" />}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ═══ 0. CARTE DU CIRCUIT — Meilleur tour ═══ */}
          {plotData.trajectory_2d?.corners?.length > 0 && (
            <section className={sectionClass}>
              <div className="flex items-center mb-4">
                <h2 className={`${titleClass} mb-0`}>Carte du Circuit</h2>
                <BestLapBadge lapNumber={bestLapNumber} />
              </div>
              <TrackMap
                corners={plotData.trajectory_2d.corners}
                margins={plotData.apex_margin?.corners}
                laps={plotData.trajectory_2d.laps ? [plotData.trajectory_2d.laps[bestTrackLapIndex]] : undefined}
              />
            </section>
          )}

          {/* ═══ 1. TRACE DE VITESSE — Tours sélectionnés ═══ */}
          {plotData.speed_trace && (
            <section className={sectionClass}>
              <div className="flex flex-col mb-4">
                <h2 className={`${titleClass} mb-1`}>Trace de Vitesse</h2>
                <p className="text-sm text-[#8b949e]">
                  Comparez votre vitesse tout au long du tour pour les tours sélectionnés.
                </p>
              </div>
              <SpeedTraceChart
                data={plotData.speed_trace}
                selectedLaps={selectedLapNumbers}
                bestLapNumber={bestLapNumber}
              />
            </section>
          )}

          {/* ═══ 1b. HEURE DELTA — Tours sélectionnés ═══ */}
          {plotData.time_delta_laps && plotData.time_delta_laps.laps?.length > 0 && (
            <section className={sectionClass}>
              <div className="flex flex-col mb-4">
                <h2 className={`${titleClass} mb-1`}>Delta Temps</h2>
                <p className="text-sm text-[#8b949e]">
                  Différence de temps par rapport au meilleur tour (T{plotData.time_delta_laps.best_lap_number}). Les valeurs positives indiquent des tours plus lents.
                </p>
              </div>
              <TimeDeltaLapsChart
                data={plotData.time_delta_laps}
                selectedLaps={selectedLapNumbers}
              />
            </section>
          )}

          {/* ═══ 2. RADAR — Pas de changement ═══ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {plotData.performance_radar && (
              <section className={sectionClassNoMb}>
                <div className="flex flex-col mb-4">
                  <h2 className={`${titleClass} mb-1`}>Radar de Performance</h2>
                  <p className="text-sm text-[#8b949e]">
                    Aperçu global de vos compétences. Un grand polygone régulier indique un pilotage complet et maîtrisé.
                  </p>
                </div>
                <PerformanceRadar data={plotData.performance_radar} />
              </section>
            )}
          </div>

          {/* ═══ 3. MARGE À L'APEX — Tours sélectionnés ═══ */}
          {plotData.apex_margin?.corners?.length > 0 && (
            <section className={sectionClass}>
              <div className="flex flex-col mb-4">
                <div className="flex items-center">
                  <h2 className={`${titleClass} mb-0`}>Marge à l'Apex (Vitesse perdue)</h2>
                  {selectedLapNumbers.length === 1 && selectedLapNumbers[0] === bestLapNumber && (
                    <BestLapBadge lapNumber={bestLapNumber} />
                  )}
                </div>
                <p className="text-sm text-[#8b949e] mt-1">
                  Écart en km/h entre la vitesse théorique et votre vitesse réelle. Une barre plus petite = plus proche de la limite.
                </p>
              </div>
              <ApexMarginChart data={plotData.apex_margin.corners} />
            </section>
          )}

          {/* ═══ 4. THROTTLE & BRAKE — Tours sélectionnés ═══ */}
          {hasThrottleBrake ? (
            <section className={sectionClass}>
              <div className="flex flex-col mb-4">
                <h2 className={`${titleClass} mb-1`}>Accélérateur & Frein</h2>
                <p className="text-sm text-[#8b949e]">
                  Visualisez vos points de freinage et vos remises de gaz pour les tours sélectionnés.
                </p>
              </div>
              <ThrottleBrakeChart
                data={plotData.throttle_brake}
                selectedLaps={selectedLapNumbers}
              />
            </section>
          ) : (
            <section className={sectionClass}>
              <h2 className={titleClass}>Throttle & Brake</h2>
              <p className={fallbackTextClass}>
                Données throttle/brake non disponibles pour ce format.
              </p>
            </section>
          )}


          {/* (Time Delta now handled by TimeDeltaLapsChart above) */}


          {/* ═══ 6. DÉTAILS DES VIRAGES — Meilleur tour ═══ */}
          {plotData.apex_margin?.corners?.length > 0 && (
            <section className="mb-8">
              <div className="flex flex-col mb-4">
                <div className="flex items-center">
                  <h2 className={`${titleClass} mb-0`}>Détails des virages</h2>
                  <BestLapBadge lapNumber={bestLapNumber} />
                </div>
                <p className="text-sm text-[#8b949e] max-w-2xl mt-1">
                  Analyse granulaire. <strong>Grades :</strong> (A) Excellent, proche de la limite. (B) Bon, légère marge. (C) Moyen, perte de temps notable. (D) Critique, erreur ou freinage excessif.
                </p>
              </div>
              <CornerDetailsGrid
                corners={enrichCornersWithCornerAnalysis(plotData, analysis)}
                variant={embedded ? "app" : "racing"}
              />
            </section>
          )}
        </>
      ) : (
        <section className="space-y-6">
          <p className={fallbackTextClass}>
            {analysis.plots && Object.keys(analysis.plots).length > 0
              ? "Données graphiques (fallback images base64)."
              : "Données graphiques non disponibles."}
          </p>
          {analysis.plots?.speed_trace && (
            <div className={fallbackBlockClass}>
              <h2 className={titleClass}>Speed Trace</h2>
              <img
                src={analysis.plots.speed_trace}
                alt="Speed trace"
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
