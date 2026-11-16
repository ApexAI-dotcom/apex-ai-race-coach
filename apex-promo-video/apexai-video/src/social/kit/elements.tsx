import React from "react";
import { Img, staticFile } from "remotion";
import { Bookmark, Check, ChevronRight } from "lucide-react";
import { LogoIcon } from "../../components/Logo";
import { C, FONT, GRAD, INK, LABEL_DEMO, alpha } from "./tokens";
import { Rich, fr } from "./text";

/** Pied de page : icône + apexai.racing, compteur de carrousel à droite. */
export const Footer: React.FC<{ x0?: number; x1?: number; y?: number; index?: number; total?: number; light?: boolean }> = ({
  x0 = 72,
  x1 = 1008,
  y = 1262,
  index,
  total,
  light = false,
}) => (
  <div style={{ position: "absolute", left: x0, width: x1 - x0, top: y, height: 32, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <LogoIcon size={32} glow={0} />
      <span style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 22, color: light ? alpha(C.text, 0.85) : INK.muted, letterSpacing: "0.01em" }}>apexai.racing</span>
    </div>
    {total ? (
      <span style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 22, fontVariantNumeric: "tabular-nums", color: light ? alpha(C.text, 0.85) : INK.muted }}>
        <span style={{ color: C.text }}>{String(index).padStart(2, "0")}</span>
        <span>/{String(total).padStart(2, "0")}</span>
      </span>
    ) : null}
  </div>
);

/** Étiquette discrète obligatoire sur les chiffres de démo. */
export const DemoTag: React.FC<{ style?: React.CSSProperties; size?: number; light?: boolean; text?: string }> = ({ style, size = 20, light = false, text }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: size * 0.5,
      fontFamily: FONT.body,
      fontWeight: 600,
      fontSize: size,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: light ? alpha(C.text, 0.8) : INK.muted,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    <span style={{ width: size * 0.42, height: size * 0.42, borderRadius: "50%", border: `2px solid ${light ? alpha(C.text, 0.8) : INK.muted}` }} />
    {text ? fr(text) : LABEL_DEMO}
  </div>
);

/** Encadré « À travailler ». */
export const TipBox: React.FC<{ text: string; size?: number; style?: React.CSSProperties }> = ({ text, size = 32, style }) => (
  <div
    style={{
      display: "flex",
      gap: size * 0.6,
      alignItems: "flex-start",
      padding: `${size * 0.7}px ${size * 0.8}px`,
      borderRadius: size * 0.6,
      background: alpha(C.success, 0.07),
      border: `2px solid ${alpha(C.success, 0.28)}`,
      ...style,
    }}
  >
    <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: Math.max(22, size * 0.69), letterSpacing: "0.14em", textTransform: "uppercase", color: C.success, whiteSpace: "nowrap", marginTop: size * 0.2 }}>
      À travailler
    </span>
    <span style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: size, lineHeight: 1.3, color: INK.body }}>
      <Rich text={text} base="soft" />
    </span>
  </div>
);

/** Barre de progression d'un sous-score. */
export const ScoreBar: React.FC<{ value: number; width: number; height?: number; style?: React.CSSProperties }> = ({ value, width, height = 14, style }) => (
  <div style={{ width, height, borderRadius: height / 2, background: alpha(C.text, 0.1), overflow: "hidden", ...style }}>
    <div style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: "100%", borderRadius: height / 2, background: GRAD.keyword, boxShadow: `0 0 ${height * 1.4}px ${alpha(C.primary, 0.6)}` }} />
  </div>
);

/** Bouton d'appel à l'action (pilule dégradée + carré chevron, comme « S'inscrire › » du site). */
export const CtaButton: React.FC<{ text: string; height?: number; width?: number; fontSize?: number; icon?: "chevron" | "bookmark"; light?: boolean; style?: React.CSSProperties }> = ({
  text,
  height = 104,
  width,
  fontSize = 38,
  icon = "chevron",
  light = false,
  style,
}) => (
  <div
    style={{
      height,
      width,
      padding: `0 ${height * 0.18}px 0 ${height * 0.42}px`,
      borderRadius: 999,
      background: light ? C.text : GRAD.primary,
      boxShadow: light ? `0 18px 40px -16px ${alpha(C.bgDeep, 0.6)}` : `0 0 46px -8px ${alpha(C.primary, 0.75)}, 0 18px 40px -16px ${alpha(C.bgDeep, 0.6)}`,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: height * 0.26,
      fontFamily: FONT.display,
      fontWeight: 600,
      fontSize,
      color: light ? C.primaryDeep : C.text,
      letterSpacing: "-0.01em",
      whiteSpace: "nowrap",
      boxSizing: "border-box",
      ...style,
    }}
  >
    <span>{fr(text)}</span>
    <span
      style={{
        width: height * 0.62,
        height: height * 0.62,
        borderRadius: height * 0.16,
        background: light ? alpha(C.primary, 0.12) : alpha(C.text, 0.18),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon === "bookmark" ? (
        <Bookmark size={height * 0.3} color={light ? C.primaryDeep : C.text} strokeWidth={2.4} />
      ) : (
        <ChevronRight size={height * 0.34} color={light ? C.primaryDeep : C.text} strokeWidth={2.6} />
      )}
    </span>
  </div>
);

/** Pastille (badge) à contour. */
export const Chip: React.FC<{ text: string; tone?: "red" | "neutral" | "gold" | "green"; size?: number; icon?: React.ReactNode; style?: React.CSSProperties }> = ({
  text,
  tone = "neutral",
  size = 26,
  icon,
  style,
}) => {
  const col = tone === "red" ? C.primary : tone === "gold" ? C.gold : tone === "green" ? C.success : C.text;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.4,
        padding: `${size * 0.36}px ${size * 0.8}px`,
        borderRadius: 999,
        background: tone === "neutral" ? alpha(C.text, 0.06) : alpha(col, 0.1),
        border: `2px solid ${tone === "neutral" ? alpha(C.text, 0.14) : alpha(col, 0.35)}`,
        color: tone === "neutral" ? alpha(C.text, 0.9) : col,
        fontFamily: FONT.body,
        fontWeight: 600,
        fontSize: size,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {icon}
      {fr(text)}
    </span>
  );
};

/** Chiffre héros : signe coloré, unité plus petite. */
export const HeroNumber: React.FC<{
  value: string;
  unit?: string;
  size?: number;
  tone?: "gain" | "loss" | "neutral" | "gradient" | "white";
  glow?: boolean;
  style?: React.CSSProperties;
}> = ({ value, unit, size = 300, tone = "neutral", glow = true, style }) => {
  const col = tone === "gain" ? C.success : tone === "loss" ? C.primary : C.text;
  const textStyle: React.CSSProperties =
    tone === "gradient"
      ? { backgroundImage: GRAD.keyword, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" }
      : { color: col };
  const shadow = glow && (tone === "gain" || tone === "loss") ? `drop-shadow(0 0 ${size * 0.12}px ${alpha(col, 0.45)})` : undefined;
  return (
    <div style={{ display: "flex", alignItems: "baseline", fontFamily: FONT.display, fontWeight: 700, lineHeight: 0.9, whiteSpace: "nowrap", filter: shadow, ...style }}>
      <span style={{ fontSize: size, letterSpacing: "-0.045em", fontVariantNumeric: "tabular-nums", ...textStyle }}>{value}</span>
      {unit ? <span style={{ fontSize: size * 0.32, marginLeft: size * 0.06, letterSpacing: "-0.02em", ...textStyle }}>{unit}</span> : null}
    </div>
  );
};

/** Carte d'interface flottante en 3D (perspective, halo, ombre portée). */
export const FloatingCard: React.FC<{
  children: React.ReactNode;
  rx?: number;
  ry?: number;
  rz?: number;
  perspective?: number;
  glow?: string;
  glowSize?: number;
  scale?: number;
  origin?: string;
  style?: React.CSSProperties;
}> = ({ children, rx = 8, ry = -10, rz = 0, perspective = 1600, glow = C.primary, glowSize = 1, scale = 1, origin = "50% 50%", style }) => (
  <div style={{ perspective, perspectiveOrigin: origin, ...style }}>
    <div style={{ position: "relative", transformStyle: "preserve-3d", transformOrigin: origin, transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale})` }}>
      <div
        style={{
          position: "absolute",
          inset: "-12%",
          background: `radial-gradient(closest-side, ${alpha(glow, 0.32 * glowSize)}, ${alpha(glow, 0)})`,
          filter: "blur(24px)",
          transform: "translateZ(-40px)",
        }}
      />
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  </div>
);

/** Logo officiel (fichiers du kit, texte vectorisé). */
export const Lockup: React.FC<{ height: number; variant?: "h-dark" | "h-light" | "v-dark" | "mono-white" | "wordmark-dark"; style?: React.CSSProperties }> = ({
  height,
  variant = "h-dark",
  style,
}) => <Img src={staticFile(`social/logo/apexai-${variant.startsWith("wordmark") ? variant : variant.startsWith("mono") ? variant : "lockup-" + variant}.svg`)} style={{ height, display: "block", ...style }} />;

/** Liste à coches. */
export const CheckList: React.FC<{ items: string[]; size?: number; color?: string; gap?: number; style?: React.CSSProperties }> = ({
  items,
  size = 32,
  color = C.success,
  gap = 18,
  style,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap, ...style }}>
    {items.map((it, i) => (
      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: size * 0.55 }}>
        <span
          style={{
            flex: "none",
            width: size * 1.05,
            height: size * 1.05,
            marginTop: size * 0.08,
            borderRadius: "50%",
            background: alpha(color, 0.14),
            border: `2px solid ${alpha(color, 0.45)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Check size={size * 0.62} color={color} strokeWidth={3} />
        </span>
        <span style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: size, lineHeight: 1.28, color: INK.body }}>
          <Rich text={it} base="soft" />
        </span>
      </div>
    ))}
  </div>
);

/** Barre de mini-secteurs (écran de timing). status : best | ok | slow | off */
export const SectorBar: React.FC<{ statuses: Array<"best" | "ok" | "slow" | "off" | "gold">; width: number; height?: number; gap?: number; labels?: boolean; style?: React.CSSProperties }> = ({
  statuses,
  width,
  height = 26,
  gap = 8,
  labels = false,
  style,
}) => {
  const n = statuses.length;
  const w = (width - gap * (n - 1)) / n;
  const col = (s: string) => (s === "best" ? C.success : s === "gold" ? C.gold : s === "ok" ? C.gold : s === "slow" ? C.primary : alpha(C.text, 0.12));
  return (
    <div style={{ width, ...style }}>
      <div style={{ display: "flex", gap }}>
        {statuses.map((s, i) => (
          <div
            key={i}
            style={{
              width: w,
              height,
              borderRadius: height / 4,
              background: col(s),
              boxShadow: s === "off" ? undefined : `0 0 ${height * 0.8}px ${alpha(col(s), 0.45)}`,
            }}
          />
        ))}
      </div>
      {labels ? (
        <div style={{ display: "flex", gap, marginTop: 10 }}>
          {statuses.map((_, i) => (
            <div key={i} style={{ width: w, textAlign: "center", fontFamily: FONT.body, fontWeight: 600, fontSize: 18, color: INK.muted }}>
              {`S${i + 1}`}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

/** Numéro d'étape façon numéro de course : contour dégradé, intérieur vide. */
export const StepNumber: React.FC<{ n: string; size?: number; style?: React.CSSProperties }> = ({ n, size = 220, style }) => (
  <div
    style={{
      fontFamily: FONT.display,
      fontWeight: 700,
      fontSize: size,
      lineHeight: 0.85,
      letterSpacing: "-0.05em",
      color: "transparent",
      WebkitTextStroke: `${Math.max(2, size / 70)}px ${C.primary}`,
      filter: `drop-shadow(0 0 ${size * 0.08}px ${alpha(C.primary, 0.5)})`,
      ...style,
    }}
  >
    {n}
  </div>
);
