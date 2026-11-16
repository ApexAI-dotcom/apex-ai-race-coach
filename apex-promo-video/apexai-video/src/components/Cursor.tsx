import React from "react";

/** Flèche type macOS (blanche, contour noir), échelle 1,6 par défaut. */
export const Cursor: React.FC<{ x: number; y: number; scale?: number; press?: number; opacity?: number }> = ({
  x,
  y,
  scale = 1.6,
  press = 0,
  opacity = 1,
}) => {
  const s = scale * (1 - 0.15 * press);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 24,
        height: 32,
        transform: `scale(${s})`,
        transformOrigin: "2px 2px",
        opacity,
        filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.45))",
        pointerEvents: "none",
      }}
    >
      <svg width="24" height="32" viewBox="0 0 24 32">
        <path
          d="M2 2 L2 25 L8 19.5 L12.2 29 L16.2 27.2 L12.1 18 L20 18 Z"
          fill="#FFFFFF"
          stroke="#0A0A0A"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

/** Point sur une courbe de Bézier quadratique. */
export const bezier = (p: number, a: [number, number], c: [number, number], b: [number, number]): [number, number] => {
  const u = 1 - p;
  return [u * u * a[0] + 2 * u * p * c[0] + p * p * b[0], u * u * a[1] + 2 * u * p * c[1] + p * p * b[1]];
};
