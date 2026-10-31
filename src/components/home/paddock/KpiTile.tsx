import { useId, useState, type PointerEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ACCENT, CountUp, EASE, PitCard, useSeenOnce, type Accent } from "./motion";

/**
 * Tuile d'indicateur : la valeur (qui défile jusqu'à son chiffre), son
 * évolution et une petite courbe que l'on parcourt au doigt (la valeur du
 * point remplace alors le titre). Courbe en pointillés « trame » et barres
 * qui montent l'une après l'autre, d'après le « Tweenly Chart KPI » de 21st.dev.
 */
interface Props {
  label: string;
  icon?: ReactNode;
  /** Valeur affichée quand il n'y a pas de nombre à animer (ex. « — »). */
  value: string;
  /** Nombre à faire défiler, mis en forme par `format`. */
  num?: number | null;
  format?: (v: number) => string;
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
  accent?: Accent;
  delay?: number;
}

const W = 100;
const H = 36;
const PAD = 3;

export function KpiTile({
  label,
  icon,
  value,
  num,
  format,
  caption,
  delta,
  trend = [],
  trendLabels,
  formatPoint,
  bars,
  lowerIsBetter,
  accent = "red",
  delay = 0,
}: Props) {
  const id = useId();
  const uid = id.replace(/[^a-zA-Z0-9]/g, "");
  const reduce = useReducedMotion();
  const [ref, seen] = useSeenOnce<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const color = ACCENT[accent];

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
  const xOf = (i: number) => PAD + i * step;
  const line = pts.map((v, i) => `${i ? "L" : "M"}${xOf(i).toFixed(2)} ${yOf(v).toFixed(2)}`).join(" ");
  const area = n >= 2 ? `${line} L${xOf(n - 1).toFixed(2)} ${H} L${xOf(0).toFixed(2)} ${H} Z` : "";
  const scrubbing = active != null && pts[active] != null && !!formatPoint;
  const shownCaption = active != null && trendLabels?.[active] ? trendLabels[active] : caption;
  const play = seen || !!reduce;

  const pick = (e: PointerEvent<SVGSVGElement>) => {
    if (n < 2) return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / Math.max(box.width, 1)) * W;
    setActive(Math.min(n - 1, Math.max(0, Math.round((x - PAD) / step))));
  };

  return (
    <div ref={ref} className="min-w-0" onPointerLeave={() => setActive(null)}>
      <PitCard as="article" accent={accent} labelledBy={`${id}-l`} className="flex h-full flex-col gap-2 p-4 pt-5">
        <p id={`${id}-l`} className="flex items-center gap-1.5 truncate text-[13px] text-muted-foreground">
          {icon && (
            <span aria-hidden="true" className="shrink-0 [&>svg]:size-3.5" style={{ color }}>
              {icon}
            </span>
          )}
          {label}
        </p>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-display text-[1.75rem] font-semibold leading-none tracking-tight tabular-nums text-foreground">
            {scrubbing ? (
              formatPoint!(pts[active!])
            ) : num != null && format ? (
              <CountUp value={num} format={format} play={play} delay={delay} />
            ) : (
              value
            )}
          </span>
          {delta && !scrubbing && (
            <motion.span
              initial={reduce ? false : { opacity: 0, scale: 0.6, y: 4 }}
              animate={play ? { opacity: 1, scale: 1, y: 0 } : undefined}
              transition={{ type: "spring", stiffness: 520, damping: 22, delay: delay + 0.6 }}
              className={cn(
                "rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums",
                delta.good == null
                  ? "bg-muted text-muted-foreground"
                  : delta.good
                    ? "bg-[hsl(var(--gain)/0.14)] text-[hsl(var(--gain))]"
                    : "bg-[hsl(var(--loss)/0.14)] text-[hsl(var(--loss))]"
              )}
            >
              {delta.text}
            </motion.span>
          )}
        </div>
        <p className="-mt-1 min-h-4 truncate text-xs text-muted-foreground">{shownCaption}</p>
        <div className="relative mt-auto h-10">
          {n >= 2 ? (
            <svg
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              className="block size-full touch-pan-y overflow-visible"
              onPointerDown={pick}
              onPointerMove={pick}
              aria-hidden="true"
            >
              <defs>
                <pattern id={`${uid}-dots`} width="3" height="3" patternUnits="userSpaceOnUse">
                  <circle cx="1.5" cy="1.5" r="0.6" fill={color} />
                </pattern>
                <clipPath id={`${uid}-clip`}>
                  <motion.rect
                    x={-4}
                    y={-4}
                    height={H + 8}
                    initial={reduce ? false : { width: 0 }}
                    animate={{ width: play ? W + 8 : 0 }}
                    transition={reduce ? { duration: 0 } : { duration: 1, delay, ease: EASE }}
                  />
                </clipPath>
              </defs>
              {bars ? (
                pts.map((v, i) => {
                  const h = max ? Math.max(v ? 2 : 0.8, (v / max) * (H - PAD)) : 0.8;
                  const bw = Math.max(1.5, step * 0.62);
                  const last = i === n - 1;
                  const on = active == null ? last : active === i;
                  return (
                    <motion.rect
                      key={i}
                      x={xOf(i) - bw / 2}
                      width={bw}
                      rx={0.8}
                      fill={on ? color : `color-mix(in oklab, ${color} 38%, hsl(var(--secondary)))`}
                      initial={reduce ? false : { y: H, height: 0 }}
                      animate={play ? { y: H - h, height: h } : { y: H, height: 0 }}
                      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 240, damping: 26, delay: delay + (i / n) * 0.5 }}
                    />
                  );
                })
              ) : (
                <>
                  <g clipPath={`url(#${uid}-clip)`}>
                    <path d={area} fill={`url(#${uid}-dots)`} opacity={0.55} />
                    <path d={area} fill={color} opacity={0.08} />
                    <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  </g>
                  {active != null && (
                    <line x1={xOf(active)} x2={xOf(active)} y1={0} y2={H} stroke="currentColor" className="text-muted-foreground" strokeOpacity={0.5} strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
                  )}
                </>
              )}
            </svg>
          ) : (
            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-border" />
          )}
          {/* Le point final, en HTML pour rester rond malgré l'étirement du dessin. */}
          {!bars && n >= 2 && (
            <motion.span
              aria-hidden="true"
              className="absolute size-2 rounded-full ring-2 ring-card"
              style={{
                background: color,
                x: "-50%",
                y: "-50%",
                left: `${(xOf(active ?? n - 1) / W) * 100}%`,
                top: `${(yOf(pts[active ?? n - 1]) / H) * 100}%`,
              }}
              initial={reduce ? false : { scale: 0 }}
              animate={{ scale: play ? 1 : 0 }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 20, delay: active == null ? delay + 0.9 : 0 }}
            />
          )}
        </div>
      </PitCard>
    </div>
  );
}
