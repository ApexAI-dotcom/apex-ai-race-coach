import { Flag, Car, Trophy } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription.tsx";
import type { SubscriptionTier } from "@/hooks/useSubscription.tsx";

const TIER_CONFIG: Record<
  SubscriptionTier,
  { Icon: typeof Flag; label: string; className: string }
> = {
  visitor: {
    Icon: Flag,
    label: "Visiteur",
    className: "bg-slate-800 text-slate-400 border-slate-700",
  },
  rookie: {
    Icon: Flag,
    label: "Rookie",
    className: "bg-secondary text-muted-foreground border-border hover:bg-secondary/80",
  },
  racer: {
    Icon: Car,
    label: "Racer",
    className: "bg-primary/80 text-primary-foreground border-primary/60 hover:bg-primary",
  },
  team: {
    Icon: Trophy,
    label: "Team",
    className: "bg-primary text-primary-foreground border-primary hover:bg-primary/90",
  },
};

interface SubscriptionBadgeProps {
  /**
   * Masque le libellé sous xl, ne laissant que l'icône.
   *
   * Dans la barre de navigation, « Team » ou « Racer » écrit en toutes lettres
   * coûte une cinquantaine de pixels que les liens réclament en priorité : le
   * plan se devine à l'icône et à la couleur, pas un nom de page.
   */
  compact?: boolean;
}

export function SubscriptionBadge({ compact = false }: SubscriptionBadgeProps = {}) {
  const { tier, isLoading } = useSubscription();
  const config = TIER_CONFIG[tier];
  const Icon = config.Icon;

  const showLoading = isLoading && tier === "rookie";

  if (showLoading) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-transparent bg-slate-800/60 text-slate-500 animate-pulse"
        aria-hidden
      >
        <span className="inline-block w-3 h-3 rounded-full bg-slate-600" />…
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${compact ? "px-2 xl:px-2.5" : "px-2.5"} py-1 rounded-full text-xs font-medium border transition-colors shrink-0 ${config.className}`}
      title={`Plan ${config.label}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
      <span className={compact ? "hidden xl:inline" : undefined}>{config.label}</span>
    </span>
  );
}
