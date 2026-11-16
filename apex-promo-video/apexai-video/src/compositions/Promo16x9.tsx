import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";
import { FLAGS, s } from "../config";
import { DURATION_16x9, TAIL, TIMELINE_16x9, SceneId16 } from "../timeline";
import { E, SceneStartCtx, kf, prog } from "../lib/anim";
import { Atmosphere } from "../components/Atmosphere";
import { Flash } from "../components/fx";
import { DebugOverlay } from "../components/DebugOverlay";
import { S01Hook } from "../scenes/S01Hook";
import { S02Duel } from "../scenes/S02Duel";
import { S03Constat } from "../scenes/S03Constat";
import { S04Logo } from "../scenes/S04Logo";
import { S05Panel } from "../scenes/S05Panel";
import { S06Import } from "../scenes/S06Import";
import { S07Analyse } from "../scenes/S07Analyse";
import { S08Score } from "../scenes/S08Score";
import { S09PerfectLap } from "../scenes/S09PerfectLap";
import { S10Coaching } from "../scenes/S10Coaching";
import { S11Data } from "../scenes/S11Data";
import { S12Ecosystem } from "../scenes/S12Ecosystem";
import { S13Appel } from "../scenes/S13Appel";
import { S14EndCard } from "../scenes/S14EndCard";
import { Soundtrack } from "../audio/Soundtrack";
import { CUES_16x9 } from "../audio/cues";

const SCENES: Partial<Record<SceneId16, React.FC>> = {
  S01: S01Hook,
  S02: S02Duel,
  S03: S03Constat,
  S04: S04Logo,
  S05: S05Panel,
  S06: S06Import,
  S07: S07Analyse,
  S08: S08Score,
  S09: S09PerfectLap,
  S10: S10Coaching,
  S11: S11Data,
  S12: S12Ecosystem,
  S13: S13Appel,
  S14: S14EndCard,
};

/** Intensité de l'atmosphère (taches lumineuses) le long du film. */
const atmosphere = (T: number) =>
  kf(
    T,
    [0, 0.1, 1.2, 3.0, 3.9, 7.75, 8.1, 8.95, 9.8, 9.999, 10.0, 12.5, 15.0, 36.0, 39.0, 41.3, 42.0, 45.0],
    [0, 0, 0.35, 0.35, 0.3, 0.25, 0.18, 0.18, 0.75, 0.75, 0.45, 0.45, 0.42, 0.42, 0.12, 0.2, 0.5, 0.5],
    E.inOut,
  );

export const Promo16x9: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = frame / fps;

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Atmosphere intensity={atmosphere(T)} base="#080808" />

      {(Object.keys(TIMELINE_16x9) as SceneId16[]).map((id) => {
        const Comp = SCENES[id];
        if (!Comp) return null;
        const [a, b] = TIMELINE_16x9[id];
        // La carte de fin reste à l'écran pendant la sortie au noir (S15).
        const end = id === "S14" ? DURATION_16x9 : b + TAIL;
        return (
          <Sequence key={id} name={id} from={s(a, fps)} durationInFrames={s(end - a, fps)} premountFor={fps}>
            <SceneStartCtx.Provider value={a}>
              <Comp />
            </SceneStartCtx.Provider>
          </Sequence>
        );
      })}

      {/* Flash du temps fort avant le drop */}
      <Flash T={T} at={9.97} frames={3} fps={fps} />

      {/* S15 — sortie au noir 45,00 → 46,00 */}
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: prog(T, 45.0, 46.0, E.inQuad), pointerEvents: "none" }} />

      <Soundtrack cues={CUES_16x9} dropAt={10.0} fadeOut={[45.0, 46.0]} />

      {FLAGS.debugGrid ? <DebugOverlay T={T} timeline={TIMELINE_16x9} /> : null}
    </AbsoluteFill>
  );
};
