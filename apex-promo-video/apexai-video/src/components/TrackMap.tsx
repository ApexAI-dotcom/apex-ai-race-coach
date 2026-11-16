import React, { useMemo } from "react";
import { evolvePath, getLength, getPointAtLength } from "@remotion/paths";
import { C, DISPLAY } from "../theme";
import { CORNERS, FULL_PATH, GOLD_PATH, LOSS, N, PTS, SPEED_COLORS, polyline } from "../lib/track";

const GOLD_LEN = getLength(GOLD_PATH);
const FULL_LEN = getLength(FULL_PATH);

export type MapDot = { x: number; y: number; color: string; halo?: number; r?: number };

/**
 * Carte du circuit (boîte 1000×1000), fidèle à TrackMapCanvas.tsx :
 * ruban de piste, ligne colorée par la vitesse, trajectoire Tour IA dorée en pointillés,
 * marqueurs de virages à contour orange→rouge, points de départ/arrivée.
 */
export const TrackMap: React.FC<{
  id: string;
  size: number;
  ribbon?: number;
  /** Tracé progressif du ruban (0→1) ; 1 = complet. */
  ribbonDraw?: number;
  /** Trace blanche (S02) : progression 0→1 + tête lumineuse. */
  whiteTrace?: number;
  whiteHead?: boolean;
  /** Ligne colorée par la vitesse : progression 0→1. */
  speedLine?: number;
  speedHead?: boolean;
  /** Trajectoire Tour IA : progression 0→1, et position du scintillement 0→1. */
  goldLine?: number;
  goldShimmer?: number;
  /** Intensité d'allumage de chaque segment perdu (même ordre que LOSS). */
  lossLit?: number[];
  lossPulse?: number;
  /** Échelle de chaque marqueur (12 valeurs, 0 = caché). */
  markers?: number[];
  highlight?: { n: number; glow: number };
  /** Ondes autour d'un marqueur (progressions 0→1). */
  pulses?: { n: number; p: number[] };
  /** Pastille « Virage N » à côté d'un marqueur. */
  pill?: { n: number; text: string; p: number };
  dots?: MapDot[];
  startFinish?: number;
  /** Sol quadrillé en perspective (profondeur). */
  grid?: number;
  style?: React.CSSProperties;
}> = ({
  id,
  size,
  ribbon = 1,
  ribbonDraw = 1,
  whiteTrace = 0,
  whiteHead = false,
  speedLine = 0,
  speedHead = false,
  goldLine = 0,
  goldShimmer,
  lossLit,
  lossPulse = 1,
  markers,
  highlight,
  pulses,
  pill,
  dots = [],
  startFinish = 0,
  grid = 0,
  style,
}) => {
  const speedSegs = useMemo(
    () =>
      PTS.map((p, i) => {
        const q = PTS[(i + 1) % N];
        return { x1: p[0], y1: p[1], x2: q[0], y2: q[1], c: SPEED_COLORS[i] };
      }),
    [],
  );

  const nSpeed = Math.floor(speedLine * N);
  const speedHeadPt = (() => {
    const fi = Math.min(N - 0.001, speedLine * N);
    const i = Math.floor(fi);
    const f = fi - i;
    const a = PTS[i % N];
    const b = PTS[(i + 1) % N];
    return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f };
  })();

  const white = whiteTrace > 0 ? evolvePath(whiteTrace, FULL_PATH) : null;
  const whiteHeadPt = (() => {
    const fi = Math.min(N - 0.001, whiteTrace * N);
    const i = Math.floor(fi);
    const f = fi - i;
    const a = PTS[i % N];
    const b = PTS[(i + 1) % N];
    return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f };
  })();

  // Départ / arrivée : deux pastilles de part et d'autre de la ligne, sur la droite gauche.
  const p0 = PTS[0];
  const p1 = PTS[1];
  const tl = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1;
  const nx = -(p1[1] - p0[1]) / tl;
  const ny = (p1[0] - p0[0]) / tl;

  return (
    <svg width={size} height={size} viewBox="0 0 1000 1000" style={{ overflow: "visible", ...style }}>
      <defs>
        <linearGradient id={`${id}-corner`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={C.orangeChart} />
          <stop offset="100%" stopColor="#FF0000" />
        </linearGradient>
        <mask id={`${id}-goldmask`} maskUnits="userSpaceOnUse" x="-100" y="-100" width="1200" height="1200">
          <path
            d={GOLD_PATH}
            fill="none"
            stroke="white"
            strokeWidth={24}
            strokeLinecap="round"
            strokeDasharray={`${GOLD_LEN} ${GOLD_LEN}`}
            strokeDashoffset={GOLD_LEN * (1 - goldLine)}
          />
        </mask>
        <radialGradient id={`${id}-gridfade`} cx="500" cy="500" r="1050" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="55%" stopColor="white" stopOpacity="0.55" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id={`${id}-gridmask`} maskUnits="userSpaceOnUse" x="-700" y="-700" width="2400" height="2400">
          <rect x="-700" y="-700" width="2400" height="2400" fill={`url(#${id}-gridfade)`} />
        </mask>
      </defs>

      {grid > 0 ? (
        <g mask={`url(#${id}-gridmask)`} opacity={grid}>
          {Array.from({ length: 25 }, (_, k) => -700 + k * 100).map((v) => (
            <g key={`gr-${v}`}>
              <line x1={v} y1={-700} x2={v} y2={1700} stroke="rgba(255,255,255,0.09)" strokeWidth={1.5} />
              <line x1={-700} y1={v} x2={1700} y2={v} stroke="rgba(255,255,255,0.09)" strokeWidth={1.5} />
            </g>
          ))}
        </g>
      ) : null}

      {/* Ruban de piste (largeur réelle ≈ 8 m) */}
      <g opacity={ribbon}>
        {(() => {
          const ev = ribbonDraw < 1 ? evolvePath(Math.max(0.0001, ribbonDraw), FULL_PATH) : null;
          const dash = ev ? { strokeDasharray: ev.strokeDasharray, strokeDashoffset: ev.strokeDashoffset } : {};
          return (
            <>
              <path d={FULL_PATH} fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth={72} strokeLinejoin="round" strokeLinecap="round" {...dash} />
              <path d={FULL_PATH} fill="none" stroke="rgba(255,255,255,0.24)" strokeWidth={34} strokeLinejoin="round" strokeLinecap="round" {...dash} />
              <path d={FULL_PATH} fill="none" stroke="#161616" strokeWidth={31} strokeLinejoin="round" strokeLinecap="round" {...dash} />
            </>
          );
        })()}
      </g>

      {/* Tête lumineuse pendant le tracé du ruban */}
      {ribbonDraw > 0 && ribbonDraw < 1 ? (() => {
        const L = FULL_LEN;
        const d = L * ribbonDraw;
        const w = Math.min(d, L * 0.12);
        const head = getPointAtLength(FULL_PATH, d) ?? { x: 0, y: 0 };
        const dash = { strokeDasharray: `0 ${(d - w).toFixed(1)} ${w.toFixed(1)} ${L.toFixed(1)}` };
        return (
          <g opacity={ribbon}>
            <path d={FULL_PATH} fill="none" stroke={C.primary} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" opacity={0.45} style={{ filter: "blur(8px)" }} {...dash} />
            <path d={FULL_PATH} fill="none" stroke={C.primary} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" {...dash} />
            <circle cx={head.x} cy={head.y} r={26} fill="rgba(255,90,70,0.45)" style={{ filter: "blur(9px)" }} />
            <circle cx={head.x} cy={head.y} r={7} fill="#FFFFFF" />
          </g>
        );
      })() : null}

      {/* Départ / arrivée */}
      {startFinish > 0 ? (
        <g opacity={startFinish}>
          <circle cx={p0[0] + nx * 9} cy={p0[1] + ny * 9} r={6.5} fill={C.success} />
          <circle cx={p0[0] - nx * 9} cy={p0[1] - ny * 9} r={6.5} fill={C.primary} />
        </g>
      ) : null}

      {/* Trace blanche du duel */}
      {white ? (
        <g>
          <path
            d={FULL_PATH}
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={white.strokeDasharray}
            strokeDashoffset={white.strokeDashoffset}
          />
          {whiteHead && whiteTrace < 1 ? (
            <>
              <circle cx={whiteHeadPt.x} cy={whiteHeadPt.y} r={16} fill="rgba(255,255,255,0.25)" style={{ filter: "blur(6px)" }} />
              <circle cx={whiteHeadPt.x} cy={whiteHeadPt.y} r={5.5} fill="#FFFFFF" />
            </>
          ) : null}
        </g>
      ) : null}

      {/* Portions où le Tour 9 perd du temps */}
      {lossLit
        ? LOSS.map(([a, b], k) => {
            const lit = lossLit[k] ?? 0;
            if (lit <= 0) return null;
            const d = polyline(a, b + 1);
            return (
              <g key={`loss-${k}`} opacity={lit}>
                <path
                  d={d}
                  fill="none"
                  stroke={C.primary}
                  strokeWidth={26 * lossPulse}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.35}
                  style={{ filter: "blur(9px)" }}
                />
                <path d={d} fill="none" stroke={C.primary} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
              </g>
            );
          })
        : null}

      {/* Ligne colorée par la vitesse */}
      {nSpeed > 0 ? (
        <>
          <g opacity={0.22} style={{ filter: "blur(7px)" }}>
            {speedSegs.slice(0, nSpeed).map((s, i) => (
              <line key={`sg-${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.c} strokeWidth={20} strokeLinecap="round" />
            ))}
          </g>
          <g>
            {speedSegs.slice(0, nSpeed).map((s, i) => (
              <line key={`s-${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.c} strokeWidth={6} strokeLinecap="round" />
            ))}
          </g>
          {speedHead && speedLine < 1 ? (
            <>
              <circle cx={speedHeadPt.x} cy={speedHeadPt.y} r={18} fill="rgba(255,255,255,0.3)" style={{ filter: "blur(6px)" }} />
              <circle cx={speedHeadPt.x} cy={speedHeadPt.y} r={6} fill="#FFFFFF" />
            </>
          ) : null}
        </>
      ) : null}

      {/* Trajectoire Tour IA */}
      {goldLine > 0 ? (
        <g mask={`url(#${id}-goldmask)`}>
          <path d={GOLD_PATH} fill="none" stroke={C.gold} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" opacity={0.2} style={{ filter: "blur(8px)" }} />
          <path d={GOLD_PATH} fill="none" stroke={C.gold} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="22 11" />
          {goldShimmer !== undefined && goldShimmer > 0 && goldShimmer < 1 ? (
            <path
              d={GOLD_PATH}
              fill="none"
              stroke="#FFF6C2"
              strokeWidth={7}
              strokeLinecap="round"
              strokeDasharray={`${GOLD_LEN * 0.06} ${GOLD_LEN}`}
              strokeDashoffset={-GOLD_LEN * goldShimmer}
              style={{ filter: "blur(1.5px)" }}
            />
          ) : null}
        </g>
      ) : null}

      {/* Points du duel */}
      {dots.map((d, k) => (
        <g key={`dot-${k}`}>
          <circle cx={d.x} cy={d.y} r={(d.r ?? 9) * 2.6} fill={d.color} opacity={0.35 * (d.halo ?? 1)} style={{ filter: "blur(8px)" }} />
          <circle cx={d.x} cy={d.y} r={d.r ?? 9} fill={d.color} stroke="#FFFFFF" strokeWidth={2} />
        </g>
      ))}

      {/* Ondes autour du marqueur mis en avant */}
      {pulses
        ? (() => {
            const c = CORNERS.find((cc) => cc.n === pulses.n);
            if (!c) return null;
            return pulses.p.map((p, k) =>
              p > 0 && p < 1 ? (
                <circle
                  key={`pl-${k}`}
                  cx={c.x}
                  cy={c.y}
                  r={21 + p * 48}
                  fill="none"
                  stroke={C.primary}
                  strokeWidth={2.5 * (1 - p) + 0.5}
                  opacity={0.9 * (1 - p)}
                />
              ) : null,
            );
          })()
        : null}

      {/* Marqueurs de virages */}
      {markers
        ? CORNERS.map((c, k) => {
            const sc = markers[k] ?? 0;
            if (sc <= 0.001) return null;
            const r = 21;
            const hl = highlight && highlight.n === c.n ? highlight.glow : 0;
            return (
              <g key={`c-${c.n}`} transform={`translate(${c.x} ${c.y}) scale(${sc})`}>
                {hl > 0 ? <circle r={r + 16} fill={C.primary} opacity={0.35 * hl} style={{ filter: "blur(10px)" }} /> : null}
                <circle r={r + 4} fill="none" stroke="rgba(249,115,22,0.35)" strokeWidth={1.5} opacity={0.6} />
                <circle r={r} fill="#000000" />
                <circle r={r} fill="none" stroke={`url(#${id}-corner)`} strokeWidth={3.2} />
                <text
                  y={5.5}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize={15}
                  fontWeight={800}
                  fontFamily={`'${DISPLAY}', sans-serif`}
                >
                  {c.n}
                </text>
                <polygon points={`0,${-r - 6} -5,${-r - 12} 5,${-r - 12}`} fill="#FFFFFF" />
              </g>
            );
          })
        : null}
      {/* Pastille « Virage N » */}
      {pill && pill.p > 0
        ? (() => {
            const c = CORNERS.find((cc) => cc.n === pill.n);
            if (!c) return null;
            const w = 92;
            const h = 26;
            const x = c.x + 30;
            const y = c.y - h - 18;
            return (
              <g opacity={pill.p} transform={`translate(${x} ${y + (1 - pill.p) * 8})`}>
                <rect width={w} height={h} rx={13} fill="rgba(10,10,10,0.92)" stroke="rgba(255,66,66,0.6)" strokeWidth={1.2} />
                <text x={12} y={17.5} fill={C.primary} fontSize={12.5} fontWeight={700} fontFamily={`'Inter', sans-serif`}>
                  {pill.text}
                </text>
                <g transform={`translate(${w - 22} 6.5) scale(0.55)`} fill="none" stroke={C.primary} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                  <circle cx="12" cy="10" r="3" />
                </g>
              </g>
            );
          })()
        : null}
    </svg>
  );
};
