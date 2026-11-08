import { useEffect, useMemo, useState, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { TrajectoryLap } from "@/types/analysis";
import { indexAtFraction, useAnalysisCursor } from "./analysisCursor";

/**
 * Mini-carte « à la FIFA » : quand le pilote survole une courbe (vitesse,
 * delta, gaz et frein) alors que la grande carte est sortie de l'écran, une
 * petite carte apparaît dans un coin avec le point qui suit le curseur.
 * Elle disparaît dès que le doigt ou la souris quitte la courbe, ou quand la
 * grande carte est de nouveau visible (elle montre déjà le point).
 */
export function FloatingMiniMap({ lap, mapRef }: { lap?: TrajectoryLap; mapRef: RefObject<HTMLElement> }) {
  const cursor = useAnalysisCursor();
  const [mapVisible, setMapVisible] = useState(true);

  useEffect(() => {
    const el = mapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setMapVisible(e.intersectionRatio > 0.6), { threshold: [0, 0.3, 0.6, 0.9] });
    io.observe(el);
    return () => io.disconnect();
  }, [mapRef]);

  // Tracé projeté une fois (équirectangulaire local), dans un carré de 100.
  const geo = useMemo(() => {
    if (!lap?.lat?.length) return null;
    const pts: { x: number; y: number; i: number }[] = [];
    const lat0 = lap.lat.find((v) => Number.isFinite(v)) ?? 0;
    const k = Math.cos((lat0 * Math.PI) / 180);
    lap.lat.forEach((la, i) => {
      const lo = lap.lon[i];
      if (Number.isFinite(la) && Number.isFinite(lo)) pts.push({ x: lo * k, y: -la, i });
    });
    if (pts.length < 10) return null;
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const span = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY) || 1;
    const w = ((Math.max(...xs) - minX) / span) * 100;
    const h = ((Math.max(...ys) - minY) / span) * 100;
    const norm = pts.map((p) => ({ x: 6 + ((p.x - minX) / span) * 88 + (88 - (w * 88) / 100) / 2, y: 6 + ((p.y - minY) / span) * 88 + (88 - (h * 88) / 100) / 2 }));
    // Fractions de longueur : même repère que les courbes (0 = ligne, 1 = arrivée).
    const fr = [0];
    for (let j = 1; j < norm.length; j++) fr.push(fr[j - 1] + Math.hypot(norm[j].x - norm[j - 1].x, norm[j].y - norm[j - 1].y));
    const total = fr[fr.length - 1] || 1;
    return {
      d: norm.map((p, j) => `${j ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("") + "Z",
      pts: norm,
      fracs: fr.map((v) => v / total),
      start: norm[0],
    };
  }, [lap]);

  const show = !!geo && cursor?.source === "chart" && !mapVisible;
  const dot = show && geo ? geo.pts[indexAtFraction(geo.fracs, cursor!.frac)] : null;
  const speed = show && geo && lap?.speed_kmh ? lap.speed_kmh[Math.round(cursor!.frac * (lap.speed_kmh.length - 1))] : null;

  return (
    <AnimatePresence>
      {show && geo && dot && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.18 }}
          // En haut à droite, sous le bandeau ApexAI (encoche comprise) : le
          // doigt ou la souris est sur la courbe, plus bas. Jamais en bas à
          // droite sur ordinateur : un widget y masquait la mini-carte.
          className="pointer-events-none fixed right-3 top-[calc(var(--safe-top)+84px)] z-[95] w-[132px] rounded-xl border border-white/10 bg-black/85 p-1.5 shadow-2xl backdrop-blur md:right-6 md:top-[96px] md:w-[200px]"
          aria-hidden
        >
          <svg viewBox="0 0 100 100" className="block h-auto w-full">
            <path d={geo.d} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="7" strokeLinejoin="round" />
            <path d={geo.d} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" strokeLinejoin="round" />
            <rect x={geo.start.x - 2.5} y={geo.start.y - 2.5} width="5" height="5" fill="#fff" opacity="0.8" />
            <circle cx={dot.x} cy={dot.y} r="7" fill="#f97316" opacity="0.25" />
            <circle cx={dot.x} cy={dot.y} r="3.6" fill="#f97316" stroke="#fff" strokeWidth="1.2" />
          </svg>
          {speed != null && Number.isFinite(speed) && (
            <div className="pb-0.5 text-center text-[11px] font-medium tabular-nums text-foreground">{Math.round(speed)} km/h</div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
