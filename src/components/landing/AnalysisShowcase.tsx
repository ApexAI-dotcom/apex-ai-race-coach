import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DemoTag, SectionHeading } from "./atoms";
import { DEMO_LABEL } from "./data/demoLabel";
import { useInViewFlag } from "./hooks";
import { NearView } from "./LazyOnView";
import { TiltCard } from "./TiltCard";

// Les trois scènes sont des modules à part : rien n'est téléchargé tant que
// cette section n'approche pas de l'écran. La dernière est le VRAI résultat de l'app
// (carte, conseils, graphiques), alimenté par l'analyse d'une session de démo.
const ImportScene = lazy(() => import("./previews/ImportScene"));
const AnalyzingScene = lazy(() => import("./previews/AnalyzingScene"));
const ResultScene = lazy(() => import("./previews/ResultScene"));

const STEPS = [
  {
    n: "01",
    short: "Dépose",
    title: "Dépose ta session",
    text: "Glisse le fichier de ton boîtier AiM (.xrk). Pas de tableur, pas de réglage compliqué.",
    duration: 4800,
  },
  {
    n: "02",
    short: "Analyse",
    title: "L'IA décortique chaque virage",
    text: "Points de corde, freinages, vitesses de passage : tout est mesuré sur tes propres tours.",
    duration: 5400,
  },
  {
    n: "03",
    short: "Corrige",
    title: "Tu sais quoi corriger",
    text: "Ta carte du circuit, tes conseils de coaching classés par temps perdu et tes courbes : tu vois où aller chercher du temps.",
    duration: 0,
  },
] as const;

const SCENES = [ImportScene, AnalyzingScene, ResultScene];

export default function AnalysisShowcase() {
  const reduce = useReducedMotion();
  const [ref, visible] = useInViewFlag<HTMLDivElement>({ threshold: 0.3 });
  const [step, setStep] = useState(reduce ? 2 : 0);
  const [manual, setManual] = useState(false);

  // Déroulé automatique : dépôt → analyse → résultat, puis on s'arrête sur le
  // résultat. Dès que le visiteur choisit une étape, il garde la main. En
  // quittant l'écran on rembobine, pour rejouer l'histoire au prochain passage.
  useEffect(() => {
    if (reduce || manual) return;
    if (!visible) {
      setStep(0);
      return;
    }
    const d = STEPS[step].duration;
    if (!d) return;
    const t = window.setTimeout(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), d);
    return () => window.clearTimeout(t);
  }, [visible, step, manual, reduce]);

  const select = (i: number) => {
    setManual(true);
    setStep(i);
  };

  return (
    <section id="analyse" className="relative py-20 md:py-28">
      <div className="container relative mx-auto px-4">
        <SectionHeading
          eyebrow="L'analyse"
          title={
            <>
              Ton boîtier sait tout. APEX<span className="text-gradient-primary">AI</span> te dit quoi en faire.
            </>
          }
          sub="Dépose le fichier de ta session : en quelques secondes, tu vois où tu perds du temps, virage par virage, et ce qu'il faut corriger."
        />

        <div ref={ref} className="mt-12 grid items-center gap-8 lg:mt-16 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.5fr)] lg:gap-14">
          {/* ── Les trois étapes ── */}
          <div>
            {/* Téléphone : trois onglets, le texte de l'étape en dessous. */}
            <div className="lg:hidden">
              <ol aria-label="Étapes de l'analyse" className="flex border-b border-white/10">
                {STEPS.map((s, i) => (
                  <li key={s.n} className="flex-1">
                    <button
                      type="button"
                      aria-current={step === i ? "step" : undefined}
                      onClick={() => select(i)}
                      className={cn(
                        "-mb-px w-full border-b-2 px-2 py-3 text-sm font-medium transition-colors",
                        step === i ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
                      )}
                    >
                      <span className="mr-1.5 text-xs text-primary">{s.n}</span>
                      {s.short}
                    </button>
                  </li>
                ))}
              </ol>
              <div className="mt-5 text-center">
                <h3 className="font-display text-lg font-bold text-foreground">{STEPS[step].title}</h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{STEPS[step].text}</p>
              </div>
            </div>

            {/* Ordinateur : la liste complète, l'étape en cours est mise en avant. */}
            <ol className="hidden lg:block">
              {STEPS.map((s, i) => {
                const active = step === i;
                return (
                  <li key={s.n}>
                    <button
                      type="button"
                      onClick={() => select(i)}
                      aria-current={active ? "step" : undefined}
                      className={cn(
                        "w-full border-l-2 py-5 pl-6 text-left transition-colors",
                        active ? "border-primary" : "border-white/10 hover:border-white/25"
                      )}
                    >
                      <span
                        className={cn(
                          "text-xs font-semibold tabular-nums transition-colors",
                          active ? "text-primary" : "text-muted-foreground/60"
                        )}
                      >
                        {s.n}
                      </span>
                      <h3
                        className={cn(
                          "mt-1 font-display text-lg font-bold transition-colors",
                          active ? "text-foreground" : "text-foreground/60"
                        )}
                      >
                        {s.title}
                      </h3>
                      <p
                        className={cn(
                          "mt-1 text-sm leading-relaxed transition-colors",
                          active ? "text-muted-foreground" : "text-muted-foreground/50"
                        )}
                      >
                        {s.text}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* ── L'écran de l'app : l'import, l'analyse, puis la vraie carte ── */}
          <div className="min-w-0">
            <TiltCard className="overflow-hidden rounded-xl border border-white/10 bg-[#0c0c0c] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]">
              {/* Les trois scènes occupent la même case : le cadre garde la
                  hauteur de la plus grande, rien ne saute d'une étape à l'autre. */}
              <NearView minHeight={560} className="grid min-h-[560px]">
                <Suspense fallback={null}>
                  {SCENES.map((Scene, i) => (
                    <div
                      key={i}
                      aria-hidden={step !== i}
                      className={cn(
                        "col-start-1 row-start-1 flex items-center justify-center",
                        "[transition-property:opacity,visibility] duration-500 ease-out-expo",
                        step === i ? "visible opacity-100" : "invisible opacity-0"
                      )}
                    >
                      <div className="w-full">
                        <Scene play={visible && step === i} />
                      </div>
                    </div>
                  ))}
                </Suspense>
              </NearView>
            </TiltCard>
            <div className="mt-3 flex justify-center">
              <DemoTag>{DEMO_LABEL}</DemoTag>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 lg:mt-14">
          <Button asChild variant="hero" size="lg" className="group h-12 px-8">
            <Link to="/upload">
              Analyser ma session
              <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">1re analyse offerte · sans compte</p>
        </div>
      </div>
    </section>
  );
}
