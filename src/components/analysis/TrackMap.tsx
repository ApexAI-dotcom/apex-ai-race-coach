import { useMemo, useState } from "react";
import type { TrajectoryCorner, CornerMargin } from "@/types/analysis";
import { GRADE_COLORS } from "./utils";

interface TrackMapProps {
  corners: TrajectoryCorner[];
  margins?: CornerMargin[];
}

function projectBounds(corners: TrajectoryCorner[]) {
  let minLat = Infinity,
    maxLat = -Infinity,
    minLon = Infinity,
    maxLon = -Infinity;
  for (const c of corners) {
    minLat = Math.min(minLat, c.lat);
    maxLat = Math.max(maxLat, c.lat);
    minLon = Math.min(minLon, c.lon);
    maxLon = Math.max(maxLon, c.lon);
  }
  const pad = 0.0002;
  return {
    minLat: minLat - pad,
    maxLat: maxLat + pad,
    minLon: minLon - pad,
    maxLon: maxLon + pad,
  };
}

export function TrackMap({ corners, margins = [] }: TrackMapProps) {
  const [hoverId, setHoverId] = useState<number | null>(null);

  const { points, width, height } = useMemo(() => {
    if (corners.length === 0) return { points: [], width: 200, height: 160 };
    const bounds = projectBounds(corners);
    const w = 280;
    const h = 200;
    const scaleX = w / (bounds.maxLon - bounds.minLon || 1);
    const scaleY = h / (bounds.maxLat - bounds.minLat || 1);
    const scale = Math.min(scaleX, scaleY);
    const ox = (w - (bounds.maxLon - bounds.minLon) * scale) / 2 + (bounds.minLon - bounds.minLon) * scale;
    const oy = (h - (bounds.maxLat - bounds.minLat) * scale) / 2 + (bounds.maxLat - bounds.minLat) * scale;

    const pts = corners.map((c) => ({
      ...c,
      x: (c.lon - bounds.minLon) * scale + (w - (bounds.maxLon - bounds.minLon) * scale) / 2,
      y: (bounds.maxLat - c.lat) * scale + (h - (bounds.maxLat - bounds.minLat) * scale) / 2,
    }));

    return { points: pts, width: w, height: h };
  }, [corners]);

  const marginByLabel = useMemo(() => {
    const m: Record<string, CornerMargin> = {};
    for (const x of margins) m[x.label] = x;
    return m;
  }, [margins]);

  if (points.length === 0) return null;

  return (
    <div className="w-full" aria-label="Track map">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-[220px]"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {/* Track line */}
        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="#30363d"
          strokeWidth="2"
        />
        {/* Corners */}
        {points.map((p) => {
          const margin = marginByLabel[p.label];
          const grade = p.grade ?? "C";
          const fill = GRADE_COLORS[grade] ?? "#8b949e";
          const isHover = hoverId === p.id;
          return (
            <g
              key={p.id}
              onMouseEnter={() => setHoverId(p.id)}
              onMouseLeave={() => setHoverId(null)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={isHover ? 10 : 7}
                fill={fill}
                stroke="#e6edf3"
                strokeWidth={isHover ? 2 : 1}
              />
              <text
                x={p.x}
                y={p.y - 12}
                textAnchor="middle"
                fill="#e6edf3"
                fontSize="10"
              >
                {p.label}
              </text>
              {isHover && margin && (
                <title>
                  {p.label} | Vitesse: {p.apex_speed?.toFixed(1)} km/h | Grade: {p.grade}
                  {margin.time_lost != null ? ` | Time lost: ${(margin.time_lost * 1000).toFixed(0)} ms` : ""}
                </title>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
