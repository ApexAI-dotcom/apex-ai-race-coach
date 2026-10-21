import { CSSProperties, ElementType, ReactNode, useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { User, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { clamp01, easeOutExpo } from "./hooks";

/**
 * Petites briques réutilisées par les sections de la page d'accueil.
 */

/* ── Titre de section ─────────────────────────────────────────────────── */

interface SectionHeadingProps {
  eyebrow: string;
  icon?: ElementType;
  title: ReactNode;
  sub?: ReactNode;
  className?: string;
}

export function SectionHeading({ eyebrow, icon: Icon, title, sub, className }: SectionHeadingProps) {
  return (
    <div className={cn("text-center max-w-3xl mx-auto", className)}>
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border mb-5">
        {Icon && <Icon className="w-3.5 h-3.5 text-primary" aria-hidden="true" />}
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </span>
      </div>
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
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 text-[11px] text-muted-foreground/80 tracking-wide",
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full rounded-full bg-primary/60 animate-ping motion-reduce:animate-none" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
      </span>
      {children}
    </p>
  );
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

/* ── Fenêtre d'application ───────────────────────────────────────────── */

const NAV = ["Accueil", "Tableau de bord", "Analyser", "Mon Kart", "Réglages", "Calendrier"];

/** Logo de la barre de navigation, comme dans l'app. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="flex h-6 w-6 items-center justify-center rounded-md gradient-primary shadow-[0_6px_12px_-4px_rgba(255,66,66,0.45)]">
        <Zap className="h-3.5 w-3.5 text-primary-foreground" aria-hidden="true" />
      </span>
      <span className="font-display text-[13px] font-bold leading-none text-foreground">
        APEX<span className="text-primary">AI</span>
      </span>
    </span>
  );
}

interface AppWindowProps {
  /** Entrée de menu mise en avant (pastille rouge). */
  active?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/**
 * Cadre « app » : barre de navigation reproduite d'après la vraie, puis le
 * contenu. Sert de décor aux aperçus pour qu'on y reconnaisse le produit.
 */
export function AppWindow({ active = "Analyser", children, className, bodyClassName }: AppWindowProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]",
        "shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.02)]",
        className
      )}
    >
      <div className="flex h-11 items-center gap-3 border-b border-white/[0.06] bg-[#0d0d0d] px-3.5">
        <BrandMark />
        <nav
          aria-hidden="true"
          className="ml-auto hidden items-center gap-0.5 text-[11px] text-muted-foreground sm:flex"
        >
          {NAV.map((item) => (
            <span
              key={item}
              className={cn(
                "rounded-full px-2.5 py-1 leading-none whitespace-nowrap",
                item === active &&
                  "bg-gradient-to-b from-[#FF4242] to-[#E60000] font-semibold text-white shadow-[0_6px_16px_-6px_rgba(255,66,66,0.7)]"
              )}
            >
              {item}
            </span>
          ))}
        </nav>
        <span
          aria-hidden="true"
          className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-muted-foreground sm:ml-2"
        >
          <User className="h-3 w-3" />
        </span>
      </div>
      <div className={cn("relative", bodyClassName)}>{children}</div>
    </div>
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
