import React from "react";
import { AbsoluteFill, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { noise2D } from "@remotion/noise";
import { C } from "../theme";

type Blob = { color: string; r: number; op: number; x: number; y: number; seed: string };

/**
 * Fond vivant : taches lumineuses rouge/orange qui dérivent, grain filmique, vignettage.
 * Les taches sont des dégradés radiaux (pas de filter: blur plein écran → rendu rapide).
 */
export const Atmosphere: React.FC<{
  intensity: number;
  base?: string;
  grain?: number;
  vignette?: number;
  /** Décale les taches (par ex. coins bas-gauche / haut-droite pour le logo). */
  layout?: "default" | "corners";
}> = ({ intensity, base = C.bg, grain = 0.045, vignette = 0.65, layout = "default" }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const k = Math.min(width, height) / 1080;

  const blobs: Blob[] =
    layout === "corners"
      ? [
          { color: "255,66,66", r: 820, op: 0.6, x: 0.06, y: 0.92, seed: "a" },
          { color: "255,153,51", r: 620, op: 0.36, x: 0.95, y: 0.06, seed: "b" },
          { color: "230,0,0", r: 900, op: 0.22, x: 0.55, y: 1.15, seed: "c" },
        ]
      : [
          { color: "255,66,66", r: 760, op: 0.55, x: 0.1, y: 0.9, seed: "a" },
          { color: "255,153,51", r: 600, op: 0.3, x: 0.9, y: 0.12, seed: "b" },
          { color: "230,0,0", r: 950, op: 0.36, x: 0.55, y: 1.12, seed: "c" },
        ];

  const gx = Math.floor(random(`grain-x-${Math.floor(frame / 2)}`) * 512);
  const gy = Math.floor(random(`grain-y-${Math.floor(frame / 2)}`) * 512);

  return (
    <AbsoluteFill style={{ backgroundColor: base, overflow: "hidden" }}>
      {blobs.map((b) => {
        const dx = noise2D(`blob-x-${b.seed}`, frame * 0.0025, 0) * 60 * k;
        const dy = noise2D(`blob-y-${b.seed}`, 0, frame * 0.0025) * 60 * k;
        const breathe = 1 + noise2D(`blob-s-${b.seed}`, frame * 0.003, 3) * 0.08;
        const r = b.r * k * breathe;
        return (
          <div
            key={b.seed}
            style={{
              position: "absolute",
              left: b.x * width + dx - r,
              top: b.y * height + dy - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background: `radial-gradient(circle at center, rgba(${b.color},${(b.op * intensity).toFixed(3)}) 0%, rgba(${b.color},${(b.op * intensity * 0.45).toFixed(3)}) 35%, rgba(${b.color},0) 70%)`,
              mixBlendMode: "screen",
            }}
          />
        );
      })}
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile("textures/grain.png")})`,
          backgroundSize: "512px 512px",
          backgroundPosition: `${gx}px ${gy}px`,
          opacity: grain,
          mixBlendMode: "screen",
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,${vignette}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Grain + vignettage seuls, à poser au-dessus d'une scène (panneau rouge, photo…). */
export const FilmLayer: React.FC<{ grain?: number; vignette?: number }> = ({ grain = 0.05, vignette = 0.5 }) => {
  const frame = useCurrentFrame();
  const gx = Math.floor(random(`grain2-x-${Math.floor(frame / 2)}`) * 512);
  const gy = Math.floor(random(`grain2-y-${Math.floor(frame / 2)}`) * 512);
  return (
    <>
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile("textures/grain.png")})`,
          backgroundSize: "512px 512px",
          backgroundPosition: `${gx}px ${gy}px`,
          opacity: grain,
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,${vignette}) 100%)`,
          pointerEvents: "none",
        }}
      />
    </>
  );
};
