import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { C, alpha } from "./tokens";

export type Blob = { x: number; y: number; r: number; color?: "red" | "orange" | "deep"; op?: number };

const COLORS = { red: C.primary, orange: C.orange, deep: C.primaryDeep };

export const BG_PRESETS: Record<string, Blob[]> = {
  /** rouge en bas à gauche, orange en haut à droite (comme le film) */
  default: [
    { x: 0.08, y: 0.92, r: 760, color: "red", op: 0.5 },
    { x: 0.94, y: 0.08, r: 600, color: "orange", op: 0.26 },
    { x: 0.55, y: 1.15, r: 950, color: "deep", op: 0.3 },
  ],
  corners: [
    { x: 0.02, y: 0.98, r: 820, color: "red", op: 0.55 },
    { x: 1.0, y: 0.0, r: 640, color: "orange", op: 0.32 },
  ],
  top: [
    { x: 0.2, y: -0.05, r: 820, color: "red", op: 0.42 },
    { x: 0.95, y: 0.25, r: 520, color: "orange", op: 0.2 },
    { x: 0.5, y: 1.2, r: 900, color: "deep", op: 0.24 },
  ],
  center: [
    { x: 0.5, y: 0.45, r: 760, color: "red", op: 0.34 },
    { x: 0.9, y: 0.05, r: 520, color: "orange", op: 0.18 },
    { x: 0.1, y: 1.05, r: 820, color: "deep", op: 0.3 },
  ],
  calm: [
    { x: 0.1, y: 1.0, r: 700, color: "red", op: 0.3 },
    { x: 0.95, y: 0.0, r: 520, color: "orange", op: 0.14 },
  ],
};

/**
 * Fond fixe pour les visuels (posts, stories, couvertures) : noir de la charte,
 * taches lumineuses rouge/orange, grain fin et vignettage. Aucune dépendance au temps.
 */
export const SocialBackground: React.FC<{
  width: number;
  height: number;
  blobs?: Blob[];
  preset?: keyof typeof BG_PRESETS;
  intensity?: number;
  grain?: number;
  vignette?: number;
  base?: string;
  /** Quadrillage discret (repères de construction). */
  grid?: number;
  /** Échelle des taches (par défaut : plus petit côté / 1080). */
  scale?: number;
}> = ({ width, height, blobs, preset = "default", intensity = 1, grain = 0.04, vignette = 0.55, base = C.bg, grid = 0, scale }) => {
  const list = blobs ?? BG_PRESETS[preset];
  const k = scale ?? Math.min(width, height) / 1080;
  return (
    <AbsoluteFill style={{ width, height, backgroundColor: base, overflow: "hidden" }}>
      {list.map((b, i) => {
        const col = COLORS[b.color ?? "red"];
        const r = b.r * k;
        const op = (b.op ?? 0.4) * intensity;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: b.x * width - r,
              top: b.y * height - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background: `radial-gradient(circle at center, ${alpha(col, op)} 0%, ${alpha(col, op * 0.42)} 36%, ${alpha(col, 0)} 70%)`,
              mixBlendMode: "screen",
            }}
          />
        );
      })}
      {grid > 0 ? (
        <AbsoluteFill
          style={{
            backgroundImage: `linear-gradient(${alpha(C.text, 0.05 * grid)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(C.text, 0.05 * grid)} 1px, transparent 1px)`,
            backgroundSize: `${60 * k}px ${60 * k}px`,
            WebkitMaskImage: "radial-gradient(ellipse at 50% 45%, black 20%, transparent 75%)",
            maskImage: "radial-gradient(ellipse at 50% 45%, black 20%, transparent 75%)",
          }}
        />
      ) : null}
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile("textures/grain.png")})`,
          backgroundSize: "512px 512px",
          opacity: grain,
          mixBlendMode: "screen",
        }}
      />
      {vignette > 0 ? (
        <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, ${alpha(C.bgDeep, 0)} 55%, ${alpha(C.bgDeep, vignette)} 100%)` }} />
      ) : null}
    </AbsoluteFill>
  );
};

/** Panneau rouge plein (signature « déclaration ») : dégradé primary, reflet orange, grain. */
export const RedPanel: React.FC<{ width: number; height: number; glow?: { x: number; y: number }; grain?: number }> = ({
  width,
  height,
  glow = { x: 0.32, y: 0.3 },
  grain = 0.07,
}) => {
  const R = Math.max(width, height) * 0.75;
  return (
    <AbsoluteFill style={{ width, height, background: C.primary, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDeep} 100%)` }} />
      <div
        style={{
          position: "absolute",
          left: glow.x * width - R,
          top: glow.y * height - R,
          width: 2 * R,
          height: 2 * R,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(C.orange, 0.42)} 0%, ${alpha(C.orange, 0.12)} 40%, ${alpha(C.orange, 0)} 70%)`,
          mixBlendMode: "screen",
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile("textures/grain.png")})`,
          backgroundSize: "512px 512px",
          opacity: grain,
          mixBlendMode: "overlay",
        }}
      />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, ${alpha(C.bgDeep, 0)} 60%, ${alpha(C.bgDeep, 0.28)} 100%)` }} />
    </AbsoluteFill>
  );
};
