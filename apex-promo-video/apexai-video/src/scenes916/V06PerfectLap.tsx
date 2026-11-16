import React, { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { E, kf, mix, prog, springAt, useT, wobble } from "../lib/anim";
import { CORNERS, N } from "../lib/track";
import { Camera3D } from "../components/Camera3D";
import { TrackMap } from "../components/TrackMap";
import { Words } from "../components/fx";
import { DirBlur } from "../components/DirBlur";
import { PerfectLapBanner } from "../ui/AppUI";
import { MAP9, SAFE, SW, SX } from "./layout916";

export const V06_MAP_CY = 840;
export const v10Origin = () => {
  const v10 = CORNERS.find((c) => c.n === 10)!;
  return { x: SX - MAP9 / 2 + (v10.x / 1000) * MAP9, y: V06_MAP_CY - MAP9 / 2 + (v10.y / 1000) * MAP9 };
};

/** V06 — Tour Parfait IA · 14,00 → 18,00 : bandeau doré (2 lignes), carte colorée par la vitesse, ligne Tour IA, plongée sur le virage 10. */
export const V06PerfectLap: React.FC = () => {
  const T = useT();
  const { fps } = useVideoConfig();

  const items = [0, 1, 2, 3, 4].map((i) => prog(T, 14.12 + i * 0.08, 14.12 + i * 0.08 + 0.45, E.outExpo));
  const gain = 1.23 * prog(T, 14.4, 14.75, E.outExpo);
  const gainGlow = Math.sin(Math.PI * prog(T, 14.75, 15.15, E.linear));

  const ribbon = prog(T, 14.05, 14.5, E.outExpo);
  const draw = prog(T, 14.35, 15.65, E.inOut);
  const gold = prog(T, 15.65, 16.25, E.inOut);
  const shimmer = prog(T, 15.8, 16.8, E.inOut);
  const cornerT = useMemo(() => CORNERS.map((c) => 14.35 + 1.3 * invInOut(c.i / N)), []);
  const markers = cornerT.map((t0) => (T >= t0 ? springAt(T, t0, fps, { damping: 11, stiffness: 220, mass: 0.6 }) : 0));
  if (T >= 18.02) return null;

  // Arrivée par la droite (même vecteur que le whip de V05).
  const enter = prog(T, 14.0, 14.35, E.outExpo);
  const enterX = (1 - enter) * 1100;
  const enterBlur = (1 - prog(T, 14.0, 14.25, E.outExpo)) * 42;

  const rx = kf(T, [14.0, 17.7], [32, 24], E.inOut);
  const rz = kf(T, [14.0, 17.7], [-5, 0], E.inOut);
  const orbitY = kf(T, [16.3, 17.7], [0, -4], E.inOut);
  const o = v10Origin();
  const dive = prog(T, 17.7, 18.0, E.outExpo);
  const leave = prog(T, 17.62, 17.85, E.inExpo);
  const driftX = wobble("v06x", T) * 6;
  const driftY = wobble("v06y", T) * 5;

  return (
    <AbsoluteFill>
      <DirBlur id="v06h" x={enterBlur} y={0} />
      <AbsoluteFill style={{ transform: `translateX(${enterX}px)`, filter: enterBlur > 0.3 ? "url(#v06h)" : undefined }}>
        <Camera3D perspective={1450} rx={rx} ry={orbitY} rz={rz} x={driftX} y={driftY} scale={mix(1, 3.2, dive)} origin={`${o.x}px ${o.y}px`}>
          <div style={{ position: "absolute", left: SX - MAP9 / 2, top: V06_MAP_CY - MAP9 / 2, opacity: ribbon }}>
            <TrackMap
              id="v06"
              size={MAP9}
              ribbon={ribbon}
              speedLine={draw}
              speedHead
              goldLine={gold}
              goldShimmer={shimmer}
              markers={markers}
              startFinish={ribbon}
              grid={ribbon * 0.8}
              highlight={{ n: 10, glow: dive }}
            />
          </div>
        </Camera3D>

        <div style={{ opacity: 1 - leave, filter: leave > 0.01 ? `blur(${(leave * 18).toFixed(2)}px)` : undefined }}>
          {/* Bandeau doré, 2 lignes (y 280 → ≈ 420) */}
          <div style={{ position: "absolute", left: SAFE.x0, top: 282 }}>
            <PerfectLapBanner k={2.45} width={SW} items={items} toGain={`−${gain.toFixed(2)}s`} gainGlow={gainGlow} layout="stacked" />
          </div>

          {/* Texte en bas (y 1255 → 1480) */}
          <div style={{ position: "absolute", left: SAFE.x0, width: SW, top: 1252, display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
            <Words T={T} words="Ton tour idéal," start={15.0} stagger={0.09} size={76} />
            <Words
              T={T}
              words={[{ t: "tu" }, { t: "l'as" }, { t: "déjà", kind: "gradient" }, { t: "roulé.", kind: "gradient" }]}
              start={15.4}
              stagger={0.09}
              size={76}
            />
            <div style={{ height: 10 }} />
            <Words
              T={T}
              words="Juste pas dans le même tour."
              start={15.8}
              stagger={0.06}
              size={40}
              weight={500}
              font="body"
              wordStyle={{ color: `rgba(250,250,250,${mix(0.6, 1, prog(T, 16.0, 16.7, E.inOut)).toFixed(3)})` }}
            />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

function invInOut(y: number) {
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 30; k++) {
    const mid = (lo + hi) / 2;
    if (E.inOut(mid) < y) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
