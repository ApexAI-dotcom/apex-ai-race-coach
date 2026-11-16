import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";
import { FLAGS, s } from "../config";
import { DURATION_9x16, TAIL, TIMELINE_9x16, SceneId9 } from "../timeline";
import { E, SceneStartCtx, kf, prog } from "../lib/anim";
import { Atmosphere } from "../components/Atmosphere";
import { Flash } from "../components/fx";
import { DebugOverlay } from "../components/DebugOverlay";
import { V01Hook } from "../scenes916/V01Hook";
import { V02Duel } from "../scenes916/V02Duel";
import { V03Brand } from "../scenes916/V03Brand";
import { V04Import } from "../scenes916/V04Import";
import { V05Score } from "../scenes916/V05Score";
import { V06PerfectLap } from "../scenes916/V06PerfectLap";
import { V07Coaching } from "../scenes916/V07Coaching";
import { V08End } from "../scenes916/V08End";
import { Soundtrack } from "../audio/Soundtrack";
import { CUES_9x16 } from "../audio/cues";

const SCENES: Record<SceneId9, React.FC> = {
  V01: V01Hook,
  V02: V02Duel,
  V03: V03Brand,
  V04: V04Import,
  V05: V05Score,
  V06: V06PerfectLap,
  V07: V07Coaching,
  V08: V08End,
};

/** Intensité de l'atmosphère le long du 9:16. */
const atmosphere = (T: number) =>
  kf(
    T,
    [0, 0.1, 1.2, 2.5, 3.0, 5.2, 5.95, 5.999, 6.0, 8.5, 20.2, 20.5, 21.8, 22.0, 24.0],
    [0, 0, 0.35, 0.3, 0.2, 0.2, 0.7, 0.7, 0.45, 0.42, 0.42, 0.12, 0.2, 0.5, 0.5],
    E.inOut,
  );

export const Promo9x16: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = frame / fps;

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Atmosphere intensity={atmosphere(T)} base="#080808" />

      {(Object.keys(TIMELINE_9x16) as SceneId9[]).map((id) => {
        const Comp = SCENES[id];
        const [a, b] = TIMELINE_9x16[id];
        const end = Math.min(DURATION_9x16, b + TAIL);
        return (
          <Sequence key={id} name={id} from={s(a, fps)} durationInFrames={s(end - a, fps)} premountFor={fps}>
            <SceneStartCtx.Provider value={a}>
              <Comp />
            </SceneStartCtx.Provider>
          </Sequence>
        );
      })}

      {/* Flash du temps fort avant le drop (6,00) */}
      <Flash T={T} at={5.97} frames={3} fps={fps} />

      {/* Fondu au noir 23,60 → 24,00 */}
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: prog(T, 23.6, 24.0, E.inQuad), pointerEvents: "none" }} />

      <Soundtrack cues={CUES_9x16} dropAt={6.0} fadeOut={[23.6, 24.0]} />

      {FLAGS.debugGrid ? <DebugOverlay T={T} timeline={TIMELINE_9x16} /> : null}
    </AbsoluteFill>
  );
};
