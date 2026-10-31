import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { CircuitRecord, PaddockSession } from "./usePaddockData";
import { formatDelta, formatLap, formatShortDay } from "./format";
import { PitCard, Slant, useSeenOnce } from "./motion";

/**
 * Meilleur tour de chaque séance sur un circuit, dans l'ordre chronologique,
 * avec le record en pointillés. L'axe est inversé : monter, c'est aller plus vite.
 */
export function ProgressionChart({ sessions, records }: { sessions: PaddockSession[]; records: CircuitRecord[] }) {
  const choices = records.filter((r) => r.sessions >= 2).slice(0, 4);
  const [key, setKey] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const [ref, seen] = useSeenOnce<HTMLDivElement>();
  const current = choices.find((c) => c.circuitKey === key) ?? choices[0];

  const data = useMemo(() => {
    if (!current) return [];
    return sessions
      .filter((s) => s.circuitKey === current.circuitKey && s.best > 0)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((s) => ({ label: formatShortDay(s.date), best: s.best, id: s.id }));
  }, [sessions, current]);

  if (!current || data.length < 2) return null;
  const first = data[0].best;
  const gained = first - current.best;
  const values = data.map((d) => d.best);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = Math.max(0.15, (hi - lo) * 0.15);

  return (
    <div ref={ref}>
      <PitCard accent="red" glow labelledBy="progression" className="p-5 pt-6 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="progression" className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <TrendingUp aria-hidden="true" className="size-4 text-primary" />
              Ta progression
            </h2>
            <p className="text-sm text-muted-foreground">Meilleur tour à chaque séance sur {current.circuit}</p>
          </div>
          {gained > 0.0005 && <Slant accent="green">{formatDelta(-gained)} depuis le début</Slant>}
        </div>
        {choices.length > 1 && (
          <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]" role="tablist" aria-label="Circuit">
            {choices.map((c) => (
              <button
                key={c.circuitKey}
                role="tab"
                aria-selected={c.circuitKey === current.circuitKey}
                onClick={() => setKey(c.circuitKey)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors",
                  c.circuitKey === current.circuitKey
                    ? "border-primary/50 bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {c.circuit}
              </button>
            ))}
          </div>
        )}
        <div className="mt-4 h-52 md:h-56">
          {(seen || reduce) && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 6, left: -6 }}>
                <defs>
                  <linearGradient id="prog-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="2 4" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--foreground) / 0.6)", fontSize: 11 }} tickMargin={8} minTickGap={16} />
                <YAxis
                  reversed
                  domain={[lo - pad, hi + pad]}
                  tickFormatter={(v: number) => formatLap(v)}
                  tickLine={false}
                  axisLine={false}
                  width={58}
                  tickCount={4}
                  tick={{ fill: "hsl(var(--foreground) / 0.6)", fontSize: 11 }}
                />
                <ReferenceLine y={current.best} stroke="hsl(var(--record))" strokeDasharray="4 4" strokeOpacity={0.9} />
                <Tooltip
                  cursor={{ stroke: "hsl(var(--primary))", strokeOpacity: 0.4 }}
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                  formatter={(v: number) => [formatLap(v), "Meilleur tour"]}
                />
                <Area
                  type="monotone"
                  dataKey="best"
                  baseValue={hi + pad}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fill="url(#prog-fill)"
                  dot={{ r: 3, fill: "hsl(var(--card))", stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: "hsl(var(--primary))", stroke: "hsl(var(--card))", strokeWidth: 2 }}
                  isAnimationActive={!reduce}
                  animationDuration={1100}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Plus haut, c'est plus rapide. En violet : ton record ({formatLap(current.best)}).
        </p>
      </PitCard>
    </div>
  );
}
