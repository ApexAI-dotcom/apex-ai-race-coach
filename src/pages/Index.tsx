import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Zap,
  Target,
  Timer,
  TrendingUp,
  Star,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Calendar,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription.tsx";
import { getAllAnalyses, type AnalysisSummary } from "@/lib/storage";
import SubscriberHome from "@/components/home/SubscriberHome";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import heroImage from "@/assets/hero-racing.jpg";
import TestimonialSlider from "@/components/ui/testimonial-slider";
import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { GetStartedButton } from "@/components/ui/get-started-button";

const marqueeImages = [
  "/showcase/1.png",
  "/showcase/2.png",
  "/showcase/3.png",
  "/showcase/4.png",
  "/showcase/5.png",
  "/showcase/6.png",
  "/showcase/7.png",
  "/showcase/8.png",
  "/showcase/9.png",
  "/showcase/10.png"
];

const stats = [
  { value: "12,847", label: "Tours analysés", icon: Target },
  { value: "+1.2s", label: "Gain moyen dès la 1re session", icon: Timer },
  { value: "99%", label: "Fiabilité des métriques", icon: TrendingUp },
];

const features = [
  {
    title: "Analyse IA des virages",
    description:
      "Notre algorithme identifie chaque point de corde et calcule votre trajectoire optimale.",
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

// Testimonials are managed and animated within the TestimonialSlider component

const faqs = [
  {
    question: "C'est quoi ApexAI ?",
    answer:
      "ApexAI est la première plateforme d'analyse karting par intelligence artificielle. Nous transformons vos données de télémétrie en conseils concrets pour améliorer vos temps au tour instantanément.",
  },
  {
    question: "Comment analyser mes données MyChron ?",
    answer:
      "C'est très simple : exportez votre fichier au format CSV depuis votre logiciel MyChron, importez-le sur ApexAI, et notre IA scanne chaque virage pour détecter vos erreurs de trajectoire et de freinage.",
  },
  {
    question: "Comment améliorer mes temps en karting ?",
    answer:
      "La clé pour gagner des secondes est la précision de la trajectoire kart. ApexAI analyse vos points de corde, votre vitesse d'entrée et votre réaccélération pour vous donner un plan d'action précis virage par virage.",
  },
  {
    question: "ApexAI fonctionne avec quels boîtiers de télémétrie ?",
    answer:
      "Compatible avec AiM MyChron 5 et MyChron 6 (export CSV via Race Studio). D'autres formats à venir",
  },
  {
    question: "Comment lire un fichier CSV de données karting ?",
    answer:
      "Pas besoin d'être un ingénieur ! ApexAI lit vos fichiers CSV bruts et les traduit en graphiques simples : tracé de piste, zones de freinage et courbes de vitesse, avec un score de performance clair.",
  },
  {
    question: "Combien de temps je peux gagner avec l'analyse IA ?",
    answer:
      "Nos utilisateurs constatent un gain moyen de 1,2 seconde dès la première analyse. En optimisant votre pilotage karting avec nos conseils, vous pouvez rapidement descendre sous vos records personnels.",
  },
  {
    question: "Est-ce que c'est adapté aux débutants ?",
    answer:
      "Absolument. Contrairement aux logiciels complexes, ApexAI est conçu pour être intuitif. C'est l'outil idéal pour apprendre les bases de la trajectoire et progresser sans passer des heures à étudier des graphiques.",
  },
  {
    question: "Comment fonctionne le score /100 ?",
    answer:
      "Le score global évalue votre régularité, votre précision aux points de corde et l'efficacité de votre freinage. C'est un indicateur simple pour suivre votre progression et comparer vos performances à chaque session karting.",
  },
];

function getCtaLabel(tier: string | undefined, isLoading: boolean): string {
  if (isLoading) return "Chargement…";
  if (!tier || tier === "rookie") return "3 analyses ce mois — Analyser";
  if (tier === "racer") return "Analyses illimitées — Analyser";
  if (tier === "team") return "Analyses illimitées + Équipe — Analyser";
  return "Analyser";
}

export default function Index() {
  const [searchParams, setSearchParams] = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");
  const sessionId = searchParams.get("session_id");
  const { isAuthenticated, user } = useAuth();
  const { tier, isLoading: subLoading } = useSubscription();
  const [hasAnalyses, setHasAnalyses] = useState<boolean | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      getAllAnalyses(user.id).then((data) => setHasAnalyses(data.length > 0));
    } else {
      setHasAnalyses(false);
    }
  }, [isAuthenticated, user]);

  // Nettoyer les paramètres après 5 secondes
  useEffect(() => {
    if (success || canceled) {
      const timer = setTimeout(() => {
        setSearchParams({});
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, canceled, setSearchParams]);

  // If subscriber and has analyses, show personalized hub
  if (isAuthenticated && hasAnalyses === true) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 pt-24">
          <SubscriberHome />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Success/Cancel Banner */}
      {success === "true" && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-green-500/90 backdrop-blur-sm border-b border-green-400"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-white" />
                <h3 className="text-white font-bold text-sm sm:text-base text-center">
                  Accès activé !
                </h3>
              </div>
              <Link to="/dashboard" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-white/10 text-white border-white/30 hover:bg-white/20 h-8 text-xs"
                >
                  Aller au Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {canceled === "true" && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-orange-500/90 backdrop-blur-sm border-b border-orange-400"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-center gap-3 text-center">
              <XCircle className="w-5 h-5 text-white shrink-0" />
              <p className="text-white font-medium text-xs sm:text-sm">
                Paiement annulé. Vous pouvez réessayer plus tard.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Hero Section */}
      <section
        className={`relative min-h-screen flex items-center overflow-hidden ${success === "true" || canceled === "true" ? "pt-20" : ""}`}
      >
        {/* Background 3D Marquee */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <ThreeDMarquee
            className="pointer-events-none absolute inset-0 h-full w-full opacity-65"
            images={marqueeImages}
          />
          {/* Overlay to dim the marquee and make text readable */}
          <div className="absolute inset-0 z-10 bg-background/55 dark:bg-background/75 backdrop-blur-[1px]" />
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
              <span className="text-foreground text-3xl md:text-5xl">
                Ton Ingénieur de Course IA
              </span>
            </h1>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
            >
              <Link to={isAuthenticated ? "/upload" : "/login?mode=signup"} className="group">
                <GetStartedButton
                  text={isAuthenticated ? getCtaLabel(tier, subLoading) : "S'inscrire"}
                  className="bg-primary text-primary-foreground hover:bg-primary/95"
                />
              </Link>
              <Link to={isAuthenticated ? "/dashboard" : "/upload"} className="group">
                <Button
                  variant="heroOutline"
                  size="lg"
                  className="group hover:scale-105 hover:shadow-lg transition-all duration-300 h-12 rounded-xl"
                >
                  Voir une démo
                </Button>
              </Link>
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
                className="glass-card-hover p-8 text-center group hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
              >
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-4" />
                <div className="text-4xl font-display font-bold text-foreground mb-2 group-hover:scale-105 transition-transform duration-300">
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
                className="glass-card-hover p-8 group hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
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

      {/* Spotlight Features Section */}
      <section className="py-12 border-t border-white/5 bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="glass-card p-6 md:p-10 rounded-2xl border border-white/5 relative overflow-hidden group hover:shadow-2xl hover:border-primary/20 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
                  <Star className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Fonctionnalités Clés</span>
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
                  Équipe ton garage avec les meilleurs outils
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  <div className="p-5 rounded-xl bg-background/50 border border-white/5 hover:border-primary/20 transition-colors">
                    <h4 className="font-bold text-lg text-foreground mb-2">Carnet d'Ingénieur</h4>
                    <p className="text-sm text-muted-foreground">
                      Consigne tes réglages de châssis et moteur, et associe-les aux conditions de piste pour chaque session.
                    </p>
                  </div>
                  <div className="p-5 rounded-xl bg-background/50 border border-white/5 hover:border-primary/20 transition-colors">
                    <h4 className="font-bold text-lg text-foreground mb-2">Analyse Télémétrie</h4>
                    <p className="text-sm text-muted-foreground">
                      Importe tes données MyChron5 ou autres formats CSV et obtiens une vue détaillée de tes trajectoires réelles.
                    </p>
                  </div>
                  <div className="p-5 rounded-xl bg-background/50 border border-white/5 hover:border-primary/20 transition-colors">
                    <h4 className="font-bold text-lg text-foreground mb-2">Stock de Pneus</h4>
                    <p className="text-sm text-muted-foreground">
                      Déclare et tracke l'usure de tes trains de pneus (neufs, rodés, pluie) pour des recommandations adaptées.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="py-20 border-t border-white/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
              Feuille de <span className="text-gradient-primary">route</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Découvre les prochaines fonctionnalités en cours de développement chez ApexAI.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6 rounded-2xl border border-white/5 hover:border-primary/25 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-secondary rounded-xl text-primary">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20 text-xs font-semibold px-2.5 py-0.5 rounded-full animate-pulse-neon">
                    Bientôt
                  </Badge>
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-2">
                  Comparaison télémétrie
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Compare tes trajectoires et tes courbes de vitesse directement avec d'autres pilotes pour identifier précisément où tu perds du temps.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6 rounded-2xl border border-white/5 hover:border-primary/25 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-secondary rounded-xl text-primary">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20 text-xs font-semibold px-2.5 py-0.5 rounded-full animate-pulse-neon">
                    Bientôt
                  </Badge>
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-2">
                  Calendrier & Rappels
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Un calendrier athlète complet couplé à des alertes mécaniques intelligentes pour planifier tes révisions moteurs et vidanges à temps.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6 rounded-2xl border border-white/5 hover:border-primary/25 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-secondary rounded-xl text-primary">
                    <Star className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20 text-xs font-semibold px-2.5 py-0.5 rounded-full animate-pulse-neon">
                    Bientôt
                  </Badge>
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-2">
                  Académie vidéo
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Accède à des tutoriels vidéo exclusifs réalisés par des ingénieurs de piste pour apprendre à mieux interpréter tes graphiques de télémétrie.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Slider */}
      <TestimonialSlider />

      {/* CTA Section */}
      <section className="py-20 flex flex-col items-center">
        <div className="w-full px-4 sm:px-6 md:px-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-4 sm:p-8 md:p-12 text-center relative overflow-hidden group hover:-translate-y-2 hover:shadow-2xl hover:border-orange-500/30 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
            <div className="relative z-10 flex flex-col items-center">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Prêt à améliorer tes temps ?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Rejoins les 127 pilotes qui utilisent déjà APEX AI pour dominer les circuits.
              </p>
              <Link
                to={isAuthenticated ? "/upload" : "/login?mode=signup"}
                className="w-full max-w-sm mx-auto block group"
              >
                <Button
                  variant="hero"
                  size="xl"
                  className="w-full group-hover:bg-orange-500 group-hover:scale-105 group-hover:shadow-lg transition-all duration-300"
                >
                  S'inscrire maintenant
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 border-t border-white/5 relative overflow-hidden">
        {/* Abstract background blur */}
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 -px-32 pointer-events-none" />

        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-white/5 mb-6">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Support
              </span>
            </div>

            <h2 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6">
              Questions <span className="text-gradient-primary">Fréquentes</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Tout ce que vous devez savoir sur l'analyse de données IA et l'amélioration de votre
              pilotage karting.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="glass-card-hover p-8 md:p-12 relative overflow-hidden group border-white/10"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border-white/5 last:border-0"
                >
                  <AccordionTrigger className="text-left text-lg font-bold text-foreground hover:text-primary transition-all py-6 group/trigger no-underline hover:no-underline [&[data-state=open]>div>div]:bg-primary [&[data-state=open]>div>div]:text-white">
                    <div className="flex items-center gap-6">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-secondary border border-white/5 flex items-center justify-center text-primary text-sm font-black transition-all duration-300 shadow-lg">
                        {index + 1}
                      </div>
                      <span className="font-display">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pl-16 pb-8 text-base md:text-lg max-w-3xl">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <p className="text-muted-foreground text-sm">
              Une autre question ?{" "}
              <a
                href="mailto:contact@apexai.racing"
                className="text-primary hover:underline font-bold"
              >
                Contactez notre support
              </a>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground order-2 md:order-1">
              <Link to="/pricing" className="hover:text-primary transition-colors duration-200">
                Plans
              </Link>
              <Link to="/#contact" className="hover:text-primary transition-colors duration-200">
                Contact
              </Link>
              <Link to="/legal" className="hover:text-primary transition-colors duration-200">
                Mentions légales
              </Link>
              <Link to="/legal/cgu" className="hover:text-primary transition-colors duration-200">
                CGU
              </Link>
              <Link to="/legal/confidentialite" className="hover:text-primary transition-colors duration-200">
                Confidentialité
              </Link>
            </div>

            <Link
              to="/"
              className="flex items-center gap-2 group transition-opacity hover:opacity-90 order-1 md:order-2"
            >
              <div className="w-8 h-8 rounded gradient-primary flex items-center justify-center group-hover:scale-110 group-hover:shadow-orange-500/50 transition-transform duration-200">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-foreground group-hover:text-primary/90 transition-colors">
                APEX<span className="text-primary">AI</span>
              </span>
            </Link>

            <div className="text-sm text-muted-foreground order-3">© 2026 APEX AI.</div>
          </div>
        </div>
      </footer>
    </Layout>
  );
}
