import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, CheckCircle2, Clock, Upload as UploadIcon } from "lucide-react";
import type { JobProgress } from "@/lib/analysisJobs";

const ICONS = { upload: UploadIcon, queued: Clock, running: Brain, done: CheckCircle2 } as const;

/**
 * L'écran « Analyse en cours », commun à Analyser une séance et à Comparer
 * deux séances. La jauge et le message viennent du SERVEUR : envoi réel du
 * fichier, place dans la file, étape de calcul en cours. Rien de décoratif :
 * à 100 %, le résultat est là.
 */
export function AnalysisProgress({
  progress,
  startedAt,
  title = "Analyse en cours…",
  subtitle = "L'IA analyse chaque tour, chaque freinage et chaque virage.",
}: {
  progress: JobProgress;
  startedAt?: number;
  title?: string;
  subtitle?: string;
}) {
  const Icon = ICONS[progress.phase] ?? Brain;
  const pct = Math.max(2, Math.min(100, Math.round(progress.pct)));

  // Temps écoulé : rassure sur le fait que ça avance, sans promesse de durée.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt || progress.phase === "done") return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [startedAt, progress.phase]);
  const elapsed = startedAt ? Math.max(0, Math.round((now - startedAt) / 1000)) : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 py-10 text-center sm:py-12" role="status" aria-live="polite">
      <div className="relative mx-auto mb-7 h-24 w-24">
        <div className="absolute inset-0 rounded-full border-4 border-muted" />
        {/* Anneau de progression réel (et non une roue qui tourne sans fin) */}
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden>
          <defs>
            <linearGradient id="ap-sig" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
          <motion.circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="url(#ap-sig)"
            strokeWidth="8"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="100"
            initial={{ strokeDashoffset: 98 }}
            animate={{ strokeDashoffset: 100 - pct }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="h-8 w-8 text-primary" />
        </div>
      </div>
      <h3 className="mb-2 font-display text-xl font-bold text-foreground">{title}</h3>
      <p className="mx-auto mb-4 max-w-md text-sm text-muted-foreground">{subtitle}</p>
      <AnimatePresence mode="wait">
        <motion.p
          key={progress.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="min-h-[1.25rem] text-sm font-medium text-primary"
        >
          {progress.label}
        </motion.p>
      </AnimatePresence>
      <div className="mx-auto mt-5 max-w-xs">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-signature"
            initial={{ width: "2%" }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <p className="mt-2 flex justify-between text-xs tabular-nums text-muted-foreground">
          <span>{elapsed != null ? `${elapsed} s` : ""}</span>
          <span>{pct} %</span>
        </p>
      </div>
      {progress.phase !== "done" && (
        <p className="mx-auto mt-6 max-w-sm rounded-lg border border-white/5 bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
          Tu peux continuer à naviguer dans l'app pendant que l'IA travaille : on te prévient dès que c'est prêt.
        </p>
      )}
    </motion.div>
  );
}
