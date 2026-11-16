import React, { useMemo } from "react";
import { CORNERS, N, PTS, SPEED_COLORS } from "../../lib/track";
import { C, FONT, alpha } from "./tokens";

/**
 * Trace de vitesse réelle du Tour 4 à Adria (vitesse en fonction de la distance),
 * colorée comme dans l'app (speedToColor), avec halo et marqueurs de virages aux creux.
 * C'est « la trace » de la marque, en version télémétrie.
 */
export const SpeedTrace: React.FC<{
  id: string;
  x0: number;
  width: number;
  yTop: number;
  height: number;
  stroke?: number;
  markers?: boolean;
  markerSize?: number;
  /** Fraction du tour dessinée (0→1). */
  upTo?: number;
  fill?: boolean;
  grid?: boolean;
  glow?: number;
  /** Ajoute un point lumineux en bout de trace. */
  head?: boolean;
  style?: React.CSSProperties;
  canvasWidth: number;
  canvasHeight: number;
}> = ({ id, x0, width, yTop, height, stroke = 6, markers = true, markerSize = 26, upTo = 1, fill = true, grid = true, glow = 1, head = false, style, canvasWidth, canvasHeight }) => {
  const vmin = 50;
  const vmax = 122;
  const pts = useMemo(
    () =>
      PTS.map((p, i) => ({
        x: x0 + (i / (N - 1)) * width,
        y: yTop + height * (1 - (p[2] - vmin) / (vmax - vmin)),
        c: SPEED_COLORS[i],
      })),
    [x0, width, yTop, height],
  );
  const last = Math.max(1, Math.round(upTo * (N - 1)));
  const shown = pts.slice(0, last + 1);
  const line = `M${shown.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L")}`;
  const area = `${line} L${shown[shown.length - 1].x.toFixed(1)},${(yTop + height).toFixed(1)} L${shown[0].x.toFixed(1)},${(yTop + height).toFixed(1)} Z`;
  return (
    <svg width={canvasWidth} height={canvasHeight} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", ...style }}>
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.primary} stopOpacity={0.22} />
          <stop offset="100%" stopColor={C.primary} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}-cm`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={C.orangeChart} />
          <stop offset="100%" stopColor={C.primary} />
        </linearGradient>
      </defs>
      {grid
        ? [60, 90, 120].map((v) => {
            const y = yTop + height * (1 - (v - vmin) / (vmax - vmin));
            return <line key={v} x1={x0} x2={x0 + width} y1={y} y2={y} stroke={alpha(C.text, 0.07)} strokeWidth={2} strokeDasharray="4 10" />;
          })
        : null}
      {fill ? <path d={area} fill={`url(#${id}-fill)`} /> : null}
      <g opacity={0.35 * glow} style={{ filter: `blur(${stroke * 2.2}px)` }}>
        {shown.slice(0, -1).map((p, i) => (
          <line key={`g${i}`} x1={p.x} y1={p.y} x2={shown[i + 1].x} y2={shown[i + 1].y} stroke={p.c} strokeWidth={stroke * 3.2} strokeLinecap="round" />
        ))}
      </g>
      <g>
        {shown.slice(0, -1).map((p, i) => (
          <line key={`s${i}`} x1={p.x} y1={p.y} x2={shown[i + 1].x} y2={shown[i + 1].y} stroke={p.c} strokeWidth={stroke} strokeLinecap="round" />
        ))}
      </g>
      {head ? (
        <g>
          <circle cx={shown[shown.length - 1].x} cy={shown[shown.length - 1].y} r={stroke * 4} fill={alpha(C.text, 0.25)} style={{ filter: `blur(${stroke}px)` }} />
          <circle cx={shown[shown.length - 1].x} cy={shown[shown.length - 1].y} r={stroke * 1.3} fill={C.text} />
        </g>
      ) : null}
      {markers
        ? CORNERS.filter((c) => c.i <= last).map((c) => {
            const p = pts[c.i];
            const r = markerSize / 2;
            const yy = p.y + r + stroke * 2.2;
            return (
              <g key={`m${c.n}`} transform={`translate(${p.x} ${yy})`}>
                <line x1={0} x2={0} y1={-r - stroke * 1.6} y2={-r} stroke={alpha(C.text, 0.4)} strokeWidth={2} />
                <circle r={r} fill={C.bgDeep} />
                <circle r={r} fill="none" stroke={`url(#${id}-cm)`} strokeWidth={Math.max(2, r * 0.16)} />
                <text y={r * 0.36} textAnchor="middle" fill={C.text} fontFamily={FONT.display} fontWeight={700} fontSize={r * 0.95}>
                  {c.n}
                </text>
              </g>
            );
          })
        : null}
    </svg>
  );
};
