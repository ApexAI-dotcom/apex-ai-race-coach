import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageMeta } from "@/components/seo/PageMeta";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription.tsx";
import { createCheckoutSession } from "@/lib/api";
import {
  Check,
  X,
  Zap,
  Trophy,
  CreditCard,
  Lock,
  Loader2,
  Flag,
  Car,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type BillingPeriod = "monthly" | "annual";
type PriceKey = "racer_monthly" | "racer_annual" | "team_monthly" | "team_annual";

const PLANS = [
  {
    id: "rookie",
    name: "Rookie",
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      { text: "3 analyses par mois", included: true },
      { text: "1 seul circuit (mémorisé)", included: true },
      { text: "Tracé + 1 graphique", included: true },
      { text: "Score global /100", included: true },
      { text: "2 conseils de coaching", included: true },
      { text: "Comparaison sessions", included: false },
    ],
    icon: Flag,
    popular: false,
  },
  {
    id: "racer",
    name: "Racer",
    monthlyPrice: 9.9,
    annualPrice: 99,
    features: [
      { text: "Analyses illimitées", included: true },
      { text: "Tous les circuits Détectés", included: true },
      { text: "Tous les graphiques IA", included: true },
      { text: "Score par virage", included: true },
      { text: "4 conseils personnalisés", included: true },
      { text: "Système de dossiers", included: true },
      { text: "Comparateur de sessions", included: true },
      { text: "Objectifs personnalisés", included: true },
      { text: "Rapport PDF complet", included: true },
    ],
    icon: Zap,
    popular: true,
  },
  {
    id: "team",
    name: "Team",
    monthlyPrice: 24.9,
    annualPrice: 249,
    features: [
      { text: "Tout le plan Racer", included: true },
      { text: "5 pilotes inclus", included: true },
      { text: "Dashboard Équipe", included: true },
      { text: "Comparaison entre pilotes", included: true },
      { text: "Objectifs personnalisés", included: true },
    ],
    icon: Trophy,
    popular: false,
    comingSoon: true,
  },
] as const;

const TIER_ORDER = ["rookie", "racer", "team"] as const;
function isUpgrade(planId: string, currentPlanId: string): boolean {
  const a = TIER_ORDER.indexOf(planId as (typeof TIER_ORDER)[number]);
  const b = TIER_ORDER.indexOf(currentPlanId as (typeof TIER_ORDER)[number]);
  return a > b;
}
function isLowerPlan(planId: string, currentPlanId: string): boolean {
  const a = TIER_ORDER.indexOf(planId as (typeof TIER_ORDER)[number]);
  const b = TIER_ORDER.indexOf(currentPlanId as (typeof TIER_ORDER)[number]);
  return a < b;
}
function planToPlanId(plan: string): string {
  if (plan === "free") return "rookie";
  if (plan === "pro") return "racer";
  if (plan === "team") return "team";
  return "rookie";
}

function getPriceId(planId: string, period: BillingPeriod): PriceKey | null {
  if (planId === "rookie") return null;
  if (planId === "racer") return period === "annual" ? "racer_annual" : "racer_monthly";
  if (planId === "team") return period === "annual" ? "team_annual" : "team_monthly";
  return null;
}

/** Map subscription plan (free/pro/team) to plan id (rookie/racer/team) for "Plan actuel" */
function isCurrentPlan(planId: string, currentPlan: string | undefined, hasUser: boolean = true): boolean {
  if (!hasUser) return false;
  if (!currentPlan) return planId === "rookie";
  if (currentPlan === "free") return planId === "rookie";
  if (currentPlan === "pro") return planId === "racer";
  if (currentPlan === "team") return planId === "team";
  return false;
}

export default function PricingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [period, setPeriod] = useState<BillingPeriod>("annual");
  const [loadingPriceId, setLoadingPriceId] = useState<PriceKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { user, session } = useAuth();
  const { plan: currentPlan } = useSubscription();
  const currentPlanId = planToPlanId(currentPlan ?? "free");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    setLoadingPriceId(null);
  }, []);

  useEffect(() => {
    if (canceled === "true") {
      const t = setTimeout(() => setSearchParams({}), 5000);
      return () => clearTimeout(t);
    }
  }, [canceled, setSearchParams]);

  const handleSubscribe = async (planId: string) => {
    if (planId === "team") {
      setError("L'offre Team arrive bientôt.");
      return;
    }

    const priceId = getPriceId(planId, period);
    const token = session?.access_token;
    if (!priceId || !user?.id || !token) {
      if (!user) window.location.href = "/login?mode=register";
      return;
    }
    setError(null);
    setLoadingPriceId(priceId);
    try {
      const { checkout_url } = await createCheckoutSession(token, priceId);
      if (checkout_url) window.location.href = checkout_url;
      else setError("Réponse serveur invalide.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur lors de la création de la session.";
      setError(msg);
      setLoadingPriceId(null);
    } finally {
      setLoadingPriceId(null);
    }
  };

  const isRedirecting = loadingPriceId !== null;

  return (
    <Layout>
      {/* Overlay pendant redirection Stripe Checkout */}
      {isRedirecting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-white font-medium">Redirection vers Stripe…</p>
          <p className="text-sm text-slate-400">Ne fermez pas cette page.</p>
        </div>
      )}
      <PageMeta
        title="Tarifs ApexAI | Rookie, Racer, Team"
        description="Choisissez votre plan : Rookie gratuit, Racer illimité, Team avec comparaison. Paiement sécurisé Stripe."
        path="/pricing"
      />
      <div className="min-h-screen bg-[#0a0a0b] text-slate-100">
        <div className="container mx-auto px-4 py-12 md:py-16">
          {canceled === "true" && (
            <Alert className="mb-8 border-amber-500/40 bg-amber-500/10 max-w-xl mx-auto">
              <X className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-500">Paiement annulé</AlertTitle>
              <AlertDescription className="text-amber-500/90">
                Vous pouvez réessayer quand vous le souhaitez.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-8 border-red-500/40 bg-red-500/10 max-w-xl mx-auto">
              <X className="h-4 w-4 text-red-500" />
              <AlertTitle className="text-red-500">Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-bold text-3xl md:text-4xl text-white mb-3">
              Tarifs <span className="text-gradient-primary">ApexAI</span>
            </h1>
            <p className="text-slate-400 max-w-lg mx-auto mb-8">
              Choisissez le plan adapté à votre pratique. Paiement sécurisé, annulable à tout moment.
            </p>

            {/* Toggle Mensuel / Annuel */}
            <div className="inline-flex items-center gap-3 p-1.5 glass-card">
              <button
                type="button"
                onClick={() => setPeriod("monthly")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  period === "monthly"
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mensuel
              </button>
              <button
                type="button"
                onClick={() => setPeriod("annual")}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  period === "annual"
                    ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annuel
                <span className="absolute -top-2 -right-2 rounded-full bg-primary/90 text-primary-foreground text-xs font-semibold px-1.5 py-0.5">
                  -17%
                </span>
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto mb-16">
            {PLANS.map((planItem) => {
              const price = period === "annual" ? planItem.annualPrice : planItem.monthlyPrice;
              const isRookie = planItem.id === "rookie";
              const isCurrent = isCurrentPlan(planItem.id, currentPlan, !!user);
              const isLower = !isRookie && isLowerPlan(planItem.id, currentPlanId);
              const canSubscribe = isRookie ? !user : isUpgrade(planItem.id, currentPlanId);
              const Icon = planItem.icon;
              const priceId = getPriceId(planItem.id, period);

              const isComingSoon = (planItem as any).comingSoon;

              let buttonLabel: string;
              if (isComingSoon) buttonLabel = "Bientôt disponible";
              else if (loadingPriceId !== null && loadingPriceId === priceId) buttonLabel = "Redirection...";
              else if (!user && isRookie) buttonLabel = "Inscris-toi";
              else if (isRookie) buttonLabel = "Gratuit";
              else if (isCurrent) buttonLabel = "Plan actuel";
              else if (isLower) buttonLabel = "Inclus";
              else buttonLabel = "S'abonner";

              const buttonDisabled =
                isComingSoon ||
                (isRookie && !!user) ||
                isCurrent ||
                isLower ||
                (loadingPriceId !== null && priceId !== null && loadingPriceId === priceId);

              return (
                <div
                  key={planItem.id}
                  className={`relative glass-card overflow-hidden ${
                    planItem.popular
                      ? "border-primary/30 shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                      : ""
                  }`}
                >
                  {planItem.popular && (
                    <div className="absolute top-2 right-2">
                      <span className="py-0.5 px-2 text-xs font-medium rounded bg-primary/90 text-primary-foreground">
                        Le plus populaire
                      </span>
                    </div>
                  )}
                  <div className={`p-6 md:p-8 ${planItem.popular ? "pt-8" : ""}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-6 h-6 text-primary" />
                      <h2 className="text-xl font-bold text-foreground">{planItem.name}</h2>
                    </div>

                    <div className="mb-6">
                      <span className="text-3xl font-bold text-foreground">
                        {price === 0 ? "0" : price.toFixed(2).replace(".", ",")}€
                      </span>
                      <span className="text-muted-foreground text-sm ml-1">
                        {price === 0 ? "" : period === "annual" ? "/an" : "/mois"}
                      </span>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {planItem.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm">
                          {f.included ? (
                            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className={f.included ? "text-foreground" : "text-muted-foreground"}>
                            {f.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={() => canSubscribe && handleSubscribe(planItem.id)}
                      disabled={buttonDisabled}
                      className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                        isComingSoon
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                          : (isRookie && !!user)
                            ? "bg-secondary text-muted-foreground cursor-not-allowed"
                            : isCurrent || isLower
                              ? "bg-secondary text-muted-foreground cursor-not-allowed"
                              : planItem.popular
                                ? "gradient-primary text-primary-foreground hover:opacity-90"
                                : "gradient-primary text-primary-foreground hover:opacity-90 border border-primary/50"
                      }`}
                    >
                      {(isRookie && !!user) ? (
                        "Gratuit"
                      ) : (loadingPriceId !== null && loadingPriceId === priceId) ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Redirection...
                        </>
                      ) : (
                        buttonLabel
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paiement sécurisé */}
          <div className="text-center py-8 border-t border-border">
            <p className="text-muted-foreground text-sm mb-3">Paiement sécurisé par Stripe</p>
            <div className="flex justify-center items-center gap-6 text-muted-foreground">
              <CreditCard className="w-6 h-6" />
              <Lock className="w-6 h-6" />
              <Check className="w-6 h-6 text-emerald-600/80" />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
