import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { formatLap, getPilotSessions, removePilot, type TeamPilotSessions } from "@/lib/team";

const fmtDate = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
};

/** Le coach regarde un de ses pilotes : ses séances visibles, en lecture. */
export default function TeamPilotPage() {
  const { structureId = "", pilotId = "" } = useParams<{ structureId: string; pilotId: string }>();
  const { session, user } = useAuth();
  const token = session?.access_token;
  const [data, setData] = useState<TeamPilotSessions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    getPilotSessions(structureId, pilotId, token)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Chargement impossible."));
    return () => {
      alive = false;
    };
  }, [structureId, pilotId, token]);

  const remove = async () => {
    if (!token) return;
    try {
      await removePilot(structureId, pilotId, token);
      setRemoved(true);
      toast.success("Pilote retiré de ta structure. Il garde son compte et son historique.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible pour l'instant.");
    }
  };

  const best = data?.sessions.reduce<number | null>(
    (b, s) => (s.best_lap_time && (b == null || s.best_lap_time < b) ? s.best_lap_time : b),
    null,
  );

  return (
    <Layout>
      <PageMeta title="Pilote | Mon équipe | ApexAI" description="Les séances d'un pilote de ton équipe." path="/equipe" />
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 md:py-10">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link to={`/equipe?s=${structureId}`}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Mon équipe
          </Link>
        </Button>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {!data && !error && <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />}

        {data && (
          <>
            <div>
              <h1 className="font-display text-3xl font-bold">{data.pilot.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Tu vois ses séances depuis son arrivée le {fmtDate(data.pilot.joined_at)}, et celles qu'il a partagées. En lecture
                seule.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Séances</p>
                <p className="font-display text-xl font-bold">{data.sessions.length}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Meilleur tour</p>
                <p className="font-display text-xl font-bold tabular-nums">{formatLap(best)}</p>
              </div>
            </div>

            {data.sessions.length === 0 ? (
              <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                Pas encore de séance depuis son arrivée.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.sessions.map((s) => (
                  <li key={s.id}>
                    <Link
                      to={`/analysis/${s.id}?coach=1&s=${structureId}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">
                          {[s.session_name || s.circuit_name || "Séance", fmtDate(s.created_at)].join(" · ")}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {[
                            s.circuit_name,
                            s.best_lap_time ? `meilleur tour ${formatLap(s.best_lap_time)}` : null,
                            s.shared ? "partagée par le pilote" : null,
                            s.uploaded_by && s.uploaded_by === user?.id ? "déposée par toi" : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {!removed &&
              (!confirm ? (
                <Button variant="ghost" className="text-muted-foreground" onClick={() => setConfirm(true)}>
                  Retirer ce pilote de la structure
                </Button>
              ) : (
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border p-3 text-sm">
                  <span className="flex-1">Tu ne verras plus ses séances. Il garde son compte et tout son historique.</span>
                  <Button size="sm" variant="destructive" onClick={remove}>
                    Retirer
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>
                    Annuler
                  </Button>
                </div>
              ))}
          </>
        )}
      </div>
    </Layout>
  );
}
