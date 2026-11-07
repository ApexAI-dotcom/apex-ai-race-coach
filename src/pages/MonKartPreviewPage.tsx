import { Wrench, Disc, Disc3, Flame, Activity, Cpu, HeartPulse, CircleDot } from "lucide-react";
import { KartSchematic } from "@/components/kart/KartSchematic";
import { KartHealthStatus } from "@/components/kart/KartHealthStatus";
import { KartTodoCard } from "@/components/kart/KartTodoCard";
import { WearGauge } from "@/components/kart/WearGauge";
import { DEMO_PROFILE } from "@/lib/kartDemo";
import { computeKartTasks, remainingLabel } from "@/lib/kartTasks";
import { PreviewShell, PreviewFeature } from "@/components/preview/PreviewShell";
import { GarageVisual, HealthAlertsVisual, TireStockVisual, WearVisual } from "@/components/preview/visuals/KartVisuals";

const FEATURES: PreviewFeature[] = [
  {
    icon: Activity,
    title: "Suivi d'usure automatique",
    description:
      "Importe tes fichiers de télémétrie : ApexAI décompte tout seul les heures moteur, les tours pneus, l'usure freins et la chaîne. Plus de carnet papier.",
    visual: WearVisual,
  },
  {
    icon: Disc3,
    title: "Stock de trains de pneus",
    description:
      "Déclare tes trains (neuf, rodé, pluie), suis leur usure individuelle, et ApexAI recommande lequel monter selon la session — warm-up, qualif ou course.",
    visual: TireStockVisual,
  },
  {
    icon: HeartPulse,
    title: "Santé du kart en un coup d'œil",
    description:
      "Un score d'état global et des alertes avant la casse : révision moteur qui approche, plaquettes à contrôler, batterie faible.",
    visual: HealthAlertsVisual,
  },
  {
    icon: Cpu,
    title: "Garage complet",
    description:
      "Châssis, moteur, freins, acquisition : ton matériel est catalogué avec ses données constructeur (durées de vie, poids) qui alimentent tes réglages.",
    visual: GarageVisual,
  },
];

/*
 * Fond flouté : la VRAIE page Mon Kart (schéma, bilan de santé, « À faire »,
 * jauges rondes) sur un kart d'exemple, pour que l'aperçu ressemble exactement
 * à ce que le pilote aura (et aux visuels de nos communications).
 */
function MonKartMock() {
  const p = DEMO_PROFILE;
  const tasks = computeKartTasks(p, null, []);
  const noop = () => undefined;
  const g = (label: string, unit: "h" | "tours", cur: number, life: number, icon: JSX.Element, actionLabel: string) => (
    <WearGauge
      component={label}
      label={label}
      unit={unit}
      icon={icon}
      current={cur}
      max={life}
      hint={remainingLabel(cur, life, unit)}
      field=""
      onUpdate={noop}
      onAction={noop}
      actionLabel={actionLabel}
      readOnly
    />
  );
  return (
    <div className="space-y-6">
      <KartTodoCard tasks={tasks} ignored={[]} onDone={noop} onIgnore={noop} onUnignore={noop} readOnly />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-5 xl:col-span-4">
          <div className="flex items-center justify-center rounded-2xl border border-border bg-card p-4 shadow-sm">
            <KartSchematic profile={p} recent_sessions={[]} />
          </div>
          <KartHealthStatus profile={p} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7 xl:col-span-8">
          {g("Moteur", "h", p.engine_hours_current, p.engine_hours_life ?? 20, <Flame className="h-5 w-5 text-primary" />, "Réviser le moteur")}
          {g("Pneus", "tours", p.tires_laps_current ?? 0, p.tires_laps_life ?? 240, <Disc className="h-5 w-5 text-primary" />, "Changer de train")}
          {g("Freins", "tours", p.brakes_sessions_current, p.brakes_sessions_life ?? 400, <CircleDot className="h-5 w-5 text-primary" />, "Changer les plaquettes")}
          {g("Chaîne", "h", p.chain_hours_current ?? 0, p.chain_hours_life ?? 10, <Wrench className="h-5 w-5 text-primary" />, "Graisser / Changer")}
        </div>
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
      subtitle="Importe tes journées de roulage et laisse ApexAI suivre l'usure de chaque composant, gérer ton stock de pneus et te dire quoi faire avant chaque sortie, automatiquement."
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
