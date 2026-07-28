import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle, ArrowRight, TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { AnalysisResponse, SpeedTraceLap } from "@/types/analysis";

/**
 * Comparateur de sessions.
 *
 * L'ancienne version affichait deux tableaux de bord côte à côte : ce n'était
 * pas une comparaison, seulement deux analyses posées l'une à côté de l'autre,
 * à charge pour le pilote de tout confronter à l'œil. Sur téléphone, où elles
 * s'empilent, c'était inexploitable.
 *
 * On répond ici aux trois questions qu'un pilote se pose vraiment :
 *
 *   1. Est-ce que j'ai progressé ?   → écart de chrono, mesuré
 *   2. OÙ exactement ?               → superposition des deux meilleurs tours
 *   3. Pourquoi ?                    → ce qui a changé dans le pilotage
 *
 * La méthode du point 2 est celle de l'ingénieur de piste : on superpose les
 * deux meilleurs tours et on chronomètre l'écart cumulé mètre par mètre. La
 * pente de la courbe dit tout — elle monte là où on perd, descend là où on
 * gagne. Rien n'est modélisé : t = ∫ ds/v sur des données mesurées.
 *
 * Un garde-fou précède tout le reste : comparer deux circuits différents n'a
 * aucun sens, et le virage 3 d'Adria n'est pas le virage 3 de Lonato. Quand les
 * séances ne sont pas comparables, on le dit et on masque ce qui serait faux.
 */

interface SessionComparisonProps {
  a: AnalysisResponse;
  b: AnalysisResponse;
  labelA?: string;
  labelB?: string;
}

/** Points de la courbe d'écart, sur une grille commune. */
const GRID_POINTS = 200;

function sessionLabel(x: AnalysisResponse, fallback: string): string {
  const c = x.session_conditions;
  return c?.session_name || c?.circuit_name || fallback;
}

/** Meilleur tour de la séance, celui qui sert de référence partout ailleurs. */
function bestLap(x: AnalysisResponse): SpeedTraceLap | null {
  const laps = x.plot_data?.speed_trace?.laps ?? [];
  if (!laps.length) return null;
  const wanted = x.ideal_lap?.best_lap_number;
  const byNumber = laps.find((l) => l.lap_number === wanted);
  if (byNumber?.distance_m?.length) return byNumber;
  const timed = laps.filter((l) => (l.lap_time ?? 0) > 10 && l.distance_m?.length);
  if (!timed.length) return null;
  return timed.reduce((best, l) => (l.lap_time < best.lap_time ? l : best));
}

/**
 * Temps cumulé le long du tour, sur une grille en fraction de tour.
 *
 * La fraction plutôt que le mètre : deux tours n'ont jamais exactement la même
 * longueur mesurée (bruit GPS, trajectoire), et un décalage de quelques mètres
 * suffirait à décaler tous les virages l'un par rapport à l'autre.
 */
function cumulativeTime(lap: SpeedTraceLap): number[] | null {
  const d = lap.distance_m ?? [];
  const v = lap.speed_kmh ?? [];
  if (d.length < 10 || v.length < 10) return null;

  const s0 = d[0];
  const total = d[d.length - 1] - s0;
  if (!(total > 50)) return null;

  // Temps cumulé sur les points d'origine : t += Δs / v_moyen.
  const t: number[] = [0];
  for (let i = 1; i < d.length; i++) {
    const ds = d[i] - d[i - 1];
    const vm = Math.max(1, ((v[i] ?? 0) + (v[i - 1] ?? 0)) / 2) / 3.6;
    t.push(t[i - 1] + Math.max(0, ds) / vm);
  }

  // Rééchantillonnage sur une grille régulière en fraction de tour.
  const out: number[] = [];
  for (let g = 0; g < GRID_POINTS; g++) {
    const target = s0 + (g / (GRID_POINTS - 1)) * total;
    let i = 1;
    while (i < d.length - 1 && d[i] < target) i++;
    const span = d[i] - d[i - 1] || 1;
    const w = Math.min(1, Math.max(0, (target - d[i - 1]) / span));
    out.push(t[i - 1] + w * (t[i] - t[i - 1]));
  }
  return out;
}

interface CornerSpan {
  cornerId: number;
  from: number; // fraction de tour
  to: number;
}

/** Bornes de chaque virage, en fraction de tour, tirées des mini-secteurs. */
function cornerSpans(x: AnalysisResponse): CornerSpan[] {
  const sectors = x.ideal_lap?.sectors ?? [];
  if (!sectors.length) return [];
  const total = sectors[sectors.length - 1]?.end_m || 0;
  if (!(total > 0)) return [];
  const byCorner = new Map<number, { from: number; to: number }>();
  for (const s of sectors) {
    if (s.corner_id == null) continue;
    const cur = byCorner.get(s.corner_id);
    const from = s.start_m / total;
    const to = s.end_m / total;
    if (!cur) byCorner.set(s.corner_id, { from, to });
    else byCorner.set(s.corner_id, { from: Math.min(cur.from, from), to: Math.max(cur.to, to) });
  }
  return [...byCorner.entries()]
    .map(([cornerId, v]) => ({ cornerId, ...v }))
    .sort((p, q) => p.from - q.from);
}

function fmtDelta(v: number, unit: string, digits = 2): string {
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(digits)} ${unit}`;
}

/** Vert = mieux en B, rouge = moins bien. `lowerIsBetter` inverse la lecture. */
function tone(delta: number, lowerIsBetter: boolean, threshold: number): string {
  if (Math.abs(delta) < threshold) return "text-muted-foreground";
  const better = lowerIsBetter ? delta < 0 : delta > 0;
  return better ? "text-emerald-400" : "text-rose-400";
}

function KpiDelta({
  label,
  a,
  b,
  unit,
  digits = 2,
  lowerIsBetter,
  threshold,
}: {
  label: string;
  a: number;
  b: number;
  unit: string;
  digits?: number;
  lowerIsBetter: boolean;
  threshold: number;
}) {
  const delta = b - a;
  const t = tone(delta, lowerIsBetter, threshold);
  const Icon =
    Math.abs(delta) < threshold ? Minus : (lowerIsBetter ? delta < 0 : delta > 0) ? TrendingUp : TrendingDown;
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className={`flex items-center gap-1.5 text-lg font-bold tabular-nums ${t}`}>
        <Icon className="w-4 h-4 shrink-0" />
        {fmtDelta(delta, unit, digits)}
      </div>
      <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
        {a.toFixed(digits)} <ArrowRight className="inline w-3 h-3 -mt-0.5" /> {b.toFixed(digits)} {unit}
      </div>
    </div>
  );
}

export function SessionComparison({ a, b, labelA, labelB }: SessionComparisonProps) {
  const nameA = labelA || sessionLabel(a, "Session A");
  const nameB = labelB || sessionLabel(b, "Session B");

  // ── Les séances sont-elles comparables ? ─────────────────────────────────
  const compat = useMemo(() => {
    const circuitA = (a.session_conditions?.circuit_name || "").trim().toLowerCase();
    const circuitB = (b.session_conditions?.circuit_name || "").trim().toLowerCase();
    const sameTrack = !circuitA || !circuitB || circuitA === circuitB;
    const cornersA = a.corner_analysis?.length ?? 0;
    const cornersB = b.corner_analysis?.length ?? 0;
    const sameLayout = cornersA > 0 && cornersA === cornersB;
    const condA = a.session_conditions?.track_condition || "dry";
    const condB = b.session_conditions?.track_condition || "dry";
    return {
      sameTrack,
      sameLayout,
      sameConditions: condA === condB,
      condA,
      condB,
      cornersA,
      cornersB,
      // La comparaison virage par virage n'a de sens que sur le même tracé.
      perCorner: sameTrack && sameLayout,
    };
  }, [a, b]);

  // ── Écart de chrono cumulé, mesuré ───────────────────────────────────────
  const delta = useMemo(() => {
    const lapA = bestLap(a);
    const lapB = bestLap(b);
    if (!lapA || !lapB) return null;
    const tA = cumulativeTime(lapA);
    const tB = cumulativeTime(lapB);
    if (!tA || !tB) return null;

    // Chronos officiels de la séance : ce sont eux qui font foi.
    const realA = Number(a.best_lap_time ?? lapA.lap_time ?? 0);
    const realB = Number(b.best_lap_time ?? lapB.lap_time ?? 0);

    // L'intégration t = ∫ds/v accumule une petite dérive (bruit de la vitesse
    // GPS, sous-échantillonnage). Sans correction, l'écart en fin de courbe ne
    // tombait pas exactement sur l'écart chronométré — deux chiffres différents
    // pour la même chose à l'écran. On retire donc la dérive, supposée
    // linéaire le long du tour, pour caler l'arrivée sur le chrono réel.
    const raw = tB.map((v, i) => v - tA[i]);
    const measured = realA > 0 && realB > 0 ? realB - realA : raw[raw.length - 1];
    const drift = raw[raw.length - 1] - measured;
    const values = raw.map((v, i) => v - (drift * i) / (GRID_POINTS - 1));

    return {
      curve: values.map((v, i) => ({
        x: i / (GRID_POINTS - 1),
        delta: Number(v.toFixed(3)),
      })),
      values,
      lapTimeA: realA > 0 ? realA : tA[tA.length - 1],
      lapTimeB: realB > 0 ? realB : tB[tB.length - 1],
    };
  }, [a, b]);

  // ── Où le temps a changé, virage par virage ──────────────────────────────
  const perCorner = useMemo(() => {
    if (!compat.perCorner || !delta) return [];
    const spans = cornerSpans(a);
    if (!spans.length) return [];
    const cA = new Map((a.corner_analysis ?? []).map((c) => [Number(c.corner_id), c]));
    const cB = new Map((b.corner_analysis ?? []).map((c) => [Number(c.corner_id), c]));
    const at = (frac: number) =>
      delta.values[Math.min(delta.values.length - 1, Math.max(0, Math.round(frac * (GRID_POINTS - 1))))];

    return spans
      .map((s) => {
        const ca = cA.get(s.cornerId);
        const cb = cB.get(s.cornerId);
        const dt = at(s.to) - at(s.from);
        const apexA = Number(ca?.apex_speed_real ?? 0);
        const apexB = Number(cb?.apex_speed_real ?? 0);
        const brakeA = Number(ca?.braking_point_distance ?? 0);
        const brakeB = Number(cb?.braking_point_distance ?? 0);
        const hasBraking = Boolean(ca?.has_braking_zone && cb?.has_braking_zone);
        return {
          cornerId: s.cornerId,
          dt,
          apexA,
          apexB,
          dApex: apexB - apexA,
          brakeA,
          brakeB,
          dBrake: hasBraking ? brakeB - brakeA : null,
        };
      })
      .filter((r) => Number.isFinite(r.dt))
      .sort((p, q) => Math.abs(q.dt) - Math.abs(p.dt));
  }, [a, b, compat.perCorner, delta]);

  // ── Ce qui a changé dans le pilotage, toutes zones confondues ────────────
  const style = useMemo(() => {
    const pick = (x: AnalysisResponse) => {
      const zones = (x.corner_analysis ?? []).filter((c) => c.has_braking_zone);
      if (!zones.length) return null;
      const avg = (f: (c: any) => number) =>
        zones.reduce((s, c) => s + (Number(f(c)) || 0), 0) / zones.length;
      return {
        brakePoint: avg((c) => c.braking_point_distance),
        peakG: avg((c) => c.braking_peak_g),
        coasting: zones.reduce((s, c) => s + (Number(c.coasting_s) || 0), 0),
        spread: avg((c) => c.braking_consistency_m),
        zones: zones.length,
      };
    };
    const sa = pick(a);
    const sb = pick(b);
    return sa && sb ? { a: sa, b: sb } : null;
  }, [a, b]);

  const totalDelta = delta ? delta.lapTimeB - delta.lapTimeA : null;

  return (
    <div className="space-y-5">
      {/* ── Verdict ─────────────────────────────────────────────────────── */}
      <header className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-muted-foreground mb-2">
          <span className="font-semibold text-foreground">{nameA}</span>
          <ArrowRight className="w-4 h-4" />
          <span className="font-semibold text-foreground">{nameB}</span>
        </div>
        {totalDelta === null ? (
          <p className="text-sm text-muted-foreground">
            Chronos non superposables : l'une des séances n'a pas de tour complet exploitable.
          </p>
        ) : (
          <>
            <div
              className={`text-3xl font-black tabular-nums ${
                Math.abs(totalDelta) < 0.02
                  ? "text-muted-foreground"
                  : totalDelta < 0
                    ? "text-emerald-400"
                    : "text-rose-400"
              }`}
            >
              {totalDelta < 0 ? "−" : "+"}
              {Math.abs(totalDelta).toFixed(2)} s
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {Math.abs(totalDelta) < 0.02
                ? "Les deux meilleurs tours sont au même niveau."
                : totalDelta < 0
                  ? `Ton meilleur tour est ${Math.abs(totalDelta).toFixed(2)} s plus rapide sur la seconde séance.`
                  : `Ton meilleur tour est ${Math.abs(totalDelta).toFixed(2)} s plus lent sur la seconde séance.`}{" "}
              {delta && (
                <span className="tabular-nums">
                  ({delta.lapTimeA.toFixed(2)} s → {delta.lapTimeB.toFixed(2)} s)
                </span>
              )}
            </p>
          </>
        )}
      </header>

      {/* ── Garde-fous de comparabilité ─────────────────────────────────── */}
      {(!compat.perCorner || !compat.sameConditions) && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-1.5">
          {!compat.sameTrack && (
            <p className="text-[13px] text-amber-300/90 flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Les deux séances ne sont pas sur le même circuit. La comparaison virage par
                virage est masquée : le virage 3 de l'un n'est pas celui de l'autre.
              </span>
            </p>
          )}
          {compat.sameTrack && !compat.sameLayout && (
            <p className="text-[13px] text-amber-300/90 flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {compat.cornersA} virages détectés d'un côté, {compat.cornersB} de l'autre. La
                numérotation ne correspond pas : le détail par virage est masqué.
              </span>
            </p>
          )}
          {!compat.sameConditions && (
            <p className="text-[13px] text-amber-300/90 flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Conditions de piste différentes ({compat.condA} / {compat.condB}). L'écart de
                chrono reflète en partie l'adhérence disponible, pas seulement ton pilotage.
              </span>
            </p>
          )}
        </div>
      )}

      {/* ── Vue d'ensemble ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiDelta
          label="Meilleur tour"
          a={Number(a.best_lap_time ?? a.lap_time ?? 0)}
          b={Number(b.best_lap_time ?? b.lap_time ?? 0)}
          unit="s"
          lowerIsBetter
          threshold={0.02}
        />
        <KpiDelta
          label="Score global"
          a={Number(a.performance_score?.overall_score ?? 0)}
          b={Number(b.performance_score?.overall_score ?? 0)}
          unit="pts"
          digits={1}
          lowerIsBetter={false}
          threshold={0.5}
        />
        <KpiDelta
          label="Régularité (écart)"
          a={Number(a.statistics?.consistency_gap ?? 0)}
          b={Number(b.statistics?.consistency_gap ?? 0)}
          unit="s"
          lowerIsBetter
          threshold={0.05}
        />
        <KpiDelta
          label="Vitesse max"
          a={Number(a.statistics?.max_speed ?? 0)}
          b={Number(b.statistics?.max_speed ?? 0)}
          unit="km/h"
          digits={1}
          lowerIsBetter={false}
          threshold={0.5}
        />
      </div>

      {/* ── Où le temps se joue ─────────────────────────────────────────── */}
      {delta && (
        <section className="rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4">
          <h3 className="text-sm font-semibold mb-1">Où l'écart se creuse</h3>
          <p className="text-[11px] text-muted-foreground mb-3">
            Écart de chrono cumulé entre les deux meilleurs tours, le long du tour. La courbe
            monte là où tu perds, descend là où tu gagnes.
          </p>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={delta.curve} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  dataKey="x"
                  domain={[0, 1]}
                  stroke="hsl(var(--border))"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickFormatter={(v) => `${Math.round(v * 100)} %`}
                />
                <YAxis
                  stroke="hsl(var(--border))"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickFormatter={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}s`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    color: "hsl(var(--foreground))",
                  }}
                  labelFormatter={(v) => `${Math.round(Number(v) * 100)} % du tour`}
                  formatter={(v: number) => [`${v > 0 ? "+" : ""}${v.toFixed(3)} s`, "Écart"]}
                />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
                <Line
                  type="monotone"
                  dataKey="delta"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* ── Détail par virage ───────────────────────────────────────────── */}
      {perCorner.length > 0 && (
        <section className="rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4">
          <h3 className="text-sm font-semibold mb-1">Virage par virage</h3>
          <p className="text-[11px] text-muted-foreground mb-3">
            Classé par écart de temps. Le point de freinage n'apparaît que là où tu freines
            réellement.
          </p>
          <div className="space-y-1.5">
            {perCorner.slice(0, 8).map((r) => (
              <div
                key={r.cornerId}
                className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
              >
                <span className="shrink-0 w-7 h-7 rounded-full border border-primary/40 text-primary text-xs font-bold flex items-center justify-center">
                  {r.cornerId}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-muted-foreground truncate">
                    Apex {r.apexA.toFixed(0)} → {r.apexB.toFixed(0)} km/h
                    {r.dBrake !== null && Math.abs(r.dBrake) >= 1 && (
                      <>
                        {" · "}
                        freinage {r.dBrake > 0 ? "plus tôt" : "plus tard"} de{" "}
                        {Math.abs(r.dBrake).toFixed(0)} m
                      </>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    Math.abs(r.dt) < 0.02
                      ? "text-muted-foreground"
                      : r.dt < 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                  }`}
                >
                  {r.dt < 0 ? "−" : "+"}
                  {Math.abs(r.dt).toFixed(2)} s
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Ce qui a changé dans le pilotage ────────────────────────────── */}
      {style && (
        <section className="rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4">
          <h3 className="text-sm font-semibold mb-1">Ce qui a changé dans ton pilotage</h3>
          <p className="text-[11px] text-muted-foreground mb-3">
            Moyennes sur les {style.b.zones} zones de freinage mesurées.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiDelta
              label="Point de freinage"
              a={style.a.brakePoint}
              b={style.b.brakePoint}
              unit="m"
              digits={1}
              lowerIsBetter
              threshold={1}
            />
            <KpiDelta
              label="Intensité de freinage"
              a={style.a.peakG}
              b={style.b.peakG}
              unit="g"
              lowerIsBetter={false}
              threshold={0.03}
            />
            <KpiDelta
              label="Temps mort cumulé"
              a={style.a.coasting}
              b={style.b.coasting}
              unit="s"
              lowerIsBetter
              threshold={0.05}
            />
            <KpiDelta
              label="Régularité du repère"
              a={style.a.spread}
              b={style.b.spread}
              unit="m"
              digits={1}
              lowerIsBetter
              threshold={0.5}
            />
          </div>
        </section>
      )}
    </div>
  );
}
