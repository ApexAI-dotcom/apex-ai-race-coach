import type { CornerMargin } from "@/types/analysis";
import { GRADE_COLORS } from "./utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CornerDetailsGridProps {
  corners: CornerMargin[];
  /** "app" = thème page (border-white/5, text-foreground). "racing" = thème sombre hex. */
  variant?: "racing" | "app";
}

export function CornerDetailsGrid({ corners, variant = "racing" }: CornerDetailsGridProps) {
  if (corners.length === 0) return null;

  const isApp = variant === "app";
  const cardClass = isApp
    ? "rounded-lg border border-white/5 bg-secondary/50 p-4"
    : "glass-card p-4 text-left";
  const labelClass = "font-semibold text-foreground";
  const iconClass = "w-4 h-4 text-muted-foreground";
  const metaClass = "text-muted-foreground text-xs";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
      {corners.map((c) => {
        const gradeColor = GRADE_COLORS[c.grade] ?? "#8b949e";
        const isLeft = c.corner_type === "left";
        return (
          <div key={c.label} id={`corner-${c.label}`} className={cardClass}>
            <div className="flex items-center justify-between mb-1">
              <span className={labelClass}>{c.label}</span>
              {isLeft ? (
                <ChevronLeft className={iconClass} aria-hidden />
              ) : (
                <ChevronRight className={iconClass} aria-hidden />
              )}
            </div>
            <div className={metaClass}>
              Apex: {c.apex_speed_real != null ? c.apex_speed_real.toFixed(1) : "—"} km/h
              <br/>
              <span className="text-[10px] opacity-70">
                In: {c.entry_speed != null ? Math.round(c.entry_speed) : "—"} | Out: {c.exit_speed != null ? Math.round(c.exit_speed) : "—"}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{ backgroundColor: `${gradeColor}30`, color: gradeColor }}
              >
                {c.grade}
              </span>
              <span className={metaClass}>
                {c.margin_kmh != null
                  ? `${c.margin_kmh >= 0 ? "+" : ""}${c.margin_kmh.toFixed(1)} km/h`
                  : "—"}
              </span>
            </div>
            <div className={`${metaClass} mt-1`}>
              Perte tps: {c.time_lost != null ? `${(c.time_lost * 1000).toFixed(0)} ms` : "—"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
