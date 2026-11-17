import React from "react";
import { C, FONT, INK, alpha } from "../kit/tokens";
import { fr } from "../kit/text";
import { PTS } from "../../lib/track";
import { E, prog } from "../../lib/anim";

/**
 * Courbes de vitesse de deux tours (T4 blanc, T9 rouge) sur la zone d'un virage,
 * coupée en deux : freinage (jusqu'au pic d'écart) et sortie.
 * Données réelles d'adria-lap.json (points[i] = [x, y, v4, t4, t9, v9]).
 * Animation : tracé des courbes, puis zone « entrée » au cue[0], zone « sortie » au cue[1].
 */
const LAP_M = 1225;
export const CornerSplit: React.FC<{
  T: number;
  t0: number;
  width: number;
  range: [number, number];
  splitAt: number;
  cues: number[];
  labels: [string, string, string, string]; // titre entrée, valeur entrée, titre sortie, valeur sortie
}> = ({ T, t0, width, range, splitAt, cues, labels }) => {
  const [i0, i1] = range;
  const pts = PTS.slice(i0, i1 + 1);
  const H = width * 1.02;
  const padL = 70, padR = 20, padT = 150, padB = 70;
  const vMin = 50, vMax = 112;
  const step = LAP_M / PTS.length;
  const X = (i: number) => padL + ((i - i0) / (i1 - i0)) * (width - padL - padR);
  const Y = (v: number) => padT + (1 - (v - vMin) / (vMax - vMin)) * (H - padT - padB);
  const draw = prog(T, t0, t0 + 1.3, E.inOut);
  const nShow = Math.max(2, Math.round(pts.length * draw));
  const line = (col: 2 | 5) =>
    pts
      .slice(0, nShow)
      .map((p, k) => `${k ? "L" : "M"}${X(i0 + k).toFixed(1)},${Y(p[col]).toFixed(1)}`)
      .join(" ");
  const a = prog(T, t0 + cues[0], t0 + cues[0] + 0.5, E.ios);
  const b = prog(T, t0 + cues[1], t0 + cues[1] + 0.5, E.ios);
  const xs = X(splitAt);
  const zone = (xA: number, xB: number, col: string, k: number, title: string, val: string, dim: number) => (
    <g opacity={k * (1 - 0.55 * dim)}>
      <rect x={xA} y={padT - 20} width={xB - xA} height={H - padT - padB + 20} fill={alpha(col, 0.14)} rx={14} />
      <text x={(xA + xB) / 2} y={padT - 92} textAnchor="middle" fill={INK.soft} fontFamily={FONT.body} fontWeight={600} fontSize={26} letterSpacing="0.16em">
        {fr(title).toUpperCase()}
      </text>
      <text x={(xA + xB) / 2} y={padT - 36} textAnchor="middle" fill={col} fontFamily={FONT.display} fontWeight={700} fontSize={56} letterSpacing="-0.03em">
        {fr(val)}
      </text>
    </g>
  );
  const ticks = [60, 80, 100];
  const mAt = (i: number) => Math.round(i * step);
  return (
    <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} style={{ overflow: "visible" }}>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={padL} x2={width - padR} y1={Y(v)} y2={Y(v)} stroke={alpha(C.text, 0.08)} strokeWidth={2} />
          <text x={padL - 14} y={Y(v) + 9} textAnchor="end" fill={INK.muted} fontFamily={FONT.body} fontWeight={500} fontSize={24}>
            {v}
          </text>
        </g>
      ))}
      <text x={padL - 14} y={Y(vMax) + 4} textAnchor="end" fill={INK.muted} fontFamily={FONT.body} fontWeight={500} fontSize={22}>
        km/h
      </text>
      {[i0, splitAt, i1].map((i) => (
        <text key={i} x={X(i)} y={H - padB + 46} textAnchor="middle" fill={INK.muted} fontFamily={FONT.body} fontWeight={500} fontSize={24}>
          {`${mAt(i)} m`}
        </text>
      ))}
      {zone(X(i0), xs, C.primary, a, labels[0], labels[1], b)}
      {zone(xs, X(i1), C.success, b, labels[2], labels[3], 0)}
      <line x1={xs} x2={xs} y1={padT - 20} y2={H - padB} stroke={alpha(C.text, 0.35 * Math.max(a, b))} strokeWidth={2} strokeDasharray="8 8" />
      <path d={line(2)} fill="none" stroke={alpha(C.text, 0.9)} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <path d={line(5)} fill="none" stroke={C.primary} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 10px ${alpha(C.primary, 0.6)})` }} />
      {/* légende */}
      <g transform={`translate(${padL} ${H + 10})`}>
        <rect width={34} height={8} y={-6} rx={4} fill={alpha(C.text, 0.9)} />
        <text x={46} y={4} fill={INK.soft} fontFamily={FONT.body} fontWeight={600} fontSize={26}>
          Tour 4
        </text>
        <rect x={190} width={34} height={8} y={-6} rx={4} fill={C.primary} />
        <text x={236} y={4} fill={INK.soft} fontFamily={FONT.body} fontWeight={600} fontSize={26}>
          Tour 9
        </text>
      </g>
    </svg>
  );
};
