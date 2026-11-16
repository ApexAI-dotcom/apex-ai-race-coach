import React from "react";
import { AbsoluteFill } from "remotion";
import { E, kf, mix, prog, useT, wobble } from "../lib/anim";
import { Camera3D } from "../components/Camera3D";
import { Words } from "../components/fx";
import { DirBlur } from "../components/DirBlur";
import { ScoreCard, StatCards } from "../ui/AppUI";
import ui from "../data/ui-data.json";

/** S08 — Score · 20,50 → 24,00 : carte « Score de Performance » en 3D + texte à droite. */
export const S08Score: React.FC = () => {
  const T = useT();
  if (T >= 24.05) return null;

  // Arrivée par le bas, dans le prolongement du whip de S07.
  const enter = prog(T, 20.5, 20.9, E.outExpo);
  const enterY = (1 - enter) * 420;
  const enterBlur = (1 - prog(T, 20.5, 20.72, E.outExpo)) * 36;
  const cardIn = mix(0.35, 1, prog(T, 20.5, 21.0, E.outExpo));
  const score = 71 * prog(T, 20.55, 21.45, E.outExpo);
  const tiles = [0, 1, 2, 3].map((i) => prog(T, 20.9 + i * 0.07, 20.9 + i * 0.07 + 0.45, E.outExpo));
  const tileValues = ui.score.breakdown.map((b, i) => b.value * prog(T, 20.95 + i * 0.07, 20.95 + i * 0.07 + 0.6, E.outExpo));

  // Descente caméra 22,30 → 23,20 vers les cartes de stats.
  const down = prog(T, 22.3, 23.2, E.ios);
  const stats = [0, 1, 2, 3].map((i) => prog(T, 22.45 + i * 0.08, 22.45 + i * 0.08 + 0.5, E.outExpo));
  const glow = prog(T, 22.9, 23.3, E.outExpo);

  // Raccord : plongée sur « 49.680s » 23,40 → 24,00.
  const dive = prog(T, 23.4, 23.85, E.outExpo);
  const textOut = prog(T, 23.25, 23.5, E.inOut);
  const diveOut = prog(T, 23.7, 24.0, E.inOut);

  const ry = kf(T, [20.5, 24.0], [12, 5], E.inOut);
  const rx = kf(T, [20.5, 24.0], [10, 4], E.inOut);
  const camY = mix(0, -260, down);
  const driftX = wobble("s08x", T) * 6;
  const driftY = wobble("s08y", T) * 5;

  // Point de plongée : centre de la valeur « 49.680s » (première carte de stats, ≈ 222 × 844).
  // L'origine glisse pendant la descente caméra pour éviter tout saut au début de la plongée.
  const originX = mix(600, 222, down);
  const originY = mix(540, 844, down);

  return (
    <AbsoluteFill style={{ transform: `translateY(${enterY}px)`, filter: enterBlur > 0.3 ? "url(#s08v)" : undefined }}>
      <DirBlur id="s08v" x={0} y={enterBlur} />
      <div
        style={{
          position: "absolute",
          left: 600 - 700,
          top: 520 - 520,
          width: 1400,
          height: 1040,
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(255,66,66,0.16) 0%, rgba(255,66,66,0.05) 40%, rgba(255,66,66,0) 70%)",
          opacity: cardIn * (1 - diveOut),
          transform: `translateY(${camY * 0.6}px)`,
        }}
      />
      <Camera3D
        perspective={1700}
        rx={rx}
        ry={ry}
        x={driftX + (960 - 222) * dive}
        y={camY + driftY + (540 - (844 - 260)) * dive}
        scale={mix(1, 3, dive)}
        origin={`${originX}px ${originY}px`}
        blur={diveOut * 16}
        opacity={cardIn * (1 - diveOut * 0.9)}
      >
        <div
          style={{
            position: "absolute",
            left: 120,
            top: 300,
            filter: cardIn < 0.99 ? `blur(${((1 - cardIn) * 16).toFixed(2)}px)` : undefined,
            transform: `translateY(${(1 - cardIn) * 40}px)`,
          }}
        >
          <ScoreCard k={1.6} width={960} score={score} tiles={tiles} tileValues={tileValues} />
        </div>
        <div style={{ position: "absolute", left: 120, top: 760 }}>
          <StatCards k={1.45} width={960} appear={stats} glowFirst={glow} />
        </div>
      </Camera3D>

      {/* Texte à droite */}
      <div
        style={{
          position: "absolute",
          left: 1160,
          top: 410,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 10,
          opacity: 1 - textOut,
          filter: textOut > 0.01 ? `blur(${(textOut * 18).toFixed(2)}px)` : undefined,
          transform: `translateX(${textOut * 260}px)`,
        }}
      >
        <Words T={T} words="Ton pilotage," start={21.0} stagger={0.09} size={96} style={{ justifyContent: "flex-start" }} />
        <Words
          T={T}
          words={[{ t: "noté" }, { t: "sur" }, { t: "100.", kind: "gradient" }]}
          start={21.4}
          stagger={0.09}
          size={96}
          style={{ justifyContent: "flex-start" }}
        />
      </div>
    </AbsoluteFill>
  );
};
