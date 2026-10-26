import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FeedbackBox } from "@/components/feedback/FeedbackBox";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { API_BASE_URL } from "@/lib/api";
import { LapLadder } from "./LapLadder";
import { TrackOutline } from "./TrackOutline";
import { KpiTile } from "./KpiTile";
import { ProgressionChart } from "./ProgressionChart";
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

/** Écart au record du circuit, avec les couleurs d'un écran de chronométrage. */
function RecordDelta({ s, compact = false }: { s: PaddockSession; compact?: boolean }) {
  if (s.previousRecord == null) {
    return <span className="text-sm text-muted-foreground">{compact ? "1re séance ici" : "Première séance sur ce circuit"}</span>;
  }
  const d = s.best - s.previousRecord;
  if (d < 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary tabular-nums">
        {compact ? "Record" : "Nouveau record"} {formatDelta(d)}
      </span>
    );
  }
  return (
    <span className="text-sm tabular-nums text-[hsl(var(--loss))]">
      {formatDelta(d)} {compact ? "" : "sur ton record"}
    </span>
  );
}

function LastSession({ s }: { s: PaddockSession }) {
  return (
    <section aria-labelledby="derniere-seance" className="rounded-2xl border border-border bg-card">
      <div className="grid gap-6 p-5 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)] md:gap-8 md:p-7">
        <div className="flex items-center justify-center text-foreground">
          <TrackOutline lat={s.lat} lon={s.lon} size={200} strokeWidth={3} className="h-auto w-28 sm:w-full" title={`Tracé de ${s.circuit}`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Dernière séance, {sinceLabel(s.date)}</p>
          <h2 id="derniere-seance" className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {s.circuit}
          </h2>
          <p className="text-sm text-muted-foreground">
            {capitalize(formatDay(s.date))}, {SESSION_TYPE[s.type] ?? s.type}
          </p>

          <div className="mt-5 flex flex-wrap items-end gap-x-5 gap-y-2">
            <div>
              <div className="font-display text-5xl font-semibold leading-none tracking-tight text-foreground tabular-nums md:text-6xl">
                {formatLap(s.best)}
              </div>
              <div className="mt-1.5 text-sm text-muted-foreground">Meilleur tour</div>
            </div>
            <div className="pb-6">
              <RecordDelta s={s} />
            </div>
          </div>

          {s.laps.length > 1 && <LapLadder laps={s.laps} height={56} showLabels wide className="mt-6" />}

          <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-4">
            <div>
              <dt className="text-xs text-muted-foreground">Tours</dt>
              <dd className="font-display text-lg font-semibold tabular-nums">{s.lapsCount || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Vitesse maxi</dt>
              <dd className="font-display text-lg font-semibold tabular-nums">{s.vmax ? `${Math.round(s.vmax)} km/h` : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Score</dt>
              <dd className="font-display text-lg font-semibold tabular-nums">{s.score ?? "—"}</dd>
            </div>
          </dl>

          <Button asChild variant="outline" className="mt-5">
            <Link to={`/analysis/${s.id}`}>Ouvrir l'analyse</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

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
  const sec = (v: number) => `${v.toFixed(2).replace(".", ",")} s`;
  const diff = (now: number, before: number) => (now - before > 0 ? `+${now - before}` : `${now - before}`);

  return (
    <section aria-label="Tes indicateurs" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiTile
        label="Séances, 30 jours"
        value={String(a.sessions)}
        caption={`${a.previous.sessions} les 30 jours d'avant`}
        delta={a.sessions !== a.previous.sessions ? { text: diff(a.sessions, a.previous.sessions), good: a.sessions > a.previous.sessions } : undefined}
        trend={data.weeks.map((w) => w.sessions)}
        trendLabels={data.weeks.map((w) => `${weekLabel(w.start)} : ${w.sessions} séance${w.sessions > 1 ? "s" : ""}`)}
        formatPoint={(v) => String(v)}
        bars
      />
      <KpiTile
        label="Tours, 30 jours"
        value={String(a.laps)}
        caption={[a.meters != null ? `${formatKm(a.meters)} km` : null, `${formatDuration(a.seconds)} en piste`].filter(Boolean).join(", ")}
        delta={a.laps !== a.previous.laps ? { text: diff(a.laps, a.previous.laps), good: a.laps > a.previous.laps } : undefined}
        trend={data.weeks.map((w) => w.laps)}
        trendLabels={data.weeks.map((w) => `${weekLabel(w.start)} : ${w.laps} tours`)}
        formatPoint={(v) => String(v)}
        bars
      />
      <KpiTile
        label="Régularité"
        value={lastReg != null ? sec(lastReg) : "—"}
        caption={lastReg != null ? "Écart moyen au meilleur tour" : "Il faut au moins 4 tours"}
        delta={
          lastReg != null && avgPrevReg != null
            ? { text: formatDelta(lastReg - avgPrevReg), good: lastReg < avgPrevReg }
            : undefined
        }
        trend={reg.map((s) => s.regularity as number)}
        trendLabels={reg.map((s) => `${formatShortDay(s.date)}, ${s.circuit}`)}
        formatPoint={sec}
        lowerIsBetter
      />
      <KpiTile
        label="Score d'analyse"
        value={lastScore != null ? String(lastScore) : "—"}
        caption="Dernière séance"
        delta={lastScore != null && prevScore != null && lastScore !== prevScore ? { text: diff(lastScore, prevScore), good: lastScore > prevScore } : undefined}
        trend={scored.map((s) => s.score)}
        trendLabels={scored.map((s) => `${formatShortDay(s.date)}, ${s.circuit}`)}
        formatPoint={(v) => String(Math.round(v))}
      />
    </section>
  );
}

function EmptyDashboard({ onAnalyse }: { onAnalyse: () => void }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 md:p-10">
      <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_200px]">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">Ton tableau de bord se remplit à chaque séance</h2>
          <p className="mt-2 max-w-prose text-muted-foreground">
            Dépose le fichier de session de ton boîtier d'acquisition : tu verras ici ton meilleur tour, le temps de chaque tour,
            ta régularité, tes records par circuit et ta progression.
          </p>
          <Button size="lg" className="mt-6" onClick={onAnalyse}>
            Analyser ma première séance
          </Button>
        </div>
        <div className="hidden text-foreground/40 md:block">
          <TrackOutline size={200} strokeWidth={2} />
        </div>
      </div>
    </section>
  );
}

function SessionRow({ s }: { s: PaddockSession }) {
  return (
    <li>
      <Link
        to={`/analysis/${s.id}`}
        className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3.5 transition-colors hover:bg-secondary/60 focus-visible:bg-secondary/60 focus-visible:outline-none sm:grid-cols-[48px_minmax(0,1fr)_120px_auto]"
      >
        <TrackOutline lat={s.lat} lon={s.lon} size={48} strokeWidth={2} className="text-foreground/80" />
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{s.circuit}</div>
          <div className="text-sm text-muted-foreground">
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
    </li>
  );
}

function Records({ records }: { records: CircuitRecord[] }) {
  if (!records.length) return null;
  return (
    <section aria-labelledby="records">
      <h2 id="records" className="font-display text-lg font-semibold text-foreground">
        Tes records
      </h2>
      <ul className="mt-3 divide-y divide-border">
        {records.slice(0, 5).map((r) => (
          <li key={r.circuitKey} className="flex items-baseline justify-between gap-4 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-foreground">{r.circuit}</div>
              <div className="text-xs text-muted-foreground">
                {r.sessions} séance{r.sessions > 1 ? "s" : ""}, record le {formatShortDay(r.date)}
              </div>
            </div>
            <div className="font-display font-semibold tabular-nums text-foreground">{formatLap(r.best)}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Focus({ insights }: { insights: ReturnType<typeof usePaddockData>["insights"] }) {
  if (!insights || insights.insufficient_data || !insights.weak_point) return null;
  const corners = insights.weak_point.corners ?? [];
  return (
    <section aria-labelledby="a-travailler">
      <h2 id="a-travailler" className="font-display text-lg font-semibold text-foreground">
        À travailler
      </h2>
      <p className="mt-2 text-foreground">{insights.weak_point.label}</p>
      {corners.length > 0 && (
        <p className="mt-1 text-sm text-muted-foreground">
          {corners.length === 1 ? `Virage ${corners[0]}` : `Virages ${corners.slice(0, -1).join(", ")} et ${corners[corners.length - 1]}`}
          , sur tes dernières séances.
        </p>
      )}
    </section>
  );
}

function Meter({ label, current, life, unit }: { label: string; current: number; life: number; unit: string }) {
  const pct = Math.min(100, Math.round((current / life) * 100));
  const tone = pct >= 90 ? "bg-primary" : pct >= 70 ? "bg-[hsl(var(--loss))]" : "bg-foreground/60";
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ","));
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {fmt(current)} / {fmt(life)} {unit}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
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
    <section aria-labelledby="ton-kart">
      <div className="flex items-baseline justify-between">
        <h2 id="ton-kart" className="font-display text-lg font-semibold text-foreground">
          Ton kart
        </h2>
        <Link to="/mon-kart" className="text-sm text-muted-foreground hover:text-foreground">
          Mon Kart
        </Link>
      </div>
      <div className="mt-3 space-y-3">
        {engineLife > 0 && (
          <Meter label={kart.engine_model ? `Moteur ${kart.engine_model}` : "Moteur"} current={kart.engine_hours_current ?? 0} life={engineLife} unit="h" />
        )}
        {tiresLife > 0 && <Meter label="Pneus" current={kart.tires_laps_current ?? 0} life={tiresLife} unit="tours" />}
        {brakesLife > 0 && <Meter label="Freins" current={kart.brakes_hours_current ?? 0} life={brakesLife} unit="h" />}
      </div>
    </section>
  );
}

function NextEventBlock({ event }: { event: ReturnType<typeof usePaddockData>["nextEvent"] }) {
  if (event === undefined) return null;
  return (
    <section aria-labelledby="prochaine-date">
      <h2 id="prochaine-date" className="font-display text-lg font-semibold text-foreground">
        Prochaine date
      </h2>
      {event ? (
        <div className="mt-2">
          <p className="text-foreground">{event.title}</p>
          <p className="text-sm text-muted-foreground">
            {capitalize(formatDay(event.starts_at))}
            {event.days_until != null && event.days_until >= 0
              ? `, ${event.days_until === 0 ? "aujourd'hui" : event.days_until === 1 ? "demain" : `dans ${event.days_until} jours`}`
              : ""}
          </p>
          {event.circuit_name && <p className="text-sm text-muted-foreground">{event.circuit_name}</p>}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Aucune course ni séance prévue.{" "}
          <Link to="/calendrier" className="text-foreground underline-offset-4 hover:underline">
            Ajouter une date
          </Link>
        </p>
      )}
    </section>
  );
}

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

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Salut {firstName}</h1>
          {tier === "rookie" && (
            <button onClick={refreshPlan} className="mt-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              Tu viens de t'abonner ? Mettre à jour mon offre
            </button>
          )}
        </div>
        <Button size="lg" onClick={() => navigate("/upload")}>
          Analyser une séance
        </Button>
      </header>

      {!data.loading && !last ? (
        <EmptyDashboard onAnalyse={() => navigate("/upload")} />
      ) : (
        <KpiRow data={data} />
      )}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-10">
          {data.loading && !last ? (
            <Skeleton className="h-[360px] w-full rounded-2xl" />
          ) : last ? (
            <LastSession s={last} />
          ) : null}

          {last && <ProgressionChart sessions={data.sessions} records={data.records} />}

          {previous.length > 0 && (
            <section aria-labelledby="seances">
              <div className="flex items-baseline justify-between">
                <h2 id="seances" className="font-display text-lg font-semibold text-foreground">
                  Séances précédentes
                </h2>
                <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                  Toutes tes séances
                </Link>
              </div>
              <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {previous.slice(0, 6).map((s) => (
                  <SessionRow key={s.id} s={s} />
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-9 lg:pt-1">
          <Records records={data.records} />
          <Focus insights={data.insights} />
          <KartBlock kart={data.kart} />
          <NextEventBlock event={data.nextEvent} />
        </aside>
      </div>

      <FeedbackBox />
    </div>
  );
}
