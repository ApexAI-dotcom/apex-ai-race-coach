import React from "react";
import { AbsoluteFill } from "remotion";
import { C, G, gradientText, DISPLAY } from "../theme";
import { E, kf, mix, prog, reveal, useT, wobble } from "../lib/anim";
import { Underline } from "../components/fx";

/** S01 — Accroche · 0,00 → 3,00 : « Où » géant, puis « Où perds-tu tes dixièmes ? ». */
export const S01Hook: React.FC = () => {
  const T = useT();

  // « Où » : entrée floue 0,10 → 0,55, puis réduction 1,00 → 1,40 (taille 400 → 120 px, en mise en page).
  const shrink = prog(T, 1.0, 1.4, E.ios);
  const ouSize = mix(400, 120, shrink);
  const ouIn = prog(T, 0.1, 0.55, E.outExpo);
  const ouBlur = (1 - ouIn) * 28;
  const ouScale = mix(1.18, 1, ouIn);

  // Balayage dégradé sur « Où » 0,10 → 0,90 : rouge/orange → blanc.
  const sw = prog(T, 0.1, 0.9, E.ios);
  const p = mix(-30, 130, sw);
  const ouFill =
    sw < 1
      ? gradientText(`linear-gradient(100deg, #FAFAFA 0%, #FAFAFA ${p - 25}%, #FF4242 ${p - 8}%, #FF9933 ${p}%, #FF9933 100%)`)
      : { color: C.text };

  // Les autres mots prennent leur place pendant la réduction, puis apparaissent en BlurWords.
  const grow = shrink;
  const rest = [
    { t: "perds-tu", kind: "white" as const },
    { t: "tes", kind: "white" as const },
    { t: "dixièmes", kind: "gradient" as const },
  ];

  // Caméra : push-in 0,55 → 1,00 puis dérive jusqu'à la sortie.
  const push = kf(T, [0.55, 1.0, 2.7], [1.0, 1.03, 1.055], E.inOut);
  const driftX = wobble("s01x", T) * 6;
  const driftY = wobble("s01y", T) * 4;

  // Sortie 2,70 → 3,00.
  const out = prog(T, 2.7, 3.0, E.inExpo);

  // Traînée lumineuse 2,80 → 3,00.
  const streak = prog(T, 2.8, 3.0, E.inOut);

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          transform: `translate(${driftX}px, ${driftY}px) scale(${push * mix(1, 0.96, out)})`,
          opacity: 1 - out,
          filter: out > 0.01 ? `blur(${(out * 24).toFixed(2)}px)` : undefined,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
            fontFamily: `'${DISPLAY}', sans-serif`,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            whiteSpace: "nowrap",
            columnGap: `${mix(0, 0.26, grow) * 120}px`,
          }}
        >
          <span
            style={{
              display: "inline-block",
              fontSize: ouSize,
              opacity: ouIn,
              filter: ouBlur > 0.05 ? `blur(${ouBlur.toFixed(2)}px)` : undefined,
              transform: `scale(${ouScale})`,
              paddingBottom: "0.06em",
              ...ouFill,
            }}
          >
            Où
          </span>
          {rest.map((w, i) => {
            const r = reveal(T, 1.1 + i * 0.09, { dur: 0.5, blur: 16, y: 24, scale: 1.03 });
            const fs = 120 * grow;
            const isKey = w.kind === "gradient";
            return (
              <span
                key={w.t}
                style={{
                  display: "inline-block",
                  position: "relative",
                  fontSize: fs,
                  letterSpacing: "-0.03em",
                  paddingBottom: "0.06em",
                  ...r,
                }}
              >
                <span style={{ position: "relative", display: "inline-block" }}>
                  <span style={isKey ? gradientText(G.textPrimary) : { color: C.text }}>{w.t}</span>
                  {isKey ? (
                    <span style={{ position: "absolute", left: "30%", width: "40%", bottom: -0.03 * fs, height: 6, display: "block" }}>
                      <Underline T={T} start={1.55} dur={0.3} width="100%" height={6} />
                    </span>
                  ) : null}
                </span>
                {isKey ? <span style={{ color: C.text }}>{"\u202F?"}</span> : null}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
      {streak > 0 && streak < 1 ? (
        <div
          style={{
            position: "absolute",
            top: 548,
            left: mix(-1152, 1920, streak),
            width: 1152,
            height: 2,
            background: "linear-gradient(90deg, rgba(255,66,66,0) 0%, rgba(255,120,90,1) 70%, #FFFFFF 100%)",
            boxShadow: "0 0 18px 4px rgba(255,66,66,0.75)",
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
