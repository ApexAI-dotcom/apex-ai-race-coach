import { CSSProperties, useEffect, useState } from "react";
import { CheckCircle2, FileText, ScanLine, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Étape 1 — « Dépose ta session ». Reproduit l'écran d'import de l'app : la
 * zone de dépôt reçoit un fichier AiM, le reconnaît, puis les
 * conditions de la session se règlent d'elles-mêmes.
 */

const CONDITIONS = ["Sec", "Humide", "Mouillée", "Pluie"];
const TYPES = ["Essais", "Qualifications", "Course"];

export default function ImportScene({ play }: { play: boolean }) {
  // 0 = zone vide · 1 = fichier déposé · 2 = conditions réglées · 3 = prêt à lancer
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!play) {
      setPhase(0);
      return;
    }
    const timers = [
      window.setTimeout(() => setPhase(1), 900),
      window.setTimeout(() => setPhase(2), 2100),
      window.setTimeout(() => setPhase(3), 2900),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [play]);

  const dropped = phase >= 1;

  return (
    <div className={cn("flex h-full flex-col items-center justify-center gap-4 px-4 py-6 max-md:gap-5 max-md:py-10 sm:px-8", play && "lp-on")}>
      <div className="text-center">
        <h3 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Analyse ta <span className="text-gradient-primary">session</span>
        </h3>
        <p className="mx-auto mt-1.5 max-w-md text-xs text-muted-foreground sm:text-sm">
          Importe le fichier de ton boîtier et obtiens une analyse complète en quelques secondes.
        </p>
      </div>

      {/* Zone de dépôt */}
      <div
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-colors duration-500",
          dropped ? "border-emerald-500/50 bg-emerald-500/[0.04]" : "border-white/15 bg-white/[0.015]"
        )}
      >
        {!dropped ? (
          <div className="flex flex-col items-center gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06]">
              <UploadCloud className="h-5 w-5 text-muted-foreground" />
            </span>
            <p className="text-sm font-semibold text-foreground">Glisse le fichier de ta session ici</p>
            <p className="text-[11px] text-muted-foreground">ou clique pour le sélectionner</p>
          </div>
        ) : (
          <div className="lp-on flex flex-col items-center gap-1.5">
            <span className="lp-pop flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#00FF80] to-[#00B359] shadow-[0_0_28px_-6px_rgba(0,255,128,0.55)]">
              <FileText className="h-5 w-5 text-black" />
            </span>
            <p className="lp-rise text-sm font-semibold text-foreground" style={{ "--d": "0.1s" } as CSSProperties}>
              Session_Solokart_Plesse.xrk
            </p>
            <p
              className="lp-rise inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400"
              style={{ "--d": "0.35s" } as CSSProperties}
            >
              <ScanLine className="h-3 w-3" /> Fichier reconnu · AiM
            </p>
          </div>
        )}
      </div>

      {/* Informations de session */}
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111] p-3.5 sm:p-4">
        <p className="text-[11px] font-semibold text-foreground">Informations de session</p>
        <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
          <Chips label="Conditions de piste" items={CONDITIONS} selected={phase >= 2 ? "Sec" : null} />
          <Chips label="Type de session" items={TYPES} selected={phase >= 2 ? "Essais" : null} />
        </div>
      </div>

      <div
        className={cn(
          "inline-flex h-10 w-full max-w-md items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-500",
          phase >= 3
            ? "gradient-primary text-primary-foreground shadow-[0_10px_30px_-8px_rgba(255,66,66,0.7)] scale-[1.02]"
            : "bg-white/[0.06] text-muted-foreground"
        )}
      >
        {phase >= 3 && <CheckCircle2 className="h-4 w-4" />}
        Analyser le fichier
      </div>
    </div>
  );
}

function Chips({ label, items, selected }: { label: string; items: string[]; selected: string | null }) {
  return (
    <div>
      <p className="mb-1 text-[10px] text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((it) => (
          <span
            key={it}
            className={cn(
              "rounded-md border px-2 py-0.5 text-[10px] transition-all duration-300",
              selected === it
                ? "scale-105 border-[#FF6B35] bg-[#FF6B35] font-semibold text-white"
                : "border-white/10 bg-white/[0.03] text-muted-foreground"
            )}
          >
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}
