import React, { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { z } from "zod";
import { C, FONT, INK } from "../kit/tokens";
import { SectorBar } from "../kit/elements";
import { Atmosphere } from "../../components/Atmosphere";
import { Camera3D } from "../../components/Camera3D";
import { TrackMap } from "../../components/TrackMap";
import { PerfectLapBanner } from "../../ui/AppUI";
import { CORNERS, N } from "../../lib/track";
import { E, kf, mix, prog, reveal, springAt, wobble } from "../../lib/anim";
import { DecodeNumber, DemoBadge, EndCard, KLine, SafeMode, useTime, ZONE } from "./common";

export const G4_DURATION = 14;
export const g4Schema = z.object({ safe: z.enum(["reel", "ad"]) });

/** Inverse de la courbe inOut (instants où la tête de tracé passe chaque virage). */
const invInOut = (y: number) => {
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 30; k++) {
    const m = (lo + hi) / 2;
    if (E.inOut(m) < y) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};

/**
 * G4 — « Ton meilleur tour n'est pas ton meilleur tour. » (~14 s, 1080 × 1920)
 * 0,0 accroche lisible dès l'image 0 · 1,2 tracé réel coloré par la vitesse · 3,6 mini-secteurs et ligne Tour IA
 * 6,6 −1,23 s · 8,6 « Tu l'as déjà roulé. » · 11,0 carte de fin · 13,0 raccord de boucle.
 */
export const G4TourParfait: React.FC<{ safe: SafeMode }> = ({ safe }) => {
  const T = useTime();
  const { fps } = useVideoConfig();
  const Z = ZONE[safe];
  const ad = safe === "ad";
  const MAP = ad ? 620 : 860;
  const MAP_CY = ad ? 760 : 860;
  const titleTop = ad ? Z.y0 + 40 : 400;

  const draw = prog(T, 1.45, 3.45, E.inOut);
  const ribbon = prog(T, 1.25, 1.75, E.outExpo);
  const gold = prog(T, 3.8, 5.6, E.inOut);
  const shimmer = prog(T, 4.0, 5.9, E.inOut);
  const cornerT = useMemo(() => CORNERS.map((c) => 1.45 + 2.0 * invInOut(c.i / N)), []);
  const markers = cornerT.map((t0) => (T >= t0 ? springAt(T, t0, fps, { damping: 11, stiffness: 220, mass: 0.6 }) : 0));
  const dim = prog(T, 6.45, 6.9, E.inOut) * (1 - prog(T, 10.6, 11.0, E.inOut));
  const mapOut = prog(T, 10.7, 11.1, E.inExpo);
  const mapIn = prog(T, 1.2, 1.7, E.outExpo);
  const rx = kf(T, [1.2, 11], [32, 22], E.inOut);
  const rz = kf(T, [1.2, 11], [-6, 1], E.inOut);

  // bandeau Tour Parfait IA
  const items = [prog(T, 1.5, 1.95, E.outExpo), prog(T, 1.6, 2.05, E.outExpo), prog(T, 4.2, 4.65, E.outExpo), prog(T, 6.55, 7.0, E.outExpo), 0];
  const bannerOut = prog(T, 10.6, 10.95, E.inExpo);
  const gain = 1.23 * prog(T, 6.55, 6.95, E.outExpo);

  // mini-secteurs : s'allument en or l'un après l'autre (illustration du principe)
  const sectors = Array.from({ length: 12 }, (_, i) => (T >= 3.75 + i * 0.15 ? ("gold" as const) : ("off" as const)));

  // titre : visible dès l'image 0, sort à 1,25 ; revient à 13,3 pour la boucle
  const titleOut = prog(T, 1.2, 1.5, E.inExpo);
  const loopIn = prog(T, 13.3, 13.85, E.outExpo);
  const showTitle = T < 1.55 || T >= 13.3;
  const titleVis = T < 1.55 ? 1 - titleOut : loopIn;

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Atmosphere intensity={kf(T, [0, 1.2, 6.5, 11, 13, 14], [0.32, 0.3, 0.22, 0.45, 0.4, 0.32])} base={C.bg} />

      {/* Carte du circuit */}
      <AbsoluteFill style={{ opacity: mapIn * (1 - mapOut), filter: dim > 0.01 ? `blur(${(dim * 7).toFixed(2)}px) brightness(${mix(1, 0.38, dim).toFixed(3)})` : undefined }}>
        <Camera3D perspective={1450} rx={rx} rz={rz} x={wobble("g4x", T) * 6} y={wobble("g4y", T) * 5} scale={mix(1.12, 1, mapIn)} origin={`${Z.cx}px ${MAP_CY}px`}>
          <div style={{ position: "absolute", left: Z.cx - MAP / 2, top: MAP_CY - MAP / 2 }}>
            <TrackMap id="g4" size={MAP} ribbon={ribbon} speedLine={draw} speedHead goldLine={gold} goldShimmer={shimmer} markers={markers} startFinish={ribbon} grid={ribbon * 0.8} />
          </div>
        </Camera3D>
      </AbsoluteFill>

      {/* Bandeau doré */}
      <div style={{ position: "absolute", left: Z.x0, top: ad ? Z.y0 : 282, opacity: 1 - bannerOut, filter: bannerOut > 0.01 ? `blur(${(bannerOut * 14).toFixed(2)}px)` : undefined }}>
        {T >= 1.45 ? <PerfectLapBanner k={ad ? 2.2 : 2.45} width={Z.x1 - Z.x0} items={items} toGain={`−${gain.toFixed(2)}s`} gainGlow={Math.sin(Math.PI * prog(T, 6.9, 7.3, E.linear))} layout="stacked" /> : null}
      </div>

      {/* Mini-secteurs */}
      {T >= 3.55 && T < 6.6 ? (
        <div style={{ position: "absolute", left: Z.x0, width: Z.x1 - Z.x0, top: ad ? 1060 : 1290, ...reveal(T, 3.55, { dur: 0.4, blur: 10, y: 16 }, 6.2, { dur: 0.3, blur: 12, y: 10 }) }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 40, color: INK.body, textAlign: "center", marginBottom: 22 }}>Tes meilleurs mini-secteurs, enchaînés.</div>
          <SectorBar statuses={sectors} width={Z.x1 - Z.x0} height={30} gap={8} />
        </div>
      ) : null}

      {/* −1,23 s */}
      {T >= 6.5 && T < 8.9 ? (
        <div style={{ position: "absolute", left: Z.x0, width: Z.x1 - Z.x0, top: MAP_CY - 170, display: "flex", flexDirection: "column", alignItems: "center", ...reveal(T, 6.5, { dur: 0.05 }, 8.5, { dur: 0.3, blur: 18, y: -20 }) }}>
          <DecodeNumber T={T} text="−1,23" unit="s" start={6.6} size={ad ? 230 : 260} color={C.success} seed="g4n" />
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 46, color: INK.body, marginTop: 26, ...reveal(T, 7.0, { dur: 0.45, blur: 10, y: 12 }) }}>à aller chercher</div>
        </div>
      ) : null}

      {/* Tu l'as déjà roulé. */}
      {T >= 8.6 && T < 11.1 ? (
        <div style={{ position: "absolute", left: Z.x0, width: Z.x1 - Z.x0, top: MAP_CY - 140, display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
          <KLine T={T} text="Tu l'as *déjà roulé.*" start={8.65} size={ad ? 92 : 104} out={10.75} sweep />
          <KLine T={T} text="Juste pas dans le même tour." start={9.55} size={46} font="body" weight={500} color={INK.body} stagger={0.05} out={10.75} />
        </div>
      ) : null}

      {/* Accroche (image 0) et retour de boucle */}
      {showTitle ? (
        <div style={{ position: "absolute", left: Z.x0, width: Z.x1 - Z.x0, top: titleTop, opacity: titleVis, filter: titleVis < 0.99 ? `blur(${((1 - titleVis) * 16).toFixed(2)}px)` : undefined, transform: `translateY(${-30 * titleOut}px)` }}>
          <KLine T={T} text="Ton meilleur tour" start={0} size={ad ? 96 : 112} noIn />
          {T < 1.55 ? (
            <>
              <KLine T={T} text="n'est pas ton" start={0.25} size={ad ? 96 : 112} />
              <KLine T={T} text="*meilleur tour.*" start={0.5} size={ad ? 96 : 112} sweep />
            </>
          ) : null}
        </div>
      ) : null}

      <DemoBadge T={T} start={1.5} end={10.6} x={Z.x0} y={ad ? 1196 : 1440} />

      <EndCard T={T} start={11.0} out={13.0} headline="Découvre ton *tour idéal*." zone={Z} />
    </AbsoluteFill>
  );
};

