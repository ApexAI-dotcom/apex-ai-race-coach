/**
 * TrackMapPro — Main orchestrator
 * Premium circuit map visualization with 4 profiles (Speed, Braking, Compare, Complete)
 */
import { useState, useCallback, useRef, useEffect } from 'react';
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
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Apply CSS pseudo-fullscreen 
  useEffect(() => {
    if (!containerRef.current) return;
    if (isFullscreen) {
      containerRef.current.classList.add('fixed', 'inset-0', 'z-[999]', 'bg-[#111118]', 'flex', 'flex-col', 'overflow-y-auto');
      containerRef.current.classList.remove('relative');
      document.body.style.overflow = 'hidden';
    } else {
      containerRef.current.classList.remove('fixed', 'inset-0', 'z-[999]', 'bg-[#111118]', 'flex', 'flex-col', 'overflow-y-auto');
      containerRef.current.classList.add('relative');
      document.body.style.overflow = '';
    }
  }, [isFullscreen]);

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
      </div>

      {/* SVG Canvas and Controls */}
      <div className="relative px-1 pt-2">
        {data.syntheticProjection && (
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => setShowSynthetic(!showSynthetic)}
              className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-md transition-all shadow-md backdrop-blur-sm ${
                showSynthetic 
                  ? 'bg-yellow-500/90 text-yellow-950 border border-yellow-500' 
                  : 'bg-black/60 text-white/90 hover:bg-black/80 border border-white/10'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
              {showSynthetic ? 'MASQUER TOUR IA' : 'AFFICHER TOUR IA'}
            </button>
          </div>
        )}
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
          isFullscreen={isFullscreen}
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

        {/* Fullscreen button wrapper */}
        <TrackMapFullscreen 
          isFullscreen={isFullscreen} 
          toggle={() => setIsFullscreen(!isFullscreen)} 
        />
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
