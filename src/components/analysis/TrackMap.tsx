import { useMemo, useState } from "react";
import type { TrajectoryCorner, CornerMargin, TrajectoryLap } from "@/types/analysis";

interface TrackMapProps {
  corners: TrajectoryCorner[];
  margins?: CornerMargin[];
  laps?: TrajectoryLap[];
  transparent?: boolean;
  className?: string;
  padding?: number;
  hideLabels?: boolean;
}

const W = 800;
const H = 600;
const DEFAULT_PAD = 60;

function project(
  lat: number,
  lon: number,
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number },
  scale: number,
  offsetX: number,
  offsetY: number,
  lonScale: number
) {
  const x = offsetX + (lon - bounds.minLon) * lonScale * scale;
  const y = H - (offsetY + (lat - bounds.minLat) * scale);
  return [x, y] as const;
}

export function TrackMap({ corners, margins = [], laps, transparent = false, className = "", padding, hideLabels = false }: TrackMapProps) {
  const [hoverId, setHoverId] = useState<number | null>(null);
  const PAD = padding ?? DEFAULT_PAD;

  const { points, width, height, trackPolyline, refPolyline } = useMemo(() => {
    // 1. Diagnostics (as requested by user)
    console.log("TrackMap: Render Start. Corners count:", corners.length, "Laps count:", laps?.length);
    if (laps && laps.length > 0) {
      console.log("TrackMap: Sample Lap 0 point:", laps[0].lat?.[0], laps[0].lon?.[0]);
    }

    // 2. Gather all points to find the real geographic center
    let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
    
    const updateBoundsFromCoords = (lats: number[], lons: number[]) => {
      let hasValid = false;
      for (let i = 0; i < lats.length; i++) {
        const lat = lats[i];
        const lon = lons[i];
        // Robust coordinate check: ignore 0, null, NaN, and extreme outliers
        if (lat === undefined || lon === undefined || lat === null || lon === null) continue;
        if (lat === 0 && lon === 0) continue;
        if (Math.abs(lat) < 0.01 && Math.abs(lon) < 0.01) continue; // Likely a GPS glitch near (0,0)
        if (!isFinite(lat) || !isFinite(lon)) continue;

        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLon = Math.min(minLon, lon);
        maxLon = Math.max(maxLon, lon);
        hasValid = true;
      }
      return hasValid;
    };

    let hasData = false;
    if (laps && laps.length > 0) {
      for (const lap of laps) {
        if (lap.lat && lap.lon) {
          if (updateBoundsFromCoords(lap.lat, lap.lon)) hasData = true;
        }
      }
    }

    if (corners && corners.length > 0) {
      for (const c of corners) {
        if (!c.lat || !c.lon || (c.lat === 0 && c.lon === 0)) continue;
        if (!isFinite(c.lat) || !isFinite(c.lon)) continue;

        minLat = Math.min(minLat, c.lat);
        maxLat = Math.max(maxLat, c.lat);
        minLon = Math.min(minLon, c.lon);
        maxLon = Math.max(maxLon, c.lon);
        hasData = true;
      }
    }

    if (!hasData) {
      console.warn("TrackMap: No valid data points found for bounds calculation.");
      return { points: [], width: W, height: H, trackPolyline: null, refPolyline: null };
    }

    console.log("TrackMap: Raw Bounds:", { minLat, maxLat, minLon, maxLon });

    // 3. Centered Bounds Logic (Crucial for avoiding diagonal noise)
    const midLat = (minLat + maxLat) / 2;
    const midLon = (minLon + maxLon) / 2;
    const initialLonScale = Math.cos((midLat * Math.PI) / 180);

    // Enforce a minimum span (approx 250m) to prevent tiny noise from stretching
    const MIN_SPAN_GPS = 0.002; 
    const currentLatSpan = maxLat - minLat;
    const currentLonSpan = (maxLon - minLon) * initialLonScale;

    const latSpan = Math.max(currentLatSpan, MIN_SPAN_GPS);
    const lonSpan = Math.max(currentLonSpan, MIN_SPAN_GPS);

    // Final bounds centered on the data's intentional center
    const finalBounds = {
      minLat: midLat - latSpan / 2,
      maxLat: midLat + latSpan / 2,
      minLon: midLon - (lonSpan / initialLonScale) / 2,
      maxLon: midLon + (lonSpan / initialLonScale) / 2,
    };

    console.log("TrackMap: Final Projection Bounds:", finalBounds, "Scale ScaleFactor:", { latSpan, lonSpan });

    const availableW = W - PAD * 2;
    const availableH = H - PAD * 2;
    const scale = Math.min(availableW / lonSpan, availableH / latSpan);
    const offsetX = PAD + (availableW - lonSpan * scale) / 2;
    const offsetY = PAD + (availableH - latSpan * scale) / 2;
    
    console.log("TrackMap: Scale Applied:", scale, "Offsets:", { offsetX, offsetY });

    const projectPoint = (lt: number, ln: number) => 
      project(lt, ln, finalBounds, scale, offsetX, offsetY, initialLonScale);

    // 4. Projections
    // Sort laps to find the most representative (best lap or longest)
    const sortedLaps = [...(laps ?? [])].sort((a, b) => {
      // Prioritize is_best if present
      if (a.is_best) return -1;
      if (b.is_best) return 1;
      return (b.lat?.length || 0) - (a.lat?.length || 0);
    });
    
    const lap0 = sortedLaps[0];
    const lapRef = sortedLaps[1];

    const pts = corners.map((c) => {
      const [x, y] = projectPoint(c.lat, c.lon);
      return { ...c, x, y };
    });

    let trackPolyline: string | null = null;
    let refPolyline: string | null = null;

    if (lap0 && lap0.lat?.length > 1) {
      const n = Math.min(lap0.lat.length, lap0.lon.length);
      const trackPoints: string[] = [];
      for (let i = 0; i < n; i++) {
        const lt = lap0.lat[i];
        const ln = lap0.lon[i];
        if (!lt || !ln || (Math.abs(lt) < 0.01 && Math.abs(ln) < 0.01)) continue;
        const [x, y] = projectPoint(lt, ln);
        trackPoints.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      trackPolyline = trackPoints.join(" ");
    }
    
    if (lapRef && lapRef.lat?.length > 1) {
      const n = Math.min(lapRef.lat.length, lapRef.lon.length);
      const refPoints: string[] = [];
      for (let i = 0; i < n; i++) {
        const lt = lapRef.lat[i];
        const ln = lapRef.lon[i];
        if (!lt || !ln || (Math.abs(lt) < 0.01 && Math.abs(ln) < 0.01)) continue;
        const [x, y] = projectPoint(lt, ln);
        refPoints.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      refPolyline = refPoints.join(" ");
    }

    if (!trackPolyline && pts.length > 1) {
      const fallbackPoints = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`);
      trackPolyline = fallbackPoints.join(" ");
    }

    return { points: pts, width: W, height: H, trackPolyline, refPolyline };
  }, [corners, laps, padding]);

  const marginByLabel = useMemo(() => {
    const m: Record<string, CornerMargin> = {};
    for (const x of margins) m[x.label] = x;
    return m;
  }, [margins]);

  if (points.length === 0 && !trackPolyline) return null;

  return (
    <div className={`w-full relative ${transparent ? "" : "glass-card p-4"} flex justify-center items-center ${className}`} aria-label="Track map">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-[600px] drop-shadow-2xl overflow-hidden"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {trackPolyline && (
          <>
            <polyline points={trackPolyline} fill="none" className="stroke-primary" strokeWidth={hideLabels ? "12" : "30"} strokeLinecap="round" strokeLinejoin="round" opacity={0.15} style={{ filter: "blur(8px)" }} />
            <polyline points={trackPolyline} fill="none" className="stroke-secondary-foreground/20" strokeWidth={hideLabels ? "8" : "24"} strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={trackPolyline} fill="none" className="stroke-border" strokeWidth={hideLabels ? "10" : "26"} strokeLinecap="round" strokeLinejoin="round" opacity={0.5} strokeDasharray="10 10" />
            <polyline points={trackPolyline} fill="none" className="stroke-primary" strokeWidth={hideLabels ? "2" : "3"} strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {refPolyline && (
          <polyline points={refPolyline} fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 6" strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
        )}
        {!hideLabels && points.map((p) => {
          const margin = marginByLabel[p.label];
          const isHover = hoverId === p.id;
          return (
            <g key={p.id} onMouseEnter={() => setHoverId(p.id)} onMouseLeave={() => setHoverId(null)} className="cursor-pointer" style={{ transition: "all 0.2s ease" }}>
              <circle cx={p.x} cy={p.y} r={isHover ? 6 : 4} fill="#ffffff" className="pointer-events-none" />
              <circle cx={p.x} cy={p.y - 20} r={isHover ? 14 : 12} fill="#000000" stroke={isHover ? "#ff6b35" : "#ffffff"} strokeWidth={isHover ? 3 : 2} />
              <text x={p.x} y={p.y - 16} textAnchor="middle" fill="#ffffff" fontSize={isHover ? "12" : "10"} fontWeight="bold" className="font-display select-none pointer-events-none">
                {p.label.replace('V', '')}
              </text>
              {isHover && margin && (
                <title>
                  Virage {p.label.replace('V', '')} | Vitesse: {p.apex_speed?.toFixed(1)} km/h | Grade: {p.grade}
                  {margin.time_lost != null ? ` | Temps perdu: ${(margin.time_lost * 1000).toFixed(0)} ms` : ""}
                </title>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
