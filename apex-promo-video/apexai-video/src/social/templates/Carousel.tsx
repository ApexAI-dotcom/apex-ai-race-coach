import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "../kit/tokens";
import { Blob, SocialBackground } from "../kit/Background";
import { SpeedTrace } from "../kit/SpeedTrace";
import { PanoramaTile } from "../kit/Panorama";
import { Footer } from "../kit/elements";
import { H, SlideView, W } from "./Slide";
import type { CarouselProps } from "./schema";

/** Taches lumineuses posées le long de la bande : elles chevauchent les raccords entre slides. */
const bandBlobs = (n: number): Blob[] => {
  const out: Blob[] = [];
  for (let i = 0; i < n; i++) {
    const even = i % 2 === 0;
    out.push({ x: (i + (even ? 0.1 : 0.9)) / n, y: 0.92, r: 760, color: "red", op: 0.27 });
    out.push({ x: (i + (even ? 0.92 : 0.12)) / n, y: 0.04, r: 560, color: "orange", op: 0.13 });
    out.push({ x: (i + 0.5) / n, y: 1.18, r: 900, color: "deep", op: 0.16 });
  }
  return out;
};

/**
 * Carrousel en bande continue : toutes les slides sont posées côte à côte sur une bande de n × 1080 px,
 * puis chaque image (frame) en montre une. Frame 0 = slide 1, frame 1 = slide 2…
 */
export const Carousel: React.FC<CarouselProps> = ({ label, rail, panorama, slides }) => {
  const frame = useCurrentFrame();
  const n = slides.length;
  const BW = n * W;
  const RAIL = { y: 1166, h: 64 };
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: -frame * W, top: 0, width: BW, height: H }}>
        <SocialBackground width={BW} height={H} blobs={bandBlobs(n)} vignette={0} />
        {slides.map((s, i) => {
          const pano = panorama && i === 0;
          return (
            <div key={i} style={{ position: "absolute", left: i * W, top: 0, width: W, height: H, overflow: "hidden" }}>
              {pano ? (
                <>
                  <PanoramaTile tile={panorama as 2 | 3} frame="post" />
                  <Footer index={1} total={n} />
                </>
              ) : (
                <>
                  {rail && !s.red ? (
                    <div style={{ position: "absolute", left: -i * W, top: 0, width: BW, height: H, opacity: 0.8 }}>
                      <SpeedTrace id={`rail-${i}`} canvasWidth={BW} canvasHeight={H} x0={0} width={BW} yTop={RAIL.y} height={RAIL.h} stroke={3} markers={false} grid={false} fill={false} glow={0.7} />
                    </div>
                  ) : null}
                  <SlideView s={s} index={i} total={n} label={label} rail={rail} />
                </>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
