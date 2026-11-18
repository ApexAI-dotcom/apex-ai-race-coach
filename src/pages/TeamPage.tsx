import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { ChevronRight, Copy, Loader2, UserPlus } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useTeam } from "@/hooks/useTeam";
import { supabase } from "@/lib/supabase";
import { getAllAnalyses, type AnalysisSummary } from "@/lib/storage";
import {
  createPilotInvite,
  formatLap,
  getTeamOverview,
  joinLink,
  leaveStructure,
  shareSession,
  type TeamMembership,
  type TeamOverview,
} from "@/lib/team";

const fmtDate = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};
const fmtDelta = (v: number | null) => (v == null ? null : `${v > 0 ? "+" : "−"}${Math.abs(v).toFixed(2).replace(".", ",")} s`);

/**
 * « Mon équipe » : la vue coach (équipe, alertes, classement, invitations)
 * et, pour un pilote membre, sa structure, ses partages et la sortie.
 */
export default function TeamPage() {
  const { enabled, memberships, coachOf, pilotOf, loading, refresh, token } = useTeam();
  const [params, setParams] = useSearchParams();
  const selected = params.get("s") || coachOf[0]?.structure.id || null;

  return (
    <Layout>
      <PageMeta title="Mon équipe | ApexAI" description="Ton espace d'équipe ApexAI." path="/equipe" />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 md:py-10">
        {loading && !memberships.length ? (
          <Loader2 className="mx-auto mt-16 h-6 w-6 animate-spin text-muted-foreground" />
        ) : !enabled || !memberships.length ? (
          <div className="mt-16 space-y-3 text-center">
            <h1 className="font-display text-2xl font-bold">Mon équipe</h1>
            <p className="text-muted-foreground">
              Tu n'es membre d'aucune école, club ou coach pour l'instant. Ton coach te donnera un lien ou un code.
            </p>
            <Button asChild variant="outline">
              <Link to="/pricing">Découvrir l'offre Team</Link>
            </Button>
          </div>
        ) : (
          <>
            {coachOf.length > 0 && selected && (
              <CoachView
                key={selected}
                structureId={selected}
                structures={coachOf}
                onSelect={(id) => setParams({ s: id })}
                token={token!}
              />
            )}
            {pilotOf.map((m) => (
              <PilotMembership key={m.structure.id} m={m} token={token!} onLeft={refresh} />
            ))}
          </>
        )}
      </div>
    </Layout>
  );
}

function CoachView({
  structureId,
  structures,
  onSelect,
  token,
}: {
  structureId: string;
  structures: TeamMembership[];
  onSelect: (id: string) => void;
  token: string;
}) {
  const [data, setData] = useState<TeamOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [circuit, setCircuit] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getTeamOverview(structureId, token)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Chargement impossible."));
    return () => {
      alive = false;
    };
  }, [structureId, token]);

  const ranking = useMemo(
    () => data?.rankings.find((r) => r.circuit === circuit) ?? data?.rankings[0] ?? null,
    [data, circuit],
  );
  const trialDays = data?.structure.trial_until
    ? Math.max(0, Math.ceil((new Date(data.structure.trial_until).getTime() - Date.now()) / 86400000))
    : null;

  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!data) return <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />;

  return (
    <section className="space-y-5" aria-label="Vue équipe">
      {structures.length > 1 && (
        <nav aria-label="Structures" className="flex gap-2 overflow-x-auto pb-1">
          {structures.map((m) => (
            <button
              key={m.structure.id}
              type="button"
              onClick={() => onSelect(m.structure.id)}
              className={cn(
                "h-10 shrink-0 rounded-full px-4 text-sm",
                m.structure.id === structureId ? "gradient-primary font-semibold text-white" : "border border-border text-muted-foreground",
              )}
            >
              {m.structure.name}
            </button>
          ))}
        </nav>
      )}

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Mon équipe</p>
          <h1 className="font-display text-2xl font-bold text-gradient-primary md:text-3xl">{data.structure.name}</h1>
        </div>
        {data.structure.status === "essai" && trialDays != null && (
          <span className="shrink-0 rounded-full border border-amber-500/50 px-3 py-1 text-xs font-semibold text-amber-400">
            Essai · J-{trialDays}
          </span>
        )}
      </div>

      {data.alerts.length > 0 && (
        <div className="space-y-1.5 rounded-2xl border border-amber-500/35 bg-amber-500/[0.07] p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-400">À surveiller</p>
          {data.alerts.map((a) => (
            <p key={a.pilot_id + a.kind} className="text-sm">
              {a.text}
            </p>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold">Pilotes · {data.pilots.length}</h2>
        </div>
        {data.pilots.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Aucun pilote pour l'instant. Crée un code ci-dessous et partage-le (lien ou QR à imprimer pour le paddock).
          </p>
        ) : (
          <ul className="space-y-2">
            {data.pilots.map((p) => (
              <li key={p.user_id}>
                <Link
                  to={`/equipe/${structureId}/pilote/${p.user_id}`}
                  className="grid grid-cols-[40px_1fr_auto_16px] items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary font-bold">
                    {p.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{p.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {p.last_session
                        ? [p.last_session.circuit, fmtDate(p.last_session.date), formatLap(p.last_session.best_lap)].filter(Boolean).join(" · ")
                        : "Pas encore de séance"}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "text-sm font-bold tabular-nums",
                      p.trend_30d == null ? "text-muted-foreground" : p.trend_30d <= 0 ? "text-green-500" : "text-amber-400",
                    )}
                  >
                    {p.inactive ? "inactif" : fmtDelta(p.trend_30d) ?? "—"}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {ranking && (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-base font-semibold">Classement · {ranking.circuit}</h2>
            {data.rankings.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {data.rankings.map((r) => (
                  <button
                    key={r.circuit}
                    type="button"
                    onClick={() => setCircuit(r.circuit)}
                    className={cn(
                      "h-8 rounded-full px-3 text-xs",
                      r.circuit === ranking.circuit ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {r.circuit}
                  </button>
                ))}
              </div>
            )}
          </div>
          <ol className="space-y-1.5 text-sm">
            {ranking.rows.map((r, i) => (
              <li key={r.user_id} className="grid grid-cols-[24px_1fr_auto] gap-2">
                <span className={cn("font-bold", i === 0 ? "text-primary" : "text-muted-foreground")}>{i + 1}</span>
                <span>{r.name}</span>
                <span className="tabular-nums">{formatLap(r.best_lap)}</span>
              </li>
            ))}
          </ol>
          <p className="text-xs text-muted-foreground">Meilleur tour de chaque pilote sur ce circuit, séances visibles par toi.</p>
        </div>
      )}

      <InvitePanel structureId={structureId} token={token} />
    </section>
  );
}

function InvitePanel({ structureId, token }: { structureId: string; token: string }) {
  const [guardian, setGuardian] = useState(false);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  const create = async () => {
    setBusy(true);
    try {
      const r = await createPilotInvite(structureId, { guardian_certified: guardian, expires_days: 30 }, token);
      setCode(r.code);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Création impossible.");
    } finally {
      setBusy(false);
    }
  };

  const link = code ? joinLink(code) : "";
  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary to-orange-500 p-px">
      <div className="space-y-3 rounded-[15px] bg-card p-4">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold">
          <UserPlus className="h-4 w-4 text-primary" />
          Inviter des pilotes
        </h2>
        <p className="text-sm text-muted-foreground">
          Un code valable 30 jours, pour autant de pilotes que tu veux. Chaque pilote donne lui-même son accord.
        </p>
        <label htmlFor="guardian" className="flex items-start gap-3 text-sm">
          <Checkbox id="guardian" checked={guardian} onCheckedChange={(v) => setGuardian(v === true)} className="mt-0.5" />
          <span>Ces pilotes sont mineurs : je certifie avoir l'accord écrit d'un de leurs parents.</span>
        </label>
        {!code ? (
          <Button className="h-11 w-full gradient-primary text-white" onClick={create} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer un code"}
          </Button>
        ) : (
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
            <div className="rounded-xl bg-white p-3">
              <QRCodeSVG value={link} size={132} aria-label={`QR code pour rejoindre avec le code ${code}`} />
            </div>
            <div className="w-full space-y-2">
              <p className="font-display text-2xl font-bold tracking-[0.2em]">{code}</p>
              <p className="break-all text-xs text-muted-foreground">{link}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 gap-1.5"
                  onClick={() => navigator.clipboard?.writeText(link).then(() => toast.success("Lien copié"))}
                >
                  <Copy className="h-3.5 w-3.5" /> Copier le lien
                </Button>
                <Button size="sm" variant="ghost" className="h-10" onClick={() => setCode(null)}>
                  Nouveau code
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PilotMembership({ m, token, onLeft }: { m: TeamMembership; token: string; onLeft: () => void }) {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const leave = async () => {
    setLeaving(true);
    try {
      const r = await leaveStructure(m.structure.id, token);
      toast.success(
        r.racer_until
          ? `Tu as quitté ${m.structure.name}. On t'offre un mois Racer, jusqu'au ${fmtDate(r.racer_until)}.`
          : `Tu as quitté ${m.structure.name}.`,
      );
      onLeft();
      navigate("/equipe", { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible pour l'instant.");
    } finally {
      setLeaving(false);
      setConfirm(false);
    }
  };

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4" aria-label={`Membre de ${m.structure.name}`}>
      <div>
        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Membre depuis le {fmtDate(m.joined_at)}</p>
        <h2 className="font-display text-xl font-bold">{m.structure.name}</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Ton coach voit tes séances déposées depuis ton arrivée, et celles d'avant que tu choisis de partager. Tu as l'accès
        Racer complet tant que tu es membre.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="h-10" onClick={() => setShowShare((v) => !v)}>
          Partager d'anciennes séances
        </Button>
        {!confirm ? (
          <Button variant="ghost" className="h-10 text-muted-foreground" onClick={() => setConfirm(true)}>
            Quitter la structure
          </Button>
        ) : (
          <div className="flex w-full flex-wrap items-center gap-2 rounded-xl border border-border p-3 text-sm">
            <span className="flex-1">Ton coach ne verra plus tes séances. Tu gardes tout ton historique.</span>
            <Button size="sm" variant="destructive" className="h-9" onClick={leave} disabled={leaving}>
              {leaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Quitter"}
            </Button>
            <Button size="sm" variant="ghost" className="h-9" onClick={() => setConfirm(false)}>
              Annuler
            </Button>
          </div>
        )}
      </div>
      {showShare && <SharePicker m={m} token={token} />}
    </section>
  );
}

function SharePicker({ m, token }: { m: TeamMembership; token: string }) {
  const [sessions, setSessions] = useState<AnalysisSummary[] | null>(null);
  const [shared, setShared] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const all = await getAllAnalyses();
      const joined = m.joined_at ? new Date(m.joined_at).getTime() : Date.now();
      const older = all.filter((a) => new Date(a.date).getTime() < joined);
      const { data } = await supabase.from("shared_analyses").select("analysis_id").eq("structure_id", m.structure.id);
      if (!alive) return;
      setSessions(older);
      setShared(new Set((data || []).map((r: { analysis_id: string }) => r.analysis_id)));
    })().catch(() => alive && setSessions([]));
    return () => {
      alive = false;
    };
  }, [m.joined_at, m.structure.id]);

  const toggle = async (id: string) => {
    const on = !shared.has(id);
    setBusy(id);
    try {
      await shareSession(m.structure.id, id, on, token);
      setShared((s) => {
        const n = new Set(s);
        if (on) n.add(id);
        else n.delete(id);
        return n;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible pour l'instant.");
    } finally {
      setBusy(null);
    }
  };

  if (!sessions) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  if (!sessions.length) return <p className="text-sm text-muted-foreground">Aucune séance d'avant ton arrivée.</p>;
  return (
    <ul className="max-h-80 space-y-1.5 overflow-y-auto">
      {sessions.map((a) => (
        <li key={a.id}>
          <label htmlFor={`share-${a.id}`} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-sm">
            <Checkbox id={`share-${a.id}`} checked={shared.has(a.id)} disabled={busy === a.id} onCheckedChange={() => toggle(a.id)} />
            <span className="flex-1 truncate">{[a.session_name || a.circuit_name, fmtDate(a.date)].filter(Boolean).join(" · ")}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}
