import { CSSProperties, lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { ArrowRight, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AppWindow, DemoTag, SectionHeading } from "./atoms";
import { DEMO_LABEL } from "./data/demoLabel";
import { useInViewFlag } from "./hooks";

// Les trois scènes sont des modules à part : rien n'est téléchargé tant que
// cette section n'approche pas de l'écran.
const ImportScene = lazy(() => import("./previews/ImportScene"));
const AnalyzingScene = lazy(() => import("./previews/AnalyzingScene"));
const ResultScene = lazy(() => import("./previews/ResultScene"));

const STEPS = [
  {
    n: "01",
    short: "Dépose",
    title: "Dépose ta session",
    text: "Glisse le fichier de ton enregistreur AiM (.xrk). Pas de tableur, pas de réglage compliqué.",
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
    text: "Un score /100, ton Tour parfait IA et des conseils classés par temps réellement perdu.",
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

  const auto = !manual && !reduce && visible;

  return (
    <section id="analyse" className="relative overflow-hidden py-20 md:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_70%_100%_at_50%_0%,hsl(var(--primary)/0.10),transparent_75%)]"
      />
      <div className="container relative mx-auto px-4">
        <SectionHeading
          eyebrow="L'analyse"
          icon={ScanSearch}
          title={
            <>
              Ton enregistreur sait tout. APEX<span className="text-gradient-primary">AI</span> te dit quoi en faire.
            </>
          }
          sub="Dépose le fichier de ta session : en quelques secondes, tu vois où tu perds du temps, virage par virage, et ce qu'il faut corriger."
        />

        <div ref={ref} className="mt-12 grid items-center gap-6 lg:mt-16 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.5fr)] lg:gap-12">
          {/* ── Les trois étapes ── */}
          <div className="order-1 lg:order-none">
            {/* Téléphone : trois onglets numérotés, le texte de l'étape en dessous. */}
            <div className="lg:hidden">
              <ol aria-label="Étapes de l'analyse" className="grid grid-cols-3 gap-2">
                {STEPS.map((s, i) => (
                  <li key={s.n}>
                    <button
                      type="button"
                      aria-current={step === i ? "step" : undefined}
                      onClick={() => select(i)}
                      className={cn(
                        "relative w-full overflow-hidden rounded-xl border px-2 py-2.5 text-center transition-colors",
                        step === i ? "border-primary/40 bg-primary/[0.07]" : "border-white/10 bg-white/[0.02]"
                      )}
                    >
                      <span className="block font-display text-[11px] font-bold text-primary">{s.n}</span>
                      <span className="block text-xs font-semibold text-foreground">{s.short}</span>
                      {step === i && auto && s.duration > 0 && (
                        <span
                          key={`m-${step}`}
                          className="lp-progress absolute inset-x-0 bottom-0 h-0.5 bg-primary"
                          style={{ "--dur": `${s.duration}ms` } as CSSProperties}
                        />
                      )}
                    </button>
                  </li>
                ))}
              </ol>
              <div className="mt-4 text-center">
                <h3 className="font-display text-lg font-bold text-foreground">{STEPS[step].title}</h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{STEPS[step].text}</p>
              </div>
            </div>

            {/* Ordinateur : la liste complète, l'étape en cours est mise en avant. */}
            <ol className="hidden flex-col gap-3 lg:flex">
              {STEPS.map((s, i) => {
                const active = step === i;
                return (
                  <li key={s.n}>
                    <button
                      type="button"
                      onClick={() => select(i)}
                      aria-current={active ? "step" : undefined}
                      className={cn(
                        "relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300",
                        active
                          ? "border-primary/40 bg-primary/[0.06] shadow-[0_20px_50px_-30px_rgba(255,66,66,0.6)]"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <span
                          className={cn(
                            "mt-0.5 font-display text-sm font-bold tabular-nums transition-colors",
                            active ? "text-primary" : "text-muted-foreground/60"
                          )}
                        >
                          {s.n}
                        </span>
                        <div>
                          <h3
                            className={cn(
                              "font-display text-lg font-bold transition-colors",
                              active ? "text-foreground" : "text-foreground/70"
                            )}
                          >
                            {s.title}
                          </h3>
                          <p
                            className={cn(
                              "mt-1 text-sm leading-relaxed transition-colors",
                              active ? "text-muted-foreground" : "text-muted-foreground/60"
                            )}
                          >
                            {s.text}
                          </p>
                        </div>
                      </div>
                      {active && auto && s.duration > 0 && (
                        <span
                          key={`d-${step}`}
                          className="lp-progress absolute inset-x-0 bottom-0 h-0.5 bg-primary"
                          style={{ "--dur": `${s.duration}ms` } as CSSProperties}
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* ── La fenêtre d'application ── */}
          <div className="relative order-2 lg:order-none">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-6 -inset-y-10 bg-[radial-gradient(closest-side,rgba(255,66,66,0.16),transparent)]"
            />
            <AppWindow active="Analyser" className="relative" bodyClassName="min-h-[420px]">
              {/* Les trois scènes occupent la même case : la fenêtre garde la
                  hauteur de la plus grande, rien ne saute d'une étape à l'autre. */}
              <div className="grid" aria-hidden="true">
                <Suspense fallback={null}>
                  {SCENES.map((Scene, i) => (
                    <div
                      key={i}
                      className={cn(
                        "col-start-1 row-start-1 flex items-center justify-center",
                        "[transition-property:opacity,transform,visibility] duration-500 ease-out-expo",
                        step === i ? "visible translate-y-0 opacity-100" : "invisible translate-y-2 opacity-0"
                      )}
                    >
                      <div className="w-full">
                        <Scene play={visible && step === i} />
                      </div>
                    </div>
                  ))}
                </Suspense>
              </div>
            </AppWindow>
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
