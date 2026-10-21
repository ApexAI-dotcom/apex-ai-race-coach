import { CheckCircle2, Clock } from "lucide-react";
import { Marquee } from "@/components/ui/marquee";
import { cn } from "@/lib/utils";
import { COMPAT_ITEMS, CompatItem } from "./data/compat";

/**
 * Barre défilante « Compatible avec… », juste sous le héros : c'est la preuve
 * la plus rapide qu'ApexAI lit ce que le pilote a déjà dans sa poche.
 */

function Chip({ item }: { item: CompatItem }) {
  const soon = item.status === "soon";
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2.5 rounded-full border px-4 py-2 text-sm whitespace-nowrap",
        soon ? "border-dashed border-white/15 bg-transparent" : "border-white/10 bg-white/[0.035]"
      )}
    >
      {soon ? (
        <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
      )}
      {item.logo ? (
        <img
          src={item.logo}
          alt={item.name}
          loading="lazy"
          decoding="async"
          className={cn("h-5 w-auto", soon ? "opacity-50" : "opacity-85")}
        />
      ) : (
        <span aria-label={item.name} className={soon ? "text-muted-foreground" : "text-foreground"}>
          <span className="font-display font-bold tracking-tight">{item.strong}</span>
          {item.rest && <span className="ml-1.5 text-muted-foreground">{item.rest}</span>}
        </span>
      )}
      {soon && (
        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Bientôt
        </span>
      )}
    </div>
  );
}

export default function CompatibleMarquee() {
  return (
    <section aria-label="Enregistreurs compatibles" className="relative border-y border-white/[0.06] bg-white/[0.012] py-7 md:py-9">
      <p className="mb-5 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        Compatible avec ton enregistreur
      </p>
      <Marquee speed={38} gap="1rem" repeat={3} pauseOnHover>
        {COMPAT_ITEMS.map((item) => (
          <Chip key={item.id} item={item} />
        ))}
      </Marquee>
      <p className="mx-auto mt-5 max-w-xl px-4 text-center text-[11px] leading-relaxed text-muted-foreground/70">
        Import direct du fichier .xrk de Race Studio 3. D'autres enregistreurs sont en préparation. Marques citées à
        titre indicatif pour la compatibilité, propriétés de leurs détenteurs respectifs.
      </p>
    </section>
  );
}
