import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { Zap } from "lucide-react";
import { C, FONT, GRAD, alpha } from "../kit/tokens";
import { fr } from "../kit/text";
import { Lockup } from "../kit/elements";
import { RedPanel, SocialBackground } from "../kit/Background";
import { Atmosphere } from "../../components/Atmosphere";
import { LogoIcon } from "../../components/Logo";
import { DecodeText } from "../../components/fx";
import { E, SceneStartCtx, kf, mix, prog, reveal, springAt, wobble } from "../../lib/anim";
import { s } from "../../config";
import { gradientText } from "../../theme";
import { V03Brand } from "../../scenes916/V03Brand";
import { V04Import } from "../../scenes916/V04Import";
import { V05Score } from "../../scenes916/V05Score";
import { Promo9x16 } from "../../compositions/Promo9x16";
import { EndCard, KLine, useTime, ZONE } from "./common";

/* ───────────────────────── S1 — révélation du logo, « Nouveau sur Instagram. » (6 s) ───────────────────────── */

export const S1_DURATION = 6;

export const StoryS1: React.FC = () => {
  const T = useTime();
  const { fps } = useVideoConfig();
  const panel = prog(T, 1.95, 2.2, E.inOut);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Atmosphere intensity={0.45} base={C.bg} />
      {/* La révélation du logo du film (V03), de 6,00 à 8,10 */}
      <Sequence from={0} durationInFrames={s(2.3, fps)}>
        <SceneStartCtx.Provider value={6.0}>
          <V03Brand />
        </SceneStartCtx.Provider>
      </Sequence>
      {panel > 0 ? (
        <AbsoluteFill style={{ opacity: panel }}>
          <RedPanel width={1080} height={1920} glow={{ x: 0.4 + wobble("s1g", T) * 0.05, y: 0.35 }} />
          <div style={{ position: "absolute", left: 96, width: 900, top: 620 }}>
            <KLine T={T} text="Nouveau" start={2.2} size={124} align="left" />
            <KLine T={T} text="sur Instagram." start={2.4} size={124} align="left" />
          </div>
          <div style={{ position: "absolute", left: 96, top: 960, ...reveal(T, 3.0, { dur: 0.5, blur: 12, y: 16 }) }}>
            <Lockup height={72} variant="mono-white" />
          </div>
          <div style={{ position: "absolute", left: 96, top: 1080, fontFamily: FONT.body, fontWeight: 600, fontSize: 46, color: C.text, ...reveal(T, 3.25, { dur: 0.5, blur: 10, y: 12 }) }}>
            @apexai.racing
          </div>
          <div style={{ position: "absolute", left: 96, top: 1150, fontFamily: FONT.body, fontWeight: 500, fontSize: 40, color: alpha(C.text, 0.85), ...reveal(T, 3.45, { dur: 0.5, blur: 10, y: 12 }) }}>
            {fr("Ton ingénieur de course IA.")}
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

/* ───────────────────────── S3 — import, analyse, score (8,5 s) ───────────────────────── */

export const S3_DURATION = 8.5;

export const StoryS3: React.FC = () => {
  const T = useTime();
  const { fps } = useVideoConfig();
  const filmIn = prog(T, 1.25, 1.6, E.outExpo);
  const filmOut = prog(T, 6.45, 6.8, E.inExpo);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Atmosphere intensity={kf(T, [0, 1.3, 6.8, 8.5], [0.4, 0.3, 0.42, 0.42])} base={C.bg} />
      {T < 1.5 ? (
        <div style={{ position: "absolute", left: 80, width: 860, top: 760 }}>
          <KLine T={T} text="De ton CSV" start={0} size={128} noIn out={1.15} />
          <KLine T={T} text="*à ton score.*" start={0.2} size={128} out={1.15} sweep />
        </div>
      ) : null}
      <AbsoluteFill style={{ opacity: filmIn * (1 - filmOut), filter: filmIn < 0.99 || filmOut > 0.01 ? `blur(${(((1 - filmIn) + filmOut) * 16).toFixed(1)}px)` : undefined }}>
        {/* film 9:16 : V04 (8,50 → 11,50) puis V05 (11,50 → 14,00) */}
        <Sequence from={s(1.3, fps)} durationInFrames={s(3.3, fps)}>
          <SceneStartCtx.Provider value={8.5}>
            <V04Import />
          </SceneStartCtx.Provider>
        </Sequence>
        <Sequence from={s(4.3, fps)} durationInFrames={s(2.6, fps)}>
          <SceneStartCtx.Provider value={11.5}>
            <V05Score />
          </SceneStartCtx.Provider>
        </Sequence>
      </AbsoluteFill>
      <EndCard T={T} start={6.75} headline="Teste sur ta *dernière session*." zone={ZONE.story} cursor={false} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── Logo sting (2,5 s) en 9:16 ou 1:1 ───────────────────────── */

export const LogoSting: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const T = useTime();
  const { fps } = useVideoConfig();
  const ICON = 132;
  const GAP = 32;
  const WORD = 148;
  const cx = width / 2;
  const cy = height / 2 - (height > width ? 40 : 20);
  const lockW = ICON + GAP + WORD * 3.3;
  const left = cx - lockW / 2;
  const iconSp = springAt(T, 0.0, fps, { damping: 12, stiffness: 190, mass: 0.6 });
  const boltDraw = prog(T, 0.03, 0.2, E.inOut);
  const boltFill = prog(T, 0.2, 0.3, E.outExpo);
  const lines = prog(T, 0.0, 0.35, E.outExpo);
  const linesOut = prog(T, 1.2, 1.6, E.inOut);
  const handles = springAt(T, 0.12, fps, { damping: 13, stiffness: 200, mass: 0.6 }) * (1 - linesOut);
  const sheen = prog(T, 0.85, 1.3, E.inOut);
  const M = 34;
  const top = cy - ICON / 2;
  const bottom = cy + ICON / 2;
  const right = left + lockW;
  const dash = (v: boolean): React.CSSProperties => ({ position: "absolute", backgroundImage: `repeating-linear-gradient(${v ? 180 : 90}deg, ${alpha(C.text, 0.18)} 0 5px, transparent 5px 10px)` });
  const sx = mix(-0.35, 3.75, sheen);
  const band = (w: number, off: number) => ({ c: ((sx - off) / w) * 100, h: (0.32 / w) * 100 });
  const a = band(2.45, 0);
  const b = band(0.95, 2.45);
  const on = sheen > 0 && sheen < 1;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <SocialBackground width={width} height={height} preset="corners" intensity={0.8} vignette={0.5} />
      <AbsoluteFill style={{ transform: `scale(${kf(T, [0, 2.5], [1, 1.04], E.inOut)})`, transformOrigin: `${cx}px ${cy}px` }}>
        <AbsoluteFill style={{ opacity: 1 - linesOut }}>
          {[top - M, bottom + M].map((y, i) => (
            <div key={`h${i}`} style={{ ...dash(false), left: 0, top: y, width, height: 2, transform: `scaleX(${lines})`, transformOrigin: `${cx}px 0` }} />
          ))}
          {[left - M, right + M].map((x, i) => (
            <div key={`v${i}`} style={{ ...dash(true), left: x, top: 0, width: 2, height, transform: `scaleY(${lines})`, transformOrigin: `0 ${cy}px` }} />
          ))}
          {[
            [left - M, top - M],
            [right + M, top - M],
            [left - M, bottom + M],
            [right + M, bottom + M],
          ].map(([x, y], i) => (
            <div key={`hd${i}`} style={{ position: "absolute", left: x - 5, top: y - 5, width: 11, height: 11, background: alpha(C.text, 0.65), transform: `scale(${handles})` }} />
          ))}
        </AbsoluteFill>
        <div style={{ position: "absolute", left, top, display: "flex", alignItems: "center", gap: GAP }}>
          <div style={{ transform: `scale(${iconSp}) rotate(${mix(-14, 0, Math.min(1, iconSp))}deg)`, transformOrigin: "30% 70%" }}>
            <LogoIcon size={ICON} draw={boltDraw} fill={boltFill} />
          </div>
          <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: WORD, letterSpacing: "-0.02em", lineHeight: 1, display: "inline-flex", alignItems: "baseline", fontKerning: "none" }}>
            {T < 0.6
              ? Array.from("APEX").map((ch, i) => {
                  const p = prog(T, 0.1 + i * 0.035, 0.5 + i * 0.035, E.outExpo);
                  return (
                    <span key={i} style={{ display: "inline-block", overflow: "hidden", padding: "0.06em 0", margin: "-0.06em 0" }}>
                      <span style={{ display: "inline-block", color: C.text, transform: `translateY(${((1 - p) * 0.9).toFixed(3)}em)` }}>{ch}</span>
                    </span>
                  );
                })
              : <span style={on ? gradientText(`linear-gradient(100deg, ${C.text} 0%, ${C.text} ${a.c - a.h}%, ${C.orange} ${a.c}%, ${C.text} ${a.c + a.h}%, ${C.text} 100%)`) : { color: C.text }}>APEX</span>}
            {T < 0.6 ? (
              <DecodeText T={T} text="AI" start={0.22} stagger={0.05} scramble={0.12} size={WORD} final="gradient" seed="sting" tracking="-0.02em" style={{ fontKerning: "none" }} />
            ) : (
              <span style={on ? gradientText(`linear-gradient(100deg, ${C.primary} 0%, ${C.primary} ${b.c - b.h}%, ${C.text} ${b.c}%, ${C.orange} ${b.c + b.h}%, ${C.orange} 100%)`) : gradientText(GRAD.keyword)}>AI</span>
            )}
          </span>
        </div>
        <div style={{ position: "absolute", left: 0, width, top: bottom + M + 60, display: "flex", justifyContent: "center", ...reveal(T, 1.35, { dur: 0.5, blur: 12, y: 14 }) }}>
          <span style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 26px", borderRadius: 999, background: alpha(C.primary, 0.1), border: `2px solid ${alpha(C.primary, 0.3)}`, color: C.primary, fontFamily: FONT.body, fontWeight: 500, fontSize: 34 }}>
            <Zap size={30} color={C.primary} strokeWidth={2.2} />
            {fr("Ton ingénieur de course IA")}
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────────────────────── Pub — G1 recoupé (≈ 14,5 s), dans les zones sûres publicitaires ───────────────────────── */

/** Segments du film 9:16 : [début dans le film, fin dans le film]. */
export const PUB_SEGMENTS: Array<[number, number]> = [
  [0.0, 8.0],
  [11.6, 13.6],
  [14.05, 17.6],
  [22.0, 24.0],
];
const XF = 0.3; // fondu enchaîné entre segments
export const PUB_OUT = (() => {
  const out: Array<{ a: number; b: number; start: number }> = [];
  let t = 0;
  PUB_SEGMENTS.forEach(([a, b], i) => {
    out.push({ a, b, start: t });
    t += b - a - (i < PUB_SEGMENTS.length - 1 ? XF : 0);
  });
  return out;
})();
export const PUB_DURATION = PUB_OUT[PUB_OUT.length - 1].start + (PUB_SEGMENTS[PUB_SEGMENTS.length - 1][1] - PUB_SEGMENTS[PUB_SEGMENTS.length - 1][0]);

export const PubG1: React.FC = () => {
  const T = useTime();
  const { fps } = useVideoConfig();
  // Le film (zone sûre y 260 → 1480) est réduit à 80 % et recentré dans la zone pub (y 270 → 1248).
  const K = 0.8;
  const dx = 540 - 510 * K;
  const dy = 759 - 870 * K;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Atmosphere intensity={0.3} base={C.bg} />
      <AbsoluteFill
        style={{
          transform: `translate(${dx}px, ${dy}px) scale(${K})`,
          transformOrigin: "0 0",
          WebkitMaskImage: "linear-gradient(180deg, transparent 0%, black 9%, black 91%, transparent 100%), linear-gradient(90deg, transparent 0%, black 7%, black 93%, transparent 100%)",
          WebkitMaskComposite: "source-in",
          maskImage: "linear-gradient(180deg, transparent 0%, black 9%, black 91%, transparent 100%), linear-gradient(90deg, transparent 0%, black 7%, black 93%, transparent 100%)",
          maskComposite: "intersect",
        }}
      >
        {PUB_OUT.map((seg, i) => {
          const len = seg.b - seg.a;
          const fadeIn = i === 0 ? 1 : prog(T, seg.start, seg.start + XF, E.inOut);
          const fadeOut = i === PUB_OUT.length - 1 ? 0 : prog(T, seg.start + len - XF, seg.start + len, E.inOut);
          const from = s(seg.start - seg.a, fps);
          return (
            <Sequence key={i} from={from} durationInFrames={s(seg.start + len - (seg.start - seg.a), fps)}>
              <AbsoluteFill style={{ opacity: fadeIn * (1 - fadeOut) }}>{T >= seg.start - 0.01 && T < seg.start + len + 0.01 ? <Promo9x16 /> : null}</AbsoluteFill>
            </Sequence>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
