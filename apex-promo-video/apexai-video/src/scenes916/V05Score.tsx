import React from "react";
import { AbsoluteFill } from "remotion";
import { E, kf, mix, prog, useT, wobble } from "../lib/anim";
import { Camera3D } from "../components/Camera3D";
import { Words } from "../components/fx";
import { DirBlur } from "../components/DirBlur";
import { ScoreCard, StatCards } from "../ui/AppUI";
import ui from "../data/ui-data.json";
import { SAFE, SW, SX } from "./layout916";

const CARD_K = 1.43;
const CARD_Y = 640;
// Centre de la valeur « 71/100 » : haut de carte + (24 + 25 + 24 + 31,5) × k.
const SCORE_Y = CARD_Y + 104.5 * CARD_K;

/** V05 — Score · 11,50 → 14,00 : carte « Score de Performance », « Ton pilotage, noté sur 100. », plongée sur 71/100, whip. */
export const V05Score: React.FC = () => {
  const T = useT();
  if (T >= 14.05) return null;

  const enter = prog(T, 11.5, 11.85, E.outExpo);
  const enterY = (1 - enter) * 900;
  const enterBlur = (1 - prog(T, 11.5, 11.72, E.outExpo)) * 38;
  const cardIn = mix(0.35, 1, prog(T, 11.5, 11.95, E.outExpo));
  const score = 71 * prog(T, 11.55, 12.35, E.outExpo);
  const tiles = [0, 1, 2, 3].map((i) => prog(T, 11.85 + i * 0.07, 11.85 + i * 0.07 + 0.4, E.outExpo));
  const tileValues = ui.score.breakdown.map((b, i) => b.value * prog(T, 11.9 + i * 0.07, 11.9 + i * 0.07 + 0.55, E.outExpo));
  const stats = [0, 1, 2, 3].map((i) => prog(T, 12.35 + i * 0.08, 12.35 + i * 0.08 + 0.45, E.outExpo));
  const glow = prog(T, 12.8, 13.1, E.outExpo);

  const ry = kf(T, [11.5, 13.2], [10, 3], E.inOut);
  const rx = kf(T, [11.5, 13.2], [9, 3], E.inOut);
  const driftX = wobble("v05x", T) * 5;
  const driftY = wobble("v05y", T) * 5;

  // Plongée sur « 71/100 » 13,20 → 13,60, ramenée au centre de la zone sûre.
  const dive = prog(T, 13.2, 13.6, E.outExpo);
  const diveBlur = prog(T, 13.45, 13.7, E.inOut);
  const textOut = prog(T, 13.1, 13.3, E.inOut);

  // Whip vers la gauche 13,70 → 14,00 (V06 arrive par la droite).
  const whip = prog(T, 13.7, 14.0, E.inExpo);
  const wBlur = Math.sin(Math.PI * Math.min(1, whip * 1.2)) * 46;

  return (
    <AbsoluteFill>
      <DirBlur id="v05v" x={0} y={enterBlur} />
      <DirBlur id="v05h" x={wBlur} y={0} />
      <AbsoluteFill style={{ transform: `translateX(${-1500 * whip}px)`, filter: wBlur > 0.3 ? "url(#v05h)" : undefined }}>
        <AbsoluteFill style={{ transform: `translateY(${enterY}px)`, filter: enterBlur > 0.3 ? "url(#v05v)" : undefined }}>
          <Camera3D
            perspective={1700}
            rx={rx}
            ry={ry}
            x={driftX}
            y={driftY + (870 - SCORE_Y) * dive}
            scale={mix(1, 3, dive)}
            origin={`${SX}px ${SCORE_Y}px`}
            blur={diveBlur * 14}
            opacity={cardIn}
          >
            <div
              style={{
                position: "absolute",
                left: SAFE.x0,
                top: CARD_Y,
                filter: cardIn < 0.99 ? `blur(${((1 - cardIn) * 16).toFixed(2)}px)` : undefined,
                transform: `translateY(${(1 - cardIn) * 40}px)`,
              }}
            >
              <ScoreCard k={CARD_K} width={SW} score={score} tiles={tiles} tileValues={tileValues} />
            </div>
            <div style={{ position: "absolute", left: SAFE.x0, top: CARD_Y + 430 }}>
              <StatCards k={1.3} width={SW} appear={stats} glowFirst={glow} style={{ gridTemplateColumns: "repeat(2, 1fr)" }} />
            </div>
          </Camera3D>
        </AbsoluteFill>

        {/* Texte en haut */}
        <div
          style={{
            position: "absolute",
            left: SAFE.x0,
            width: SW,
            top: 286,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: 1 - textOut,
            filter: textOut > 0.01 ? `blur(${(textOut * 16).toFixed(2)}px)` : undefined,
            transform: `translateY(${-60 * textOut}px)`,
          }}
        >
          <Words T={T} words="Ton pilotage," start={11.65} stagger={0.09} size={100} />
          <Words T={T} words={[{ t: "noté" }, { t: "sur" }, { t: "100.", kind: "gradient" }]} start={11.95} stagger={0.09} size={100} sweep={{ start: 12.0, dur: 0.8 }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
