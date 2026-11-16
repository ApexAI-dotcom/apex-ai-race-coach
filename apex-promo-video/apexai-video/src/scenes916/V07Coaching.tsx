import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../theme";
import { E, kf, mix, prog, useT, wobble } from "../lib/anim";
import { CORNERS } from "../lib/track";
import { Camera3D } from "../components/Camera3D";
import { TrackMap } from "../components/TrackMap";
import { Words } from "../components/fx";
import { CoachingCard } from "../ui/InsightsUI";
import { MAP9, SAFE, SW, SX } from "./layout916";
import { V06_MAP_CY, v10Origin } from "./V06PerfectLap";

/** V07 — Coaching · 18,00 → 20,50 : plan serré sur le virage 10, carte Priorité 1, surlignage doré. */
export const V07Coaching: React.FC = () => {
  const T = useT();
  if (T >= 20.6) return null;

  const o = v10Origin();
  const mapScale = kf(T, [18.0, 20.5], [3.2, 2.8], E.inOut);
  const driftX = wobble("v06x", T) * 6;
  const driftY = wobble("v06y", T) * 5;
  const bg = prog(T, 18.3, 18.9, E.inOut);

  const c1 = prog(T, 18.3, 18.85, E.ios);
  const title1 = prog(T, 18.45, 19.05, E.linear);
  const body1 = prog(T, 18.7, 19.2, E.outExpo);
  const glow1 = Math.sin(Math.PI * prog(T, 18.9, 19.4, E.linear));
  const hl1 = prog(T, 19.4, 19.85, E.inOut);
  const cardTilt = kf(T, [18.3, 20.2], [8, -4], E.inOut);
  // Carte suivante (Priorité 2) : la liste est classée par temps perdu.
  const c2 = prog(T, 19.5, 19.95, E.ios);
  const title2 = prog(T, 19.6, 20.1, E.linear);

  // Break : tout recule et s'efface 20,20 → 20,55.
  const back = prog(T, 20.2, 20.55, E.inExpo);

  return (
    <AbsoluteFill
      style={{
        opacity: 1 - back,
        filter: back > 0.01 ? `blur(${(back * 18).toFixed(2)}px) brightness(${mix(1, 0.4, back).toFixed(3)})` : undefined,
        transform: `scale(${mix(1, 0.72, back)})`,
        transformOrigin: `${SX}px 900px`,
      }}
    >
      {/* Carte du circuit en arrière-plan, même caméra que la fin de V06 */}
      <AbsoluteFill style={{ filter: bg > 0.01 ? `blur(${(bg * 8).toFixed(2)}px) brightness(${mix(1, 0.5, bg).toFixed(3)})` : undefined }}>
        <Camera3D perspective={1450} rx={24} ry={-4} x={driftX} y={driftY} scale={mapScale} origin={`${o.x}px ${o.y}px`}>
          <div style={{ position: "absolute", left: SX - MAP9 / 2, top: V06_MAP_CY - MAP9 / 2 }}>
            <TrackMap
              id="v07"
              size={MAP9}
              ribbon={1}
              speedLine={1}
              goldLine={1}
              markers={CORNERS.map(() => 1)}
              startFinish={1}
              grid={0.8}
              highlight={{ n: 10, glow: 1 }}
              pulses={{ n: 10, p: [prog(T, 18.0, 18.55, E.outExpo), prog(T, 18.22, 18.8, E.outExpo)] }}
              pill={{ n: 10, text: "Virage 10", p: prog(T, 18.1, 18.4, E.outExpo) }}
            />
          </div>
        </Camera3D>
      </AbsoluteFill>

      {/* Texte en haut */}
      <div style={{ position: "absolute", left: SAFE.x0, width: SW, top: 286, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Words T={T} words="Virage" start={18.4} size={100} />
        <Words T={T} words={[{ t: "par" }, { t: "virage.", kind: "gradient" }]} start={18.55} stagger={0.09} size={100} sweep={{ start: 18.6, dur: 0.8 }} />
        <div style={{ height: 12 }} />
        <Words T={T} words="Classés par temps perdu." start={19.0} stagger={0.05} size={40} weight={500} font="body" wordStyle={{ color: C.muted }} />
      </div>

      {/* Carte Priorité 1 */}
      <AbsoluteFill style={{ perspective: 1600 }}>
        <div
          style={{
            position: "absolute",
            left: SAFE.x0,
            top: 640,
            opacity: c1,
            filter: c1 < 0.99 ? `blur(${((1 - c1) * 14).toFixed(2)}px)` : undefined,
            transform: `translateY(${(1 - c1) * 160}px) rotateX(${cardTilt.toFixed(2)}deg)`,
            transformOrigin: "50% 0%",
          }}
        >
          <CoachingCard k={1.75} width={SW} index={0} title={title1} body={body1} highlight={hl1} lostGlow={glow1} accent />
        </div>
        {T >= 19.5 ? (
          <div
            style={{
              position: "absolute",
              left: SAFE.x0,
              top: 1010,
              opacity: c2 * 0.85,
              filter: c2 < 0.99 ? `blur(${((1 - c2) * 14).toFixed(2)}px)` : undefined,
              transform: `translateY(${(1 - c2) * 140}px) rotateX(${cardTilt.toFixed(2)}deg) scale(0.97)`,
              transformOrigin: "50% 0%",
            }}
          >
            <CoachingCard k={1.75} width={SW} index={1} title={title2} body={prog(T, 19.75, 20.15, E.outExpo)} />
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
