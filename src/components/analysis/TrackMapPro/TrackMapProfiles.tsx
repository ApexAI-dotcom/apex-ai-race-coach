/**
 * TrackMapPro — Profile selector bar
 */
import type { TrackMapProfile, TrajectoryLap } from "@/types/analysis";
import { Activity, Gauge, Map, GitCompare, Timer } from "lucide-react";
import React from "react";

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
  /** Les mini-secteurs exigent plusieurs tours exploitables. */
  sectorsAvailable?: boolean;
}

// Chaque vue répond à UNE question précise du pilote (l'info-bulle le dit).
const PROFILES: {
  id: TrackMapProfile; label: string; icon: React.ElementType; hint: string;
}[] = [
  { id: "complete", label: "Complet", icon: Map, hint: "Vue d'ensemble : vitesse le long du tour + zones de freinage." },
  { id: "speed", label: "Vitesse", icon: Gauge, hint: "Où tu es rapide, où tu es lent : la piste colorée par ta vitesse." },
  { id: "braking", label: "Freinage", icon: Activity, hint: "Les phases de freinage, d'accélération et de transition." },
  { id: "sectors", label: "Mini-secteurs", icon: Timer, hint: "Où le temps se perd réellement : chaque portion colorée par les secondes perdues (mesurées)." },
  { id: "compare", label: "Comparaison", icon: GitCompare, hint: "Superpose ton tour avec un autre tour ou le Tour Parfait IA." },
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
  sectorsAvailable = true,
}: TrackMapProfilesProps) {
  const realLaps = laps.filter((l) => !l.is_synthetic);
  // On masque une vue qui n'aurait rien à montrer plutôt que d'afficher une
  // carte vide : le pilote ne doit jamais tomber sur un écran mort.
  const visibleProfiles = PROFILES.filter((p) => p.id !== "sectors" || sectorsAvailable);

  return (
    <div className="space-y-2">
      {/* Profile pills */}
      <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
        {visibleProfiles.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              onClick={() => onChange(p.id)}
              title={p.hint}
              aria-label={`${p.label} — ${p.hint}`}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                active === p.id
                  ? "trackmap-profile-active text-white shadow-lg"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* À quoi sert la vue active : chaque onglet répond à une question. */}
      <p className="px-1 text-[11px] leading-snug text-muted-foreground">
        {PROFILES.find((p) => p.id === active)?.hint}
      </p>

      {/* Comparison mode: lap selectors */}
      {active === "compare" && (
        <div className="flex flex-wrap items-center gap-2 px-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Tour
            </span>
            <select
              value={selectedLapNumber}
              onChange={(e) => onSelectedLapChange(Number(e.target.value))}
              className="bg-secondary/80 border border-white/10 rounded-md px-2 py-1 text-xs text-foreground focus:border-primary/50 focus:outline-none"
            >
              {realLaps.map((l) => (
                <option key={l.lap_number} value={l.lap_number ?? 1}>
                  T{l.lap_number}
                  {l.lap_number === bestLapNumber ? " ★" : ""}
                </option>
              ))}
            </select>
          </div>

          <span className="text-muted-foreground text-xs">vs</span>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Réf.
            </span>
            <select
              value={comparisonLapNumber ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                onComparisonLapChange(val === "" ? null : Number(val));
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
                    T{l.lap_number}
                    {l.lap_number === bestLapNumber ? " ★ Meilleur" : ""}
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
