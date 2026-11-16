import React from "react";
import { AbsoluteFill } from "remotion";
import { C, G, gradientText, BODY, DISPLAY } from "../theme";
import { CORNERS } from "../lib/track";
import { Atmosphere } from "../components/Atmosphere";
import { Camera3D } from "../components/Camera3D";
import { TrackMap } from "../components/TrackMap";
import { LogoIcon } from "../components/Logo";

/** Vignette 1280 × 720 : accroche + carte colorée par la vitesse avec la ligne Tour IA. */
export const Thumbnail: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Atmosphere intensity={0.55} base="#080808" layout="corners" />

      {/* Carte du circuit à droite */}
      <Camera3D perspective={1300} rx={30} rz={-8} origin="930px 380px">
        <div style={{ position: "absolute", left: 930 - 330, top: 380 - 330 }}>
          <TrackMap
            id="thumb"
            size={660}
            ribbon={1}
            speedLine={1}
            goldLine={1}
            markers={CORNERS.map(() => 1)}
            startFinish={1}
            grid={0.9}
            highlight={{ n: 10, glow: 0.7 }}
          />
        </div>
      </Camera3D>

      {/* Dégradé de lisibilité à gauche */}
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(8,8,8,0.92) 0%, rgba(8,8,8,0.75) 38%, rgba(8,8,8,0) 62%)" }} />

      {/* Logo */}
      <div style={{ position: "absolute", left: 72, top: 64, display: "flex", alignItems: "center", gap: 16 }}>
        <LogoIcon size={54} />
        <span style={{ fontFamily: `'${DISPLAY}', sans-serif`, fontWeight: 700, fontSize: 56, letterSpacing: "-0.02em", lineHeight: 1, fontKerning: "none" }}>
          <span style={{ color: C.text }}>APEX</span>
          <span style={gradientText(G.textPrimary)}>AI</span>
        </span>
      </div>

      {/* Accroche */}
      <div style={{ position: "absolute", left: 72, top: 228, fontFamily: `'${DISPLAY}', sans-serif`, fontWeight: 700, fontSize: 96, lineHeight: 1.04, letterSpacing: "-0.035em", color: C.text, whiteSpace: "nowrap" }}>
        <div>Où perds-tu</div>
        <div>
          tes{" "}
          <span style={{ position: "relative", display: "inline-block" }}>
            <span style={gradientText(G.textPrimary)}>dixièmes</span>
            <span style={{ position: "absolute", left: "30%", width: "40%", bottom: -4, height: 6, borderRadius: 3, background: C.primary, boxShadow: "0 0 14px rgba(255,66,66,0.7)" }} />
          </span>
          {" ?"}
        </div>
      </div>

      {/* Sous-ligne */}
      <div style={{ position: "absolute", left: 74, top: 468, fontFamily: `'${BODY}', sans-serif`, fontWeight: 500, fontSize: 32, color: "#BDBDBD" }}>
        Ton ingénieur de course IA
      </div>

      {/* Chip CTA */}
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 560,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 26px",
          borderRadius: 999,
          background: G.primary,
          boxShadow: "0 0 40px -8px rgba(255,66,66,0.7)",
          fontFamily: `'${DISPLAY}', sans-serif`,
          fontWeight: 600,
          fontSize: 28,
          color: "#FFFFFF",
        }}
      >
        Analyser ma session
        <span style={{ fontFamily: `'${BODY}', sans-serif`, fontWeight: 500, fontSize: 22, opacity: 0.9 }}>· 1re analyse offerte</span>
      </div>
    </AbsoluteFill>
  );
};
