import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

/** Rapports par tour calculés par l'API (plot_data.lap_report). */
export interface LapReport {
  available: boolean;
  best_lap: number;
  laps: Array<{
    lap: number;
    time_s: number;
    gap_s: number;
    is_best: boolean;
    speed_max?: number | null;
    speed_min?: number | null;
    rpm_max?: number | null;
    rpm_min?: number | null;
    water_max?: number | null;
    exhaust_max?: number | null;
    lat_g_max?: number | null;
    brake_g_max?: number | null;
    battery_min?: number | null;
  }>;
  columns: Record<string, boolean>;
  sectors?: {
    n: number;
    length_m: number;
    laps: Array<{ lap: number; times: number[]; total_s: number }>;
    best: number[];
    theoretical_s: number;
    rolling_best_s?: number | null;
    best_lap_s: number;
  } | null;
  gg?: {
    lap: number;
    lat: number[];
    lon: number[];
    speed?: number[] | null;
    lon_source: string;
    lat_max?: number | null;
    brake_max?: number | null;
    accel_max?: number | null;
  } | null;
  rpm_hist?: {
    step: number;
    bins: Array<{ from: number; to: number; seconds: number; share: number }>;
    p50: number;
    p95: number;
  } | null;
}

type Tab = "laps" | "sectors" | "gg" | "rpm";

const fr = (v: number | null | undefined, d = 0) =>
  v == null ? "—" : v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
const lapTime = (s: number) => {
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return m > 0 ? `${m}:${r.toFixed(3).padStart(6, "0").replace(".", ",")}` : r.toFixed(3).replace(".", ",");
};
const tooltipStyle = { background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 };
const axisTick = { fill: "hsl(var(--muted-foreground))", fontSize: 11 };

const COLS: Array<{ key: keyof LapReport["laps"][number]; label: string; unit: string; d: number }> = [
  { key: "speed_max", label: "V max", unit: "km/h", d: 1 },
  { key: "speed_min", label: "V mini", unit: "km/h", d: 1 },
  { key: "rpm_max", label: "Régime max", unit: "tr/min", d: 0 },
  { key: "rpm_min", label: "Régime mini", unit: "tr/min", d: 0 },
  { key: "water_max", label: "Eau max", unit: "°C", d: 1 },
  { key: "exhaust_max", label: "Échap. max", unit: "°C", d: 0 },
  { key: "lat_g_max", label: "g latéral max", unit: "g", d: 2 },
  { key: "brake_g_max", label: "Freinage max", unit: "g", d: 2 },
  { key: "battery_min", label: "Batterie mini", unit: "V", d: 2 },
];

/**
 * Ce que Race Studio montre et qu'on retrouve ici, sur les canaux du fichier :
 * tableau par tour, secteurs (tour théorique, meilleur tour glissant),
 * diagramme G-G et temps passé par plage de régime.
 */
export function LapReportPanel({ report }: { report: LapReport }) {
  const tabs = [
    { id: "laps" as Tab, label: "Tours", show: report.laps.length > 0 },
    { id: "sectors" as Tab, label: "Secteurs", show: !!report.sectors },
    { id: "gg" as Tab, label: "Diagramme G-G", show: !!report.gg },
    { id: "rpm" as Tab, label: "Régime", show: !!report.rpm_hist },
  ].filter((t) => t.show);
  const [tab, setTab] = useState<Tab>(tabs[0]?.id ?? "laps");
  if (!tabs.length) return null;

  return (
    <div>
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-muted/40 p-1 [scrollbar-width:none]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "laps" && <LapsTable report={report} />}
      {tab === "sectors" && report.sectors && <SectorsTable sectors={report.sectors} />}
      {tab === "gg" && report.gg && <GGDiagram gg={report.gg} />}
      {tab === "rpm" && report.rpm_hist && <RpmHistogram hist={report.rpm_hist} />}
    </div>
  );
}

function LapsTable({ report }: { report: LapReport }) {
  const cols = COLS.filter((c) => report.columns?.[c.key as string]);
  const extremes = useMemo(() => {
    const out: Record<string, number> = {};
    cols.forEach((c) => {
      const vals = report.laps.map((l) => l[c.key] as number | null).filter((v): v is number => v != null);
      if (vals.length) out[c.key as string] = Math.max(...vals);
    });
    return out;
  }, [report.laps, cols]);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[560px] text-sm tabular-nums">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-medium">Tour</th>
            <th className="px-3 py-2 font-medium">Temps</th>
            <th className="px-3 py-2 font-medium">Écart</th>
            {cols.map((c) => (
              <th key={c.key as string} className="px-3 py-2 text-right font-medium">
                {c.label}
                <span className="block text-[10px] font-normal opacity-70">{c.unit}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.laps.map((l) => (
            <tr key={l.lap} className={`border-b border-border last:border-0 ${l.is_best ? "bg-primary/5" : ""}`}>
              <td className="px-3 py-2">
                {l.lap}
                {l.is_best && <span className="ml-1.5 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Meilleur</span>}
              </td>
              <td className={`px-3 py-2 ${l.is_best ? "font-semibold" : ""}`}>{lapTime(l.time_s)}</td>
              <td className="px-3 py-2 text-muted-foreground">{l.is_best ? "—" : `+${fr(l.gap_s, 3)}`}</td>
              {cols.map((c) => {
                const v = l[c.key] as number | null | undefined;
                const top = v != null && extremes[c.key as string] === v;
                return (
                  <td key={c.key as string} className={`px-3 py-2 text-right ${top ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {fr(v, c.d)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
        En gras : le pic de la séance pour chaque colonne. Seuls les canaux présents dans le fichier sont affichés.
      </p>
    </div>
  );
}

function SectorsTable({ sectors }: { sectors: NonNullable<LapReport["sectors"]> }) {
  const gain = sectors.best_lap_s - sectors.theoretical_s;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Meilleur tour" value={lapTime(sectors.best_lap_s)} />
        <Stat label="Tour théorique" value={lapTime(sectors.theoretical_s)} hint={`meilleurs secteurs réunis, ${fr(gain, 3)} s de mieux`} />
        {sectors.rolling_best_s != null && (
          <Stat label="Meilleur tour glissant" value={lapTime(sectors.rolling_best_s)} hint="le tour le plus rapide en partant de n'importe quel point" />
        )}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[420px] text-sm tabular-nums">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">Tour</th>
              {sectors.best.map((_, i) => (
                <th key={i} className="px-3 py-2 text-right font-medium">Secteur {i + 1}</th>
              ))}
              <th className="px-3 py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {sectors.laps.map((l) => (
              <tr key={l.lap} className="border-b border-border last:border-0">
                <td className="px-3 py-2">{l.lap}</td>
                {l.times.map((t, i) => {
                  const isBest = t === sectors.best[i];
                  const d = t - sectors.best[i];
                  return (
                    <td key={i} className="px-3 py-2 text-right">
                      <span className={isBest ? "rounded bg-[hsl(var(--gain)/0.15)] px-1.5 py-0.5 font-semibold text-[hsl(var(--gain))]" : ""}>{fr(t, 3)}</span>
                      {!isBest && <span className="ml-1.5 text-[11px] text-muted-foreground">+{fr(d, 2)}</span>}
                    </td>
                  );
                })}
                <td className={`px-3 py-2 text-right ${l.total_s === sectors.best_lap_s ? "font-semibold" : "text-muted-foreground"}`}>{lapTime(l.total_s)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Trois secteurs de même longueur ({fr(sectors.length_m / sectors.n, 0)} m chacun). Le meilleur temps de chaque secteur est en vert.
      </p>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function GGDiagram({ gg }: { gg: NonNullable<LapReport["gg"]> }) {
  const points = useMemo(
    () => gg.lat.map((x, i) => ({ x, y: gg.lon[i], v: gg.speed?.[i] ?? null })),
    [gg],
  );
  const [vMin, vMax] = useMemo(() => {
    const vs = points.map((p) => p.v).filter((v): v is number => v != null);
    return vs.length ? [Math.min(...vs), Math.max(...vs)] : [0, 1];
  }, [points]);
  const lim = Math.ceil(Math.max(2, ...gg.lat.map(Math.abs), ...gg.lon.map(Math.abs)) * 2) / 2;
  const ticks = Array.from({ length: Math.round((2 * lim) / 0.5) + 1 }, (_, i) => -lim + i * 0.5).filter((t) => Number.isInteger(t * 1));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
      <div className="mx-auto aspect-square w-full max-w-[460px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="hsl(var(--border))" />
            <XAxis type="number" dataKey="x" domain={[-lim, lim]} ticks={ticks} tick={axisTick} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}`} name="g latéral" />
            <YAxis type="number" dataKey="y" domain={[-lim, lim]} ticks={ticks} tick={axisTick} tickLine={false} axisLine={false} width={32} name="g longitudinal" />
            <ZAxis range={[18, 18]} />
            <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ stroke: "hsl(var(--border))" }}
              formatter={(value: number, name: string) => [fr(value, 2) + " g", name]}
              labelFormatter={() => ""}
            />
            <Scatter data={points} isAnimationActive={false}>
              {points.map((p, i) => {
                const k = p.v == null || vMax === vMin ? 1 : (p.v - vMin) / (vMax - vMin);
                return <Cell key={i} fill="hsl(var(--primary))" fillOpacity={0.18 + 0.82 * k} />;
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm lg:grid-cols-1 lg:content-start lg:gap-3">
        <Stat label="g latéral max" value={`${fr(gg.lat_max, 2)} g`} />
        <Stat label="Freinage max" value={`${fr(gg.brake_max, 2)} g`} />
        <Stat label="Accélération max" value={`${fr(gg.accel_max, 2)} g`} />
        <div className="col-span-3 flex items-center gap-2 text-[11px] text-muted-foreground lg:col-span-1">
          <span className="h-2 w-16 rounded-full" style={{ background: "linear-gradient(90deg, hsl(var(--primary) / 0.18), hsl(var(--primary)))" }} />
          {fr(vMin, 0)} → {fr(vMax, 0)} km/h
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground lg:col-span-2">
        Meilleur tour (tour {gg.lap}). Chaque point croise l'accélération latérale (gauche, droite) et longitudinale (en haut l'accélération, en bas le freinage), plus intense quand tu vas vite. Un nuage qui remplit les diagonales montre que tu combines frein et virage ; une croix nette, que tu freines puis tournes l'un après l'autre.
        {gg.lon_source === "vitesse GPS" ? " Accélération longitudinale déduite de la vitesse GPS." : ""}
      </p>
    </div>
  );
}

function RpmHistogram({ hist }: { hist: NonNullable<LapReport["rpm_hist"]> }) {
  const data = hist.bins.map((b) => ({
    label: `${fr(b.from / 1000, 1)}`,
    range: `${fr(b.from, 0)} à ${fr(b.to, 0)} tr/min`,
    pct: Math.round(b.share * 1000) / 10,
    seconds: b.seconds,
  }));
  return (
    <div className="space-y-3">
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={2}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={axisTick} tickLine={false} axisLine={false} width={36} tickFormatter={(v: number) => `${v} %`} />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
              labelFormatter={(_: string, p: Array<{ payload: { range: string } }>) => p?.[0]?.payload.range ?? ""}
              formatter={(v: number, _n: string, p: { payload: { seconds: number } }) => [`${fr(v, 1)} % du temps (${fr(p.payload.seconds, 0)} s)`, ""]}
            />
            <Bar dataKey="pct" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Temps passé par plage de {fr(hist.step, 0)} tr/min sur les tours complets (axe en milliers de tr/min). La moitié du temps au-dessus de {fr(hist.p50, 0)} tr/min ; 5 % du temps au-dessus de {fr(hist.p95, 0)} tr/min.
      </p>
    </div>
  );
}
