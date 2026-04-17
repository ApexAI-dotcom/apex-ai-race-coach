/**
 * TrackMapPro — SVG canvas with profile-aware rendering
 * Renders the main track visualization: colored segments, corners, direction arrows
 */
import { useCallback, type MouseEvent } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import type { TrackMapProfile } from '@/types/analysis';
import type { LapProjection, ProjectedCorner, ColoredSegment } from './useTrackMapData';
import { SVG_W, SVG_H } from './useTrackMapData';
import { APEX_ORANGE, APEX_RED, MODEL_GOLD, TRACK_BG_DARK, REF_WHITE } from './trackMapColors';

interface TrackMapCanvasProps {
  primary: LapProjection | null;
  reference: LapProjection | null;
  syntheticProjection?: LapProjection | null;
  showSynthetic?: boolean;
  corners: ProjectedCorner[];
  profile: TrackMapProfile;
  hoveredIndex: number | null;
  hoveredCornerId: number | null;
  onPointHover: (index: number | null, clientX: number, clientY: number) => void;
  onCornerClick: (cornerId: number) => void;
  onCornerHover: (cornerId: number | null) => void;
  isFullscreen?: boolean;
}

// Direction arrow every N segments
const ARROW_INTERVAL = 25;

function renderSegments(segments: ColoredSegment[], strokeWidth: number, opacity: number = 1) {
  // Batch segments by color for fewer DOM elements
  const groups: Record<string, string[]> = {};
  for (const seg of segments) {
    if (!groups[seg.color]) groups[seg.color] = [];
    groups[seg.color].push(`M${seg.x1.toFixed(1)},${seg.y1.toFixed(1)}L${seg.x2.toFixed(1)},${seg.y2.toFixed(1)}`);
  }

  return Object.entries(groups).map(([color, paths]) => (
    <path
      key={color}
      d={paths.join('')}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
    />
  ));
}

function renderGlow(polyline: string, color: string) {
  return (
    <polyline
      points={polyline}
      fill="none"
      stroke={color}
      strokeWidth={28}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={0.12}
      style={{ filter: 'blur(10px)' }}
    />
  );
}

function renderBrakingMarkers(segments: ColoredSegment[], isSynthetic: boolean) {
  const markers = [];
  // Skip first and last few segments to prevent false positives near start/finish overlap 
  const exclusionRange = 10;
  
  for (let i = exclusionRange; i < segments.length - exclusionRange; i++) {
    if (segments[i].phase === 'braking' && segments[i - 1].phase !== 'braking') {
      const dx = segments[i].x2 - segments[i].x1;
      const dy = segments[i].y2 - segments[i].y1;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      markers.push({ x: segments[i].x1, y: segments[i].y1, angle });
    }
  }

  const color = isSynthetic ? MODEL_GOLD : '#ef4444';

  return (
    <g className="pointer-events-none z-20">
      {markers.map((m, i) => (
        <g key={`bp-${i}`} transform={`translate(${m.x.toFixed(1)}, ${m.y.toFixed(1)})`}>
          {/* Pulsing effect to make braking points obvious */}
          <circle cx="0" cy="0" r="8" fill={color} opacity="0.3">
            <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="0" cy="0" r="4" fill="#ffffff" stroke={color} strokeWidth="2" />
        </g>
      ))}
    </g>
  );
}

function renderDirectionArrows(segments: ColoredSegment[]) {
  if (segments.length < ARROW_INTERVAL * 2) return null;
  const arrows: JSX.Element[] = [];

  for (let i = ARROW_INTERVAL; i < segments.length - 5; i += ARROW_INTERVAL) {
    const seg = segments[i];
    const dx = seg.x2 - seg.x1;
    const dy = seg.y2 - seg.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.5) continue;

    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const cx = (seg.x1 + seg.x2) / 2;
    const cy = (seg.y1 + seg.y2) / 2;

    arrows.push(
      <polygon
        key={`arrow-${i}`}
        points="0,-3 6,0 0,3"
        fill="rgba(255,255,255,0.25)"
        transform={`translate(${cx.toFixed(1)},${cy.toFixed(1)}) rotate(${angle.toFixed(1)})`}
      />
    );
  }

  return <g className="pointer-events-none">{arrows}</g>;
}

function renderCorners(
  corners: ProjectedCorner[],
  hoveredCornerId: number | null,
  onCornerClick: (id: number) => void,
  onCornerHover: (id: number | null) => void,
) {
  return corners.map((c) => {
    const isHovered = hoveredCornerId === c.id;
    const r = isHovered ? 15 : 13;
    return (
      <g
        key={c.id}
        className="cursor-pointer"
        onClick={() => onCornerClick(c.id)}
        onMouseEnter={() => onCornerHover(c.id)}
        onMouseLeave={() => onCornerHover(null)}
      >
        {/* Glow ring */}
        <circle
          cx={c.x}
          cy={c.y}
          r={r + 3}
          fill="none"
          stroke={isHovered ? APEX_ORANGE : 'rgba(249,115,22,0.3)'}
          strokeWidth={isHovered ? 2 : 1}
          opacity={isHovered ? 0.8 : 0.4}
        />
        {/* Background circle */}
        <circle cx={c.x} cy={c.y} r={r} fill="#000000" />
        {/* Gradient border */}
        <circle
          cx={c.x}
          cy={c.y}
          r={r}
          fill="none"
          stroke={`url(#corner-gradient)`}
          strokeWidth={isHovered ? 2.5 : 2}
        />
        {/* Apex star inside circle instead of number for a cleaner look or just standard text */}
        <text
          x={c.x}
          y={c.y + 3.5}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={isHovered ? '9' : '8'}
          fontWeight="800"
          fontFamily="'Space Grotesk', sans-serif"
          className="select-none pointer-events-none"
        >
          {c.label.replace('V', '')}
        </text>
        {/* Actual apex tip mark (tiny diamond pointing to the track) */}
        <polygon points={`${c.x},${c.y - r - 4} ${c.x - 3},${c.y - r - 7} ${c.x + 3},${c.y - r - 7}`} fill="#ffffff" />
      </g>
    );
  });
}

export function TrackMapCanvas({
  primary,
  reference,
  syntheticProjection,
  showSynthetic,
  corners,
  profile,
  hoveredIndex,
  hoveredCornerId,
  onPointHover,
  onCornerClick,
  onCornerHover,
  isFullscreen,
}: TrackMapCanvasProps) {
  // Invisible hit area for hover detection
  const handleMouseMove = useCallback(
    (e: MouseEvent<SVGSVGElement>) => {
      if (!primary) return;
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const scaleX = SVG_W / rect.width;
      const scaleY = SVG_H / rect.height;
      const svgX = (e.clientX - rect.left) * scaleX;
      const svgY = (e.clientY - rect.top) * scaleY;

      // Find nearest point
      const pts = primary.points;
      let bestDist = Infinity;
      let bestIdx = -1;
      // Sample every 2nd point for performance
      for (let i = 0; i < pts.length; i += 2) {
        const dx = pts[i].x - svgX;
        const dy = pts[i].y - svgY;
        const d = dx * dx + dy * dy;
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }

      if (bestDist < 900) { // ~30px radius
        onPointHover(bestIdx, e.clientX, e.clientY);
      } else {
        onPointHover(null, 0, 0);
      }
    },
    [primary, onPointHover]
  );

  const handleMouseLeave = useCallback(() => {
    onPointHover(null, 0, 0);
  }, [onPointHover]);

  return (
    <TransformWrapper
      initialScale={1}
      minScale={0.5}
      maxScale={6}
      centerOnInit={true}
      wheel={{ step: 0.1 }}
      doubleClick={{ mode: 'zoomIn' }}
      zoomAnimation={{ animationType: 'easeOut' }}
      panning={{ velocityDisabled: true }}
    >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <div className="relative w-full h-full">
            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 bg-secondary/80 p-1.5 rounded-md border border-white/10 backdrop-blur-sm shadow-xl">
              <button onClick={() => zoomIn()} className="p-1.5 hover:bg-white/10 rounded transition-colors text-white" aria-label="Zoom In">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              </button>
              <button onClick={() => zoomOut()} className="p-1.5 hover:bg-white/10 rounded transition-colors text-white" aria-label="Zoom Out">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/></svg>
              </button>
              <button onClick={() => resetTransform()} className="p-1.5 hover:bg-white/10 rounded transition-colors text-white" aria-label="Reset Zoom">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              </button>
            </div>

            <TransformComponent wrapperClass={`w-full overflow-hidden ${isFullscreen ? 'h-[calc(100vh-100px)]' : 'h-auto max-h-[600px]'} flex justify-center items-center`} contentClass="w-full h-full flex justify-center items-center">
              <svg
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                className="w-full overflow-visible"
                style={{ aspectRatio: `${SVG_W} / ${SVG_H}`, minHeight: '300px' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
      <defs>
        {/* F1-style corner gradient border */}
        <linearGradient id="corner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={APEX_ORANGE} />
          <stop offset="100%" stopColor={APEX_RED} />
        </linearGradient>
        {/* Subtle radial background */}
        <radialGradient id="bg-gradient" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#111118" />
          <stop offset="100%" stopColor={TRACK_BG_DARK} />
        </radialGradient>
      </defs>

      {/* Background */}
      <rect width={SVG_W} height={SVG_H} fill="url(#bg-gradient)" rx={16} />

      {/* Reference/comparison lap (behind primary) */}
      {reference && profile === 'compare' && (
        <>
          {renderGlow(
            reference.polyline,
            reference.isSynthetic ? MODEL_GOLD : REF_WHITE
          )}
          <polyline
            points={reference.polyline}
            fill="none"
            stroke={reference.isSynthetic ? MODEL_GOLD : REF_WHITE}
            strokeWidth={reference.isSynthetic ? 3 : 2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={reference.isSynthetic ? 0.85 : 0.45}
            strokeDasharray={reference.isSynthetic ? 'none' : '8 4'}
          />
        </>
      )}

      {/* Synthetic Perfect Lap overlay (when toggled on) */}
      {showSynthetic && syntheticProjection && (
        <>
          {renderGlow(syntheticProjection.polyline, MODEL_GOLD)}
          <polyline
            points={syntheticProjection.polyline}
            fill="none"
            stroke={MODEL_GOLD}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.85}
            strokeDasharray="6 4"
          />
        </>
      )}

      {/* Primary lap */}
      {primary && (
        <>
          {/* Glow layer */}
          {renderGlow(primary.polyline, APEX_ORANGE)}

          {/* Colored segments (speed or braking profile) */}
          {profile !== 'compare'
            ? renderSegments(primary.segments, 3.5)
            : (
              /* Compare mode: solid orange primary line */
              <polyline
                points={primary.polyline}
                fill="none"
                stroke={APEX_ORANGE}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )
          }

          {/* Braking profile overlay in Complete mode */}
          {profile === 'complete' && primary.segments.some(s => s.phase) && (
            <g opacity={0.5}>
              {primary.segments
                .filter(s => s.phase === 'braking')
                .map((seg) => (
                  <line
                    key={`brake-${seg.index}`}
                    x1={seg.x1}
                    y1={seg.y1}
                    x2={seg.x2}
                    y2={seg.y2}
                    stroke="#ef4444"
                    strokeWidth={6}
                    strokeLinecap="round"
                    opacity={0.5}
                  />
                ))}
            </g>
          )}

          {/* Explicit Braking Start Points in Complete mode */}
          {profile === 'complete' && primary.segments.some(s => s.phase) && renderBrakingMarkers(primary.segments, false)}
          {profile === 'complete' && showSynthetic && syntheticProjection && renderBrakingMarkers(syntheticProjection.segments, true)}

          {/* Direction arrows */}
          {renderDirectionArrows(primary.segments)}

          {/* Hovered point indicator */}
          {hoveredIndex !== null && hoveredIndex < primary.points.length && (
            <circle
              cx={primary.points[hoveredIndex].x}
              cy={primary.points[hoveredIndex].y}
              r={6}
              fill={APEX_ORANGE}
              stroke="#ffffff"
              strokeWidth={2}
              className="pointer-events-none"
            >
              <animate
                attributeName="r"
                values="5;7;5"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </circle>
          )}
        </>
      )}

      {/* Corner markers */}
      {renderCorners(corners, hoveredCornerId, onCornerClick, onCornerHover)}

      {/* Start / Finish markers */}
      {primary && primary.points.length > 2 && (
        <>
          <circle
            cx={primary.points[0].x}
            cy={primary.points[0].y}
            r={5}
            fill="#22c55e"
            stroke={TRACK_BG_DARK}
            strokeWidth={2}
            className="pointer-events-none"
          />
          <circle
            cx={primary.points[primary.points.length - 1].x}
            cy={primary.points[primary.points.length - 1].y}
            r={5}
            fill="#ef4444"
            stroke={TRACK_BG_DARK}
            strokeWidth={2}
            className="pointer-events-none"
          />
        </>
      )}
    </svg>
    </TransformComponent>
    </div>
    )}
  </TransformWrapper>
  );
}
