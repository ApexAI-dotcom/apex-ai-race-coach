import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, type LucideIcon } from "lucide-react";

export interface AnalysisStep {
  icon: LucideIcon;
  message: string;
  /** Durée d'affichage de l'étape, en ms (la dernière reste affichée). */
  duration: number;
}

/**
 * L'écran « Analyse en cours » d'Analyser une séance : anneau qui tourne,
 * icône de l'étape, message animé, barre de progression. Partagé avec
 * Comparer deux séances pour que les deux parcours se ressemblent.
 */
export function AnalysisProgress({
  steps,
  title = "Analyse en cours…",
  subtitle = "Notre IA analyse tes données de course",
}: {
  steps: AnalysisStep[];
  title?: string;
  subtitle?: string;
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (i >= steps.length - 1) return;
    const t = window.setTimeout(() => setI((x) => x + 1), steps[i]?.duration ?? 2000);
    return () => window.clearTimeout(t);
  }, [i, steps]);
  const step = steps[i];
  const Icon = step?.icon ?? Loader2;
  const pct = Math.round(((i + 1) / steps.length) * 100);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-12 text-center" role="status" aria-live="polite">
      <div className="relative mx-auto mb-8 h-24 w-24">
        <div className="absolute inset-0 rounded-full border-4 border-muted" />
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="h-8 w-8 text-primary" />
        </div>
      </div>
      <h3 className="mb-2 font-display text-xl font-bold text-foreground">{title}</h3>
      <p className="mb-4 text-muted-foreground">{subtitle}</p>
      <AnimatePresence mode="wait">
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="text-sm font-medium text-primary"
        >
          {step?.message}
        </motion.p>
      </AnimatePresence>
      <div className="mx-auto mt-6 max-w-xs">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-signature"
            initial={{ width: "5%" }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <p className="mt-2 text-right text-xs text-muted-foreground">{pct}%</p>
      </div>
    </motion.div>
  );
}
