import React from "react";
import { AbsoluteFill } from "remotion";

/**
 * Conteneur caméra : perspective + rotations + zoom autour d'une origine.
 * Les valeurs sont calculées par la scène (images clés en temps absolu).
 */
export const Camera3D: React.FC<{
  perspective?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  scale?: number;
  x?: number;
  y?: number;
  z?: number;
  origin?: string;
  blur?: number;
  opacity?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({
  perspective = 1600,
  rx = 0,
  ry = 0,
  rz = 0,
  scale = 1,
  x = 0,
  y = 0,
  z = 0,
  origin = "50% 50%",
  blur = 0,
  opacity = 1,
  children,
  style,
}) => {
  return (
    <AbsoluteFill style={{ perspective, perspectiveOrigin: origin, opacity, ...style }}>
      <AbsoluteFill
        style={{
          transformStyle: "preserve-3d",
          transformOrigin: origin,
          transform: `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale})`,
          filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
