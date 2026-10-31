import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Crosshair,
  Flag,
  Gauge,
  Repeat,
  Timer,
  Trophy,
  Upload,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FeedbackBox } from "@/components/feedback/FeedbackBox";
import { TiltCard } from "@/components/landing/TiltCard";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { API_BASE_URL, type HomeFocus } from "@/lib/api";
import { cn } from "@/lib/utils";
import { LapLadder } from "./LapLadder";
import { TrackOutline } from "./TrackOutline";
import { KpiTile } from "./KpiTile";
import { ProgressionChart } from "./ProgressionChart";
import { ACCENT, CountUp, PitCard, Reveal, Slant, useSeenOnce } from "./motion";
import { usePaddockData, type PaddockData, type PaddockSession, type CircuitRecord } from "./usePaddockData";
import {
  SESSION_TYPE,
  formatDay,
  formatDelta,
  formatDuration,
  formatKm,
  formatLap,
  formatShortDay,
  sinceLabel,
} from "./format";

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const fmtInt = (v: number) => String(Math.round(v));
const fmtSec = (v: number) => `${v.toFixed(2).replace(".", ",")} s`;

/** Écart au record du circuit, avec les couleurs d'un écran de chronométrage (violet = record). */
function RecordDelta({ s, compact = false }: { s: PaddockSession; compact?: boolean }) {
  if (s.previousRecord == null) {
    return <span className="text-xs text-muted-foreground">{compact ? "1re séance ici" : "Première séance sur ce circuit"}</span>;
  }
  const d = s.best - s.previousRecord;
  if (d < 0) {
    return compact ? (
      <span className="text-xs font-semibold tabular-nums text-[hsl(var(--record))]">Record {formatDelta(d)}</span>
    ) : (
      <Slant accent="record">Nouveau record {formatDelta(d)}</Slant>
    );
  }
  return (
    <span className="text-xs tabular-nums text-[hsl(var(--loss))]">
      {formatDelta(d)} {compact ? "" : "sur ton record"}
    </span>
  );
}

/* ── Dernière séance ─────────────────────────────────────────────────────── */

function LastSession({ s }: { s: PaddockSession }) {
  const [ref, seen] = useSeenOnce<HTMLDivElement>();
  // Le chrono « se pose » : il descend d'une seconde et demie vers le meilleur tour.
  const runnerSeconds = Math.min(9, Math.max(5, s.best / 8));
  return (
    <TiltCard rest={{ x: 0.6, y: -1 }} range={2.5} className="rounded-2xl">
      <div ref={ref}>
        <PitCard accent="red" glow labelledBy="derniere-seance" className="p-5 pt-6 md:p-7">
          {/* Bande diagonale rouge derrière le tracé : la livrée de la carte. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 top-0 -z-10 h-full w-40 -skew-x-[18deg] md:right-6 md:w-56"
            style={{ background: "linear-gradient(180deg, hsl(var(--primary) / 0.16), hsl(var(--primary) / 0.02))" }}
          />
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px] md:gap-8">
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Slant accent="red">Dernière séance</Slant>
                  <h2 id="derniere-seance" className="mt-3 truncate font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                    {s.circuit}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {capitalize(formatDay(s.date))}, {SESSION_TYPE[s.type] ?? s.type} · {sinceLabel(s.date)}
                  </p>
                </div>
                <TrackOutline
                  lat={s.lat}
                  lon={s.lon}
                  size={84}
                  strokeWidth={2.5}
                  draw
                  runner={runnerSeconds}
                  className="h-auto w-20 shrink-0 text-foreground md:hidden"
                  title={`Tracé de ${s.circuit}`}
                />
              </div>

              <div className="mt-5 flex flex-wrap items-end gap-x-4 gap-y-2">
                <div>
                  <div className="font-display text-[3.25rem] font-bold leading-none tracking-tight text-foreground md:text-6xl">
                    <CountUp value={s.best} from={s.best + 1.5} format={formatLap} play={seen} duration={1.3} />
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Timer aria-hidden="true" className="size-3.5 text-primary" />
                    Meilleur tour
                  </div>
                </div>
                <div className="pb-6">
                  <RecordDelta s={s} />
                </div>
              </div>

              {s.laps.length > 1 && <LapLadder laps={s.laps} height={52} showLabels wide animated className="mt-5" />}

              <dl className="mt-5 grid grid-cols-3 gap-2">
                {[
                  { icon: <Repeat />, label: "Tours", value: s.lapsCount ? String(s.lapsCount) : "—", color: ACCENT.amber },
                  { icon: <Zap />, label: "V. max", value: s.vmax ? `${Math.round(s.vmax)} km/h` : "—", color: ACCENT.red },
                  { icon: <Gauge />, label: "Score", value: s.score != null ? String(s.score) : "—", color: ACCENT.green },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl bg-secondary/60 px-3 py-2.5">
                    <dt className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <span aria-hidden="true" className="[&>svg]:size-3" style={{ color: m.color }}>
                        {m.icon}
                      </span>
                      {m.label}
                    </dt>
                    <dd className="mt-0.5 font-display text-base font-semibold tabular-nums text-foreground">{m.value}</dd>
                  </div>
                ))}
              </dl>

              <Button asChild className="mt-5 w-full sm:w-auto">
                <Link to={`/analysis/${s.id}`}>
                  Ouvrir l'analyse
                  <ArrowRight aria-hidden="true" className="ml-1.5 size-4" />
                </Link>
              </Button>
            </div>

            <div className="hidden items-center justify-center text-foreground md:flex">
              <TrackOutline lat={s.lat} lon={s.lon} size={220} strokeWidth={3} draw runner={runnerSeconds} className="h-auto w-full drop-shadow-[0_0_18px_hsl(var(--primary)/0.25)]" title={`Tracé de ${s.circuit}`} />
            </div>
          </div>
        </PitCard>
      </div>
    </TiltCard>
  );
}

/* ── Point à travailler ─────────────────────────────────────────────────── */

function FocusCard({ focus, sessions }: { focus: HomeFocus | null | undefined; sessions: PaddockSession[] }) {
  const session = useMemo(() => sessions.find((s) => s.id === focus?.analysis_id), [sessions, focus?.analysis_id]);
  if (!focus) return null;
  const circuit = session?.circuit || focus.circuit_name || "Circuit non renseigné";
  const date = session?.date || focus.created_at;
  const type = session?.type || focus.session_type || "";
  const marker = focus.apex_lat != null && focus.apex_lon != null ? { lat: focus.apex_lat, lon: focus.apex_lon } : null;
  const gain = focus.impact_seconds > 0.004 ? `${focus.impact_seconds.toFixed(2).replace(".", ",")} s` : null;

  return (
    <Reveal>
      <PitCard accent="amber" glow labelledBy="a-travailler" className="p-5 pt-6 md:p-6">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Slant accent="amber">
                <span className="inline-flex items-center gap-1">
                  <Crosshair aria-hidden="true" className="size-3" />À travailler
                </span>
              </Slant>
            </div>
            <h2 id="a-travailler" className="mt-3 font-display text-xl font-bold tracking-tight text-foreground md:text-2xl">
              {focus.corner_label}
            </h2>
            <p className="text-sm text-muted-foreground">
              {circuit}
              {date ? `, ${type ? `${SESSION_TYPE[type] ?? type} du ` : "séance du "}${formatShortDay(date)}` : ""}
            </p>
          </div>
          {session?.lat && (
            <TrackOutline
              lat={session.lat}
              lon={session.lon}
              marker={marker}
              accent="hsl(var(--amber))"
              size={88}
              strokeWidth={2}
              className="h-auto w-[88px] shrink-0 text-foreground/70"
              title={`${focus.corner_label}, ${circuit}`}
            />
          )}
        </div>

        <p className="mt-3 text-[15px] leading-snug text-foreground">{focus.headline}</p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {gain ? (
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold tabular-nums text-[hsl(var(--amber))]">{gain}</span>
              <span className="text-sm text-muted-foreground">à gagner par tour</span>
            </div>
          ) : (
            <span />
          )}
          <Button asChild variant="outline" className="w-full border-[hsl(var(--amber)/0.45)] sm:w-auto">
            <Link to={`/analysis/${focus.analysis_id}?virage=${focus.corner}`}>
              Voir le virage
              <ArrowRight aria-hidden="true" className="ml-1.5 size-4" />
            </Link>
          </Button>
        </div>
      </PitCard>
    </Reveal>
  );
}

/* ── Indicateurs ────────────────────────────────────────────────────────── */

function KpiRow({ data }: { data: PaddockData }) {
  const a = data.activity;
  const weekLabel = (t: number) => `Semaine du ${new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
  const chrono = [...data.sessions].sort((x, y) => x.timestamp - y.timestamp).slice(-12);
  const reg = chrono.filter((s) => s.regularity != null);
  const lastReg = reg[reg.length - 1]?.regularity ?? null;
  const prevRegs = reg.slice(0, -1).map((s) => s.regularity as number);
  const avgPrevReg = prevRegs.length ? prevRegs.reduce((x, y) => x + y, 0) / prevRegs.length : null;
  const scored = chrono.filter((s) => typeof s.score === "number");
  const lastScore = scored[scored.length - 1]?.score ?? null;
  const prevScore = scored[scored.length - 2]?.score ?? null;
  const diff = (now: number, before: number) => (now - before > 0 ? `+${now - before}` : `${now - before}`);

  return (
    <section aria-label="Tes indicateurs" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiTile
        label="Séances, 30 j"
        icon={<CalendarDays />}
        accent="red"
        value={String(a.sessions)}
        num={a.sessions}
        format={fmtInt}
        caption={`${a.previous.sessions} les 30 jours d'avant`}
        delta={a.sessions !== a.previous.sessions ? { text: diff(a.sessions, a.previous.sessions), good: a.sessions > a.previous.sessions } : undefined}
        trend={data.weeks.map((w) => w.sessions)}
        trendLabels={data.weeks.map((w) => `${weekLabel(w.start)} : ${w.sessions} séance${w.sessions > 1 ? "s" : ""}`)}
        formatPoint={(v) => String(v)}
        bars
      />
      <KpiTile
        label="Tours, 30 j"
        icon={<Flag />}
        accent="amber"
        delay={0.08}
        value={String(a.laps)}
        num={a.laps}
        format={fmtInt}
        caption={[a.meters != null ? `${formatKm(a.meters)} km` : null, `${formatDuration(a.seconds)} en piste`].filter(Boolean).join(", ")}
        delta={a.laps !== a.previous.laps ? { text: diff(a.laps, a.previous.laps), good: a.laps > a.previous.laps } : undefined}
        trend={data.weeks.map((w) => w.laps)}
        trendLabels={data.weeks.map((w) => `${weekLabel(w.start)} : ${w.laps} tours`)}
        formatPoint={(v) => String(v)}
        bars
      />
      <KpiTile
        label="Régularité"
        icon={<Activity />}
        accent="green"
        delay={0.16}
        value={lastReg != null ? fmtSec(lastReg) : "—"}
        num={lastReg}
        format={fmtSec}
        caption={lastReg != null ? "Écart moyen au meilleur tour" : "Il faut au moins 4 tours"}
        delta={lastReg != null && avgPrevReg != null ? { text: formatDelta(lastReg - avgPrevReg), good: lastReg < avgPrevReg } : undefined}
        trend={reg.map((s) => s.regularity as number)}
        trendLabels={reg.map((s) => `${formatShortDay(s.date)}, ${s.circuit}`)}
        formatPoint={fmtSec}
        lowerIsBetter
      />
      <KpiTile
        label="Score d'analyse"
        icon={<Gauge />}
        accent="record"
        delay={0.24}
        value={lastScore != null ? String(lastScore) : "—"}
        num={lastScore}
        format={fmtInt}
        caption="Dernière séance"
        delta={lastScore != null && prevScore != null && lastScore !== prevScore ? { text: diff(lastScore, prevScore), good: lastScore > prevScore } : undefined}
        trend={scored.map((s) => s.score)}
        trendLabels={scored.map((s) => `${formatShortDay(s.date)}, ${s.circuit}`)}
        formatPoint={(v) => String(Math.round(v))}
      />
    </section>
  );
}

/* ── Accueil d'un nouveau pilote ────────────────────────────────────────── */

const STEPS = [
  { title: "Dépose ton fichier de session", body: "Celui de ton boîtier AiM MyChron ou Alfano, depuis ton téléphone ou ton ordinateur." },
  { title: "L'IA analyse chaque tour", body: "Freinages, points de corde, sorties de virage : elle trouve où tu perds du temps." },
  { title: "Applique en piste", body: "Des conseils chiffrés, virage par virage, à tester dès ta séance suivante." },
];

function EmptyDashboard({ onAnalyse, firstName }: { onAnalyse: () => void; firstName: string }) {
  return (
    <div className="space-y-4">
      <PitCard accent="red" glow className="p-6 pt-7 md:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 top-0 -z-10 h-full w-48 -skew-x-[18deg] md:right-10 md:w-64"
          style={{ background: "linear-gradient(180deg, hsl(var(--primary) / 0.18), hsl(var(--primary) / 0.02))" }}
        />
        <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_240px] md:gap-10">
          <div className="min-w-0">
            <Slant accent="red" solid>
              Bienvenue au paddock
            </Slant>
            <h2 className="mt-4 font-display text-[1.7rem] font-bold leading-tight tracking-tight text-foreground md:text-4xl">
              {firstName !== "pilote" ? `${firstName}, ton` : "Ton"} tableau de bord démarre à ta première séance
            </h2>
            <p className="mt-3 max-w-prose text-muted-foreground">
              Meilleur tour, régularité, records par circuit et le virage à travailler : tout se remplit à chaque fichier que tu déposes.
            </p>
            <Button size="lg" className="mt-6 h-12 w-full text-base sm:w-auto" onClick={onAnalyse}>
              <Upload aria-hidden="true" className="mr-2 size-4" />
              Analyser ma première séance
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">Fichier de session AiM MyChron (.xrk, .xrz) ou Alfano.</p>
          </div>
          <div className="order-first mx-auto w-32 text-foreground/85 md:order-none md:w-full">
            <TrackOutline demo size={240} strokeWidth={3} draw runner={6} className="h-auto w-full drop-shadow-[0_0_18px_hsl(var(--primary)/0.3)]" title="Circuit" />
          </div>
        </div>
      </PitCard>

      <ol className="grid gap-3 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <Reveal as="li" key={step.title} delay={0.1 + i * 0.08}>
            <PitCard as="div" accent={i === 0 ? "red" : i === 1 ? "amber" : "green"} className="flex h-full gap-4 p-4 pt-5">
              <span
                aria-hidden="true"
                className="relative inline-flex size-9 shrink-0 items-center justify-center font-display text-lg font-bold text-foreground"
              >
                <span
                  className="absolute inset-0 -skew-x-[14deg] rounded-md"
                  style={{ background: `color-mix(in oklab, ${ACCENT[i === 0 ? "red" : i === 1 ? "amber" : "green"]} 22%, transparent)` }}
                />
                <span className="relative">{i + 1}</span>
              </span>
              <div className="min-w-0">
                <h3 className="font-display font-semibold text-foreground">{step.title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{step.body}</p>
              </div>
            </PitCard>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}

/* ── Colonne de droite ──────────────────────────────────────────────────── */

function Records({ records, sessions }: { records: CircuitRecord[]; sessions: PaddockSession[] }) {
  const lines = useMemo(() => {
    const m = new Map<string, PaddockSession>();
    for (const s of sessions) if (s.lat && !m.has(s.circuitKey)) m.set(s.circuitKey, s);
    return m;
  }, [sessions]);
  if (!records.length) return null;
  return (
    <Reveal>
      <PitCard accent="record" labelledBy="records" className="p-5 pt-6">
        <h2 id="records" className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
          <Trophy aria-hidden="true" className="size-4 text-[hsl(var(--record))]" />
          Tes records
        </h2>
        <ul className="mt-2 divide-y divide-border">
          {records.slice(0, 5).map((r) => {
            const line = lines.get(r.circuitKey);
            return (
              <li key={r.circuitKey} className="flex items-center gap-3 py-2.5">
                <TrackOutline lat={line?.lat} lon={line?.lon} size={34} strokeWidth={1.75} className="shrink-0 text-foreground/60" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{r.circuit}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.sessions} séance{r.sessions > 1 ? "s" : ""}, le {formatShortDay(r.date)}
                  </div>
                </div>
                <div className="font-display text-base font-bold tabular-nums text-[hsl(var(--record))]">{formatLap(r.best)}</div>
              </li>
            );
          })}
        </ul>
      </PitCard>
    </Reveal>
  );
}

function Meter({ label, current, life, unit }: { label: string; current: number; life: number; unit: string }) {
  const [ref, seen] = useSeenOnce<HTMLDivElement>();
  const pct = Math.min(100, Math.round((current / life) * 100));
  const color = pct >= 90 ? ACCENT.red : pct >= 70 ? ACCENT.amber : ACCENT.green;
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ","));
  return (
    <div ref={ref}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="truncate text-foreground">{label}</span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {fmt(current)} / {fmt(life)} {unit}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div
          className="h-full rounded-full transition-[width] duration-1000 ease-out motion-reduce:transition-none"
          style={{
            width: seen ? `${pct}%` : "0%",
            background: `repeating-linear-gradient(135deg, ${color} 0 6px, color-mix(in oklab, ${color} 80%, black) 6px 9px)`,
          }}
        />
      </div>
    </div>
  );
}

function KartBlock({ kart }: { kart: ReturnType<typeof usePaddockData>["kart"] }) {
  if (!kart) return null;
  const engineLife = kart.engine_hours_life ?? 0;
  const tiresLife = kart.tires_laps_life ?? 0;
  const brakesLife = kart.brakes_hours_life ?? 0;
  if (!engineLife && !tiresLife && !brakesLife) return null;
  return (
    <Reveal>
      <PitCard accent="amber" labelledBy="ton-kart" className="p-5 pt-6">
        <div className="flex items-baseline justify-between">
          <h2 id="ton-kart" className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
            <Wrench aria-hidden="true" className="size-4 text-[hsl(var(--amber))]" />
            Ton kart
          </h2>
          <Link to="/mon-kart" className="text-sm text-muted-foreground hover:text-foreground">
            Mon Kart
          </Link>
        </div>
        <div className="mt-3 space-y-3.5">
          {engineLife > 0 && (
            <Meter label={kart.engine_model ? `Moteur ${kart.engine_model}` : "Moteur"} current={kart.engine_hours_current ?? 0} life={engineLife} unit="h" />
          )}
          {tiresLife > 0 && <Meter label="Pneus" current={kart.tires_laps_current ?? 0} life={tiresLife} unit="tours" />}
          {brakesLife > 0 && <Meter label="Freins" current={kart.brakes_hours_current ?? 0} life={brakesLife} unit="h" />}
        </div>
      </PitCard>
    </Reveal>
  );
}

function NextEventBlock({ event }: { event: ReturnType<typeof usePaddockData>["nextEvent"] }) {
  if (event === undefined) return null;
  const days = event?.days_until;
  return (
    <Reveal>
      <PitCard accent="red" labelledBy="prochaine-date" className="p-5 pt-6">
        <h2 id="prochaine-date" className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
          <CalendarDays aria-hidden="true" className="size-4 text-primary" />
          Prochaine date
        </h2>
        {event ? (
          <div className="mt-3 flex items-center gap-4">
            {days != null && days >= 0 && (
              <Slant accent="red" solid className="shrink-0 px-3 py-1.5 text-sm">
                {days === 0 ? "Jour J" : `J-${days}`}
              </Slant>
            )}
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{event.title}</p>
              <p className="text-sm text-muted-foreground">
                {capitalize(formatDay(event.starts_at))}
                {days === 1 ? ", demain" : ""}
              </p>
              {event.circuit_name && <p className="truncate text-sm text-muted-foreground">{event.circuit_name}</p>}
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Aucune course ni séance prévue.{" "}
            <Link to="/calendrier" className="text-foreground underline underline-offset-4">
              Ajouter une date
            </Link>
          </p>
        )}
      </PitCard>
    </Reveal>
  );
}

/* ── Séances précédentes ────────────────────────────────────────────────── */

function SessionRow({ s, i }: { s: PaddockSession; i: number }) {
  return (
    <Reveal as="li" delay={Math.min(i, 6) * 0.05}>
      <Link
        to={`/analysis/${s.id}`}
        className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/60 focus-visible:bg-secondary/60 focus-visible:outline-none active:bg-secondary/80 sm:grid-cols-[48px_minmax(0,1fr)_120px_auto] sm:gap-4"
      >
        <TrackOutline lat={s.lat} lon={s.lon} size={44} strokeWidth={2} className="text-foreground/80" />
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{s.circuit}</div>
          <div className="truncate text-sm text-muted-foreground">
            {formatShortDay(s.date)}, {SESSION_TYPE[s.type] ?? s.type}
            {s.lapsCount ? `, ${s.lapsCount} tours` : ""}
          </div>
        </div>
        <LapLadder laps={s.laps} height={28} className="hidden sm:block" />
        <div className="text-right">
          <div className="font-display text-lg font-semibold tabular-nums text-foreground">{formatLap(s.best)}</div>
          <RecordDelta s={s} compact />
        </div>
      </Link>
    </Reveal>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function PaddockHome({ preview }: { preview?: PaddockData } = {}) {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { tier, fetchSubscription } = useSubscription();
  const live = usePaddockData(preview ? undefined : user?.id, preview ? undefined : session?.access_token);
  const data = preview ?? live;
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "pilote";

  const refreshPlan = () =>
    toast.promise(
      (async () => {
        await fetch(`${API_BASE_URL}/api/stripe/sync`, {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        });
        await fetchSubscription();
      })(),
      { loading: "Mise à jour de ton offre…", success: "Offre à jour", error: "Mise à jour impossible, réessaie dans un instant" }
    );

  const [last, ...previous] = data.sessions;
  const empty = !data.loading && !last;
  const today = capitalize(new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }));

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12 md:space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{today}</p>
          <h1 className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Salut {firstName}
            {(tier === "racer" || tier === "team") && (
              <Slant accent="red" solid className="text-[10px]">
                {tier === "team" ? "Team" : "Racer"}
              </Slant>
            )}
          </h1>
          {tier === "rookie" && !empty && (
            <button onClick={refreshPlan} className="mt-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              Tu viens de t'abonner ? Mettre à jour mon offre
            </button>
          )}
        </div>
        {!empty && (
          <Button size="lg" className="w-full sm:w-auto" onClick={() => navigate("/upload")}>
            <Upload aria-hidden="true" className="mr-2 size-4" />
            Analyser une séance
          </Button>
        )}
      </header>

      {empty ? (
        <>
          <EmptyDashboard onAnalyse={() => navigate("/upload")} firstName={firstName} />
          <div className="grid gap-4 md:grid-cols-2">
            <NextEventBlock event={data.nextEvent} />
            <KartBlock kart={data.kart} />
          </div>
        </>
      ) : (
        // Téléphone : une colonne, dans l'ordre d'importance (séance, virage à
        // travailler, chiffres…). Grand écran : chiffres en haut, colonne à droite.
        <div className="grid gap-5 md:gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-x-8">
          <div className="min-w-0 lg:col-start-1 lg:row-start-2">
            {data.loading && !last ? <Skeleton className="h-[420px] w-full rounded-2xl" /> : last ? <LastSession s={last} /> : null}
          </div>

          <div className={cn("min-w-0 lg:col-start-1 lg:row-start-3", !data.insights?.focus && "hidden")}>
            <FocusCard focus={data.insights?.focus} sessions={data.sessions} />
          </div>

          <div className="min-w-0 lg:col-span-2 lg:row-start-1">{last && <KpiRow data={data} />}</div>

          <div className="min-w-0 lg:col-start-1 lg:row-start-4">
            {last && <ProgressionChart sessions={data.sessions} records={data.records} />}
          </div>

          <aside className="min-w-0 space-y-5 lg:col-start-2 lg:row-span-4 lg:row-start-2 lg:space-y-6">
            <Records records={data.records} sessions={data.sessions} />
            <KartBlock kart={data.kart} />
            <NextEventBlock event={data.nextEvent} />
          </aside>

          {previous.length > 0 && (
            <section aria-labelledby="seances" className="min-w-0 lg:col-start-1 lg:row-start-5">
              <div className="flex items-baseline justify-between">
                <h2 id="seances" className="font-display text-lg font-semibold text-foreground">
                  Séances précédentes
                </h2>
                <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                  Toutes tes séances
                </Link>
              </div>
              <PitCard as="div" hatch={false} className="mt-3">
                <ul className="divide-y divide-border">
                  {previous.slice(0, 6).map((s, i) => (
                    <SessionRow key={s.id} s={s} i={i} />
                  ))}
                </ul>
              </PitCard>
            </section>
          )}
        </div>
      )}

      <FeedbackBox />
    </div>
  );
}
