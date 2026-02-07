import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Zap, Target, Timer, TrendingUp, Users, Star, CheckCircle2, XCircle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import heroImage from "@/assets/hero-racing.jpg";

const stats = [
  { value: "12,847", label: "Tours analysés", icon: Target },
  { value: "+7.2s", label: "Gain moyen par session", icon: Timer },
  { value: "94%", label: "Précision apex", icon: TrendingUp },
];

const features = [
  {
    title: "Analyse IA des virages",
    description: "Notre algorithme identifie chaque apex et calcule votre trajectoire optimale.",
    icon: Target,
  },
  {
    title: "Score de performance",
    description: "Obtenez un score /100 détaillé avec des conseils personnalisés.",
    icon: Star,
  },
  {
    title: "Compatible MyChron",
    description: "Import direct des données MyChron5, AiM, RaceBox et autres.",
    icon: Zap,
  },
];

const testimonials = [
  {
    name: "Lucas M.",
    role: "Pilote Rotax DD2",
    quote: "J'ai gagné 3 secondes en une session grâce aux conseils d'APEX AI.",
    avatar: "LM",
  },
  {
    name: "Marie D.",
    role: "Championne régionale",
    quote: "L'analyse des apex est incroyablement précise. Un game-changer.",
    avatar: "MD",
  },
];

export default function Index() {
  const [searchParams, setSearchParams] = useSearchParams();
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  const sessionId = searchParams.get('session_id');

  // Nettoyer les paramètres après 5 secondes
  useEffect(() => {
    if (success || canceled) {
      const timer = setTimeout(() => {
        setSearchParams({});
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, canceled, setSearchParams]);

  return (
    <Layout>
      {/* Success/Cancel Banner */}
      {success === 'true' && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-green-500/90 backdrop-blur-sm border-b border-green-400"
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-white" />
              <div className="text-center">
                <h3 className="text-white font-bold">🎉 Abonnement activé avec succès !</h3>
                <p className="text-white/80 text-sm">Session: {sessionId}</p>
              </div>
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                  Accéder au Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {canceled === 'true' && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-orange-500/90 backdrop-blur-sm border-b border-orange-400"
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-center gap-3">
              <XCircle className="w-5 h-5 text-white" />
              <p className="text-white font-medium">Paiement annulé. Vous pouvez réessayer quand vous voulez.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Hero Section */}
      <section className={`relative min-h-screen flex items-center overflow-hidden ${success === 'true' || canceled === 'true' ? 'pt-20' : ''}`}>
        {/* Background image - Lovable original */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Racing track"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        </div>

        <div className="container mx-auto px-4 relative z-10 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            >
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Propulsé par l'IA</span>
            </motion.div>

            {/* Title */}
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6">
              <span className="text-foreground">APEX</span>
              <span className="text-gradient-primary">AI</span>
              <br />
              <span className="text-foreground text-3xl md:text-5xl">Ton Coach Virages IA</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Analyse ton fichier CSV MyChron et obtiens un{" "}
              <span className="text-primary font-semibold">Score /100</span> +{" "}
              <span className="text-success font-semibold">7s gagnés</span> par session en moyenne.
            </p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/upload">
                <Button variant="hero" size="xl">
                  Essai Gratuit - 3 Analyses
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="heroOutline" size="lg">
                  Voir une démo
                </Button>
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12 flex items-center justify-center gap-2"
            >
              <div className="flex -space-x-2">
                {["LM", "MD", "JP", "AK"].map((initials, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground"
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                Utilisé par <span className="text-foreground font-medium">127+ pilotes PRO</span>
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card-hover p-8 text-center"
              >
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-4" />
                <div className="text-4xl font-display font-bold text-foreground mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
              Analyse <span className="text-gradient-primary">intelligente</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Notre IA analyse chaque virage pour vous donner des conseils précis et personnalisés.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card-hover p-8"
              >
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 border-t border-white/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
              Ce qu'en disent les <span className="text-gradient-primary">pilotes</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-8"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center font-bold text-primary-foreground">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                <div className="flex gap-1 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-gold fill-gold" />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Prêt à améliorer tes temps ?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Rejoins les 127 pilotes qui utilisent déjà APEX AI pour dominer les circuits.
              </p>
              <Link to="/upload">
                <Button variant="hero" size="xl">
                  Commencer maintenant
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-foreground">
                APEX<span className="text-primary">AI</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/pricing" className="hover:text-foreground transition-colors">
                Tarifs
              </Link>
              <a href="#" className="hover:text-foreground transition-colors">
                Contact
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Mentions légales
              </a>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 APEX AI. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
    </Layout>
  );
}
