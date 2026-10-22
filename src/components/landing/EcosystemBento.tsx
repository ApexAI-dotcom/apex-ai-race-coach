import { lazy, ReactNode, Suspense } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DemoTag, SectionHeading } from "./atoms";
import { NearView } from "./LazyOnView";
import { TiltCard } from "./TiltCard";

// Chaque écran est un module à part, téléchargé quand on s'en approche. Ce sont
// les vrais composants de l'app (schéma du kart, carte Pneumatiques, vue mois),
// pas des copies : le visiteur voit ce qu'il aura dans l'app.
const KartPanel = lazy(() => import("./previews/KartPanel"));
const SetupPanel = lazy(() => import("./previews/SetupPanel"));
const CalendarPanel = lazy(() => import("./previews/CalendarPanel"));

const SOON = [
  {
    title: "Comparaison avec d'autres pilotes",
    text: "Compare tes trajectoires et tes courbes de vitesse avec celles d'autres pilotes pour voir précisément où tu perds du temps.",
  },
  {
    title: "Rappels d'entretien",
    text: "Des alertes dans ton calendrier pour planifier tes révisions moteur et tes vidanges au bon moment.",
  },
  {
    title: "Académie vidéo",
    text: "Des tutoriels d'ingénieurs de piste pour apprendre à mieux lire tes graphiques de télémétrie.",
  },
];

const TRIGGER =
  "-mb-px rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-0 text-sm font-medium text-muted-foreground shadow-none transition-colors " +
  "hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none";

interface PanelProps {
  value: string;
  tag: string;
  title: string;
  text: string;
  link: { to: string; label: string };
  minHeight: number;
  note: string;
  children: ReactNode;
}

function Panel({ value, tag, title, text, link, minHeight, note, children }: PanelProps) {
  return (
    <TabsContent value={value} className="mt-10 lg:mt-14">
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-14">
        <div className="mx-auto max-w-md text-center lg:mx-0 lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{tag}</p>
          <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h3>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{text}</p>
          <Link
            to={link.to}
            className="group mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            {link.label}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>

        <div>
          {/* Une carte légèrement inclinée, qui suit la souris (écran large seulement) */}
          <TiltCard rest={{ x: 1, y: 2 }} range={2} glare={false}>
            <NearView minHeight={minHeight}>
              <Suspense fallback={<div style={{ minHeight }} />}>{children}</Suspense>
            </NearView>
          </TiltCard>
          <DemoTag className="mt-3 text-center">{note}</DemoTag>
        </div>
      </div>
    </TabsContent>
  );
}

export default function EcosystemBento({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  return (
    <section id="ecosysteme" className="relative py-20 md:py-28">
      <div className="container mx-auto px-4">
        <SectionHeading
          eyebrow="Tout ton karting"
          title={
            <>
              Ton karting. <span className="text-gradient-primary">Une seule app.</span>
            </>
          }
          sub="L'analyse est la porte d'entrée. Autour, ApexAI suit ton kart, prépare tes réglages et organise ta saison. Tout communique : ton calendrier connaît l'état de ton matériel."
        />

        <Tabs defaultValue="kart" className="mt-12 lg:mt-16">
          <TabsList className="mx-auto flex h-auto w-full max-w-md justify-center gap-8 rounded-none border-b border-white/10 bg-transparent p-0">
            <TabsTrigger value="kart" className={TRIGGER}>
              Mon Kart
            </TabsTrigger>
            <TabsTrigger value="reglages" className={TRIGGER}>
              Réglages
            </TabsTrigger>
            <TabsTrigger value="calendrier" className={TRIGGER}>
              Calendrier
            </TabsTrigger>
          </TabsList>

          <Panel
            value="kart"
            tag="Offre Racer"
            title="Ton kart suivi à la pièce"
            text="Importe tes sessions : ApexAI compte les heures moteur, les tours de pneus, l'usure des freins et de la chaîne, et te prévient avant la casse."
            link={{ to: "/mon-kart", label: "Découvrir Mon Kart" }}
            minHeight={640}
            note="Données d'exemple"
          >
            <KartPanel />
          </Panel>

          <Panel
            value="reglages"
            tag="Offre Racer"
            title="Un réglage de base pour chaque session"
            text="Circuit, conditions, pneu monté : ApexAI propose pressions, géométrie et transmission, et t'explique le pourquoi de chaque choix."
            link={{ to: "/setup", label: "Découvrir les Réglages" }}
            minHeight={640}
            note="Valeurs de base · change la météo, clique sur une recommandation pour lire l'explication"
          >
            <SetupPanel />
          </Panel>

          <Panel
            value="calendrier"
            tag="Avec un compte gratuit"
            title="Ta saison au même endroit"
            text="Courses, entraînements, coaching et échéances d'inscription : tout ce qui rythme ta saison, en vue mois ou en liste."
            link={
              isAuthenticated
                ? { to: "/calendrier", label: "Ouvrir le calendrier" }
                : { to: "/login?mode=signup", label: "Créer mon compte" }
            }
            minHeight={460}
            note="Exemples d'événements"
          >
            <CalendarPanel />
          </Panel>
        </Tabs>

        {/* Ce qui arrive : une simple liste, sans date promise */}
        <div className="mt-16 border-t border-white/10 pt-8 md:mt-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Prochainement</p>
          <ul className="mt-5 grid gap-6 md:grid-cols-3 md:gap-10">
            {SOON.map((s) => (
              <li key={s.title}>
                <h4 className="text-sm font-semibold text-foreground">{s.title}</h4>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
