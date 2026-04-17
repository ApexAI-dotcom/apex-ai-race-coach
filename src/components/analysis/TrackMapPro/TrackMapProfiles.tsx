/**
 * TrackMapPro — Profile selector bar
 */
import type { TrackMapProfile, TrajectoryLap } from '@/types/analysis';
import { Activity, Gauge, Map, GitCompare } from 'lucide-react';
import React from 'react';

interface TrackMapProfilesProps {
  active: TrackMapProfile;
  onChange: (profile: TrackMapProfile) => void;
  /** Available laps for the comparison dropdown */
  laps: TrajectoryLap[];
  syntheticAvailable: boolean;
  selectedLapNumber: number;
  comparisonLapNumber: number | null;
  onSelectedLapChange: (lap: number) => void;
  onComparisonLapChange: (lap: number | null) => void;
  bestLapNumber: number;
}

const PROFILES: { id: TrackMapProfile; label: string; icon: React.ElementType }[] = [
  { id: 'complete', label: 'Complet', icon: Map },
  { id: 'speed', label: 'Vitesse', icon: Gauge },
  { id: 'braking', label: 'Freinage', icon: Activity },
  { id: 'compare', label: 'Comparaison', icon: GitCompare },
];

export function TrackMapProfiles({

  active,
  onChange,
  laps,
  syntheticAvailable,
  selectedLapNumber,
  comparisonLapNumber,
  onSelectedLapChange,
  onComparisonLapChange,
  bestLapNumber,
}: TrackMapProfilesProps) {
  const realLaps = laps.filter((l) => !l.is_synthetic);

  return (
    <div className="space-y-2">
      {/* Profile pills */}
      <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
        {PROFILES.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              onClick={() => onChange(p.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                active === p.id
                  ? 'trackmap-profile-active text-white shadow-lg'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Comparison mode: lap selectors */}
      {active === 'compare' && (
        <div className="flex flex-wrap items-center gap-2 px-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Tour</span>
            <select
              value={selectedLapNumber}
              onChange={(e) => onSelectedLapChange(Number(e.target.value))}
              className="bg-secondary/80 border border-white/10 rounded-md px-2 py-1 text-xs text-foreground focus:border-primary/50 focus:outline-none"
            >
              {realLaps.map((l) => (
                <option key={l.lap_number} value={l.lap_number ?? 1}>
                  T{l.lap_number}{l.lap_number === bestLapNumber ? ' ★' : ''}
                </option>
              ))}
            </select>
          </div>

          <span className="text-muted-foreground text-xs">vs</span>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Réf.</span>
            <select
              value={comparisonLapNumber ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                onComparisonLapChange(val === '' ? null : Number(val));
              }}
              className="bg-secondary/80 border border-white/10 rounded-md px-2 py-1 text-xs text-foreground focus:border-primary/50 focus:outline-none"
            >
              <option value="">— Aucun —</option>
              {syntheticAvailable && (
                <option value={-1} className="text-yellow-500">
                  🎯 Trajectoire cible (modèle ApexAI)
                </option>
              )}
              {realLaps
                .filter((l) => l.lap_number !== selectedLapNumber)
                .map((l) => (
                  <option key={l.lap_number} value={l.lap_number ?? 1}>
                    T{l.lap_number}{l.lap_number === bestLapNumber ? ' ★ Meilleur' : ''}
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
