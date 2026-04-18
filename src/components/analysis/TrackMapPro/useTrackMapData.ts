import { useMemo, useState, useCallback } from 'react';
import type { TrajectoryCorner, TrajectoryLap, CornerMargin, CornerDetail, TrackMapProfile } from '@/types/analysis';
import { useTrackMapGeometry } from './useTrackMapGeometry';
import { buildLapProjection, computeGlobalSpeedBounds } from './useTrackMapStyle';

export function useTrackMap(
  corners: TrajectoryCorner[],
  laps: TrajectoryLap[],
  margins: CornerMargin[],
  cornerAnalysis: unknown[],
  initialSelectedLapNumber: number
) {
  // --- UI State ---
  const [profile, setProfile] = useState<TrackMapProfile>('speed');
  const [selectedLap, setSelectedLap] = useState<number>(initialSelectedLapNumber);
  const [comparisonLap, setComparisonLap] = useState<number | null>(null);
  const [showSynthetic, setShowSynthetic] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Hover & Click states for tooltips and corners
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; clientX: number; clientY: number } | null>(null);
  const [hoveredCornerId, setHoveredCornerId] = useState<number | null>(null);
  const [selectedCornerId, setSelectedCornerId] = useState<number | null>(null);

  // --- External handlers ---
  const handleProfileChange = useCallback((p: TrackMapProfile, onReferenceChange?: (lapNumber: number | null, isSynthetic: boolean) => void) => {
    setProfile(p);
    if (p !== 'compare') {
      setComparisonLap(null);
      if (onReferenceChange) onReferenceChange(null, false);
    }
  }, []);

  const handlePointHover = useCallback((index: number | null, clientX: number, clientY: number) => {
    if (index === null) setHoveredPoint(null);
    else setHoveredPoint({ index, clientX, clientY });
  }, []);

  const handleCornerClick = useCallback((cornerId: number) => {
    setSelectedCornerId((prev) => (prev === cornerId ? null : cornerId));
  }, []);

  // --- Base Geometry computation ---
  const { project, projectedCorners, bounds } = useTrackMapGeometry(laps, corners);

  // --- Projection computing ---
  const data = useMemo(() => {
    if (!bounds || laps.length === 0) return null;

    const allLaps = laps;
    const realLaps = allLaps.filter((l) => !l.is_synthetic);
    const syntheticLap = allLaps.find((l) => l.is_synthetic) ?? null;

    // DEBUG: Trace synthetic lap data flow
    console.log('[TrackMap] Total laps received:', allLaps.length);
    console.log('[TrackMap] Laps details:', allLaps.map(l => ({ lap: l.lap_number, isSynthetic: l.is_synthetic, points: l.lat?.length })));
    console.log('[TrackMap] Synthetic lap found:', syntheticLap ? `yes (${syntheticLap.lat?.length} points)` : 'NO');

    const { globalMin, globalMax, globalMedian } = computeGlobalSpeedBounds(realLaps.length > 0 ? realLaps : allLaps);

    const primaryLap = realLaps.find((l) => l.lap_number === selectedLap) || realLaps.find((l) => l.is_best) || realLaps[0];

    const primary = primaryLap
      ? buildLapProjection(primaryLap, project, profile, globalMin, globalMax, globalMedian)
      : null;

    let reference = null;
    if (profile === 'compare' && comparisonLap !== null) {
      const refLap = comparisonLap === -1 ? syntheticLap : realLaps.find((l) => l.lap_number === comparisonLap);
      if (refLap) reference = buildLapProjection(refLap, project, profile, globalMin, globalMax, globalMedian);
    }

    let syntheticProjection = null;
    if (syntheticLap) {
       // DEBUG: Show actual coordinate values
       console.log('[TrackMap] Synthetic lat[0..4]:', syntheticLap.lat?.slice(0, 5));
       console.log('[TrackMap] Synthetic lon[0..4]:', syntheticLap.lon?.slice(0, 5));
       console.log('[TrackMap] Synthetic speed[0..4]:', syntheticLap.speed_kmh?.slice(0, 5));
       console.log('[TrackMap] typeof lat[0]:', typeof syntheticLap.lat?.[0]);
       // Check how many pass the filter
       let passCount = 0;
       let failCount = 0;
       for (let i = 0; i < (syntheticLap.lat?.length ?? 0); i++) {
         const lt = syntheticLap.lat[i];
         const ln = syntheticLap.lon[i];
         if (!lt || !ln || (Math.abs(lt) < 0.01 && Math.abs(ln) < 0.01)) {
           failCount++;
           if (failCount <= 3) console.log(`[TrackMap] FILTERED point ${i}: lat=${lt}, lon=${ln}, !lt=${!lt}, !ln=${!ln}`);
         } else {
           passCount++;
         }
       }
       console.log(`[TrackMap] Filter result: ${passCount} pass, ${failCount} fail out of ${syntheticLap.lat?.length}`);
       
       syntheticProjection = buildLapProjection(syntheticLap, project, profile, globalMin, globalMax, globalMedian);
       console.log('[TrackMap] Synthetic projection built:', syntheticProjection?.polyline?.length, 'chars,', syntheticProjection?.points?.length, 'projected points');
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
      } as CornerDetail;
    });

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
    };
  }, [project, bounds, laps, corners, profile, selectedLap, comparisonLap, margins, cornerAnalysis]);

  return {
    state: {
      profile, selectedLap, comparisonLap, showSynthetic, isFullscreen,
      hoveredPoint, hoveredCornerId, selectedCornerId,
      setProfile, setSelectedLap, setComparisonLap, setShowSynthetic, setIsFullscreen, setHoveredCornerId
    },
    handlers: {
      handleProfileChange, handlePointHover, handleCornerClick
    },
    data,
  };
}
