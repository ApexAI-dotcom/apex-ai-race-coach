import type { AnalysisResponse, CornerMargin, PlotData } from "@/types/analysis";
import { useState, useMemo } from "react";
import { SpeedTraceChart } from "./SpeedTraceChart";
import { ThrottleBrakeChart } from "./ThrottleBrakeChart";
import { TimeDeltaChart } from "./TimeDeltaChart";
import { PerformanceRadar } from "./PerformanceRadar";
import { TrackMap } from "./TrackMap";
import { ApexMarginChart } from "./ApexMarginChart";
import { CornerDetailsGrid } from "./CornerDetailsGrid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Clock } from "lucide-react";

interface AnalysisDashboardContentProps {
  analysis: AnalysisResponse;
  /** Si true, affiche les sections avec fond/styles page (pour intégration Dashboard). Sinon contenu seul. */
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

export function AnalysisDashboardContent({ analysis, embedded = false }: AnalysisDashboardContentProps) {
  const plotData = analysis.plot_data;
  const hasPlotData = !!plotData;

  // Initialisation des tours sélectionnés : par défaut le meilleur tour
  const bestLapIndex = useMemo(() => {
    if (!analysis.lap_times || analysis.lap_times.length === 0) return 0;
    const minTime = Math.min(...analysis.lap_times);
    return analysis.lap_times.indexOf(minTime);
  }, [analysis.lap_times]);

  const [selectedLapNumbers, setSelectedLapNumbers] = useState<number[]>(() => {
    const lapNum = (bestLapIndex + 1);
    return [lapNum];
  });

  const toggleLap = (lapNum: number) => {
    setSelectedLapNumbers(prev => 
      prev.includes(lapNum) 
        ? (prev.length > 1 ? prev.filter(n => n !== lapNum) : prev) 
        : [...prev, lapNum].sort((a, b) => a - b)
    );
  };

  const wrapperClass = embedded ? "space-y-6" : "";
  const sectionClass = embedded
    ? "mb-8 rounded-lg border border-white/5 bg-secondary/50 p-4"
    : "mb-8 rounded-xl border border-[#30363d] bg-[#161b22] p-4";
  const sectionClassNoMb = embedded
    ? "rounded-lg border border-white/5 bg-secondary/50 p-4"
    : "rounded-xl border border-[#30363d] bg-[#161b22] p-4";
  const titleClass = embedded
    ? "text-lg font-semibold text-foreground mb-4"
    : "text-lg font-semibold text-[#e6edf3] mb-4";
  const fallbackTextClass = embedded ? "text-muted-foreground text-sm" : "text-[#8b949e] text-sm";
  const fallbackBlockClass = embedded
    ? "rounded-lg border border-white/5 bg-secondary/50 p-4"
    : "rounded-xl border border-[#30363d] bg-[#161b22] p-4";

  // Throttle/Brake : vérifier si données réelles (pas du bruit)
  const hasThrottleBrake = plotData?.throttle_brake?.laps?.[0]?.throttle_pct?.some(
    (v: number) => v > 10
  ) ?? false;

  // Time Delta : vérifier que les valeurs sont raisonnables (max ±10s)
  const timeDeltaValid = plotData?.time_delta?.delta_s?.length > 0 &&
    plotData.time_delta.delta_s.every((v: number) => Math.abs(v) < 10);

  return (
    <div className={wrapperClass}>
      {hasPlotData ? (
        <>
          {/* 0. Track Map — Pleine largeur tout en haut */}
          {plotData.trajectory_2d?.corners?.length > 0 && (
            <section className={sectionClass}>
              <h2 className={titleClass}>Carte du Circuit</h2>
              <TrackMap
                corners={plotData.trajectory_2d.corners}
                margins={plotData.apex_margin?.corners}
                laps={plotData.trajectory_2d.laps}
              />
            </section>
          )}

          {/* 1. Speed Trace — pleine largeur */}
          {plotData.speed_trace && (
            <section className={sectionClass}>
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-4">
                <div className="flex flex-col">
                  <h2 className={`${titleClass} mb-1`}>Trace de Vitesse</h2>
                  <p className="text-sm text-[#8b949e]">
                    Comparez votre vitesse tout au long du tour. Sélectionnez les tours à superposer.
                  </p>
                </div>
                
                {/* Lap Selector */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-medium text-muted-foreground mr-1">Tours :</span>
                  {analysis.lap_times?.map((time, idx) => {
                    const lapNum = idx + 1;
                    const isSelected = selectedLapNumbers.includes(lapNum);
                    const isBest = idx === bestLapIndex;
                    return (
                      <Badge
                        key={lapNum}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer transition-all hover:scale-105 active:scale-95 py-1.5 px-3 flex items-center gap-1.5 ${
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
              <SpeedTraceChart 
                data={plotData.speed_trace} 
                selectedLaps={selectedLapNumbers}
                bestLapNumber={bestLapIndex + 1}
              />
            </section>
          )}

          {/* 2. Performance Radar — 1 colonne centrée ou grid si on veut ajouter autre chose */}
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
            {/* Espace libre pour un éventuel futur composant */}
          </div>

          {/* 3. Apex Margin — pleine largeur */}
          {plotData.apex_margin?.corners?.length > 0 && (
            <section className={sectionClass}>
              <div className="flex flex-col mb-4">
                <h2 className={`${titleClass} mb-1`}>Marge à l'Apex (Vitesse perdue)</h2>
                <p className="text-sm text-[#8b949e]">
                  Représente l'écart en km/h entre la vitesse théorique maximale et votre vitesse réelle. Une barre plus petite signifie que vous étiez à la limite (Grade A/B).
                </p>
              </div>
              <ApexMarginChart data={plotData.apex_margin.corners} />
            </section>
          )}

          {/* 4. Throttle & Brake — conditionnel */}
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

          {/* 5. Time Delta — conditionnel */}
          {timeDeltaValid ? (
            <section className={sectionClass}>
              <h2 className={titleClass}>Delta de Temps</h2>
              <TimeDeltaChart data={plotData.time_delta} />
            </section>
          ) : plotData.time_delta ? (
            <section className={sectionClass}>
              <h2 className={titleClass}>Delta de Temps</h2>
              <p className={fallbackTextClass}>
                Données time delta non exploitables (valeurs hors plage).
              </p>
            </section>
          ) : null}

          {/* 6. Détail des virages — cartes */}
          {plotData.apex_margin?.corners?.length > 0 && (
            <section className="mb-8">
              <div className="flex flex-col mb-4">
                <h2 className={`${titleClass} mb-1`}>Détails des virages</h2>
                <p className="text-sm text-[#8b949e] max-w-2xl">
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
