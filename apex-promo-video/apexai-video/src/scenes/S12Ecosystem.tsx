import React from "react";
import { AbsoluteFill } from "remotion";
import { Gauge } from "lucide-react";
import { C, BODY, DISPLAY } from "../theme";
import { E, mix, prog, useT, wobble } from "../lib/anim";
import { Words } from "../components/fx";
import { CalendarCard, KartHealthCard, KartSchematic, SetupTiresCard } from "../ui/InsightsUI";

/** S12 — Écosystème (bento) · 36,00 → 39,00 : Mon Kart, carnet d'ingénieur, calendrier. */
export const S12Ecosystem: React.FC = () => {
  const T = useT();
  if (T >= 39.15) return null;

  const fly = (i: number) => prog(T, 36.0 + i * 0.15, 36.0 + i * 0.15 + 0.6, E.outExpo);
  const lit = Array.from({ length: 8 }, (_, i) => prog(T, 36.5 + i * 0.09, 36.5 + i * 0.09 + 0.25, E.outExpo));
  const score = 98 * prog(T, 36.6, 37.4, E.outExpo);
  const tiles = prog(T, 37.1, 37.4, E.outExpo);
  const reco = [0, 1, 2, 3].map((i) => prog(T, 37.0 + i * 0.08, 37.0 + i * 0.08 + 0.3, E.outExpo));
  const events = [0, 1, 2].map((i) => prog(T, 37.0 + i * 0.15, 37.0 + i * 0.15 + 0.3, E.outExpo));

  const back = prog(T, 38.75, 39.1, E.inExpo);
  const driftX = wobble("s12x", T) * 5;
  const driftY = wobble("s12y", T) * 4;

  const cardStyle = (i: number): React.CSSProperties => {
    const a = fly(i);
    return {
      position: "absolute",
      opacity: a,
      transform: `translateZ(${mix(-700, 0, a)}px)`,
      filter: a < 0.99 ? `blur(${((1 - a) * 20).toFixed(2)}px)` : undefined,
    };
  };

  return (
    <AbsoluteFill
      style={{
        opacity: 1 - back,
        filter: back > 0.01 ? `blur(${(back * 18).toFixed(2)}px) brightness(${mix(1, 0.4, back).toFixed(3)})` : undefined,
        transform: `scale(${mix(1, 0.7, back)})`,
      }}
    >
      {/* Texte */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 58, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", gap: 26 }}>
          <Words T={T} words="Ton kart." start={36.3} size={72} />
          <Words T={T} words="Tes réglages." start={36.75} size={72} />
          <Words T={T} words="Ta saison." start={37.2} size={72} />
        </div>
        <Words T={T} words={[{ t: "Au", kind: "gradient" }, { t: "même", kind: "gradient" }, { t: "endroit.", kind: "gradient" }]} start={37.6} size={72} />
      </div>

      {/* Grille bento en 3D */}
      <AbsoluteFill style={{ perspective: 1800 }}>
        <AbsoluteFill
          style={{
            transformStyle: "preserve-3d",
            transform: `translate(${driftX}px, ${driftY}px) rotateX(8deg)`,
            transformOrigin: "960px 640px",
          }}
        >
          {/* A — Mon Kart */}
          <div style={{ ...cardStyle(0), left: 180, top: 268, width: 500, height: 744 }}>
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 20,
                background: "rgba(14,14,14,0.95)",
                border: "1.4px solid #262626",
                boxShadow: "0 40px 80px -30px rgba(0,0,0,0.85)",
                boxSizing: "border-box",
                padding: 22,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 10 }}>
                <Gauge size={24} color={C.primary} strokeWidth={2.2} />
                <span style={{ fontFamily: `'${DISPLAY}', sans-serif`, fontWeight: 700, fontSize: 24, color: C.text }}>Mon Kart</span>
                <span style={{ fontFamily: `'${BODY}', sans-serif`, fontWeight: 500, fontSize: 15, color: C.muted, marginLeft: 6 }}>Garage virtuel</span>
              </div>
              <div style={{ marginTop: 18 }}>
                <KartSchematic k={1.3} lit={lit} />
              </div>
              <div style={{ marginTop: 10 }}>
                <KartHealthCard k={1.3} width={456} score={score} tiles={tiles} />
              </div>
            </div>
          </div>

          {/* B — Carnet d'ingénieur */}
          <div style={{ ...cardStyle(1), left: 708, top: 268 }}>
            <SetupTiresCard k={1.45} width={1032} reco={reco} />
          </div>

          {/* C — Calendrier */}
          <div style={{ ...cardStyle(2), left: 708, top: 540 }}>
            <CalendarCard k={1.45} width={1032} events={events} />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
