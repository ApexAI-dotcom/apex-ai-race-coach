import React from "react";
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from "remotion";
import { ChevronRight } from "lucide-react";
import { C, FONT, GRAD, INK, alpha } from "../kit/tokens";
import { fr, Rich } from "../kit/text";
import { LogoIcon } from "../../components/Logo";
import { Cursor, bezier } from "../../components/Cursor";
import { Ripple } from "../../components/fx";
import { E, kf, mix, prog, reveal, springAt, wobble } from "../../lib/anim";
import { gradientText } from "../../theme";

/** Temps absolu de la composition, en secondes. */
export const useTime = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

/** Zones sûres des reels : organique (comme le film) ou publicitaire (Meta). */
export type SafeMode = "reel" | "ad";
export type Zone = { x0: number; x1: number; y0: number; y1: number; cx: number };
export const ZONE: Record<"reel" | "ad" | "story", Zone> = {
  reel: { x0: 80, x1: 940, y0: 260, y1: 1480, cx: 510 },
  ad: { x0: 80, x1: 1000, y0: 280, y1: 1240, cx: 540 },
  story: { x0: 80, x1: 1000, y0: 300, y1: 1600, cx: 540 },
};

/** Chiffre qui se décode puis se fige dans une couleur (vert de gain, rouge de perte…). */
export const DecodeNumber: React.FC<{ T: number; text: string; start: number; size: number; color: string; seed: string; stagger?: number; scramble?: number; glow?: number; unit?: string }> = ({
  T,
  text,
  start,
  size,
  color,
  seed,
  stagger = 0.035,
  scramble = 0.16,
  glow = 0.5,
  unit,
}) => {
  const GL = "0123456789+−,";
  const letters = Array.from(text);
  const last = start + (letters.length - 1) * stagger + scramble;
  const settle = prog(T, last, last + 0.15, E.def);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        fontFamily: FONT.display,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "-0.045em",
        lineHeight: 0.9,
        fontVariantNumeric: "tabular-nums",
        whiteSpace: "pre",
        color,
        filter: settle > 0 && glow > 0 ? `drop-shadow(0 0 ${(size * 0.12 * settle * glow).toFixed(1)}px ${alpha(color, 0.5)})` : undefined,
      }}
    >
      {letters.map((ch, i) => {
        const t0 = start + i * stagger;
        const t1 = t0 + scramble;
        const visible = T >= t0;
        const scr = T >= t0 && T < t1;
        const g = GL[Math.floor(random(`${seed}-${i}-${Math.floor(T * 24)}`) * GL.length)];
        return (
          <span key={i} style={{ position: "relative", display: "inline-block", opacity: visible ? 1 : 0 }}>
            <span style={{ opacity: scr ? 0 : 1 }}>{ch}</span>
            {scr ? <span style={{ position: "absolute", left: 0, top: 0, opacity: 0.7, filter: "blur(1.5px)" }}>{g}</span> : null}
          </span>
        );
      })}
      {unit ? <span style={{ fontSize: size * 0.32, marginLeft: size * 0.06, opacity: prog(T, last, last + 0.2, E.outExpo) }}>{unit}</span> : null}
    </span>
  );
};

/** Ligne de texte cinétique simple (titre Space Grotesk), mots qui entrent en flou. */
export const KLine: React.FC<{
  T: number;
  text: string;
  start: number;
  size: number;
  stagger?: number;
  out?: number;
  font?: "display" | "body";
  weight?: number;
  align?: "left" | "center";
  color?: string;
  sweep?: boolean;
  noIn?: boolean;
}> = ({ T, text, start, size, stagger = 0.08, out, font = "display", weight = 700, align = "center", color, sweep = false, noIn = false }) => {
  // découpe en mots en gardant le balisage *mot-clé*
  const tokens: Array<{ t: string; key: boolean }> = [];
  fr(text)
    .split(/(\*[^*]+\*)/)
    .filter(Boolean)
    .forEach((part) => {
      const key = part.startsWith("*");
      part
        .replace(/\*/g, "")
        .split(" ")
        .filter(Boolean)
        .forEach((w) => tokens.push({ t: w, key }));
    });
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
        columnGap: "0.26em",
        fontFamily: font === "display" ? FONT.display : FONT.body,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.04,
        letterSpacing: font === "display" ? "-0.035em" : "-0.005em",
        color: color ?? C.text,
      }}
    >
      {tokens.map((w, i) => {
        const r = noIn ? reveal(T, -1, { dur: 0.01 }, out) : reveal(T, start + i * stagger, { dur: 0.5, blur: 14, y: 22 }, out, { dur: 0.3, blur: 16, y: -14 });
        let style: React.CSSProperties = {};
        if (w.key) {
          if (sweep) {
            const sp = prog(T, start + i * stagger, start + i * stagger + 0.9, E.ios);
            const p = mix(-30, 130, sp);
            style = sp < 1 ? gradientText(`linear-gradient(100deg, ${C.primary} 0%, ${C.primary} ${p - 18}%, ${C.text} ${p}%, ${C.orange} ${p + 16}%, ${C.orange} 100%)`) : gradientText(GRAD.keyword);
          } else style = gradientText(GRAD.keyword);
        }
        return (
          <span key={i} style={{ display: "inline-block", paddingBottom: "0.08em", ...style, ...r }}>
            {w.t}
          </span>
        );
      })}
    </div>
  );
};

/** Carte de fin : logo, accroche, bouton, sous-ligne, URL (avec clic du curseur). */
export const EndCard: React.FC<{ T: number; start: number; headline: string; zone: Zone; out?: number; button?: string; sub?: string; cursor?: boolean }> = ({
  T,
  start,
  headline,
  zone,
  out,
  button = "Créer mon compte",
  sub = "Inscription gratuite",
  cursor = true,
}) => {
  const { fps } = useVideoConfig();
  if (T < start - 0.05) return null;
  const cx = zone.cx;
  const h = zone.y1 - zone.y0;
  const top = zone.y0 + h * 0.2;
  const logo = springAt(T, start, fps, { damping: 13, stiffness: 170, mass: 0.7 });
  const sheen = prog(T, start + 0.3, start + 0.75, E.inOut);
  const BTN_W = 660;
  const BTN_H = 108;
  const btnY = top + 330;
  const btnX = cx - BTN_W / 2;
  const clickT = start + 1.05;
  const curP = prog(T, start + 0.55, clickT - 0.02, E.inOut);
  const [kx, ky] = bezier(curP, [cx + 420, zone.y1 + 80], [cx + 300, btnY + 300], [btnX + BTN_W * 0.66, btnY + BTN_H * 0.62]);
  const press = Math.sin(Math.PI * prog(T, clickT, clickT + 0.12, E.linear));
  const hover = prog(T, clickT - 0.2, clickT - 0.05, E.outExpo);
  const outP = out !== undefined ? prog(T, out, out + 0.4, E.inExpo) : 0;
  const sx = mix(-0.35, 3.75, sheen);
  const sheenStyle = (w: number, off: number, base: string, glow: string) => {
    if (sheen <= 0 || sheen >= 1) return null;
    const c = ((sx - off) / w) * 100;
    const hh = (0.3 / w) * 100;
    return gradientText(`linear-gradient(100deg, ${base} 0%, ${base} ${c - hh}%, ${glow} ${c}%, ${base} ${c + hh}%, ${base} 100%)`);
  };
  return (
    <AbsoluteFill style={{ opacity: 1 - outP, filter: outP > 0.01 ? `blur(${(outP * 18).toFixed(2)}px)` : undefined, transform: `translateX(${wobble("end-x", T) * 4}px) scale(${kf(T, [start, start + 2], [1, 1.03], E.inOut)})`, transformOrigin: `${cx}px ${top + 200}px` }}>
      <div style={{ position: "absolute", left: zone.x0, width: zone.x1 - zone.x0, top, display: "flex", justifyContent: "center", alignItems: "center", gap: 26, transform: `scale(${mix(0.6, 1, Math.min(1.04, logo))})`, opacity: Math.min(1, logo * 2) }}>
        <LogoIcon size={96} />
        <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 108, letterSpacing: "-0.02em", lineHeight: 1, display: "inline-flex" }}>
          <span style={sheenStyle(2.45, 0, C.text, C.text) ?? { color: C.text }}>APEX</span>
          <span style={sheenStyle(0.95, 2.45, C.orange, C.text) ?? gradientText(GRAD.keyword)}>AI</span>
        </span>
      </div>
      <div style={{ position: "absolute", left: zone.x0, width: zone.x1 - zone.x0, top: top + 160, textAlign: "center", fontFamily: FONT.display, fontWeight: 600, fontSize: 58, letterSpacing: "-0.02em", color: C.text, ...reveal(T, start + 0.25, { dur: 0.5, blur: 12, y: 16 }) }}>
        <Rich text={headline} />
      </div>
      {button ? <div style={{ position: "absolute", left: btnX, top: btnY, width: BTN_W, height: BTN_H, ...reveal(T, start + 0.4, { dur: 0.5, blur: 14, y: 20, scale: 1.04 }) }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 999,
            background: GRAD.primary,
            boxShadow: `0 0 ${mix(40, 70, hover)}px -8px ${alpha(C.primary, mix(0.6, 0.95, hover))}, 0 18px 40px -16px ${alpha(C.bgDeep, 0.6)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            transform: `scale(${mix(1, 1.03, hover) * (1 - 0.04 * press)})`,
            fontFamily: FONT.display,
            fontWeight: 600,
            fontSize: 42,
            color: C.text,
          }}
        >
          {fr(button)}
          <span style={{ width: 64, height: 64, borderRadius: 16, background: alpha(C.text, 0.18), display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronRight size={34} color={C.text} strokeWidth={2.6} />
          </span>
        </div>
      </div> : null}
      <div style={{ position: "absolute", left: zone.x0, width: zone.x1 - zone.x0, top: btnY + (button ? 150 : 30), textAlign: "center", fontFamily: FONT.body, fontWeight: 500, fontSize: 36, color: INK.soft, ...reveal(T, start + 0.55, { dur: 0.5, blur: 10, y: 12 }) }}>
        {fr(sub)}
      </div>
      <div style={{ position: "absolute", left: zone.x0, width: zone.x1 - zone.x0, top: btnY + (button ? 240 : 120), textAlign: "center", fontFamily: FONT.body, fontWeight: 600, fontSize: 40, letterSpacing: "0.02em", color: C.text, ...reveal(T, start + 0.65, { dur: 0.5, blur: 10, y: 12 }) }}>
        apexai.racing
      </div>
      {cursor && button ? (
        <>
          <Ripple T={T} start={clickT} x={btnX + BTN_W * 0.66} y={btnY + BTN_H * 0.62} size={130} />
          {T >= start + 0.55 ? <Cursor x={kx} y={ky} press={press} scale={1.9} opacity={prog(T, start + 0.55, start + 0.67, E.outExpo)} /> : null}
        </>
      ) : null}
    </AbsoluteFill>
  );
};

/** Étiquette « Session de démo » animée (entrée/sortie en flou). */
export const DemoBadge: React.FC<{ T: number; start: number; end: number; x: number; y: number }> = ({ T, start, end, x, y }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontFamily: FONT.body,
      fontWeight: 600,
      fontSize: 22,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: INK.muted,
      ...reveal(T, start, { dur: 0.4, blur: 8, y: 8 }, end, { dur: 0.3, blur: 8, y: 0 }),
    }}
  >
    <span style={{ width: 9, height: 9, borderRadius: "50%", border: `2px solid ${INK.muted}` }} />
    {fr("Session de démo · Adria Karting Raceway")}
  </div>
);
