import { useMemo, useState, useCallback } from "react";
import type {
  TrajectoryCorner,
  TrajectoryLap,
  CornerMargin,
  CornerDetail,
  TrackMapProfile,
  TrackEdges,
  IdealLap,
} from "@/types/analysis";
import { useTrackMapGeometry } from "./useTrackMapGeometry";
import { buildLapProjection, computeGlobalSpeedBounds } from "./useTrackMapStyle";
import { APEX_RED, TRACK_GRAY } from "./trackMapColors";

/** Couleur d'un mini-secteur selon le temps réellement perdu (secondes/tour). */
function sectorColor(loss: number, maxLoss: number): string {
  if (loss <= 0.01) return "#22c55e"; // vert : rien à gagner ici
  const r = maxLoss > 0 ? Math.min(1, loss / maxLoss) : 0;
  if (r < 0.34) return "#a3e635";
  if (r < 0.67) return "#f59e0b";
  return "#ef4444"; // rouge : c'est ici que le temps part
}

export function useTrackMap(
  corners: TrajectoryCorner[],
  laps: TrajectoryLap[],
  margins: CornerMargin[],
  cornerAnalysis: unknown[],
  initialSelectedLapNumber: number,
  trackEdges?: TrackEdges | null,
  idealLap?: IdealLap | null
) {
  // --- UI State ---
  const [profile, setProfile] = useState<TrackMapProfile>("speed");
  const [selectedLap, setSelectedLap] = useState<number>(initialSelectedLapNumber);
  const [comparisonLap, setComparisonLap] = useState<number | null>(null);
  // Le Tour Parfait IA est la fonctionnalité phare de la carte : on l'affiche
  // d'emblée plutôt que de le cacher derrière un bouton que peu de pilotes
  // pensent à activer.
  const [showSynthetic, setShowSynthetic] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Hover & Click states for tooltips and corners
  const [hoveredPoint, setHoveredPoint] = useState<{
    index: number;
    clientX: number;
    clientY: number;
  } | null>(null);
  const [hoveredCornerId, setHoveredCornerId] = useState<number | null>(null);
  const [selectedCornerId, setSelectedCornerId] = useState<number | null>(null);

  // --- External handlers ---
  const handleProfileChange = useCallback(
    (
      p: TrackMapProfile,
      onReferenceChange?: (lapNumber: number | null, isSynthetic: boolean) => void
    ) => {
      setProfile(p);
      if (p !== "compare") {
        setComparisonLap(null);
        if (onReferenceChange) onReferenceChange(null, false);
      }
    },
    []
  );

  const handlePointHover = useCallback((index: number | null, clientX: number, clientY: number) => {
    if (index === null) setHoveredPoint(null);
    else setHoveredPoint({ index, clientX, clientY });
  }, []);

  const handleCornerClick = useCallback((cornerId: number) => {
    setSelectedCornerId((prev) => (prev === cornerId ? null : cornerId));
  }, []);

  // --- Base Geometry computation ---
  const { project, projectedCorners, bounds, trackRibbonPath } = useTrackMapGeometry(
    laps,
    corners,
    trackEdges
  );

  // --- Projection computing ---
  const data = useMemo(() => {
    if (!bounds || laps.length === 0) return null;

    const allLaps = laps;
    const realLaps = allLaps.filter((l) => !l.is_synthetic);
    const syntheticLap = allLaps.find((l) => l.is_synthetic) ?? null;

    const { globalMin, globalMax, globalMedian, quantiles } = computeGlobalSpeedBounds(
      realLaps.length > 0 ? realLaps : allLaps
    );

    const primaryLap =
      realLaps.find((l) => l.lap_number === selectedLap) ||
      realLaps.find((l) => l.is_best) ||
      realLaps[0];

    const primary = primaryLap
      ? buildLapProjection(primaryLap, project, profile, globalMin, globalMax, globalMedian, quantiles)
      : null;

    let reference = null;
    if (profile === "compare" && comparisonLap !== null) {
      const refLap =
        comparisonLap === -1 ? syntheticLap : realLaps.find((l) => l.lap_number === comparisonLap);
      if (refLap)
        reference = buildLapProjection(
          refLap,
          project,
          profile,
          globalMin,
          globalMax,
          globalMedian,
          quantiles
        );
    }

    let syntheticProjection = null;
    if (syntheticLap) {
      syntheticProjection = buildLapProjection(
        syntheticLap,
        project,
        profile,
        globalMin,
        globalMax,
        globalMedian,
        quantiles
      );
    }

    // Combine corners details
    const marginByLabel: Record<string, CornerMargin> = {};
    for (const m of margins) marginByLabel[m.label] = m;

    const caById: Record<number, any> = {};
    for (const ca of cornerAnalysis as any[]) {
      if (ca?.corner_id) caById[ca.corner_id] = ca;
    }

    const cornerDetails: CornerDetail[] = corners.map((c) => {
      const m = marginByLabel[c.label];
      const ca = caById[c.id];
      return {
        id: c.id,
        label: c.label,
        corner_type: c.corner_type || ca?.corner_type || "unknown",
        grade: m?.grade || ca?.grade || c.grade || "C",
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
      } as CornerDetail;
    });

    // ── Mini-secteurs : on répartit les secteurs mesurés (temps perdu réel)
    // le long du tour de référence, proportionnellement à la distance parcourue.
    // Le pilote voit ainsi OÙ, physiquement, le temps lui échappe.
    let sectorSegments: {
      path: string; loss: number; color: string; midX: number; midY: number;
      label: string; cornerTotal: number;
    }[] = [];
    const sectors = idealLap?.sectors ?? [];
    const refLapForSectors =
      realLaps.find((l) => l.lap_number === idealLap?.best_lap_number) ??
      realLaps.find((l) => l.is_best) ??
      primaryLap;
    if (sectors.length && refLapForSectors?.lat?.length) {
      const n = refLapForSectors.lat.length;
      const totalM = sectors[sectors.length - 1]?.end_m || 0;
      const maxLoss = Math.max(...sectors.map((s) => s.loss_s || 0), 0);
      if (totalM > 0 && n > 3) {
        // Total perdu PAR VIRAGE : c'est ce chiffre que le pilote lit dans les
        // conseils. Les étiquettes de la carte doivent afficher exactement le
        // même, sinon les deux écrans se contredisent.
        const lossByCorner = new Map<number, number>();
        for (const s of sectors) {
          if (s.corner_id == null) continue;
          lossByCorner.set(s.corner_id, (lossByCorner.get(s.corner_id) ?? 0) + (s.loss_s || 0));
        }
        // Une seule étiquette par virage, posée sur son secteur le plus coûteux.
        const labelSectorByCorner = new Map<number, number>();
        for (const s of sectors) {
          if (s.corner_id == null || !s.in_corner) continue;
          const cur = labelSectorByCorner.get(s.corner_id);
          const curLoss = cur == null ? -1 : sectors[cur]?.loss_s ?? -1;
          if ((s.loss_s || 0) > curLoss) labelSectorByCorner.set(s.corner_id, s.index);
        }

        sectorSegments = sectors
          .map((s) => {
            const i0 = Math.max(0, Math.min(n - 1, Math.round((s.start_m / totalM) * (n - 1))));
            const i1 = Math.max(0, Math.min(n - 1, Math.round((s.end_m / totalM) * (n - 1))));
            if (i1 <= i0) return null;
            const pts: string[] = [];
            for (let i = i0; i <= i1; i++) {
              const [x, y] = project(refLapForSectors.lat[i], refLapForSectors.lon[i]);
              pts.push(`${i === i0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
            }
            const mid = Math.floor((i0 + i1) / 2);
            const [mx, my] = project(refLapForSectors.lat[mid], refLapForSectors.lon[mid]);
            const loss = s.loss_s || 0;
            const cornerTotal = s.corner_id != null ? lossByCorner.get(s.corner_id) ?? 0 : 0;
            const isLabelSector =
              s.corner_id != null && labelSectorByCorner.get(s.corner_id) === s.index;
            return {
              path: pts.join(""),
              loss,
              color: sectorColor(loss, maxLoss),
              midX: mx,
              midY: my,
              // Étiquette = total du virage (identique aux conseils), pas la
              // perte de ce seul mini-secteur.
              label: isLabelSector && cornerTotal > 0.01 ? `V${s.corner_id} +${cornerTotal.toFixed(2)}s` : "",
              cornerTotal: isLabelSector ? cornerTotal : 0,
            };
          })
          .filter(Boolean) as typeof sectorSegments;
      }
    }

    // ── Repères de freinage : où le pilote commence RÉELLEMENT à freiner, et à
    // combien de mètres de l'apex. C'est le repère qu'il peut retrouver en
    // piste (compter les mètres depuis un panneau, une bordure…).
    const brakingPoints = (cornerAnalysis as any[])
      .filter((ca) => ca?.braking_lat != null && ca?.braking_lon != null)
      .map((ca) => {
        const [x, y] = project(ca.braking_lat, ca.braking_lon);
        const delta = Number(ca.braking_delta ?? 0);
        return {
          x,
          y,
          cornerId: Number(ca.corner_id ?? 0),
          distance: Number(ca.braking_point_distance ?? 0),
          delta,
          // vert = au bon endroit, ambre = perfectible, rouge = trop tard
          color: Math.abs(delta) < 3 ? "#22c55e" : delta > 0 ? "#f59e0b" : "#ef4444",
        };
      })
      .filter((b) => Number.isFinite(b.x) && Number.isFinite(b.y) && b.distance > 0);

    // ── Aligner la bande de freinage sur le repère mesuré ─────────────────
    // La bande rouge venait d'une heuristique frontend (chute de vitesse entre
    // deux points) qui démarre bien plus tôt que le freinage réel : le pilote
    // voyait la pastille « point de freinage » posée à la FIN de la zone rouge,
    // ce qui n'a aucun sens. On redessine la phase de freinage entre le repère
    // mesuré et l'apex du virage : bande et pastille disent enfin la même chose.
    if (profile === "braking" && primary && brakingPoints.length && primary.points.length > 2) {
      const nearestIndex = (x: number, y: number) => {
        let best = -1;
        let bestD = Infinity;
        for (let i = 0; i < primary.points.length; i++) {
          const dx = primary.points[i].x - x;
          const dy = primary.points[i].y - y;
          const d = dx * dx + dy * dy;
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        }
        return best;
      };
      const apexByCorner = new Map<number, { x: number; y: number }>();
      for (const c of projectedCorners) apexByCorner.set(c.id, { x: c.x, y: c.y });

      const isBraking = new Array(primary.segments.length).fill(false);
      for (const b of brakingPoints) {
        const apex = apexByCorner.get(b.cornerId);
        if (!apex) continue;
        const i0 = nearestIndex(b.x, b.y);
        const i1 = nearestIndex(apex.x, apex.y);
        if (i0 < 0 || i1 < 0 || i1 <= i0) continue;
        // Un freinage plus long que la moitié du tour est une erreur d'appariement.
        if (i1 - i0 > primary.points.length / 2) continue;
        for (let i = i0; i < Math.min(i1, isBraking.length); i++) isBraking[i] = true;
      }
      for (let i = 0; i < primary.segments.length; i++) {
        const seg = primary.segments[i];
        if (isBraking[i]) {
          seg.phase = "braking";
          seg.color = APEX_RED;
        } else if (seg.phase === "braking") {
          seg.phase = "coasting";
          seg.color = TRACK_GRAY;
        }
      }
    }

    return {
      primary,
      reference,
      syntheticLap,
      syntheticProjection,
      corners: projectedCorners,
      cornerDetails,
      project,
      globalSpeedMin: globalMin,
      globalSpeedMax: globalMax,
      trackRibbonPath,
      sectorSegments,
      brakingPoints,
    };
  }, [
    project,
    bounds,
    laps,
    corners,
    profile,
    selectedLap,
    comparisonLap,
    margins,
    cornerAnalysis,
    trackRibbonPath,
    idealLap,
  ]);

  return {
    state: {
      profile,
      selectedLap,
      comparisonLap,
      showSynthetic,
      isFullscreen,
      hoveredPoint,
      hoveredCornerId,
      selectedCornerId,
      setProfile,
      setSelectedLap,
      setComparisonLap,
      setShowSynthetic,
      setIsFullscreen,
      setHoveredCornerId,
      setSelectedCornerId,
    },
    handlers: {
      handleProfileChange,
      handlePointHover,
      handleCornerClick,
    },
    data,
  };
}
