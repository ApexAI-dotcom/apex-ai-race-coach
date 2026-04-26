/**
 * TrackMapPro — Corner detail panel (opened on corner click)
 */
import type { CornerDetail } from '@/types/analysis';
import { gradeColor } from './trackMapColors';

interface TrackMapCornerPanelProps {
  corner: CornerDetail | null;
  onClose: () => void;
}

function Row({ label, value, unit = '', color }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-muted-foreground text-[11px]">{label}</span>
      <span className={`text-[11px] font-medium ${color || 'text-foreground'}`}>
        {value}{unit}
      </span>
    </div>
  );
}

export function TrackMapCornerPanel({ corner, onClose }: TrackMapCornerPanelProps) {
  if (!corner) return null;

  const typeLabel = corner.corner_type === 'left' ? '← Gauche' : corner.corner_type === 'right' ? 'Droite →' : 'Inconnu';
  const timeLostMs = (corner.time_lost * 1000).toFixed(0);
  const gradeCol = gradeColor(corner.grade);

  return (
    <div 
      className="absolute right-2 top-2 z-40 w-52 trackmap-tooltip rounded-xl p-3 animate-in fade-in slide-in-from-right-2 duration-200"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ background: `linear-gradient(135deg, #f97316, #dc2626)` }}
          >
            {corner.label.replace('V', '')}
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">{corner.label}</div>
            <div className="text-[9px] text-muted-foreground">{typeLabel}</div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Grade badge */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-md"
          style={{ background: gradeCol + '22', color: gradeCol }}
        >
          {corner.grade}
        </span>
        <span className="text-[10px] text-muted-foreground">
          Score: {corner.score.toFixed(0)}/100
        </span>
      </div>

      {/* Stats */}
      <div className="border-t border-white/5 pt-1.5 space-y-0">
        {corner.entry_speed > 0 && (
          <Row label="Vitesse entrée" value={corner.entry_speed.toFixed(1)} unit=" km/h" />
        )}
        <Row label="Vitesse apex" value={corner.apex_speed_real.toFixed(1)} unit=" km/h" />
        {corner.apex_speed_optimal > 0 && (
          <Row
            label="Apex optimal"
            value={corner.apex_speed_optimal.toFixed(1)}
            unit=" km/h"
            color="text-yellow-500"
          />
        )}
        {corner.exit_speed > 0 && (
          <Row label="Vitesse sortie" value={corner.exit_speed.toFixed(1)} unit=" km/h" />
        )}
        {corner.lateral_g_max > 0 && (
          <Row label="G latéral max" value={corner.lateral_g_max.toFixed(2)} unit="g" />
        )}
        {corner.time_lost !== 0 && (
          <Row
            label="Temps perdu"
            value={`+${timeLostMs}`}
            unit=" ms"
            color={Number(timeLostMs) > 100 ? 'text-red-400' : 'text-yellow-400'}
          />
        )}
        {corner.margin_kmh !== undefined && (
          <Row
            label="Marge corde"
            value={corner.margin_kmh > 0 ? `+${corner.margin_kmh.toFixed(1)}` : corner.margin_kmh.toFixed(1)}
            unit=" km/h"
            color={corner.margin_kmh > 0 ? 'text-red-400' : 'text-green-400'}
          />
        )}
      </div>
    </div>
  );
}
