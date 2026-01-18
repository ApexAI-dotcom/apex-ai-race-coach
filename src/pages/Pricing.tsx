import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { PricingCard } from "@/components/pricing/PricingCard";
import { Check, Zap } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "0€",
    period: "",
    description: "Parfait pour essayer",
    features: [
      "3 analyses par mois",
      "Score global /100",
      "Visualisation basic",
      "Support email",
    ],
    variant: "free" as const,
  },
  {
    name: "Pro",
    price: "29€",
    period: "/mois",
    description: "Pour les pilotes sérieux",
    features: [
      "Analyses illimitées",
      "Score détaillé par virage",
      "Export PDF rapport",
      "Historique complet",
      "Comparaison sessions",
      "Support prioritaire",
    ],
    variant: "pro" as const,
    popular: true,
  },
  {
    name: "Team",
    price: "99€",
    period: "/mois",
    description: "Pour les équipes",
    features: [
      "Tout de Pro",
      "5 pilotes inclus",
      "Dashboard équipe",
      "Comparatif pilotes",
      "API access",
      "Manager dédié",
    ],
    variant: "team" as const,
  },
];

const faqs = [
  {
    question: "Quels formats de fichiers sont supportés ?",
    answer:
      "Nous supportons les exports CSV de MyChron5, AiM, RaceBox et tout fichier CSV standard avec données GPS.",
  },
  {
    question: "Comment fonctionne l'essai gratuit ?",
    answer:
      "L'offre Pro inclut 14 jours d'essai gratuit. Aucune carte bancaire requise pour commencer.",
  },
  {
    question: "Puis-je changer de forfait ?",
    answer:
      "Oui, vous pouvez upgrader ou downgrader à tout moment. La facturation est ajustée au prorata.",
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer:
      "Absolument. Toutes les données sont chiffrées et stockées sur des serveurs sécurisés en Europe.",
  },
];

export default function Pricing() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              14 jours d'essai gratuit
            </span>
          </motion.div>

          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Tarifs <span className="text-gradient-primary">transparents</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Choisissez le plan adapté à vos besoins. Upgradez ou annulez à tout
            moment.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-20">
          {plans.map((plan, index) => (
            <PricingCard key={plan.name} {...plan} delay={index * 0.1} />
          ))}
        </div>

        {/* Enterprise CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-8 max-w-3xl mx-auto text-center mb-20"
        >
          <h3 className="font-display text-2xl font-bold text-foreground mb-2">
            Besoin d'une solution sur-mesure ?
          </h3>
          <p className="text-muted-foreground mb-6">
            Pour les écuries et organisateurs d'événements, contactez-nous pour un
            devis personnalisé.
          </p>
          <a
            href="mailto:contact@apexai.racing"
            className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
          >
            Contactez-nous →
          </a>
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="font-display text-2xl font-bold text-foreground text-center mb-8">
            Questions fréquentes
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="glass-card p-6"
              >
                <h4 className="font-semibold text-foreground mb-2">
                  {faq.question}
                </h4>
                <p className="text-muted-foreground text-sm">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-muted-foreground mb-4">
            Paiement sécurisé par Stripe
          </p>
          <div className="flex justify-center items-center gap-8 opacity-50">
            <span className="text-2xl">💳</span>
            <span className="text-2xl">🔒</span>
            <span className="text-2xl">✅</span>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
