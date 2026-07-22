import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

/**
 * Base visuelle commune aux pages vitrines (Mon Kart / Réglages), pour que
 * les deux se ressentent comme le même produit — deux facettes cohérentes.
 *
 *   - hero identique (badge, titre en dégradé, sous-titre)
 *   - aperçu réaliste du VRAI produit, flouté et non interactif, en fond
 *   - encarts de fonctionnalités nets par-dessus
 *   - bandeau CTA final commun
 */

export interface PreviewFeature {
  icon: React.ElementType;
  title: string;
  description: string;
}

interface PreviewShellProps {
  meta: { title: string; description: string; path: string };
  eyebrowIcon: React.ElementType;
  eyebrow: string;
  titleLead: string;
  titleAccent: string;
  subtitle: string;
  /** Rendu réaliste (fausses données) du produit, affiché flouté en fond. */
  mock: React.ReactNode;
  features: PreviewFeature[];
  bullets: string[];
  ctaTitle: string;
  ctaSubtitle: string;
}

export function PreviewShell({
  meta, eyebrowIcon: Eyebrow, eyebrow, titleLead, titleAccent, subtitle,
  mock, features, bullets, ctaTitle, ctaSubtitle,
}: PreviewShellProps) {
  return (
    <Layout>
      <PageMeta title={meta.title} description={meta.description} path={meta.path} />

      <div className="container max-w-6xl mx-auto px-4 py-10 md:py-14">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-2xl mx-auto mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
            <Eyebrow className="w-3.5 h-3.5" />
            <span>{eyebrow}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4 leading-tight">
            {titleLead} <span className="text-gradient-primary">{titleAccent}</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">{subtitle}</p>
        </motion.div>

        {/* Aperçu réaliste + fonctionnalités */}
        <div className="relative rounded-3xl border border-border bg-card/40 overflow-hidden">
          {/* Le vrai produit, flouté et non-interactif */}
          <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
            <div className="blur-[6px] opacity-40 scale-[1.02] origin-top p-4 md:p-8 h-full overflow-hidden">
              {mock}
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background/90" />
          </div>

          {/* Contenu net par-dessus */}
          <div className="relative p-5 md:p-10">
            <div className="grid md:grid-cols-2 gap-4 md:gap-5 mb-8">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-3.5 p-4 rounded-2xl bg-card/90 backdrop-blur-md border border-border shadow-lg"
                >
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA central */}
            <div className="max-w-lg mx-auto text-center bg-card/95 backdrop-blur-md border border-border rounded-2xl p-6 md:p-8 shadow-2xl">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-2">{ctaTitle}</h2>
              <p className="text-sm text-muted-foreground mb-5">{ctaSubtitle}</p>

              <ul className="text-left space-y-2 mb-6 max-w-xs mx-auto">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/login?mode=signup">
                    <Sparkles className="w-4 h-4" />
                    Créer mon compte
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="gap-2">
                  <Link to="/login">
                    Se connecter
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Passerelle vers l'autre facette du produit */}
        <PreviewCrossLink current={meta.path} />
      </div>
    </Layout>
  );
}

/** Lien croisé entre les deux vitrines pour renforcer la cohérence produit. */
function PreviewCrossLink({ current }: { current: string }) {
  const other = current === "/mon-kart"
    ? { to: "/setup", label: "Découvrir l'assistant Réglages", desc: "Recommandations d'ingénieur pour chaque session" }
    : { to: "/mon-kart", label: "Découvrir Mon Kart", desc: "Le garage numérique et le suivi d'usure automatique" };
  return (
    <Link
      to={other.to}
      className="mt-6 flex items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card/60 hover:bg-card hover:border-primary/30 transition-colors group"
    >
      <div>
        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{other.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{other.desc}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
    </Link>
  );
}
