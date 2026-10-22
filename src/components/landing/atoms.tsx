import { CSSProperties, ElementType, ReactNode, useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { clamp01, easeOutExpo } from "./hooks";

/**
 * Petites briques réutilisées par les sections de la page d'accueil.
 */

/* ── Titre de section ─────────────────────────────────────────────────── */

interface SectionHeadingProps {
  eyebrow: string;
  title: ReactNode;
  sub?: ReactNode;
  className?: string;
}

export function SectionHeading({ eyebrow, title, sub, className }: SectionHeadingProps) {
  return (
    <div className={cn("text-center max-w-3xl mx-auto", className)}>
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight text-balance">
        {title}
      </h2>
      {sub && (
        <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed text-pretty max-w-2xl mx-auto">
          {sub}
        </p>
      )}
    </div>
  );
}

/* ── Mention « session de démo » ─────────────────────────────────────── */

export function DemoTag({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-[11px] text-muted-foreground/70 tracking-wide", className)}>{children}</p>;
}

/* ── Compteur animé (sans re-rendu React) ────────────────────────────── */

interface CountUpProps {
  to: number;
  from?: number;
  /** Lance (ou relance) le décompte ; faux = affiche la valeur de départ. */
  play: boolean;
  /** Durée en secondes. */
  duration?: number;
  /** Retard avant le départ, en secondes. */
  delay?: number;
  decimals?: number;
  className?: string;
}

export function CountUp({
  to,
  from = 0,
  play,
  duration = 1.2,
  delay = 0,
  decimals = 0,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const fmt = (v: number) => v.toFixed(decimals);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!play) {
      el.textContent = fmt(from);
      return;
    }
    if (reduce) {
      el.textContent = fmt(to);
      return;
    }
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now + delay * 1000;
      const p = clamp01((now - start) / (duration * 1000));
      el.textContent = fmt(from + (to - from) * easeOutExpo(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play, to, from, duration, delay, decimals, reduce]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {fmt(play && reduce ? to : from)}
    </span>
  );
}

/* ── Carte à halo qui suit la souris ─────────────────────────────────── */

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

/**
 * Un halo discret suit le pointeur. Uniquement avec une vraie souris : au
 * doigt il n'y a rien à suivre, et on évite tout travail inutile. Le halo est
 * piloté par deux variables CSS — aucun rendu React à chaque mouvement.
 */
export function SpotlightCard({ children, className, as: Tag = "div" }: SpotlightCardProps) {
  const ref = useRef<HTMLElement>(null);
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <Tag
      ref={ref}
      onPointerMove={onMove}
      style={{ "--mx": "50%", "--my": "0%" } as CSSProperties}
      className={cn(
        "group/spot relative overflow-hidden rounded-3xl border border-white/10",
        "bg-gradient-to-b from-white/[0.045] to-white/[0.01]",
        "transition-colors duration-300 hover:border-primary/25",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100 bg-[radial-gradient(420px_circle_at_var(--mx)_var(--my),hsl(var(--primary)/0.10),transparent_65%)]"
      />
      <div className="relative z-10 h-full">{children}</div>
    </Tag>
  );
}
