import data from "./cues.json";
import { CORNERS, LAP_T9, PTS } from "../lib/track";

export type Cue = { t: number; scene: string; kind: "music" | "sfx" | "silence"; name: string; desc: string; file?: string };

/** Inverse de la courbe du duel (bezier 0.3, 0, 0.7, 1) par dichotomie. */
const bez = (p1x: number, p1y: number, p2x: number, p2y: number) => {
  const at = (a1: number, a2: number, t: number) => 3 * a1 * t * (1 - t) ** 2 + 3 * a2 * t * t * (1 - t) + t ** 3;
  return (x: number) => {
    let lo = 0;
    let hi = 1;
    for (let k = 0; k < 40; k++) {
      const m = (lo + hi) / 2;
      if (at(p1x, p2x, m) < x) lo = m;
      else hi = m;
    }
    return at(p1y, p2y, (lo + hi) / 2);
  };
};
const inv = (f: (t: number) => number, y: number) => {
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 40; k++) {
    const m = (lo + hi) / 2;
    if (f(m) < y) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};
const duelEase = bez(0.3, 0, 0.7, 1);

/** Instants où le Tour 4 franchit chaque virage pendant le duel (mêmes calculs que S02 / V02). */
export const cornerTicks = (duelStart: number, duelEnd: number, scene: string): Cue[] =>
  CORNERS.map((c) => {
    const tau = PTS[c.i][3];
    const t = duelStart + (duelEnd - duelStart) * inv(duelEase, tau / LAP_T9);
    return { t: Math.round(t * 1000) / 1000, scene, kind: "sfx" as const, name: `Tick virage ${c.n}`, file: "tick-corner", desc: `Le Tour 4 passe le virage ${c.n} ; tonalité qui monte avec l'écart` };
  });

const sortCues = (a: Cue[]) => [...a].sort((x, y) => x.t - y.t);

export const CUES_16x9: Cue[] = sortCues([...(data["16x9"] as Cue[]), ...cornerTicks(4.1, 6.1, "S02")]);
export const CUES_9x16: Cue[] = sortCues([...(data["9x16"] as Cue[]), ...cornerTicks(3.0, 4.6, "V02")]);
