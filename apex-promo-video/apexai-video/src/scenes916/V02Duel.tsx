import React, { useMemo } from "react";
import { AbsoluteFill, Easing, useVideoConfig } from "remotion";
import { C, G, gradientText, BODY, DISPLAY } from "../theme";
import { E, kf, mix, prog, reveal, springAt, useT, wobble } from "../lib/anim";
import { CORNERS, LAP_T4, LAP_T9, LOSS, N, deltaAtIndex, posAt } from "../lib/track";
import { TrackMap } from "../components/TrackMap";
import { Camera3D } from "../components/Camera3D";
import { Words } from "../components/fx";
import { DirBlur } from "../components/DirBlur";
import { MAP9, SAFE, SW, SX } from "./layout916";

const DUEL_START = 3.0;
const DUEL_END = 4.6;
const duelEase = Easing.bezier(0.3, 0, 0.7, 1);
const ribbonEase = Easing.bezier(0.25, 0.7, 0.3, 1);
const tauAt = (T: number) => LAP_T9 * duelEase(Math.max(0, Math.min(1, (T - DUEL_START) / (DUEL_END - DUEL_START))));
const fmtDelta = (v: number) => `+${Math.max(0, v).toFixed(2).replace(".", ",")} s`;

const MAP_CY = 820;

/** V02 — Duel fantôme · 2,50 → 6,00 : le circuit se trace, T4 contre T9, l'écart devient le titre. */
export const V02Duel: React.FC = () => {
  const T = useT();
  const { fps } = useVideoConfig();

  const crossings = useMemo(() => {
    const cornerT: number[] = CORNERS.map(() => Infinity);
    const lossT: number[] = LOSS.map(() => Infinity);
    for (let t = DUEL_START; t <= DUEL_END + 0.5; t += 1 / 480) {
      const tau = tauAt(t);
      const a = posAt(tau, 3, LAP_T4);
      const b = posAt(tau, 4, LAP_T9);
      CORNERS.forEach((c, k) => {
        if (cornerT[k] === Infinity && (a.fi >= c.i || a.done)) cornerT[k] = t;
      });
      LOSS.forEach(([s], k) => {
        if (lossT[k] === Infinity && (b.fi >= s || b.done)) lossT[k] = t;
      });
    }
    return { cornerT, lossT };
  }, []);
  if (T >= 6.05) return null;

  const tau = tauAt(T);
  const p4 = posAt(tau, 3, LAP_T4);
  const p9 = posAt(tau, 4, LAP_T9);
  const duelOn = T >= DUEL_START;
  const delta = duelOn ? deltaAtIndex(p9.fi, p9.done) : 0;
  const deltaPrev = duelOn ? deltaAtIndex(posAt(tauAt(T - 2 / fps), 4, LAP_T9).fi, false) : 0;
  const rising = delta > deltaPrev + 0.0005 && !p9.done;

  const markers = crossings.cornerT.map((t0) => (T >= t0 ? springAt(T, t0, fps, { damping: 11, stiffness: 220, mass: 0.6 }) : 0));
  const lossLit = crossings.lossT.map((t0) => prog(T, t0, t0 + 0.18, E.outExpo));
  const pulse = 1 + 0.6 * Math.sin(Math.PI * prog(T, 4.5, 4.8, E.linear));

  // Arrivée par le bas (même vecteur que le whip de V01).
  const enter = prog(T, 2.5, 2.85, E.outExpo);
  const enterY = (1 - enter) * 900;
  const enterBlur = (1 - prog(T, 2.5, 2.75, E.outExpo)) * 40;

  // Caméra : ouverture serrée sur la tête de tracé, recul, puis la carte remonte pour laisser la place au titre.
  const mapIn = prog(T, 2.47, 2.9, E.outExpo);
  const lift = prog(T, 4.55, 4.95, E.ios);
  const pullBack = prog(T, 2.5, 3.4, E.ios);
  const rx = kf(T, [2.5, 4.55], [44, 30], E.inOut) - 6 * lift;
  const rz = kf(T, [2.5, 5.8], [-8, -3], E.inOut);
  const sc = mix(1.35, 0.98, pullBack) * mix(1, 1.05, prog(T, 3.4, 4.55, E.inOut)) * mix(1, 0.9, lift);
  const camY = -150 * lift;
  const driftX = wobble("v02x", T) * 6;
  const driftY = wobble("v02y", T) * 6;

  // Tension puis effondrement avant le drop (5,80 → 6,00).
  const tension = prog(T, 5.2, 5.8, E.inExpo);
  const collapse = prog(T, 5.8, 6.0, E.inExpo);
  const groupScale = mix(1, 1.05, tension) * mix(1, 0.85, collapse);

  // HUD (en haut) qui devient le titre (en bas) à 4,55.
  const hudIn = reveal(T, 3.05, { dur: 0.45, blur: 10, y: 10, scale: 1.02 });
  const toTitle = prog(T, 4.55, 4.95, E.ios);
  const hudY = mix(404, 1288, toTitle);
  const hudSize = mix(96, 170, toTitle);
  const finalGlow = prog(T, 4.85, 5.15, E.outExpo);

  return (
    <AbsoluteFill
      style={{
        opacity: 1 - collapse,
        filter: collapse > 0.01 ? `blur(${(collapse * 30).toFixed(2)}px)` : undefined,
        transform: `scale(${groupScale})`,
        transformOrigin: `${SX}px 900px`,
      }}
    >
      <DirBlur id="v02v" x={0} y={enterBlur} />
      <AbsoluteFill style={{ transform: `translateY(${enterY}px)`, filter: enterBlur > 0.3 ? "url(#v02v)" : undefined }}>
        <Camera3D perspective={1500} rx={rx} rz={rz} scale={sc} x={driftX} y={camY + driftY} origin={`${SX}px ${MAP_CY}px`} opacity={mapIn}>
          <div
            style={{
              position: "absolute",
              left: SX - MAP9 / 2,
              top: MAP_CY - MAP9 / 2,
              filter: mapIn < 0.99 ? `blur(${((1 - mapIn) * 16).toFixed(2)}px)` : undefined,
            }}
          >
            <TrackMap
              id="v02"
              size={MAP9}
              ribbon={1}
              ribbonDraw={prog(T, 2.48, 3.3, ribbonEase)}
              grid={mapIn}
              whiteTrace={duelOn ? Math.min(1, p4.fi / N) : 0}
              whiteHead={duelOn && !p4.done}
              lossLit={lossLit}
              lossPulse={pulse}
              markers={markers}
              startFinish={mapIn}
              dots={
                duelOn
                  ? [
                      { x: p9.x, y: p9.y, color: C.blue, halo: 1 },
                      { x: p4.x, y: p4.y, color: C.primary, halo: p4.done ? 1 + 0.6 * Math.sin((T - DUEL_END) * 14) : 1 },
                    ]
                  : []
              }
            />
          </div>
        </Camera3D>
      </AbsoluteFill>

      {/* Dégradé de lisibilité pour le titre */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,10,10,0) 52%, rgba(10,10,10,0.9) 78%, rgba(10,10,10,0.9) 100%)", opacity: lift }} />

      {/* Label circuit */}
      <div
        style={{
          position: "absolute",
          left: SAFE.x0,
          width: SW,
          top: 292,
          textAlign: "center",
          fontFamily: `'${BODY}', sans-serif`,
          fontWeight: 600,
          fontSize: 26,
          letterSpacing: "0.24em",
          color: C.muted,
          ...reveal(T, 2.95, { dur: 0.5, blur: 10, y: 10 }),
        }}
      >
        ADRIA KARTING RACEWAY
      </div>

      {/* Légende (laisse la place au titre) */}
      <div
        style={{
          position: "absolute",
          left: SAFE.x0,
          width: SW,
          top: 1400,
          display: "flex",
          justifyContent: "center",
          gap: 40,
          fontFamily: `'${BODY}', sans-serif`,
          fontWeight: 500,
          fontSize: 32,
          color: "rgba(250,250,250,0.85)",
          ...reveal(T, 3.15, { dur: 0.5, blur: 10, y: 10 }, 4.4, { dur: 0.25, blur: 12, y: 10 }),
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 18, height: 18, borderRadius: 9, background: C.primary, boxShadow: "0 0 12px rgba(255,66,66,0.8)" }} />
          Tour 4 (meilleur)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 18, height: 18, borderRadius: 9, background: C.blue, boxShadow: "0 0 12px rgba(59,130,246,0.8)" }} />
          Tour 9
        </span>
      </div>

      {/* HUD écart → titre */}
      {T >= 3.05 ? (
        <div style={{ position: "absolute", left: SX, top: hudY, transform: "translate(-50%, -50%)", textAlign: "center" }}>
          <div style={hudIn}>
            <div
              style={{
                fontFamily: `'${BODY}', sans-serif`,
                fontWeight: 600,
                fontSize: 26,
                letterSpacing: "0.2em",
                color: C.muted,
                marginBottom: 6,
                opacity: 1 - toTitle,
                height: mix(34, 0, toTitle),
                overflow: "hidden",
              }}
            >
              ÉCART T9 / T4
            </div>
            <div
              style={{
                fontFamily: `'${DISPLAY}', sans-serif`,
                fontWeight: 700,
                fontSize: hudSize,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
                ...(toTitle > 0
                  ? gradientText(G.textPrimary)
                  : { color: rising ? C.primary : C.text, textShadow: rising ? "0 0 24px rgba(255,66,66,0.6)" : undefined }),
                filter: finalGlow > 0 ? `drop-shadow(0 0 ${(28 * finalGlow).toFixed(1)}px rgba(255,66,66,${(0.45 * finalGlow).toFixed(2)}))` : undefined,
              }}
            >
              {fmtDelta(delta)}
            </div>
          </div>
        </div>
      ) : null}

      {/* Sous-ligne */}
      <div style={{ position: "absolute", left: SAFE.x0, width: SW, top: 1392, display: "flex", justifyContent: "center" }}>
        <Words T={T} words="Sur un seul tour." start={4.6} stagger={0.08} size={48} weight={500} font="body" wordStyle={{ color: "rgba(250,250,250,0.85)" }} />
      </div>
    </AbsoluteFill>
  );
};
