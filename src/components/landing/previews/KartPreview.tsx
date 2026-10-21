import { CSSProperties } from "react";
import { CircleCheck, CircleDot, Disc3, Flame, LoaderCircle, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * « Mon Kart » : le schéma du kart avec ses capteurs d'usure, le score
 * d'état global et les compteurs de durée de vie. Mêmes libellés et mêmes
 * couleurs que la page de l'app ; les valeurs sont des données d'exemple.
 */

const GREEN = "#22C55E";
const STROKE = "#a8a8a8";

/** Capteurs : position (unités du viewBox) et ordre d'allumage. */
const NODES: { x: number; y: number }[] = [
  { x: 111, y: 72 }, // roue avant gauche
  { x: 249, y: 72 }, // roue avant droite
  { x: 79, y: 274 }, // roue arrière gauche
  { x: 281, y: 274 }, // roue arrière droite
  { x: 110, y: 272 }, // frein
  { x: 144, y: 203 }, // batterie
  { x: 245, y: 222 }, // moteur
  { x: 249, y: 258 }, // chaîne
];

const TILES = [
  { icon: Flame, color: "#FF4242", value: "100%", label: "MOTEUR" },
  { icon: CircleDot, color: "#A855F7", value: "93%", label: "PNEUS" },
  { icon: LoaderCircle, color: "#F97316", value: "99%", label: "FREINS" },
  { icon: Wrench, color: "#3B82F6", value: "99%", label: "CHAÎNE" },
];

function Schematic() {
  const trace = (d: number) => ({ "--d": `${d}s` }) as CSSProperties;
  return (
    <svg
      viewBox="0 0 360 330"
      className="mx-auto block h-auto w-full max-w-[320px]"
      role="img"
      aria-label="Schéma du kart vu de dessus : roues, moteur, chaîne, frein et batterie, chacun surveillé"
    >
      <defs>
        <pattern id="lp-kart-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="rgba(255,255,255,0.05)" />
        </pattern>
        <radialGradient id="lp-kart-fade" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="lp-kart-mask">
          <rect width="360" height="330" fill="url(#lp-kart-fade)" />
        </mask>
      </defs>
      <rect width="360" height="330" fill="url(#lp-kart-grid)" mask="url(#lp-kart-mask)" />

      {/* Avant */}
      <path d="M180 8 L174 17 H186 Z" fill="#8a8a8a" />
      <text x="180" y="30" textAnchor="middle" fontSize="10" fontWeight="700" fill="#8a8a8a" letterSpacing="1">
        AV
      </text>

      {/* Châssis */}
      <g fill="none" stroke={STROKE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path className="lp-trace" pathLength={1} style={trace(0)} d="M180 40 L148 62 L136 120 L130 250 L142 300 L218 300 L230 250 L224 120 L212 62 Z" />
        <path className="lp-trace" pathLength={1} style={trace(0.5)} d="M136 120 H224 M130 250 H230" strokeWidth="2.4" />
        <path className="lp-trace" pathLength={1} style={trace(0.7)} d="M118 70 H242 M82 272 H278" strokeWidth="4" stroke="#7d7d7d" />
        <path className="lp-trace" pathLength={1} style={trace(0.9)} d="M180 70 V99" strokeWidth="2.4" />
      </g>
      {/* Volant */}
      <g fill="none" stroke="#bdbdbd" strokeWidth="2.4" strokeLinecap="round">
        <circle className="lp-trace" pathLength={1} style={trace(1)} cx="180" cy="116" r="17" />
        <path className="lp-trace" pathLength={1} style={trace(1.1)} d="M164 116 H196 M180 116 V131" />
      </g>
      {/* Siège */}
      <path
        className="lp-trace"
        pathLength={1}
        style={trace(1)}
        d="M158 170 Q180 156 202 170 L206 232 Q180 246 154 232 Z"
        fill="rgba(255,255,255,0.03)"
        stroke="#777"
        strokeWidth="2.4"
      />
      {/* Roues */}
      <g fill="#141414" stroke="#8d8d8d" strokeWidth="2.6">
        <rect className="lp-trace" pathLength={1} style={trace(0.6)} x="100" y="52" width="22" height="40" rx="6" />
        <rect className="lp-trace" pathLength={1} style={trace(0.6)} x="238" y="52" width="22" height="40" rx="6" />
        <rect className="lp-trace" pathLength={1} style={trace(0.8)} x="64" y="246" width="30" height="56" rx="8" />
        <rect className="lp-trace" pathLength={1} style={trace(0.8)} x="266" y="246" width="30" height="56" rx="8" />
      </g>
      {/* Moteur, chaîne, frein, batterie */}
      <g fill="#141414" stroke="#8d8d8d" strokeWidth="2.4">
        <rect className="lp-trace" pathLength={1} style={trace(1.1)} x="232" y="196" width="26" height="52" rx="5" />
        <rect className="lp-trace" pathLength={1} style={trace(1.2)} x="138" y="190" width="12" height="26" rx="2" />
      </g>
      <g fill="none" stroke="#8d8d8d" strokeWidth="2.4">
        <path className="lp-trace" pathLength={1} style={trace(1.2)} d="M245 248 L250 268" strokeDasharray="none" />
        <ellipse className="lp-trace" pathLength={1} style={trace(1.2)} cx="252" cy="272" rx="4" ry="10" />
        <ellipse className="lp-trace" pathLength={1} style={trace(1.2)} cx="110" cy="272" rx="5" ry="14" />
      </g>
      <rect x="104" y="252" width="12" height="9" fill="#b02a2a" opacity="0.9" />

      {/* Capteurs : ils s'allument un à un, puis respirent. */}
      {NODES.map((n, i) => (
        <g key={i}>
          <circle
            className="lp-pulse"
            style={{ "--d": `${2 + i * 0.28}s` } as CSSProperties}
            cx={n.x}
            cy={n.y}
            r="6"
            fill="none"
            stroke={GREEN}
            strokeWidth="2"
          />
          <circle
            className="lp-node"
            style={{ "--d": `${1.5 + i * 0.12}s`, filter: "drop-shadow(0 0 5px rgba(34,197,94,0.9))" } as CSSProperties}
            cx={n.x}
            cy={n.y}
            r="5.5"
            fill={GREEN}
          />
        </g>
      ))}
    </svg>
  );
}

export default function KartPreview({ play }: { play: boolean }) {
  return (
    <div
      className={cn(
        "grid gap-3 md:grid-cols-2 md:grid-rows-[auto_1fr] lg:flex lg:h-full lg:flex-col lg:justify-between",
        play && "lp-on"
      )}
    >
      <div className="relative flex items-center overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b0b0d] px-2 pb-1 pt-3 md:row-span-2 lg:block">
        <Schematic />
      </div>

      {/* Bilan santé global */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.07] to-transparent p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Bilan Santé Global</p>
        <div className="mt-2.5 flex items-center gap-4">
          <div className="shrink-0 text-center">
            <div className="relative h-[84px] w-[84px]">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
                <circle
                  className="lp-gauge"
                  style={{ "--v": 98, "--d": "0.4s" } as CSSProperties}
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={GREEN}
                  strokeWidth="7"
                  strokeLinecap="round"
                  pathLength={100}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-display text-[30px] font-bold leading-none text-emerald-400">
                98
              </span>
            </div>
            <p className="mt-1 text-[8.5px] font-semibold tracking-wider text-muted-foreground">SCORE D'ÉTAT</p>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-1.5">
            {TILES.map((t, i) => (
              <div
                key={t.label}
                className="lp-rise rounded-lg bg-[#161616] px-2 py-1.5"
                style={{ "--d": `${0.6 + i * 0.1}s` } as CSSProperties}
              >
                <div className="flex items-center gap-1.5">
                  <t.icon className="h-3 w-3" style={{ color: t.color }} aria-hidden="true" />
                  <span className="font-display text-[13px] font-bold tabular-nums text-foreground">{t.value}</span>
                </div>
                <p className="mt-0.5 text-[8.5px] font-semibold tracking-wider text-muted-foreground">{t.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
          Heures moteur, tours de pneus, usure des freins et de la chaîne : comptés à chaque session importée, avec une alerte avant que la pièce ne lâche.
        </p>
      </div>

      {/* Stock de pneus */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0f0f10] p-3.5">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Disc3 className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Stock de pneus
        </p>
        <div
          className="lp-rise mt-2.5 flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/[0.05] px-2.5 py-2"
          style={{ "--d": "1.2s" } as CSSProperties}
        >
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[9.5px] font-bold text-primary-foreground">
            <CircleCheck className="h-3 w-3" aria-hidden="true" /> Monté
          </span>
          <span className="text-[12.5px] font-semibold text-foreground">Train 1</span>
          <span className="ml-auto text-[10.5px] tabular-nums text-muted-foreground">9/120 tours · 111 restants</span>
        </div>
        <div
          className="lp-rise mt-1.5 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/30 px-2.5 py-2"
          style={{ "--d": "1.35s" } as CSSProperties}
        >
          <span className="text-[12.5px] font-semibold text-foreground">Train pluie</span>
          <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-2 py-0.5 text-[9.5px] font-semibold text-sky-400">
            Pluie
          </span>
        </div>
      </div>
    </div>
  );
}
