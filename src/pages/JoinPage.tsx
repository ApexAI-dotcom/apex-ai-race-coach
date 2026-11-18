import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { invalidateTeamCache } from "@/hooks/useTeam";
import { PENDING_JOIN_KEY, getInvite, joinStructure, type TeamRole, type TeamStructureRef } from "@/lib/team";

const KIND_LABEL: Record<string, string> = { ecole: "École de pilotage", club: "Club", coach: "Coach" };

/**
 * Rejoindre une structure (école, club, coach) par son code.
 * Le pilote voit exactement ce que le coach verra, et accepte explicitement.
 */
export default function JoinPage() {
  const { code = "" } = useParams<{ code: string }>();
  const { user, session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<{ structure: TeamStructureRef; role: TeamRole } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    let alive = true;
    getInvite(code)
      .then((r) => alive && setInvite(r))
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Ce code n'existe pas."));
    return () => {
      alive = false;
    };
  }, [code]);

  const back = `/rejoindre/${encodeURIComponent(code)}`;

  // Pas encore connecté : on garde le code pour revenir ici après
  // l'inscription (le lien de confirmation du mail mène au tableau de bord).
  useEffect(() => {
    if (!authLoading && !user && code) {
      try {
        localStorage.setItem(PENDING_JOIN_KEY, code);
      } catch {
        /* stockage indisponible : le pilote rouvrira le lien */
      }
    }
    if (user) {
      try {
        localStorage.removeItem(PENDING_JOIN_KEY);
      } catch {
        /* rien */
      }
    }
  }, [authLoading, user, code]);
  const isCoach = invite?.role === "coach";

  const join = async () => {
    if (!session?.access_token) return;
    setJoining(true);
    setError(null);
    try {
      await joinStructure(code, consent, session.access_token);
      invalidateTeamCache();
      navigate("/equipe", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de rejoindre pour l'instant.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <Layout>
      <PageMeta title="Rejoindre une structure | ApexAI" description="Rejoins ton école, ton club ou ton coach sur ApexAI." path={back} />
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col gap-5 px-4 py-8">
        {!invite && !error && <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin text-muted-foreground" />}

        {error && !invite && (
          <div className="mt-16 space-y-4 text-center">
            <h1 className="font-display text-2xl font-bold">Code introuvable</h1>
            <p className="text-muted-foreground">{error}</p>
            <Button asChild variant="outline">
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </div>
        )}

        {invite && (
          <>
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                {isCoach ? "Invitation coach" : "Invitation"} · {KIND_LABEL[invite.structure.kind] ?? "Structure"}
              </p>
              <h1 className="mt-1.5 font-display text-3xl font-bold leading-tight">
                Rejoins <span className="text-gradient-primary">{invite.structure.name}</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {isCoach
                  ? "Tu deviens coach de cette structure : tu suis les séances des pilotes qui te rejoignent et tu leur laisses des notes."
                  : "Ton coach suivra tes séances. Tu as l'accès Racer complet tant que tu es membre."}
              </p>
            </div>

            {!isCoach && (
              <>
                <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-green-500">Ton coach verra</h2>
                  <p className="text-sm">Tes séances déposées à partir d'aujourd'hui, leurs analyses et leurs chronos</p>
                  <p className="text-sm">Les anciennes séances que tu choisis de partager, une par une</p>
                </section>
                <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Il ne verra pas</h2>
                  <p className="text-sm">Tes séances d'avant, ton email, ton abonnement, tes autres structures</p>
                  <p className="text-sm">Il ne peut rien supprimer ni modifier chez toi</p>
                </section>
                <p className="text-sm text-muted-foreground">
                  Tu peux quitter à tout moment depuis la page Mon équipe. Tu gardes ton compte et tout ton historique.
                </p>
              </>
            )}

            {authLoading ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
            ) : !user ? (
              <div className="mt-auto space-y-2">
                <p className="text-sm text-muted-foreground">Connecte-toi ou crée ton compte pour continuer.</p>
                <Button asChild className="h-12 w-full gradient-primary text-white">
                  <Link to={`/login?mode=signup&redirect=${encodeURIComponent(back)}`}>Créer mon compte</Link>
                </Button>
                <Button asChild variant="outline" className="h-12 w-full">
                  <Link to={`/login?redirect=${encodeURIComponent(back)}`}>J'ai déjà un compte</Link>
                </Button>
              </div>
            ) : (
              <div className="mt-auto space-y-3">
                {!isCoach && (
                  <label htmlFor="join-consent" className="flex items-start gap-3 text-sm">
                    <Checkbox id="join-consent" checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
                    <span>J'accepte que {invite.structure.name} voie ces données</span>
                  </label>
                )}
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button
                  className="h-12 w-full gradient-primary text-white"
                  disabled={joining || (!isCoach && !consent)}
                  onClick={join}
                >
                  {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rejoindre"}
                </Button>
                <Button asChild variant="ghost" className="w-full text-muted-foreground">
                  <Link to="/">Pas maintenant</Link>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
