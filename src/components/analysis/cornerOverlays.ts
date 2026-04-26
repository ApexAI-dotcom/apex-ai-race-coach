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

  if (rawDistance >= lapMin - 5 && rawDistance <= lapMax + 5) {
    return rawDistance;
  }

  const lapSpan = lapMax - lapMin;
  if (rawDistance >= 0 && rawDistance <= lapSpan + 50) {
    return lapMin + rawDistance;
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
  referenceSpeedLap?: { distance_m?: number[]; speed_kmh?: number[] } | null;
  cornerAnalysis?: unknown[];
  domainMin?: number;
  domainMax?: number;
}): CornerOverlay[] {
  const {
    trajectoryCorners = [],
    trajectoryLaps = [],
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

  const apexes: Array<{ id: string; label: string; apexX: number; order: number }> = [];

  const gpsMarkers = computeCornerMarkersFromGPS(
    trajectoryLaps.map((lap) => ({ lat: lap.lat ?? [], lon: lap.lon ?? [], is_synthetic: lap.is_synthetic })),
    trajectoryCorners.map((corner) => ({ lat: corner.lat, lon: corner.lon, label: corner.label })),
    lapMin
  );
  if (gpsMarkers?.length) {
    gpsMarkers.forEach((marker, idx) => {
      if (!Number.isFinite(marker.distance_m) || marker.distance_m < lapMin || marker.distance_m > lapMax) return;
      apexes.push({
        id: `gps-${marker.id}`,
        label: marker.label || `V${idx + 1}`,
        apexX: marker.distance_m,
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
      if (!Number.isFinite(marker.distance_m) || marker.distance_m < lapMin || marker.distance_m > lapMax) return;
      apexes.push({
        id: `spd-${marker.id}`,
        label: marker.label || `V${idx + 1}`,
        apexX: marker.distance_m,
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
