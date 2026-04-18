/**
 * TrackMapPro — Dynamic legend
 */
import type { TrackMapProfile } from '@/types/analysis';
import { APEX_ORANGE, APEX_RED, TRACK_GREEN, TRACK_GRAY, TRACK_YELLOW, MODEL_GOLD } from './trackMapColors';

interface TrackMapLegendProps {
  profile: TrackMapProfile;
  speedMin: number;
  speedMax: number;
  hasModel: boolean;
  comparisonLabel?: string;
  showSynthetic?: boolean;
}

export function TrackMapLegend({
  profile,
  speedMin,
  speedMax,
  hasModel,
  comparisonLabel,
  showSynthetic,
}: TrackMapLegendProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-2 py-1.5 text-[10px] text-muted-foreground">
      {/* Speed legend */}
      {(profile === 'speed' || profile === 'complete') && (
        <div className="flex items-center gap-2">
          <span>{Math.round(speedMin)} km/h</span>
          <div
            className="h-2 w-20 rounded-full"
            style={{
              background: `linear-gradient(to right, ${APEX_RED}, ${TRACK_YELLOW}, ${TRACK_GREEN})`,
            }}
          />
          <span>{Math.round(speedMax)} km/h</span>
        </div>
      )}

      {/* Braking legend */}
      {profile === 'braking' && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: APEX_RED }} />
            <span>Freinage</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: TRACK_GREEN }} />
            <span>Accélération</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: TRACK_GRAY }} />
            <span>Transition</span>
          </div>
        </div>
      )}

      {/* Complete mode legend addon */}
      {profile === 'complete' && (
        <div className="flex items-center gap-3 border-l border-white/10 pl-3">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-1.5 rounded-full" style={{ background: APEX_RED }} />
            <span>Zone de Freinage</span>
          </div>
        </div>
      )}

      {/* Compare legend */}
      {profile === 'compare' && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: APEX_ORANGE }} />
            <span>Votre tour</span>
          </div>
          {hasModel && comparisonLabel ? (
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: MODEL_GOLD }} />
              <span>{comparisonLabel}</span>
            </div>
          ) : comparisonLabel ? (
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm border border-white/30" style={{ background: 'rgba(255,255,255,0.3)' }} />
              <span>{comparisonLabel}</span>
            </div>
          ) : null}
        </div>
      )}

      {/* Persistent AI Lap legend if synthetic overlay is active */}
      {showSynthetic && profile !== 'compare' && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: MODEL_GOLD }} />
            <span className="font-medium text-yellow-400">Tour Parfait IA</span>
          </div>
        </div>
      )}
    </div>
  );
}
