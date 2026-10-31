import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Petites briques d'animation et de style du tableau de bord.
 *
 * Règles : tout se joue une seule fois, à l'entrée à l'écran ; rien ne
 * tourne hors de l'écran ; « réduire les animations » affiche directement
 * l'état final. Les courbes et compteurs s'inspirent du « Tweenly Chart KPI »
 * de 21st.dev (MIT, Manjunath Irukulla), réécrits pour nos données.
 */

export const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Couleurs d'accent, tirées des variables du thème (clair et sombre).
 * Base noir, gris et rouge ; le vert (progrès) et l'ambre (à surveiller)
 * restent des touches ponctuelles, porteuses de sens.
 */
export type Accent = "red" | "green" | "amber" | "neutral";
export const ACCENT: Record<Accent, string> = {
  red: "hsl(var(--primary))",
  green: "hsl(var(--gain))",
  amber: "hsl(var(--amber))",
  neutral: "hsl(var(--foreground) / 0.72)",
};

/** Vrai dès que l'élément est entré une fois dans l'écran. */
export function useSeenOnce<T extends Element>(rootMargin = "0px 0px -10% 0px") {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, seen]);
  return [ref, seen] as const;
}

/** Bloc qui monte en fondu à son arrivée à l'écran. */
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
  style,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "aside" | "article";
  style?: CSSProperties;
}) {
  const reduce = useReducedMotion();
  const Comp = motion[as];
  if (reduce) {
    const Plain = as;
    return (
      <Plain className={className} style={style}>
        {children}
      </Plain>
    );
  }
  return (
    <Comp
      className={className}
      style={style}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.55, delay, ease: EASE }}
    >
      {children}
    </Comp>
  );
}

/**
 * Nombre qui défile jusqu'à sa valeur (écrit directement dans le DOM, sans
 * re-rendu). `from` permet l'effet chrono : le temps descend vers le meilleur tour.
 */
export function CountUp({
  value,
  format,
  from,
  play = true,
  duration = 1.1,
  delay = 0,
  className,
}: {
  value: number;
  format: (n: number) => string;
  from?: number;
  play?: boolean;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const start = from ?? 0;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce || !Number.isFinite(value)) {
      el.textContent = format(value);
      return;
    }
    if (!play) {
      el.textContent = format(start);
      return;
    }
    const c = animate(start, value, {
      duration,
      delay,
      ease: EASE,
      onUpdate: (v) => {
        el.textContent = format(v);
      },
    });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, play, reduce]);
  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {format(reduce ? value : start)}
    </span>
  );
}

/**
 * Étiquette penchée façon livrée de course ou plaque de numéro : le fond est
 * incliné, le texte reste droit.
 */
export function Slant({
  children,
  accent = "red",
  solid = false,
  className,
}: {
  children: ReactNode;
  accent?: Accent;
  solid?: boolean;
  className?: string;
}) {
  const color = ACCENT[accent];
  return (
    <span className={cn("relative inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em]", className)}>
      <span
        aria-hidden="true"
        className="absolute inset-0 -skew-x-[14deg] rounded-[3px]"
        style={
          solid
            ? { background: color }
            : { background: `color-mix(in oklab, ${color} 14%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color} 30%, transparent)` }
        }
      />
      <span className="relative" style={{ color: solid ? "hsl(var(--primary-foreground))" : color }}>
        {children}
      </span>
    </span>
  );
}

/**
 * Carte du tableau de bord : un trait de livrée en haut à gauche et des
 * hachures diagonales qui s'estompent dans le coin, dans la couleur du bloc.
 */
export function PitCard({
  children,
  accent = "neutral",
  className,
  hatch = true,
  glow = false,
  as: Tag = "section",
  labelledBy,
  label,
}: {
  children: ReactNode;
  accent?: Accent;
  className?: string;
  hatch?: boolean;
  glow?: boolean;
  as?: "section" | "article" | "div";
  labelledBy?: string;
  label?: string;
}) {
  const color = ACCENT[accent];
  return (
    <Tag
      aria-labelledby={labelledBy}
      aria-label={label}
      className={cn("relative isolate overflow-hidden rounded-2xl border border-border bg-card", className)}
      style={{ ["--pit" as string]: color }}
    >
      {glow && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 -z-10 size-56 rounded-full opacity-[0.16] blur-3xl"
          style={{ background: color }}
        />
      )}
      {hatch && (
        <div
          aria-hidden="true"
          className={cn("pointer-events-none absolute right-0 top-0 -z-10 h-24 w-40", accent === "neutral" ? "opacity-[0.07]" : "opacity-[0.12]")}
          style={{
            backgroundImage: `repeating-linear-gradient(135deg, ${color} 0 1.5px, transparent 1.5px 9px)`,
            maskImage: "radial-gradient(120% 120% at 100% 0%, black 10%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(120% 120% at 100% 0%, black 10%, transparent 70%)",
          }}
        />
      )}
      {accent !== "neutral" && (
        <span aria-hidden="true" className="absolute left-5 top-0 h-[3px] w-12 -skew-x-[30deg] rounded-b-sm" style={{ background: color }} />
      )}
      {children}
    </Tag>
  );
}
