import type { AnalysisResponse, CornerMargin, PlotData } from "@/types/analysis";
import { SpeedTraceChart } from "./SpeedTraceChart";
import { ThrottleBrakeChart } from "./ThrottleBrakeChart";
import { TimeDeltaChart } from "./TimeDeltaChart";
import { PerformanceRadar } from "./PerformanceRadar";
import { TrackMap } from "./TrackMap";
import { ApexMarginChart } from "./ApexMarginChart";
import { MetricsHeader } from "./MetricsHeader";
import { CornerDetailsGrid } from "./CornerDetailsGrid";

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
  const data = analysis;

  const wrapperClass = embedded
    ? "space-y-6 rounded-xl border border-[#30363d] bg-[#0d1117] p-4 md:p-6"
    : "";

  return (
    <div className={wrapperClass}>
      <MetricsHeader analysis={data} />

      {hasPlotData ? (
        <>
          {plotData.speed_trace && (
            <section className="mb-8 rounded-xl border border-[#30363d] bg-[#161b22] p-4">
              <h2 className="text-lg font-semibold text-[#e6edf3] mb-4">Speed Trace</h2>
              <SpeedTraceChart data={plotData.speed_trace} />
            </section>
          )}

          {plotData.throttle_brake?.laps?.[0] && (
            <section className="mb-8 rounded-xl border border-[#30363d] bg-[#161b22] p-4">
              <h2 className="text-lg font-semibold text-[#e6edf3] mb-4">Throttle & Brake</h2>
              <ThrottleBrakeChart data={plotData.throttle_brake.laps[0]} />
            </section>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {plotData.time_delta && (
              <section className="rounded-xl border border-[#30363d] bg-[#161b22] p-4">
                <h2 className="text-lg font-semibold text-[#e6edf3] mb-4">Time Delta</h2>
                <TimeDeltaChart data={plotData.time_delta} />
              </section>
            )}
            {plotData.performance_radar && (
              <section className="rounded-xl border border-[#30363d] bg-[#161b22] p-4">
                <h2 className="text-lg font-semibold text-[#e6edf3] mb-4">Performance Radar</h2>
                <PerformanceRadar data={plotData.performance_radar} />
              </section>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {plotData.trajectory_2d?.corners?.length > 0 && (
              <section className="rounded-xl border border-[#30363d] bg-[#161b22] p-4">
                <h2 className="text-lg font-semibold text-[#e6edf3] mb-4">Track Map</h2>
                <TrackMap
                  corners={plotData.trajectory_2d.corners}
                  margins={plotData.apex_margin?.corners}
                  laps={plotData.trajectory_2d.laps}
                />
              </section>
            )}
            {plotData.apex_margin?.corners?.length > 0 && (
              <section className="rounded-xl border border-[#30363d] bg-[#161b22] p-4">
                <h2 className="text-lg font-semibold text-[#e6edf3] mb-4">Apex Margin</h2>
                <ApexMarginChart data={plotData.apex_margin.corners} />
              </section>
            )}
          </div>

          {plotData.apex_margin?.corners?.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-[#e6edf3] mb-4">Détail des virages</h2>
              <CornerDetailsGrid
                corners={enrichCornersWithCornerAnalysis(plotData, analysis)}
              />
            </section>
          )}
        </>
      ) : (
        <section className="space-y-6">
          <p className="text-[#8b949e] text-sm">
            {data.plots && Object.keys(data.plots).length > 0
              ? "Données graphiques (fallback images base64)."
              : "Données graphiques non disponibles. Métriques affichées ci-dessus."}
          </p>
          {data.plots?.speed_trace && (
            <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-4">
              <h2 className="text-lg font-semibold text-[#e6edf3] mb-4">Speed Trace</h2>
              <img
                src={data.plots.speed_trace}
                alt="Speed trace"
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}
          {data.plots?.throttle_brake && (
            <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-4">
              <h2 className="text-lg font-semibold text-[#e6edf3] mb-4">Throttle & Brake</h2>
              <img
                src={data.plots.throttle_brake}
                alt="Throttle and brake"
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}
          {data.plots?.performance_radar && (
            <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-4">
              <h2 className="text-lg font-semibold text-[#e6edf3] mb-4">Performance Radar</h2>
              <img
                src={data.plots.performance_radar}
                alt="Performance radar"
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
