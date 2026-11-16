import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { Zap } from "lucide-react";
import { C, BODY } from "../theme";
import { E, kf, mix, prog, reveal, springAt, useT, wobble } from "../lib/anim";
import { LogoIcon } from "../components/Logo";
import { DecodeText } from "../components/fx";
import { G, gradientText, DISPLAY } from "../theme";
import { noise2D } from "@remotion/noise";

const W = 1920;
const H = 1080;

// Géométrie du logo (centré) : icône 140 + espace 34 + logotype 150 px.
const ICON = 140;
const GAP = 34;
const WORD_W = 494;
const LOCK_W = ICON + GAP + WORD_W;
const CX = W / 2;
const CY = 572;
const LEFT = CX - LOCK_W / 2;
const RIGHT = CX + LOCK_W / 2;
const TOP = CY - ICON / 2;
const BOTTOM = CY + ICON / 2;
const M = 34;

/** S04 — Révélation du logo (DROP) · 10,00 → 12,50. */
export const S04Logo: React.FC = () => {
  const T = useT();
  const { fps } = useVideoConfig();

  const lines = prog(T, 10.0, 10.4, E.outExpo);
  const linesOut = prog(T, 11.6, 11.9, E.inOut);
  const march = prog(T, 11.4, 11.9, E.linear) * 40;
  const handles = springAt(T, 10.25, fps, { damping: 13, stiffness: 200, mass: 0.6 }) * (1 - linesOut);

  const iconSpring = springAt(T, 10.0, fps, { damping: 12, stiffness: 170, mass: 0.7 });
  const iconRot = mix(-14, 0, Math.min(1, iconSpring));
  const boltDraw = prog(T, 10.05, 10.25, E.inOut);
  const boltFill = prog(T, 10.25, 10.35, E.outExpo);

  // Zoom à travers l'icône (12,00 → 12,45) vers le panneau rouge de S05.
  const zoom = prog(T, 12.0, 12.45, E.inExpo);
  const zoomScale = mix(1, 30, zoom);
  const boltFade = 1 - prog(T, 12.0, 12.2, E.linear);
  const others = prog(T, 12.0, 12.3, E.inExpo);

  const driftX = wobble("s04x", T) * 5;
  const driftY = wobble("s04y", T) * 4;
  const push = kf(T, [10.0, 12.0], [1.0, 1.035], E.inOut);

  const dash = (o: number) => ({
    backgroundImage: `repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0 5px, rgba(255,255,255,0) 5px 10px)`,
    backgroundPosition: `${o}px 0`,
  });
  const dashV = (o: number) => ({
    backgroundImage: `repeating-linear-gradient(180deg, rgba(255,255,255,0.16) 0 5px, rgba(255,255,255,0) 5px 10px)`,
    backgroundPosition: `0 ${o}px`,
  });

  // Taches lumineuses d'angle (rouge bas-gauche, orange haut-droite), en plus de l'atmosphère globale.
  const nx = noise2D("s04blob", T * 0.15, 0) * 40;
  const ny = noise2D("s04blob", 0, T * 0.15) * 40;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: -380 + nx,
          top: 640 + ny,
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,66,66,0.30) 0%, rgba(255,66,66,0.12) 35%, rgba(255,66,66,0) 70%)",
          mixBlendMode: "screen",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 1500 - nx,
          top: -420 - ny,
          width: 820,
          height: 820,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,153,51,0.20) 0%, rgba(255,153,51,0.08) 35%, rgba(255,153,51,0) 70%)",
          mixBlendMode: "screen",
        }}
      />

      <AbsoluteFill style={{ transform: `translate(${driftX}px, ${driftY}px) scale(${push})` }}>
        {/* Grille de construction */}
        <AbsoluteFill style={{ opacity: 1 - linesOut }}>
          {[TOP - M, BOTTOM + M].map((y, i) => (
            <div
              key={`h${i}`}
              style={{ position: "absolute", left: 0, top: y, width: W, height: 1, transform: `scaleX(${lines})`, transformOrigin: `${CX}px 0`, ...dash(march) }}
            />
          ))}
          {[LEFT - M, RIGHT + M].map((x, i) => (
            <div
              key={`v${i}`}
              style={{ position: "absolute", left: x, top: 0, width: 1, height: H, transform: `scaleY(${lines})`, transformOrigin: `0 ${CY}px`, ...dashV(march) }}
            />
          ))}
          {[
            [LEFT - M, TOP - M],
            [RIGHT + M, TOP - M],
            [LEFT - M, BOTTOM + M],
            [RIGHT + M, BOTTOM + M],
          ].map(([x, y], i) => (
            <div
              key={`hd${i}`}
              style={{
                position: "absolute",
                left: x - 3.5,
                top: y - 3.5,
                width: 7,
                height: 7,
                background: "rgba(250,250,250,0.6)",
                transform: `scale(${handles})`,
              }}
            />
          ))}
        </AbsoluteFill>

        {/* Pastille « Propulsé par l'IA » */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: TOP - M - 96,
            display: "flex",
            justifyContent: "center",
            ...reveal(T, 10.95, { dur: 0.5, blur: 12, y: 14 }, 12.0, { dur: 0.3, blur: 20, y: -10 }),
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 22px",
              borderRadius: 999,
              background: "rgba(255,66,66,0.10)",
              border: "1px solid rgba(255,66,66,0.30)",
              color: C.primary,
              fontFamily: `'${BODY}', sans-serif`,
              fontWeight: 500,
              fontSize: 26,
            }}
          >
            <Zap size={24} color={C.primary} strokeWidth={2.2} />
            Propulsé par l'IA
          </div>
        </div>

        {/* Logo */}
        <div style={{ position: "absolute", left: LEFT, top: TOP, display: "flex", alignItems: "center", gap: GAP }}>
          <div
            style={{
              transform: `scale(${iconSpring * zoomScale}) rotate(${iconRot}deg)`,
              transformOrigin: "20% 80%",
            }}
          >
            <LogoIcon size={ICON} draw={boltDraw} fill={boltFill} boltOpacity={boltFade} glow={1 - zoom} />
          </div>
          <div
            style={{
              position: "relative",
              opacity: 1 - others,
              filter: others > 0.01 ? `blur(${(others * 20).toFixed(2)}px)` : undefined,
            }}
          >
            <AnimatedWordmark T={T} />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** « APEX » monte lettre par lettre, « AI » se décode, puis un reflet traverse le logotype. */
const AnimatedWordmark: React.FC<{ T: number }> = ({ T }) => {
  const base: React.CSSProperties = {
    fontFamily: `'${DISPLAY}', sans-serif`,
    fontWeight: 700,
    fontSize: 150,
    letterSpacing: "-0.02em",
    lineHeight: 1,
    whiteSpace: "nowrap",
    fontKerning: "none",
    display: "inline-flex",
    alignItems: "baseline",
  };
  const settled = T >= 10.85;
  if (!settled) {
    return (
      <span style={base}>
        {Array.from("APEX").map((ch, i) => {
          const p = prog(T, 10.2 + i * 0.035, 10.2 + i * 0.035 + 0.5, E.outExpo);
          return (
            <span key={i} style={{ display: "inline-block", overflow: "hidden", padding: "0.06em 0", margin: "-0.06em 0" }}>
              <span style={{ display: "inline-block", color: C.text, transform: `translateY(${((1 - p) * 0.9).toFixed(3)}em)` }}>{ch}</span>
            </span>
          );
        })}
        <DecodeText T={T} text="AI" start={10.45} stagger={0.05} scramble={0.12} size={150} final="gradient" seed="ai" tracking="-0.02em" style={{ fontKerning: "none" }} />
      </span>
    );
  }
  // Reflet 10,90 → 11,35 : bande claire qui traverse les deux mots.
  const sp = prog(T, 10.9, 11.35, E.inOut);
  const wA = 2.45;
  const wB = 0.95;
  const x = mix(-0.4, wA + wB + 0.4, sp);
  const band = (w: number, off: number) => {
    const c = ((x - off) / w) * 100;
    const h = (0.32 / w) * 100;
    return { c, h };
  };
  const a = band(wA, 0);
  const b = band(wB, wA);
  const on = sp > 0 && sp < 1;
  return (
    <span style={base}>
      <span
        style={
          on
            ? gradientText(
                `linear-gradient(100deg, #FAFAFA 0%, #FAFAFA ${a.c - a.h}%, #FFE6E0 ${a.c}%, #FAFAFA ${a.c + a.h}%, #FAFAFA 100%)`,
              )
            : { color: C.text }
        }
      >
        APEX
      </span>
      <span
        style={
          on
            ? gradientText(
                `linear-gradient(100deg, #FF4242 0%, #FF6A3F ${b.c - b.h}%, #FFF1E6 ${b.c}%, #FF8A3D ${b.c + b.h}%, #FF9933 100%)`,
              )
            : gradientText(G.textPrimary)
        }
      >
        AI
      </span>
    </span>
  );
};
