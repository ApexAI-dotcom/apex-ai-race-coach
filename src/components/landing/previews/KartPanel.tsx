import { Disc, Flame, Loader2, Wrench } from "lucide-react";
import { AlertBanner } from "@/components/kart/AlertBanner";
import { KartHealthStatus } from "@/components/kart/KartHealthStatus";
import { KartSchematic } from "@/components/kart/KartSchematic";
import { WearGauge } from "@/components/kart/WearGauge";
import type { KartProfile } from "@/lib/api";

/**
 * « Mon Kart » : la page du garage, avec ses vrais composants — bandeau
 * d'alerte, schéma du kart, bilan santé et jauges d'usure. Les compteurs sont
 * ceux d'un kart d'exemple (aucune marque renseignée) : moteur et pneus neufs,
 * mais la chaîne approche de sa limite, ce qui déclenche l'alerte d'entretien.
 */
const DEMO_KART: KartProfile = {
  user_id: "demo",
  mon_kart_enabled: true,
  engine_hours_current: 2.4,
  engine_hours_life: 15,
  engine_sessions: 3,
  tires_sessions_current: 2,
  tires_laps_current: 14,
  tires_laps_life: 120,
  brakes_sessions_current: 90,
  brakes_sessions_life: 800,
  chain_hours_current: 16.4,
  chain_hours_life: 20,
  battery_voltage_last: 12.7,
  battery_voltage_min_ever: 12.4,
};

const noop = () => {};

export default function KartPanel() {
  return (
    <div className="space-y-4">
      <AlertBanner profile={DEMO_KART} />

      <div className="grid gap-4 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center rounded-2xl border border-border bg-card p-4">
            <KartSchematic profile={DEMO_KART} />
          </div>
          <KartHealthStatus profile={DEMO_KART} />
        </div>

        {/* Les jauges sont une illustration : pas de bouton qui ne mène nulle part */}
        <div className="pointer-events-none grid grid-cols-2 gap-4 self-start" aria-hidden="true">
          <WearGauge
            component="engine"
            label="Moteur"
            unit="h"
            icon={<Flame className="h-5 w-5 text-red-500" />}
            current={DEMO_KART.engine_hours_current}
            max={DEMO_KART.engine_hours_life}
            field="engine_hours_current"
            onUpdate={noop}
            onAction={noop}
            actionLabel="Réviser le moteur"
          />
          <WearGauge
            component="tires"
            label="Pneus"
            unit="tours"
            icon={<Disc className="h-5 w-5 text-purple-500" />}
            current={DEMO_KART.tires_laps_current}
            max={DEMO_KART.tires_laps_life}
            field="tires_laps_current"
            onUpdate={noop}
            onAction={noop}
            actionLabel="Remplacer le train"
          />
          <WearGauge
            component="brakes"
            label="Freins"
            unit="tours"
            icon={<Loader2 className="h-5 w-5 text-orange-500" />}
            current={DEMO_KART.brakes_sessions_current}
            max={DEMO_KART.brakes_sessions_life}
            field="brakes_sessions_current"
            onUpdate={noop}
            onAction={noop}
            actionLabel="Changer plaquettes"
          />
          <WearGauge
            component="chain"
            label="Chaîne"
            unit="h"
            icon={<Wrench className="h-5 w-5 text-blue-500" />}
            current={DEMO_KART.chain_hours_current}
            max={DEMO_KART.chain_hours_life}
            field="chain_hours_current"
            onUpdate={noop}
            onAction={noop}
            actionLabel="Graisser / Changer"
          />
        </div>
      </div>
    </div>
  );
}
