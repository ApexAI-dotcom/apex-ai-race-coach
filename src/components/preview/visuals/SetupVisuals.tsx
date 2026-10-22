import { CSSProperties } from "react";
import { Brain, Check, CheckCircle2, Disc3, FileText, Sun } from "lucide-react";

/**
 * Petits visuels de la page « Réglages » (hors connexion) : un par encart de
 * fonctionnalité. Mêmes libellés que la vraie page ; les valeurs sont des
 * données d'exemple.
 *
 * L'animation se déclenche en CSS (`lp-*`) quand le cadre parent porte `lp-on`.
 */

const delay = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;

/* ── 1. Recommandations d'ingénieur : un réglage pour chaque paramètre ── */

const PARAMS = ["Pressions", "Voies", "Chasse", "Arbre", "Transmission", "Carburation"] as const;

export function RecommendationVisual() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5 px-3.5 sm:px-5">
      <ul className="flex flex-wrap gap-1.5">
        {PARAMS.map((p, i) => (
          <li
            key={p}
            className="lp-pop inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"
            style={delay(0.15 + i * 0.14)}
          >
            <Brain className="h-3 w-3 max-sm:hidden" /> {p}
          </li>
        ))}
      </ul>
      <div
        className="lp-rise rounded-lg border border-white/[0.08] bg-black/30 px-2.5 py-2"
        style={delay(1.15)}
      >
        <p className="text-[8.5px] font-bold uppercase tracking-wider text-muted-foreground">
          Impact physique & dynamique
        </p>
        <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-snug text-muted-foreground">
          Détermine la surface de contact du pneu au sol, la vitesse de montée en température de la gomme et la
          stabilité lors des phases de glisse.
        </p>
      </div>
    </div>
  );
}

/* ── 2. Pneu monté & pressions ciblées : de la pression à froid à la cible ─ */

export function PressureVisual() {
  return (
    <div className="flex h-full flex-col justify-center gap-3.5 px-3.5 sm:px-5">
      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
        <span
          className="lp-rise inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 font-semibold text-primary"
          style={delay(0.1)}
        >
          <Disc3 className="h-3 w-3" /> Train 1 monté
        </span>
        <span
          className="lp-rise inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-muted-foreground"
          style={delay(0.25)}
        >
          <Sun className="h-3 w-3" /> Piste sèche
        </span>
      </div>

      <div>
        <div className="mb-2 flex items-end justify-between">
          <div className="lp-rise" style={delay(0.4)}>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">À froid</p>
            <p className="font-display text-[18px] font-bold leading-none tabular-nums text-foreground">
              1,0 <span className="text-[10px] font-medium text-muted-foreground">bar</span>
            </p>
          </div>
          <div className="lp-rise text-right" style={delay(1.2)}>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-primary">À chaud (cible)</p>
            <p className="font-display text-[18px] font-bold leading-none tabular-nums text-foreground">
              1,2 <span className="text-[10px] font-medium text-muted-foreground">bar</span>
            </p>
          </div>
        </div>

        <div className="relative h-2 rounded-full bg-white/[0.07]">
          <div
            className="lp-grow absolute inset-0 rounded-full"
            style={{ background: "linear-gradient(90deg,#3B82F6,#F59E0B 55%,#FF4242)", ...delay(0.5) }}
          />
          <span
            className="lp-pop absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-[#0b0b0d] bg-sky-400"
            style={delay(0.4)}
          />
          <span className="lp-pop absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2" style={delay(1.4)}>
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/60 motion-reduce:animate-none" />
            <span className="absolute inset-0 rounded-full border-2 border-[#0b0b0d] bg-primary" />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── 3. Bilan des masses : kart + pilote + lest face au poids mini ───── */

export function MassVisual() {
  return (
    <div className="flex h-full flex-col justify-center gap-3.5 px-3.5 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <p className="lp-rise font-display text-[26px] font-bold leading-none tabular-nums text-foreground" style={delay(0.1)}>
          154 <span className="text-[12px] font-medium text-muted-foreground">kg</span>
        </p>
        <span
          className="lp-pop inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400"
          style={delay(1.2)}
        >
          <CheckCircle2 className="h-3 w-3" /> CONFORME · +4 kg
        </span>
      </div>

      <div>
        <div className="relative h-2.5 rounded-full bg-white/[0.07]">
          <div
            className="lp-grow absolute inset-y-0 left-0 flex overflow-hidden rounded-full"
            style={{ width: "90%", ...delay(0.4) }}
          >
            <span className="h-full bg-[#3B82F6]" style={{ width: "45%" }} />
            <span className="h-full bg-[#A855F7]" style={{ width: "45%" }} />
            <span className="h-full bg-[#F59E0B]" style={{ width: "10%" }} />
          </div>
          {/* Poids mini du règlement */}
          <span
            aria-hidden="true"
            className="lp-rise absolute -bottom-1 -top-1 border-l border-dashed border-white/70"
            style={{ left: "83.3%", ...delay(1) }}
          />
        </div>
        <div className="relative mt-1.5 flex h-4 items-center gap-3 text-[9.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]" /> Kart
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#A855F7]" /> Pilote
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" /> Lest
          </span>
          <span
            className="lp-rise absolute -translate-x-1/2 whitespace-nowrap text-foreground/80"
            style={{ left: "83.3%", ...delay(1) }}
          >
            poids mini
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── 4. Fiche de réglages PDF ────────────────────────────────────────── */

const SHEET_LINES = [88, 64, 76, 52, 70, 58] as const;

export function PdfSheetVisual() {
  return (
    <div className="flex h-full items-center gap-5 px-3.5 sm:px-5">
      <div className="lp-rise relative h-[114px] w-[84px] shrink-0" style={delay(0.1)}>
        {/* Feuille de dessous, légèrement décalée */}
        <div className="absolute inset-0 rotate-[4deg] rounded-[5px] bg-[#b9b9bd] shadow-[0_10px_24px_-10px_rgba(0,0,0,0.8)]" />
        <div className="absolute inset-0 -rotate-[3deg] rounded-[5px] bg-[#EDEDEF] p-2 shadow-[0_14px_30px_-10px_rgba(0,0,0,0.85)]">
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-[3px] gradient-primary" />
            <span className="h-1 w-9 rounded-full bg-black/70" />
          </div>
          <div className="mt-2 space-y-1.5">
            {SHEET_LINES.map((w, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="h-[3px] w-3 rounded-full bg-black/35" />
                <span className="h-[3px] rounded-full bg-black/20" style={{ width: `${w * 0.5}%` }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-2.5">
        <span
          className="lp-pop inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] font-bold tracking-wider text-foreground"
          style={delay(0.5)}
        >
          <FileText className="h-3 w-3 text-primary" /> PDF · A4
        </span>
        <ul className="space-y-1 text-[11px] text-muted-foreground">
          {["Pressions", "Géométrie", "Transmission"].map((t, i) => (
            <li key={t} className="lp-rise flex items-center gap-1.5" style={delay(0.7 + i * 0.15)}>
              <Check className="h-3 w-3 shrink-0 text-emerald-400" strokeWidth={3} /> {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
