import type { AnalysisResponse } from "@/types/analysis";
import { GRADE_COLORS } from "./utils";
import { BlurOverlay } from "../ui/BlurOverlay";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

interface MetricsHeaderProps {
  analysis: AnalysisResponse;
  /** "app" = thème page (glass-card, text-foreground). "racing" = thème sombre hex. */
  variant?: "racing" | "app";
}

export function MetricsHeader({ analysis, variant = "racing" }: MetricsHeaderProps) {
  const navigate = useNavigate();
  const { isChartVisible, getCtaDetails } = useSubscription();
  const circuitName = analysis.session_conditions?.circuit_name;
  const cta = getCtaDetails(circuitName);
  
  // Track map is always visible, let's assume "vitesse_moyenne" and "score" follow speed_trace/others logic
  const isScoreVisible = isChartVisible("performance_score", circuitName);
  const isAvgSpeedVisible = isChartVisible("avg_speed", circuitName);
  const isCornersVisible = isChartVisible("corners", circuitName);

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
    : "glass-card p-4 h-full";
  const labelClass = "text-muted-foreground text-xs font-medium uppercase tracking-wide mb-1";
  const valueClass = "text-2xl font-bold text-foreground";
  const metaClass = "text-muted-foreground text-sm";

  const handleCta = () => navigate(cta.buttonText.includes("compte") ? "/auth" : "/pricing");

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className={cardClass} style={{ borderColor: 'rgba(34, 197, 94, 0.3)', backgroundColor: 'rgba(34, 197, 94, 0.05)' }}>
        <div className={labelClass} style={{ color: '#4ade80' }}>Meilleur tour</div>
        <div className={valueClass} style={{ color: '#22c55e' }}>
          {typeof bestLap === "number" ? bestLap.toFixed(2) : bestLap}s
        </div>
        <div className={metaClass} style={{ color: '#4ade80' }}>Tour #{bestLapNum}</div>
      </div>

      <div className="h-full">
        <BlurOverlay isLocked={!isScoreVisible} ctaTitle="" ctaButtonText="Débloquer" onCtaClick={handleCta}>
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
        </BlurOverlay>
      </div>

      <div className="h-full">
        <BlurOverlay isLocked={!isAvgSpeedVisible} ctaTitle="" ctaButtonText="Débloquer" onCtaClick={handleCta}>
          <div className={cardClass}>
            <div className={labelClass}>Vitesse moyenne</div>
            <div className={valueClass}>
              {avgSpeed != null ? `${Math.round(avgSpeed)} km/h` : "—"}
            </div>
          </div>
        </BlurOverlay>
      </div>

      <div className="h-full">
        <BlurOverlay isLocked={!isCornersVisible} ctaTitle="" ctaButtonText="Débloquer" onCtaClick={handleCta}>
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
        </BlurOverlay>
      </div>
    </div>
  );
}
