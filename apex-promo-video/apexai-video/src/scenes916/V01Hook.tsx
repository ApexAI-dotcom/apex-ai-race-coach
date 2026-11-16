import React from "react";
import { AbsoluteFill } from "remotion";
import { C, G, gradientText, DISPLAY } from "../theme";
import { E, kf, mix, prog, reveal, useT, wobble } from "../lib/anim";
import { Underline } from "../components/fx";
import { DirBlur } from "../components/DirBlur";
import { SAFE, SW } from "./layout916";

/** V01 — Accroche · 0,00 → 2,50 : « Où » (380 px), puis « Où perds-tu / tes dixièmes ? » sur 2 lignes (120 px). */
export const V01Hook: React.FC = () => {
  const T = useT();
  if (T >= 2.55) return null;

  // « Où » : entrée floue 0,10 → 0,55, balayage 0,10 → 0,90, réduction 0,95 → 1,35.
  const ouIn = prog(T, 0.1, 0.55, E.outExpo);
  const shrink = prog(T, 0.95, 1.35, E.ios);
  const ouSize = mix(380, 120, shrink);
  const sw = prog(T, 0.1, 0.9, E.ios);
  const p = mix(-30, 130, sw);
  const ouFill =
    sw < 1
      ? gradientText(`linear-gradient(100deg, #FAFAFA 0%, #FAFAFA ${p - 25}%, #FF4242 ${p - 8}%, #FF9933 ${p}%, #FF9933 100%)`)
      : { color: C.text };

  const grow = shrink;
  const push = kf(T, [0.55, 1.0, 2.3], [1.0, 1.03, 1.06], E.inOut);
  const driftX = wobble("v01x", T) * 5;
  const driftY = wobble("v01y", T) * 6;

  // Whip de sortie vers le haut 2,35 → 2,50.
  const whip = prog(T, 2.35, 2.5, E.inExpo);
  const wBlur = Math.sin(Math.PI * Math.min(1, whip * 1.15)) * 44;

  const word = (t: string, i: number, key = false) => {
    const r = reveal(T, 1.05 + i * 0.09, { dur: 0.5, blur: 16, y: 24, scale: 1.03 });
    const fs = 120 * grow;
    return (
      <span key={t} style={{ display: "inline-block", position: "relative", fontSize: fs, letterSpacing: "-0.03em", paddingBottom: "0.06em", ...r }}>
        <span style={{ position: "relative", display: "inline-block" }}>
          <span style={key ? gradientText(G.textPrimary) : { color: C.text }}>{t}</span>
          {key ? (
            <span style={{ position: "absolute", left: "30%", width: "40%", bottom: -0.03 * fs, height: 6, display: "block" }}>
              <Underline T={T} start={1.55} dur={0.3} width="100%" height={6} />
            </span>
          ) : null}
        </span>
        {key ? <span style={{ color: C.text }}>{" ?"}</span> : null}
      </span>
    );
  };

  return (
    <AbsoluteFill>
      <DirBlur id="v01v" x={0} y={wBlur} />
      <AbsoluteFill style={{ transform: `translateY(${-1500 * whip}px)`, filter: wBlur > 0.3 ? "url(#v01v)" : undefined }}>
        <div
          style={{
            position: "absolute",
            left: SAFE.x0,
            width: SW,
            top: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transform: `translate(${driftX}px, ${driftY - 40}px) scale(${push})`,
            fontFamily: `'${DISPLAY}', sans-serif`,
            fontWeight: 700,
            lineHeight: 1.1,
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", columnGap: `${mix(0, 0.26, grow) * 120}px` }}>
            <span
              style={{
                display: "inline-block",
                fontSize: ouSize,
                letterSpacing: "-0.04em",
                opacity: ouIn,
                filter: ouIn < 0.99 ? `blur(${((1 - ouIn) * 28).toFixed(2)}px)` : undefined,
                transform: `scale(${mix(1.18, 1, ouIn)})`,
                paddingBottom: "0.06em",
                ...ouFill,
              }}
            >
              Où
            </span>
            {word("perds-tu", 0)}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", columnGap: `${mix(0, 0.26, grow) * 120}px` }}>
            {word("tes", 1)}
            {word("dixièmes", 2, true)}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
