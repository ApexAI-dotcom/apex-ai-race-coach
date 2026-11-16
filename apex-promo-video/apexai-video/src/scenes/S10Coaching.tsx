import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../theme";
import { E, kf, mix, prog, useT, wobble } from "../lib/anim";
import { CORNERS } from "../lib/track";
import { Camera3D } from "../components/Camera3D";
import { TrackMap } from "../components/TrackMap";
import { Words } from "../components/fx";
import { DirBlur } from "../components/DirBlur";
import { CoachingCard } from "../ui/InsightsUI";
import { MAP, MAP_CX, MAP_CY } from "./S09PerfectLap";

/** S10 — Coaching · 29,00 → 33,00 : plan serré sur le virage 10, conseils classés par temps perdu. */
export const S10Coaching: React.FC = () => {
  const T = useT();
  if (T >= 33.05) return null;

  // Même caméra que la fin de S09 (raccord), puis léger recul.
  const v10 = CORNERS.find((c) => c.n === 10)!;
  const originX = MAP_CX - MAP / 2 + (v10.x / 1000) * MAP;
  const originY = MAP_CY - MAP / 2 + (v10.y / 1000) * MAP;
  const mapScale = kf(T, [29.0, 33.0], [3.2, 2.75], E.inOut);
  const driftX = wobble("s09x", T) * 6;
  const driftY = wobble("s09y", T) * 4;
  const bg = prog(T, 29.3, 29.9, E.inOut);

  // Carte 1, puis carte 2 qui passe devant.
  const c1 = prog(T, 29.3, 29.9, E.ios);
  const title1 = prog(T, 29.45, 30.1, E.linear);
  const body1 = prog(T, 29.7, 30.2, E.outExpo);
  const hl1 = prog(T, 30.4, 30.8, E.inOut);
  const glow1 = Math.sin(Math.PI * prog(T, 29.9, 30.4, E.linear));
  const recede = prog(T, 31.3, 31.8, E.ios);
  const c2 = prog(T, 31.3, 31.8, E.ios);
  const title2 = prog(T, 31.4, 31.95, E.linear);

  // Recul + pivot 31,90 → 32,70, puis whip vers la gauche.
  const pivot = prog(T, 31.9, 32.7, E.inOut);
  const whip = prog(T, 32.7, 33.0, E.inExpo);
  const wx = -1600 * whip;
  const wBlur = Math.sin(Math.PI * Math.min(1, whip * 1.2)) * 46;

  const textOut = prog(T, 32.6, 32.85, E.inExpo);

  return (
    <AbsoluteFill>
      <DirBlur id="s10h" x={wBlur} y={0} />
      <AbsoluteFill style={{ transform: `translateX(${wx}px)`, filter: wBlur > 0.3 ? "url(#s10h)" : undefined }}>
        {/* Carte du circuit en arrière-plan (profondeur de champ) */}
        <AbsoluteFill style={{ filter: bg > 0.01 ? `blur(${(bg * 8).toFixed(2)}px) brightness(${mix(1, 0.5, bg).toFixed(3)})` : undefined }}>
          <Camera3D perspective={1450} rx={25} ry={-4} rz={0} x={driftX} y={driftY} scale={mapScale} origin={`${originX}px ${originY}px`}>
            <div style={{ position: "absolute", left: MAP_CX - MAP / 2, top: MAP_CY - MAP / 2 }}>
              <TrackMap
                id="s10"
                size={MAP}
                ribbon={1}
                speedLine={1}
                goldLine={1}
                markers={CORNERS.map(() => 1)}
                startFinish={1}
                grid={0.8}
                highlight={{ n: 10, glow: 1 }}
                pulses={{ n: 10, p: [prog(T, 29.0, 29.55, E.outExpo), prog(T, 29.22, 29.8, E.outExpo)] }}
                pill={{ n: 10, text: "Virage 10", p: prog(T, 29.1, 29.4, E.outExpo) }}
              />
            </div>
          </Camera3D>
        </AbsoluteFill>

        {/* Texte */}
        <div
          style={{
            position: "absolute",
            left: 120,
            top: 120,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 14,
            opacity: 1 - textOut,
          }}
        >
          <Words T={T} words="Virage par virage." start={29.5} stagger={0.09} size={84} style={{ justifyContent: "flex-start" }} />
          <Words
            T={T}
            words="Classés par temps perdu."
            start={30.2}
            stagger={0.06}
            size={38}
            weight={500}
            font="body"
            style={{ justifyContent: "flex-start" }}
            wordStyle={{ color: C.muted }}
          />
        </div>

        {/* Pile de cartes */}
        <AbsoluteFill style={{ perspective: 1600 }}>
          <AbsoluteFill
            style={{
              transformStyle: "preserve-3d",
              transformOrigin: "1290px 560px",
              transform: `rotateY(${-18 * pivot}deg) scale(${mix(1, 0.9, pivot)})`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 760,
                top: 360,
                opacity: c1 * mix(1, 0.6, recede),
                filter: c1 < 0.99 ? `blur(${((1 - c1) * 14).toFixed(2)}px)` : recede > 0.01 ? `blur(${(recede * 2).toFixed(2)}px)` : undefined,
                transform: `translateY(${(1 - c1) * 140 - 40 * recede}px) scale(${mix(1, 0.94, recede)})`,
                transformOrigin: "50% 0%",
              }}
            >
              <CoachingCard k={1.5} width={1060} index={0} title={title1} body={body1} highlight={hl1} lostGlow={glow1} accent />
            </div>
            {T >= 31.3 ? (
              <div
                style={{
                  position: "absolute",
                  left: 760,
                  top: 470,
                  opacity: c2,
                  filter: c2 < 0.99 ? `blur(${((1 - c2) * 14).toFixed(2)}px)` : undefined,
                  transform: `translateY(${(1 - c2) * 120}px) translateZ(40px)`,
                }}
              >
                <CoachingCard k={1.5} width={1060} index={1} title={title2} body={prog(T, 31.6, 32.0, E.outExpo)} accent />
              </div>
            ) : null}
          </AbsoluteFill>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
