import { CSSProperties } from "react";
import { Brain, ChevronRight, Cpu, Disc3, Droplets, MapPin, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * « Réglages » : le Carnet d'Ingénieur. Mêmes libellés que la page de l'app
 * (Pneumatiques, pressions à froid / à chaud, pastille « Recommandation »,
 * fiche d'analyse). Les valeurs sont des données d'exemple.
 */

const FIELDS: { group: string; items: { label: string; value: string; reco: string }[] }[] = [
  {
    group: "Pressions à froid",
    items: [
      { label: "Avant (bar)", value: "1", reco: "1" },
      { label: "Arrière (bar)", value: "1", reco: "1" },
    ],
  },
  {
    group: "Pressions à chaud (cible)",
    items: [
      { label: "Avant (bar)", value: "1,2", reco: "1,2" },
      { label: "Arrière (bar)", value: "1,2", reco: "1,2" },
    ],
  },
];

const OTHER_CARDS = [
  { icon: Wrench, title: "Châssis & géométrie", detail: "Voies, chasse, carrossage, arbre" },
  { icon: Cpu, title: "Transmission", detail: "Pignon, couronne" },
  { icon: Droplets, title: "Carburation", detail: "Selon le moteur" },
];

export default function SetupPreview({ play }: { play: boolean }) {
  const delay = (d: number) => ({ "--d": `${d}s` }) as CSSProperties;
  let n = 0;
  return (
    <div className={cn("space-y-3", play && "lp-on")}>
      {/* Contexte de la session */}
      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-foreground">
          <MapPin className="h-2.5 w-2.5 text-primary" aria-hidden="true" /> Adria Karting Raceway
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-muted-foreground">Piste sèche</span>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-muted-foreground">Train 1 monté</span>
      </div>

      {/* Pneumatiques */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0f0f10] p-3.5">
        <p className="flex items-center gap-2 text-[13px] font-bold text-foreground">
          <Disc3 className="h-4 w-4 text-primary" aria-hidden="true" /> Pneumatiques
        </p>
        <div className="mt-3 space-y-3">
          {FIELDS.map((g) => (
            <div key={g.group}>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{g.group}</p>
              <div className="grid grid-cols-2 gap-2">
                {g.items.map((f) => {
                  const i = n++;
                  return (
                    <div key={f.label}>
                      <p className="mb-1 text-[10px] text-muted-foreground">{f.label}</p>
                      <div className="flex h-8 items-center rounded-lg border border-white/10 bg-black/40 px-2.5 text-[13px] font-semibold tabular-nums text-foreground">
                        {f.value}
                      </div>
                      <span
                        className="lp-pop mt-1.5 inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"
                        style={delay(0.5 + i * 0.22)}
                      >
                        <Brain className="h-3 w-3 animate-pulse motion-reduce:animate-none max-[420px]:hidden" aria-hidden="true" />
                        Recommandation : {f.reco}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fiche d'analyse ouverte depuis une pastille */}
      <div
        className="lp-rise rounded-2xl border border-primary/25 bg-gradient-to-b from-primary/[0.07] to-transparent p-3.5"
        style={delay(1.7)}
      >
        <p className="flex items-center gap-1.5 text-[12px] font-bold text-foreground">
          <Wrench className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Analyse d'ingénierie ApexAI
        </p>
        <div className="mt-2 flex items-center justify-between rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2">
          <div>
            <p className="text-[8.5px] font-bold uppercase tracking-wider text-muted-foreground">Ajustement ciblé</p>
            <p className="text-[12px] font-bold text-foreground">Pression à froid avant</p>
          </div>
          <div className="text-right">
            <p className="text-[8.5px] font-bold uppercase tracking-wider text-primary">Valeur pré-remplie</p>
            <p className="font-display text-base font-extrabold text-primary">1</p>
          </div>
        </div>
        <p className="mt-2 text-[10.5px] font-bold uppercase tracking-wider text-foreground/80">Impact physique & dynamique</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Détermine la surface de contact du pneu au sol, la vitesse de montée en température de la gomme et la stabilité
          lors des phases de glisse.
        </p>
      </div>

      {/* Les autres cartes du carnet */}
      <ul className="space-y-1.5">
        {OTHER_CARDS.map((c, i) => (
          <li
            key={c.title}
            className="lp-rise flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-[#0f0f10] px-3 py-2"
            style={delay(2.1 + i * 0.12)}
          >
            <c.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="text-[12px] font-semibold text-foreground">{c.title}</span>
            <span className="ml-1 truncate text-[10.5px] text-muted-foreground">{c.detail}</span>
            <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </li>
        ))}
      </ul>
    </div>
  );
}

