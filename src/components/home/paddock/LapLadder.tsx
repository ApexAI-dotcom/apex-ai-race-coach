import { formatLap } from "./format";

interface Props {
  laps: number[];
  /** Hauteur en px de la barre la plus haute. */
  height?: number;
  showLabels?: boolean;
  /** Barres élargies sur toute la largeur (grand format). */
  wide?: boolean;
  className?: string;
}

/**
 * Un trait par tour, dans l'ordre de la séance : plus le tour est rapide,
 * plus le trait est haut. Le meilleur tour est en rouge. Les tours très
 * lents (sortie des stands, drapeau) sont tassés en bas pour ne pas écraser
 * l'échelle des autres.
 */
export function LapLadder({ laps, height = 44, showLabels = false, wide = false, className }: Props) {
  if (!laps.length) return null;
  const best = Math.min(...laps);
  const bestIdx = laps.indexOf(best);
  const sorted = [...laps].sort((a, b) => a - b);
  // Plafond de l'échelle : 85e centile des tours (les tours de sortie et les
  // ralentissements restent tassés en bas), avec au moins 0,3 s d'amplitude.
  const ceiling = Math.max(best + 0.3, sorted[Math.floor(0.85 * (sorted.length - 1))]);
  const range = ceiling - best || 1;
  const min = 0.14;

  return (
    <div className={className}>
      <div
        className={`flex items-end ${wide ? "gap-1" : "gap-[3px]"}`}
        style={{ height }}
        role="img"
        aria-label={`${laps.length} tours, meilleur tour ${formatLap(best)} au tour ${bestIdx + 1}`}
      >
        {laps.map((t, i) => {
          const r = Math.min(1, (t - best) / range);
          const h = Math.max(min, 1 - r * (1 - min));
          const isBest = i === bestIdx;
          return (
            <div
              key={i}
              title={`Tour ${i + 1} : ${formatLap(t)}`}
              className={`flex-1 ${wide ? "" : "max-w-[14px]"} rounded-[2px] ${isBest ? "bg-primary" : "bg-foreground/25"}`}
              style={{ height: `${h * 100}%` }}
            />
          );
        })}
      </div>
      {showLabels && (
        <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground tabular-nums">
          <span>Tour 1</span>
          <span>
            Meilleur au tour {bestIdx + 1}
          </span>
          <span>Tour {laps.length}</span>
        </div>
      )}
    </div>
  );
}
