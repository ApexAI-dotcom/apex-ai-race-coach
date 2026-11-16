import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "./tokens";
import { SocialBackground } from "./Background";
import { SpeedTrace } from "./SpeedTrace";
import { Body, Label, Title } from "./text";
import { Lockup } from "./elements";

/**
 * Panorama de la rangée épinglée (G1 · G2 · G3) : un canevas de 3 tuiles 3:4 (1080 × 1440 chacune).
 * La trace de vitesse réelle d'Adria entre dans G1, traverse G2 et s'arrête dans G3, sur le logo.
 */
export const TILE_W = 1080;
export const TILE_H = 1440;
const PW = TILE_W * 3;
const BLEED = 600;
const bx = (x: number) => (x + BLEED) / (PW + 2 * BLEED);
const by = (y: number) => (y + BLEED) / (TILE_H + 2 * BLEED);

const TITLES = [
  { label: "Manifeste", title: "Où perds-tu\ntes *dixièmes* ?", sub: "" },
  { label: "Mode d'emploi", title: "Du CSV\nau *conseil*.", sub: "En 3 étapes." },
  { label: "L'app", title: "Ton karting.\n*Une seule app.*", sub: "Inscription gratuite." },
];

export const PanoramaCanvas: React.FC = () => {
  const traceX0 = -40;
  const traceEnd = TILE_W * 2 + 560; // ligne d'arrivée dans G3
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: PW, height: TILE_H }}>
      <div style={{ position: "absolute", left: -BLEED, top: -BLEED, width: PW + 2 * BLEED, height: TILE_H + 2 * BLEED }}>
        <SocialBackground
          width={PW + 2 * BLEED}
          height={TILE_H + 2 * BLEED}
          blobs={[
            { x: bx(0.03 * PW), y: by(0.95 * TILE_H), r: 820, color: "red", op: 0.28 },
            { x: bx(0.36 * PW), y: by(0.06 * TILE_H), r: 620, color: "orange", op: 0.1 },
            { x: bx(0.52 * PW), y: by(1.08 * TILE_H), r: 900, color: "deep", op: 0.22 },
            { x: bx(0.84 * PW), y: by(0.45 * TILE_H), r: 700, color: "red", op: 0.2 },
            { x: bx(0.99 * PW), y: by(0.04 * TILE_H), r: 640, color: "orange", op: 0.2 },
          ]}
          vignette={0}
          grain={0.045}
          scale={1.33}
        />
      </div>
      <SpeedTrace id="pano" canvasWidth={PW} canvasHeight={TILE_H} x0={traceX0} width={traceEnd - traceX0} yTop={420} height={330} stroke={7} markerSize={40} head />
      {/* ligne d'arrivée + logo */}
      <div style={{ position: "absolute", left: traceEnd - 2, top: 360, width: 4, height: 470, background: `linear-gradient(180deg, transparent, ${C.text}, transparent)`, opacity: 0.55 }} />
      <div style={{ position: "absolute", left: TILE_W * 2 + 80, top: 905 - 40 - 92 }}>
        <Lockup height={84} />
      </div>
      {TITLES.map((t, i) => (
        <React.Fragment key={i}>
          <Label text={t.label} size={26} style={{ position: "absolute", left: TILE_W * i + 80, top: 120 }} />
          <div style={{ position: "absolute", left: TILE_W * i + 80, width: TILE_W - 160, top: 905 }}>
            <Title text={t.title} size={i === 0 ? 120 : 128} />
            {t.sub ? <Body text={t.sub} size={40} style={{ marginTop: 26 }} /> : null}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

/**
 * Tuile `tile` (1, 2 ou 3) projetée dans le cadre réel du post :
 *  - « reel » 1080 × 1920 : la grille montre la bande y 240 → 1680 (échelle 1) ;
 *  - « post » 1080 × 1350 : la grille montre la bande x 34 → 1046 (échelle 0,9375).
 */
export const PanoramaTile: React.FC<{ tile: 1 | 2 | 3; frame: "reel" | "post" }> = ({ tile, frame }) => {
  const k = frame === "reel" ? 1 : 1350 / TILE_H;
  const x = frame === "reel" ? -TILE_W * (tile - 1) : 34 - TILE_W * k * (tile - 1);
  const y = frame === "reel" ? 240 : 0;
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: C.bg }}>
      <div style={{ position: "absolute", left: x, top: y, width: PW, height: TILE_H, transform: `scale(${k})`, transformOrigin: "0 0" }}>
        <PanoramaCanvas />
      </div>
    </AbsoluteFill>
  );
};
