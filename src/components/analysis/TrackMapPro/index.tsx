/**
 * TrackMapPro — Main orchestrator
 * Premium circuit map visualization with 4 profiles (Speed, Braking, Compare, Complete)
 */
import { useState, useCallback, useRef } from 'react';
import type {
  TrajectoryCorner,
  TrajectoryLap,
  CornerMargin,
  TrackMapProfile,
} from '@/types/analysis';
import { useTrackMapData } from './useTrackMapData';
import { TrackMapProfiles } from './TrackMapProfiles';
import { TrackMapCanvas } from './TrackMapCanvas';
import { TrackMapLegend } from './TrackMapLegend';
import { TrackMapTooltip } from './TrackMapTooltip';
import { TrackMapCornerPanel } from './TrackMapCornerPanel';
import { TrackMapFullscreen } from './TrackMapFullscreen';

interface TrackMapProProps {
  corners: TrajectoryCorner[];
  laps?: TrajectoryLap[];
  margins?: CornerMargin[];
  cornerAnalysis?: unknown[];
  bestLapNumber: number;
  selectedLapNumbers?: number[];
  /** Called when the user selects a comparison reference from the map */
  onReferenceChange?: (lapNumber: number | null, isSynthetic: boolean) => void;
}

export function TrackMapPro({
  corners,
  laps = [],
  margins = [],
  cornerAnalysis = [],
  bestLapNumber,
  selectedLapNumbers = [],
  onReferenceChange,
}: TrackMapProProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // ── State ──
  const [profile, setProfile] = useState<TrackMapProfile>('speed');
  const [selectedLap, setSelectedLap] = useState<number>(() => {
    // Default to the first selected lap or best lap
    return selectedLapNumbers[0] ?? bestLapNumber;
  });
  const [comparisonLap, setComparisonLap] = useState<number | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    index: number;
    clientX: number;
    clientY: number;
  } | null>(null);
  const [hoveredCornerId, setHoveredCornerId] = useState<number | null>(null);
  const [selectedCornerId, setSelectedCornerId] = useState<number | null>(null);
  const [showSynthetic, setShowSynthetic] = useState<boolean>(false);

  // ── Data ──
  const data = useTrackMapData(
    corners,
    laps,
    margins,
    cornerAnalysis,
    selectedLap,
    comparisonLap,
    profile,
  );

  // ── Handlers ──
  const handleProfileChange = useCallback((p: TrackMapProfile) => {
    setProfile(p);
    if (p !== 'compare') {
      setComparisonLap(null);
      onReferenceChange?.(null, false);
    }
  }, [onReferenceChange]);

  const handleComparisonChange = useCallback((lap: number | null) => {
    setComparisonLap(lap);
    onReferenceChange?.(lap, lap === -1);
  }, [onReferenceChange]);

  const handlePointHover = useCallback((index: number | null, clientX: number, clientY: number) => {
    if (index === null) {
      setHoveredPoint(null);
    } else {
      setHoveredPoint({ index, clientX, clientY });
    }
  }, []);

  const handleCornerClick = useCallback((cornerId: number) => {
    setSelectedCornerId((prev) => (prev === cornerId ? null : cornerId));
  }, []);

  // ── Tooltip data extraction ──
  const tooltipData = (() => {
    if (!hoveredPoint || !data.primary) return null;
    const { index } = hoveredPoint;
    const lap = data.primary.lap;
    return {
      speed: lap.speed_kmh?.[index],
      throttle: lap.throttle_pct?.[index],
      brake: lap.brake_pct?.[index],
      rpm: lap.rpm?.[index],
      lateralG: lap.lateral_g?.[index],
    };
  })();

  // ── Tooltip position (relative to container) ──
  const tooltipPos = (() => {
    if (!hoveredPoint || !containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: hoveredPoint.clientX - rect.left,
      y: hoveredPoint.clientY - rect.top,
    };
  })();

  // ── Selected corner detail ──
  const selectedCorner = selectedCornerId !== null
    ? data.cornerDetails.find((c) => c.id === selectedCornerId) ?? null
    : null;

  // ── Comparison label ──
  const comparisonLabel = (() => {
    if (!data.reference) return undefined;
    if (data.reference.isSynthetic) return 'Modèle ApexAI — ligne calculée';
    const rLap = data.reference.lap;
    return `Tour ${rLap.lap_number}${rLap.is_best ? ' (meilleur)' : ''}`;
  })();

  if (!data.primary && corners.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="trackmap-pro relative"
    >
      {/* Profile selector */}
      <div className="p-3 pb-0">
        <TrackMapProfiles
          active={profile}
          onChange={handleProfileChange}
          laps={laps}
          syntheticAvailable={!!data.syntheticLap}
          selectedLapNumber={selectedLap}
          comparisonLapNumber={comparisonLap}
          onSelectedLapChange={setSelectedLap}
          onComparisonLapChange={handleComparisonChange}
          bestLapNumber={bestLapNumber}
        />
        {data.syntheticProjection && (
          <div className="flex justify-end mt-2">
            <button
              onClick={() => setShowSynthetic(!showSynthetic)}
              className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md transition-colors ${showSynthetic ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'text-muted-foreground hover:bg-secondary/50'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
              {showSynthetic ? 'Masquer Tour IA' : 'Afficher Tour Parfait IA'}
            </button>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="relative px-1 pt-2">
        <TrackMapCanvas
          primary={data.primary}
          reference={data.reference}
          syntheticProjection={data.syntheticProjection}
          showSynthetic={showSynthetic}
          corners={data.corners}
          profile={profile}
          hoveredIndex={hoveredPoint?.index ?? null}
          hoveredCornerId={hoveredCornerId}
          onPointHover={handlePointHover}
          onCornerClick={handleCornerClick}
          onCornerHover={setHoveredCornerId}
        />

        {/* Tooltip */}
        <TrackMapTooltip
          visible={!!hoveredPoint && !!tooltipData}
          x={tooltipPos.x}
          y={tooltipPos.y}
          speed={tooltipData?.speed}
          throttle={tooltipData?.throttle}
          brake={tooltipData?.brake}
          rpm={tooltipData?.rpm}
          lateralG={tooltipData?.lateralG}
          containerRef={containerRef}
        />

        {/* Corner detail panel */}
        <TrackMapCornerPanel
          corner={selectedCorner}
          onClose={() => setSelectedCornerId(null)}
        />

        {/* Fullscreen button */}
        <TrackMapFullscreen containerRef={containerRef}>
          <></>
        </TrackMapFullscreen>
      </div>

      {/* Legend */}
      <div className="px-3 pb-2">
        <TrackMapLegend
          profile={profile}
          speedMin={data.globalSpeedMin}
          speedMax={data.globalSpeedMax}
          hasModel={data.reference?.isSynthetic ?? false}
          comparisonLabel={comparisonLabel}
        />
      </div>
    </div>
  );
}
