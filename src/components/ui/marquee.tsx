import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Bandeau défilant (base 21st.dev « Marquee »).
 *
 * Même principe que l'original : le contenu est écrit deux fois côte à côte et
 * on glisse d'exactement une copie, en boucle — l'animation ne touche qu'au
 * `transform`, donc elle reste sur le compositeur du GPU.
 *
 * Ajouts pour la production :
 *  - la boucle se met en pause dès que le bandeau sort de l'écran ;
 *  - « Réduire les animations » : plus de défilement, les éléments se
 *    rangent à plat, centrés, et la copie de bouclage disparaît ;
 *  - la copie de bouclage est masquée aux lecteurs d'écran ;
 *  - `repeat` rallonge chaque copie pour qu'elle dépasse toujours la largeur
 *    de l'écran (sinon un trou apparaît à droite sur un grand moniteur) ;
 *  - bords en fondu optionnels.
 */
interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  pauseOnHover?: boolean;
  direction?: "left" | "right";
  /** Durée d'un tour complet, en secondes : plus grand = plus lent. */
  speed?: number;
  /** Espace entre deux éléments (valeur CSS). */
  gap?: string;
  /** Nombre de fois où le contenu est répété dans une copie. */
  repeat?: number;
  /** Fondu transparent aux deux extrémités. */
  fade?: boolean;
}

const FADE =
  "linear-gradient(to right, transparent 0, #000 clamp(24px, 9%, 120px), #000 calc(100% - clamp(24px, 9%, 120px)), transparent 100%)";

export function Marquee({
  children,
  pauseOnHover = false,
  direction = "left",
  speed = 30,
  gap = "3rem",
  repeat = 1,
  fade = true,
  className,
  style,
  ...props
}: MarqueeProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const reps = Math.max(1, repeat);
  const rowClass = "flex shrink-0 items-center gap-[var(--gap)]";
  const copyClass = cn(
    rowClass,
    "pr-[var(--gap)] motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:pr-0"
  );

  // Dans la première copie, seule la première répétition est « vraie » : les
  // suivantes ne servent qu'à remplir la largeur, donc ni lecteurs d'écran ni
  // « Réduire les animations » ne les voient.
  const filler = Array.from({ length: reps - 1 }, (_, i) => (
    <div key={i} aria-hidden="true" className={cn(rowClass, "motion-reduce:hidden")}>
      {children}
    </div>
  ));
  const loopCopy = Array.from({ length: reps }, (_, i) => (
    <div key={i} className={rowClass}>
      {children}
    </div>
  ));

  return (
    <div
      ref={rootRef}
      className={cn("relative w-full overflow-hidden", className)}
      style={{
        ...(fade ? { maskImage: FADE, WebkitMaskImage: FADE } : null),
        ...style,
      }}
      {...props}
    >
      <div
        className={cn(
          "flex w-max motion-reduce:w-full motion-reduce:animate-none",
          direction === "right" ? "animate-marquee-reverse" : "animate-marquee",
          pauseOnHover && "hover:[animation-play-state:paused]",
          !visible && "[animation-play-state:paused]"
        )}
        style={{ "--duration": `${speed}s`, "--gap": gap } as React.CSSProperties}
      >
        <div className={copyClass}>
          {children}
          {filler}
        </div>
        <div className={cn(copyClass, "motion-reduce:hidden")} aria-hidden="true">
          {loopCopy}
        </div>
      </div>
    </div>
  );
}

export default Marquee;
