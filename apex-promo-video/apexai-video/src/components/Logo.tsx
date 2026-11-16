import React from "react";
import { getLength } from "@remotion/paths";
import { C, G, gradientText, DISPLAY, SHADOW } from "../theme";

const BOLT = "M256 64L128 288h96l-16 160 144-224h-96l112-160z";
const BOLT_LEN = getLength(BOLT);

/** Icône officielle (assets/brand/apexai-icon.svg) : carré arrondi dégradé + éclair blanc. */
export const LogoIcon: React.FC<{
  size: number;
  /** 0→1 : tracé du contour de l'éclair. */
  draw?: number;
  /** 0→1 : remplissage de l'éclair. */
  fill?: number;
  glow?: number;
  /** 0→1 : opacité globale de l'éclair (contour + remplissage). */
  boltOpacity?: number;
  style?: React.CSSProperties;
}> = ({ size, draw = 1, fill = 1, glow = 1, boltOpacity = 1, style }) => {
  const id = `apx-g-${Math.round(size)}`;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.1875,
        boxShadow: glow > 0 ? `0 0 ${60 * glow}px -6px rgba(255,66,66,${0.75 * glow}), ${SHADOW.logoIcon}` : undefined,
        flexShrink: 0,
        ...style,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 512 512" style={{ display: "block" }}>
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF4242" />
            <stop offset="100%" stopColor="#E60000" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="96" fill={`url(#${id})`} />
        <path
          d={BOLT}
          fill="white"
          fillOpacity={fill}
          opacity={boltOpacity}
          stroke="white"
          strokeWidth={14}
          strokeLinejoin="round"
          strokeDasharray={BOLT_LEN}
          strokeDashoffset={BOLT_LEN * (1 - draw)}
        />
      </svg>
    </div>
  );
};

/** Logotype « APEXAI » : APEX blanc, AI rouge ou en dégradé. Jamais d'espace. */
export const Wordmark: React.FC<{
  size: number;
  ai?: "red" | "gradient";
  apexStyle?: (i: number) => React.CSSProperties;
  aiNode?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ size, ai = "gradient", apexStyle, aiNode, style }) => {
  return (
    <span
      style={{
        fontFamily: `'${DISPLAY}', sans-serif`,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "-0.02em",
        lineHeight: 1,
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "baseline",
        ...style,
      }}
    >
      {Array.from("APEX").map((ch, i) => (
        <span key={i} style={{ display: "inline-block", color: C.text, ...(apexStyle ? apexStyle(i) : {}) }}>
          {ch}
        </span>
      ))}
      {aiNode ?? (
        <span style={{ display: "inline-block", ...(ai === "gradient" ? gradientText(G.textPrimary) : { color: C.primary }) }}>AI</span>
      )}
    </span>
  );
};
