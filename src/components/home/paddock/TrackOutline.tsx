import { useEffect, useId, useMemo, useRef } from "react";
import { useReducedMotion } from "framer-motion";

interface Props {
  lat?: number[];
  lon?: number[];
  size?: number;
  strokeWidth?: number;
  className?: string;
  title?: string;
  /** Le tracé se dessine à l'arrivée à l'écran. */
  draw?: boolean;
  /** Un point fait le tour du circuit en boucle (durée d'un tour, en s). */
  runner?: number;
  /** Point à mettre en évidence (un virage), en coordonnées GPS. */
  marker?: { lat: number; lon: number } | null;
  /** Couleur du point et du halo (CSS). */
  accent?: string;
  /** Sans GPS : un circuit stylisé plutôt qu'une boucle en pointillés. */
  demo?: boolean;
}

// Circuit de démonstration (accueil d'un nouveau pilote), dans une boîte 100 × 100.
const DEMO_PATH =
  "M22,72 C11,72 9,57 19,52 L41,41 C49,37 47,27 39,25 L31,23 C22,21 23,10 33,10 L72,10 C87,10 92,21 86,31 L74,48 C70,55 74,61 81,61 L84,61 C95,61 94,81 82,83 L31,87 C18,88 14,79 22,72 Z";

/**
 * Le tracé réel du circuit, dessiné à partir des points GPS de la séance.
 * Projection équirectangulaire locale (suffisante à l'échelle d'une piste),
 * nord en haut. Sans points GPS : une boucle neutre en pointillés.
 */
export function TrackOutline({
  lat,
  lon,
  size = 96,
  strokeWidth = 2.5,
  className,
  title,
  draw = false,
  runner,
  marker,
  accent = "hsl(var(--primary))",
  demo = false,
}: Props) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const svgRef = useRef<SVGSVGElement>(null);

  const geo = useMemo(() => {
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
    const project = (x: number, y: number): [number, number] => [offX + ((x - minX) / span) * inner, offY + ((y - minY) / span) * inner];
    const pts = xs.map((x, i) => project(x, ys[i]));
    const d = "M" + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L") + "Z";
    let mark: [number, number] | null = null;
    if (marker && Number.isFinite(marker.lat) && Number.isFinite(marker.lon)) {
      const [mx, my] = project(marker.lon * k, -marker.lat);
      // Un point de virage hors du tracé (autre circuit) ne s'affiche pas.
      if (mx > -5 && mx < 105 && my > -5 && my < 105) mark = [mx, my];
    }
    return { d, mark };
  }, [lat, lon, marker]);

  const d = geo?.d ?? (demo ? DEMO_PATH : null);
  const animateDraw = draw && !reduce && !!d;
  const animateRunner = !!runner && !reduce && !!d;

  // Le point qui tourne ne tourne que quand le tracé est à l'écran.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !animateRunner || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => {
      try {
        if (e.isIntersecting) svg.unpauseAnimations();
        else svg.pauseAnimations();
      } catch {
        /* SMIL indisponible : le point reste immobile */
      }
    });
    io.observe(svg);
    return () => io.disconnect();
  }, [animateRunner]);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title ?? (d ? "Tracé du circuit" : "Tracé indisponible")}
      style={{ overflow: "visible" }}
    >
      {d ? (
        <>
          {animateDraw && (
            <style>{`
              @keyframes trk-draw-${uid} { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
              .trk-${uid} { stroke-dasharray: 1; stroke-dashoffset: 1; animation: trk-draw-${uid} 1.6s cubic-bezier(.22,1,.36,1) .15s forwards; }
            `}</style>
          )}
          <path
            d={d}
            pathLength={1}
            className={animateDraw ? `trk-${uid}` : undefined}
            fill="none"
            stroke="currentColor"
            // Le tracé animé se mesure en longueur de chemin (pathLength) : on
            // garde alors l'épaisseur dans le repère du dessin (100 unités).
            strokeWidth={animateDraw ? (strokeWidth * 100) / size : strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect={animateDraw ? undefined : "non-scaling-stroke"}
          />
          {animateRunner && (
            <g>
              <circle r={2.6} fill={accent} opacity={0.25}>
                <animateMotion dur={`${runner}s`} repeatCount="indefinite" path={d} rotate="auto" begin="1.4s" />
              </circle>
              <circle r={1.6} fill={accent}>
                <animateMotion dur={`${runner}s`} repeatCount="indefinite" path={d} rotate="auto" begin="1.4s" />
              </circle>
            </g>
          )}
          {geo?.mark && (
            <g transform={`translate(${geo.mark[0]} ${geo.mark[1]})`}>
              {!reduce && (
                <circle r={3} fill="none" stroke={accent} strokeWidth={1.2}>
                  <animate attributeName="r" values="3;9" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.9;0" dur="1.8s" repeatCount="indefinite" />
                </circle>
              )}
              <circle r={3.4} fill={accent} stroke="hsl(var(--card))" strokeWidth={1.4} />
            </g>
          )}
        </>
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
