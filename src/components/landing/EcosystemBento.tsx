import { lazy, ReactNode, Suspense } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BellRing, CalendarDays, GaugeCircle, GraduationCap, LineChart, Sliders, Users, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { DemoTag, SectionHeading, SpotlightCard } from "./atoms";
import { NearView } from "./LazyOnView";
import { useInViewFlag } from "./hooks";

// Chaque aperçu est un module à part, téléchargé quand sa carte approche.
const KartPreview = lazy(() => import("./previews/KartPreview"));
const SetupPreview = lazy(() => import("./previews/SetupPreview"));
const CalendarPreview = lazy(() => import("./previews/CalendarPreview"));
const DeltaPreview = lazy(() => import("./previews/DeltaPreview"));

interface BentoCardProps {
  icon: React.ElementType;
  tag?: string;
  tagTone?: "primary" | "neutral";
  title: string;
  text: string;
  link?: { to: string; label: string };
  /** Hauteur réservée à l'aperçu avant son chargement. */
  minHeight: number;
  note?: string;
  /** Sur grand écran : texte à gauche, aperçu à droite. */
  split?: boolean;
  className?: string;
  children: (play: boolean) => ReactNode;
}

function BentoCard({ icon: Icon, tag, tagTone = "primary", title, text, link, minHeight, note, split, className, children }: BentoCardProps) {
  const [ref, play] = useInViewFlag<HTMLDivElement>({ threshold: 0.18 });
  return (
    <SpotlightCard className={className}>
      <div ref={ref} className="flex h-full flex-col p-5 md:p-6">
        <div className={cn("flex flex-1 flex-col", split && "lg:flex-row lg:items-center lg:gap-10")}>
          <div className={cn(split && "lg:w-[270px] lg:shrink-0")}>
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-[0_10px_24px_-10px_rgba(255,66,66,0.7)]">
                <Icon className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
              </span>
              {tag && (
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
                    tagTone === "primary"
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-white/15 bg-white/[0.04] text-muted-foreground"
                  )}
                >
                  {tag}
                </span>
              )}
            </div>

            <h3 className="mt-4 font-display text-xl font-bold tracking-tight text-foreground md:text-2xl">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
          </div>

          {/* L'aperçu illustre le texte voisin : les lecteurs d'écran le passent. */}
          <div aria-hidden="true" className={cn("mt-5 flex-1", split && "lg:mt-0 lg:min-w-0")}>
            <NearView minHeight={minHeight} className="h-full">
              <Suspense fallback={<div style={{ minHeight }} />}>{children(play)}</Suspense>
            </NearView>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          {note ? <DemoTag>{note}</DemoTag> : <span />}
          {link && (
            <Link
              to={link.to}
              className="group/link inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
            >
              {link.label}
              <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </SpotlightCard>
  );
}

const SOON = [
  {
    icon: Users,
    title: "Comparaison avec d'autres pilotes",
    text: "Compare tes trajectoires et tes courbes de vitesse avec celles d'autres pilotes pour voir précisément où tu perds du temps.",
  },
  {
    icon: BellRing,
    title: "Rappels d'entretien",
    text: "Des alertes dans ton calendrier pour planifier tes révisions moteur et tes vidanges au bon moment.",
  },
  {
    icon: GraduationCap,
    title: "Académie vidéo",
    text: "Des tutoriels d'ingénieurs de piste pour apprendre à mieux lire tes graphiques de télémétrie.",
  },
];

export default function EcosystemBento({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  return (
    <section id="ecosysteme" className="relative py-20 md:py-28">
      <div className="container mx-auto px-4">
        <SectionHeading
          eyebrow="Tout ton karting"
          icon={GaugeCircle}
          title={
            <>
              Ton karting. <span className="text-gradient-primary">Une seule app.</span>
            </>
          }
          sub="L'analyse est la porte d'entrée. Autour, ApexAI suit ton kart, prépare tes réglages et organise ta saison. Tout communique : ton calendrier connaît l'état de ton matériel."
        />

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-5">
          <BentoCard
            className="md:col-span-2 lg:col-span-1"
            icon={Wrench}
            tag="Offre Racer"
            title="Ton kart suivi à la pièce"
            text="Importe tes sessions : ApexAI compte les heures moteur, les tours de pneus, l'usure des freins et de la chaîne, et te prévient avant la casse."
            minHeight={560}
            note="Données d'exemple"
            link={{ to: "/mon-kart", label: "Découvrir Mon Kart" }}
          >
            {(play) => <KartPreview play={play} />}
          </BentoCard>

          <BentoCard
            icon={Sliders}
            tag="Offre Racer"
            title="Un réglage de base pour chaque session"
            text="Circuit, conditions, pneu monté : ApexAI propose pressions, géométrie et transmission, et t'explique le pourquoi de chaque choix."
            minHeight={520}
            note="Données d'exemple"
            link={{ to: "/setup", label: "Découvrir les Réglages" }}
          >
            {(play) => <SetupPreview play={play} />}
          </BentoCard>

          <BentoCard
            icon={CalendarDays}
            tag="Avec un compte gratuit"
            tagTone="neutral"
            title="Ta saison au même endroit"
            text="Courses, entraînements, coaching et échéances d'inscription : tout ce qui rythme ta saison, en vue mois ou en liste."
            minHeight={460}
            note="Exemples d'événements"
            link={isAuthenticated ? { to: "/calendrier", label: "Ouvrir le calendrier" } : { to: "/login?mode=signup", label: "Créer mon compte" }}
          >
            {(play) => <CalendarPreview play={play} />}
          </BentoCard>

          <BentoCard
            className="md:col-span-2 lg:col-span-3"
            split
            icon={LineChart}
            title="Compare deux tours, mètre par mètre"
            text="Superpose deux tours : la courbe monte quand tu perds du temps, et la carte te montre exactement où."
            minHeight={250}
            note="Session de démo · Adria Karting Raceway"
          >
            {(play) => <DeltaPreview play={play} />}
          </BentoCard>
        </div>

        {/* Ce qui arrive */}
        <div className="mt-5 rounded-3xl border border-dashed border-white/15 bg-white/[0.015] p-5 md:p-7">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            Prochainement
          </p>
          <ul className="mt-4 grid gap-4 md:grid-cols-3 md:gap-6">
            {SOON.map((s) => (
              <li key={s.title} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                  <s.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{s.title}</h4>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{s.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
