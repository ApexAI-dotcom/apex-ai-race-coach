import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../theme";
import { E, kf, mix, prog, useT, wobble } from "../lib/anim";
import { N, PTS } from "../lib/track";
import { TrackMap } from "../components/TrackMap";
import { ScanLine, Words } from "../components/fx";
import { DirBlur } from "../components/DirBlur";
import { AnalyzingCard } from "../ui/UploadUI";

const STEP_T = [18.1, 18.42, 18.74, 19.06, 19.38];

/** S07 — Analyse IA · 18,00 → 20,50 : carte « Analyse en cours… », tracé et particules en fond, succès, whip vers le haut. */
export const S07Analyse: React.FC = () => {
  const T = useT();
  if (T >= 20.55) return null;

  const enter = prog(T, 18.0, 18.4, E.outExpo);
  const progress = kf(T, [18.1, 18.45, 18.8, 19.2, 19.55, 19.85], [0, 0.2, 0.4, 0.6, 0.85, 1], E.inOut);
  const spin = (T - 18.0) * 400;
  let step = 0;
  for (let i = 0; i < STEP_T.length; i++) if (T >= STEP_T[i]) step = i;
  const stepBlend = prog(T, STEP_T[step], STEP_T[step] + 0.12, E.def);
  const done = prog(T, 19.85, 20.05, E.outExpo);
  const check = prog(T, 19.95, 20.15, E.outExpo);
  const burst = prog(T, 19.9, 20.3, E.outExpo);

  // Whip vertical vers le haut 20,20 → 20,50.
  const whip = prog(T, 20.2, 20.5, E.inExpo);
  const wy = -1300 * whip;
  const wBlur = Math.sin(Math.PI * Math.min(1, whip * 1.2)) * 40;

  // Fond : tracé qui se redessine en boucle + particules de données.
  const loop = ((T - 18.0) / 0.8) % 1;
  const particles = Array.from({ length: 26 }, (_, i) => {
    const fi = (i * (N / 26) + (T - 18.0) * 260) % N;
    const p = PTS[Math.floor(fi)];
    return { x: p[0], y: p[1], color: C.primary, halo: 0.6, r: 4 };
  });

  const driftX = wobble("s07x", T) * 5;
  const driftY = wobble("s07y", T) * 4;

  return (
    <AbsoluteFill>
      <DirBlur id="s07v" x={0} y={wBlur} />
      <AbsoluteFill style={{ transform: `translateY(${wy}px)`, filter: wBlur > 0.3 ? "url(#s07v)" : undefined }}>
        {/* Tracé de fond */}
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 0.16 * enter }}>
          <div style={{ transform: `translate(${driftX * 2}px, ${driftY * 2}px) rotate(-6deg)` }}>
            <TrackMap id="s07" size={980} ribbon={0.5} whiteTrace={loop} whiteHead dots={particles} />
          </div>
        </AbsoluteFill>

        {/* Titre */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 120, display: "flex", justifyContent: "center" }}>
          <Words
            T={T}
            words={[{ t: "L'IA" }, { t: "analyse" }, { t: "chaque", kind: "gradient" }, { t: "virage.", kind: "gradient" }]}
            start={18.1}
            stagger={0.08}
            size={72}
          />
        </div>

        {/* Carte d'analyse */}
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingTop: 110 }}>
          <div
            style={{
              opacity: enter,
              transform: `translate(${driftX}px, ${driftY}px) scale(${mix(1.15, 1, enter)})`,
              filter: enter < 0.99 ? `blur(${((1 - enter) * 16).toFixed(2)}px)` : undefined,
            }}
          >
            <AnalyzingCard
              k={1.6}
              width={740}
              progress={progress}
              spin={spin}
              step={step}
              stepBlend={stepBlend}
              done={done}
              check={check}
              burst={burst}
            >
              <ScanLine T={T} start={18.3} />
              <ScanLine T={T} start={19.1} />
            </AnalyzingCard>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
