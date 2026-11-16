import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../theme";
import { E, kf, mix, prog, useT, wobble } from "../lib/anim";
import { Camera3D } from "../components/Camera3D";
import { Cursor, bezier } from "../components/Cursor";
import { Ripple, Words } from "../components/fx";
import { AnalyzeButton, AppNavbar, DropZone, FileVignette, SessionInfo, UploadHeader } from "../ui/UploadUI";
import { S06_CARD } from "./layout";

const K = S06_CARD.k;
const PAD = 24 * K;
const DZ_H = 190 * K;
const GAP1 = 16 * K;
const SI_H = 196 * K;
const GAP2 = 18 * K;
const BTN_ROW = 50 * K;
const H_FULL = PAD * 2 + DZ_H + GAP1 + SI_H + GAP2 + BTN_ROW;

/** S06 — Import · 15,00 → 18,00 : glisser-déposer du CSV, informations de session, clic « Analyser le fichier ». */
export const S06Import: React.FC = () => {
  const T = useT();
  if (T >= 18.05) return null;

  const cx = S06_CARD.x + S06_CARD.w / 2;
  const dzCenterY = S06_CARD.y + PAD + DZ_H / 2;
  const btnY = S06_CARD.y + PAD + DZ_H + GAP1 + SI_H + GAP2 + BTN_ROW / 2;

  // Caméra : inclinaison progressive, défilement quand le panneau s'ouvre, plongée finale dans le bouton.
  const ry = kf(T, [15.0, 15.8, 18.0], [0, -9, -6], E.inOut);
  const rx = kf(T, [15.0, 15.8, 18.0], [0, 6, 4], E.inOut);
  const scroll = -175 * prog(T, 16.6, 17.25, E.ios);
  const dive = prog(T, 17.65, 18.0, E.inExpo);
  const driftX = wobble("s06x", T) * 4;

  // Apparition des éléments de la page (raccord avec la carte de S05).
  const uiIn = prog(T, 14.75, 15.2, E.outExpo);
  const navIn = prog(T, 14.9, 15.4, E.outExpo);

  // Fichier glissé 15,30 → 16,40.
  const drag = prog(T, 15.3, 16.4, E.inOut);
  const [mx, my] = bezier(drag, [1880, 1140], [1760, 760], [cx + 40, dzCenterY + 20]);
  const hover = prog(T, 16.0, 16.15, E.outExpo) * (1 - prog(T, 16.5, 16.7, E.linear));
  const dropped = prog(T, 16.4, 16.6, E.inExpo);
  const selected = prog(T, 16.5, 16.85, E.outExpo);

  // Panneau « Informations de session ».
  const expand = prog(T, 16.55, 17.0, E.ios);
  const pops = Array.from({ length: 7 }, (_, i) => {
    const p = prog(T, 16.75 + i * 0.04, 16.75 + i * 0.04 + 0.3, E.outExpo);
    return p < 1 ? mix(0.6, 1.0, p) + Math.sin(p * Math.PI) * 0.06 : 1;
  });

  // Curseur vers le bouton puis clic à 17,60.
  const toBtn = prog(T, 17.25, 17.58, E.inOut);
  const [bx, by] = bezier(toBtn, [cx + 120, dzCenterY + 140], [cx + 260, btnY - 60], [cx + 34, btnY + 8]);
  const afterDrop = prog(T, 16.45, 16.9, E.outExpo);
  const restX = mix(cx + 40, cx + 120, afterDrop);
  const restY = mix(dzCenterY + 20, dzCenterY + 140, afterDrop);
  const curX = T < 16.4 ? mx : T < 17.25 ? restX : bx;
  const curY = T < 16.4 ? my : T < 17.25 ? restY : by;
  const press = Math.sin(Math.PI * prog(T, 17.6, 17.72, E.linear));
  const btnGlow = prog(T, 17.45, 17.6, E.outExpo);

  const cardH = mix(S06_CARD.hEmpty, H_FULL, expand);
  const fadeOut = prog(T, 17.85, 18.05, E.inExpo);

  return (
    <AbsoluteFill style={{ opacity: 1 - fadeOut }}>
      {/* Texte à gauche */}
      <div style={{ position: "absolute", left: 130, top: 360, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
        <Words T={T} words="Importe" start={15.15} size={104} style={{ justifyContent: "flex-start" }} outStart={17.6} outOpts={{ dur: 0.3, blur: 14 }} />
        <Words
          T={T}
          words={[{ t: "ta" }, { t: "session.", kind: "gradient" }]}
          start={15.35}
          size={104}
          style={{ justifyContent: "flex-start" }}
          outStart={17.62}
          outOpts={{ dur: 0.3, blur: 14 }}
        />
        <div style={{ height: 22 }} />
        <Words
          T={T}
          words="Ton export CSV suffit."
          start={15.7}
          stagger={0.06}
          size={34}
          weight={500}
          font="body"
          style={{ justifyContent: "flex-start" }}
          wordStyle={{ color: C.muted }}
          outStart={17.64}
          outOpts={{ dur: 0.3, blur: 12 }}
        />
      </div>

      <Camera3D
        perspective={1700}
        rx={rx}
        ry={ry}
        x={driftX}
        y={scroll}
        scale={mix(1, 1.7, dive)}
        origin={`${cx}px ${btnY}px`}
        blur={dive * 16}
      >
        {/* Barre de navigation (lointaine, floue) */}
        <div style={{ position: "absolute", left: 720, top: 40, opacity: 0.7 * navIn, filter: "blur(3px)" }}>
          <AppNavbar k={1.15} width={1120} />
        </div>

        {/* Titre de page */}
        <div style={{ position: "absolute", left: S06_CARD.x, top: 175, opacity: uiIn, filter: uiIn < 0.99 ? `blur(${((1 - uiIn) * 12).toFixed(2)}px)` : undefined }}>
          <UploadHeader k={K} width={S06_CARD.w} />
        </div>

        {/* Carte d'import */}
        <div
          style={{
            position: "absolute",
            left: S06_CARD.x,
            top: S06_CARD.y,
            width: S06_CARD.w,
            height: cardH,
            borderRadius: 18 * K,
            background: "#121212",
            border: "1.4px solid #262626",
            boxSizing: "border-box",
            overflow: "hidden",
            boxShadow: "0 40px 90px -30px rgba(0,0,0,0.85)",
          }}
        >
          <div style={{ position: "absolute", left: PAD, right: PAD, top: PAD, opacity: uiIn }}>
            <DropZone k={K} hover={hover} selected={selected} />
          </div>
          <div
            style={{
              position: "absolute",
              left: PAD,
              right: PAD,
              top: PAD + DZ_H + GAP1,
              height: SI_H,
              opacity: expand,
              transform: `translateY(${(1 - expand) * 30}px)`,
            }}
          >
            <SessionInfo k={K} pops={pops} style={{ height: SI_H }} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: PAD + DZ_H + GAP1 + SI_H + GAP2,
              height: BTN_ROW,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: expand,
            }}
          >
            <AnalyzeButton k={K} press={press} glow={btnGlow} />
          </div>
        </div>

        <Ripple T={T} start={16.42} x={cx} y={dzCenterY} size={140} />
        <Ripple T={T} start={17.62} x={cx + 34} y={btnY} size={110} />

        {/* Fichier glissé + curseur */}
        {T >= 15.3 && dropped < 1 ? (
          <div
            style={{
              position: "absolute",
              left: mx - 170,
              top: my - 40,
              transform: `rotate(${mix(-6, 0, drag)}deg) scale(${mix(1.04, 0.5, dropped)})`,
              transformOrigin: "170px 40px",
              opacity: 1 - dropped,
            }}
          >
            <FileVignette k={1.15} />
          </div>
        ) : null}
        {T >= 15.3 ? <Cursor x={curX} y={curY} press={press} opacity={prog(T, 15.3, 15.45, E.outExpo)} /> : null}
      </Camera3D>
    </AbsoluteFill>
  );
};
