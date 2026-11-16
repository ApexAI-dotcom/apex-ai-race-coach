import React from "react";

/**
 * Flou directionnel (whips) : filtre SVG à appliquer avec `filter: url(#id)`.
 * Bien moins coûteux qu'un flou de mouvement multi-échantillons, et lisible à 60 i/s.
 */
export const DirBlur: React.FC<{ id: string; x: number; y: number }> = ({ id, x, y }) => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation={`${Math.max(0, x).toFixed(2)} ${Math.max(0, y).toFixed(2)}`} />
      </filter>
    </defs>
  </svg>
);
