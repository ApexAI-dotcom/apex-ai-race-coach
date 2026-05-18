"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Sparkles as SparklesIcon, Flag, Zap, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sparkles as SparklesComp } from "@/components/ui/sparkles";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import NumberFlow from "@/components/ui/number-flow";
import { cn } from "@/lib/utils";

interface PricingSectionProps {
  onSubscribe?: (planId: string) => void;
  currentPlanId?: string;
  loadingPriceId?: string | null;
  period?: "monthly" | "annual";
  setPeriod?: (period: "monthly" | "annual") => void;
  isAuthenticated?: boolean;
}

const plans = [
  {
    id: "rookie",
    name: "Rookie",
    description: "Parfait pour s'initier à l'analyse de données IA et commencer à progresser.",
    price: 0,
    yearlyPrice: 0,
    buttonText: "Gratuit",
    icon: Flag,
    popular: false,
    includes: [
      "3 analyses par mois",
      "1 seul circuit (mémorisé)",
      "Tracé de piste + 1 graphique",
      "Score global /100",
      "2 conseils de coaching IA",
      "Comparaison de sessions",
    ],
  },
  {
    id: "racer",
    name: "Racer",
    description: "Le plan idéal pour les pilotes réguliers qui veulent performer à chaque session.",
    price: 9.9,
    yearlyPrice: 99,
    buttonText: "S'abonner",
    popular: true,
    icon: Zap,
    includes: [
      "Analyses de tours illimitées",
      "Tous les circuits détectés",
      "Tous les graphiques IA avancés",
      "Score de performance par virage",
      "4 conseils personnalisés par tour",
      "Cockpit virtuel 'Mon Kart'",
      "Recommandations de réglages IA",
      "Suivi d'entretien mécanique",
    ],
  },
  {
    id: "team",
    name: "Team",
    description: "Conçu pour les écuries, équipes et coachs de karting.",
    price: 24.9,
    yearlyPrice: 249,
    buttonText: "Bientôt disponible",
    icon: Trophy,
    popular: false,
    comingSoon: true,
    includes: [
      "Tout le plan Racer",
      "5 pilotes inclus",
      "Dashboard Équipe",
      "Comparaison entre pilotes",
      "Objectifs personnalisés",
    ],
  },
];

const PricingSwitch = ({
  selected,
  onSwitch,
}: {
  selected: string;
  onSwitch: (value: string) => void;
}) => {
  return (
    <div className="flex justify-center">
      <div className="relative z-10 mx-auto flex w-fit rounded-full bg-secondary border border-white/5 p-1">
        <button
          onClick={() => onSwitch("0")}
          className={cn(
            "relative z-10 w-fit h-10 rounded-full sm:px-6 px-4 sm:py-2 py-1 font-medium transition-colors text-sm",
            selected === "0" ? "text-white" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {selected === "0" && (
            <motion.span
              layoutId="pricing-switch-bg"
              className="absolute inset-0 rounded-full gradient-primary shadow-lg shadow-primary/30"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative">Mensuel</span>
        </button>

        <button
          onClick={() => onSwitch("1")}
          className={cn(
            "relative z-10 w-fit h-10 flex-shrink-0 rounded-full sm:px-6 px-4 sm:py-2 py-1 font-medium transition-colors text-sm",
            selected === "1" ? "text-white" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {selected === "1" && (
            <motion.span
              layoutId="pricing-switch-bg"
              className="absolute inset-0 rounded-full gradient-primary shadow-lg shadow-primary/30"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative flex items-center gap-2">
            Annuel
            <span className="rounded-full bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5">
              -17%
            </span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default function PricingSection4({
  onSubscribe = () => {},
  currentPlanId = "rookie",
  loadingPriceId = null,
  period = "monthly",
  setPeriod = () => {},
  isAuthenticated = false,
}: PricingSectionProps) {
  // Use selected state mapping "0" -> monthly ("monthly"), "1" -> yearly ("annual")
  const switchSelected = period === "annual" ? "1" : "0";
  const isYearly = period === "annual";
  const pricingRef = useRef<HTMLDivElement>(null);

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.15,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -20,
      opacity: 0,
    },
  };

  const handleSwitchChange = (value: string) => {
    setPeriod(value === "1" ? "annual" : "monthly");
  };

  return (
    <div className="w-full mx-auto relative bg-[#0a0a0b] overflow-x-hidden py-12" ref={pricingRef}>
      <TimelineContent
        animationNum={4}
        timelineRef={pricingRef}
        customVariants={revealVariants}
        className="absolute inset-0 w-full h-full [mask-image:radial-gradient(ellipse_at_center,white_10%,transparent_65%)] pointer-events-none z-0"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:65px_65px]"></div>
        <SparklesComp
          density={1200}
          direction="bottom"
          speed={0.8}
          color="#f97316"
          className="absolute inset-0 h-full w-full opacity-30"
        />
      </TimelineContent>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_center,hsl(var(--primary)/0.12)_0%,transparent_60%)] pointer-events-none z-0" />

      <article className="text-center mb-16 pt-16 max-w-3xl mx-auto space-y-4 relative z-10 px-4">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight flex flex-wrap justify-center gap-x-2.5 gap-y-1">
          <VerticalCutReveal
            splitBy="words"
            staggerDuration={0.08}
            staggerFrom="first"
            reverse={true}
            containerClassName="justify-center"
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 30,
              delay: 0,
            }}
          >
            Le plan parfait pour une progression
          </VerticalCutReveal>
          <span className="text-gradient-primary">intelligente</span>
        </h2>

        <TimelineContent
          as="p"
          animationNum={0}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed font-light"
        >
          Rejoignez des centaines de pilotes de karting et optimisez vos trajectoires grâce à la
          puissance de notre IA.
        </TimelineContent>

        <TimelineContent
          as="div"
          animationNum={1}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="pt-4"
        >
          <PricingSwitch selected={switchSelected} onSwitch={handleSwitchChange} />
        </TimelineContent>
      </article>

      <div
        className="absolute top-1/4 left-[10%] right-[10%] w-[80%] h-[350px] z-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at center, hsl(var(--primary) / 0.08) 0%, transparent 70%)`,
          mixBlendMode: "screen",
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 max-w-5xl gap-6 md:gap-8 px-4 py-6 mx-auto relative z-10">
        {plans.map((plan, index) => {
          const isRookie = plan.id === "rookie";
          const isCurrent = currentPlanId === plan.id && isAuthenticated;
          const isLower = !isRookie && currentPlanId === "team" && plan.id === "racer";

          const priceId = isRookie ? null : isYearly ? `${plan.id}_annual` : `${plan.id}_monthly`;
          const isLoadingThisPrice = loadingPriceId !== null && loadingPriceId === priceId;

          let buttonLabel = plan.buttonText;
          if (plan.comingSoon) {
            buttonLabel = "Bientôt disponible";
          } else if (isLoadingThisPrice) {
            buttonLabel = "Redirection...";
          } else if (isCurrent) {
            buttonLabel = "Plan actuel";
          } else if (isLower) {
            buttonLabel = "Inclus dans l'offre";
          } else if (isRookie && isAuthenticated) {
            buttonLabel = "Gratuit";
          } else if (isRookie && !isAuthenticated) {
            buttonLabel = "Inscris-toi";
          } else {
            buttonLabel = "S'abonner";
          }

          const buttonDisabled =
            plan.comingSoon ||
            (isRookie && isAuthenticated) ||
            isCurrent ||
            isLower ||
            loadingPriceId !== null;

          const IconComponent = plan.icon;

          return (
            <TimelineContent
              key={plan.name}
              as="div"
              animationNum={2 + index}
              timelineRef={pricingRef}
              customVariants={revealVariants}
              className="h-full"
            >
              <Card
                className={cn(
                  "relative text-white border-white/5 flex flex-col h-full bg-[#111113]/80 backdrop-blur-xl transition-all duration-300 rounded-2xl",
                  plan.popular
                    ? "border-primary/20 bg-gradient-to-b from-[#161619] to-[#111113] shadow-[0_20px_50px_rgba(249,115,22,0.1)] ring-1 ring-primary/20 scale-[1.02] md:scale-105"
                    : "hover:border-white/10 hover:bg-[#131316]/90"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 py-1 px-3.5 text-[10px] sm:text-xs font-bold rounded-full gradient-primary text-white shadow-lg shadow-primary/35 uppercase tracking-wider">
                      <SparklesIcon className="w-3.5 h-3.5 shrink-0" />
                      Le plus populaire
                    </span>
                  </div>
                )}

                <CardHeader className="text-left p-6 sm:p-8 flex flex-col flex-none">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 shadow-sm",
                        plan.popular
                          ? "bg-primary/10 text-primary"
                          : "bg-white/5 text-muted-foreground"
                      )}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-white">{plan.name}</h3>
                  </div>

                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-display font-bold text-white">
                      <NumberFlow
                        value={isYearly ? plan.yearlyPrice : plan.price}
                        className="text-4xl font-display font-bold"
                      />
                      €
                    </span>
                    <span className="text-muted-foreground text-sm ml-1.5 font-light">
                      {isRookie ? "" : isYearly ? "/an" : "/mois"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed font-light min-h-[40px]">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="p-6 sm:p-8 pt-0 flex-1 flex flex-col justify-between">
                  <div className="w-full">
                    <button
                      onClick={() => !buttonDisabled && onSubscribe(plan.id)}
                      disabled={buttonDisabled}
                      className={cn(
                        "w-full mb-8 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]",
                        plan.comingSoon
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                          : isCurrent || isLower || (isRookie && isAuthenticated)
                            ? "bg-secondary text-muted-foreground/60 cursor-not-allowed border border-white/5"
                            : plan.popular
                              ? "gradient-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/30"
                              : "bg-secondary text-foreground border border-white/10 hover:bg-secondary/80"
                      )}
                    >
                      {isLoadingThisPrice ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Redirection...
                        </>
                      ) : (
                        buttonLabel
                      )}
                    </button>

                    <div className="space-y-4 pt-6 border-t border-white/5">
                      <ul className="space-y-3">
                        {plan.includes.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start gap-3 text-left">
                            <span className="h-4 w-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 grid place-content-center mt-0.5 shrink-0">
                              <Check className="w-2.5 h-2.5 text-emerald-500" />
                            </span>
                            <span className="text-sm text-muted-foreground font-light">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TimelineContent>
          );
        })}
      </div>
    </div>
  );
}
