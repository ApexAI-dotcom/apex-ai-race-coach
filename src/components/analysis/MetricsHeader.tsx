import type { AnalysisResponse } from "@/types/analysis";
import { GRADE_COLORS } from "./utils";

interface MetricsHeaderProps {
  analysis: AnalysisResponse;
}

export function MetricsHeader({ analysis }: MetricsHeaderProps) {
  const score = analysis.performance_score;
  const grade = score?.grade ?? "—";
  const overall = score?.overall_score != null ? Math.round(score.overall_score) : "—";
  const bestLap = analysis.best_lap_time != null ? analysis.best_lap_time : analysis.lap_time;
  const bestLapNum =
    analysis.lap_times?.length && analysis.best_lap_time != null
      ? (analysis.lap_times as number[]).indexOf(bestLap) + 1
      : 1;
  const avgSpeed =
    (analysis as unknown as { avg_speed_kmh?: number }).avg_speed_kmh ??
    (analysis.plot_data?.speed_trace?.avg_speed_kmh);
  const corners = analysis.corners_detected ?? 0;
  const gradeCounts = (analysis.corner_analysis as { grade?: string }[] ?? []).reduce(
    (acc, c) => {
      const g = (c.grade ?? "?").toUpperCase().slice(0, 1);
      acc[g] = (acc[g] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const gradeColor = GRADE_COLORS[grade] ?? "#8b949e";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="rounded-xl border border-apex-border bg-apex-surface p-4">
        <div className="text-apex-muted text-xs font-medium uppercase tracking-wide mb-1">
          Meilleur tour
        </div>
        <div className="text-apex-text text-2xl font-bold">
          {typeof bestLap === "number" ? bestLap.toFixed(2) : bestLap}s
        </div>
        <div className="text-apex-muted text-sm">Tour #{bestLapNum}</div>
      </div>

      <div className="rounded-xl border border-apex-border bg-apex-surface p-4">
        <div className="text-apex-muted text-xs font-medium uppercase tracking-wide mb-1">
          Score global
        </div>
        <div className="text-2xl font-bold" style={{ color: gradeColor }}>
          {overall}/100
        </div>
        <span
          className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold"
          style={{ backgroundColor: `${gradeColor}30`, color: gradeColor }}
        >
          {grade}
        </span>
      </div>

      <div className="rounded-xl border border-apex-border bg-apex-surface p-4">
        <div className="text-apex-muted text-xs font-medium uppercase tracking-wide mb-1">
          Vitesse moyenne
        </div>
        <div className="text-apex-text text-2xl font-bold">
          {avgSpeed != null ? `${Math.round(avgSpeed)} km/h` : "—"}
        </div>
      </div>

      <div className="rounded-xl border border-apex-border bg-apex-surface p-4">
        <div className="text-apex-muted text-xs font-medium uppercase tracking-wide mb-1">
          Virages
        </div>
        <div className="text-apex-text text-2xl font-bold">{corners}</div>
        <div className="text-apex-muted text-sm flex flex-wrap gap-1 mt-1">
          {Object.entries(gradeCounts).map(([g, n]) => (
            <span
              key={g}
              className="px-1.5 py-0.5 rounded text-xs"
              style={{ backgroundColor: `${GRADE_COLORS[g] ?? "#8b949e"}30` }}
            >
              {g}:{n}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
