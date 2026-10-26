import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

/* ───────────── Types renvoyés par /api/analytics/launch ───────────── */
interface Period {
  visitors: number;
  new_visitors: number;
  visits: number;
  signups: number;
  activated: number;
  analyses: number;
  pages_per_visit: number | null;
  avg_visit_seconds: number | null;
}
interface VisitPage { path: string; at: string; seconds: number | null }
interface Visit {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  started_at: string;
  duration_s: number;
  pages: VisitPage[];
  source: string;
  campaign?: string | null;
  device?: string | null;
  online: boolean;
}
interface Pilot {
  user_id: string;
  name: string | null;
  email: string | null;
  provider: string | null;
  created_at: string;
  confirmed: boolean | null;
  last_seen: string | null;
  visits: number;
  analyses: number;
  first_analysis_at: string | null;
  last_analysis_at: string | null;
  circuits: string[];
  tier: string;
  trial_until: string | null;
  source: string | null;
  devices: number;
}
interface Report {
  window_days: number;
  generated_at: string;
  kpis: { current: Period; previous: Period; paying: number; trials: number; online_now: number; users_total: number };
  funnel: { step: string; value: number }[];
  daily: { date: string; visitors: number; signups: number; analyses: number }[];
  sources: { source: string; visitors: number; signups: number }[];
  pages: { path: string; visits: number; avg_seconds: number | null }[];
  devices: Record<string, number>;
  visits: Visit[];
  users: Pilot[];
  tracking_identified_since: string | null;
}

/* ───────────── Mise en forme ───────────── */
const PAGE_NAMES: Record<string, string> = {
  "/": "Accueil / tableau de bord",
  "/upload": "Analyser",
  "/dashboard": "Sessions",
  "/analysis/:id": "Analyse d'une séance",
  "/mon-kart": "Mon Kart",
  "/setup": "Réglages",
  "/pricing": "Plans",
  "/login": "Connexion",
  "/calendrier": "Calendrier",
  "/profile": "Profil",
  "/parametres": "Paramètres",
  "/admin": "Back-office",
  "/success": "Paiement validé",
  "/redeem": "Paddock Pass",
  "/auth/confirm": "Confirmation e-mail",
  "/reset-password": "Nouveau mot de passe",
  "/legal": "Mentions légales",
  "/legal/cgu": "CGU",
  "/legal/confidentialite": "Confidentialité",
};
const pageName = (p: string) => PAGE_NAMES[p] ?? p;
const TIERS: Record<string, string> = { rookie: "Gratuit", racer: "Racer", team: "Team" };

function ago(iso: string | null | undefined): string {
  if (!iso) return "—";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.round(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.round(s / 3600)} h`;
  const d = Math.round(s / 86400);
  return d === 1 ? "hier" : `il y a ${d} j`;
}
function dateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
function dur(s: number | null | undefined): string {
  if (s == null) return "—";
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m} min ${String(s % 60).padStart(2, "0")}` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
}
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} %` : "—");

const PERIODS = [
  { days: 1, label: "Aujourd'hui" },
  { days: 7, label: "7 jours" },
  { days: 14, label: "14 jours" },
  { days: 30, label: "30 jours" },
];

function Kpi({ label, value, prev, hint }: { label: string; value: number | string; prev?: number; hint?: string }) {
  const n = typeof value === "number" ? value : NaN;
  const diff = prev != null && !Number.isNaN(n) ? n - prev : null;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-display text-3xl font-semibold tabular-nums text-foreground">{value}</span>
        {diff != null && diff !== 0 && (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums",
              diff > 0 ? "bg-[hsl(var(--gain)/0.12)] text-[hsl(var(--gain))]" : "bg-[hsl(var(--loss)/0.12)] text-[hsl(var(--loss))]"
            )}
          >
            {diff > 0 ? `+${diff}` : diff}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Section({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function LaunchPanel({ token }: { token: string }) {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [openUser, setOpenUser] = useState<string | null>(null);
  const [sort, setSort] = useState<"recent" | "created" | "analyses">("recent");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.getLaunchReport(token, days));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lecture impossible");
    } finally {
      setLoading(false);
    }
  }, [token, days]);

  useEffect(() => {
    load();
  }, [load]);

  // Rafraîchissement automatique toutes les 60 s (suivi en direct)
  useEffect(() => {
    const t = window.setInterval(load, 60000);
    return () => window.clearInterval(t);
  }, [load]);

  const pilots = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const list = data.users.filter(
      (u) => !q || [u.name, u.email, u.source, ...(u.circuits || [])].some((v) => (v || "").toLowerCase().includes(q))
    );
    const key = (u: Pilot) =>
      sort === "created" ? u.created_at : sort === "analyses" ? String(u.analyses).padStart(6, "0") : u.last_seen || u.created_at;
    return [...list].sort((a, b) => (key(b) > key(a) ? 1 : -1));
  }, [data, query, sort]);

  if (!data) {
    return (
      <div className="flex justify-center p-10">
        {error ? <p className="text-sm text-muted-foreground">{error}</p> : <Loader2 className="h-6 w-6 animate-spin text-primary" />}
      </div>
    );
  }

  const c = data.kpis.current;
  const p = data.kpis.previous;
  const periodLabel = days === 1 ? "aujourd'hui" : `sur ${days} jours`;
  const funnelMax = Math.max(1, ...data.funnel.map((f) => f.value));
  const deviceTotal = Object.values(data.devices).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Période">
          {PERIODS.map((o) => (
            <button
              key={o.days}
              role="tab"
              aria-selected={days === o.days}
              onClick={() => setDays(o.days)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                days === o.days ? "border-foreground/30 bg-secondary text-foreground" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", data.kpis.online_now ? "bg-[hsl(var(--gain))]" : "bg-muted-foreground/40")} />
            {data.kpis.online_now} en ligne
          </span>
          <span>Hors équipe, mis à jour {ago(data.generated_at)}</span>
          <button onClick={load} className="inline-flex items-center gap-1 hover:text-foreground" aria-label="Actualiser">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label={`Visiteurs ${periodLabel}`} value={c.visitors} prev={p.visitors} hint={`${c.new_visitors} nouveaux`} />
        <Kpi label="Visites" value={c.visits} prev={p.visits} hint={c.pages_per_visit != null ? `${String(c.pages_per_visit).replace(".", ",")} pages par visite, ${dur(c.avg_visit_seconds)}` : undefined} />
        <Kpi label="Inscriptions" value={c.signups} prev={p.signups} hint={`${data.kpis.users_total} pilotes au total`} />
        <Kpi label="Première analyse" value={c.activated} prev={p.activated} hint={`${pct(c.activated, c.signups)} des inscrits de la période`} />
        <Kpi label="Analyses" value={c.analyses} prev={p.analyses} />
        <Kpi label="Abonnés payants" value={data.kpis.paying} hint={data.kpis.trials ? `${data.kpis.trials} essai${data.kpis.trials > 1 ? "s" : ""} Paddock Pass en cours` : undefined} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Section title="Jour par jour">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.daily} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickFormatter={(d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} minTickGap={12} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  labelFormatter={(d: string) => new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="visitors" name="Visiteurs" fill="hsl(var(--foreground) / 0.35)" radius={[3, 3, 0, 0]} />
                <Line dataKey="signups" name="Inscriptions" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2.5 }} isAnimationActive={false} />
                <Line dataKey="analyses" name="Analyses" stroke="hsl(var(--gain))" strokeWidth={2} dot={{ r: 2.5 }} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Du visiteur à l'abonné" aside={<span className="text-xs text-muted-foreground">{periodLabel}</span>}>
          <ol className="space-y-3">
            {data.funnel.map((f, i) => (
              <li key={f.step}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-foreground">{f.step}</span>
                  <span className="tabular-nums text-muted-foreground">
                    <span className="font-semibold text-foreground">{f.value}</span>
                    {i > 0 && ` (${pct(f.value, data.funnel[i - 1].value)})`}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
                  <div className={cn("h-full rounded-full", i === data.funnel.length - 1 ? "bg-primary" : "bg-foreground/50")} style={{ width: `${(f.value / funnelMax) * 100}%` }} />
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-muted-foreground">Pourcentage : part de l'étape précédente.</p>
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="D'où ils viennent">
          {data.sources.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-normal">Provenance</th>
                  <th className="pb-2 text-right font-normal">Visiteurs</th>
                  <th className="pb-2 text-right font-normal">Inscrits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.sources.map((s) => (
                  <tr key={s.source}>
                    <td className="py-1.5 text-foreground">{s.source}</td>
                    <td className="py-1.5 text-right tabular-nums">{s.visitors}</td>
                    <td className="py-1.5 text-right tabular-nums">{s.signups}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun nouveau visiteur sur la période.</p>
          )}
          {deviceTotal > 0 && (
            <p className="mt-4 text-xs text-muted-foreground">
              Appareils :{" "}
              {Object.entries(data.devices)
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => `${k} ${pct(v, deviceTotal)}`)
                .join(", ")}
            </p>
          )}
        </Section>

        <Section title="Pages visitées" aside={<span className="text-xs text-muted-foreground">visites, temps moyen</span>}>
          <ul className="divide-y divide-border text-sm">
            {data.pages.slice(0, 10).map((pg) => (
              <li key={pg.path} className="flex items-baseline justify-between gap-3 py-1.5">
                <span className="truncate text-foreground">{pageName(pg.path)}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  <span className="text-foreground">{pg.visits}</span>, {dur(pg.avg_seconds)}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Dernières visites" aside={<span className="text-xs text-muted-foreground">actualisé chaque minute</span>}>
          <ul className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
            {data.visits.slice(0, 25).map((v) => (
              <li key={v.id} className="text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5">
                    {v.online && <span className="h-2 w-2 shrink-0 rounded-full bg-[hsl(var(--gain))]" aria-label="en ligne" />}
                    {v.user_id ? (
                      <button className="truncate font-medium text-foreground hover:underline" onClick={() => setOpenUser(v.user_id)}>
                        {v.name}
                      </button>
                    ) : (
                      <span className="truncate text-muted-foreground">{v.name}</span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{ago(v.started_at)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {v.source}
                  {v.campaign ? ` (${v.campaign})` : ""}, {v.device ?? "appareil inconnu"}, {dur(v.duration_s)}
                </p>
                <p className="mt-0.5 text-xs text-foreground/80">{v.pages.map((pg) => pageName(pg.path)).join(" › ")}</p>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section
        title={`Pilotes inscrits (${data.users.length})`}
        aside={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nom, e-mail, circuit…" className="h-9 w-56 pl-8" />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm"
              aria-label="Trier"
            >
              <option value="recent">Dernière activité</option>
              <option value="created">Date d'inscription</option>
              <option value="analyses">Nombre d'analyses</option>
            </select>
          </div>
        }
      >
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-5 pb-2 font-normal">Pilote</th>
                <th className="pb-2 font-normal">Inscrit</th>
                <th className="pb-2 font-normal">Provenance</th>
                <th className="pb-2 text-right font-normal">Visites</th>
                <th className="pb-2 text-right font-normal">Analyses</th>
                <th className="pb-2 pl-6 font-normal">Circuits</th>
                <th className="pb-2 font-normal">Dernière activité</th>
                <th className="px-5 pb-2 font-normal">Offre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pilots.map((u) => (
                <Fragment key={u.user_id}>
                  <tr className="cursor-pointer hover:bg-secondary/50" onClick={() => setOpenUser(openUser === u.user_id ? null : u.user_id)}>
                    <td className="px-5 py-2.5">
                      <div className="font-medium text-foreground">{u.name || "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {u.email}
                        {u.confirmed === false ? " (e-mail non confirmé)" : ""}
                      </div>
                    </td>
                    <td className="py-2.5">
                      <div className="text-foreground">{dateTime(u.created_at)}</div>
                      <div className="text-xs text-muted-foreground">{u.provider === "google" ? "Google" : "E-mail"}</div>
                    </td>
                    <td className="py-2.5 text-muted-foreground">{u.source ?? "—"}</td>
                    <td className="py-2.5 text-right tabular-nums">{u.visits}</td>
                    <td className="py-2.5 text-right tabular-nums">{u.analyses}</td>
                    <td className="max-w-[200px] truncate py-2.5 pl-6 text-muted-foreground">{u.circuits.join(", ") || "—"}</td>
                    <td className="py-2.5 text-muted-foreground">{ago(u.last_seen)}</td>
                    <td className="px-5 py-2.5">
                      {TIERS[u.tier] ?? u.tier}
                      {u.trial_until && <span className="block text-xs text-muted-foreground">essai jusqu'au {new Date(u.trial_until).toLocaleDateString("fr-FR")}</span>}
                    </td>
                  </tr>
                  {openUser === u.user_id && (
                    <tr className="bg-secondary/30">
                      <td colSpan={8} className="px-5 py-3 text-sm">
                        <p className="text-muted-foreground">
                          Première analyse : {u.first_analysis_at ? dateTime(u.first_analysis_at) : "pas encore"}
                          {u.last_analysis_at ? `, dernière : ${dateTime(u.last_analysis_at)}` : ""}
                          {u.devices ? `, ${u.devices} appareil${u.devices > 1 ? "s" : ""}` : ""}
                        </p>
                        <ul className="mt-2 space-y-1">
                          {data.visits.filter((v) => v.user_id === u.user_id).map((v) => (
                            <li key={v.id}>
                              <span className="text-muted-foreground">{dateTime(v.started_at)} ({dur(v.duration_s)}) :</span>{" "}
                              {v.pages.map((pg) => `${pageName(pg.path)}${pg.seconds != null ? ` ${dur(pg.seconds)}` : ""}`).join(" › ")}
                            </li>
                          ))}
                          {!data.visits.some((v) => v.user_id === u.user_id) && (
                            <li className="text-muted-foreground">Aucune visite identifiée parmi les 40 dernières.</li>
                          )}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {data.tracking_identified_since ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Le lien entre un visiteur et son compte est enregistré depuis le {new Date(data.tracking_identified_since).toLocaleDateString("fr-FR")} : les visites plus anciennes restent anonymes.
          </p>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            Le lien entre un visiteur et son compte commence aujourd'hui : visites et provenance des pilotes se rempliront à leurs prochaines connexions.
          </p>
        )}
      </Section>
    </div>
  );
}
