import { useMemo, useState } from "react";
import type { TrajectoryCorner, CornerMargin, TrajectoryLap } from "@/types/analysis";
import { GRADE_COLORS } from "./utils";

interface TrackMapProps {
  corners: TrajectoryCorner[];
  margins?: CornerMargin[];
  laps?: TrajectoryLap[];
}

const W = 400;
const H = 300;
const PAD = 20;

function getBoundsFromCorners(corners: TrajectoryCorner[]) {
  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  for (const c of corners) {
    minLat = Math.min(minLat, c.lat);
    maxLat = Math.max(maxLat, c.lat);
    minLon = Math.min(minLon, c.lon);
    maxLon = Math.max(maxLon, c.lon);
  }
  const pad = 0.0002;
  return { minLat: minLat - pad, maxLat: maxLat + pad, minLon: minLon - pad, maxLon: maxLon + pad };
}

function getBoundsFromLap(lap: TrajectoryLap) {
  const lat = lap.lat ?? [];
  const lon = lap.lon ?? [];
  if (lat.length === 0 || lon.length === 0) return null;
  const minLat = Math.min(...lat);
  const maxLat = Math.max(...lat);
  const minLon = Math.min(...lon);
  const maxLon = Math.max(...lon);
  const pad = 0.0002;
  return { minLat: minLat - pad, maxLat: maxLat + pad, minLon: minLon - pad, maxLon: maxLon + pad };
}

function project(
  lat: number,
  lon: number,
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number }
) {
  const width = W - PAD * 2;
  const height = H - PAD * 2;
  const x = PAD + ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon || 1)) * width;
  const y = H - PAD - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat || 1)) * height;
  return [x, y] as const;
}

export function TrackMap({ corners, margins = [], laps }: TrackMapProps) {
  const [hoverId, setHoverId] = useState<number | null>(null);

  const { points, width, height, trackPolyline, refPolyline } = useMemo(() => {
    const width = W;
    const height = H;
    const hasLaps = laps?.length && laps[0]?.lat?.length && laps[0]?.lon?.length;
    const lap0 = hasLaps ? laps![0] : null;
    const cornerBounds = corners.length > 0 ? getBoundsFromCorners(corners) : null;
    const lapBounds = lap0 ? getBoundsFromLap(lap0) : null;

    let bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number };
    if (cornerBounds && lapBounds) {
      bounds = {
        minLat: Math.min(cornerBounds.minLat, lapBounds.minLat),
        maxLat: Math.max(cornerBounds.maxLat, lapBounds.maxLat),
        minLon: Math.min(cornerBounds.minLon, lapBounds.minLon),
        maxLon: Math.max(cornerBounds.maxLon, lapBounds.maxLon),
      };
    } else if (lapBounds) {
      bounds = lapBounds;
    } else if (cornerBounds) {
      bounds = cornerBounds;
    } else {
      bounds = { minLat: 0, maxLat: 1, minLon: 0, maxLon: 1 };
    }

    const pts = corners.map((c) => {
      const [x, y] = project(c.lat, c.lon, bounds);
      return { ...c, x, y };
    });

    let trackPolyline: string | null = null;
    let refPolyline: string | null = null;

    if (lap0 && lap0.lat.length > 0 && lap0.lon.length > 0) {
      const n = Math.min(lap0.lat.length, lap0.lon.length);
      trackPolyline = Array.from({ length: n }, (_, i) =>
        project(lap0.lat[i], lap0.lon[i], bounds)
      )
        .map(([x, y]) => `${x},${y}`)
        .join(" ");
    }
    if (laps && laps.length > 1 && laps[1]?.lat?.length && laps[1]?.lon?.length) {
      const lap1 = laps[1];
      const n = Math.min(lap1.lat.length, lap1.lon.length);
      refPolyline = Array.from({ length: n }, (_, i) => project(lap1.lat[i], lap1.lon[i], bounds))
        .map(([x, y]) => `${x},${y}`)
        .join(" ");
    }

    if (!trackPolyline && pts.length > 1) {
      trackPolyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
    }

    return { points: pts, width, height, trackPolyline, refPolyline };
  }, [corners, laps]);

  const marginByLabel = useMemo(() => {
    const m: Record<string, CornerMargin> = {};
    for (const x of margins) m[x.label] = x;
    return m;
  }, [margins]);

  if (points.length === 0 && !trackPolyline) return null;

  return (
    <div className="w-full" aria-label="Track map">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-[280px]"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {/* Fond piste (trait épais gris) */}
        {trackPolyline && (
          <polyline
            points={trackPolyline}
            fill="none"
            stroke="#30363d"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {/* Trajectoire (trait fin orange) */}
        {trackPolyline && (
          <polyline
            points={trackPolyline}
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.8}
          />
        )}
        {/* Tour référence (pointillé bleu) */}
        {refPolyline && (
          <polyline
            points={refPolyline}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.6}
          />
        )}
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
