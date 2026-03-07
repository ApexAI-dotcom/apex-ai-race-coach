import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageMeta } from "@/components/seo/PageMeta";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
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
      { text: "1 circuit, 1 voiture", included: true },
      { text: "Score global /100", included: true },
      { text: "Export CSV", included: false },
      { text: "Comparaison pilotes", included: false },
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
      { text: "Circuits et voitures illimités", included: true },
      { text: "Score détaillé par virage", included: true },
      { text: "Export CSV", included: true },
      { text: "Comparaison pilotes", included: false },
    ],
    icon: Car,
    popular: true,
  },
  {
    id: "team",
    name: "Team",
    monthlyPrice: 24.9,
    annualPrice: 249,
    features: [
      { text: "Tout Racer", included: true },
      { text: "5 pilotes inclus", included: true },
      { text: "Comparaison pilotes", included: true },
      { text: "Export CSV + PDF", included: true },
      { text: "Tableau de bord équipe", included: true },
    ],
    icon: Trophy,
    popular: false,
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
function isCurrentPlan(planId: string, currentPlan: string | undefined): boolean {
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

  const { user } = useAuth();
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
    const priceId = getPriceId(planId, period);
    if (!priceId || !user?.id) {
      if (!user) window.location.href = "/login?redirect=/pricing";
      return;
    }
    setError(null);
    setLoadingPriceId(priceId);
    try {
      const { checkout_url } = await createCheckoutSession(user.id, priceId);
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
            <div className="inline-flex items-center gap-3 p-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <button
                type="button"
                onClick={() => setPeriod("monthly")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  period === "monthly"
                    ? "bg-slate-700 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
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
                    : "text-slate-400 hover:text-slate-200"
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
              const isCurrent = isCurrentPlan(planItem.id, currentPlan);
              const isLower = !isRookie && isLowerPlan(planItem.id, currentPlanId);
              const canSubscribe = !isRookie && isUpgrade(planItem.id, currentPlanId);
              const Icon = planItem.icon;
              const priceId = getPriceId(planItem.id, period);

              const buttonDisabled =
                isRookie ||
                isCurrent ||
                isLower ||
                (loadingPriceId !== null && priceId !== null && loadingPriceId === priceId);

              let buttonLabel: string;
              if (loadingPriceId === priceId) buttonLabel = "Redirection...";
              else if (isRookie) buttonLabel = "Gratuit";
              else if (isCurrent) buttonLabel = "Plan actuel";
              else if (isLower) buttonLabel = "Inclus";
              else buttonLabel = "S'abonner";

              return (
                <div
                  key={planItem.id}
                  className={`relative rounded-2xl border bg-slate-900/60 backdrop-blur-sm overflow-hidden ${
                    planItem.popular
                      ? "border-primary/60 shadow-lg shadow-primary/10 ring-1 ring-primary/30"
                      : "border-slate-700/60"
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
                      <Icon className="w-6 h-6 text-orange-500" />
                      <h2 className="text-xl font-bold text-white">{planItem.name}</h2>
                    </div>

                    <div className="mb-6">
                      <span className="text-3xl font-bold text-white">
                        {price === 0 ? "0" : price.toFixed(2).replace(".", ",")}€
                      </span>
                      <span className="text-slate-400 text-sm ml-1">
                        {price === 0 ? "" : period === "annual" ? "/an" : "/mois"}
                      </span>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {planItem.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm">
                          {f.included ? (
                            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-slate-600 flex-shrink-0" />
                          )}
                          <span className={f.included ? "text-slate-300" : "text-slate-500"}>
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
                        isRookie
                          ? "bg-secondary text-muted-foreground cursor-not-allowed"
                          : isCurrent || isLower
                            ? "bg-secondary text-muted-foreground cursor-not-allowed"
                            : planItem.popular
                              ? "gradient-primary text-primary-foreground hover:opacity-90"
                              : "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
                      }`}
                    >
                      {isRookie ? (
                        "Gratuit"
                      ) : loadingPriceId !== null && loadingPriceId === priceId ? (
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
          <div className="text-center py-8 border-t border-slate-800">
            <p className="text-slate-500 text-sm mb-3">Paiement sécurisé par Stripe</p>
            <div className="flex justify-center items-center gap-6 text-slate-600">
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
