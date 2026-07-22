import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sliders, Disc3, Wrench, Gauge, Sparkles, FileText, History, Scale,
  MapPin, Cpu,
} from "lucide-react";
import { PreviewShell, PreviewFeature } from "@/components/preview/PreviewShell";

const FEATURES: PreviewFeature[] = [
  {
    icon: Sparkles,
    title: "Recommandations d'ingénieur",
    description:
      "Pressions, voies, chasse, arbre, transmission, carburation : ApexAI calcule un réglage de base pour CE circuit et CES conditions, avec l'explication physique de chaque choix.",
  },
  {
    icon: Disc3,
    title: "Pneu monté & pressions ciblées",
    description:
      "Le train monté depuis ton stock alimente les pressions à froid et à chaud selon les abaques constructeur (Vega, MG, LeCont…) et la météo.",
  },
  {
    icon: Scale,
    title: "Bilan des masses automatique",
    description:
      "Poids kart + pilote estimé depuis ton garage, marge de conformité au poids mini règlement, gestion du lest.",
  },
  {
    icon: FileText,
    title: "Fiche de réglages PDF",
    description:
      "Exporte une fiche A4 « Esprit Paddock » avec toutes tes constantes, à imprimer et annoter dans les stands.",
  },
];

/* Rendu réaliste (fausses données) de la page Réglages, affiché flouté en fond. */
function SetupMock() {
  const field = (label: string, value: string) => (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="h-9 rounded-lg border border-border bg-background/50 flex items-center px-3 text-sm text-foreground">{value}</div>
      <Badge className="bg-primary/10 text-primary border border-primary/20 rounded-full text-[9px]">Recommandation</Badge>
    </div>
  );
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Colonne gauche */}
      <div className="space-y-6">
        <Card className="p-5 bg-card border-border rounded-2xl">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
            <History className="w-5 h-5 text-primary" /><span className="font-semibold">Mes Réglages</span>
          </div>
          {["Qualif pluie — Adria", "Course sec — Le Mans", "Warm-up — Varennes"].map((s) => (
            <div key={s} className="py-3 border-b border-border/50">
              <p className="text-sm font-medium">{s}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> 19/07/2026</p>
            </div>
          ))}
        </Card>
        <Card className="p-5 bg-card border-border rounded-2xl">
          <div className="flex items-center gap-2 mb-3"><Scale className="w-5 h-5 text-primary" /><span className="font-semibold">Bilan Poids</span></div>
          <p className="text-3xl font-bold text-center">154 <span className="text-sm text-muted-foreground">kg</span></p>
          <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full mx-auto block w-fit mt-2">CONFORME · +4 kg</Badge>
        </Card>
      </div>

      {/* Colonne centrale */}
      <div className="space-y-6">
        <Card className="p-5 bg-card border-border rounded-2xl">
          <div className="flex items-center gap-2 mb-4"><MapPin className="w-5 h-5 text-primary" /><span className="font-semibold">Circuit</span></div>
          <p className="text-lg font-semibold">Adria Karting Raceway</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {["Rapide", "Horaire", "0 Épingle", "5 Courbes rapides"].map((t) => (
              <Badge key={t} className="bg-muted text-foreground border border-border rounded-full text-xs">{t}</Badge>
            ))}
          </div>
        </Card>
        <Card className="p-5 bg-card border-border rounded-2xl">
          <div className="flex items-center gap-2 mb-4"><Disc3 className="w-5 h-5 text-primary" /><span className="font-semibold">Pneumatiques</span></div>
          <div className="grid grid-cols-2 gap-4">
            {field("Pression AV", "0.72 bar")}
            {field("Pression AR", "0.70 bar")}
          </div>
        </Card>
      </div>

      {/* Colonne droite */}
      <div className="space-y-6">
        <Card className="p-5 bg-card border-border rounded-2xl">
          <div className="flex items-center gap-2 mb-4"><Wrench className="w-5 h-5 text-primary" /><span className="font-semibold">Châssis & Géométrie</span></div>
          <div className="grid grid-cols-2 gap-4">
            {field("Voie AV", "118 cm")}
            {field("Voie AR", "1400 mm")}
            {field("Chasse", "Neutre")}
            {field("Arbre", "Médium")}
          </div>
        </Card>
        <Card className="p-5 bg-card border-border rounded-2xl">
          <div className="flex items-center gap-2 mb-4"><Cpu className="w-5 h-5 text-primary" /><span className="font-semibold">Transmission</span></div>
          <div className="grid grid-cols-2 gap-4">
            {field("Pignon", "12 dents")}
            {field("Couronne", "79 dents")}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function SetupPreviewPage() {
  return (
    <PreviewShell
      meta={{
        title: "Réglages & Assistant Ingénieur IA | ApexAI",
        description: "Réglages de kart optimisés par un assistant ingénieur : pressions, géométrie, transmission et carburation selon la météo et le tracé.",
        path: "/setup",
      }}
      eyebrowIcon={Sliders}
      eyebrow="Assistant Ingénieur Piste"
      titleLead="Le réglage parfait,"
      titleAccent="calculé pour ta session"
      subtitle="Météo, grip, circuit mesuré, matériel de ton garage : ApexAI en déduit un réglage de base complet et t'explique le pourquoi de chaque choix — comme un ingénieur de course."
      mock={<SetupMock />}
      features={FEATURES}
      bullets={[
        "Un réglage adapté à chaque circuit et météo",
        "Recommandations expliquées, pas des chiffres bruts",
        "Fiche PDF prête pour le stand",
        "Historique de tous tes réglages",
      ]}
      ctaTitle="Débloque ton ingénieur de course"
      ctaSubtitle="Crée ton compte pour générer tes premiers réglages et les emporter en piste."
    />
  );
}

export default SetupPreviewPage;
