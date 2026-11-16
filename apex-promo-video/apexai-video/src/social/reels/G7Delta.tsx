import React, { useMemo } from "react";
import { AbsoluteFill, Easing, useVideoConfig } from "remotion";
import { C, FONT, GRAD, INK, alpha } from "../kit/tokens";
import { fr } from "../kit/text";
import { Atmosphere } from "../../components/Atmosphere";
import { Camera3D } from "../../components/Camera3D";
import { TrackMap } from "../../components/TrackMap";
import { CoachingCard } from "../../ui/InsightsUI";
import { CORNERS, LAP_T4, LAP_T9, LOSS, N, deltaAtIndex, posAt } from "../../lib/track";
import { E, kf, mix, prog, reveal, springAt, wobble } from "../../lib/anim";
import { gradientText } from "../../theme";
import { DemoBadge, EndCard, KLine, useTime, ZONE } from "./common";

export const G7_DURATION = 13.5;

const DUEL_START = 1.3;
const DUEL_END = 4.4;
const duelEase = Easing.bezier(0.3, 0, 0.7, 1);
const tauAt = (T: number) => LAP_T9 * duelEase(Math.max(0, Math.min(1, (T - DUEL_START) / (DUEL_END - DUEL_START))));
const fmt = (v: number) => `+${Math.max(0, v).toFixed(2).replace(".", ",")}`;
/** Retour du chiffre d'ouverture : la dernière image rejoint l'image 0 pour une boucle sans saut. */
const LOOP = 12.65;

/**
 * G7 — « +0,51 s. Sur un seul tour. » (13,5 s, 1080 × 1920)
 * 0,0 chiffre lisible dès l'image 0 · 1,0 duel fantôme T4 / T9 sur la vraie trace · 4,85 « Où ? » + plongée sur le virage 2,
 * là où le tour 9 perd le plus (+0,28 s, deltaGainS d'adria-lap.json) · 6,7 « Sur toute la session » : cartes Priorité 1 et 2
 * de l'analyse (classement de l'app, autre comparaison que le duel) · 10,7 carte de fin · 12,65 boucle.
 */
/** badgeY : position de l'étiquette « Session de démo » (1400 pour TikTok, dont la légende masque le bas de l'écran). */
export const G7Delta: React.FC<{ badgeY?: number }> = ({ badgeY = 1460 }) => {
  const T = useTime();
  const { fps } = useVideoConfig();
  const Z = ZONE.reel;
  const MAP = 860;
  const MAP_CY = 860;

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
  const delta = duelOn ? deltaAtIndex(p9.fi, p9.done) : 0.51;
  const markers = crossings.cornerT.map((t0) => (T >= t0 ? springAt(T, t0, fps, { damping: 11, stiffness: 220, mass: 0.6 }) : 0));
  const lossLit = crossings.lossT.map((t0) => prog(T, t0, t0 + 0.18, E.outExpo));

  // Le chiffre d'ouverture devient le HUD du duel (1,0 → 1,3), puis revient au centre à la fin du duel.
  const toHud = prog(T, 0.95, 1.3, E.ios);
  const backCenter = 0;
  const hudOut = prog(T, 4.75, 4.95, E.inExpo);
  const numY = mix(mix(760, 330, toHud), 640, backCenter);
  const numSize = mix(mix(300, 120, toHud), 210, backCenter);
  const rising = duelOn && !p9.done && T < DUEL_END;

  // Carte : entrée à 1,0, plongée sur le virage 2 à 5,2 (recentré pour garder la pastille hors de l'interface Reels)
  const mapIn = prog(T, 0.95, 1.4, E.outExpo);
  const v2 = CORNERS.find((c) => c.n === 2)!;
  const ox = Z.cx - MAP / 2 + (v2.x / 1000) * MAP;
  const oy = MAP_CY - MAP / 2 + (v2.y / 1000) * MAP;
  const dive = prog(T, 5.2, 5.65, E.outExpo);
  const mapBg = prog(T, 6.55, 7.0, E.inOut);
  const mapOut = prog(T, 10.35, 10.7, E.inExpo);
  const rx = kf(T, [1.0, 5.2], [40, 28], E.inOut);

  // « Où ? »
  const ou = T >= 4.85 && T < 5.75;

  // Cartes de coaching
  const c1 = prog(T, 6.75, 7.3, E.ios);
  const hl1 = prog(T, 7.9, 8.4, E.inOut);
  const glow1 = Math.sin(Math.PI * prog(T, 7.3, 7.8, E.linear));
  const c2 = prog(T, 9.0, 9.5, E.ios);
  const stack = prog(T, 9.0, 9.6, E.ios);
  const cardsOut = prog(T, 10.4, 10.7, E.inExpo);
  const tilt = kf(T, [6.7, 10.5], [8, -4], E.inOut);

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Atmosphere intensity={kf(T, [0, 1, 5, 6.6, 10.7, 12.7, 13.5], [0.4, 0.3, 0.3, 0.2, 0.45, 0.42, 0.4])} base={C.bg} />

      {/* Carte : duel puis plongée */}
      <AbsoluteFill
        style={{
          opacity: mapIn * (1 - mapOut),
          filter: mapBg > 0.01 ? `blur(${(mapBg * 8).toFixed(2)}px) brightness(${mix(1, 0.45, mapBg).toFixed(3)})` : undefined,
        }}
      >
        <Camera3D perspective={1500} rx={rx} rz={kf(T, [1, 5], [-8, -2], E.inOut)} x={wobble("g7x", T) * 6 + (Z.cx - 80 - ox) * dive} y={wobble("g7y", T) * 5 + (820 - oy) * dive} scale={mix(mix(1.25, 1, mapIn), 2.6, dive)} origin={dive > 0 ? `${ox}px ${oy}px` : `${Z.cx}px ${MAP_CY}px`}>
          <div style={{ position: "absolute", left: Z.cx - MAP / 2, top: MAP_CY - MAP / 2 }}>
            <TrackMap
              id="g7"
              size={MAP}
              ribbon={1}
              grid={mapIn}
              whiteTrace={duelOn ? Math.min(1, p4.fi / N) : 0}
              whiteHead={duelOn && !p4.done}
              lossLit={lossLit}
              lossPulse={1 + 0.5 * Math.sin(Math.PI * prog(T, 4.4, 4.75, E.linear))}
              markers={markers}
              startFinish={mapIn}
              highlight={{ n: 2, glow: dive }}
              pulses={{ n: 2, p: [prog(T, 5.5, 6.05, E.outExpo), prog(T, 5.75, 6.3, E.outExpo)] }}
              pill={{ n: 2, text: "Virage 2", p: prog(T, 5.55, 5.9, E.outExpo) }}
              dots={
                duelOn && T < 5.2
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

      {/* Légende du duel */}
      <div
        style={{
          position: "absolute",
          left: Z.x0,
          width: Z.x1 - Z.x0,
          top: 1330,
          display: "flex",
          justifyContent: "center",
          gap: 40,
          fontFamily: FONT.body,
          fontWeight: 500,
          fontSize: 32,
          color: INK.body,
          ...reveal(T, 1.35, { dur: 0.45, blur: 10, y: 10 }, 4.45, { dur: 0.25, blur: 12, y: 10 }),
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 18, height: 18, borderRadius: 9, background: C.primary, boxShadow: `0 0 12px ${alpha(C.primary, 0.8)}` }} />
          Tour 4 (meilleur)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 18, height: 18, borderRadius: 9, background: C.blue, boxShadow: `0 0 12px ${alpha(C.blue, 0.8)}` }} />
          Tour 9
        </span>
      </div>

      {/* Chiffre : ouverture → HUD → retour au centre */}
      {T < 5.2 || T >= LOOP ? (
        <div
          style={{
            position: "absolute",
            left: Z.x0,
            width: Z.x1 - Z.x0,
            top: T >= LOOP ? 760 : numY,
            transform: "translateY(-50%)",
            textAlign: "center",
            opacity: T >= LOOP ? prog(T, LOOP, LOOP + 0.5, E.outExpo) : 1 - hudOut,
            filter:
              T >= LOOP
                ? T < LOOP + 0.5
                  ? `blur(${((1 - prog(T, LOOP, LOOP + 0.5, E.outExpo)) * 16).toFixed(1)}px)`
                  : undefined
                : hudOut > 0.01
                  ? `blur(${(hudOut * 18).toFixed(1)}px)`
                  : undefined,
          }}
        >
          {/* étiquette du HUD : absente de la boucle de fin pour que la dernière image rejoigne l'image 0 */}
          <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 26, letterSpacing: "0.2em", color: INK.muted, height: T >= LOOP ? 0 : toHud * (1 - backCenter) * 40, opacity: T >= LOOP ? 0 : toHud * (1 - backCenter), overflow: "hidden" }}>ÉCART T9 / T4</div>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 700,
              fontSize: T >= LOOP ? 300 : numSize,
              letterSpacing: "-0.045em",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
              ...(toHud > 0.5 && backCenter < 0.5 && T < LOOP ? { color: rising ? C.primary : C.text } : gradientText(GRAD.keyword)),
              filter: `drop-shadow(0 0 30px ${alpha(C.primary, 0.4)})`,
            }}
          >
            {fr(fmt(T >= LOOP ? 0.51 : delta))}
            <span style={{ fontSize: "0.32em", marginLeft: "0.06em" }}>s</span>
          </div>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 48, color: INK.body, marginTop: 18, opacity: T >= LOOP ? 1 : Math.max(1 - toHud, backCenter) }}>Sur un seul tour.</div>
        </div>
      ) : null}

      {/* « Où ? » */}
      {ou ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingRight: 1080 - 2 * Z.cx }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 340, letterSpacing: "-0.04em", ...gradientText(GRAD.keyword), ...reveal(T, 4.88, { dur: 0.3, blur: 24, scale: 1.2, y: 0 }, 5.45, { dur: 0.3, blur: 30, scale: 2.2, y: 0 }) }}>
            {fr("Où ?")}
          </div>
        </AbsoluteFill>
      ) : null}

      {/* Réponse au « Où ? » pour ce duel : le virage 2 (+0,28 s, temps perdu par le tour 9 sur le tour 4 dans la zone) */}
      {T >= 5.65 && T < 6.75 ? (
        <div style={{ position: "absolute", left: Z.x0, width: Z.x1 - Z.x0, top: 1090, textAlign: "center", ...reveal(T, 5.72, { dur: 0.4, blur: 14, y: 24 }, 6.45, { dur: 0.28, blur: 16, y: -14 }) }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 168, letterSpacing: "-0.045em", lineHeight: 1, fontVariantNumeric: "tabular-nums", ...gradientText(GRAD.keyword), filter: `drop-shadow(0 0 26px ${alpha(C.primary, 0.4)})` }}>
            +0,28<span style={{ fontSize: "0.34em", marginLeft: "0.06em" }}>s</span>
          </div>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 48, color: INK.body, marginTop: 14 }}>{fr("rien qu'au virage 2.")}</div>
        </div>
      ) : null}

      {/* Texte du coaching : le classement porte sur toute la session */}
      {T >= 6.6 && T < 10.75 ? (
        <div style={{ position: "absolute", left: Z.x0, width: Z.x1 - Z.x0, top: 250 }}>
          <KLine T={T} text="Sur toute la session," start={6.7} size={70} out={10.4} stagger={0.06} />
          <KLine T={T} text="l'IA classe tes virages" start={6.9} size={70} out={10.4} stagger={0.06} />
          <KLine T={T} text="*par temps perdu.*" start={7.15} size={70} out={10.4} sweep />
        </div>
      ) : null}

      {/* Cartes Priorité 1 et 2 */}
      {T >= 6.6 && T < 10.75 ? (
        <AbsoluteFill style={{ perspective: 1600, opacity: 1 - cardsOut, filter: cardsOut > 0.01 ? `blur(${(cardsOut * 16).toFixed(2)}px)` : undefined }}>
          <div
            style={{
              position: "absolute",
              left: Z.x0,
              top: mix(660, 620, stack),
              opacity: c1 * mix(1, 0.55, stack),
              filter: c1 < 0.99 ? `blur(${((1 - c1) * 14).toFixed(2)}px)` : stack > 0.01 ? `blur(${(stack * 3).toFixed(2)}px)` : undefined,
              transform: `translateY(${(1 - c1) * 160}px) rotateX(${tilt.toFixed(2)}deg) scale(${mix(1, 0.93, stack)})`,
              transformOrigin: "50% 0%",
            }}
          >
            <CoachingCard k={1.75} width={Z.x1 - Z.x0} index={0} title={prog(T, 6.9, 7.5, E.linear)} body={prog(T, 7.15, 7.6, E.outExpo)} highlight={hl1} lostGlow={glow1} accent />
          </div>
          {T >= 8.95 ? (
            <div
              style={{
                position: "absolute",
                left: Z.x0,
                top: 880,
                opacity: c2,
                filter: c2 < 0.99 ? `blur(${((1 - c2) * 14).toFixed(2)}px)` : undefined,
                transform: `translateY(${(1 - c2) * 180}px) rotateX(${tilt.toFixed(2)}deg)`,
                transformOrigin: "50% 0%",
              }}
            >
              <CoachingCard k={1.75} width={Z.x1 - Z.x0} index={1} title={prog(T, 9.1, 9.7, E.linear)} body={prog(T, 9.3, 9.8, E.outExpo)} lostGlow={Math.sin(Math.PI * prog(T, 9.6, 10.1, E.linear))} accent />
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}

      <DemoBadge T={T} start={1.35} end={10.35} x={Z.x0} y={badgeY} />

      <EndCard T={T} start={10.7} out={12.45} headline="Trouve où tu perds *tes dixièmes*." zone={Z} />
    </AbsoluteFill>
  );
};
