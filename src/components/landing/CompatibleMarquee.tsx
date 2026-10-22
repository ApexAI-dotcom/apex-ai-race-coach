import { Marquee } from "@/components/ui/marquee";
import { cn } from "@/lib/utils";
import { COMPAT_ITEMS, COMPAT_LEGAL, CompatItem } from "./data/compat";

/**
 * Barre défilante « Compatible avec ton boîtier d'acquisition ». Sobre :
 * les logos, une précision en petit, la mention de non-affiliation dessous.
 * Utilisée sous le héros de l'accueil et sur la page Analyser (hors connexion).
 */

function Logo({ item }: { item: CompatItem }) {
  const soon = item.status === "soon";
  return (
    <div className="flex shrink-0 items-center gap-3 whitespace-nowrap">
      <img
        src={item.logo}
        alt={item.name}
        height={item.height}
        loading="lazy"
        decoding="async"
        draggable={false}
        style={{ height: item.height }}
        className={cn("w-auto select-none", soon ? "opacity-45" : "opacity-90")}
      />
      <span className={cn("text-xs", soon ? "text-muted-foreground/60" : "text-muted-foreground")}>
        {item.caption}
      </span>
    </div>
  );
}

interface CompatibleMarqueeProps {
  className?: string;
  /** Cadre avec filets haut et bas (accueil) ou bande nue (page Analyser). */
  bordered?: boolean;
}

export default function CompatibleMarquee({ className, bordered = true }: CompatibleMarqueeProps) {
  return (
    <section
      aria-label="Boîtiers d'acquisition compatibles"
      className={cn(bordered && "border-y border-white/[0.06] py-7 md:py-9", className)}
    >
      <p className="mb-5 text-center text-xs font-medium tracking-wide text-muted-foreground">
        Compatible avec ton boîtier d'acquisition
      </p>
      <Marquee speed={42} gap="4.5rem" repeat={3} pauseOnHover>
        {COMPAT_ITEMS.map((item) => (
          <Logo key={item.id} item={item} />
        ))}
      </Marquee>
      <p className="mx-auto mt-5 max-w-2xl px-4 text-center text-[11px] leading-relaxed text-muted-foreground/60">
        {COMPAT_LEGAL}
      </p>
    </section>
  );
}
