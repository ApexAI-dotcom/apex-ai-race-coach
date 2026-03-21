import React, { useState, useMemo } from "react";
import { Check, Zap, Info, MapPin, Gauge, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { SpeedTraceChart } from "./SpeedTraceChart";
import { PerformanceRadar } from "./PerformanceRadar";
import { ApexMarginChart } from "./ApexMarginChart";
import { ThrottleBrakeChart } from "./ThrottleBrakeChart";
import { CornerDetailsGrid } from "./CornerDetailsGrid";
import { TimeDeltaLapsChart } from "./TimeDeltaLapsChart";
import { TrackMap } from "./TrackMap";
import { CoachingAdvice } from "./CoachingAdvice";
import { enrichCornersWithCornerAnalysis } from "./utils";
import type { AnalysisResponse as AnalysisResult } from "@/types/analysis";

interface AnalysisDashboardContentProps {
  analysis: AnalysisResult;
  bestLapNumber?: number;
  bestTrackLapIndex?: number;
  selectedLapNumbers?: number[];
  toggleLap?: (lapNumber: number) => void;
  embedded?: boolean;
}

const BestLapBadge = ({ lapNumber }: { lapNumber: number }) => (
  <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-500 border-green-500/20 text-[10px] py-0 px-1.5 h-5 flex items-center gap-1">
    <Trophy className="w-2.5 h-2.5" />
    Meilleur T{lapNumber}
  </Badge>
);

export function AnalysisDashboardContent({
  analysis,
  bestLapNumber: providedBestLap,
  bestTrackLapIndex: providedBestTrackLapIndex,
  selectedLapNumbers: providedSelectedLaps,
  toggleLap: providedToggleLap,
  embedded = false,
}: AnalysisDashboardContentProps) {
  const { isChartVisible } = useSubscription();

  const plotData = analysis.plot_data;
  const hasPlotData = !!plotData;

  // Best lap computation
  const bestLapNumber = useMemo(() => {
    if (providedBestLap) return providedBestLap;
    if (!analysis.lap_times || analysis.lap_times.length === 0) return 1;
    const minTime = Math.min(...analysis.lap_times);
    return analysis.lap_times.indexOf(minTime) + 1;
  }, [analysis.lap_times, providedBestLap]);

  // Find the best lap index for TrackMap — use the lap with the most GPS points (non-cut)
  const bestTrackLapIndex = useMemo(() => {
    if (providedBestTrackLapIndex !== undefined) return providedBestTrackLapIndex;
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
    laps.forEach((lap: any, idx: number) => {
      const pts = lap?.lat?.length ?? 0;
      if (pts > maxPoints) {
        maxPoints = pts;
        maxIdx = idx;
      }
    });
    return maxIdx;
  }, [plotData?.trajectory_2d?.laps, bestLapNumber, providedBestTrackLapIndex]);

  const [localSelectedLaps, setLocalSelectedLaps] = useState<number[]>(() => providedSelectedLaps || [bestLapNumber]);

  const toggleLap = (lapNum: number) => {
    if (providedToggleLap) {
      providedToggleLap(lapNum);
    } else {
      setLocalSelectedLaps(prev => 
        prev.includes(lapNum) ? prev.filter(l => l !== lapNum) : [...prev, lapNum]
      );
    }
  };

  const selectedLapNumbers = providedSelectedLaps || localSelectedLaps;
  
  const wrapperClass = embedded ? "space-y-6" : "max-w-7xl mx-auto p-4 md:p-8 space-y-8";
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

  const hasThrottleBrake = plotData?.throttle_brake?.laps?.[0]?.throttle_pct?.some(
    (v: number) => v > 10
  ) ?? false;

  let ctaShown = false;
  const circuitName = analysis.session_conditions?.circuit_name;

  return (
    <div className={wrapperClass}>
      {hasPlotData ? (
        <>
          {/* LAPS SELECTION */}
          <section className={sectionClass}>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h2 className={`${titleClass} mb-0`}>Sélection des tours</h2>
              </div>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {analysis.lap_times?.map((time, idx) => {
                  const lapNum = idx + 1;
                  const isSelected = selectedLapNumbers.includes(lapNum);
                  const isBest = lapNum === bestLapNumber;
                  return (
                    <Badge
                      key={idx}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer gap-1.5 py-1.5 px-3 transition-all ${
                        isSelected 
                          ? "bg-primary text-white border-transparent"
                          : "bg-transparent border-white/10 text-muted-foreground hover:border-[#ff6b35]/50"
                      } ${isBest ? "ring-1 ring-green-500/50" : ""}`}
                      onClick={() => toggleLap(lapNum)}
                    >
                      <span>T{lapNum}</span>
                      <span className="text-[10px] opacity-60">({time.toFixed(2)}s)</span>
                      {isBest && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </section>

          {/* COACHING ADVICE */}
          {(() => {
            const isLocked = !isChartVisible("coaching_advice", circuitName);
            const currentHideCta = isLocked ? ctaShown : false;
            if (isLocked) ctaShown = true;
            return (
              <CoachingAdvice 
                advice={analysis.coaching_advice} 
                fastestLapNumber={bestLapNumber}
                isLocked={isLocked}
                hideCta={currentHideCta}
              />
            );
          })()}

          {/* TRACK MAP */}
          {plotData.trajectory_2d?.corners?.length > 0 && (
            <section className={sectionClass}>
               <h2 className={titleClass}>Carte du Circuit</h2>
               <TrackMap
                 corners={plotData.trajectory_2d.corners}
                 margins={plotData.apex_margin?.corners}
                 laps={plotData.trajectory_2d.laps ? [plotData.trajectory_2d.laps[bestTrackLapIndex]] : undefined}
                 onCornerClick={() => {}}
               />
            </section>
          )}

          {/* SPEED TRACE */}
          {plotData.speed_trace && (() => {
            const isLocked = !isChartVisible("speed_trace", circuitName);
            const currentHideCta = isLocked ? ctaShown : false;
            if (isLocked) ctaShown = true;
            return (
              <section className={sectionClass}>
                <h2 className={titleClass}>Trace de Vitesse</h2>
                <SpeedTraceChart
                  data={plotData.speed_trace}
                  selectedLaps={selectedLapNumbers}
                  bestLapNumber={bestLapNumber}
                  circuitName={circuitName}
                  hideCta={currentHideCta}
                />
              </section>
            );
          })()}

          {/* TIME DELTA */}
          {plotData.time_delta_laps && plotData.time_delta_laps.laps?.length > 0 && (() => {
            const isLocked = !isChartVisible("delta_time", circuitName);
            const currentHideCta = isLocked ? ctaShown : false;
            if (isLocked) ctaShown = true;
            return (
              <section className={sectionClass}>
                <h2 className={titleClass}>Delta Temps</h2>
                <TimeDeltaLapsChart
                  data={plotData.time_delta_laps}
                  selectedLaps={selectedLapNumbers}
                  circuitName={circuitName}
                  hideCta={currentHideCta}
                />
              </section>
            );
          })()}

          {/* RADAR */}
          {plotData.performance_radar && (() => {
            const isLocked = !isChartVisible("radar", circuitName);
            const currentHideCta = isLocked ? ctaShown : false;
            if (isLocked) ctaShown = true;
            return (
              <section className={sectionClass}>
                <h2 className={titleClass}>Radar de Performance</h2>
                <PerformanceRadar 
                  data={plotData.performance_radar} 
                  circuitName={circuitName}
                  hideCta={currentHideCta}
                />
              </section>
            );
          })()}

          {/* APEX MARGIN */}
          {plotData.apex_margin?.corners?.length > 0 && (() => {
            const isLocked = !isChartVisible("apex_margin", circuitName);
            const currentHideCta = isLocked ? ctaShown : false;
            if (isLocked) ctaShown = true;
            return (
              <section className={sectionClass}>
                <h2 className={titleClass}>Marge à l'Apex</h2>
                <ApexMarginChart 
                  data={plotData.apex_margin.corners} 
                  circuitName={circuitName}
                  hideCta={currentHideCta}
                />
              </section>
            );
          })()}

          {/* THROTTLE & BRAKE */}
          {hasThrottleBrake && (() => {
            const isLocked = !isChartVisible("throttle_brake", circuitName);
            const currentHideCta = isLocked ? ctaShown : false;
            if (isLocked) ctaShown = true;
            return (
              <section className={sectionClass}>
                <h2 className={titleClass}>Accélérateur & Frein</h2>
                <ThrottleBrakeChart
                  data={plotData.throttle_brake}
                  selectedLaps={selectedLapNumbers}
                  circuitName={circuitName}
                  hideCta={currentHideCta}
                />
              </section>
            );
          })()}

          {/* CORNER DETAILS */}
          {plotData.apex_margin?.corners?.length > 0 && (
            <section className="mb-8">
              <h2 className={titleClass}>Détails des virages</h2>
              <CornerDetailsGrid
                corners={enrichCornersWithCornerAnalysis(plotData, analysis)}
                variant={embedded ? "app" : "racing"}
              />
            </section>
          )}
        </>
      ) : (
        <section className="space-y-6">
          <p className={fallbackTextClass}>Données graphiques non disponibles.</p>
        </section>
      )}
    </div>
  );
}
