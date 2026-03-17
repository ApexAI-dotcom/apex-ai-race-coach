import { useMemo, useState } from "react";
import type { TrajectoryCorner, CornerMargin, TrajectoryLap } from "@/types/analysis";
import { GRADE_COLORS } from "./utils";

interface TrackMapProps {
  corners: TrajectoryCorner[];
  margins?: CornerMargin[];
  laps?: TrajectoryLap[];
}

const W = 800;
const H = 600;
const PAD = 40;

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
      const trackPoints = Array.from({ length: n }, (_, i) =>
        project(lap0.lat[i], lap0.lon[i], bounds)
      ).map(([x, y]) => `${x},${y}`);
      if (trackPoints.length > 2) trackPoints.push(trackPoints[0]);
      trackPolyline = trackPoints.join(" ");
    }
    if (laps && laps.length > 1 && laps[1]?.lat?.length && laps[1]?.lon?.length) {
      const lap1 = laps[1];
      const n = Math.min(lap1.lat.length, lap1.lon.length);
      const refPoints = Array.from({ length: n }, (_, i) =>
        project(lap1.lat[i], lap1.lon[i], bounds)
      ).map(([x, y]) => `${x},${y}`);
      if (refPoints.length > 2) refPoints.push(refPoints[0]);
      refPolyline = refPoints.join(" ");
    }

    if (!trackPolyline && pts.length > 1) {
      const fallbackPoints = pts.map((p) => `${p.x},${p.y}`);
      if (fallbackPoints.length > 2) fallbackPoints.push(fallbackPoints[0]);
      trackPolyline = fallbackPoints.join(" ");
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
    <div className="w-full relative rounded-xl bg-[#0d1117] p-4 flex justify-center items-center" aria-label="Track map">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-[600px] drop-shadow-2xl"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {/* Glow de la piste (pour l'effet asphalte chaud/lumière) */}
        {trackPolyline && (
          <polyline
            points={trackPolyline}
            fill="none"
            stroke="#ff6b35"
            strokeWidth="30"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.15}
            style={{ filter: "blur(8px)" }}
          />
        )}
        {/* Fond piste (trait très épais gris foncé/noir) */}
        {trackPolyline && (
          <polyline
            points={trackPolyline}
            fill="none"
            stroke="#161b22"
            strokeWidth="24"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {/* Bordures de piste (effet vibreur/limite) */}
        {trackPolyline && (
          <polyline
            points={trackPolyline}
            fill="none"
            stroke="#30363d"
            strokeWidth="26"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.5}
            strokeDasharray="10 10"
          />
        )}
        {/* Trajectoire idéale (trait fin couleur accent) */}
        {trackPolyline && (
          <polyline
            points={trackPolyline}
            fill="none"
            stroke="#ff6b35"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {/* Tour référence (pointillé bleu cyan) */}
        {refPolyline && (
          <polyline
            points={refPolyline}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeDasharray="6 6"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.8}
          />
        )}
        {/* Corners - Style F1 (Badges noirs avec texte blanc épais) */}
        {points.map((p) => {
          const margin = marginByLabel[p.label];
          const isHover = hoverId === p.id;
          
          return (
            <g
              key={p.id}
              onMouseEnter={() => setHoverId(p.id)}
              onMouseLeave={() => setHoverId(null)}
              onClick={() => {
                const el = document.getElementById(`corner-${p.label}`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  // Add a brief highlight flash
                  el.style.backgroundColor = '#38bdf840';
                  setTimeout(() => {
                    el.style.backgroundColor = '';
                  }, 1000);
                }
              }}
              className="cursor-pointer"
              style={{ transition: "all 0.2s ease" }}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={isHover ? 6 : 4}
                fill="#ffffff"
                className="pointer-events-none"
              />
              {/* Badge F1 (rond noir bordé de blanc avec numéro) */}
              <circle
                cx={p.x}
                cy={p.y - 20}
                r={isHover ? 14 : 12}
                fill="#000000"
                stroke={isHover ? "#ff6b35" : "#ffffff"}
                strokeWidth={isHover ? 3 : 2}
              />
              <text
                x={p.x}
                y={p.y - 16}
                textAnchor="middle"
                fill="#ffffff"
                fontSize={isHover ? "12" : "10"}
                fontWeight="bold"
                className="font-display select-none pointer-events-none"
              >
                {p.label.replace('V', '')}
              </text>
              
              {isHover && margin && (
                <g className="pointer-events-none">
                  {/* Tooltip SVG basique si besoin, ou on s'appuie sur le <title> natif */}
                  <title>
                    Virage {p.label.replace('V', '')} | Vitesse: {p.apex_speed?.toFixed(1)} km/h | Grade: {p.grade}
                    {margin.time_lost != null ? ` | Temps perdu: ${(margin.time_lost * 1000).toFixed(0)} ms` : ""}
                  </title>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
