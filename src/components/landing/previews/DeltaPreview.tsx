import { memo, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { DEMO_CHART, DEMO_CORNERS, DEMO_LAP, DEMO_LENGTH_M, DEMO_VIEWBOX } from "../data/demoSession";
import { DEMO_LAP_SECONDS, TRACK_D, indexAtTime, trackPointAt, trackX, trackY } from "../data/track";
import { useFrameLoop } from "../hooks";

/**
 * « Compare tes tours » : le duel entre le meilleur tour (T4) et le tour 9.
 * La courbe d'écart monte quand on perd du temps ; sur la carte, les deux
 * points font le tour avec leur vrai décalage. Données réelles de la session
 * de démo (aucun chiffre inventé).
 */

const GREEN = "#22C55E";
const BLUE = "#3B82F6";
const ORANGE = "#F97316";

// Repère du graphique (unités du viewBox).
const W = 420;
const H = 214;
const PAD = { l: 40, r: 10, t: 28, b: 26 };
const PW = W - PAD.l - PAD.r;
const PH = H - PAD.t - PAD.b;
const Y_MIN = -0.1;
const Y_MAX = 0.7;
const N = DEMO_CHART.delta.length;

const xOf = (k: number) => PAD.l + (k / (N - 1)) * PW;
const yOf = (d: number) => PAD.t + (1 - (d - Y_MIN) / (Y_MAX - Y_MIN)) * PH;

const DELTA_PATH = DEMO_CHART.delta.map((d, k) => `${k ? "L" : "M"}${xOf(k).toFixed(1)},${yOf(d).toFixed(1)}`).join("");
const Y_TICKS = [0, 0.3, 0.6];
const X_TICKS = [0, 400, 800, DEMO_LENGTH_M];

const LOOP_SECONDS = 9;
const HOLD_SECONDS = 1.6;
/** Instant montré quand rien ne bouge (avant l'entrée à l'écran, ou « réduire les animations »). */
const STATIC_LAP = DEMO_LAP_SECONDS * 0.7;

const fmtDelta = (d: number) => `${d >= 0 ? "+" : "−"}${Math.abs(d).toFixed(2)} s`;

/** Fond du graphique : immobile, jamais redessiné. */
const ChartBase = memo(function ChartBase() {
  return (
    <>
      {/* Virages : bandes verticales, comme sur le graphique de l'app. */}
      {DEMO_CORNERS.map((c, idx) => {
        const k = c.i / 2;
        const prevK = idx ? DEMO_CORNERS[idx - 1].i / 2 : -99;
        // Deux virages très proches : le second libellé monte d'un cran.
        const high = (k - prevK) * (PW / (N - 1)) < 24 && idx % 2 === 1;
        return (
          <g key={c.n}>
            <rect
              x={xOf(Math.max(0, k - 5))}
              y={PAD.t}
              width={xOf(Math.min(N - 1, k + 5)) - xOf(Math.max(0, k - 5))}
              height={PH}
              fill="rgba(249,115,22,0.16)"
            />
            <text
              className="max-sm:hidden"
              x={xOf(k)}
              y={PAD.t - (high ? 15 : 5)}
              textAnchor="middle"
              fontSize="9"
              fontWeight="700"
              fill={ORANGE}
            >
              V{c.n}
            </text>
          </g>
        );
      })}

      {Y_TICKS.map((t) => (
        <g key={t}>
          <line x1={PAD.l} x2={W - PAD.r} y1={yOf(t)} y2={yOf(t)} stroke="rgba(255,255,255,0.08)" strokeDasharray={t === 0 ? undefined : "3 4"} />
          <text x={PAD.l - 6} y={yOf(t) + 3} textAnchor="end" fontSize="10" fill="#8a8a8a">
            {t === 0 ? "0.0s" : `+${t.toFixed(1)}s`}
          </text>
        </g>
      ))}
      {X_TICKS.map((m) => (
        <text
          key={m}
          x={xOf(Math.min(N - 1, (m / DEMO_LENGTH_M) * (N - 1)))}
          y={H - 8}
          textAnchor={m === 0 ? "start" : m === DEMO_LENGTH_M ? "end" : "middle"}
          fontSize="10"
          fill="#8a8a8a"
        >
          {m} m
        </text>
      ))}

      {/* T4 = la référence : la ligne zéro. */}
      <line x1={PAD.l} x2={W - PAD.r} y1={yOf(0)} y2={yOf(0)} stroke={GREEN} strokeWidth="2" />
    </>
  );
});

/** Circuit en filigrane sous les deux points. */
const MiniTrack = memo(function MiniTrack() {
  return (
    <>
      <path d={TRACK_D} fill="none" stroke="rgba(255,255,255,0.26)" strokeWidth="72" strokeLinejoin="round" />
      <path d={TRACK_D} fill="none" stroke="#1b1b1f" strokeWidth="62" strokeLinejoin="round" />
      <path d={TRACK_D} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="5" strokeDasharray="3 14" strokeLinecap="round" />
      <rect x={trackX(0) - 30} y={trackY(0) - 4} width="60" height="8" rx="2" fill="#fff" opacity="0.85" />
    </>
  );
});

export function DeltaPreview({ play }: { play: boolean }) {
  const reduce = useReducedMotion();
  const clipRef = useRef<SVGRectElement>(null);
  const headRef = useRef<SVGLineElement>(null);
  const headDotRef = useRef<SVGCircleElement>(null);
  const hudRef = useRef<HTMLSpanElement>(null);
  const t4Ref = useRef<SVGCircleElement>(null);
  const t9Ref = useRef<SVGCircleElement>(null);

  const draw = (lapT: number, full: boolean) => {
    const kk = Math.min(N - 1, indexAtTime(lapT) / 2); // échantillon atteint par le T4
    const lo = Math.floor(kk);
    const hi = Math.min(N - 1, lo + 1);
    const d = DEMO_CHART.delta[lo] + (DEMO_CHART.delta[hi] - DEMO_CHART.delta[lo]) * (kk - lo);
    const x = xOf(kk);
    clipRef.current?.setAttribute("width", (full ? PW + PAD.r : x - PAD.l).toFixed(1));
    headRef.current?.setAttribute("x1", x.toFixed(1));
    headRef.current?.setAttribute("x2", x.toFixed(1));
    headDotRef.current?.setAttribute("cx", x.toFixed(1));
    headDotRef.current?.setAttribute("cy", yOf(d).toFixed(1));
    if (hudRef.current) hudRef.current.textContent = fmtDelta(d);
    const a = trackPointAt(indexAtTime(lapT));
    const b = trackPointAt(indexAtTime(lapT, DEMO_CHART.delta));
    t4Ref.current?.setAttribute("cx", a.x.toFixed(1));
    t4Ref.current?.setAttribute("cy", a.y.toFixed(1));
    t9Ref.current?.setAttribute("cx", b.x.toFixed(1));
    t9Ref.current?.setAttribute("cy", b.y.toFixed(1));
  };

  useFrameLoop(play && !reduce, (t) => {
    const cycle = LOOP_SECONDS + HOLD_SECONDS;
    const p = Math.min(1, (t % cycle) / LOOP_SECONDS);
    draw(p * DEMO_LAP_SECONDS, p >= 1);
  });

  const start = trackPointAt(indexAtTime(STATIC_LAP));
  const startB = trackPointAt(indexAtTime(STATIC_LAP, DEMO_CHART.delta));
  const kStatic = Math.min(N - 1, indexAtTime(STATIC_LAP) / 2);
  const dStatic = DEMO_CHART.delta[Math.round(kStatic)];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
      {/* Carte + chiffre clé */}
      <div className="flex shrink-0 items-center gap-4 sm:w-[170px] sm:flex-col sm:gap-3">
        <svg
          viewBox={DEMO_VIEWBOX}
          className="h-[124px] w-[104px] sm:h-[188px] sm:w-[158px]"
          role="img"
          aria-label="Circuit d'Adria : le tour 4 (vert) et le tour 9 (bleu) font le tour, le bleu accuse un retard"
        >
          <MiniTrack />
          <circle ref={t9Ref} cx={startB.x} cy={startB.y} r="27" fill={BLUE} stroke="#fff" strokeWidth="6" />
          <circle ref={t4Ref} cx={start.x} cy={start.y} r="27" fill={GREEN} stroke="#fff" strokeWidth="6" />
        </svg>
        <div className="text-left sm:text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Écart du tour 9</p>
          <p className="font-display text-3xl font-bold leading-none tabular-nums text-[#3B82F6]">
            <span ref={hudRef}>{fmtDelta(dStatic)}</span>
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            en fin de tour : <b className="text-foreground">{fmtDelta(DEMO_LAP.deltaFinal)}</b>
          </p>
        </div>
      </div>

      {/* Courbe d'écart */}
      <div className="min-w-0 flex-1">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mx-auto h-auto w-full max-w-[640px]"
          role="img"
          aria-label="Delta temps : l'écart cumulé du tour 9 sur le tour 4 monte là où le tour 9 perd du temps"
        >
          <defs>
            <clipPath id="lp-delta-clip">
              <rect ref={clipRef} x={PAD.l} y="0" width={PW + PAD.r} height={H} />
            </clipPath>
          </defs>
          <ChartBase />
          <path d={DELTA_PATH} fill="none" stroke={BLUE} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" clipPath="url(#lp-delta-clip)" />
          <line ref={headRef} x1={xOf(kStatic)} x2={xOf(kStatic)} y1={PAD.t} y2={PAD.t + PH} stroke="rgba(255,255,255,0.35)" strokeDasharray="3 3" />
          <circle ref={headDotRef} cx={xOf(kStatic)} cy={yOf(dStatic)} r="4.5" fill={BLUE} stroke="#0a0a0a" strokeWidth="2" />
        </svg>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-[3px] w-4 rounded-full" style={{ background: GREEN }} /> T4 (meilleur tour)
          </span>
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-[3px] w-4 rounded-full" style={{ background: BLUE }} /> T9
          </span>
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-3 rounded-[2px]" style={{ background: "rgba(249,115,22,0.35)" }} /> Virages
          </span>
        </div>
      </div>
    </div>
  );
}

export default DeltaPreview;
