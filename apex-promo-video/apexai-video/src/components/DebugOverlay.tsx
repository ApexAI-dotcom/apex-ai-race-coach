import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { BPM } from "../config";

/** Timecode, scène active, temps et mesures (120 BPM), zones sûres 9:16. */
export const DebugOverlay: React.FC<{ T: number; timeline: Record<string, readonly [number, number]> }> = ({ T, timeline }) => {
  const { width, height } = useVideoConfig();
  const beatLen = 60 / BPM;
  const beat = Math.floor(T / beatLen);
  const onBeat = T - beat * beatLen < 0.05;
  const scene = Object.entries(timeline).find(([, [a, b]]) => T >= a && T < b)?.[0] ?? "—";
  const portrait = height > width;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", fontFamily: "monospace" }}>
      <div style={{ position: "absolute", left: 16, top: 12, color: "#0f0", fontSize: 26, background: "rgba(0,0,0,0.6)", padding: "4px 10px" }}>
        {T.toFixed(2)} s · {scene} · temps {beat + 1} · mesure {Math.floor(beat / 4) + 1}
      </div>
      <div
        style={{
          position: "absolute",
          right: 16,
          top: 12,
          width: 26,
          height: 26,
          borderRadius: 13,
          background: onBeat ? (beat % 4 === 0 ? "#f00" : "#ff0") : "rgba(255,255,255,0.15)",
        }}
      />
      {portrait ? (
        <div style={{ position: "absolute", left: 80, top: 260, width: 860, height: 1220, border: "2px dashed rgba(0,255,0,0.6)" }} />
      ) : null}
    </AbsoluteFill>
  );
};
