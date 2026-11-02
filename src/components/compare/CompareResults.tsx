import { useMemo, useState } from "react";
import { CartesianGrid, Label, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AnalysisResult } from "@/lib/api";
import type { TrajectoryLap } from "@/types/analysis";
import {
  at,
  bestLap,
  cap,
  compareLaps,
  cornerRefs,
  explainCorner,
  lapChoices,
  lapTrace,
  summarize,
  type CornerComparison,
} from "@/lib/compare";
import { TrackMapPro } from "@/components/analysis/TrackMapPro";
import { ChartZoomFrame } from "@/components/analysis/ChartZoomFrame";
import { useChartZoom, sliceToDomain } from "@/components/analysis/useChartZoom";
import { downsample } from "@/components/analysis/utils";

/*
 * Mêmes couleurs que la carte de l'analyse en vue « Comparaison » : le premier
 * pilote en orange (trait plein), le second en blanc (pointillé sur la carte).
 * La carte et les courbes se lisent donc avec la même légende.
 */
export const COLOR_A = "#f97316";
export const COLOR_B = "rgba(255,255,255,0.8)";
const CORNER_ORANGE = "#f97316";

// Mêmes cadres et titres que la page d'analyse.
const sectionClass = "glass-card p-4 md:p-6";
const titleClass = "text-xl font-bold text-foreground";

function lapLabel(t: number) {
  const m = Math.floor(t / 60);
  const s = (t - m * 60).toFixed(3).replace(".", ",");
  return m ? `${m}:${t - m * 60 < 10 ? "0" : ""}${s}` : s;
}
const sec = (x: number) => `${Math.abs(x).toFixed(2).replace(".", ",")} s`;

function LapSelect({ result, value, onChange, color, title }: { result: AnalysisResult; value: number; onChange: (n: number) => void; color: string; title: string }) {
  const choices = lapChoices(result);
  const best = bestLap(result);
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        {title}
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

function CornerTable({ corners, names }: { corners: CornerComparison[]; names: [string, string] }) {
  const pair = (x: [number | null, number | null], unit: string) =>
    x[0] == null && x[1] == null ? "—" : `${x[0] ?? "—"} / ${x[1] ?? "—"} ${unit}`;
  return (
    <div className="-mx-4 overflow-x-auto md:-mx-6">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="px-4 pb-2 font-normal md:px-6">Virage</th>
            <th className="pb-2 font-normal">Écart</th>
            <th className="pb-2 font-normal">Freinage avant la corde</th>
            <th className="pb-2 font-normal">Vitesse mini</th>
            <th className="pb-2 font-normal">Gaz après la corde</th>
            <th className="px-4 pb-2 font-normal md:px-6">Vitesse en sortie</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border tabular-nums">
          {corners.map((c) => (
            <tr key={c.number}>
              <td className="px-4 py-2 font-medium text-foreground md:px-6">Virage {c.number}</td>
              <td className="py-2">
                {Math.abs(c.gain) < 0.01 ? (
                  <span className="text-muted-foreground">égalité</span>
                ) : (
                  <span style={{ color: c.gain > 0 ? COLOR_A : COLOR_B }}>
                    {cap(c.gain > 0 ? names[0] : names[1])} +{sec(c.gain)}
                  </span>
                )}
              </td>
              <td className="py-2 text-muted-foreground">{pair(c.brakeDistance, "m")}</td>
              <td className="py-2 text-muted-foreground">{pair(c.minSpeed, "km/h")}</td>
              <td className="py-2 text-muted-foreground">{pair(c.throttleDistance, "m")}</td>
              <td className="px-4 py-2 text-muted-foreground md:px-6">{pair(c.exitSpeed, "km/h")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 px-4 text-xs text-muted-foreground md:px-6">
        Chaque case : {names[0]} / {names[1]}. Freinage : distance entre le début du freinage et le point le plus lent du virage.
      </p>
    </div>
  );
}

function trajectoryOf(r: AnalysisResult, lap: number): TrajectoryLap | undefined {
  return r.plot_data?.trajectory_2d?.laps?.find((l) => l.lap_number === lap);
}

export function CompareResults({ ra, rb, names: givenNames }: { ra: AnalysisResult; rb: AnalysisResult; names: [string, string] }) {
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

  // Deux tours d'une même séance : on parle des tours, pas d'un pilote.
  const names = useMemo<[string, string]>(
    () => (sameFile ? [`le tour ${lapA}`, `le tour ${lapB}`] : givenNames),
    [sameFile, lapA, lapB, givenNames]
  );

  const cmp = useMemo(() => {
    if (lapA == null || lapB == null) return null;
    const a = lapTrace(ra, lapA);
    const b = lapTrace(rb, lapB);
    if (!a || !b) return null;
    return compareLaps(a, b, cornerRefs(ra));
  }, [ra, rb, lapA, lapB]);

  const span: [number, number] = cmp ? [cmp.a.d[0] ?? 0, cmp.a.d[cmp.a.d.length - 1] ?? 1] : [0, 1];
  // Un seul zoom pour les deux courbes : elles restent alignées virage par virage.
  const zoom = useChartZoom(span[0], span[1]);

  const chart = useMemo(() => {
    if (!cmp) return [];
    // Fenêtre d'abord, sous-échantillonnage ensuite : zoomer sur un virage
    // révèle du détail au lieu d'agrandir les mêmes points.
    const [i0, i1] = sliceToDomain(cmp.a.d, zoom.domain);
    const idx = Array.from({ length: i1 - i0 + 1 }, (_, k) => i0 + k);
    const keep = downsample(idx, zoom.isZoomed ? 300 : 160);
    return keep.map((i) => ({
      d: Math.round(cmp.a.d[i] * 10) / 10,
      vA: Math.round(cmp.a.v[i]),
      vB: Math.round(at(cmp.b.v, cmp.pos[i])),
      delta: Math.round(cmp.delta[i] * 1000) / 1000,
    }));
  }, [cmp, zoom.domain, zoom.isZoomed]);

  // Zones de virage comme sur les graphiques de l'analyse ; une étiquette
  // masquée quand elle tomberait sur la précédente (téléphone).
  const overlays = useMemo(() => {
    if (!cmp) return [];
    const [lo, hi] = zoom.domain;
    const gap = (hi - lo) * 0.06;
    let last = -Infinity;
    return [...cmp.corners]
      .sort((x, y) => x.apexDistance - y.apexDistance)
      .filter((c) => c.apexDistance >= lo && c.apexDistance <= hi)
      .map((c) => {
        const show = c.apexDistance - last >= gap;
        if (show) last = c.apexDistance;
        return { id: c.number, x1: Math.max(lo, c.apexDistance - 12), x2: Math.min(hi, c.apexDistance + 12), label: show ? String(c.number) : "" };
      });
  }, [cmp, zoom.domain]);

  const mapLaps = useMemo<TrajectoryLap[]>(() => {
    if (lapA == null || lapB == null) return [];
    const ta = trajectoryOf(ra, lapA);
    const tb = trajectoryOf(rb, lapB);
    if (!ta || !tb) return [];
    return [
      { ...ta, lap_number: 1, is_best: true, label: `${cap(names[0])}${sameFile ? "" : `, tour ${lapA}`}` },
      { ...tb, lap_number: 2, is_best: false, label: `${cap(names[1])}${sameFile ? "" : `, tour ${lapB}`}` },
    ];
  }, [ra, rb, lapA, lapB, names, sameFile]);

  if (!cmp) {
    return (
      <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        Ces analyses ne contiennent pas le tracé GPS des tours : la comparaison n'est possible que sur des séances analysées depuis octobre 2026. Relance l'analyse des fichiers pour comparer.
      </p>
    );
  }

  const gap = cmp.b.time - cmp.a.time;
  const keyCorners = [...cmp.corners].filter((c) => Math.abs(c.gain) >= 0.03).sort((x, y) => Math.abs(y.gain) - Math.abs(x.gain)).slice(0, 5);
  const tooltipStyle = { backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))", fontSize: 12 };
  const axisTick = { fill: "hsl(var(--muted-foreground))", fontSize: 11 };
  const corners = (dy: number) =>
    overlays.map((o) => (
      <ReferenceArea key={o.id} x1={o.x1} x2={o.x2} fill={CORNER_ORANGE} fillOpacity={0.12} ifOverflow="hidden">
        {dy === 0 && o.label && <Label value={o.label} position="insideTop" fill={CORNER_ORANGE} fontSize={11} fontWeight="bold" />}
      </ReferenceArea>
    ));
  const xAxis = (
    <XAxis
      type="number"
      dataKey="d"
      domain={zoom.domain}
      allowDataOverflow
      stroke="hsl(var(--border))"
      tick={axisTick}
      tickFormatter={(v: number) => `${Math.round(v)}m`}
    />
  );
  const ahead = cap(names[0]);

  return (
    <div className="space-y-6 md:space-y-8">
      <section className={sectionClass}>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          {lapA != null && <LapSelect result={ra} value={lapA} onChange={setLapA} color={COLOR_A} title={sameFile ? "Premier tour" : givenNames[0]} />}
          <div className="text-center">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Écart</div>
            <div className="mt-1 font-display text-4xl font-bold tabular-nums text-gradient-primary">{sec(gap)}</div>
            <div className="text-xs text-muted-foreground tabular-nums">
              {lapLabel(cmp.a.time)} contre {lapLabel(cmp.b.time)}
            </div>
          </div>
          {lapB != null && <LapSelect result={rb} value={lapB} onChange={setLapB} color={COLOR_B} title={sameFile ? "Second tour" : givenNames[1]} />}
        </div>
        <p className="mt-4 text-foreground">{summarize(cmp, names)}</p>
      </section>

      {mapLaps.length === 2 && (
        <section className={sectionClass}>
          <h2 className={`${titleClass} mb-1`}>Carte du Circuit</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Les deux trajectoires superposées : {cap(names[0])} en orange, {names[1]} en pointillé blanc. Zoome sur un virage pour voir qui passe où.
          </p>
          <TrackMapPro
            key={`${lapA}-${lapB}`}
            corners={ra.plot_data?.trajectory_2d?.corners ?? []}
            laps={mapLaps}
            bestLapNumber={1}
            selectedLapNumbers={[1]}
            trackEdges={ra.plot_data?.track_edges ?? null}
            profiles={["compare", "speed", "braking"]}
            initialProfile="compare"
            initialComparisonLap={2}
          />
        </section>
      )}

      <section className={sectionClass}>
        <h2 className={`${titleClass} mb-1`}>Écart et vitesse</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          En haut, l'écart cumulé : au-dessus de zéro, {ahead} est devant, et la pente montre où le temps se gagne. En bas, les vitesses superposées. Les zones orange sont les virages.
        </p>
        <div className="mb-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: COLOR_A }} />{cap(names[0])}</span>
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: COLOR_B }} />{cap(names[1])}</span>
        </div>
        <ChartZoomFrame zoom={zoom} heightClass="h-[440px] sm:h-[480px]">
          <div className="flex h-full flex-col">
            <div className="h-[42%]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart} syncId="cmp" margin={{ top: 18, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  {corners(0)}
                  {xAxis}
                  <YAxis stroke="hsl(var(--border))" tick={axisTick} tickFormatter={(v: number) => `${v.toFixed(1).replace(".", ",")}s`} width={44} />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    isAnimationActive={false}
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                    labelFormatter={(d: number) => `Position : ${Math.round(d)} m`}
                    formatter={(v: number) => [Math.abs(v) < 0.005 ? "à égalité" : `${cap(v > 0 ? names[0] : names[1])} devant de ${sec(v)}`, ""]}
                  />
                  <Line dataKey="delta" stroke={COLOR_A} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="h-[58%]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart} syncId="cmp" margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  {corners(1)}
                  {xAxis}
                  <YAxis stroke="hsl(var(--border))" tick={axisTick} width={44} domain={["dataMin - 5", "dataMax + 5"]} tickFormatter={(v: number) => `${Math.round(v)}`} />
                  <Tooltip
                    isAnimationActive={false}
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                    labelFormatter={(d: number) => `Position : ${Math.round(d)} m`}
                    formatter={(v: number, key: string) => [`${v} km/h`, cap(key === "vA" ? names[0] : names[1])]}
                  />
                  <Line dataKey="vA" stroke={COLOR_A} strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line dataKey="vB" stroke={COLOR_B} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ChartZoomFrame>
      </section>

      {keyCorners.length > 0 && (
        <section className={sectionClass}>
          <h2 className={`${titleClass} mb-4`}>Où se fait la différence</h2>
          <ul className="space-y-3">
            {keyCorners.map((c) => {
              const reasons = explainCorner(c, names);
              const who = cap(c.gain > 0 ? names[0] : names[1]);
              return (
                <li key={c.number} className="grid gap-1 rounded-lg border border-white/5 bg-secondary/50 p-3.5 sm:grid-cols-[150px_minmax(0,1fr)] sm:p-4">
                  <div>
                    <div className="font-display font-semibold text-foreground">Virage {c.number}</div>
                    <div className="text-sm tabular-nums" style={{ color: c.gain > 0 ? COLOR_A : COLOR_B }}>
                      {who} +{sec(c.gain)}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {reasons.length ? reasons.map(cap).join(". ") + "." : "L'écart vient de la vitesse sur tout le virage, sans point net à isoler."}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className={sectionClass}>
        <h2 className={`${titleClass} mb-4`}>Virage par virage</h2>
        <CornerTable corners={cmp.corners} names={names} />
      </section>
    </div>
  );
}
