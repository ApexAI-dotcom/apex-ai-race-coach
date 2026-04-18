import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { TrajectoryCorner, TrajectoryLap, CornerMargin } from '@/types/analysis';
import { useTrackMap } from './useTrackMapData';
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
  onReferenceChange?: (lapNumber: number | null, isSynthetic: boolean) => void;
}

export function TrackMapPro({
  corners, laps = [], margins = [], cornerAnalysis = [],
  bestLapNumber, selectedLapNumbers = [], onReferenceChange,
}: TrackMapProProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Use the new custom hook acting as a controller
  const { state, handlers, data } = useTrackMap(
    corners, laps, margins, cornerAnalysis, selectedLapNumbers[0] ?? bestLapNumber
  );

  // Proxy the `onReferenceChange` for the UI Profiles
  const onProfileChange = (p: any) => handlers.handleProfileChange(p, onReferenceChange);
  const onCompareChange = (lap: number | null) => {
    state.setComparisonLap(lap);
    if (onReferenceChange) onReferenceChange(lap, lap === -1);
  };

  // ── Tooltip data ──
  const tooltipData = (() => {
    if (!state.hoveredPoint || !data || !data.primary) return null;
    const { index } = state.hoveredPoint;
    const lap = data.primary.lap;
    return {
      speed: lap.speed_kmh?.[index],
      throttle: lap.throttle_pct?.[index],
      brake: lap.brake_pct?.[index],
      rpm: lap.rpm?.[index],
      lateralG: lap.lateral_g?.[index],
    };
  })();

  const tooltipPos = (() => {
    if (!state.hoveredPoint || !containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: state.hoveredPoint.clientX - rect.left,
      y: state.hoveredPoint.clientY - rect.top,
    };
  })();

  const selectedCorner = state.selectedCornerId !== null && data
    ? data.cornerDetails.find((c) => c.id === state.selectedCornerId) ?? null
    : null;

  const comparisonLabel = (() => {
    if (!data?.reference) return undefined;
    if (data.reference.isSynthetic) return 'Modèle ApexAI — ligne calculée';
    const rLap = data.reference.lap;
    return `Tour ${rLap.lap_number}${rLap.is_best ? ' (meilleur)' : ''}`;
  })();

  // Apply Fullscreen correctly using a strict Portal-ready structure (handled in a parent div wrapping this or strictly by CSS)
  // Instead of hacky class additions, we apply inline-level classes cleanly.
  useEffect(() => {
    if (state.isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [state.isFullscreen]);

  if (!data?.primary && corners.length === 0) return null;

  const content = (
    <div
      ref={containerRef}
      className={`trackmap-pro w-full ${state.isFullscreen ? 'fixed inset-0 z-[9999] bg-[#0a0a0f] flex flex-col p-4 m-0 max-w-none' : 'relative rounded-xl overflow-hidden'}`}
    >
      <div className="p-3 pb-0 shrink-0">
        <TrackMapProfiles
          active={state.profile}
          onChange={onProfileChange}
          laps={laps}
          syntheticAvailable={!!data?.syntheticLap}
          selectedLapNumber={state.selectedLap}
          comparisonLapNumber={state.comparisonLap}
          onSelectedLapChange={state.setSelectedLap}
          onComparisonLapChange={onCompareChange}
          bestLapNumber={bestLapNumber}
        />
      </div>

      <div className={`relative px-1 pt-2 ${state.isFullscreen ? 'flex-1 w-full min-h-0 flex flex-col' : ''}`}>
        {data?.syntheticProjection && (
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => state.setShowSynthetic(!state.showSynthetic)}
              className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-md transition-all shadow-md backdrop-blur-sm ${
                state.showSynthetic 
                  ? 'bg-yellow-500/90 text-yellow-950 border border-yellow-500' 
                  : 'bg-black/60 text-yellow-400 hover:bg-black/80 border border-yellow-500/30'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
              {state.showSynthetic ? 'MASQUER TOUR IA' : 'AFFICHER TOUR IA'}
            </button>
          </div>
        )}
        
        {data && (
          <TrackMapCanvas
            primary={data.primary}
            reference={data.reference}
            syntheticProjection={data.syntheticProjection}
            showSynthetic={state.showSynthetic}
            corners={data.corners}
            profile={state.profile}
            hoveredIndex={state.hoveredPoint?.index ?? null}
            hoveredCornerId={state.hoveredCornerId}
            onPointHover={handlers.handlePointHover}
            onCornerClick={handlers.handleCornerClick}
            onCornerHover={state.setHoveredCornerId}
            isFullscreen={state.isFullscreen}
          />
        )}

        <TrackMapTooltip
          visible={!!state.hoveredPoint && !!tooltipData}
          x={tooltipPos.x}
          y={tooltipPos.y}
          speed={tooltipData?.speed}
          throttle={tooltipData?.throttle}
          brake={tooltipData?.brake}
          rpm={tooltipData?.rpm}
          lateralG={tooltipData?.lateralG}
          containerRef={containerRef}
        />

        <TrackMapCornerPanel
          corner={selectedCorner}
          onClose={() => state.setSelectedCornerId(null)}
        />

        <TrackMapFullscreen 
          isFullscreen={state.isFullscreen} 
          toggle={() => state.setIsFullscreen(!state.isFullscreen)} 
        />
      </div>

      <div className="px-3 pb-2 shrink-0">
        <TrackMapLegend
          profile={state.profile}
          speedMin={data?.globalSpeedMin ?? 0}
          speedMax={data?.globalSpeedMax ?? 100}
          hasModel={data?.reference?.isSynthetic ?? false}
          comparisonLabel={comparisonLabel}
          showSynthetic={state.showSynthetic}
        />
      </div>
    </div>
  );

  if (state.isFullscreen && typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
}
