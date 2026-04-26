import type { TrajectoryCorner, TrajectoryLap } from "@/types/analysis";

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

const MIN_ZONE_WIDTH_M = 24;
const EDGE_PADDING_M = 6;

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
  for (let i = 0; i < apexes.length; i += 1) {
    const current = apexes[i];
    const prev = apexes[i - 1];
    const next = apexes[i + 1];

    const leftMid = prev ? (prev.apexX + current.apexX) / 2 : current.apexX - MIN_ZONE_WIDTH_M / 2;
    const rightMid = next ? (current.apexX + next.apexX) / 2 : current.apexX + MIN_ZONE_WIDTH_M / 2;

    let x1 = Math.max(lapMin + EDGE_PADDING_M, leftMid);
    let x2 = Math.min(lapMax - EDGE_PADDING_M, rightMid);

    if (x2 - x1 < MIN_ZONE_WIDTH_M) {
      const halfWidth = MIN_ZONE_WIDTH_M / 2;
      x1 = Math.max(lapMin + EDGE_PADDING_M, current.apexX - halfWidth);
      x2 = Math.min(lapMax - EDGE_PADDING_M, current.apexX + halfWidth);
    }

    if (x2 > x1) {
      overlays.push({
        id: current.id,
        label: current.label,
        x1,
        x2,
        apexX: current.apexX,
      });
    }
  }

  return overlays;
}

function findNearestLapIndex(cornerLat: number, cornerLon: number, lat: number[], lon: number[]): number | null {
  let bestIndex: number | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  const n = Math.min(lat.length, lon.length);
  for (let i = 0; i < n; i += 1) {
    const lt = lat[i];
    const ln = lon[i];
    if (!Number.isFinite(lt) || !Number.isFinite(ln)) continue;
    const dLat = lt - cornerLat;
    const dLon = ln - cornerLon;
    const d2 = dLat * dLat + dLon * dLon;
    if (d2 < bestDistance) {
      bestDistance = d2;
      bestIndex = i;
    }
  }

  return bestIndex;
}

export function buildCornerOverlays(params: {
  trajectoryCorners?: TrajectoryCorner[];
  referenceLap?: TrajectoryLap | null;
  cornerAnalysis?: unknown[];
  domainMin?: number;
  domainMax?: number;
}): CornerOverlay[] {
  const {
    trajectoryCorners = [],
    referenceLap = null,
    cornerAnalysis = [],
    domainMin,
    domainMax,
  } = params;

  const lapDistance = referenceLap?.distance_m ?? [];
  const lapLat = referenceLap?.lat ?? [];
  const lapLon = referenceLap?.lon ?? [];
  const lapMin = toFiniteNumber(domainMin) ?? lapDistance[0];
  const lapMax = toFiniteNumber(domainMax) ?? lapDistance[lapDistance.length - 1];
  if (!Number.isFinite(lapMin) || !Number.isFinite(lapMax) || lapMax <= lapMin) return [];

  const apexes: Array<{ id: string; label: string; apexX: number; order: number }> = [];

  if (trajectoryCorners.length > 0 && lapDistance.length > 0 && lapLat.length > 0 && lapLon.length > 0) {
    trajectoryCorners.forEach((corner, idx) => {
      const lapIndex = findNearestLapIndex(corner.lat, corner.lon, lapLat, lapLon);
      if (lapIndex === null || lapIndex >= lapDistance.length) return;

      const apexX = lapDistance[lapIndex];
      if (!Number.isFinite(apexX) || apexX < lapMin || apexX > lapMax) return;

      apexes.push({
        id: `gps-${corner.id ?? idx}`,
        label: corner.label || `V${idx + 1}`,
        apexX,
        order: getCornerNumber(corner.label, idx + 1),
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
