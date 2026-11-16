import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../theme";
import { E, mix, prog, useT, wobble } from "../lib/anim";
import { Words } from "../components/fx";

/** S03 — Le constat · 7,75 → 10,00 : « Ton chrono te dit combien. / Jamais pourquoi. » + montée en tension. */
export const S03Constat: React.FC = () => {
  const T = useT();

  const lift = prog(T, 8.6, 9.0, E.ios);
  const tension = prog(T, 8.95, 9.8, E.inExpo);
  const collapse = prog(T, 9.8, 10.0, E.inExpo);
  const push = mix(1.0, 1.1, tension) * mix(1, 0.85, collapse);
  const driftX = wobble("s03x", T) * 5 * (1 + tension * 2);
  const driftY = wobble("s03y", T) * 4 * (1 + tension * 2);

  // Trait de chrono sous la ligne 2 : se remplit en accélérant (8,70 → 9,80).
  const timer = prog(T, 8.7, 9.8, E.inExpo);
  const ticks = 24;

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        transform: `translate(${driftX}px, ${driftY}px) scale(${push})`,
        opacity: 1 - collapse,
        filter: collapse > 0.01 ? `blur(${(collapse * 30).toFixed(2)}px)` : undefined,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div
          style={{
            transform: `translateY(${-80 * lift}px)`,
            opacity: mix(1, 0.35, lift),
          }}
        >
          <Words T={T} words="Ton chrono te dit combien." start={7.8} stagger={0.08} size={92} />
        </div>
        <div style={{ marginTop: -60 * lift, position: "relative" }}>
          <Words
            T={T}
            words={[{ t: "Jamais" }, { t: "pourquoi.", kind: "gradient" }]}
            start={8.6}
            stagger={0.1}
            size={132}
            sweep={{ start: 8.62, dur: 0.9 }}
          />
          {/* Graduations façon chronomètre */}
          <div style={{ position: "absolute", left: "50%", top: "100%", marginTop: 26, transform: "translateX(-50%)", width: 640, height: 18 }}>
            {Array.from({ length: ticks + 1 }, (_, i) => {
              const on = i / ticks <= timer;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: (i / ticks) * 640 - 1,
                    top: i % 4 === 0 ? 0 : 6,
                    width: 2,
                    height: i % 4 === 0 ? 18 : 10,
                    borderRadius: 1,
                    background: on ? C.primary : "rgba(255,255,255,0.14)",
                    boxShadow: on ? "0 0 8px rgba(255,66,66,0.8)" : undefined,
                    opacity: prog(T, 8.75, 9.05, E.outExpo),
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
