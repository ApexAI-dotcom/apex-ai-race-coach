import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageMeta } from "@/components/seo/PageMeta";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription.tsx";
import { createCheckoutSession } from "@/lib/api";
import { Check, X, Zap, Trophy, CreditCard, Lock, Loader2, Flag, Car } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PricingSection4 from "@/components/ui/pricing-section-4";

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
      { text: "Comparaison sessions", included: true },
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
      { text: "Cockpit 'Mon Kart'", included: true },
      { text: "Recommandations Réglages IA", included: true },
      { text: "Suivi Entretien Mécanique", included: true },
      { text: "Comparateur de sessions", included: true },
      { text: "Objectifs personnalisés", included: true },
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
function isCurrentPlan(
  planId: string,
  currentPlan: string | undefined,
  hasUser: boolean = true
): boolean {
  if (!hasUser) return false;
  if (!currentPlan) return planId === "rookie";
  if (currentPlan === "free") return planId === "rookie";
  if (currentPlan === "pro") return planId === "racer";
  if (currentPlan === "team") return planId === "team";
  return false;
}

export default function PricingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
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
      if (!user) window.location.href = "/login?mode=signup";
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

          {/* Custom Pricing Section */}
          <PricingSection4
            onSubscribe={handleSubscribe}
            currentPlanId={currentPlanId}
            loadingPriceId={loadingPriceId}
            period={period}
            setPeriod={setPeriod}
            isAuthenticated={!!user}
          />

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
