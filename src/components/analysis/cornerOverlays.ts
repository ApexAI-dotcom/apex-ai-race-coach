import type { TrajectoryCorner, TrajectoryLap } from "@/types/analysis";
import { computeCornerMarkersFromGPS, computeCornerMarkersFromSpeed } from "./utils";

export interface CornerOverlay {
  id: string;
  label: string;
  x1: number;
  x2: number;
  apexX: number;
}

interface CornerLike {
  corner_id?: number;
  corner_number?: number;
  label?: string;
  avg_cumulative_distance?: number;
}

const DEFAULT_HALF_ZONE_WIDTH_M = 34;
const MIN_HALF_ZONE_WIDTH_M = 18;
const EDGE_PADDING_M = 6;
const MIN_GAP_M = 4;

function toFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getCornerNumber(label: string | undefined, fallback: number): number {
  const labelMatch = typeof label === "string" ? label.match(/\d+/) : null;
  if (labelMatch) return Number(labelMatch[0]);
  return fallback;
}

function normalizeDistance(rawDistance: number, lapMin: number, lapMax: number): number | null {
  if (!Number.isFinite(rawDistance) || lapMax <= lapMin) return null;
  const lapSpan = lapMax - lapMin;

  if (rawDistance >= lapMin - 5 && rawDistance <= lapMax + 5) {
    return rawDistance;
  }

  if (rawDistance >= 0 && rawDistance <= lapSpan + 50) {
    return lapMin + rawDistance;
  }

  // Handle start/finish wrap-around: map values one lap before/after into current domain.
  const wrappedMinus = rawDistance - lapSpan;
  if (wrappedMinus >= lapMin - 10 && wrappedMinus <= lapMax + 10) {
    return wrappedMinus;
  }

  const wrappedPlus = rawDistance + lapSpan;
  if (wrappedPlus >= lapMin - 10 && wrappedPlus <= lapMax + 10) {
    return wrappedPlus;
  }

  return null;
}

function buildZonesFromApexes(apexes: Array<{ id: string; label: string; apexX: number }>, lapMin: number, lapMax: number): CornerOverlay[] {
  if (apexes.length === 0 || lapMax <= lapMin) return [];

  const overlays: CornerOverlay[] = [];
  let previousZoneEnd = lapMin + EDGE_PADDING_M - MIN_GAP_M;

  for (let i = 0; i < apexes.length; i += 1) {
    const current = apexes[i];
    const prev = apexes[i - 1];
    const next = apexes[i + 1];

    const leftSpacing = prev ? current.apexX - prev.apexX : Number.POSITIVE_INFINITY;
    const rightSpacing = next ? next.apexX - current.apexX : Number.POSITIVE_INFINITY;
    const localSpacing = Math.min(leftSpacing, rightSpacing);
    const localHalfWidth = Number.isFinite(localSpacing)
      ? Math.max(MIN_HALF_ZONE_WIDTH_M, Math.min(DEFAULT_HALF_ZONE_WIDTH_M, localSpacing * 0.32))
      : DEFAULT_HALF_ZONE_WIDTH_M;

    let x1 = Math.max(lapMin + EDGE_PADDING_M, current.apexX - localHalfWidth);
    let x2 = Math.min(lapMax - EDGE_PADDING_M, current.apexX + localHalfWidth);

    // Keep a visible gap between consecutive zones for readability.
    if (x1 < previousZoneEnd + MIN_GAP_M) {
      const shift = previousZoneEnd + MIN_GAP_M - x1;
      x1 += shift;
      x2 += shift;
    }

    if (x2 > lapMax - EDGE_PADDING_M) {
      const shiftBack = x2 - (lapMax - EDGE_PADDING_M);
      x1 -= shiftBack;
      x2 -= shiftBack;
    }

    if (x1 < lapMin + EDGE_PADDING_M) {
      x1 = lapMin + EDGE_PADDING_M;
    }

    if (x2 - x1 >= MIN_HALF_ZONE_WIDTH_M && x2 > x1) {
      overlays.push({
        id: current.id,
        label: current.label,
        x1,
        x2,
        apexX: current.apexX,
      });
      previousZoneEnd = x2;
    }
  }

  return overlays;
}

export function buildCornerOverlays(params: {
  trajectoryCorners?: TrajectoryCorner[];
  trajectoryLaps?: TrajectoryLap[];
  referenceTrajectoryLap?: TrajectoryLap | null;
  referenceSpeedLap?: { distance_m?: number[]; speed_kmh?: number[] } | null;
  cornerAnalysis?: unknown[];
  domainMin?: number;
  domainMax?: number;
}): CornerOverlay[] {
  const {
    trajectoryCorners = [],
    trajectoryLaps = [],
    referenceTrajectoryLap = null,
    referenceSpeedLap = null,
    cornerAnalysis = [],
    domainMin,
    domainMax,
  } = params;

  const lapDistance = referenceSpeedLap?.distance_m ?? [];
  const lapSpeeds = referenceSpeedLap?.speed_kmh ?? [];
  const lapMin = toFiniteNumber(domainMin) ?? lapDistance[0];
  const lapMax = toFiniteNumber(domainMax) ?? lapDistance[lapDistance.length - 1];
  if (!Number.isFinite(lapMin) || !Number.isFinite(lapMax) || lapMax <= lapMin) return [];

  // When chart domain is relative (0..lapLength) but speed trace distances are absolute
  // (e.g. 5026..6236), project speed distances into the chart domain.
  const speedStart = lapDistance[0];
  const speedEnd = lapDistance[lapDistance.length - 1];
  const speedSpan = Number.isFinite(speedStart) && Number.isFinite(speedEnd) ? speedEnd - speedStart : NaN;
  const domainSpan = lapMax - lapMin;
  const shouldAlignByOffset =
    Number.isFinite(speedSpan) &&
    Math.abs(speedSpan - domainSpan) < 120 &&
    Number.isFinite(speedStart) &&
    Math.abs(speedStart - lapMin) > 120;
  const speedDistanceOffset = shouldAlignByOffset && Number.isFinite(speedStart) ? speedStart - lapMin : 0;
  const toChartDistance = (value: number): number => value - speedDistanceOffset;

  const apexes: Array<{ id: string; label: string; apexX: number; order: number }> = [];

  // Primary strategy: map each detected corner (track map source of truth) to the same lap path,
  // then project by normalized index onto speed-trace distance. This decouples corner overlays
  // from braking minima and preserves 1:1 corner count coherence (e.g. 11 corners -> 11 zones).
  if (
    trajectoryCorners.length > 0 &&
    lapDistance.length > 5 &&
    referenceTrajectoryLap?.lat?.length &&
    referenceTrajectoryLap?.lon?.length
  ) {
    const lat = referenceTrajectoryLap.lat;
    const lon = referenceTrajectoryLap.lon;
    const n = Math.min(lat.length, lon.length);
    const distLen = lapDistance.length;

    for (let i = 0; i < trajectoryCorners.length; i += 1) {
      const corner = trajectoryCorners[i];
      let nearestIdx = -1;
      let best = Number.POSITIVE_INFINITY;

      for (let j = 0; j < n; j += 1) {
        const lt = lat[j];
        const ln = lon[j];
        if (!Number.isFinite(lt) || !Number.isFinite(ln)) continue;
        const dLat = corner.lat - lt;
        const dLon = corner.lon - ln;
        const d2 = dLat * dLat + dLon * dLon;
        if (d2 < best) {
          best = d2;
          nearestIdx = j;
        }
      }

      if (nearestIdx < 0) continue;
      const t = n > 1 ? nearestIdx / (n - 1) : 0;
      const speedIdx = Math.min(distLen - 1, Math.max(0, Math.round(t * (distLen - 1))));
      const apexX = normalizeDistance(toChartDistance(lapDistance[speedIdx]), lapMin, lapMax);
      if (apexX === null) continue;

      apexes.push({
        id: `trk-${corner.id ?? i + 1}`,
        label: corner.label || `V${i + 1}`,
        apexX,
        order: getCornerNumber(corner.label, i + 1),
      });
    }
  }

  const gpsMarkers = computeCornerMarkersFromGPS(
    trajectoryLaps.map((lap) => ({ lat: lap.lat ?? [], lon: lap.lon ?? [], is_synthetic: lap.is_synthetic })),
    trajectoryCorners.map((corner) => ({ lat: corner.lat, lon: corner.lon, label: corner.label })),
    lapMin
  );
  if (apexes.length === 0 && gpsMarkers?.length) {
    gpsMarkers.forEach((marker, idx) => {
      const apexX = normalizeDistance(marker.distance_m, lapMin, lapMax);
      if (apexX === null) return;
      apexes.push({
        id: `gps-${marker.id}`,
        label: marker.label || `V${idx + 1}`,
        apexX,
        order: getCornerNumber(marker.label, idx + 1),
      });
    });
  }

  if (apexes.length === 0 && lapDistance.length > 5 && lapSpeeds.length > 5 && trajectoryCorners.length > 0) {
    const speedMarkers = computeCornerMarkersFromSpeed(
      lapDistance,
      lapSpeeds,
      trajectoryCorners.map((corner, idx) => corner.label || `V${idx + 1}`)
    );
    speedMarkers.forEach((marker, idx) => {
      const apexX = normalizeDistance(toChartDistance(marker.distance_m), lapMin, lapMax);
      if (apexX === null) return;
      apexes.push({
        id: `spd-${marker.id}`,
        label: marker.label || `V${idx + 1}`,
        apexX,
        order: getCornerNumber(marker.label, idx + 1),
      });
    });
  }

  if (apexes.length === 0 && Array.isArray(cornerAnalysis)) {
    (cornerAnalysis as CornerLike[]).forEach((corner, idx) => {
      const raw = toFiniteNumber(corner.avg_cumulative_distance);
      if (raw === null) return;
      const apexX = normalizeDistance(raw, lapMin, lapMax);
      if (apexX === null) return;
      const order = corner.corner_number ?? corner.corner_id ?? idx + 1;
      apexes.push({
        id: `ca-${corner.corner_id ?? idx}`,
        label: corner.label || `V${order}`,
        apexX,
        order,
      });
    });
  }

  if (apexes.length === 0) return [];

  const uniqueByLabel = new Map<string, { id: string; label: string; apexX: number; order: number }>();
  for (const apex of apexes) {
    if (!uniqueByLabel.has(apex.label)) uniqueByLabel.set(apex.label, apex);
  }

  const sorted = Array.from(uniqueByLabel.values()).sort((a, b) => a.apexX - b.apexX || a.order - b.order);
  return buildZonesFromApexes(
    sorted.map(({ id, label, apexX }) => ({ id, label, apexX })),
    lapMin,
    lapMax
  );
}
