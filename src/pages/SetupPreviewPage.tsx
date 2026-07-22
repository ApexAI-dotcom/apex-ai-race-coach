import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wrench,
  FileText,
  History,
  Gauge,
  Thermometer,
  CloudSun,
  Lock,
  Sparkles,
  ArrowRight,
  Sliders,
  CheckCircle2,
} from "lucide-react";

export function SetupPreviewPage() {
  return (
    <Layout>
      <PageMeta
        title="Réglages & Assistant Ingénieur IA | ApexAI"
        description="Optimisez les réglages de votre kart (pressions, hauteurs, carburation) grâce à notre assistant ingénieur intelligent."
        path="/setup"
      />

      <div className="container max-w-6xl mx-auto py-8 px-4 relative min-h-[85vh] flex flex-col justify-center">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
            <Sliders className="w-3.5 h-3.5 text-primary" />
            <span>Assistant Ingénieur Piste</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-3">
            Réglages <span className="text-gradient-primary">Châssis & Moteur</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
            Calculez et sauvegardez les réglages idéaux pour votre karting selon la météo et le tracé.
          </p>
        </motion.div>

        {/* Main Interactive Showcase Area */}
        <div className="relative rounded-3xl overflow-hidden border border-border bg-card/40 p-4 md:p-8">
          {/* MOCK BACKGROUND (Blurred & Non-interactive) */}
          <div
            className="filter blur-md opacity-30 pointer-events-none select-none grid grid-cols-1 lg:grid-cols-3 gap-6"
            aria-hidden="true"
          >
            {/* Fake Left Panel: Circuit & Weather */}
            <div className="space-y-6">
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <CloudSun className="w-5 h-5 text-primary" />
                    <span className="font-bold text-sm">Conditions Piste</span>
                  </div>
                  <Badge variant="outline" className="text-xs">Sèche</Badge>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Circuit:</span>
                    <span className="font-medium text-foreground">Angerville (1200m)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Temp. Air:</span>
                    <span className="font-medium text-foreground">22°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Temp. Piste:</span>
                    <span className="font-medium text-foreground">28°C</span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-border pb-3 font-bold text-sm">
                  <History className="w-4 h-4 text-primary" />
                  Mes Setups Sauvegardés
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded bg-muted/50 flex justify-between">
                    <span>Setup Sèche Finale</span>
                    <span className="text-muted-foreground">14/06/2026</span>
                  </div>
                  <div className="p-2 rounded bg-muted/50 flex justify-between">
                    <span>Setup Pluie Manches</span>
                    <span className="text-muted-foreground">02/05/2026</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fake Center Panel: Recommendations */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <h3 className="font-bold text-lg">Recommandations Châssis IA</h3>
                    <p className="text-xs text-muted-foreground">Calculé pour KZ2 / IAME X30</p>
                  </div>
                  <Button size="sm" variant="outline" className="gap-2">
                    <FileText className="w-4 h-4" /> Export PDF
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-background/80 border border-border">
                    <span className="text-muted-foreground block mb-1">Pression Froid</span>
                    <span className="font-bold text-sm text-primary">AV: 0.58 / AR: 0.55</span>
                  </div>
                  <div className="p-3 rounded-xl bg-background/80 border border-border">
                    <span className="text-muted-foreground block mb-1">Pression Chaud</span>
                    <span className="font-bold text-sm text-foreground">AV: 0.68 / AR: 0.65</span>
                  </div>
                  <div className="p-3 rounded-xl bg-background/80 border border-border">
                    <span className="text-muted-foreground block mb-1">Hauteur Caisse</span>
                    <span className="font-bold text-sm text-foreground">AV Std / AR Basse</span>
                  </div>
                  <div className="p-3 rounded-xl bg-background/80 border border-border">
                    <span className="text-muted-foreground block mb-1">Carrossage</span>
                    <span className="font-bold text-sm text-foreground">-1.5° (Neutre)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-background/80 border border-border">
                    <span className="text-muted-foreground block mb-1">Démultiplication</span>
                    <span className="font-bold text-sm text-foreground">12 x 82 (Ratio 6.83)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-background/80 border border-border">
                    <span className="text-muted-foreground block mb-1">Carburation</span>
                    <span className="font-bold text-sm text-foreground">Gicleur 162</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FOREGROUND OVERLAY (Crisp Net Information & CTA) */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-background/70 backdrop-blur-md">
            <div className="max-w-3xl w-full text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary font-semibold text-xs uppercase tracking-wider animate-pulse">
                <Lock className="w-4 h-4" />
                <span>Fonctionnalité Réservée aux Pilotes</span>
              </div>

              <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground">
                Débloquez votre <span className="text-gradient-primary">Ingénieur Virtuel</span>
              </h2>

              <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
                Accédez à l'outil complet de recommandations de réglages et exportez vos fiches de travail pour le paddock.
              </p>

              {/* Feature Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left my-6">
                <div className="p-4 rounded-xl bg-card border border-border/80 shadow-lg flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Gauge className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Recommandations IA</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Calcul dynamique des pressions à froid/chaud, hauteurs et alignement selon les températures.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-card border border-border/80 shadow-lg flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Fiche Piste PDF</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Exportez et imprimez une fiche technique complète et lisible à emporter dans votre paddock.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-card border border-border/80 shadow-lg flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Historique & Carnet</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enregistrez et comparez l'efficacité de tous vos réglages passés selon les circuits.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-card border border-border/80 shadow-lg flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Démultiplication & Carburation</h4>
                    <p className="text-sm text-muted-foreground text-xs mt-1">
                      Ajustez pignons, couronnes et gicleurs adaptés au profil rapide ou technique du tracé.
                    </p>
                  </div>
                </div>
              </div>

              {/* Call to Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <Link to="/login?mode=signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full gradient-primary text-primary-foreground font-semibold px-8 gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                    <Sparkles className="w-4 h-4" />
                    Créer mon compte
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/pricing" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full border-border hover:bg-muted text-foreground font-medium">
                    Voir les tarifs
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
