import { useMemo } from "react";
import type { TrajectoryCorner, TrajectoryLap, TrackEdges } from "@/types/analysis";

export const SVG_W = 900;
export const SVG_H = 650;
export const DEFAULT_PAD = 55;

export interface ProjectedPoint {
  x: number;
  y: number;
  lat: number;
  lon: number;
}

export interface ProjectedCorner extends ProjectedPoint {
  id: number;
  label: string;
  grade: string;
  corner_type: string;
  apex_speed: number;
}

export interface TrackBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  latSpan: number;
  lonSpan: number;
  lonScale: number;
}

export function computeBounds(
  laps: TrajectoryLap[],
  corners: TrajectoryCorner[]
): TrackBounds | null {
  let minLat = Infinity,
    maxLat = -Infinity,
    minLon = Infinity,
    maxLon = -Infinity;
  let hasData = false;

  const update = (lat: number | null | undefined, lon: number | null | undefined) => {
    if (lat == null || lon == null) return;
    if (lat === 0 && lon === 0) return;
    if (Math.abs(lat) < 0.01 && Math.abs(lon) < 0.01) return;
    if (!isFinite(lat) || !isFinite(lon)) return;
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    hasData = true;
  };

  for (const lap of laps) {
    if (!lap.lat || !lap.lon) continue;
    for (let i = 0; i < lap.lat.length; i++) update(lap.lat[i], lap.lon[i]);
  }
  for (const c of corners) update(c.lat, c.lon);

  if (!hasData) return null;

  const midLat = (minLat + maxLat) / 2;
  const midLon = (minLon + maxLon) / 2;
  const lonScale = Math.cos((midLat * Math.PI) / 180);

  const MIN_SPAN = 0.002;
  const latSpan = Math.max(maxLat - minLat, MIN_SPAN);
  const lonSpan = Math.max((maxLon - minLon) * lonScale, MIN_SPAN);

  return {
    minLat: midLat - latSpan / 2,
    maxLat: midLat + latSpan / 2,
    minLon: midLon - lonSpan / lonScale / 2,
    maxLon: midLon + lonSpan / lonScale / 2,
    latSpan,
    lonSpan,
    lonScale,
  };
}

export function makeProjector(bounds: TrackBounds, pad: number = DEFAULT_PAD) {
  const availW = SVG_W - pad * 2;
  const availH = SVG_H - pad * 2;
  const scale = Math.min(availW / bounds.lonSpan, availH / bounds.latSpan);
  const offsetX = pad + (availW - bounds.lonSpan * scale) / 2;
  const offsetY = pad + (availH - bounds.latSpan * scale) / 2;

  return (lat: number, lon: number): [number, number] => {
    const x = offsetX + (lon - bounds.minLon) * bounds.lonScale * scale;
    const y = SVG_H - (offsetY + (lat - bounds.minLat) * scale);
    return [x, y];
  };
}

export function useTrackMapGeometry(
  laps: TrajectoryLap[],
  corners: TrajectoryCorner[],
  trackEdges?: TrackEdges | null
) {
  return useMemo(() => {
    const bounds = computeBounds(laps, corners);
    if (!bounds) {
      return {
        bounds: null,
        project: () => [0, 0] as [number, number],
        projectedCorners: [] as ProjectedCorner[],
        trackRibbonPath: null as string | null,
      };
    }

    const project = makeProjector(bounds);

    const projectedCorners: ProjectedCorner[] = corners.map((c) => {
      const [x, y] = project(c.lat, c.lon);
      return { ...c, x, y };
    });

    // Ruban de piste : bord gauche à l'aller, bord droit au retour, refermé.
    // Donne au pilote l'échelle réelle de la piste (largeur réglementaire),
    // sans laquelle une trajectoire sur fond noir ne veut pas dire grand-chose.
    let trackRibbonPath: string | null = null;
    const L = trackEdges?.left;
    const R = trackEdges?.right;
    if (L?.lat?.length && R?.lat?.length && L.lat.length === R.lat.length) {
      const fwd: string[] = [];
      for (let i = 0; i < L.lat.length; i++) {
        const [x, y] = project(L.lat[i], L.lon[i]);
        fwd.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
      }
      const back: string[] = [];
      for (let i = R.lat.length - 1; i >= 0; i--) {
        const [x, y] = project(R.lat[i], R.lon[i]);
        back.push(`L${x.toFixed(1)},${y.toFixed(1)}`);
      }
      trackRibbonPath = `${fwd.join("")}${back.join("")}Z`;
    }

    return { bounds, project, projectedCorners, trackRibbonPath };
  }, [laps, corners, trackEdges]);
}
