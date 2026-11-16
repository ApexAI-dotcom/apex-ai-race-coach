import React, { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { evolvePath } from "@remotion/paths";
import { ChevronRight } from "lucide-react";
import { C, G, gradientText, BODY, DISPLAY } from "../theme";
import { E, kf, mix, prog, reveal, springAt, useT, wobble } from "../lib/anim";
import { N, PTS } from "../lib/track";
import { LogoIcon } from "../components/Logo";
import { Marquee3D } from "../components/Marquee3D";
import { Cursor, bezier } from "../components/Cursor";
import { Ripple, Words } from "../components/fx";
import ui from "../data/ui-data.json";
import { SAFE, SW, SX, W9 } from "./layout916";

const BASE_Y = 1250;
const AMP = 230;
const BTN_W = 660;
const BTN_H = 108;
const BTN_X = SX - BTN_W / 2;
const BTN_Y = 900;

/** V08 — Appel + fin · 20,50 → 24,00 : BREAK (« Va chercher tes dixièmes. »), HIT à 22,00 (carte de fin), clic à 23,00. */
export const V08End: React.FC = () => {
  const T = useT();
  const deltas = useMemo(() => PTS.map((p) => p[4] - p[3]), []);
  return T < 22.0 ? <Appeal T={T} deltas={deltas} /> : <EndCard T={T} />;
};

const Appeal: React.FC<{ T: number; deltas: number[] }> = ({ T, deltas }) => {
  const flat = prog(T, 21.45, 21.95, E.inOut);
  const draw = prog(T, 20.5, 21.4, E.inOut);
  const maxD = Math.max(...deltas);
  const X0 = -40;
  const XW = W9 + 80;
  const pts = deltas.map((d, i) => {
    const x = X0 + (i / (N - 1)) * XW;
    const y = mix(BASE_Y - (d / maxD) * AMP, BASE_Y, flat);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = `M${pts.join(" L")}`;
  const ev = evolvePath(Math.max(0.0001, draw), path);
  const headIdx = Math.min(N - 1, Math.floor(draw * (N - 1)));
  const hx = X0 + (headIdx / (N - 1)) * XW;
  const hy = mix(BASE_Y - (deltas[headIdx] / maxD) * AMP, BASE_Y, flat);
  const rise = prog(T, 21.6, 22.0, E.inExpo);
  const driftX = wobble("v08x", T) * 4;

  return (
    <AbsoluteFill>
      <svg width={W9} height={1920} style={{ position: "absolute", inset: 0 }}>
        <path d={path} fill="none" stroke={C.primary} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" opacity={0.28} style={{ filter: "blur(14px)" }} strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
        <path d={path} fill="none" stroke={C.primary} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
        {draw > 0 && draw < 1 ? (
          <>
            <circle cx={hx} cy={hy} r={22} fill="rgba(255,120,100,0.4)" style={{ filter: "blur(8px)" }} />
            <circle cx={hx} cy={hy} r={7} fill="#FFFFFF" />
          </>
        ) : null}
        <line x1={0} x2={W9} y1={BASE_Y} y2={BASE_Y} stroke="rgba(255,255,255,0.08)" strokeDasharray="6 8" />
      </svg>
      <div
        style={{
          position: "absolute",
          left: SAFE.x0,
          width: SW,
          top: 600,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: `translate(${driftX}px, ${-40 * rise}px) scale(${mix(1, 0.9, rise)})`,
        }}
      >
        <Words T={T} words="Va chercher" start={20.52} stagger={0.1} size={112} />
        <Words T={T} words={[{ t: "tes" }, { t: "dixièmes.", kind: "gradient" }]} start={21.0} stagger={0.1} size={112} sweep={{ start: 21.03, dur: 0.85 }} />
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{ T: number }> = ({ T }) => {
  const { fps } = useVideoConfig();
  const bgSettle = prog(T, 22.0, 22.9, E.outExpo);
  const logo = springAt(T, 22.0, fps, { damping: 13, stiffness: 170, mass: 0.7 });
  const sheen = prog(T, 22.3, 22.75, E.inOut);
  const curP = prog(T, 22.5, 22.98, E.inOut);
  const [cx, cy] = bezier(curP, [960, 1500], [860, 1180], [BTN_X + BTN_W * 0.66, BTN_Y + BTN_H * 0.62]);
  const hover = prog(T, 22.8, 22.95, E.outExpo);
  const press = Math.sin(Math.PI * prog(T, 23.0, 23.12, E.linear));
  const btnScale = mix(1, 1.03, hover) * (1 - 0.04 * press);
  const btnIn = reveal(T, 22.45, { dur: 0.5, blur: 14, y: 20, scale: 1.04 });
  const push = kf(T, [23.0, 24.0], [1.0, 1.03], E.inOut);
  const driftX = wobble("v08e", T) * 4;

  const sx = mix(-0.35, 3.75, sheen);
  const sheenStyle = (w: number, off: number, base: string, glow: string) => {
    if (sheen <= 0 || sheen >= 1) return null;
    const c = ((sx - off) / w) * 100;
    const h = (0.3 / w) * 100;
    return gradientText(`linear-gradient(100deg, ${base} 0%, ${base} ${c - h}%, ${glow} ${c}%, ${base} ${c + h}%, ${base} 100%)`);
  };

  return (
    <AbsoluteFill>
      <AbsoluteFill>
        <Marquee3D T={T - 22} brightness={0.24} blur={2} speed={40} scale={mix(1.6, 1.45, bgSettle)} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 47% 46%, rgba(10,10,10,0.6) 0%, rgba(10,10,10,0.2) 45%, rgba(10,10,10,0.8) 100%)" }} />
      </AbsoluteFill>

      <AbsoluteFill style={{ transform: `translateX(${driftX}px) scale(${push})`, transformOrigin: `${SX}px 900px` }}>
        <div
          style={{
            position: "absolute",
            left: SAFE.x0,
            width: SW,
            top: 600,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 26,
            transform: `scale(${mix(0.6, 1, Math.min(1.04, logo))})`,
            opacity: Math.min(1, 0.5 + logo * 2),
          }}
        >
          <LogoIcon size={100} />
          <span style={{ fontFamily: `'${DISPLAY}', sans-serif`, fontWeight: 700, fontSize: 114, letterSpacing: "-0.02em", lineHeight: 1, fontKerning: "none", whiteSpace: "nowrap", display: "inline-flex" }}>
            <span style={sheenStyle(2.45, 0, "#FAFAFA", "#FFE6E0") ?? { color: C.text }}>APEX</span>
            <span style={sheenStyle(0.95, 2.45, "#FF7A3C", "#FFF1E6") ?? gradientText(G.textPrimary)}>AI</span>
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            left: SAFE.x0,
            width: SW,
            top: 760,
            textAlign: "center",
            fontFamily: `'${BODY}', sans-serif`,
            fontWeight: 500,
            fontSize: 46,
            color: "#BDBDBD",
            ...reveal(T, 22.3, { dur: 0.5, blur: 12, y: 14 }),
          }}
        >
          {ui.endCard.baseline}
        </div>

        <div style={{ position: "absolute", left: BTN_X, top: BTN_Y, width: BTN_W, height: BTN_H, ...btnIn }}>
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 999,
              background: G.primary,
              boxShadow: `0 0 ${mix(40, 70, hover)}px -8px rgba(255,66,66,${mix(0.6, 0.95, hover)}), 0 18px 40px -16px rgba(0,0,0,0.6)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 24,
              transform: `scale(${btnScale})`,
              fontFamily: `'${DISPLAY}', sans-serif`,
              fontWeight: 600,
              fontSize: 42,
              color: "#FFFFFF",
              letterSpacing: "-0.01em",
            }}
          >
            {ui.endCard.button}
            <span style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight size={34} color="#FFFFFF" strokeWidth={2.6} />
            </span>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: SAFE.x0,
            width: SW,
            top: 1050,
            textAlign: "center",
            fontFamily: `'${BODY}', sans-serif`,
            fontWeight: 500,
            fontSize: 36,
            color: "#A3A3A3",
            ...reveal(T, 22.65, { dur: 0.5, blur: 10, y: 12 }),
          }}
        >
          {ui.endCard.subline}
        </div>

        <div
          style={{
            position: "absolute",
            left: SAFE.x0,
            width: SW,
            top: 1370,
            textAlign: "center",
            fontFamily: `'${BODY}', sans-serif`,
            fontWeight: 600,
            fontSize: 42,
            letterSpacing: "0.02em",
            color: C.text,
            ...reveal(T, 22.75, { dur: 0.5, blur: 10, y: 12 }),
          }}
        >
          {ui.endCard.url}
        </div>

        <Ripple T={T} start={23.0} x={BTN_X + BTN_W * 0.66} y={BTN_Y + BTN_H * 0.62} size={130} />
        {T >= 22.5 ? <Cursor x={cx} y={cy} press={press} scale={1.9} opacity={prog(T, 22.5, 22.62, E.outExpo)} /> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
