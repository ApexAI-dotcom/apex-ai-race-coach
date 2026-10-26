import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import type { CircuitRecord, PaddockSession } from "./usePaddockData";
import { formatDelta, formatLap, formatShortDay } from "./format";

/**
 * Meilleur tour de chaque séance sur un circuit, dans l'ordre chronologique,
 * avec le record en pointillés. L'axe est inversé : monter, c'est aller plus vite.
 */
export function ProgressionChart({ sessions, records }: { sessions: PaddockSession[]; records: CircuitRecord[] }) {
  const choices = records.filter((r) => r.sessions >= 2).slice(0, 4);
  const [key, setKey] = useState<string | null>(null);
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
    <section aria-labelledby="progression" className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="progression" className="font-display text-lg font-semibold text-foreground">
            Ta progression
          </h2>
          <p className="text-sm text-muted-foreground">
            Meilleur tour à chaque séance sur {current.circuit}
            {gained > 0.0005 ? `, ${formatDelta(-gained)} depuis ta première séance` : ""}
          </p>
        </div>
        {choices.length > 1 && (
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Circuit">
            {choices.map((c) => (
              <button
                key={c.circuitKey}
                role="tab"
                aria-selected={c.circuitKey === current.circuitKey}
                onClick={() => setKey(c.circuitKey)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  c.circuitKey === current.circuitKey
                    ? "border-foreground/30 bg-secondary text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {c.circuit}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} minTickGap={16} />
            <YAxis
              reversed
              domain={[lo - pad, hi + pad]}
              tickFormatter={(v: number) => formatLap(v)}
              tickLine={false}
              axisLine={false}
              width={58}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            <ReferenceLine y={current.best} stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeOpacity={0.7} />
            <Tooltip
              cursor={{ stroke: "hsl(var(--border))" }}
              contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              formatter={(v: number) => [formatLap(v), "Meilleur tour"]}
            />
            <Line
              type="linear"
              dataKey="best"
              stroke="hsl(var(--foreground))"
              strokeWidth={2}
              dot={{ r: 3, fill: "hsl(var(--card))", stroke: "hsl(var(--foreground))", strokeWidth: 1.5 }}
              activeDot={{ r: 4.5, fill: "hsl(var(--primary))", stroke: "hsl(var(--primary))" }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Plus haut, c'est plus rapide. Pointillés rouges : ton record ({formatLap(current.best)}).</p>
    </section>
  );
}
