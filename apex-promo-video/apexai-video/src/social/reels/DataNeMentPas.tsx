import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, INK, alpha } from "../kit/tokens";
import { fr } from "../kit/text";
import { Atmosphere } from "../../components/Atmosphere";
import { ScoreCard, StatCards } from "../../ui/AppUI";
import { E, kf, mix, prog, reveal, wobble } from "../../lib/anim";
import { DemoBadge, EndCard, KLine, useTime, ZONE } from "./common";

export const DNMP_DURATION = 13;

/**
 * « La data ne ment pas #1 » — 3,33 s entre ton pire et ton meilleur tour (~13 s, 1080 × 1920).
 * 0,0 chiffre lisible dès l'image 0 · 1,3 cartes de stats réelles · 3,8 score, critère Régularité
 * 6,3 la leçon · 9,3 ApexAI la mesure · 10,8 carte de fin · 12,6 boucle.
 */
export const DataNeMentPas: React.FC<{ badgeY?: number }> = ({ badgeY = 1460 }) => {
  const T = useTime();
  const Z = ZONE.reel;
  const W = Z.x1 - Z.x0;

  const heroOut = prog(T, 1.2, 1.5, E.inExpo);
  const loopIn = prog(T, 12.45, 12.9, E.outExpo);
  const showHero = T < 1.55 || T >= 12.45;
  const heroVis = T < 1.55 ? 1 - heroOut : loopIn;

  const statsIn = [0, 1, 2, 3].map((i) => prog(T, 1.5 + i * 0.1, 2.0 + i * 0.1, E.outExpo));
  const statsOut = prog(T, 3.65, 3.95, E.inExpo);
  const ring = prog(T, 2.4, 2.8, E.outExpo) * (1 - statsOut);
  const scoreIn = prog(T, 3.9, 4.4, E.ios);
  const scoreOut = prog(T, 6.1, 6.4, E.inExpo);
  const tileGlow = prog(T, 4.7, 5.1, E.outExpo) * (1 - scoreOut);
  const k = W / 470;

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Atmosphere intensity={kf(T, [0, 1.3, 6.3, 10.8, 13], [0.38, 0.3, 0.22, 0.45, 0.38])} base={C.bg} />

      {/* 3,33 s (image 0) */}
      {showHero ? (
        <div style={{ position: "absolute", left: Z.x0, width: W, top: 560, display: "flex", flexDirection: "column", alignItems: "center", opacity: heroVis, filter: heroVis < 0.99 ? `blur(${((1 - heroVis) * 18).toFixed(1)}px)` : undefined, transform: `translateY(${-30 * heroOut}px)` }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 320, letterSpacing: "-0.045em", lineHeight: 0.9, color: C.text, fontVariantNumeric: "tabular-nums" }}>
            3,33<span style={{ fontSize: "0.32em", marginLeft: "0.06em" }}>s</span>
          </div>
          <div style={{ height: 40 }} />
          <KLine T={T} text="entre ton pire" start={0} size={84} noIn />
          <KLine T={T} text="et ton *meilleur tour.*" start={0} size={84} noIn />
        </div>
      ) : null}

      {/* Cartes de stats de la session */}
      {T >= 1.4 && T < 4.0 ? (
        <>
          <div style={{ position: "absolute", left: Z.x0, width: W, top: 300 }}>
            <KLine T={T} text="La régularité," start={1.45} size={86} out={3.6} />
            <KLine T={T} text="*ça se mesure.*" start={1.65} size={86} out={3.6} sweep />
          </div>
          <div style={{ position: "absolute", left: Z.x0, top: 660, opacity: 1 - statsOut, filter: statsOut > 0.01 ? `blur(${(statsOut * 14).toFixed(1)}px)` : undefined, transform: `translateY(${wobble("dnmp", T) * 4}px)` }}>
            <StatCards k={k} width={W} appear={statsIn} glowFirst={0.4} style={{ gridTemplateColumns: "repeat(2, 1fr)" }} />
            {/* surbrillance de la 2e rangée : cohérence et écart pire/meilleur */}
            <div style={{ position: "absolute", left: -10, right: -10, bottom: -10, height: "50%", borderRadius: 16 * k, border: `3px solid ${alpha(C.primary, 0.85 * ring)}`, boxShadow: `0 0 ${40 * ring}px ${alpha(C.primary, 0.45 * ring)}` }} />
          </div>
        </>
      ) : null}

      {/* Score : critère Régularité */}
      {T >= 3.8 && T < 6.5 ? (
        <>
          <div style={{ position: "absolute", left: Z.x0, width: W, top: 300 }}>
            <KLine T={T} text="Régularité :" start={3.95} size={86} out={6.05} />
            <KLine T={T} text="*16/25*" start={4.15} size={86} out={6.05} sweep />
          </div>
          <div style={{ position: "absolute", left: Z.x0, top: 720, opacity: scoreIn * (1 - scoreOut), filter: scoreIn < 0.99 || scoreOut > 0.01 ? `blur(${(((1 - scoreIn) + scoreOut) * 14).toFixed(1)}px)` : undefined, transform: `translateY(${(1 - scoreIn) * 120}px)` }}>
            <ScoreCard k={W / 560} width={W} score={71} tiles={[1, 1, 1, 1]} />
            {/* la tuile Régularité (2e sur 4) */}
            <div
              style={{
                position: "absolute",
                left: 24 * (W / 560) + ((W - 48 * (W / 560) - 48 * (W / 560)) / 4 + 16 * (W / 560)) * 1 - 8,
                width: (W - 48 * (W / 560) - 48 * (W / 560)) / 4 + 16,
                bottom: 24 * (W / 560) - 8,
                height: 72 * (W / 560),
                borderRadius: 14,
                border: `3px solid ${alpha(C.primary, 0.9 * tileGlow)}`,
                boxShadow: `0 0 ${36 * tileGlow}px ${alpha(C.primary, 0.5 * tileGlow)}`,
              }}
            />
          </div>
        </>
      ) : null}

      {/* La leçon */}
      {T >= 6.3 && T < 9.5 ? (
        <div style={{ position: "absolute", left: Z.x0, width: W, top: 640, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <KLine T={T} text="Avant de chercher" start={6.4} size={88} out={9.1} />
          <KLine T={T} text="le tour parfait," start={6.6} size={88} out={9.1} />
          <div style={{ height: 24 }} />
          <KLine T={T} text="*rends tes tours réguliers.*" start={7.3} size={88} out={9.1} sweep />
        </div>
      ) : null}

      {/* ApexAI la mesure */}
      {T >= 9.3 && T < 11.0 ? (
        <div style={{ position: "absolute", left: Z.x0, width: W, top: 640, textAlign: "center", fontFamily: FONT.display, fontWeight: 700, fontSize: 92, letterSpacing: "-0.03em", lineHeight: 1.05, color: C.text, ...reveal(T, 9.35, { dur: 0.5, blur: 14, y: 20 }, 10.6, { dur: 0.3, blur: 16, y: -12 }) }}>
          {fr("ApexAI mesure ta régularité")}
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 48, color: INK.body, marginTop: 28, letterSpacing: "0em" }}>{fr("à chaque session analysée.")}</div>
        </div>
      ) : null}

      <DemoBadge T={T} start={1.5} end={6.1} x={Z.x0} y={badgeY} />

      <EndCard T={T} start={10.85} out={12.2} headline="Mesure *ta régularité*." zone={Z} />

      {/* légère respiration de caméra */}
      <AbsoluteFill style={{ pointerEvents: "none", background: `radial-gradient(ellipse at 50% ${mix(40, 46, prog(T, 0, 13, E.linear))}%, transparent 60%, ${alpha(C.bgDeep, 0.35)} 100%)` }} />
    </AbsoluteFill>
  );
};
