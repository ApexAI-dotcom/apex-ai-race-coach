import { CSSProperties } from "react";

/**
 * Petits visuels de l'onglet « Comparer deux séances » (aperçu Rookie /
 * visiteur) : un par encart. Mêmes libellés que le vrai comparateur ; les
 * valeurs sont des données d'exemple. Animations `lp-*` jouées quand le cadre
 * parent porte `lp-on`.
 */

const delay = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;

const ME = "#f97316";
const MATE = "#e5e5e5";

/* ── 1. Deux tours superposés : les deux courbes de vitesse ─────────────── */

const SPEED_A = "M4,70 C18,20 30,18 40,52 S58,88 70,40 S92,14 104,46 S126,86 138,30 S160,22 176,58";
const SPEED_B = "M4,72 C18,26 30,24 41,56 S59,90 71,46 S93,20 105,50 S127,88 139,36 S161,26 176,62";

export function OverlayVisual() {
  return (
    <div className="flex h-full flex-col justify-center gap-2 px-3.5 sm:px-5">
      <svg viewBox="0 0 180 96" preserveAspectRatio="none" className="h-[84px] w-full" fill="none">
        <path d={SPEED_B} pathLength={1} className="lp-trace" stroke={MATE} strokeOpacity="0.7" strokeWidth="2" style={delay(0.1)} />
        <path d={SPEED_A} pathLength={1} className="lp-trace" stroke={ME} strokeWidth="2.4" style={delay(0.3)} />
      </svg>
      <div className="flex items-center gap-4 text-[10px]">
        <span className="lp-rise inline-flex items-center gap-1.5 text-foreground" style={delay(1.2)}>
          <span className="h-[3px] w-4 rounded-full" style={{ background: ME }} /> Toi · 47,92 s
        </span>
        <span className="lp-rise inline-flex items-center gap-1.5 text-muted-foreground" style={delay(1.35)}>
          <span className="h-[3px] w-4 rounded-full" style={{ background: MATE }} /> Coéquipier · 48,34 s
        </span>
      </div>
    </div>
  );
}

/* ── 2. L'écart mètre par mètre ─────────────────────────────────────────── */

export function GapVisual() {
  return (
    <div className="flex h-full flex-col justify-center gap-1.5 px-3.5 sm:px-5">
      <div className="flex items-baseline justify-between">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Écart cumulé</span>
        <span className="lp-pop font-display text-[18px] font-bold tabular-nums text-green-500" style={delay(1.3)}>
          −0,42 s
        </span>
      </div>
      <svg viewBox="0 0 180 70" preserveAspectRatio="none" className="h-[72px] w-full" fill="none">
        <line x1="0" y1="20" x2="180" y2="20" stroke="white" strokeOpacity="0.12" strokeDasharray="3 4" />
        <path
          d="M2,20 L30,22 L48,30 L70,31 L92,40 L110,42 L128,52 L150,55 L178,62"
          pathLength={1}
          className="lp-trace"
          stroke={ME}
          strokeWidth="2.2"
          strokeLinejoin="round"
          style={delay(0.2)}
        />
      </svg>
      <p className="lp-rise text-[10px] text-muted-foreground" style={delay(1.5)}>
        Tu gagnes surtout entre le virage 3 et le virage 6.
      </p>
    </div>
  );
}

/* ── 3. Virage par virage : qui freine plus tard, qui sort plus fort ───── */

const ROWS = [
  { v: "V3", label: "Freinage", me: 0.82, mate: 0.64, note: "4 m plus tard" },
  { v: "V5", label: "Vitesse mini", me: 0.7, mate: 0.74, note: "−2 km/h" },
  { v: "V7", label: "Sortie", me: 0.9, mate: 0.72, note: "+3 km/h" },
];

export function CornersVisual() {
  return (
    <ul className="flex h-full flex-col justify-center gap-2 px-3.5 sm:px-5">
      {ROWS.map((r, i) => (
        <li key={r.v} className="lp-rise grid grid-cols-[28px_1fr_70px] items-center gap-2 text-[10px]" style={delay(0.15 + i * 0.25)}>
          <span className="font-display font-bold text-foreground">{r.v}</span>
          <div className="space-y-1">
            <div className="h-1.5 rounded-full bg-white/[0.07]">
              <div className="lp-grow h-full rounded-full" style={{ width: `${r.me * 100}%`, background: ME, ...delay(0.3 + i * 0.25) }} />
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.07]">
              <div className="lp-grow h-full rounded-full" style={{ width: `${r.mate * 100}%`, background: MATE, opacity: 0.6, ...delay(0.35 + i * 0.25) }} />
            </div>
          </div>
          <span className={r.me >= r.mate ? "text-right text-green-500" : "text-right text-amber-500"}>{r.note}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── 4. Ton coéquipier, ou deux de tes séances ──────────────────────────── */

export function SourcesVisual() {
  return (
    <div className="flex h-full items-center justify-center gap-3 px-3.5 sm:px-5">
      {[
        { t: "Ton fichier", s: "Varennes · 14 h 10", c: ME },
        { t: "Le sien", s: "Varennes · 14 h 30", c: MATE },
      ].map((f, i) => (
        <div
          key={f.t}
          className="lp-pop w-[46%] rounded-xl border border-white/[0.08] bg-black/30 p-2.5"
          style={delay(0.2 + i * 0.3)}
        >
          <span className="mb-1.5 block h-1 w-6 rounded-full" style={{ background: f.c }} />
          <p className="text-[11px] font-semibold text-foreground">{f.t}</p>
          <p className="text-[9.5px] text-muted-foreground">{f.s}</p>
        </div>
      ))}
    </div>
  );
}
