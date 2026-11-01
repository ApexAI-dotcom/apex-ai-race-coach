import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowRight, Camera, Disc3, Gauge, Loader2, LogOut, Settings, Wrench, Zap } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth, useUser } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription.tsx";
import { api, createPortalSession } from "@/lib/api";
import { uploadAvatar } from "@/lib/supabase-storage";
import { formatTimeLeft } from "@/lib/paddockPass";
import { ADMIN_EMAIL } from "@/constants";
import { PitCard, Reveal, Slant } from "@/components/home/paddock/motion";
import { TrackOutline } from "@/components/home/paddock/TrackOutline";
import { usePaddockData } from "@/components/home/paddock/usePaddockData";
import { SESSION_TYPE, formatLap, formatShortDay } from "@/components/home/paddock/format";

/**
 * Profil : qui je suis, mon offre, mon activité, mon matériel, mes dernières
 * séances, mon compte. Tout ce qui est affiché vient des vraies données
 * (plus de badges factices ni de graphique de score sans échelle).
 */

const TIER_LABEL: Record<string, string> = { visitor: "Visiteur", rookie: "Rookie", racer: "Racer", team: "Team" };

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="font-display text-lg font-semibold text-foreground">{children}</h2>
      {action}
    </div>
  );
}

export default function Profile() {
  const { user, loading } = useUser();
  const { signOut, session } = useAuth();
  const { tier, status, limits, billingPeriod, subscriptionEndDate, isLoading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const token = session?.access_token;
  const data = usePaddockData(user?.id, token);

  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pass, setPass] = useState<{ active: boolean; tier?: string; until?: string; seconds_left?: number } | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) setAvatarUrl(user.user_metadata?.avatar_url as string | undefined);
  }, [user]);

  useEffect(() => {
    if (!token) return;
    api.getPaddockPassStatus(token).then(setPass).catch(() => setPass(null));
  }, [token]);

  // Abonnement Stripe en cours (et non un Paddock Pass ou une offre offerte).
  const hasStripeSubscription = (tier === "racer" || tier === "team") && (status === "active" || status === "trialing" || status === "past_due");
  const onPass = !!pass?.active;

  const stats = useMemo(() => {
    const laps = data.sessions.reduce((a, s) => a + s.lapsCount, 0);
    const scores = data.sessions.map((s) => s.score).filter((v) => typeof v === "number" && v > 0);
    return {
      sessions: data.sessions.length,
      laps,
      circuits: data.records.length,
      bestScore: scores.length ? Math.max(...scores) : null,
    };
  }, [data.sessions, data.records]);

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("L'image doit faire moins de 2 Mo.");
      return;
    }
    try {
      setUploading(true);
      setError(null);
      setAvatarUrl(await uploadAvatar(user.id, file));
      toast.success("Photo mise à jour");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi de la photo impossible.");
    } finally {
      setUploading(false);
    }
  };

  // « Gérer mon offre » : le portail Stripe pour un abonnement payé ; sinon
  // (gratuit, Paddock Pass, offre offerte) ou si le portail échoue, la page
  // des offres. Avant, le bouton ne faisait rien quand il n'y avait pas
  // d'abonnement Stripe derrière.
  const manageOffer = async () => {
    if (!token) {
      navigate("/pricing");
      return;
    }
    try {
      setPortalLoading(true);
      const { portal_url } = await createPortalSession(token);
      if (portal_url) window.location.href = portal_url;
      else navigate("/pricing");
    } catch {
      toast.info("Aucun abonnement Stripe sur ce compte (offre gratuite, pass ou offerte) : voici les offres.");
      navigate("/pricing");
    } finally {
      setPortalLoading(false);
    }
  };

  const logout = async () => {
    const { error } = await signOut();
    if (error) setError("Déconnexion impossible, réessaie.");
    else navigate("/");
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertDescription>Connecte-toi pour voir ton profil.</AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  const displayName = (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "Pilote";
  const initials =
    displayName
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "P";
  const memberSince = user.created_at ? format(new Date(user.created_at), "MMMM yyyy", { locale: fr }) : null;
  const tierLabel = TIER_LABEL[tier] ?? "Rookie";
  const kart = data.kart;

  return (
    <Layout>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <PageMeta title="Mon profil | ApexAI" description="Ton offre, ton activité et ton matériel." path="/profile" />

      <div className="container mx-auto max-w-5xl space-y-5 px-4 pb-12 pt-6 md:space-y-6 md:pt-24">
        {/* Identité */}
        <PitCard accent="red" glow className="p-5 pt-6 md:p-7">
          <div className="flex items-center gap-4 md:gap-6">
            <button
              type="button"
              onClick={() => avatarInput.current?.click()}
              className="group relative shrink-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Changer ma photo"
            >
              <Avatar className="h-16 w-16 rounded-2xl border border-border md:h-20 md:w-20">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" /> : null}
                <AvatarFallback className="rounded-2xl bg-secondary font-display text-2xl font-bold text-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors group-hover:text-foreground">
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              </span>
              <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={onAvatar} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">{displayName}</h1>
                {user.email === ADMIN_EMAIL && <Slant accent="neutral">Admin</Slant>}
              </div>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              {memberSince && <p className="text-xs text-muted-foreground">Pilote ApexAI depuis {memberSince}</p>}
            </div>
          </div>
        </PitCard>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-5 md:grid-cols-2 md:gap-6">
          {/* Offre */}
          <Reveal>
            <PitCard accent={tier === "racer" || tier === "team" ? "red" : "neutral"} className="flex h-full flex-col p-5 pt-6">
              <SectionTitle>Ton offre</SectionTitle>
              {subLoading ? (
                <div className="mt-4 h-16 animate-pulse rounded-xl bg-secondary" />
              ) : (
                <>
                  <div className="mt-3 flex items-baseline gap-3">
                    <span className="font-display text-3xl font-bold tracking-tight text-gradient-primary">{tierLabel}</span>
                    {onPass && <Slant accent="red">Paddock Pass</Slant>}
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {onPass && pass?.until && (
                      <p>
                        Jusqu'au {format(new Date(pass.until), "d MMMM yyyy", { locale: fr })}
                        {pass.seconds_left != null ? `, encore ${formatTimeLeft(pass.seconds_left)}` : ""}.
                      </p>
                    )}
                    {hasStripeSubscription && (
                      <p>
                        Abonnement {billingPeriod === "annual" ? "annuel" : "mensuel"}
                        {subscriptionEndDate ? `, renouvelé le ${format(new Date(subscriptionEndDate), "d MMMM yyyy", { locale: fr })}` : ""}.
                      </p>
                    )}
                    {tier === "rookie" && !onPass && (
                      <p>
                        {limits?.analyses_used ?? 0} analyse{(limits?.analyses_used ?? 0) > 1 ? "s" : ""} ce mois
                        {limits?.analyses_per_month ? ` sur ${limits.analyses_per_month}` : ""}. Racer : analyses illimitées, Mon Kart et les réglages.
                      </p>
                    )}
                    {(tier === "racer" || tier === "team") && !onPass && !hasStripeSubscription && <p>Offre active sur ton compte.</p>}
                  </div>
                  <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row">
                    {tier === "rookie" && !onPass ? (
                      <Button asChild className="h-11 flex-1">
                        <Link to="/pricing">Passer à Racer</Link>
                      </Button>
                    ) : (
                      // Portail Stripe : changer d'offre, moyen de paiement, factures, résiliation.
                      <Button onClick={manageOffer} disabled={portalLoading} className="h-11 flex-1 gap-2">
                        {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Gérer mon abonnement
                      </Button>
                    )}
                    <Button variant="outline" asChild className="h-11 flex-1">
                      <Link to="/pricing">Voir les offres</Link>
                    </Button>
                  </div>
                </>
              )}
            </PitCard>
          </Reveal>

          {/* Activité */}
          <Reveal delay={0.05}>
            <PitCard className="h-full p-5 pt-6">
              <SectionTitle
                action={
                  <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
                    Tableau de bord
                  </Link>
                }
              >
                Ton activité
              </SectionTitle>
              <dl className="mt-4 grid grid-cols-2 gap-2">
                {[
                  { label: "Séances analysées", value: stats.sessions },
                  { label: "Tours analysés", value: stats.laps },
                  { label: "Circuits", value: stats.circuits },
                  { label: "Meilleur score", value: stats.bestScore ?? "—" },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl bg-secondary/60 px-3 py-3">
                    <dt className="text-xs text-muted-foreground">{m.label}</dt>
                    <dd className="mt-0.5 font-display text-2xl font-semibold tabular-nums text-foreground">
                      {data.loading ? <span className="inline-block h-6 w-10 animate-pulse rounded bg-secondary" /> : m.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </PitCard>
          </Reveal>
        </div>

        {/* Matériel */}
        <Reveal>
          <PitCard className="p-5 pt-6">
            <SectionTitle
              action={
                <Link to="/mon-kart" className="text-sm text-muted-foreground hover:text-foreground">
                  Mon Kart
                </Link>
              }
            >
              Ton matériel
            </SectionTitle>
            {kart ? (
              <dl className="mt-4 grid gap-2 sm:grid-cols-3">
                {[
                  {
                    icon: <Wrench />,
                    label: "Châssis",
                    value: [kart.setup_json?.chassis_brand, kart.setup_json?.chassis_model].filter(Boolean).join(" ") || "À renseigner",
                  },
                  { icon: <Zap />, label: "Moteur", value: kart.engine_model || "À renseigner" },
                  { icon: <Disc3 />, label: "Pneus", value: kart.tires_model || "À renseigner" },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-3 rounded-xl bg-secondary/60 px-3 py-3">
                    <span aria-hidden="true" className="text-primary [&>svg]:size-4">
                      {m.icon}
                    </span>
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">{m.label}</dt>
                      <dd className="truncate text-sm font-medium text-foreground">{m.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Déclare ton châssis, ton moteur et tes pneus : l'analyse et les réglages s'en servent.
                </p>
                <Button variant="outline" asChild className="h-11 shrink-0">
                  <Link to="/mon-kart">Configurer mon kart</Link>
                </Button>
              </div>
            )}
          </PitCard>
        </Reveal>

        {/* Dernières séances */}
        <Reveal>
          <section aria-labelledby="dernieres">
            <SectionTitle
              action={
                <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                  Toutes tes séances
                </Link>
              }
            >
              <span id="dernieres">Dernières séances</span>
            </SectionTitle>
            <PitCard as="div" hatch={false} className="mt-3">
              {data.loading && !data.sessions.length ? (
                <div className="h-40 animate-pulse" />
              ) : data.sessions.length ? (
                <ul className="divide-y divide-border">
                  {data.sessions.slice(0, 5).map((s) => (
                    <li key={s.id}>
                      <Link
                        to={`/analysis/${s.id}`}
                        className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/60 active:bg-secondary/80"
                      >
                        <TrackOutline lat={s.lat} lon={s.lon} size={40} strokeWidth={2} className="text-foreground/70" />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">{s.circuit}</div>
                          <div className="truncate text-sm text-muted-foreground">
                            {formatShortDay(s.date)}, {SESSION_TYPE[s.type] ?? s.type}
                            {s.lapsCount ? `, ${s.lapsCount} tours` : ""}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-display text-base font-semibold tabular-nums text-foreground">{formatLap(s.best)}</div>
                          <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                            <Gauge className="h-3 w-3" />
                            {s.score}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">Aucune séance pour l'instant.</p>
                  <Button asChild className="h-11">
                    <Link to="/upload">
                      Analyser ma première séance <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </PitCard>
          </section>
        </Reveal>

        {/* Compte */}
        <Reveal>
          <PitCard hatch={false} className="p-5">
            <SectionTitle>Compte</SectionTitle>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Button variant="outline" asChild className="h-11 justify-start gap-2">
                <Link to="/parametres">
                  <Settings className="h-4 w-4" /> Paramètres
                </Link>
              </Button>
              <Button variant="outline" onClick={logout} className="h-11 justify-start gap-2 text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" /> Se déconnecter
              </Button>
            </div>
          </PitCard>
        </Reveal>
      </div>
    </Layout>
  );
}
