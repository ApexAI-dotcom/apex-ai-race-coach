import { useMemo } from 'react';
import type { TrajectoryCorner, TrajectoryLap } from '@/types/analysis';

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

export function computeBounds(laps: TrajectoryLap[], corners: TrajectoryCorner[]): TrackBounds | null {
  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
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
    minLon: midLon - (lonSpan / lonScale) / 2,
    maxLon: midLon + (lonSpan / lonScale) / 2,
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

export function useTrackMapGeometry(laps: TrajectoryLap[], corners: TrajectoryCorner[]) {
  return useMemo(() => {
    const bounds = computeBounds(laps, corners);
    if (!bounds) {
      return {
        bounds: null,
        project: () => [0, 0] as [number, number],
        projectedCorners: [] as ProjectedCorner[]
      };
    }

    const project = makeProjector(bounds);

    const projectedCorners: ProjectedCorner[] = corners.map((c) => {
      const [x, y] = project(c.lat, c.lon);
      return { ...c, x, y };
    });

    return { bounds, project, projectedCorners };
  }, [laps, corners]);
}
