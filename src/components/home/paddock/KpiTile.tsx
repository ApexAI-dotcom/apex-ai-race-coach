import { useId, useState, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * Tuile d'indicateur : la valeur, son évolution et une petite courbe que l'on
 * peut parcourir au doigt ou à la souris (la valeur du point remplace alors
 * le titre). Inspirée du « KPI Tile » de 21st.dev, en version sans animation.
 */
interface Props {
  label: string;
  value: string;
  caption?: string;
  /** Écart signé déjà mis en forme, et s'il est bon ou mauvais. */
  delta?: { text: string; good: boolean | null };
  trend?: number[];
  trendLabels?: string[];
  formatPoint?: (v: number) => string;
  /** Barres plutôt que courbe (volumes par semaine). */
  bars?: boolean;
  /** Pour une valeur où plus bas est mieux : la courbe est retournée (mieux = plus haut). */
  lowerIsBetter?: boolean;
}

const W = 100;
const H = 36;
const PAD = 3;

export function KpiTile({ label, value, caption, delta, trend = [], trendLabels, formatPoint, bars, lowerIsBetter }: Props) {
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  const pts = trend.filter((v) => Number.isFinite(v));
  const n = pts.length;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const step = (W - PAD * 2) / Math.max(n - 1, 1);
  const yOf = (v: number) => {
    const r = (v - min) / span;
    return H - PAD - (lowerIsBetter ? 1 - r : r) * (H - PAD * 2);
  };
  const line = pts.map((v, i) => `${i ? "L" : "M"}${(PAD + i * step).toFixed(2)} ${yOf(v).toFixed(2)}`).join(" ");
  const shown = active != null && pts[active] != null && formatPoint ? formatPoint(pts[active]) : value;
  const shownCaption = active != null && trendLabels?.[active] ? trendLabels[active] : caption;

  const pick = (e: PointerEvent<SVGSVGElement>) => {
    if (n < 2) return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / Math.max(box.width, 1)) * W;
    setActive(Math.min(n - 1, Math.max(0, Math.round((x - PAD) / step))));
  };

  return (
    <article
      aria-labelledby={`${id}-l`}
      className="flex min-w-0 flex-col gap-2 rounded-xl border border-border bg-card p-4"
      onPointerLeave={() => setActive(null)}
    >
      <p id={`${id}-l`} className="truncate text-sm text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-display text-2xl font-semibold leading-none tracking-tight tabular-nums text-foreground sm:text-[1.7rem]">
          {shown}
        </span>
        {delta && active == null && (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums",
              delta.good == null
                ? "bg-muted text-muted-foreground"
                : delta.good
                  ? "bg-[hsl(var(--gain)/0.12)] text-[hsl(var(--gain))]"
                  : "bg-[hsl(var(--loss)/0.12)] text-[hsl(var(--loss))]"
            )}
          >
            {delta.text}
          </span>
        )}
      </div>
      <p className="-mt-1 min-h-4 truncate text-xs text-muted-foreground">{shownCaption}</p>
      <div className="relative h-9 text-foreground/70">
        {n >= 2 ? (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="block size-full touch-pan-y overflow-visible"
            onPointerDown={pick}
            onPointerMove={pick}
            aria-hidden="true"
          >
            {bars ? (
              pts.map((v, i) => {
                const h = max ? (v / max) * (H - PAD) : 0;
                const bw = Math.max(1.5, step * 0.62);
                return (
                  <rect
                    key={i}
                    x={PAD + i * step - bw / 2}
                    y={H - h}
                    width={bw}
                    height={h}
                    rx={0.8}
                    className={cn(
                      i === n - 1 ? "fill-primary" : "fill-current opacity-40",
                      active === i && "opacity-100"
                    )}
                  />
                );
              })
            ) : (
              <>
                <path d={line} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                <circle cx={PAD + (n - 1) * step} cy={yOf(pts[n - 1])} r={2.2} className="fill-primary" vectorEffect="non-scaling-stroke" />
                {active != null && (
                  <line x1={PAD + active * step} x2={PAD + active * step} y1={0} y2={H} stroke="currentColor" strokeOpacity={0.35} vectorEffect="non-scaling-stroke" />
                )}
              </>
            )}
          </svg>
        ) : (
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-border" />
        )}
      </div>
    </article>
  );
}
