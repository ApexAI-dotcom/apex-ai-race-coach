import { CSSProperties, useEffect, useState } from "react";
import { Brain, Check, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEMO_CORNERS } from "../data/demoLabel";

/**
 * Étape 2 — « L'IA décortique chaque virage ». L'écran d'attente de l'app :
 * un anneau de progression autour du cerveau et la liste des étapes qui se
 * cochent une à une. Tout est piloté en CSS, sauf le titre final.
 */

const STEPS = [
  "Lecture du fichier de session…",
  `Détection des ${DEMO_CORNERS} virages…`,
  "L'IA analyse tes points de corde…",
  "Calcul du score de performance…",
  "Génération des graphiques…",
];

const STEP_GAP = 0.72; // secondes entre deux étapes
const RING_SECONDS = STEPS.length * STEP_GAP + 0.6;

export default function AnalyzingScene({ play }: { play: boolean }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!play) {
      setDone(false);
      return;
    }
    const t = window.setTimeout(() => setDone(true), RING_SECONDS * 1000);
    return () => window.clearTimeout(t);
  }, [play]);

  return (
    <div
      className={cn("flex h-full flex-col items-center justify-center gap-5 px-4 py-8 max-md:gap-6 max-md:py-12 sm:px-8", play && "lp-on")}
      style={{ "--dur": `${RING_SECONDS}s` } as CSSProperties}
    >
      {/* Anneau */}
      <div className="relative h-24 w-24 sm:h-28 sm:w-28">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke={done ? "#22C55E" : "#FF4242"}
            strokeWidth="6"
            strokeLinecap="round"
            pathLength={100}
            className="lp-ring transition-[stroke] duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {done ? (
            <CheckCircle2 className="lp-pop h-9 w-9 text-emerald-400" />
          ) : (
            <Brain className="h-9 w-9 text-primary" />
          )}
        </div>
      </div>

      <div className="text-center">
        <h3 className="font-display text-xl font-bold text-foreground sm:text-2xl">
          {done ? "Analyse terminée !" : "Analyse en cours…"}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          {done ? "Ta session a été analysée avec succès." : "L'IA analyse tes données de course"}
        </p>
      </div>

      <ul className="w-full max-w-sm space-y-2">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className="lp-rise flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs text-foreground/90 sm:text-[13px]"
            style={{ "--d": `${i * STEP_GAP}s` } as CSSProperties}
          >
            <span className="relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-white/20">
              <span
                className="lp-pop absolute inset-0 flex items-center justify-center rounded-full bg-emerald-500"
                style={{ "--d": `${i * STEP_GAP + 0.55}s` } as CSSProperties}
              >
                <Check className="h-2.5 w-2.5 text-black" strokeWidth={3.5} />
              </span>
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
