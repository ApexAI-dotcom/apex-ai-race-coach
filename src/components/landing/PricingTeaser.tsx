import { Link } from "react-router-dom";
import { ArrowRight, Check, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionHeading, SpotlightCard } from "./atoms";

/**
 * Aperçu des offres — les mêmes que la page Tarifs (Rookie gratuit, Racer).
 * L'offre Team n'est volontairement pas mise en avant ici.
 */

interface PricingTeaserProps {
  isAuthenticated?: boolean;
}

const ROOKIE = ["3 analyses par mois", "Score global /100", "2 conseils de coaching", "1 circuit mémorisé", "Comparaison de sessions"];
const RACER = [
  "Analyses illimitées",
  "Tous les graphiques IA et score par virage",
  "4 conseils personnalisés",
  "Mon Kart et suivi d'entretien",
  "Recommandations de réglages IA",
];

function Bullets({ items, accent }: { items: string[]; accent?: boolean }) {
  return (
    <ul className="mt-5 space-y-2.5">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2.5 text-sm text-foreground/90">
          <Check className={cn("mt-0.5 h-4 w-4 shrink-0", accent ? "text-primary" : "text-emerald-400")} aria-hidden="true" />
          {t}
        </li>
      ))}
    </ul>
  );
}

export default function PricingTeaser({ isAuthenticated = false }: PricingTeaserProps) {
  return (
    <section id="tarifs" className="relative border-t border-border py-20 md:py-28">
      <div className="container mx-auto px-4">
        <SectionHeading
          eyebrow="Tarifs"
          icon={Tag}
          title={
            <>
              Commence gratuitement. <span className="text-gradient-primary">Passe à Racer</span> quand tu veux.
            </>
          }
          sub={
            isAuthenticated
              ? "Le plan Rookie reste gratuit : 3 analyses par mois. Racer débloque tout le reste."
              : "Ta première analyse est offerte, sans compte. Ensuite, le plan Rookie reste gratuit."
          }
        />

        <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-2 md:gap-5 lg:mt-14">
          <SpotlightCard>
            <div className="flex h-full flex-col p-6 md:p-8">
              <p className="font-display text-lg font-bold text-foreground">Rookie</p>
              <p className="mt-1 text-sm text-muted-foreground">Pour découvrir ApexAI</p>
              <p className="mt-5 flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-bold text-foreground">0 €</span>
                <span className="text-sm text-muted-foreground">gratuit</span>
              </p>
              <Bullets items={ROOKIE} />
              <div className="mt-auto pt-7">
                <Button asChild variant="heroOutline" size="lg" className="h-12 w-full rounded-xl">
                  <Link to={isAuthenticated ? "/upload" : "/login?mode=signup"}>
                    {isAuthenticated ? "Analyser une session" : "Créer mon compte"}
                  </Link>
                </Button>
              </div>
            </div>
          </SpotlightCard>

          <div className="relative rounded-3xl bg-gradient-to-b from-primary/60 via-primary/15 to-transparent p-px shadow-[0_30px_80px_-40px_rgba(255,66,66,0.55)]">
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(1.5rem-1px)] bg-[#0d0a0a] p-6 md:p-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_70%_100%_at_50%_0%,hsl(var(--primary)/0.16),transparent)]"
              />
              <div className="relative flex items-center justify-between">
                <p className="font-display text-lg font-bold text-foreground">Racer</p>
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  Tout débloqué
                </span>
              </div>
              <p className="relative mt-1 text-sm text-muted-foreground">Pour progresser toute la saison</p>
              <p className="relative mt-5 flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-bold text-foreground">9,90 €</span>
                <span className="text-sm text-muted-foreground">/ mois</span>
                <span className="ml-2 text-xs text-muted-foreground">ou 99 € par an</span>
              </p>
              <div className="relative">
                <Bullets items={RACER} accent />
              </div>
              <div className="relative mt-auto pt-7">
                <Button asChild variant="hero" size="lg" className="group h-12 w-full rounded-xl">
                  <Link to="/pricing">
                    Voir le plan Racer
                    <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/pricing" className="font-semibold text-primary hover:underline">
            Comparer toutes les offres
          </Link>
        </p>
      </div>
    </section>
  );
}
