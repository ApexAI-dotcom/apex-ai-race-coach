import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { evolvePath } from "@remotion/paths";
import { C } from "../theme";
import { E, mix, prog, useT, wobble } from "../lib/anim";
import { N, PTS } from "../lib/track";
import { Words } from "../components/fx";

const BASE_Y = 905;
const AMP = 210;

/** S13 — L'appel · 39,00 → 42,00 : la vraie courbe d'écart traverse l'écran puis s'aplatit ; « Va chercher tes dixièmes. ». */
export const S13Appel: React.FC = () => {
  const T = useT();
  const deltas = useMemo(() => PTS.map((p) => p[4] - p[3]), []);
  if (T >= 42.0) return null;

  const flat = prog(T, 40.4, 41.2, E.inOut);
  const draw = prog(T, 39.0, 40.2, E.inOut);
  const maxD = Math.max(...deltas);
  const pts = deltas.map((d, i) => {
    const x = -40 + (i / (N - 1)) * 2000;
    const y = mix(BASE_Y - (d / maxD) * AMP, BASE_Y, flat);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = `M${pts.join(" L")}`;
  const ev = evolvePath(Math.max(0.0001, draw), path);
  const headIdx = Math.min(N - 1, Math.floor(draw * (N - 1)));
  const hx = -40 + (headIdx / (N - 1)) * 2000;
  const hy = mix(BASE_Y - (deltas[headIdx] / maxD) * AMP, BASE_Y, flat);

  const rise = prog(T, 41.3, 42.0, E.inExpo);
  const driftX = wobble("s13x", T) * 4;

  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <path d={path} fill="none" stroke={C.primary} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" opacity={0.28} style={{ filter: "blur(14px)" }} strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
        <path d={path} fill="none" stroke={C.primary} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
        {draw > 0 && draw < 1 ? (
          <>
            <circle cx={hx} cy={hy} r={20} fill="rgba(255,120,100,0.4)" style={{ filter: "blur(8px)" }} />
            <circle cx={hx} cy={hy} r={6} fill="#FFFFFF" />
          </>
        ) : null}
        <line x1={0} x2={1920} y1={BASE_Y} y2={BASE_Y} stroke="rgba(255,255,255,0.08)" strokeDasharray="6 8" />
      </svg>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 250,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          transform: `translate(${driftX}px, ${-40 * rise}px) scale(${mix(1, 0.9, rise)})`,
        }}
      >
        <Words T={T} words="Va chercher" start={39.02} stagger={0.1} size={150} />
        <Words T={T} words={[{ t: "tes" }, { t: "dixièmes.", kind: "gradient" }]} start={39.6} stagger={0.1} size={150} sweep={{ start: 39.63, dur: 0.9 }} />
      </div>
    </AbsoluteFill>
  );
};
