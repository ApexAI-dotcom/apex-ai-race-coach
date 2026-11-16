import React, { useMemo } from "react";
import { AbsoluteFill, Easing, Img, staticFile, useVideoConfig } from "remotion";
import { C, G, gradientText, BODY, DISPLAY } from "../theme";
import { E, kf, mix, prog, reveal, springAt, useT, wobble } from "../lib/anim";
import { CORNERS, LAP_T4, LAP_T9, LOSS, N, deltaAtIndex, posAt } from "../lib/track";
import { TrackMap } from "../components/TrackMap";
import { Camera3D } from "../components/Camera3D";
import { Words } from "../components/fx";
import { FLAGS } from "../config";

const DUEL_START = 4.1;
const DUEL_END = 6.1;
const duelEase = Easing.bezier(0.3, 0, 0.7, 1);

/** Temps de course τ (s) au temps d'écran T. */
const tauAt = (T: number) => LAP_T9 * duelEase(Math.max(0, Math.min(1, (T - DUEL_START) / (DUEL_END - DUEL_START))));

const ribbonEase = Easing.bezier(0.25, 0.7, 0.3, 1);

const fmtDelta = (v: number) => `+${Math.max(0, v).toFixed(2).replace(".", ",")} s`;

/** S02 — Le problème rendu visible · 3,00 → 7,75 : photo, carte, duel fantôme T4 / T9. */
export const S02Duel: React.FC = () => {
  const T = useT();
  const { fps } = useVideoConfig();

  // Instants de passage (calculés une fois) : marqueurs (T4) et segments perdus (T9).
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

  const tau = tauAt(T);
  const p4 = posAt(tau, 3, LAP_T4);
  const p9 = posAt(tau, 4, LAP_T9);
  const duelOn = T >= DUEL_START;

  const delta = duelOn ? deltaAtIndex(p9.fi, p9.done) : 0;
  const deltaPrev = duelOn ? deltaAtIndex(posAt(tauAt(T - 2 / fps), 4, LAP_T9).fi, false) : 0;
  const rising = delta > deltaPrev + 0.0005 && !p9.done;

  const markers = crossings.cornerT.map((t0) => (T >= t0 ? springAt(T, t0, fps, { damping: 11, stiffness: 220, mass: 0.6 }) : 0));
  const lossLit = crossings.lossT.map((t0) => prog(T, t0, t0 + 0.18, E.outExpo));
  const pulse = 1 + 0.6 * Math.sin(Math.PI * prog(T, 6.0, 6.3, E.linear));

  // Photo d'ouverture.
  const photoOn = FLAGS.useCircuitPhoto;
  const photoIn = prog(T, 3.0, 3.4, E.outExpo);
  const photoOut = prog(T, 3.9, 4.3, E.inOut);
  const photoGone = prog(T, 4.3, 4.6, E.linear);

  // Carte : entrée 3,90 (ou 3,00 sans photo), caméra 3D.
  const mapStart = photoOn ? 3.9 : 3.0;
  const mapIn = prog(T, mapStart - 0.03, mapStart + 0.4, E.outExpo);
  const lift = prog(T, 6.05, 6.4, E.ios);
  const exit = prog(T, 7.5, 7.75, E.inExpo);
  const rx = kf(T, [mapStart, 6.05], [56, 40], E.inOut) - 10 * lift + 12 * exit;
  const rz = kf(T, [mapStart, 7.5], [-10, -4], E.inOut);
  // Ouverture serrée sur la tête de tracé puis recul pour révéler le circuit entier.
  const pullBack = prog(T, mapStart, mapStart + 1.2, E.ios);
  const sc = mix(1.45, 0.96, pullBack) * mix(1, 1.08, prog(T, mapStart + 1.2, 6.05, E.inOut)) * mix(1, 0.94, lift);
  const camY = -40 - 60 * lift;
  const driftX = wobble("s02x", T) * 8;

  // HUD → titre (6,05 → 6,40).
  const hudIn = reveal(T, 4.2, { dur: 0.45, blur: 10, y: 10, scale: 1.02 });
  const toTitle = prog(T, 6.05, 6.4, E.ios);
  const hudX = mix(1630, 960, toTitle);
  const hudY = mix(160, 858, toTitle);
  const hudSize = mix(84, 150, toTitle);
  const finalGlow = prog(T, 6.3, 6.6, E.outExpo);

  return (
    <AbsoluteFill style={{ opacity: 1 - exit, filter: exit > 0.01 ? `blur(${(exit * 20).toFixed(2)}px)` : undefined }}>
      {photoOn && photoGone < 1 ? (
        <AbsoluteFill style={{ opacity: photoIn * mix(1, 0.12, photoOut) * (1 - photoGone), overflow: "hidden" }}>
          <Img
            src={staticFile("photo/circuit-adria-night.jpg")}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${kf(T, [3.0, 4.6], [1.08, 1.14], E.linear)}) translateX(${kf(T, [3.0, 4.6], [-14, 14], E.linear)}px)`,
              filter: `brightness(0.5) saturate(0.85) blur(${(mix(12, 0, prog(T, 3.0, 3.4, E.outExpo)) + photoOut * 20).toFixed(2)}px)`,
            }}
          />
          <AbsoluteFill style={{ background: "rgba(255,66,66,0.08)", mixBlendMode: "overlay" }} />
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 35%, rgba(0,0,0,0.75) 100%)" }} />
        </AbsoluteFill>
      ) : null}

      <Camera3D perspective={1350} rx={rx} rz={rz} scale={sc} x={driftX} y={camY} opacity={mapIn}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ filter: mapIn < 0.99 ? `blur(${((1 - mapIn) * 16).toFixed(2)}px)` : undefined }}>
            <TrackMap
              id="s02"
              size={860}
              ribbon={1}
              ribbonDraw={photoOn ? 1 : prog(T, 2.98, 3.95, ribbonEase)}
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
                      {
                        x: p4.x,
                        y: p4.y,
                        color: C.primary,
                        halo: p4.done ? 1 + 0.6 * Math.sin((T - DUEL_END) * 14) : 1,
                      },
                    ]
                  : []
              }
            />
          </div>
        </AbsoluteFill>
      </Camera3D>

      {/* Dégradé de lisibilité pour le titre */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, rgba(10,10,10,0) 55%, rgba(10,10,10,0.88) 100%)",
          opacity: lift,
        }}
      />

      {/* Label circuit */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 110,
          fontFamily: `'${BODY}', sans-serif`,
          fontWeight: 600,
          fontSize: 22,
          letterSpacing: "0.24em",
          color: C.muted,
          ...reveal(T, 4.15, { dur: 0.5, blur: 10, y: 10 }),
        }}
      >
        ADRIA KARTING RACEWAY
      </div>

      {/* Légende */}
      <div
        style={{
          position: "absolute",
          left: 120,
          bottom: 92,
          display: "flex",
          gap: 34,
          fontFamily: `'${BODY}', sans-serif`,
          fontWeight: 500,
          fontSize: 24,
          color: "rgba(250,250,250,0.85)",
          ...reveal(T, 4.3, { dur: 0.5, blur: 10, y: 10 }),
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 14, height: 14, borderRadius: 7, background: C.primary, boxShadow: "0 0 12px rgba(255,66,66,0.8)" }} />
          Tour 4 (meilleur)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 14, height: 14, borderRadius: 7, background: C.blue, boxShadow: "0 0 12px rgba(59,130,246,0.8)" }} />
          Tour 9
        </span>
      </div>

      {/* HUD écart, qui devient le titre */}
      {T >= 4.2 ? (
        <div
          style={{
            position: "absolute",
            left: hudX,
            top: hudY,
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <div style={hudIn}>
          <div
            style={{
              fontFamily: `'${BODY}', sans-serif`,
              fontWeight: 600,
              fontSize: 20,
              letterSpacing: "0.2em",
              color: C.muted,
              marginBottom: 6,
              opacity: 1 - toTitle,
              height: mix(26, 0, toTitle),
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
      <div style={{ position: "absolute", left: 0, right: 0, top: 942, display: "flex", justifyContent: "center" }}>
        <Words T={T} words="Sur un seul tour." start={6.1} stagger={0.08} size={46} weight={500} font="body" wordStyle={{ color: "rgba(250,250,250,0.85)" }} />
      </div>
    </AbsoluteFill>
  );
};
