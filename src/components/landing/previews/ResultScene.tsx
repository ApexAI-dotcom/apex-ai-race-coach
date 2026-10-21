import { CSSProperties, useEffect, useState } from "react";
import { MapPin, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountUp } from "../atoms";
import { DEMO_LAP } from "../data/demoSession";
import { TrackMap } from "./TrackMap";

/**
 * Étape 3 — « Tu sais quoi corriger ». Le résultat tel que l'app le montre :
 * carte du circuit avec le Tour parfait IA, score /100 et conseils classés par
 * temps réellement perdu. Les chiffres et les textes viennent de la session de
 * démo ; cliquer un conseil met son virage en lumière sur la carte.
 */

const SCORE = [
  { label: "Précision point de corde", value: 20, max: 30 },
  { label: "Régularité", value: 16, max: 25 },
  { label: "Vitesse au point de corde", value: 20, max: 25 },
  { label: "Temps secteurs", value: 15, max: 20 },
] as const;

const TIPS = [
  {
    priority: "Priorité 1",
    category: "Vitesse",
    corner: 10,
    lost: "0.27",
    title: "Virage 10 à droite — 2.9 km/h à reprendre au point de corde",
    body: "Tu passes à 55 km/h, ton meilleur passage est à 58 km/h. Relâche les freins plus progressivement à l'inscription : l'avant reste chargé et le kart tourne sans perdre de vitesse.",
  },
  {
    priority: "Priorité 2",
    category: "Freinage",
    corner: 6,
    lost: "0.16",
    title: "Virage 6 à droite — Ton meilleur passage freinait 26 m plus tôt",
    body: "Tu freines à 17 m du point de corde, ton passage le plus rapide freinait à 43 m. Freiner plus tôt te laisse le temps de rendre les freins : tu ressors mieux placé.",
  },
] as const;

export default function ResultScene({ play }: { play: boolean }) {
  const [tip, setTip] = useState(0);
  const [manual, setManual] = useState(false);

  // Les conseils défilent seuls tant que le visiteur n'en a pas choisi un.
  useEffect(() => {
    if (!play) {
      setTip(0);
      setManual(false);
      return;
    }
    if (manual) return;
    const id = window.setInterval(() => setTip((t) => (t + 1) % TIPS.length), 3600);
    return () => window.clearInterval(id);
  }, [play, manual]);

  return (
    <div
      className={cn(
        "grid gap-3 p-3 sm:p-4 md:grid-cols-[minmax(0,1.04fr)_minmax(0,1fr)] md:grid-rows-[auto_1fr]",
        play && "lp-on"
      )}
    >
      {/* ── Tour parfait IA : en tête sur téléphone, sous les conseils sur grand écran ── */}
      <div className="min-w-0 self-start rounded-xl border border-[rgba(250,204,21,0.35)] bg-[rgba(250,204,21,0.06)] px-3 py-2 md:col-start-2 md:row-start-2 md:self-stretch">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
          <span className="font-display text-[11px] font-bold tracking-wide text-[#FACC15]">TOUR PARFAIT IA</span>
          <span>
            Meilleur tour <b className="text-foreground">{DEMO_LAP.best.toFixed(2)}s</b> (tour 4)
          </span>
          <span>
            Tour idéal{" "}
            <b className="text-foreground">
              <CountUp from={DEMO_LAP.best} to={DEMO_LAP.ideal} decimals={2} play={play} delay={1.3} duration={1.1} />s
            </b>
          </span>
          <span>
            À aller chercher{" "}
            <b className="lp-pop inline-block text-emerald-400" style={{ "--d": "2.2s" } as CSSProperties}>
              −{DEMO_LAP.gain.toFixed(2)}s
            </b>
          </span>
        </div>
        {/* L'explication passe après sur téléphone : le texte sous la fenêtre la redit déjà. */}
        <p className="mt-1 text-[10px] leading-snug text-muted-foreground max-md:hidden">
          En enchaînant tes meilleurs mini-secteurs. Tu l'as déjà fait, mais pas dans le même tour.
        </p>
      </div>

      {/* ── Carte du circuit ── */}
      <div className="flex min-w-0 flex-col gap-2.5 md:col-start-1 md:row-span-2 md:row-start-1">
        <div className="relative h-[248px] rounded-xl border border-white/[0.06] bg-[#0b0b0d] p-2 min-[480px]:h-[300px] sm:h-[330px] md:h-auto md:min-h-[270px] md:flex-1">
          <TrackMap play={play} highlight={TIPS[tip].corner} runners className="h-full w-full" />
        </div>

        <div className="flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-2">
            Lent
            <span
              aria-hidden="true"
              className="h-1.5 w-20 rounded-full"
              style={{ background: "linear-gradient(90deg,#ff0000,#ff8000,#ffee00,#00ff00)" }}
            />
            Rapide
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-0 w-5 border-t-2 border-dashed"
              style={{ borderColor: "#FACC15" }}
            />
            Tour parfait IA
          </span>
        </div>
      </div>

      {/* ── Score + conseils ── */}
      <div className="flex min-w-0 flex-col gap-2.5 md:col-start-2 md:row-start-1">
        <div className="rounded-xl border border-[#742323]/70 bg-[#160C0C]/80 p-3.5">
          {/* Téléphone : le score à gauche, son titre et sa note à droite (une seule bande).
              Grand écran : titre, gros score, note, puis le détail par critère. */}
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-0.5 md:block">
            <div className="col-start-2 row-start-1 flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 font-display text-[13px] font-bold text-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-primary" /> Score de performance
              </p>
              <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-2 py-0.5 font-display text-[10px] font-bold text-blue-300">
                B
              </span>
            </div>
            <p className="col-start-1 row-span-2 row-start-1 font-display text-[40px] font-bold leading-none text-[#F5456F] sm:text-[44px] md:mt-0.5 md:text-center">
              <CountUp to={71} play={play} duration={1.4} delay={0.2} />
              <span className="text-[0.62em]">/100</span>
            </p>
            <p className="col-start-2 row-start-2 text-[10px] leading-snug text-muted-foreground md:mt-1 md:text-center">
              Note de pilotage sur cette session
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-1.5 max-md:hidden">
            {SCORE.map((s, i) => (
              <div key={s.label} className="rounded-lg bg-[#181818] px-2 py-1.5">
                <p className="truncate text-[9.5px] text-muted-foreground">{s.label}</p>
                <p className="text-[12px] font-bold tabular-nums text-foreground">
                  {s.value}
                  <span className="text-muted-foreground">/{s.max}</span>
                </p>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.07]">
                  <div style={{ width: `${(s.value / s.max) * 100}%` }} className="h-full">
                    <div
                      className="lp-grow h-full rounded-full bg-[#F5456F]"
                      style={{ "--d": `${0.5 + i * 0.12}s` } as CSSProperties}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/*
          Grand écran : les deux conseils sont visibles l'un sous l'autre.
          Téléphone : un seul à la fois, empilés dans la même case de grille
          (la hauteur ne bouge donc jamais) avec deux points pour changer.
          L'animation d'entrée est sur l'enveloppe, la transparence sur le bouton :
          une animation « both » écraserait sinon l'atténuation du conseil inactif.
        */}
        <div className="grid gap-2 md:flex md:flex-col">
          {TIPS.map((t, i) => {
            const active = tip === i;
            return (
              <div
                key={t.corner}
                className="lp-rise max-md:col-start-1 max-md:row-start-1"
                style={{ "--d": `${1.1 + i * 0.25}s` } as CSSProperties}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => {
                    setTip(i);
                    setManual(true);
                  }}
                  aria-pressed={active}
                  className={cn(
                    "h-full w-full rounded-xl border p-2.5 text-left transition-all duration-300",
                    active
                      ? "border-primary/45 bg-[#161010] shadow-[0_0_0_1px_rgba(255,66,66,0.12)]"
                      : "border-white/[0.07] bg-[#121212] max-md:invisible max-md:opacity-0 md:opacity-65 md:hover:opacity-100"
                  )}
                >
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[9.5px]">
                    <span className="whitespace-nowrap rounded-full bg-white/[0.08] px-1.5 py-0.5 font-bold text-foreground">
                      {t.priority}
                    </span>
                    <span className="whitespace-nowrap rounded-full bg-white/[0.08] px-1.5 py-0.5 font-bold text-foreground">
                      {t.category}
                    </span>
                    <span className="inline-flex items-center gap-0.5 whitespace-nowrap rounded-full border border-primary/60 px-1.5 py-0.5 font-bold text-primary">
                      Virage {t.corner} <MapPin className="h-2.5 w-2.5" />
                    </span>
                    <span className="w-full text-muted-foreground md:ml-auto md:w-auto">
                      Temps perdu ici : <b className="text-emerald-400">{t.lost}s</b> / tour
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12px] font-bold leading-snug text-foreground">{t.title}</p>
                  <p className="mt-0.5 text-[10.5px] leading-snug text-muted-foreground">{t.body}</p>
                </button>
              </div>
            );
          })}
        </div>

        <div className="-mt-1 flex justify-center md:hidden" role="group" aria-label="Choisir un conseil">
          {TIPS.map((t, i) => (
            <button
              key={t.corner}
              type="button"
              tabIndex={-1}
              aria-label={`Conseil ${i + 1} : virage ${t.corner}`}
              aria-pressed={tip === i}
              onClick={() => {
                setTip(i);
                setManual(true);
              }}
              className="flex h-7 w-9 items-center justify-center"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  tip === i ? "w-5 bg-primary" : "w-1.5 bg-white/25"
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
