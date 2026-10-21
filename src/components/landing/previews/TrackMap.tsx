import { CSSProperties, memo, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { MODEL_GOLD } from "@/components/analysis/TrackMapPro/trackMapColors";
import { DEMO_CORNERS, DEMO_LAP, DEMO_VIEWBOX } from "../data/demoSession";
import {
  DEMO_LAP_SECONDS,
  SPEED_SEGMENTS,
  TRACK_D,
  indexAtTime,
  trackPointAt,
  trackX,
  trackY,
} from "../data/track";
import { useFrameLoop } from "../hooks";

/**
 * Carte du circuit d'Adria, d'après la vraie trace GPS de la session de démo :
 * tracé coloré selon la vitesse (rouge = lent, vert = rapide), trajectoire du
 * Tour parfait IA en pointillés dorés, virages numérotés comme dans l'app.
 */

/** Couche immobile (asphalte, tronçons colorés, ligne dorée) : jamais redessinée. */
const TrackBase = memo(function TrackBase({ showAI }: { showAI: boolean }) {
  return (
    <>
      {/* Asphalte : un liseré clair puis le fond sombre par-dessus. */}
      <path d={TRACK_D} fill="none" stroke="rgba(255,255,255,0.11)" strokeWidth="70" strokeLinejoin="round" />
      <path d={TRACK_D} fill="none" stroke="#141414" strokeWidth="63" strokeLinejoin="round" />
      <path d={TRACK_D} fill="none" stroke="rgba(255,255,255,0.045)" strokeWidth="26" strokeLinejoin="round" />

      {/* Vitesse : le tracé se dessine, tronçon après tronçon. */}
      {SPEED_SEGMENTS.map((seg, k) => (
        <path
          key={k}
          d={seg.d}
          className="lp-seg"
          style={{ "--k": k } as CSSProperties}
          fill="none"
          stroke={seg.color}
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {showAI && (
        <path
          d={TRACK_D}
          className="lp-ai"
          fill="none"
          stroke={MODEL_GOLD}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="15 13"
        />
      )}
    </>
  );
});

interface TrackMapProps {
  /** Lance le dessin du tracé (et le relance quand on repasse à vrai). */
  play: boolean;
  showAI?: boolean;
  /** Numéro du virage à mettre en lumière (les autres s'estompent). */
  highlight?: number | null;
  /** Deux points qui parcourent le tour : le tien et celui du Tour IA. */
  runners?: boolean;
  className?: string;
}

/** Durée affichée d'un tour d'animation (le vrai tour dure ~50 s). */
const LOOP_SECONDS = 9;

export function TrackMap({ play, showAI = true, highlight = null, runners = false, className }: TrackMapProps) {
  const reduce = useReducedMotion();
  const meRef = useRef<SVGCircleElement>(null);
  const aiRef = useRef<SVGCircleElement>(null);

  useFrameLoop(play && runners && !reduce, (t) => {
    const lap = ((t % LOOP_SECONDS) / LOOP_SECONDS) * DEMO_LAP_SECONDS;
    const me = trackPointAt(indexAtTime(lap));
    // Le Tour IA boucle en 48,45 s là où le meilleur tour en fait 49,68 s :
    // il avance donc légèrement plus vite, au même endroit du tour.
    const ai = trackPointAt(indexAtTime(Math.min(lap * (DEMO_LAP.best / DEMO_LAP.ideal), DEMO_LAP_SECONDS)));
    meRef.current?.setAttribute("cx", me.x.toFixed(1));
    meRef.current?.setAttribute("cy", me.y.toFixed(1));
    aiRef.current?.setAttribute("cx", ai.x.toFixed(1));
    aiRef.current?.setAttribute("cy", ai.y.toFixed(1));
  });

  const dim = highlight != null;

  return (
    <svg
      viewBox={DEMO_VIEWBOX}
      className={className}
      role="img"
      aria-label="Carte du circuit d'Adria : le tracé est coloré selon la vitesse, du rouge (lent) au vert (rapide)"
      // `lp-draw` déclenche le dessin ; sans lui, tout reste invisible.
      data-play={play}
    >
      <g className={play ? "lp-draw" : undefined}>
        <TrackBase showAI={showAI} />

        {/* Départ / arrivée, sur la ligne droite de gauche. */}
        <circle cx={trackX(0)} cy={trackY(0)} r="11" fill="#22C55E" stroke="#0a0a0a" strokeWidth="3" />
        <circle cx={trackX(438)} cy={trackY(438)} r="11" fill="#FF4242" stroke="#0a0a0a" strokeWidth="3" />

        {/* Virages numérotés. */}
        {DEMO_CORNERS.map((c, k) => {
          const active = highlight === c.n;
          return (
            <g
              key={c.n}
              transform={`translate(${c.x} ${c.y})`}
              style={{ opacity: dim && !active ? 0.5 : 1, transition: "opacity 0.3s" }}
            >
              <g className="lp-badge" style={{ "--k": k } as CSSProperties}>
                {active && !reduce && (
                  <circle r="26" fill="none" stroke="#FF4242" strokeWidth="3" className="lp-halo" />
                )}
                <circle r="22" fill="#0A0A0A" stroke={active ? "#FF8A8A" : "#FF4242"} strokeWidth={active ? 4 : 3} />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="25"
                  fontWeight="700"
                  fill="#fff"
                  fontFamily="Inter, system-ui, sans-serif"
                >
                  {c.n}
                </text>
              </g>
            </g>
          );
        })}

        {/* Les deux points qui font le tour. */}
        {runners && !reduce && play && (
          <g>
            {showAI && <circle ref={aiRef} cx={trackX(0)} cy={trackY(0)} r="13" fill={MODEL_GOLD} stroke="#0a0a0a" strokeWidth="4" />}
            <circle ref={meRef} cx={trackX(0)} cy={trackY(0)} r="13" fill="#fff" stroke="#0a0a0a" strokeWidth="4" />
          </g>
        )}
      </g>
    </svg>
  );
}

export default TrackMap;
