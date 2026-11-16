import React from "react";
import { AbsoluteFill, random } from "remotion";
import { C, G, gradientText, BODY, DISPLAY } from "../theme";
import { E, Ease, mix, prog, reveal } from "../lib/anim";

type RevealOpts = { dur?: number; blur?: number; y?: number; x?: number; scale?: number; ease?: Ease };

export type WordKind = "white" | "gradient" | "muted" | "success" | "loss" | "gold" | "soft";
export type WordSpec = { t: string; kind?: WordKind };

const kindStyle = (kind: WordKind | undefined): React.CSSProperties => {
  switch (kind) {
    case "gradient":
      return gradientText(G.textPrimary);
    case "muted":
      return { color: C.muted };
    case "soft":
      return { color: "rgba(250,250,250,0.85)" };
    case "success":
      return { color: C.success };
    case "loss":
      return { color: C.primary };
    case "gold":
      return { color: C.gold };
    default:
      return { color: C.text };
  }
};

/** Balayage de couleur : le mot passe de rouge/orange à sa couleur finale. */
const sweepStyle = (p: number, kind: WordKind | undefined): React.CSSProperties => {
  if (kind === "gradient") {
    return gradientText(
      `linear-gradient(100deg, #FF4242 0%, #FF5A45 ${p - 18}%, #FFE2CC ${p}%, #FF8A3D ${p + 16}%, #FF9933 100%)`,
    );
  }
  return gradientText(
    `linear-gradient(100deg, #FAFAFA 0%, #FAFAFA ${p - 25}%, #FF4242 ${p - 8}%, #FF9933 ${p}%, #FF9933 100%)`,
  );
};

const toSpecs = (words: WordSpec[] | string): WordSpec[] =>
  typeof words === "string" ? words.split(" ").map((t) => ({ t })) : words;

/** Typographie cinétique : apparition mot par mot (BlurWords) + balayage optionnel. */
export const Words: React.FC<{
  T: number;
  words: WordSpec[] | string;
  start: number;
  stagger?: number;
  size: number;
  weight?: number;
  font?: "display" | "body";
  inOpts?: RevealOpts;
  outStart?: number;
  outOpts?: RevealOpts;
  sweep?: { start: number; dur?: number; stagger?: number };
  tracking?: string;
  gapEm?: number;
  style?: React.CSSProperties;
  wordStyle?: React.CSSProperties;
}> = ({
  T,
  words,
  start,
  stagger = 0.09,
  size,
  weight = 700,
  font = "display",
  inOpts,
  outStart,
  outOpts,
  sweep,
  tracking,
  gapEm = 0.26,
  style,
  wordStyle,
}) => {
  const specs = toSpecs(words);
  const family = font === "display" ? `'${DISPLAY}', sans-serif` : `'${BODY}', sans-serif`;
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "nowrap",
        alignItems: "baseline",
        justifyContent: "center",
        columnGap: `${gapEm}em`,
        fontFamily: family,
        fontWeight: weight,
        fontSize: size,
        letterSpacing: tracking ?? (font === "display" ? "-0.03em" : "0em"),
        lineHeight: 1.08,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {specs.map((w, i) => {
        const r = reveal(T, start + i * stagger, inOpts, outStart, outOpts);
        let colorStyle = kindStyle(w.kind);
        if (sweep) {
          const sp = prog(T, sweep.start + i * (sweep.stagger ?? 0.06), sweep.start + i * (sweep.stagger ?? 0.06) + (sweep.dur ?? 0.9), E.ios);
          if (sp < 1) colorStyle = sweepStyle(mix(-30, 130, sp), w.kind);
        }
        return (
          <span
            key={`${w.t}-${i}`}
            style={{
              display: "inline-block",
              paddingBottom: "0.08em",
              ...colorStyle,
              ...r,
              ...wordStyle,
            }}
          >
            {w.t}
          </span>
        );
      })}
    </div>
  );
};

const GLYPHS = "APEXI0123456789/<>#+";

/** Lettres brouillées qui se résolvent (DecodeText). La largeur finale est réservée : la ligne ne tremble pas. */
export const DecodeText: React.FC<{
  T: number;
  text: string;
  start: number;
  stagger?: number;
  scramble?: number;
  size: number;
  weight?: number;
  final?: "white" | "gradient";
  seed: string;
  blur?: number;
  tracking?: string;
  style?: React.CSSProperties;
}> = ({ T, text, start, stagger = 0.03, scramble = 0.14, size, weight = 700, final = "white", seed, blur = 6, tracking = "-0.03em", style }) => {
  const letters = Array.from(text);
  const lastReveal = start + (letters.length - 1) * stagger + scramble;
  const settle = prog(T, lastReveal, lastReveal + 0.18, E.def);
  const base: React.CSSProperties = {
    fontFamily: `'${DISPLAY}', sans-serif`,
    fontWeight: weight,
    fontSize: size,
    letterSpacing: tracking,
    lineHeight: 1.05,
    whiteSpace: "pre",
    position: "relative",
    display: "inline-block",
    ...style,
  };
  const solid = final === "gradient" ? C.primary : C.text;
  return (
    <span style={base}>
      <span style={{ opacity: 1 - settle }}>
        {letters.map((ch, i) => {
          const t0 = start + i * stagger;
          const t1 = t0 + scramble;
          if (ch === " ") return <span key={i}> </span>;
          const visible = T >= t0;
          const scrambling = T >= t0 && T < t1;
          const glyph = GLYPHS[Math.floor(random(`${seed}-${i}-${Math.floor(T * 20)}`) * GLYPHS.length)];
          const p = prog(T, t0, t1 + 0.08, E.outExpo);
          return (
            <span key={i} style={{ position: "relative", display: "inline-block" }}>
              <span
                style={{
                  color: solid,
                  opacity: visible && !scrambling ? 1 : 0,
                  filter: !scrambling && visible && p < 1 ? `blur(${((1 - p) * blur).toFixed(2)}px)` : undefined,
                }}
              >
                {ch}
              </span>
              {scrambling ? (
                <span
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: 0,
                    transform: "translateX(-50%)",
                    color: final === "gradient" ? C.orange : "rgba(250,250,250,0.75)",
                    filter: `blur(${(blur * 0.4).toFixed(2)}px)`,
                  }}
                >
                  {glyph}
                </span>
              ) : null}
            </span>
          );
        })}
      </span>
      {settle > 0 ? (
        <span
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            opacity: settle,
            ...(final === "gradient" ? gradientText(G.textPrimary) : { color: C.text }),
          }}
        >
          {text}
        </span>
      ) : null}
    </span>
  );
};

/** Trait rouge sous un mot (comme les titres de section du site). */
export const Underline: React.FC<{ T: number; start: number; dur?: number; width: number | string; height?: number; style?: React.CSSProperties }> = ({
  T,
  start,
  dur = 0.3,
  width,
  height = 6,
  style,
}) => {
  const p = prog(T, start, start + dur, E.outExpo);
  return (
    <div
      style={{
        width,
        height,
        borderRadius: height / 2,
        background: C.primary,
        boxShadow: "0 0 18px rgba(255,66,66,0.55)",
        transform: `scaleX(${p})`,
        transformOrigin: "0% 50%",
        ...style,
      }}
    />
  );
};

/** Reflet lumineux sur du texte : copie du texte, remplie d'une bande blanche mobile. */
export const TextSheen: React.FC<{ T: number; start: number; dur?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  T,
  start,
  dur = 0.45,
  children,
  style,
}) => {
  const p = prog(T, start, start + dur, E.inOut);
  if (p <= 0 || p >= 1) return null;
  const x = mix(-30, 130, p);
  return (
    <span
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        ...gradientText(
          `linear-gradient(100deg, rgba(255,255,255,0) ${x - 14}%, rgba(255,255,255,0.85) ${x}%, rgba(255,255,255,0) ${x + 14}%)`,
        ),
        ...style,
      }}
    >
      {children}
    </span>
  );
};

/** Onde circulaire (clic, marqueur). */
export const Ripple: React.FC<{ T: number; start: number; x: number; y: number; size?: number; color?: string; dur?: number }> = ({
  T,
  start,
  x,
  y,
  size = 80,
  color = C.primary,
  dur = 0.45,
}) => {
  const p = prog(T, start, start + dur, E.outExpo);
  if (T < start || p >= 1) return null;
  const sc = mix(0.3, 2.2, p);
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2px solid ${color}`,
        opacity: 0.8 * (1 - p),
        transform: `scale(${sc})`,
        pointerEvents: "none",
      }}
    />
  );
};

/** Éclat rouge plein écran sur un temps fort (2–3 images). */
export const Flash: React.FC<{ T: number; at: number; frames?: number; fps: number; opacity?: number }> = ({ T, at, frames = 3, fps, opacity = 0.38 }) => {
  const d = frames / fps;
  if (T < at || T > at + d) return null;
  const p = (T - at) / d;
  return <AbsoluteFill style={{ background: C.primary, opacity: opacity * (1 - p * 0.6), mixBlendMode: "screen" }} />;
};

/** Bande lumineuse qui balaie un conteneur (le parent doit avoir overflow: hidden). */
export const ScanLine: React.FC<{ T: number; start: number; dur?: number; height?: number; color?: string }> = ({
  T,
  start,
  dur = 0.8,
  height = 90,
  color = "rgba(255,66,66,0.30)",
}) => {
  const p = prog(T, start, start + dur, E.inOut);
  if (T < start || p >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: `calc(${mix(-15, 115, p)}% - ${height / 2}px)`,
        height,
        background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, ${color} 50%, rgba(0,0,0,0) 100%)`,
        mixBlendMode: "screen",
        pointerEvents: "none",
      }}
    />
  );
};
