import { motion, useReducedMotion } from "framer-motion";
import { formatLap } from "./format";
import { EASE } from "./motion";

interface Props {
  laps: number[];
  /** Hauteur en px de la barre la plus haute. */
  height?: number;
  showLabels?: boolean;
  /** Barres élargies sur toute la largeur (grand format). */
  wide?: boolean;
  className?: string;
  /** Les barres montent l'une après l'autre à l'arrivée à l'écran. */
  animated?: boolean;
}

/**
 * Un trait par tour, dans l'ordre de la séance : plus le tour est rapide,
 * plus le trait est haut. Le meilleur tour est en rouge. Les tours très
 * lents (sortie des stands, drapeau) sont tassés en bas pour ne pas écraser
 * l'échelle des autres.
 */
export function LapLadder({ laps, height = 44, showLabels = false, wide = false, className, animated = false }: Props) {
  const reduce = useReducedMotion();
  if (!laps.length) return null;
  const anim = animated && !reduce;
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
            <motion.div
              key={i}
              title={`Tour ${i + 1} : ${formatLap(t)}`}
              className={`flex-1 ${wide ? "" : "max-w-[14px]"} origin-bottom rounded-[2px] ${
                isBest ? "bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.6)]" : "bg-foreground/25"
              }`}
              style={{ height: `${h * 100}%` }}
              initial={anim ? { scaleY: 0 } : false}
              whileInView={anim ? { scaleY: 1 } : undefined}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 + i * Math.min(0.04, 0.8 / laps.length), ease: EASE }}
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
