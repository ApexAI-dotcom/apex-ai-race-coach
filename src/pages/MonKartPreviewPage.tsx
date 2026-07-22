import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wrench, Gauge, Disc3, Flame, Shield, UploadCloud, Activity, CircleCheck,
  Cpu, HeartPulse,
} from "lucide-react";
import { PreviewShell, PreviewFeature } from "@/components/preview/PreviewShell";

const FEATURES: PreviewFeature[] = [
  {
    icon: Activity,
    title: "Suivi d'usure automatique",
    description:
      "Importe tes fichiers de télémétrie : ApexAI décompte tout seul les heures moteur, les tours pneus, l'usure freins et la chaîne. Plus de carnet papier.",
  },
  {
    icon: Disc3,
    title: "Stock de trains de pneus",
    description:
      "Déclare tes trains (neuf, rodé, pluie), suis leur usure individuelle, et ApexAI recommande lequel monter selon la session — warm-up, qualif ou course.",
  },
  {
    icon: HeartPulse,
    title: "Santé du kart en un coup d'œil",
    description:
      "Un score d'état global et des alertes avant la casse : révision moteur qui approche, plaquettes à contrôler, batterie faible.",
  },
  {
    icon: Cpu,
    title: "Garage complet",
    description:
      "Châssis, moteur, freins, acquisition : ton matériel est catalogué avec ses données constructeur (durées de vie, poids) qui alimentent tes réglages.",
  },
];

/* Rendu réaliste (fausses données) de la page Mon Kart, affiché flouté en fond. */
function MonKartMock() {
  const gauge = (label: string, value: string, pct: number, color: string) => (
    <Card className="p-4 bg-card border-border rounded-2xl text-center">
      <div className="relative w-16 h-16 mx-auto mb-2">
        <div className="absolute inset-0 rounded-full border-4 border-border" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent" style={{ borderTopColor: color, transform: `rotate(${pct * 3.6}deg)` }} />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">{value}</div>
      </div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </Card>
  );
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Colonne gauche : santé + identité */}
      <div className="lg:col-span-5 space-y-4">
        <Card className="p-6 bg-card border-border rounded-2xl text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Bilan Santé Global</p>
          <p className="text-5xl font-bold text-emerald-500">92</p>
          <p className="text-xs text-muted-foreground mt-1">Score d'état</p>
        </Card>
        <Card className="p-5 bg-card border-border rounded-2xl space-y-3">
          <div className="flex items-center gap-2 mb-2"><Shield className="w-5 h-5 text-primary" /><span className="font-semibold">Identité du Kart</span></div>
          {[["Châssis", "Sodi Sigma RS3"], ["Moteur", "Rotax Max DD2"], ["Freins", "Brembo MA5"], ["Pneu monté", "Train 1 · Vega XH3"]].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-1.5 border-b border-border/50 text-sm">
              <span className="text-muted-foreground">{k}</span><span className="font-semibold">{v}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Colonne droite : jauges + import + stock */}
      <div className="lg:col-span-7 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {gauge("Moteur", "9h", 60, "#ef4444")}
          {gauge("Pneus", "120", 45, "#f59e0b")}
          {gauge("Freins", "OK", 80, "#10b981")}
        </div>
        <Card className="p-5 bg-card border-border rounded-2xl">
          <div className="flex items-center gap-2 mb-3"><UploadCloud className="w-5 h-5 text-primary" /><span className="font-semibold">Importer ma journée</span></div>
          <div className="h-10 rounded-lg border border-dashed border-border bg-background/40" />
        </Card>
        <Card className="p-5 bg-card border-border rounded-2xl">
          <div className="flex items-center gap-2 mb-3"><Disc3 className="w-5 h-5 text-primary" /><span className="font-semibold">Stock de Pneus</span></div>
          <div className="flex items-center gap-2 p-3 rounded-xl border border-primary/40 bg-primary/5 mb-2">
            <Badge className="bg-primary text-primary-foreground border-0 rounded-full text-[10px] gap-1"><CircleCheck className="w-3 h-3" />Monté</Badge>
            <span className="text-sm font-semibold">Train 1</span>
            <span className="text-xs text-muted-foreground">Vega Vert · 120/300 tours</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl border border-border bg-background/40">
            <span className="text-sm font-semibold">Train Pluie</span>
            <Badge className="bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full text-[10px]">Pluie</Badge>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function MonKartPreviewPage() {
  return (
    <PreviewShell
      meta={{
        title: "Mon Kart — Garage numérique & suivi d'usure | ApexAI",
        description: "Le carnet d'ingénieur de ton kart : suivi automatique de l'usure moteur, pneus, freins, stock de trains et santé mécanique depuis ta télémétrie.",
        path: "/mon-kart",
      }}
      eyebrowIcon={Wrench}
      eyebrow="Le carnet d'ingénieur de ton kart"
      titleLead="Ton garage numérique,"
      titleAccent="toujours à jour"
      subtitle="Importe ta télémétrie et laisse ApexAI suivre l'usure de chaque composant, gérer ton stock de pneus et veiller sur la santé mécanique de ton kart — automatiquement."
      mock={<MonKartMock />}
      features={FEATURES}
      bullets={[
        "Usure moteur, pneus, freins comptée automatiquement",
        "Stock de trains de pneus et pneu monté",
        "Alertes d'entretien avant la casse",
        "Ces données nourrissent tes réglages",
      ]}
      ctaTitle="Ouvre ton garage ApexAI"
      ctaSubtitle="Crée ton compte pour configurer ton kart et suivre son usure au fil des sessions."
    />
  );
}

export default MonKartPreviewPage;
