import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AnalysisResult } from "@/lib/api";
import {
  at,
  bestLap,
  compareLaps,
  cornerRefs,
  explainCorner,
  lapChoices,
  lapTrace,
  summarize,
  type CornerComparison,
  type LapComparison,
} from "@/lib/compare";
import { cn } from "@/lib/utils";

export const COLOR_A = "hsl(var(--primary))";
export const COLOR_B = "hsl(199 89% 60%)";

function lapLabel(t: number) {
  const m = Math.floor(t / 60);
  const s = (t - m * 60).toFixed(3).replace(".", ",");
  return m ? `${m}:${t - m * 60 < 10 ? "0" : ""}${s}` : s;
}
const sec = (x: number) => `${Math.abs(x).toFixed(2).replace(".", ",")} s`;

function LapSelect({ result, value, onChange, color, name }: { result: AnalysisResult; value: number; onChange: (n: number) => void; color: string; name: string }) {
  const choices = lapChoices(result);
  const best = bestLap(result);
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        {name}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-10 rounded-md border border-border bg-background px-2 text-sm tabular-nums"
      >
        {choices.map((c) => (
          <option key={c.lap} value={c.lap}>
            Tour {c.lap} : {lapLabel(c.time)}
            {c.lap === best ? " (meilleur)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Les deux tracés superposés ; chaque virage porte l'écart qui s'y joue. */
function TrackOverlay({ cmp }: { cmp: LapComparison }) {
  const { a, b, corners } = cmp;
  const geo = useMemo(() => {
    const all = [...a.lat.map((la, i) => [la, a.lon[i]]), ...b.lat.map((la, i) => [la, b.lon[i]])];
    const lat0 = all.reduce((s, p) => s + p[0], 0) / all.length;
    const k = Math.cos((lat0 * Math.PI) / 180);
    const xs = all.map((p) => p[1] * k);
    const ys = all.map((p) => -p[0]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const span = Math.max(maxX - minX, maxY - minY) || 1;
    const W = 100, pad = 6, inner = W - pad * 2;
    const offX = pad + (inner - ((maxX - minX) / span) * inner) / 2;
    const offY = pad + (inner - ((maxY - minY) / span) * inner) / 2;
    const proj = (la: number, lo: number) => [offX + ((lo * k - minX) / span) * inner, offY + ((-la - minY) / span) * inner];
    const path = (lat: number[], lon: number[]) => "M" + lat.map((la, i) => proj(la, lon[i]).map((v) => v.toFixed(2)).join(",")).join("L");
    return { pa: path(a.lat, a.lon), pb: path(b.lat, b.lon), proj };
  }, [a, b]);

  return (
    <svg viewBox="0 0 100 100" className="h-auto w-full" role="img" aria-label="Tracés superposés des deux tours">
      <path d={geo.pb} fill="none" stroke={COLOR_B} strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity={0.9} />
      <path d={geo.pa} fill="none" stroke={COLOR_A} strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity={0.9} />
      {corners.map((c) => {
        const [x, y] = geo.proj(a.lat[c.apexIndex], a.lon[c.apexIndex]);
        const strong = Math.abs(c.gain) >= 0.03;
        return (
          <g key={c.number}>
            <circle cx={x} cy={y} r={2.6} fill="hsl(var(--card))" stroke={strong ? (c.gain > 0 ? COLOR_A : COLOR_B) : "hsl(var(--muted-foreground))"} strokeWidth={0.6} />
            <text x={x} y={y + 0.9} textAnchor="middle" fontSize={2.6} fill="hsl(var(--foreground))" fontWeight={600}>
              {c.number}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function CornerTable({ corners, names }: { corners: CornerComparison[]; names: [string, string] }) {
  const pair = (x: [number | null, number | null], unit: string) =>
    x[0] == null && x[1] == null ? "—" : `${x[0] ?? "—"} / ${x[1] ?? "—"} ${unit}`;
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="px-5 pb-2 font-normal">Virage</th>
            <th className="pb-2 font-normal">Écart</th>
            <th className="pb-2 font-normal">Freinage avant la corde</th>
            <th className="pb-2 font-normal">Vitesse mini</th>
            <th className="pb-2 font-normal">Gaz après la corde</th>
            <th className="px-5 pb-2 font-normal">Vitesse en sortie</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border tabular-nums">
          {corners.map((c) => (
            <tr key={c.number}>
              <td className="px-5 py-2 font-medium text-foreground">V{c.number}</td>
              <td className="py-2">
                {Math.abs(c.gain) < 0.01 ? (
                  <span className="text-muted-foreground">égalité</span>
                ) : (
                  <span style={{ color: c.gain > 0 ? COLOR_A : COLOR_B }}>
                    {c.gain > 0 ? names[0] : names[1]} +{sec(c.gain)}
                  </span>
                )}
              </td>
              <td className="py-2 text-muted-foreground">{pair(c.brakeDistance, "m")}</td>
              <td className="py-2 text-muted-foreground">{pair(c.minSpeed, "km/h")}</td>
              <td className="py-2 text-muted-foreground">{pair(c.throttleDistance, "m")}</td>
              <td className="px-5 py-2 text-muted-foreground">{pair(c.exitSpeed, "km/h")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 px-5 text-xs text-muted-foreground">
        Chaque case : {names[0]} / {names[1]}. Freinage : distance entre le début du freinage et le point le plus lent du virage.
      </p>
    </div>
  );
}

export function CompareResults({ ra, rb, names }: { ra: AnalysisResult; rb: AnalysisResult; names: [string, string] }) {
  const sameFile = ra === rb;
  const choicesA = lapChoices(ra);
  // Même fichier : le meilleur tour face à un tour typique (le tour médian),
  // pas face à un tour quasi identique.
  const bestA = bestLap(ra);
  const bestTime = choicesA.find((c) => c.lap === bestA)?.time ?? 0;
  const others = choicesA.filter((c) => c.lap !== bestA && c.time - bestTime >= 0.1).sort((x, y) => x.time - y.time);
  const defaultB = sameFile ? (others[Math.floor(others.length / 2)]?.lap ?? choicesA.find((c) => c.lap !== bestA)?.lap ?? bestA) : bestLap(rb);
  const [lapA, setLapA] = useState<number | null>(bestLap(ra));
  const [lapB, setLapB] = useState<number | null>(defaultB);

  const cmp = useMemo(() => {
    if (lapA == null || lapB == null) return null;
    const a = lapTrace(ra, lapA);
    const b = lapTrace(rb, lapB);
    if (!a || !b) return null;
    return compareLaps(a, b, cornerRefs(ra));
  }, [ra, rb, lapA, lapB]);

  const chart = useMemo(() => {
    if (!cmp) return [];
    return cmp.a.d.map((d, i) => ({
      d: Math.round(d),
      vA: Math.round(cmp.a.v[i]),
      vB: Math.round(at(cmp.b.v, cmp.pos[i])),
      delta: Math.round(cmp.delta[i] * 1000) / 1000,
    }));
  }, [cmp]);

  if (!cmp) {
    return (
      <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        Ces analyses ne contiennent pas le tracé GPS des tours : la comparaison n'est possible que sur des séances analysées depuis octobre 2026. Relance l'analyse des fichiers pour comparer.
      </p>
    );
  }

  const gap = cmp.b.time - cmp.a.time;
  const cornerTicks = cmp.corners.map((c) => c.apexDistance);
  const cornerLabel = (d: number) => {
    const c = cmp.corners.find((x) => x.apexDistance === d);
    return c ? `V${c.number}` : "";
  };
  const keyCorners = [...cmp.corners].filter((c) => Math.abs(c.gain) >= 0.03).sort((x, y) => Math.abs(y.gain) - Math.abs(x.gain)).slice(0, 5);
  const tooltipStyle = { background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 };
  const axisTick = { fill: "hsl(var(--muted-foreground))", fontSize: 11 };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          {lapA != null && <LapSelect result={ra} value={lapA} onChange={setLapA} color={COLOR_A} name={names[0]} />}
          <div className="text-center">
            <div className="font-display text-3xl font-semibold tabular-nums text-foreground">{sec(gap)}</div>
            <div className="text-xs text-muted-foreground">d'écart sur le tour</div>
          </div>
          {lapB != null && <LapSelect result={rb} value={lapB} onChange={setLapB} color={COLOR_B} name={names[1]} />}
        </div>
        <p className="mt-4 text-foreground">{summarize(cmp, names)}</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="space-y-5 rounded-2xl border border-border bg-card p-5">
          <div>
            <h3 className="font-display text-base font-semibold text-foreground">Écart cumulé</h3>
            <p className="text-xs text-muted-foreground">Au-dessus de zéro, {names[0]} est devant. La pente montre où le temps se gagne.</p>
            <div className="mt-2 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart} syncId="cmp" margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="d" type="number" domain={["dataMin", "dataMax"]} ticks={cornerTicks} tickFormatter={cornerLabel} interval={0} tick={axisTick} tickLine={false} axisLine={false} />
                  <YAxis tick={axisTick} tickLine={false} axisLine={false} tickFormatter={(v: number) => v.toFixed(1).replace(".", ",")} width={44} />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                  {cmp.corners.map((c) => (
                    <ReferenceLine key={c.number} x={c.apexDistance} stroke="hsl(var(--border))" />
                  ))}
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={(d: number) => `${d} m`} formatter={(v: number) => [`${v > 0 ? names[0] : names[1]} devant de ${sec(v)}`, ""]} />
                  <Line dataKey="delta" stroke="hsl(var(--foreground))" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-foreground">Vitesse</h3>
            <div className="mt-2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart} syncId="cmp" margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="d" type="number" domain={["dataMin", "dataMax"]} ticks={cornerTicks} tickFormatter={cornerLabel} interval={0} tick={axisTick} tickLine={false} axisLine={false} />
                  <YAxis tick={axisTick} tickLine={false} axisLine={false} width={44} domain={["dataMin - 5", "dataMax + 5"]} />
                  {cmp.corners.map((c) => (
                    <ReferenceLine key={c.number} x={c.apexDistance} stroke="hsl(var(--border))" />
                  ))}
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(d: number) => `${d} m`}
                    formatter={(v: number, key: string) => [`${v} km/h`, key === "vA" ? names[0] : names[1]]}
                  />
                  <Line dataKey="vA" stroke={COLOR_A} strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line dataKey="vB" stroke={COLOR_B} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-base font-semibold text-foreground">Les deux trajectoires</h3>
          <p className="text-xs text-muted-foreground">Numéro cerclé de la couleur du pilote qui gagne du temps dans le virage.</p>
          <div className="mx-auto mt-3 max-w-[420px]">
            <TrackOverlay cmp={cmp} />
          </div>
          <div className="mt-3 flex justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: COLOR_A }} />{names[0]}</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: COLOR_B }} />{names[1]}</span>
          </div>
        </section>
      </div>

      {keyCorners.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-lg font-semibold text-foreground">Où se fait la différence</h3>
          <ul className="mt-3 space-y-4">
            {keyCorners.map((c) => {
              const reasons = explainCorner(c, names);
              const who = c.gain > 0 ? names[0] : names[1];
              return (
                <li key={c.number} className="grid gap-1 sm:grid-cols-[140px_minmax(0,1fr)]">
                  <div>
                    <div className="font-medium text-foreground">Virage {c.number}</div>
                    <div className={cn("text-sm tabular-nums")} style={{ color: c.gain > 0 ? COLOR_A : COLOR_B }}>
                      {who} +{sec(c.gain)}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {reasons.length ? reasons.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(". ") + "." : "L'écart vient de la vitesse sur tout le virage, sans point net à isoler."}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 font-display text-lg font-semibold text-foreground">Virage par virage</h3>
        <CornerTable corners={cmp.corners} names={names} />
      </section>
    </div>
  );
}
