import { KartHealthStatus } from "@/components/kart/KartHealthStatus";
import { KartSchematic } from "@/components/kart/KartSchematic";
import type { KartProfile } from "@/lib/api";

/**
 * « Mon Kart » : la colonne de gauche de la vraie page, telle quelle — le
 * schéma du kart et le bilan santé sont les composants de l'app. Les compteurs
 * sont ceux d'un kart quasi neuf, aucune marque n'est renseignée.
 */
const DEMO_KART: KartProfile = {
  user_id: "demo",
  mon_kart_enabled: true,
  engine_hours_current: 0,
  engine_hours_life: 15,
  engine_sessions: 0,
  tires_sessions_current: 0,
  tires_laps_current: 9,
  tires_laps_life: 120,
  brakes_sessions_current: 9,
  brakes_sessions_life: 800,
  chain_hours_current: 0.2,
  chain_hours_life: 20,
  battery_voltage_last: 12.7,
  battery_voltage_min_ever: 12.4,
};

export default function KartPanel() {
  return (
    <div className="grid items-center gap-4 sm:grid-cols-2">
      <div className="flex items-center justify-center rounded-2xl border border-border bg-card p-4">
        <KartSchematic profile={DEMO_KART} />
      </div>
      <KartHealthStatus profile={DEMO_KART} />
    </div>
  );
}
