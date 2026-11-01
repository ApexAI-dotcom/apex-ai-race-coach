import { useSubscription } from "@/hooks/useSubscription.tsx";
import type { SubscriptionTier } from "@/hooks/useSubscription.tsx";

/**
 * Badge d'offre, sans icône (plus sobre) : le nom de l'offre en petites
 * capitales espacées. Racer et Team en rouge, Rookie en gris.
 */
const TIER_CONFIG: Record<SubscriptionTier, { label: string; className: string }> = {
  visitor: { label: "Visiteur", className: "border-border bg-transparent text-muted-foreground" },
  rookie: { label: "Rookie", className: "border-border bg-secondary text-muted-foreground" },
  racer: { label: "Racer", className: "border-primary/40 bg-primary/10 text-primary" },
  team: { label: "Team", className: "border-primary bg-primary text-primary-foreground" },
};

interface SubscriptionBadgeProps {
  /** Conservé pour compatibilité : le badge est déjà assez court pour toutes les tailles. */
  compact?: boolean;
}

export function SubscriptionBadge(_props: SubscriptionBadgeProps = {}) {
  const { tier, isLoading } = useSubscription();
  const config = TIER_CONFIG[tier];

  if (isLoading && tier === "rookie") {
    return <span className="inline-block h-6 w-14 shrink-0 animate-pulse rounded-full bg-secondary" aria-hidden />;
  }

  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center rounded-full border px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${config.className}`}
      title={`Offre ${config.label}`}
    >
      {config.label}
    </span>
  );
}
