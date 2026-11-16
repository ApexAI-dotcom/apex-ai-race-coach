import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ChevronRight } from "lucide-react";
import { C, G, gradientText, BODY, DISPLAY } from "../theme";
import { E, kf, mix, prog, reveal, springAt, useT, wobble } from "../lib/anim";
import { LogoIcon } from "../components/Logo";
import { Marquee3D } from "../components/Marquee3D";
import { Cursor, bezier } from "../components/Cursor";
import { Ripple } from "../components/fx";
import ui from "../data/ui-data.json";

const BTN_W = 600;
const BTN_H = 92;
const BTN_X = 960 - BTN_W / 2;
const BTN_Y = 566;

/** S14 — Carte de fin et CTA · 42,00 → 45,00 (+ sortie au noir S15 dans la composition). */
export const S14EndCard: React.FC = () => {
  const T = useT();
  const { fps } = useVideoConfig();

  const bgSettle = prog(T, 42.0, 42.9, E.outExpo);
  const logo = springAt(T, 42.0, fps, { damping: 13, stiffness: 170, mass: 0.7 });
  const sheen = prog(T, 42.3, 42.75, E.inOut);

  // Curseur 43,30 → 43,80, clic à 43,80.
  const curP = prog(T, 43.3, 43.78, E.inOut);
  const [cx, cy] = bezier(curP, [1500, 1020], [1380, 760], [BTN_X + BTN_W * 0.66, BTN_Y + BTN_H * 0.62]);
  const hover = prog(T, 43.6, 43.75, E.outExpo);
  const press = Math.sin(Math.PI * prog(T, 43.8, 43.92, E.linear));
  const btnScale = mix(1, 1.03, hover) * (1 - 0.04 * press);
  const btnIn = reveal(T, 42.75, { dur: 0.55, blur: 14, y: 20, scale: 1.04 });

  const push = kf(T, [43.9, 45.0], [1.0, 1.03], E.inOut);
  const driftX = wobble("s14x", T) * 4;

  const sx = mix(-0.35, 3.75, sheen);
  const sheenStyle = (w: number, off: number, base: string, glow: string) => {
    if (sheen <= 0 || sheen >= 1) return null;
    const c = ((sx - off) / w) * 100;
    const h = (0.3 / w) * 100;
    return gradientText(`linear-gradient(100deg, ${base} 0%, ${base} ${c - h}%, ${glow} ${c}%, ${base} ${c + h}%, ${base} 100%)`);
  };

  return (
    <AbsoluteFill>
      <AbsoluteFill>
        <Marquee3D T={T - 42} brightness={0.24} blur={2} speed={40} scale={mix(1.12, 1, bgSettle)} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 48%, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.15) 45%, rgba(10,10,10,0.75) 100%)" }} />
      </AbsoluteFill>

      <AbsoluteFill style={{ transform: `translateX(${driftX}px) scale(${push})` }}>
        {/* Logo */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 330,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 28,
            transform: `scale(${mix(0.6, 1, Math.min(1.04, logo))})`,
            opacity: Math.min(1, 0.5 + logo * 2),
          }}
        >
          <LogoIcon size={104} />
          <span
            style={{
              fontFamily: `'${DISPLAY}', sans-serif`,
              fontWeight: 700,
              fontSize: 120,
              letterSpacing: "-0.02em",
              lineHeight: 1,
              fontKerning: "none",
              whiteSpace: "nowrap",
              display: "inline-flex",
            }}
          >
            <span style={sheenStyle(2.45, 0, "#FAFAFA", "#FFE6E0") ?? { color: C.text }}>APEX</span>
            <span style={sheenStyle(0.95, 2.45, "#FF7A3C", "#FFF1E6") ?? gradientText(G.textPrimary)}>AI</span>
          </span>
        </div>

        {/* Baseline */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 478,
            textAlign: "center",
            fontFamily: `'${BODY}', sans-serif`,
            fontWeight: 500,
            fontSize: 40,
            color: "#BDBDBD",
            ...reveal(T, 42.35, { dur: 0.5, blur: 12, y: 14 }),
          }}
        >
          {ui.endCard.baseline}
        </div>

        {/* Bouton CTA */}
        <div style={{ position: "absolute", left: BTN_X, top: BTN_Y, width: BTN_W, height: BTN_H, ...btnIn }}>
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 999,
              background: G.primary,
              boxShadow: `0 0 ${mix(40, 70, hover)}px -8px rgba(255,66,66,${mix(0.6, 0.95, hover)}), 0 18px 40px -16px rgba(0,0,0,0.6)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 22,
              transform: `scale(${btnScale})`,
              fontFamily: `'${DISPLAY}', sans-serif`,
              fontWeight: 600,
              fontSize: 36,
              color: "#FFFFFF",
              letterSpacing: "-0.01em",
            }}
          >
            {ui.endCard.button}
            <span
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronRight size={30} color="#FFFFFF" strokeWidth={2.6} />
            </span>
          </div>
        </div>

        {/* Sous-ligne */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 690,
            textAlign: "center",
            fontFamily: `'${BODY}', sans-serif`,
            fontWeight: 500,
            fontSize: 28,
            color: "#A3A3A3",
            ...reveal(T, 43.0, { dur: 0.5, blur: 10, y: 12 }),
          }}
        >
          {ui.endCard.subline}
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 944,
            textAlign: "center",
            fontFamily: `'${BODY}', sans-serif`,
            fontWeight: 600,
            fontSize: 32,
            letterSpacing: "0.02em",
            color: C.text,
            ...reveal(T, 43.1, { dur: 0.5, blur: 10, y: 12 }),
          }}
        >
          {ui.endCard.url}
        </div>

        <Ripple T={T} start={43.8} x={BTN_X + BTN_W * 0.66} y={BTN_Y + BTN_H * 0.62} size={120} />
        {T >= 43.3 ? <Cursor x={cx} y={cy} press={press} opacity={prog(T, 43.3, 43.45, E.outExpo)} /> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
