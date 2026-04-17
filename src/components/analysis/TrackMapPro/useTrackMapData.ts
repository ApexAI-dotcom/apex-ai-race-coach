/**
 * TrackMapPro — useTrackMapData hook
 * Centralise la projection GPS, les bounds, l'alignement données, et le calcul des segments colorés.
 */
import { useMemo } from 'react';
import type {
  TrajectoryCorner,
  TrajectoryLap,
  CornerMargin,
  CornerDetail,
  TrackMapProfile,
} from '@/types/analysis';
import { speedToColor, brakingSegmentColor, brakingPhase, type BrakingPhase, APEX_RED, TRACK_GREEN, TRACK_GRAY } from './trackMapColors';

// ── SVG canvas dimensions ──
export const SVG_W = 900;
export const SVG_H = 650;
const DEFAULT_PAD = 55;

// ── Types ──
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

export interface ColoredSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  speed?: number;
  phase?: BrakingPhase;
  index: number;
}

export interface LapProjection {
  lap: TrajectoryLap;
  points: ProjectedPoint[];
  polyline: string;
  segments: ColoredSegment[];
  speedMin: number;
  speedMax: number;
  isSynthetic: boolean;
}

export interface TrackMapData {
  /** Primary lap projection (best or selected) */
  primary: LapProjection | null;
  /** Reference/comparison lap projection */
  reference: LapProjection | null;
  /** Synthetic model lap (if available) */
  syntheticLap: TrajectoryLap | null;
  /** Projected synthetic model lap */
  syntheticProjection: LapProjection | null;
  /** Projected corners */
  corners: ProjectedCorner[];
  /** Enriched corner details (merged from apex_margin + corner_analysis) */
  cornerDetails: CornerDetail[];
  /** Projection function for external use */
  project: (lat: number, lon: number) => [number, number];
  /** SVG dimensions */
  svgWidth: number;
  svgHeight: number;
  /** Speed bounds across all visible laps */
  globalSpeedMin: number;
  globalSpeedMax: number;
}

// ── Projection helpers ──
function computeBounds(laps: TrajectoryLap[], corners: TrajectoryCorner[]) {
  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  let hasData = false;

  const update = (lat: number, lon: number) => {
    if (lat === undefined || lon === undefined || lat === null || lon === null) return;
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

function makeProjector(
  bounds: NonNullable<ReturnType<typeof computeBounds>>,
  pad: number
) {
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

// ── Lap projection ──
function projectLap(
  lap: TrajectoryLap,
  project: (lat: number, lon: number) => [number, number],
  profile: TrackMapProfile,
  globalSpeedMin: number,
  globalSpeedMax: number,
): LapProjection {
  const pts: ProjectedPoint[] = [];
  const segments: ColoredSegment[] = [];
  const polyParts: string[] = [];

  const n = Math.min(lap.lat?.length ?? 0, lap.lon?.length ?? 0);
  const speeds = lap.speed_kmh ?? [];
  const throttles = lap.throttle_pct ?? [];
  const brakes = lap.brake_pct ?? [];

  let sMin = Infinity, sMax = -Infinity;

  for (let i = 0; i < n; i++) {
    const lt = lap.lat[i];
    const ln = lap.lon[i];
    if (!lt || !ln || (Math.abs(lt) < 0.01 && Math.abs(ln) < 0.01)) continue;
    const [x, y] = project(lt, ln);
    pts.push({ x, y, lat: lt, lon: ln });
    polyParts.push(`${x.toFixed(1)},${y.toFixed(1)}`);

    const spd = speeds[i] ?? 0;
    if (spd > 0) {
      sMin = Math.min(sMin, spd);
      sMax = Math.max(sMax, spd);
    }
  }

  // Build colored segments
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const avgSpeed = ((speeds[i] ?? 0) + (speeds[i + 1] ?? 0)) / 2;

    let color: string;
    let phase: BrakingPhase | undefined;

    // Adaptive logic for phase detection
    // Calculate speed delta over 2 points for slight smoothing
    const s1 = speeds[i] ?? 0;
    const s2 = speeds[Math.min(i + 2, speeds.length - 1)] ?? s1;
    const dv = s2 - s1;
    
    // Check if we have real pedal data (> 0)
    const hasPedals = throttles.some(t => t > 0) || brakes.some(b => b > 0);

    if (profile === 'speed' || profile === 'complete') {
      color = speedToColor(avgSpeed, globalSpeedMin, globalSpeedMax);
      // Still detect phase for overlays (like braking zones in 'complete')
      phase = dv < -0.3 ? 'braking' : dv > 0.3 ? 'acceleration' : 'coasting';
    } else if (profile === 'braking') {
      if (hasPedals) {
        const thr = ((throttles[i] ?? 0) + (throttles[i + 1] ?? 0)) / 2;
        const brk = ((brakes[i] ?? 0) + (brakes[i + 1] ?? 0)) / 2;
        color = brakingSegmentColor(thr, brk);
        phase = brakingPhase(thr, brk);
      } else {
        // Fallback to dv/dt
        if (dv < -0.5) {
          phase = 'braking';
          color = APEX_RED;
        } else if (dv > 0.5) {
          phase = 'acceleration';
          color = TRACK_GREEN;
        } else {
          phase = 'coasting';
          color = TRACK_GRAY;
        }
      }
    } else {
      // compare mode — solid color, determined by caller
      color = '#f97316';
    }

    segments.push({
      x1: p1.x, y1: p1.y,
      x2: p2.x, y2: p2.y,
      color,
      speed: avgSpeed,
      phase,
      index: i,
    });
  }

  return {
    lap,
    points: pts,
    polyline: polyParts.join(' '),
    segments,
    speedMin: sMin === Infinity ? 0 : sMin,
    speedMax: sMax === -Infinity ? 100 : sMax,
    isSynthetic: !!lap.is_synthetic,
  };
}

// ── Corners enrichment ──
function buildCornerDetails(
  corners: TrajectoryCorner[],
  margins: CornerMargin[],
  cornerAnalysis: unknown[]
): CornerDetail[] {
  const marginByLabel: Record<string, CornerMargin> = {};
  for (const m of margins) marginByLabel[m.label] = m;

  const caById: Record<number, any> = {};
  for (const ca of cornerAnalysis as any[]) {
    if (ca?.corner_id) caById[ca.corner_id] = ca;
  }

  return corners.map((c) => {
    const m = marginByLabel[c.label];
    const ca = caById[c.id];

    return {
      id: c.id,
      label: c.label,
      corner_type: c.corner_type || ca?.corner_type || 'unknown',
      grade: m?.grade || ca?.grade || c.grade || 'C',
      score: m?.score ?? ca?.score ?? 50,
      apex_speed_real: m?.apex_speed_real ?? ca?.apex_speed_real ?? c.apex_speed ?? 0,
      apex_speed_optimal: m?.apex_speed_optimal ?? ca?.apex_speed_optimal ?? 0,
      entry_speed: m?.entry_speed ?? ca?.entry_speed ?? 0,
      exit_speed: m?.exit_speed ?? ca?.exit_speed ?? 0,
      target_entry_speed: ca?.target_entry_speed,
      target_exit_speed: ca?.target_exit_speed,
      lateral_g_max: ca?.lateral_g_max ?? 0,
      time_lost: m?.time_lost ?? ca?.time_lost ?? 0,
      apex_lat: ca?.apex_lat ?? c.lat,
      apex_lon: ca?.apex_lon ?? c.lon,
      margin_kmh: m?.margin_kmh,
      status: m?.status,
    };
  });
}

// ── Main hook ──
export function useTrackMapData(
  corners: TrajectoryCorner[],
  laps: TrajectoryLap[] | undefined,
  margins: CornerMargin[],
  cornerAnalysis: unknown[],
  selectedLapNumber: number,
  comparisonLapNumber: number | null,
  profile: TrackMapProfile,
): TrackMapData {
  return useMemo(() => {
    const allLaps = laps ?? [];
    const realLaps = allLaps.filter((l) => !l.is_synthetic);

    // Find the original synthetic model lap
    const syntheticLap = allLaps.find((l) => l.is_synthetic) ?? null;

    // Compute bounds
    const bounds = computeBounds(realLaps.length > 0 ? realLaps : allLaps, corners);
    if (!bounds) {
      return {
        primary: null,
        reference: null,
        syntheticLap,
        syntheticProjection: null,
        corners: [],
        cornerDetails: [],
        project: () => [0, 0] as [number, number],
        svgWidth: SVG_W,
        svgHeight: SVG_H,
        globalSpeedMin: 0,
        globalSpeedMax: 100,
      };
    }

    const project = makeProjector(bounds, DEFAULT_PAD);

    // Project corners
    const projCorners: ProjectedCorner[] = corners.map((c) => {
      const [x, y] = project(c.lat, c.lon);
      return { ...c, x, y };
    });

    // Compute global speed bounds using robust percentiles (5th-98th) to ignore pit stops and spikes
    let globalMin = 40, globalMax = 100;
    const allSpeeds: number[] = [];
    for (const lap of realLaps) {
      if (!lap.speed_kmh) continue;
      for (const s of lap.speed_kmh) {
        if (s > 10) allSpeeds.push(s);
      }
    }
    if (allSpeeds.length > 0) {
      allSpeeds.sort((a, b) => a - b);
      globalMin = allSpeeds[Math.floor(allSpeeds.length * 0.05)];
      globalMax = allSpeeds[Math.floor(allSpeeds.length * 0.98)];
    }

    // Find the primary lap
    const primaryLap = realLaps.find((l) => l.lap_number === selectedLapNumber)
      || realLaps.find((l) => l.is_best)
      || realLaps[0];

    const primary = primaryLap
      ? projectLap(primaryLap, project, profile, globalMin, globalMax)
      : null;

    // Find comparison lap
    let reference: LapProjection | null = null;
    if (profile === 'compare' && comparisonLapNumber !== null) {
      // If comparison is -1, use synthetic lap
      const refLap = comparisonLapNumber === -1
        ? syntheticLap
        : realLaps.find((l) => l.lap_number === comparisonLapNumber);
      if (refLap) {
        reference = projectLap(refLap, project, profile, globalMin, globalMax);
      }
    }

    // Always project synthetic lap if available for the toggle
    let syntheticProjection: LapProjection | null = null;
    if (syntheticLap) {
       syntheticProjection = projectLap(syntheticLap, project, profile, globalMin, globalMax);
    }

    const cornerDetails = buildCornerDetails(corners, margins, cornerAnalysis);

    return {
      primary,
      reference,
      syntheticLap,
      syntheticProjection,
      corners: projCorners,
      cornerDetails,
      project,
      svgWidth: SVG_W,
      svgHeight: SVG_H,
      globalSpeedMin: globalMin,
      globalSpeedMax: globalMax,
    };
  }, [corners, laps, margins, cornerAnalysis, selectedLapNumber, comparisonLapNumber, profile]);
}
