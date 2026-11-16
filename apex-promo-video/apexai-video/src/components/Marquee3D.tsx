import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

/**
 * Captures autorisées uniquement (liste « forbidden » de ui-data.json) :
 * 2 coaching · 3 carte du circuit · 4 trace de vitesse / delta · 5 radar / points de corde · 6 accélérateur & frein · 8 santé / réglages.
 * Exclues : 1 (compteurs du compte, score moyen, meilleur score), 7 (marques tierces), 9 (prénom + badge Team), 10 (page profil).
 */
const IMAGES = [2, 3, 4, 5, 6, 8].map((n) => `showcase/${n}.png`);

/**
 * Mur de captures en perspective, repris du hero du site (3d-marquee.tsx) :
 * rotateX 55°, rotateZ −45°, 4 colonnes qui dérivent en sens alternés.
 */
export const Marquee3D: React.FC<{ T: number; brightness?: number; blur?: number; speed?: number; scale?: number }> = ({
  T,
  brightness = 0.14,
  blur = 2,
  speed = 40,
  scale = 1,
}) => {
  // Chaque colonne contient toutes les captures, dans un ordre décalé (pas deux mêmes images côte à côte).
  const cols = [0, 1, 2, 3].map((c) => IMAGES.map((_, i) => IMAGES[(i + c * 2 + (c % 2)) % IMAGES.length]));
  const imgW = 970;
  const imgH = 700;
  const gap = 32;
  return (
    <AbsoluteFill style={{ overflow: "hidden", filter: `brightness(${brightness}) blur(${blur}px)` }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 1720, height: 1720, position: "relative", transform: `scale(${scale})` }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: "perspective(1000px) rotateX(55deg) rotateY(0deg) rotateZ(-45deg)",
              transformStyle: "preserve-3d",
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap,
            }}
          >
            {cols.map((list, c) => {
              const dir = c % 2 === 0 ? 1 : -1;
              const off = dir * ((T * speed) % (imgH + gap)) - (imgH + gap);
              return (
                <div key={c} style={{ display: "flex", flexDirection: "column", gap, transform: `translateY(${off}px)` }}>
                  {list.concat(list, list).map((src, k) => (
                    <Img
                      key={`${c}-${k}`}
                      src={staticFile(src)}
                      style={{
                        width: (1720 - 3 * gap) / 4,
                        height: ((1720 - 3 * gap) / 4) * (imgH / imgW),
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
