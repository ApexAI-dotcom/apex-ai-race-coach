import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Un écran de l'app présenté comme une carte posée un peu de travers (pas une
 * capture à plat). Au repos elle est légèrement inclinée ; quand la souris la
 * survole, elle suit le pointeur avec un ressort doux et un reflet discret.
 *
 * L'effet n'existe que là où il a du sens : souris précise, écran large,
 * mouvement non réduit. Partout ailleurs (téléphone, tablette tactile,
 * « réduire les animations »), la carte reste à plat et ne bouge pas.
 */

const CAN_TILT = "(hover: hover) and (pointer: fine) and (min-width: 1024px) and (prefers-reduced-motion: no-preference)";

function useCanTilt() {
  const [can, setCan] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(CAN_TILT);
    const update = () => setCan(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return can;
}

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Inclinaison au repos, en degrés (x : bascule avant/arrière, y : rotation). */
  rest?: { x: number; y: number };
  /** Amplitude du mouvement autour du repos, en degrés. */
  range?: number;
  /** Reflet de lumière qui suit le pointeur. */
  glare?: boolean;
}

export function TiltCard({ children, className, rest = { x: 2, y: 3 }, range = 3, glare = true }: TiltCardProps) {
  const can = useCanTilt();
  const ref = useRef<HTMLDivElement>(null);

  // Position du pointeur dans la carte, de 0 à 1 (0,5 = centre).
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 130, damping: 17, mass: 0.7 };
  const sx = useSpring(px, spring);
  const sy = useSpring(py, spring);
  const shine = useSpring(0, { stiffness: 120, damping: 20 });

  // Le côté sous le pointeur s'éloigne : la carte « s'enfonce » là où on la touche.
  const rotateY = useTransform(sx, [0, 1], [rest.y - range, rest.y + range]);
  const rotateX = useTransform(sy, [0, 1], [rest.x + range, rest.x - range]);

  const glareX = useTransform(sx, (v) => `${v * 100}%`);
  const glareY = useTransform(sy, (v) => `${v * 100}%`);
  const glareBg = useMotionTemplate`radial-gradient(520px circle at ${glareX} ${glareY}, rgba(255,255,255,0.07), transparent 60%)`;

  if (!can) return <div className={className}>{children}</div>;

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    px.set(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
    py.set(Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)));
    shine.set(1);
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
    shine.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX, rotateY, rotateZ: -0.3, transformPerspective: 1600 }}
      className={cn("relative will-change-transform", className)}
    >
      {children}
      {glare && (
        <motion.div
          aria-hidden="true"
          style={{ backgroundImage: glareBg, opacity: shine }}
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit]"
        />
      )}
    </motion.div>
  );
}
