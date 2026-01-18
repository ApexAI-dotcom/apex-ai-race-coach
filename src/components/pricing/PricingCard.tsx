import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  variant: "free" | "pro" | "team";
  popular?: boolean;
  delay?: number;
}

const variantStyles = {
  free: {
    card: "border-white/10",
    badge: "bg-muted text-muted-foreground",
    icon: "🥉",
    button: "outline" as const,
  },
  pro: {
    card: "border-primary/30 glow-primary",
    badge: "gradient-pro text-primary-foreground",
    icon: "🥈",
    button: "hero" as const,
  },
  team: {
    card: "border-gold/30",
    badge: "gradient-gold text-gold-foreground",
    icon: "🥇",
    button: "gold" as const,
  },
};

export const PricingCard = ({
  name,
  price,
  period = "/mois",
  description,
  features,
  variant,
  popular,
  delay = 0,
}: PricingCardProps) => {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`relative glass-card p-8 ${styles.card} ${popular ? "scale-105 z-10" : ""}`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 rounded-full text-xs font-bold gradient-primary text-primary-foreground">
            POPULAIRE
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <span className="text-3xl mb-2 block">{styles.icon}</span>
        <h3 className="text-xl font-display font-bold text-foreground mb-2">
          {name}
        </h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      <div className="text-center mb-6">
        <span className="text-4xl font-display font-bold text-foreground">
          {price}
        </span>
        {period && (
          <span className="text-muted-foreground text-sm">{period}</span>
        )}
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3 text-sm">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3 text-primary" />
            </div>
            <span className="text-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      <Button variant={styles.button} className="w-full" size="lg">
        {variant === "free" ? "Commencer" : "Essai gratuit 14 jours"}
      </Button>
    </motion.div>
  );
};
