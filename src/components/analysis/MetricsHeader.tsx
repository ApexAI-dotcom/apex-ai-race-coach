import type { AnalysisResponse } from "@/types/analysis";
import { GRADE_COLORS } from "./utils";

interface MetricsHeaderProps {
  analysis: AnalysisResponse;
  /** "app" = thème page (glass-card, text-foreground). "racing" = thème sombre hex. */
  variant?: "racing" | "app";
}

export function MetricsHeader({ analysis, variant = "racing" }: MetricsHeaderProps) {
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
  const isApp = variant === "app";
  const cardClass = isApp
    ? "rounded-lg border border-white/5 bg-secondary/50 p-4"
    : "rounded-xl border border-[#30363d] bg-[#161b22] p-4";
  const labelClass = isApp
    ? "text-muted-foreground text-xs font-medium uppercase tracking-wide mb-1"
    : "text-[#8b949e] text-xs font-medium uppercase tracking-wide mb-1";
  const valueClass = isApp ? "text-2xl font-bold text-foreground" : "text-2xl font-bold text-[#e6edf3]";
  const metaClass = isApp ? "text-muted-foreground text-sm" : "text-[#8b949e] text-sm";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className={cardClass}>
        <div className={labelClass}>Meilleur tour</div>
        <div className={valueClass}>
          {typeof bestLap === "number" ? bestLap.toFixed(2) : bestLap}s
        </div>
        <div className={metaClass}>Tour #{bestLapNum}</div>
      </div>

      <div className={cardClass}>
        <div className={labelClass}>Score global</div>
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

      <div className={cardClass}>
        <div className={labelClass}>Vitesse moyenne</div>
        <div className={valueClass}>
          {avgSpeed != null ? `${Math.round(avgSpeed)} km/h` : "—"}
        </div>
      </div>

      <div className={cardClass}>
        <div className={labelClass}>Virages</div>
        <div className={valueClass}>{corners}</div>
        <div className={`${metaClass} flex flex-wrap gap-1 mt-1`}>
          {Object.entries(gradeCounts).map(([g, n]) => (
            <span
              key={g}
              className="px-1.5 py-0.5 rounded text-xs"
              style={{ backgroundColor: `${GRADE_COLORS[g] ?? "#8b949e"}30`, color: GRADE_COLORS[g] ?? "#8b949e" }}
            >
              {g}:{n}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
