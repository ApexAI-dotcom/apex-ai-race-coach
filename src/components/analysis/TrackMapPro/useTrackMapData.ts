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
import { BRAKING_VERDICT_COLORS } from "./trackMapColors";

/** Zone de freinage projetée dans le repère de la carte, prête à dessiner. */
export interface BrakingZoneView {
  cornerId: number;
  /** Position du repère = premier point de la bande, par construction. */
  x: number;
  y: number;
  /** Orientation locale de la piste, pour tracer le repère perpendiculairement. */
  angle: number;
  path: string;
  coastPath: string;
  distance: number;
  peakG: number;
  coasting: number;
  entrySpeed: number;
  minSpeed: number;
  doubleBrake: boolean;
  verdict: string;
  color: string;
}

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

    // ── Zones de freinage du tour affiché ───────────────────────────────────
    // Tout vient du serveur, déjà segmenté : la bande, son point de départ et
    // les chiffres sont UN SEUL objet. La carte ne fait que projeter des
    // coordonnées — elle ne réapplique aucun seuil, donc elle ne peut plus
    // placer une pastille ailleurs que sur sa bande.
    const verdictById: Record<number, string> = {};
    for (const ca of cornerAnalysis as any[]) {
      if (ca?.corner_id != null) verdictById[Number(ca.corner_id)] = ca.braking_verdict ?? "optimal";
    }

    const toPath = (lats?: number[], lons?: number[]) => {
      if (!lats?.length || !lons?.length) return "";
      const pts: string[] = [];
      for (let i = 0; i < Math.min(lats.length, lons.length); i++) {
        const [x, y] = project(lats[i], lons[i]);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        pts.push(`${pts.length === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
      }
      return pts.length > 1 ? pts.join("") : "";
    };

    const brakingZones = (primaryLap?.braking_zones ?? [])
      .map((z) => {
        if (z.start_lat == null || z.start_lon == null) return null;
        const [x, y] = project(z.start_lat, z.start_lon);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        // Direction locale du début de zone : sert à tracer le repère
        // PERPENDICULAIRE à la piste, comme un vrai panneau de freinage.
        let angle = 0;
        if (z.lat.length > 1) {
          const [x2, y2] = project(z.lat[1], z.lon[1]);
          angle = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI;
        }
        const verdict = verdictById[z.corner_id] ?? "optimal";
        return {
          cornerId: z.corner_id,
          x,
          y,
          angle,
          path: toPath(z.lat, z.lon),
          coastPath: toPath(z.coasting_lat, z.coasting_lon),
          distance: z.distance_to_apex_m,
          peakG: z.peak_g,
          coasting: z.coasting_s,
          entrySpeed: z.entry_speed_kmh,
          minSpeed: z.min_speed_kmh,
          doubleBrake: z.double_brake,
          verdict,
          color: BRAKING_VERDICT_COLORS[verdict] ?? BRAKING_VERDICT_COLORS.optimal,
        };
      })
      .filter(Boolean) as BrakingZoneView[];

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
      brakingZones,
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
