import React, { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { E, kf, mix, prog, reveal, springAt, useT, wobble } from "../lib/anim";
import { CORNERS, N } from "../lib/track";
import { Camera3D } from "../components/Camera3D";
import { TrackMap } from "../components/TrackMap";
import { Words } from "../components/fx";
import { AiToggle, MapTabs, PerfectLapBanner } from "../ui/AppUI";

export const MAP = 690;
export const MAP_CX = 1270;
export const MAP_CY = 690;

/** S09 — Tour Parfait IA · 24,00 → 29,00 : bandeau doré, carte colorée par la vitesse, ligne Tour IA. */
export const S09PerfectLap: React.FC = () => {
  const T = useT();
  const { fps } = useVideoConfig();

  const items = [0, 1, 2, 3, 4].map((i) => prog(T, 24.0 + i * 0.08, 24.0 + i * 0.08 + 0.45, E.outExpo));
  const gain = 1.23 * prog(T, 24.25, 24.6, E.outExpo);
  const gainGlow = Math.sin(Math.PI * prog(T, 24.6, 25.0, E.linear));

  const ribbon = prog(T, 24.0, 24.5, E.outExpo);
  // Entrée : prolonge la plongée de S08 (les éléments grandissent jusqu'à leur place).
  const enter = prog(T, 24.0, 24.75, E.outExpo);
  const enterBlur = (1 - prog(T, 24.0, 24.35, E.outExpo)) * 10;
  const draw = prog(T, 24.35, 25.85, E.inOut);
  const gold = prog(T, 25.85, 26.45, E.inOut);
  const shimmer = prog(T, 26.0, 27.0, E.inOut);

  // Les marqueurs apparaissent au passage de la tête de tracé.
  const cornerT = useMemo(() => CORNERS.map((c) => 24.35 + 1.5 * invInOut(c.i / N)), []);
  const markers = cornerT.map((t0) => (T >= t0 ? springAt(T, t0, fps, { damping: 11, stiffness: 220, mass: 0.6 }) : 0));
  if (T >= 29.02) return null;

  const rx = kf(T, [24.35, 28.6], [34, 25], E.inOut);
  const rz = kf(T, [24.35, 28.6], [-5, 0], E.inOut);
  const orbitY = kf(T, [26.7, 28.6], [0, -4], E.inOut);

  // Plongée vers le virage 10 (28,60 → 29,00).
  const v10 = CORNERS.find((c) => c.n === 10)!;
  const dive = prog(T, 28.6, 29.0, E.outExpo);
  const originX = MAP_CX - MAP / 2 + (v10.x / 1000) * MAP;
  const originY = MAP_CY - MAP / 2 + (v10.y / 1000) * MAP;
  const leave = prog(T, 28.6, 28.85, E.inExpo);

  const driftX = wobble("s09x", T) * 6;
  const driftY = wobble("s09y", T) * 4;

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${mix(0.82, 1, enter)})`,
        filter: enterBlur > 0.05 ? `blur(${enterBlur.toFixed(2)}px)` : undefined,
      }}
    >
      <Camera3D
        perspective={1450}
        rx={rx}
        ry={orbitY}
        rz={rz}
        x={driftX}
        y={driftY}
        scale={mix(1, 3.2, dive)}
        origin={`${originX}px ${originY}px`}
      >
        <div style={{ position: "absolute", left: MAP_CX - MAP / 2, top: MAP_CY - MAP / 2, opacity: ribbon }}>
          <TrackMap
            id="s09"
            size={MAP}
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

      {/* Bandeau doré + onglets */}
      <div style={{ opacity: 1 - leave, filter: leave > 0.01 ? `blur(${(leave * 18).toFixed(2)}px)` : undefined }}>
        <div style={{ position: "absolute", left: 210, top: 96 }}>
          <PerfectLapBanner k={2.3} width={1500} items={items} toGain={`−${gain.toFixed(2)}s`} gainGlow={gainGlow} />
        </div>
        <div style={{ position: "absolute", left: MAP_CX - 380, top: 288, ...reveal(T, 24.3, { dur: 0.5, blur: 10, y: 12 }) }}>
          <MapTabs k={1.5} width={760} active={0} />
        </div>
        <div style={{ position: "absolute", left: MAP_CX - 380, top: 372, ...reveal(T, 24.42, { dur: 0.5, blur: 10, y: 12 }) }}>
          <AiToggle k={1.5} />
        </div>

        {/* Texte à gauche */}
        <div style={{ position: "absolute", left: 120, top: 470, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
          <Words T={T} words="Ton tour idéal," start={25.4} stagger={0.09} size={76} style={{ justifyContent: "flex-start" }} />
          <Words
            T={T}
            words={[{ t: "tu" }, { t: "l'as" }, { t: "déjà", kind: "gradient" }, { t: "roulé.", kind: "gradient" }]}
            start={25.95}
            stagger={0.09}
            size={76}
            style={{ justifyContent: "flex-start" }}
          />
          <div style={{ height: 18 }} />
          <Words
            T={T}
            words="Juste pas dans le même tour."
            start={26.7}
            stagger={0.06}
            size={38}
            weight={500}
            font="body"
            style={{ justifyContent: "flex-start" }}
            wordStyle={{ color: `rgba(250,250,250,${mix(0.6, 1, prog(T, 26.9, 27.6, E.inOut)).toFixed(3)})` }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Inverse approximatif de la courbe inOut (temps de passage de la tête de tracé). */
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
