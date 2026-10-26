import { useMemo } from "react";

interface Props {
  lat?: number[];
  lon?: number[];
  size?: number;
  strokeWidth?: number;
  className?: string;
  title?: string;
}

/**
 * Le tracé réel du circuit, dessiné à partir des points GPS de la séance.
 * Projection équirectangulaire locale (suffisante à l'échelle d'une piste),
 * nord en haut. Sans points GPS : une boucle neutre en pointillés.
 */
export function TrackOutline({ lat, lon, size = 96, strokeWidth = 2.5, className, title }: Props) {
  const path = useMemo(() => {
    if (!lat || !lon || lat.length < 10 || lat.length !== lon.length) return null;
    const step = Math.max(1, Math.floor(lat.length / 200));
    const lat0 = lat.reduce((a, b) => a + b, 0) / lat.length;
    const k = Math.cos((lat0 * Math.PI) / 180);
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i < lat.length; i += step) {
      xs.push(lon[i] * k);
      ys.push(-lat[i]);
    }
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const span = Math.max(maxX - minX, maxY - minY) || 1;
    const pad = 8;
    const inner = 100 - pad * 2;
    const offX = pad + (inner - ((maxX - minX) / span) * inner) / 2;
    const offY = pad + (inner - ((maxY - minY) / span) * inner) / 2;
    const pts = xs.map((x, i) => [offX + ((x - minX) / span) * inner, offY + ((ys[i] - minY) / span) * inner]);
    return "M" + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L") + "Z";
  }, [lat, lon]);

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title ?? (path ? "Tracé du circuit" : "Tracé indisponible")}
    >
      {path ? (
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ) : (
        <rect
          x="18"
          y="30"
          width="64"
          height="40"
          rx="20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeDasharray="4 5"
          opacity={0.45}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
