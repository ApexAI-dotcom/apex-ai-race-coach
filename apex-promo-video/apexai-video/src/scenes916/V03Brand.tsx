import React from "react";
import { AbsoluteFill, random, staticFile, useVideoConfig } from "remotion";
import { Zap } from "lucide-react";
import { noise2D } from "@remotion/noise";
import { C, G, gradientText, BODY, DISPLAY } from "../theme";
import { E, kf, mix, prog, reveal, springAt, useT, wobble } from "../lib/anim";
import { LogoIcon } from "../components/Logo";
import { DecodeText } from "../components/fx";
import { H9, SX, V04_CARD, W9 } from "./layout916";

// Logo sur une ligne : icône 120 + espace 30 + logotype 130 px (≈ 428 px).
const ICON = 120;
const GAP = 30;
const WORD_W = 428;
const LOCK_W = ICON + GAP + WORD_W;
const CY = 860;
const LEFT = SX - LOCK_W / 2;
const RIGHT = SX + LOCK_W / 2;
const TOP = CY - ICON / 2;
const BOTTOM = CY + ICON / 2;
const M = 30;

/** V03 — Marque + positionnement · 6,00 → 8,50 : DROP, logo, zoom à travers l'icône, panneau rouge, rétrécissement en carte d'import. */
export const V03Brand: React.FC = () => {
  const T = useT();
  const { fps } = useVideoConfig();
  if (T >= 8.55) return null;

  /* ── Logo 6,00 → 7,15 ── */
  const lines = prog(T, 6.0, 6.3, E.outExpo);
  const linesOut = prog(T, 6.55, 6.8, E.inOut);
  const handles = springAt(T, 6.12, fps, { damping: 13, stiffness: 200, mass: 0.6 }) * (1 - linesOut);
  const iconSpring = springAt(T, 6.0, fps, { damping: 12, stiffness: 190, mass: 0.6 });
  const iconRot = mix(-14, 0, Math.min(1, iconSpring));
  const boltDraw = prog(T, 6.03, 6.18, E.inOut);
  const boltFill = prog(T, 6.18, 6.26, E.outExpo);
  const zoom = prog(T, 6.78, 7.02, E.inExpo);
  const boltFade = 1 - prog(T, 6.78, 6.92, E.linear);
  const others = prog(T, 6.78, 6.98, E.inExpo);
  const push = kf(T, [6.0, 6.8], [1.0, 1.04], E.inOut);
  const driftX = wobble("v03x", T) * 4;
  const driftY = wobble("v03y", T) * 4;
  const nx = noise2D("v03blob", T * 0.15, 0) * 40;
  const ny = noise2D("v03blob", 0, T * 0.15) * 40;
  const logoOn = T < 7.05;

  /* ── Panneau rouge 6,98 → 8,50 ── */
  const panelOn = prog(T, 7.0, 7.02, E.linear);
  const shrink = prog(T, 8.1, 8.5, E.ios);
  const px = mix(0, V04_CARD.x, shrink);
  const py = mix(0, V04_CARD.y, shrink);
  const pw = mix(W9, V04_CARD.w, shrink);
  const ph = mix(H9, V04_CARD.hEmpty, shrink);
  const radius = mix(0, 18 * V04_CARD.k, shrink);
  const toCard = prog(T, 8.3, 8.5, E.inOut);
  const textOut = prog(T, 8.02, 8.3, E.inExpo);
  const track = mix(0.35, -0.02, prog(T, 7.3, 7.75, E.outExpo));
  const line3 = prog(T, 7.3, 7.65, E.outExpo);
  const hx = 0.4 + noise2D("v03h", T * 0.25, 0) * 0.2;
  const hy = 0.4 + noise2D("v03h", 0, T * 0.25) * 0.2;
  const gx = Math.floor(random(`v03g-${Math.floor(T * 30)}`) * 512);

  const dash = (o: number) => ({
    backgroundImage: `repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0 5px, rgba(255,255,255,0) 5px 10px)`,
    backgroundPosition: `${o}px 0`,
  });
  const dashV = (o: number) => ({
    backgroundImage: `repeating-linear-gradient(180deg, rgba(255,255,255,0.16) 0 5px, rgba(255,255,255,0) 5px 10px)`,
    backgroundPosition: `0 ${o}px`,
  });
  const march = prog(T, 6.4, 6.8, E.linear) * 40;

  return (
    <AbsoluteFill>
      {logoOn ? (
        <AbsoluteFill>
          {/* Taches d'angle */}
          <div
            style={{
              position: "absolute",
              left: -420 + nx,
              top: 1300 + ny,
              width: 980,
              height: 980,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,66,66,0.30) 0%, rgba(255,66,66,0.12) 35%, rgba(255,66,66,0) 70%)",
              mixBlendMode: "screen",
              opacity: 1 - others,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 640 - nx,
              top: -380 - ny,
              width: 860,
              height: 860,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,153,51,0.20) 0%, rgba(255,153,51,0.08) 35%, rgba(255,153,51,0) 70%)",
              mixBlendMode: "screen",
              opacity: 1 - others,
            }}
          />

          <AbsoluteFill style={{ transform: `translate(${driftX}px, ${driftY}px) scale(${push})`, transformOrigin: `${SX}px ${CY}px` }}>
            {/* Grille de construction */}
            <AbsoluteFill style={{ opacity: 1 - linesOut }}>
              {[TOP - M, BOTTOM + M].map((y, i) => (
                <div key={`h${i}`} style={{ position: "absolute", left: 0, top: y, width: W9, height: 1, transform: `scaleX(${lines})`, transformOrigin: `${SX}px 0`, ...dash(march) }} />
              ))}
              {[LEFT - M, RIGHT + M].map((x, i) => (
                <div key={`v${i}`} style={{ position: "absolute", left: x, top: 0, width: 1, height: H9, transform: `scaleY(${lines})`, transformOrigin: `0 ${CY}px`, ...dashV(march) }} />
              ))}
              {[
                [LEFT - M, TOP - M],
                [RIGHT + M, TOP - M],
                [LEFT - M, BOTTOM + M],
                [RIGHT + M, BOTTOM + M],
              ].map(([x, y], i) => (
                <div key={`hd${i}`} style={{ position: "absolute", left: x - 4, top: y - 4, width: 8, height: 8, background: "rgba(250,250,250,0.6)", transform: `scale(${handles})` }} />
              ))}
            </AbsoluteFill>

            {/* Pastille « Propulsé par l'IA » */}
            <div
              style={{
                position: "absolute",
                left: 0,
                width: W9 - 60,
                top: TOP - M - 104,
                display: "flex",
                justifyContent: "center",
                ...reveal(T, 6.32, { dur: 0.4, blur: 12, y: 14 }, 6.8, { dur: 0.25, blur: 20, y: -10 }),
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 26px",
                  borderRadius: 999,
                  background: "rgba(255,66,66,0.10)",
                  border: "1px solid rgba(255,66,66,0.30)",
                  color: C.primary,
                  fontFamily: `'${BODY}', sans-serif`,
                  fontWeight: 500,
                  fontSize: 32,
                }}
              >
                <Zap size={30} color={C.primary} strokeWidth={2.2} />
                Propulsé par l'IA
              </div>
            </div>

            {/* Logo */}
            <div style={{ position: "absolute", left: LEFT, top: TOP, display: "flex", alignItems: "center", gap: GAP }}>
              <div style={{ transform: `scale(${iconSpring * mix(1, 30, zoom)}) rotate(${iconRot}deg)`, transformOrigin: "20% 80%" }}>
                <LogoIcon size={ICON} draw={boltDraw} fill={boltFill} boltOpacity={boltFade} glow={1 - zoom} />
              </div>
              <div style={{ position: "relative", opacity: 1 - others, filter: others > 0.01 ? `blur(${(others * 20).toFixed(2)}px)` : undefined }}>
                <PortraitWordmark T={T} />
              </div>
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      ) : null}

      {/* Panneau rouge → carte d'import */}
      {panelOn > 0 ? (
        <div
          style={{
            position: "absolute",
            left: px,
            top: py,
            width: pw,
            height: ph,
            borderRadius: radius,
            overflow: "hidden",
            background: G.primary,
            opacity: panelOn,
            boxShadow: shrink > 0 ? `0 40px 90px -30px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,${(0.18 * shrink).toFixed(3)})` : undefined,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: `${hx * 100}%`,
              top: `${hy * 100}%`,
              width: 1300,
              height: 1300,
              marginLeft: -650,
              marginTop: -650,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,153,51,0.45) 0%, rgba(255,153,51,0.12) 40%, rgba(255,153,51,0) 70%)",
              mixBlendMode: "screen",
            }}
          />
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
          <div style={{ position: "absolute", inset: 0, background: "#121212", opacity: toCard }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: radius, border: `${toCard > 0 ? 1.4 : 0}px solid rgba(38,38,38,${toCard.toFixed(3)})` }} />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: pw,
              height: ph,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              paddingRight: mix(60, 0, shrink),
              boxSizing: "border-box",
              transform: `scale(${mix(1, 0.42, shrink)})`,
              opacity: 1 - textOut,
              filter: textOut > 0.01 ? `blur(${(textOut * 16).toFixed(2)}px)` : undefined,
            }}
          >
            <DecodeText T={T} text="Ton" start={7.02} stagger={0.04} scramble={0.14} size={124} seed="v03a" blur={8} />
            <DecodeText T={T} text="ingénieur" start={7.12} stagger={0.035} scramble={0.14} size={124} seed="v03b" blur={8} />
            <span
              style={{
                fontFamily: `'${DISPLAY}', sans-serif`,
                fontWeight: 700,
                fontSize: 124,
                lineHeight: 1.08,
                letterSpacing: `${track}em`,
                color: "#FFFFFF",
                opacity: line3,
                filter: line3 < 0.99 ? `blur(${((1 - line3) * 10).toFixed(2)}px)` : undefined,
                whiteSpace: "nowrap",
              }}
            >
              de course IA
            </span>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Logotype « APEXAI » à 130 px : APEX monte, AI se décode, reflet. */
const PortraitWordmark: React.FC<{ T: number }> = ({ T }) => {
  const base: React.CSSProperties = {
    fontFamily: `'${DISPLAY}', sans-serif`,
    fontWeight: 700,
    fontSize: 130,
    letterSpacing: "-0.02em",
    lineHeight: 1,
    whiteSpace: "nowrap",
    fontKerning: "none",
    display: "inline-flex",
    alignItems: "baseline",
  };
  if (T < 6.5) {
    return (
      <span style={base}>
        {Array.from("APEX").map((ch, i) => {
          const p = prog(T, 6.08 + i * 0.03, 6.08 + i * 0.03 + 0.4, E.outExpo);
          return (
            <span key={i} style={{ display: "inline-block", overflow: "hidden", padding: "0.06em 0", margin: "-0.06em 0" }}>
              <span style={{ display: "inline-block", color: C.text, transform: `translateY(${((1 - p) * 0.9).toFixed(3)}em)` }}>{ch}</span>
            </span>
          );
        })}
        <DecodeText T={T} text="AI" start={6.2} stagger={0.04} scramble={0.1} size={130} final="gradient" seed="v03ai" tracking="-0.02em" style={{ fontKerning: "none" }} />
      </span>
    );
  }
  const sp = prog(T, 6.5, 6.85, E.inOut);
  const wA = 2.45;
  const wB = 0.95;
  const x = mix(-0.4, wA + wB + 0.4, sp);
  const band = (w: number, off: number) => ({ c: ((x - off) / w) * 100, h: (0.32 / w) * 100 });
  const a = band(wA, 0);
  const b = band(wB, wA);
  const on = sp > 0 && sp < 1;
  return (
    <span style={base}>
      <span style={on ? gradientText(`linear-gradient(100deg, #FAFAFA 0%, #FAFAFA ${a.c - a.h}%, #FFE6E0 ${a.c}%, #FAFAFA ${a.c + a.h}%, #FAFAFA 100%)`) : { color: C.text }}>APEX</span>
      <span
        style={
          on
            ? gradientText(`linear-gradient(100deg, #FF4242 0%, #FF6A3F ${b.c - b.h}%, #FFF1E6 ${b.c}%, #FF8A3D ${b.c + b.h}%, #FF9933 100%)`)
            : gradientText(G.textPrimary)
        }
      >
        AI
      </span>
    </span>
  );
};
