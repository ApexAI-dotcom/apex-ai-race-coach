import React from "react";
import { AbsoluteFill, random } from "remotion";
import { noise2D } from "@remotion/noise";
import { G } from "../theme";
import { E, mix, prog, useT } from "../lib/anim";
import { DecodeText } from "../components/fx";
import { S06_CARD } from "./layout";
import { staticFile } from "remotion";

/** S05 — Positionnement · 12,50 → 15,00 : panneau rouge plein écran, « Ton ingénieur / de course IA », puis rétrécit en carte d'import. */
export const S05Panel: React.FC = () => {
  const T = useT();

  const shrink = prog(T, 13.85, 14.55, E.ios);
  const x = mix(0, S06_CARD.x, shrink);
  const y = mix(0, S06_CARD.y, shrink);
  const w = mix(1920, S06_CARD.w, shrink);
  const h = mix(1080, S06_CARD.hEmpty, shrink);
  const radius = mix(0, 18 * S06_CARD.k, shrink);

  const toCard = prog(T, 14.55, 14.85, E.inOut);
  const textOut = prog(T, 14.4, 14.7, E.inExpo);
  const gone = prog(T, 15.0, 15.08, E.linear);

  // Interlettrage de « de course IA » : 0,35 em → −0,02 em (13,30 → 13,75).
  const track = mix(0.35, -0.02, prog(T, 13.3, 13.75, E.outExpo));
  const line2 = prog(T, 13.3, 13.65, E.outExpo);

  const hx = 0.35 + noise2D("s05h", T * 0.25, 0) * 0.2;
  const hy = 0.4 + noise2D("s05h", 0, T * 0.25) * 0.2;
  const gx = Math.floor(random(`s05g-${Math.floor(T * 30)}`) * 512);

  const textScale = mix(1, 0.42, shrink);

  return (
    <AbsoluteFill style={{ opacity: 1 - gone }}>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius: radius,
          overflow: "hidden",
          background: G.primary,
          boxShadow: shrink > 0 ? `0 40px 90px -30px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,${(0.18 * shrink).toFixed(3)})` : undefined,
        }}
      >
        {/* Reflet orange qui dérive */}
        <div
          style={{
            position: "absolute",
            left: `${hx * 100}%`,
            top: `${hy * 100}%`,
            width: 1100,
            height: 1100,
            marginLeft: -550,
            marginTop: -550,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,153,51,0.45) 0%, rgba(255,153,51,0.12) 40%, rgba(255,153,51,0) 70%)",
            mixBlendMode: "screen",
          }}
        />
        {/* Grain visible sur le rouge */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${staticFile("textures/grain.png")})`,
            backgroundSize: "512px 512px",
            backgroundPosition: `${gx}px ${gx}px`,
            opacity: 0.07,
            mixBlendMode: "overlay",
          }}
        />
        {/* Passage à la couleur de carte de l'app */}
        <div style={{ position: "absolute", inset: 0, background: "#121212", opacity: toCard }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            border: `${toCard > 0 ? 1.4 : 0}px solid rgba(38,38,38,${toCard.toFixed(3)})`,
          }}
        />
        {/* Texte */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${textScale})`,
            opacity: 1 - textOut,
            filter: textOut > 0.01 ? `blur(${(textOut * 16).toFixed(2)}px)` : undefined,
          }}
        >
          <DecodeText T={T} text="Ton ingénieur" start={12.55} stagger={0.035} scramble={0.14} size={124} seed="s05a" blur={8} />
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 124,
              lineHeight: 1.08,
              letterSpacing: `${track}em`,
              color: "#FFFFFF",
              opacity: line2,
              filter: line2 < 0.99 ? `blur(${((1 - line2) * 10).toFixed(2)}px)` : undefined,
              whiteSpace: "nowrap",
            }}
          >
            de course IA
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
