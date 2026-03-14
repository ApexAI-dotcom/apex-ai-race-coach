import type { CornerMargin } from "@/types/analysis";
import { GRADE_COLORS } from "./utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CornerDetailsGridProps {
  corners: CornerMargin[];
}

export function CornerDetailsGrid({ corners }: CornerDetailsGridProps) {
  if (corners.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {corners.map((c) => {
        const gradeColor = GRADE_COLORS[c.grade] ?? "#8b949e";
        const isLeft = c.corner_type === "left";
        return (
          <div
            key={c.label}
            className="rounded-xl border border-apex-border bg-apex-surface p-3"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-apex-text font-semibold">{c.label}</span>
              {isLeft ? (
                <ChevronLeft className="w-4 h-4 text-apex-muted" aria-hidden />
              ) : (
                <ChevronRight className="w-4 h-4 text-apex-muted" aria-hidden />
              )}
            </div>
            <div className="text-apex-muted text-xs">
              Apex: {c.apex_speed_real.toFixed(1)} km/h
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{ backgroundColor: `${gradeColor}30`, color: gradeColor }}
              >
                {c.grade}
              </span>
              <span className="text-apex-muted text-xs">
                {c.margin_kmh >= 0 ? "+" : ""}{c.margin_kmh.toFixed(1)} km/h
              </span>
            </div>
            <div className="text-apex-muted text-xs mt-1">
              Time lost: {(c.time_lost * 1000).toFixed(0)} ms
            </div>
          </div>
        );
      })}
    </div>
  );
}
