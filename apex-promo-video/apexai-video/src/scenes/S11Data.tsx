import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { C, DISPLAY } from "../theme";
import { E, mix, prog, springAt, useT, wobble } from "../lib/anim";
import { DeltaChart, RadarChart, SpeedTraceChart } from "../ui/InsightsUI";

const WORDS = [
  { t: "Freinage.", at: 33.0 },
  { t: "Vitesse d'apex.", at: 33.5 },
  { t: "Trajectoire.", at: 34.0 },
  { t: "Régularité.", at: 34.5 },
];

/** S11 — Profondeur des données · 33,00 → 36,00 : trois graphiques réels en 3D, un mot par temps. */
export const S11Data: React.FC = () => {
  const T = useT();
  const { fps } = useVideoConfig();
  if (T >= 36.12) return null;

  const card = (at: number) => prog(T, at, at + 0.55, E.outExpo);
  const fly = (i: number) => prog(T, 35.4 + i * 0.08, 35.9 + i * 0.08, E.inExpo);
  const drift = (seed: string) => wobble(seed, T) * 6;

  const cards = [
    {
      at: 33.0,
      x: 960,
      y: 96,
      ry: -16,
      z: 0,
      node: <DeltaChart k={1.32} width={860} draw={prog(T, 33.15, 33.95, E.inOut)} />,
    },
    {
      at: 33.5,
      x: 860,
      y: 452,
      ry: -10,
      z: -140,
      node: <SpeedTraceChart k={1.32} width={860} draw={prog(T, 33.65, 34.45, E.inOut)} />,
    },
    {
      at: 34.0,
      x: 1400,
      y: 560,
      ry: -20,
      z: 90,
      node: <RadarChart k={1.25} width={420} grow={Math.min(1.04, springAt(T, 34.15, fps, { damping: 12, stiffness: 140, mass: 0.8 }))} />,
    },
  ];

  // Pile de mots : le mot actif est blanc, les précédents montent à 25 %.
  const active = WORDS.reduce((acc, w, i) => (T >= w.at ? i : acc), -1);
  const wordsOut = prog(T, 35.35, 36.05, E.inExpo);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ perspective: 1500 }}>
        {cards.map((c, i) => {
          const a = card(c.at);
          const fl = fly(i);
          if (T < c.at) return null;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: c.x,
                top: c.y,
                transformStyle: "preserve-3d",
                transform: `translate3d(${(1 - a) * 260 + drift(`s11x${i}`)}px, ${drift(`s11y${i}`)}px, ${c.z + fl * 900}px) rotateY(${mix(-32, c.ry, a)}deg) rotateX(4deg)`,
                opacity: a * (1 - fl),
                filter: a < 0.99 || fl > 0.01 ? `blur(${((1 - a) * 18 + fl * 20).toFixed(2)}px)` : undefined,
              }}
            >
              {c.node}
            </div>
          );
        })}
      </AbsoluteFill>

      {/* Mots, un par temps */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 0,
          bottom: 0,
          width: 760,
          opacity: 1 - wordsOut,
          filter: wordsOut > 0.01 ? `blur(${(wordsOut * 16).toFixed(2)}px)` : undefined,
          transform: `scale(${mix(1, 0.9, wordsOut)})`,
          transformOrigin: "0% 50%",
        }}
      >
        {WORDS.map((w, i) => {
          if (T < w.at) return null;
          const a = prog(T, w.at, w.at + 0.3, E.outExpo);
          const steps = active - i;
          const y = 520 - steps * 118 - (1 - a) * -40;
          const op = steps === 0 ? a : 0.25;
          return (
            <div
              key={w.t}
              style={{
                position: "absolute",
                left: 0,
                top: y,
                fontFamily: `'${DISPLAY}', sans-serif`,
                fontWeight: 700,
                fontSize: 110,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                whiteSpace: "nowrap",
                color: C.text,
                opacity: op,
                filter: a < 0.99 ? `blur(${((1 - a) * 14).toFixed(2)}px)` : undefined,
              }}
            >
              {w.t}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
