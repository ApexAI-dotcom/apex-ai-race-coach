import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Zap,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useState, useEffect, lazy, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription.tsx";
import { getAllAnalyses, peekCachedAnalyses } from "@/lib/storage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import heroImage from "@/assets/hero-racing.jpg";
import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { GetStartedButton } from "@/components/ui/get-started-button";
import { FeedbackBox } from "@/components/feedback/FeedbackBox";
import CompatibleMarquee from "@/components/landing/CompatibleMarquee";
import AnalysisShowcase from "@/components/landing/AnalysisShowcase";
import EcosystemBento from "@/components/landing/EcosystemBento";
import PricingTeaser from "@/components/landing/PricingTeaser";

// Le tableau de bord abonné embarque toute la bibliothèque de graphiques :
// la page vitrine des visiteurs n'a pas à la télécharger. Pour un pilote déjà
// connecté (session présente sur l'appareil), on lance son chargement dès
// l'ouverture de l'app, en parallèle du reste.
const loadSubscriberHome = () => import("@/components/home/SubscriberHome");
const SubscriberHome = lazy(loadSubscriberHome);
try {
  if (Object.keys(localStorage).some((k) => k.startsWith("sb-") && k.endsWith("-auth-token"))) {
    loadSubscriberHome();
  }
} catch {
  /* stockage indisponible : chargement à la demande */
}

const marqueeImages = [
  "/showcase/1.webp",
  "/showcase/2.webp",
  "/showcase/3.webp",
  "/showcase/4.webp",
  "/showcase/5.webp",
  "/showcase/6.webp",
  "/showcase/7.webp",
  "/showcase/8.webp",
  "/showcase/9.webp",
  "/showcase/10.webp"
];

const faqs = [
  {
    question: "C'est quoi ApexAI ?",
    answer:
      "ApexAI est ton ingénieur de course IA. Il réunit dans un seul outil l'analyse de ta télémétrie, le suivi de ton kart, tes réglages et ton calendrier : de quoi mener ta saison comme une équipe pro, sans équipe technique. Tes fichiers deviennent des conseils concrets, virage par virage.",
  },
  {
    question: "Comment analyser mes données MyChron ?",
    answer:
      "C'est très simple : importe sur ApexAI le fichier de ta session (le .xrk de Race Studio), et notre IA scanne chaque virage pour détecter tes erreurs de trajectoire et de freinage.",
  },
  {
    question: "Comment améliorer mes temps en karting ?",
    answer:
      "La clé, c'est la précision de ta trajectoire en kart. ApexAI analyse tes points de corde, ta vitesse d'entrée et ta réaccélération pour te donner un plan d'action précis, virage par virage.",
  },
  {
    question: "ApexAI fonctionne avec quels boîtiers de télémétrie ?",
    answer:
      "Il est compatible avec AiM MyChron 5 et MyChron 6 : dépose directement le fichier .xrk de Race Studio. D'autres boîtiers sont en préparation. AiM, MyChron et Race Studio sont des marques d'AiM. ApexAI n'est pas affilié à AiM.",
  },
  {
    question: "Comment lire les données d'une session de karting ?",
    answer:
      "Pas besoin d'être ingénieur ! ApexAI lit directement le fichier de ton boîtier et le traduit en graphiques simples : tracé de piste, zones de freinage et courbes de vitesse, avec un score de performance clair.",
  },
  {
    question: "Combien de temps je peux gagner avec l'analyse IA ?",
    answer:
      "Impossible de te promettre un chrono : ça dépend de ton niveau, de ton circuit et de ton travail. Ce qu'ApexAI mesure, c'est ce qui est atteignable pour toi. Dans la session de démo, le Tour parfait IA est 1,23 s sous le meilleur tour réel, en enchaînant ses meilleurs mini-secteurs. Tu vois où tu perds du temps et quoi corriger en priorité.",
  },
  {
    question: "Est-ce que c'est adapté aux débutants ?",
    answer:
      "Oui. ApexAI est conçu pour rester simple : il traduit ta télémétrie en conseils clairs, virage par virage, sans que tu aies à passer des heures sur des courbes. C'est une bonne façon d'apprendre les bases de la trajectoire en voyant exactement où tu perds du temps.",
  },
  {
    question: "Comment fonctionne le score /100 ?",
    answer:
      "Le score /100 additionne quatre critères : la précision au point de corde (sur 30), la régularité (sur 25), la vitesse au point de corde (sur 25) et les temps par secteur (sur 20). C'est un repère simple pour suivre ta progression d'une session karting à l'autre.",
  },
  {
    question: "Faut-il un compte pour essayer ?",
    answer:
      "Non : ta première analyse est offerte, sans compte. Ensuite, le plan Rookie est gratuit (3 analyses par mois) et le plan Racer, à 9,90 € par mois ou 99 € par an, débloque les analyses illimitées, Mon Kart et les réglages IA.",
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
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { tier, isLoading: subLoading } = useSubscription();
  const [hasAnalyses, setHasAnalyses] = useState<boolean | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      getAllAnalyses(user.id)
        .then((data) => setHasAnalyses(data.length > 0))
        .catch(() => setHasAnalyses(false));
    } else {
      setHasAnalyses(false);
    }
  }, [isAuthenticated, user]);

  // Ce qu'on sait déjà sans attendre le réseau : la liste de la dernière visite.
  const cachedHasAnalyses = user ? (peekCachedAnalyses(user.id)?.length ?? 0) > 0 : false;
  const showHub = isAuthenticated && (hasAnalyses ?? cachedHasAnalyses);
  // Un pilote connecté ne doit jamais voir passer la page vitrine (et son
  // fond animé) avant son tableau de bord : tant qu'on ne sait pas encore
  // quel accueil lui servir, l'écran reste simplement vide.
  const deciding = authLoading || (isAuthenticated && hasAnalyses === null && !cachedHasAnalyses);

  // Nettoyer les paramètres après 5 secondes
  useEffect(() => {
    if (success || canceled) {
      const timer = setTimeout(() => {
        setSearchParams({});
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, canceled, setSearchParams]);

  if (deciding) {
    return (
      <Layout>
        <div className="min-h-[70vh]" />
      </Layout>
    );
  }

  // If subscriber and has analyses, show personalized hub
  if (showHub) {
    return (
      <Layout>
        <div className="container mx-auto px-4 pt-6 pb-12 md:pt-24">
          <Suspense fallback={<div className="min-h-[70vh]" />}>
            <SubscriberHome />
          </Suspense>
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
                Paiement annulé. Tu peux réessayer plus tard.
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
          {/* Pas de flou ici : un flou d'1 px, invisible, imposait au GPU de
              recalculer tout l'écran à chaque image du fond animé. */}
          <div className="absolute inset-0 z-10 bg-background/55 dark:bg-background/75" />
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

      {/* Compatible avec… : la preuve la plus rapide qu'ApexAI lit ton boîtier d'acquisition */}
      <CompatibleMarquee />

      {/* L'analyse : dépôt du fichier → analyse → résultat */}
      <AnalysisShowcase />

      {/* Tout ton karting : Mon Kart, Réglages, Calendrier */}
      <EcosystemBento isAuthenticated={isAuthenticated} />

      {/* Tarifs */}
      <PricingTeaser isAuthenticated={isAuthenticated} />

      {/* Boîte à recommandations — ouverte à tous les pilotes connectés */}
      <section className="py-16 border-t border-border">
        <div className="w-full px-4 sm:px-6 md:px-8 max-w-4xl mx-auto">
          <FeedbackBox />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 flex flex-col items-center">
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
                Dépose ta première session : en quelques secondes, tu vois où tu perds du temps, virage par virage, et ce qu'il faut corriger.
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
                  {isAuthenticated ? "Analyser une session" : "S'inscrire maintenant"}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 border-t border-border relative overflow-hidden">
        {/* Abstract background blur */}
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 -px-32 pointer-events-none" />

        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border mb-6">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Support
              </span>
            </div>

            <h2 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6">
              Questions <span className="text-gradient-primary">Fréquentes</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Tout ce que tu dois savoir sur l'analyse de données IA et l'amélioration de ton
              pilotage karting.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="glass-card-hover p-8 md:p-12 relative overflow-hidden group border-border"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border-border/60 last:border-0"
                >
                  <AccordionTrigger className="text-left text-lg font-bold text-foreground hover:text-primary transition-all py-6 group/trigger no-underline hover:no-underline [&[data-state=open]>div>div]:bg-primary [&[data-state=open]>div>div]:text-white">
                    <div className="flex items-center gap-6">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-primary text-sm font-black transition-all duration-300 shadow-lg">
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
                Contacte notre support
              </a>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground order-2 md:order-1">
              <Link to="/pricing" className="inline-flex items-center min-h-[36px] hover:text-primary transition-colors duration-200">
                Plans
              </Link>
              <Link to="/#contact" className="inline-flex items-center min-h-[36px] hover:text-primary transition-colors duration-200">
                Contact
              </Link>
              <Link to="/legal" className="inline-flex items-center min-h-[36px] hover:text-primary transition-colors duration-200">
                Mentions légales
              </Link>
              <Link to="/legal/cgu" className="inline-flex items-center min-h-[36px] hover:text-primary transition-colors duration-200">
                CGU
              </Link>
              <Link to="/legal/confidentialite" className="inline-flex items-center min-h-[36px] hover:text-primary transition-colors duration-200">
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
