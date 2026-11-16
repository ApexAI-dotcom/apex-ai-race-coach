import React, { createContext, useContext } from "react";
import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";

/** Courbes de la charte (tailwind.config.ts de l'app). */
export const E = {
  outExpo: Easing.bezier(0.16, 1, 0.3, 1),
  ios: Easing.bezier(0.32, 0.72, 0, 1),
  def: Easing.bezier(0.2, 0.8, 0.2, 1),
  inExpo: Easing.bezier(0.7, 0, 0.84, 0),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  inQuad: Easing.bezier(0.55, 0.085, 0.68, 0.53),
  linear: (t: number) => t,
};

export type Ease = (t: number) => number;

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

/** Progression 0→1 entre t0 et t1 (temps absolu, secondes). */
export const prog = (T: number, t0: number, t1: number, ease: Ease = E.outExpo) =>
  ease(clamp01((T - t0) / Math.max(1e-6, t1 - t0)));

/** Images clés en temps absolu ; easing appliqué à chaque segment. */
export const kf = (T: number, times: number[], values: number[], ease: Ease = E.inOut) =>
  interpolate(T, times, values, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

/** Ressort sans dépassement excessif, en temps absolu. */
export const springAt = (
  T: number,
  start: number,
  fps: number,
  cfg: { damping?: number; stiffness?: number; mass?: number } = {},
) => {
  const { damping = 14, stiffness = 180, mass = 0.6 } = cfg;
  const t = Math.max(0, T - start);
  if (t <= 0) return 0;
  // Oscillateur amorti analytique (équivalent du spring() de Remotion).
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
  }
  return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
};

type RevealOpts = { dur?: number; blur?: number; y?: number; x?: number; scale?: number; ease?: Ease };

/** BlurIn / BlurOut combinés : style d'entrée puis de sortie. */
export const reveal = (
  T: number,
  inStart: number,
  inOpts: RevealOpts = {},
  outStart?: number,
  outOpts: RevealOpts = {},
): React.CSSProperties => {
  const { dur = 0.5, blur = 16, y = 24, x = 0, scale = 1.03, ease = E.outExpo } = inOpts;
  const pin = prog(T, inStart, inStart + dur, ease);
  let opacity = pin;
  let b = (1 - pin) * blur;
  let ty = (1 - pin) * y;
  let tx = (1 - pin) * x;
  let sc = mix(scale, 1, pin);
  if (outStart !== undefined) {
    const { dur: od = 0.35, blur: ob = 16, y: oy = -12, x: ox = 0, scale: os = 0.98, ease: oe = E.inExpo } = outOpts;
    const pout = prog(T, outStart, outStart + od, oe);
    opacity *= 1 - pout;
    b += pout * ob;
    ty += pout * oy;
    tx += pout * ox;
    sc *= mix(1, os, pout);
  }
  return {
    opacity,
    filter: b > 0.05 ? `blur(${b.toFixed(2)}px)` : undefined,
    transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${sc.toFixed(4)})`,
  };
};

/** Bruit déterministe -1..1 (dérives de caméra). */
export const wobble = (seed: string, T: number, speed = 0.35) => {
  const t = T * speed;
  const i = Math.floor(t);
  const f = t - i;
  const a = random(`${seed}-${i}`) * 2 - 1;
  const b = random(`${seed}-${i + 1}`) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
};

/** Contexte : début absolu de la scène, pour écrire les animations en timecodes du storyboard. */
export const SceneStartCtx = createContext(0);

export const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = useContext(SceneStartCtx);
  return start + frame / fps;
};
