import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../theme";
import { E, kf, mix, prog, useT, wobble } from "../lib/anim";
import { N, PTS } from "../lib/track";
import { Camera3D } from "../components/Camera3D";
import { Cursor, bezier } from "../components/Cursor";
import { Ripple, ScanLine, Words } from "../components/fx";
import { DirBlur } from "../components/DirBlur";
import { TrackMap } from "../components/TrackMap";
import { AnalyzeButton, AnalyzingCard, DropZone, FileVignette, SessionInfo } from "../ui/UploadUI";
import { SAFE, SW, SX, V04_CARD } from "./layout916";

const K = V04_CARD.k;
const PAD = 24 * K;
const DZ_H = 190 * K;
const GAP1 = 16 * K;
const SI_H = 196 * K;
const GAP2 = 18 * K;
const BTN_ROW = 50 * K;
const H_FULL = PAD * 2 + DZ_H + GAP1 + SI_H + GAP2 + BTN_ROW;

const STEP_T = [10.1, 10.3, 10.5, 10.7, 10.9];

/** V04 — Import + analyse · 8,50 → 11,50. */
export const V04Import: React.FC = () => {
  const T = useT();
  if (T >= 11.55) return null;

  const cx = V04_CARD.x + V04_CARD.w / 2;
  const dzCenterY = V04_CARD.y + PAD + DZ_H / 2;
  const btnY = V04_CARD.y + PAD + DZ_H + GAP1 + SI_H + GAP2 + BTN_ROW / 2;

  /* ── Import 8,50 → 10,05 ── */
  const uiIn = prog(T, 8.5, 8.8, E.outExpo);
  const ry = kf(T, [8.5, 9.2, 10.0], [0, -7, -5], E.inOut);
  const rx = kf(T, [8.5, 9.2, 10.0], [0, 7, 5], E.inOut);
  const dive = prog(T, 9.95, 10.12, E.inExpo);
  const driftX = wobble("v04x", T) * 4;

  const drag = prog(T, 8.6, 9.4, E.inOut);
  const [mx, my] = bezier(drag, [1060, 1720], [900, 1150], [cx + 30, dzCenterY + 20]);
  const hover = prog(T, 9.1, 9.22, E.outExpo) * (1 - prog(T, 9.5, 9.65, E.linear));
  const dropped = prog(T, 9.4, 9.55, E.inExpo);
  const selected = prog(T, 9.5, 9.75, E.outExpo);
  const expand = prog(T, 9.5, 9.82, E.ios);
  const pops = Array.from({ length: 7 }, (_, i) => {
    const p = prog(T, 9.62 + i * 0.03, 9.62 + i * 0.03 + 0.25, E.outExpo);
    return p < 1 ? mix(0.6, 1.0, p) + Math.sin(p * Math.PI) * 0.06 : 1;
  });
  const toBtn = prog(T, 9.66, 9.88, E.inOut);
  const restX = cx + 90;
  const restY = dzCenterY + 150;
  const [bx, by] = bezier(toBtn, [restX, restY], [cx + 220, btnY - 80], [cx + 30, btnY + 8]);
  const afterDrop = prog(T, 9.42, 9.7, E.outExpo);
  const curX = T < 9.4 ? mx : T < 9.66 ? mix(cx + 30, restX, afterDrop) : bx;
  const curY = T < 9.4 ? my : T < 9.66 ? mix(dzCenterY + 20, restY, afterDrop) : by;
  const press = Math.sin(Math.PI * prog(T, 9.9, 10.02, E.linear));
  const btnGlow = prog(T, 9.8, 9.9, E.outExpo);
  const cardH = mix(V04_CARD.hEmpty, H_FULL, expand);
  const importOut = prog(T, 10.0, 10.14, E.inExpo);

  /* ── Analyse 10,05 → 11,50 ── */
  const enter = prog(T, 10.05, 10.4, E.outExpo);
  const progress = kf(T, [10.1, 10.35, 10.6, 10.8, 10.98, 11.1], [0, 0.22, 0.45, 0.65, 0.88, 1], E.inOut);
  const spin = (T - 10.0) * 420;
  let step = 0;
  for (let i = 0; i < STEP_T.length; i++) if (T >= STEP_T[i]) step = i;
  const stepBlend = prog(T, STEP_T[step], STEP_T[step] + 0.1, E.def);
  const done = prog(T, 11.1, 11.25, E.outExpo);
  const check = prog(T, 11.16, 11.32, E.outExpo);
  const burst = prog(T, 11.12, 11.45, E.outExpo);
  const loop = ((((T - 10.0) / 0.8) % 1) + 1) % 1;
  const particles = Array.from({ length: 22 }, (_, i) => {
    const fi = (((i * (N / 22) + (T - 10.0) * 260) % N) + N) % N;
    const p = PTS[Math.floor(fi)];
    return { x: p[0], y: p[1], color: C.primary, halo: 0.6, r: 4 };
  });

  // Whip vers le haut 11,30 → 11,50 (V05 arrive par le bas).
  const whip = prog(T, 11.3, 11.5, E.inExpo);
  const wBlur = Math.sin(Math.PI * Math.min(1, whip * 1.2)) * 40;

  return (
    <AbsoluteFill>
      <DirBlur id="v04v" x={0} y={wBlur} />
      <AbsoluteFill style={{ transform: `translateY(${-1600 * whip}px)`, filter: wBlur > 0.3 ? "url(#v04v)" : undefined }}>
        {/* Titres (y ≈ 290) */}
        <div style={{ position: "absolute", left: SAFE.x0, width: SW, top: 286, display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
          {T < 10.3 ? (
            <>
              <Words T={T} words="Importe" start={8.55} size={100} outStart={9.95} outOpts={{ dur: 0.2, blur: 14 }} />
              <Words T={T} words={[{ t: "ta" }, { t: "session.", kind: "gradient" }]} start={8.7} size={100} outStart={9.97} outOpts={{ dur: 0.2, blur: 14 }} />
              <div style={{ height: 14 }} />
              <Words
                T={T}
                words="Ton export CSV suffit."
                start={8.95}
                stagger={0.05}
                size={40}
                weight={500}
                font="body"
                wordStyle={{ color: C.muted }}
                outStart={9.99}
                outOpts={{ dur: 0.2, blur: 12 }}
              />
            </>
          ) : null}
        </div>
        {T >= 10.0 ? (
          <div style={{ position: "absolute", left: SAFE.x0, width: SW, top: 286, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Words T={T} words={[{ t: "L'IA" }, { t: "analyse" }]} start={10.05} stagger={0.08} size={100} />
            <Words T={T} words={[{ t: "chaque", kind: "gradient" }, { t: "virage.", kind: "gradient" }]} start={10.2} stagger={0.08} size={100} sweep={{ start: 10.22, dur: 0.8 }} />
          </div>
        ) : null}

        {/* Carte d'import */}
        {T < 10.16 ? (
          <AbsoluteFill style={{ opacity: 1 - importOut }}>
            <Camera3D perspective={1700} rx={rx} ry={ry} x={driftX} scale={mix(1, 1.7, dive)} origin={`${cx}px ${btnY}px`} blur={dive * 16}>
              <div
                style={{
                  position: "absolute",
                  left: V04_CARD.x,
                  top: V04_CARD.y,
                  width: V04_CARD.w,
                  height: cardH,
                  borderRadius: 18 * K,
                  background: "#121212",
                  border: "1.4px solid #262626",
                  boxSizing: "border-box",
                  overflow: "hidden",
                  boxShadow: "0 40px 90px -30px rgba(0,0,0,0.85)",
                }}
              >
                <div style={{ position: "absolute", left: PAD, right: PAD, top: PAD, opacity: uiIn }}>
                  <DropZone k={K} hover={hover} selected={selected} />
                </div>
                <div style={{ position: "absolute", left: PAD, right: PAD, top: PAD + DZ_H + GAP1, height: SI_H, opacity: expand, transform: `translateY(${(1 - expand) * 30}px)` }}>
                  <SessionInfo k={K} pops={pops} style={{ height: SI_H }} />
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: PAD + DZ_H + GAP1 + SI_H + GAP2,
                    height: BTN_ROW,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: expand,
                  }}
                >
                  <AnalyzeButton k={K} press={press} glow={btnGlow} />
                </div>
              </div>
              <Ripple T={T} start={9.42} x={cx} y={dzCenterY} size={140} />
              <Ripple T={T} start={9.92} x={cx + 30} y={btnY} size={110} />
              {T >= 8.6 && dropped < 1 ? (
                <div
                  style={{
                    position: "absolute",
                    left: mx - 150,
                    top: my - 36,
                    transform: `rotate(${mix(-6, 0, drag)}deg) scale(${mix(1.04, 0.5, dropped)})`,
                    transformOrigin: "150px 36px",
                    opacity: 1 - dropped,
                  }}
                >
                  <FileVignette k={1.05} />
                </div>
              ) : null}
              {T >= 8.6 ? <Cursor x={curX} y={curY} press={press} opacity={prog(T, 8.6, 8.72, E.outExpo)} /> : null}
            </Camera3D>
          </AbsoluteFill>
        ) : null}

        {/* Analyse */}
        {T >= 10.05 ? (
          <>
            <AbsoluteFill style={{ opacity: 0.16 * enter }}>
              <div style={{ position: "absolute", left: SX - 470, top: 960 - 470, transform: `translate(${driftX * 2}px, 0) rotate(-6deg)` }}>
                <TrackMap id="v04" size={940} ribbon={0.5} whiteTrace={loop} whiteHead dots={particles} />
              </div>
            </AbsoluteFill>
            <div
              style={{
                position: "absolute",
                left: SAFE.x0,
                width: SW,
                top: 700,
                display: "flex",
                justifyContent: "center",
                opacity: enter,
                transform: `translate(${driftX}px, 0) scale(${mix(1.15, 1, enter)})`,
                filter: enter < 0.99 ? `blur(${((1 - enter) * 16).toFixed(2)}px)` : undefined,
              }}
            >
              <AnalyzingCard k={1.6} width={SW} progress={progress} spin={spin} step={step} stepBlend={stepBlend} done={done} check={check} burst={burst}>
                <ScanLine T={T} start={10.2} dur={0.6} />
                <ScanLine T={T} start={10.75} dur={0.6} />
              </AnalyzingCard>
            </div>
          </>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
