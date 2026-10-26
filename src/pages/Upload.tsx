import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { CSVUploader } from "@/components/upload/CSVUploader";
import { CompareUploader } from "@/components/compare/CompareUploader";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PageMeta } from "@/components/seo/PageMeta";
import CompatibleMarquee from "@/components/landing/CompatibleMarquee";
import { useAuth } from "@/hooks/useAuth";
import {
  FileSpreadsheet,
  Shield,
  Zap,
  BarChart3,
  TrendingUp,
  FolderOpen,
  Map as MapIcon,
  Gauge,
  Timer,
  MessageSquare,
} from "lucide-react";

const supportedFormats = [
  { name: "MyChron5", icon: BarChart3 },
  { name: "AiM", icon: TrendingUp },
  { name: "Autres boîtiers", icon: FolderOpen },
];

// Livrables réels du moteur d'analyse : chacun correspond à une section du
// rapport. Rien ici qui ne soit pas produit par le pipeline.
const deliverables = [
  {
    icon: MapIcon,
    title: "Carte du circuit et Tour Parfait IA",
    description:
      "Tes virages numérotés, la vitesse en dégradé et la ligne de course optimale calculée dans les limites de piste.",
  },
  {
    icon: Gauge,
    title: "Analyse des freinages",
    description:
      "Point de déclenchement, décélération de crête, temps mort et régularité — virage par virage.",
  },
  {
    icon: Timer,
    title: "Temps perdu par virage",
    description:
      "Le chrono de chaque mini-secteur comparé à ton meilleur passage. On ne t'annonce que des secondes mesurées.",
  },
  {
    icon: MessageSquare,
    title: "Conseils de coaching",
    description:
      "Hiérarchisés par gain réel, adaptés aux conditions de piste et au potentiel de ton kart, avec le tour de référence cité.",
  },
];

const features = [
  {
    icon: Zap,
    title: "Analyse en 3 secondes",
    description: "Notre IA traite tes données instantanément",
  },
  {
    icon: Shield,
    title: "Données sécurisées",
    description: "Tes fichiers sont chiffrés et privés",
  },
];

export default function Upload() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [params, setParams] = useSearchParams();
  const compare = params.get("mode") === "comparer";
  return (
    <Layout>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <PageMeta
        title="Analyse IA immédiate de ta session MyChron5 | ApexAI"
        description="Dépose ta session MyChron5 ou AiM : l'IA analyse tes points de corde et tes freinages. Score + coaching en 30 s."
        ogTitle="Analyse de session MyChron5 par l'IA ApexAI"
        path="/upload"
      />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Analyse ta <span className="text-gradient-primary">session</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Importe le fichier de ta session depuis ton boîtier d'acquisition et obtiens une analyse complète en
            quelques secondes.
          </p>
        </motion.div>

        {/* Analyse d'une séance, ou comparaison de deux fichiers */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-full border border-border bg-card p-1" role="tablist" aria-label="Type d'analyse">
            {[
              { key: false, label: "Analyser une séance" },
              { key: true, label: "Comparer deux pilotes" },
            ].map((o) => (
              <button
                key={o.label}
                role="tab"
                aria-selected={compare === o.key}
                onClick={() => setParams(o.key ? { mode: "comparer" } : {}, { replace: true })}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-2 text-[13px] transition-colors sm:px-4 sm:text-sm",
                  compare === o.key ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {compare ? (
          <div className="mx-auto mb-12 max-w-6xl">
            <p className="mx-auto mb-6 max-w-2xl text-center text-sm text-muted-foreground">
              Dépose ton fichier et celui d'un coéquipier sur le même circuit : tours superposés, écart mètre par mètre,
              et virage par virage, qui freine plus tard, qui garde plus de vitesse, qui sort plus fort.
            </p>
            <CompareUploader />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto mb-12">
            <CSVUploader />
          </div>
        )}

        {/* Boîtiers compatibles : la barre logos + mention légale pour un visiteur
            non connecté (même bloc que sur l'accueil), la liste simple sinon. */}
        {!authLoading && !isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <CompatibleMarquee />
          </motion.div>
        )}
        {isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto mb-12"
          >
            <h3 className="text-center text-sm font-medium text-muted-foreground mb-4">
              Formats supportés
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {supportedFormats.map((format) => {
                const Icon = format.icon;
                return (
                  <div
                    key={format.name}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border"
                  >
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="text-sm text-foreground">{format.name}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto"
        >
          {features.map((feature, index) => (
            <div key={feature.title} className="glass-card p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">{feature.title}</h4>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </motion.div>

        {/* Ce que l'analyse produit réellement — l'ancien tableau d'exemple
            affichait des lignes inventées, sans rapport avec la sortie du
            moteur : il occupait la page sans rien apprendre au pilote. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <h3 className="font-display font-semibold text-lg text-foreground mb-2 text-center">
            Ce que tu obtiens
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Chaque chiffre est mesuré sur tes tours. Rien n'est estimé.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {deliverables.map((item) => (
              <div key={item.title} className="glass-card p-5 flex gap-4">
                <div className="w-10 h-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-foreground text-sm mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground leading-snug">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
