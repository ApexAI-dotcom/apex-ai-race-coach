/**
 * TrackMapPro — Floating tooltip on track hover
 */

interface TrackMapTooltipProps {
  visible: boolean;
  x: number;
  y: number;
  speed?: number;
  throttle?: number;
  brake?: number;
  rpm?: number;
  lateralG?: number;
  cornerLabel?: string;
  isSynthetic?: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function TrackMapTooltip({
  visible,
  x,
  y,
  speed,
  throttle,
  brake,
  rpm,
  lateralG,
  cornerLabel,
  isSynthetic,
  containerRef,
}: TrackMapTooltipProps) {
  if (!visible) return null;

  // Offset to avoid overflow
  const container = containerRef.current;
  const maxX = container ? container.clientWidth - 180 : 800;
  const maxY = container ? container.clientHeight - 100 : 600;
  const finalX = Math.min(x + 12, maxX);
  const finalY = Math.max(y - 60, 8);

  return (
    <div
      className="trackmap-tooltip absolute z-50 rounded-lg px-3 py-2 pointer-events-none animate-in fade-in duration-100"
      style={{
        left: finalX,
        top: Math.min(finalY, maxY),
        minWidth: 140,
      }}
    >
      {isSynthetic && (
        <div className="text-[9px] uppercase tracking-wider text-yellow-500 font-bold mb-1">
          Modèle ApexAI
        </div>
      )}
      {cornerLabel && (
        <div className="text-[10px] text-primary font-semibold mb-0.5">{cornerLabel}</div>
      )}
      <div className="space-y-0.5 text-[11px]">
        {speed !== undefined && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{isSynthetic ? 'Vitesse cible' : 'Vitesse'}</span>
            <span className="font-medium text-foreground">{speed.toFixed(1)} km/h</span>
          </div>
        )}
        {throttle !== undefined && throttle > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Accélérateur</span>
            <span className="font-medium text-green-400">{Math.round(throttle)}%</span>
          </div>
        )}
        {brake !== undefined && brake > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Frein</span>
            <span className="font-medium text-red-400">{Math.round(brake)}%</span>
          </div>
        )}
        {rpm !== undefined && rpm > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">RPM</span>
            <span className="font-medium text-foreground">{Math.round(rpm)}</span>
          </div>
        )}
        {lateralG !== undefined && lateralG > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">G latéral</span>
            <span className="font-medium text-foreground">{lateralG.toFixed(2)}g</span>
          </div>
        )}
      </div>
    </div>
  );
}
