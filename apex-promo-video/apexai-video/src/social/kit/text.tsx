import React from "react";
import { C, FONT, GRAD, INK, alpha } from "./tokens";
import { gradientText } from "../../theme";

/**
 * Typographie française : espace fine insécable (U+202F) avant « ? ! : ; »
 * (sans toucher aux URL ni aux heures), « 1re » et non « 1ère ».
 */
export const fr = (s: string) =>
  s
    .replace(/[   ]+([?!;:])(?=\s|$|[)»*\]\n])/g, " $1")
    .replace(/([^\s  \d/=&])([?!;])(?=\s|$|[)»*\]\n])/g, "$1 $2")
    .replace(/1ère/g, "1re")
    .replace(/« /g, "« ")
    .replace(/ »/g, " »");

export type Tone = "white" | "gradient" | "success" | "loss" | "gold" | "muted" | "soft";

export const toneStyle = (tone: Tone | undefined): React.CSSProperties => {
  switch (tone) {
    case "gradient":
      return { ...gradientText(GRAD.keyword), WebkitBoxDecorationBreak: "clone", boxDecorationBreak: "clone" } as React.CSSProperties;
    case "success":
      return { color: C.success };
    case "loss":
      return { color: C.primary };
    case "gold":
      return { color: C.gold };
    case "muted":
      return { color: INK.muted };
    case "soft":
      return { color: INK.soft };
    default:
      return { color: C.text };
  }
};

const TAGS: Record<string, Tone> = { vert: "success", rouge: "loss", or: "gold", gris: "muted", blanc: "white", doux: "soft" };

/**
 * Texte enrichi, éditable depuis Remotion Studio :
 *   *mot*                → dégradé rouge → orange (mot-clé)
 *   [vert]…[/vert]       → vert (gain)      [rouge]…[/rouge] → rouge (perte)
 *   [or]…[/or]           → or (Tour IA)     [gris]…[/gris]   → gris
 *   retour à la ligne    → \n
 */
export const Rich: React.FC<{ text: string; base?: Tone; style?: React.CSSProperties; onRed?: boolean }> = ({ text, base, style, onRed = false }) => {
  const src = fr(text);
  const parts: Array<{ t: string; tone?: Tone }> = [];
  const re = /\*([^*]+)\*|\[(vert|rouge|or|gris|blanc|doux)\]([\s\S]*?)\[\/\2\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m.index > last) parts.push({ t: src.slice(last, m.index), tone: base });
    if (m[1] !== undefined) parts.push({ t: m[1], tone: "gradient" });
    else parts.push({ t: m[3], tone: TAGS[m[2]] });
    last = m.index + m[0].length;
  }
  if (last < src.length) parts.push({ t: src.slice(last), tone: base });
  return (
    <span style={{ whiteSpace: "pre-line", ...style }}>
      {parts.map((p, i) => (
        <span key={i} style={onRed && p.tone === "gradient" ? { color: C.bgDeep } : toneStyle(p.tone)}>
          {p.t}
        </span>
      ))}
    </span>
  );
};

/** Titre Space Grotesk 700 serré. */
export const Title: React.FC<{ text: string; size: number; tone?: Tone; style?: React.CSSProperties; lineHeight?: number; tracking?: string; onRed?: boolean }> = ({
  text,
  size,
  tone,
  style,
  lineHeight = 1.0,
  tracking,
  onRed = false,
}) => (
  <div
    style={{
      fontFamily: FONT.display,
      fontWeight: 700,
      fontSize: size,
      lineHeight,
      letterSpacing: tracking ?? (size >= 100 ? "-0.035em" : "-0.025em"),
      color: C.text,
      ...style,
    }}
  >
    <Rich text={text} base={tone} onRed={onRed} />
  </div>
);

/** Texte courant Inter 500. */
export const Body: React.FC<{ text: string; size?: number; tone?: Tone; style?: React.CSSProperties; weight?: number }> = ({
  text,
  size = 36,
  tone = "soft",
  style,
  weight = 500,
}) => (
  <div style={{ fontFamily: FONT.body, fontWeight: weight, fontSize: size, lineHeight: 1.32, letterSpacing: "-0.005em", ...style }}>
    <Rich text={text} base={tone} />
  </div>
);

/** Label de rubrique : barre rouge + capitales espacées. */
export const Label: React.FC<{ text: string; size?: number; color?: string; bar?: boolean; style?: React.CSSProperties }> = ({
  text,
  size = 22,
  color = INK.muted,
  bar = true,
  style,
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.62, ...style }}>
    {bar ? <span style={{ width: size * 0.3, height: size * 0.95, borderRadius: size * 0.15, background: GRAD.primary, boxShadow: `0 0 ${size * 0.6}px ${alpha(C.primary, 0.55)}` }} /> : null}
    <span style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: size, letterSpacing: "0.2em", textTransform: "uppercase", color, whiteSpace: "nowrap" }}>
      {fr(text)}
    </span>
  </div>
);
