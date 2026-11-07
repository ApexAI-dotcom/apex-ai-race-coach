/**
 * Kart d'exemple affiché en APERÇU de Mon Kart (comptes gratuits et
 * visiteurs) : la vraie page, avec de vraies jauges, sur un kart fictif.
 * Rien n'est enregistré ; chaque action propose de passer à Racer.
 */
import type { KartProfile, KartProfileResponse } from "./api";

const daysAgo = (n: number, h = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};

export const DEMO_PROFILE = {
  user_id: "demo",
  mon_kart_enabled: true,
  driving_profile: "balanced",
  chassis_brand: "Tony Kart",
  chassis_model: "Racer 401",
  chassis_year: 2024,
  engine_model: "Rotax Max Evo",
  engine_category: "Senior Max",
  acquisition_device: "AiM MyChron 6",
  brakes_model: "OTK BSS",
  tires_model: "Mojo D5",
  race_number: "42",
  engine_hours_current: 14.2,
  engine_hours_life: 20,
  engine_sessions: 31,
  tires_sessions_current: 9,
  tires_laps_current: 186,
  tires_laps_life: 240,
  brakes_sessions_current: 372,
  brakes_sessions_life: 400,
  chain_hours_current: 9.4,
  chain_hours_life: 10,
  battery_voltage_last: 12.6,
  battery_voltage_min_ever: 12.1,
  setup_json: {
    ignored_alerts: [],
    mounted_parts: {
      spark_plug: [
        { id: "demo-plug", brand: "NGK", name: "BR10ECM", category: "spark_plug", category_label: "Bougie", default_life: 10, life_unit: "hours", fitted_at: daysAgo(12) },
      ],
      chain: [
        { id: "demo-chain", brand: "Regina", name: "219 GP", category: "chain", category_label: "Chaîne", default_life: 10, life_unit: "hours", fitted_at: daysAgo(40) },
      ],
    },
  },
} as unknown as KartProfile;

export const DEMO_TIRE_SETS = [
  { id: "demo-a", label: "Slicks A", state: "use", custom_model: "Mojo D5", laps_current: 231, laps_life: 240, is_mounted: false, is_rain: false },
  { id: "demo-b", label: "Slicks B", state: "rode", custom_model: "Mojo D5", laps_current: 186, laps_life: 240, is_mounted: true, is_rain: false },
  { id: "demo-w", label: "Pluie", state: "neuf", custom_model: "Mojo W5", laps_current: 0, laps_life: 200, is_mounted: false, is_rain: true },
];

const session = (n: number, h: number, dur: number, laps: number, circuit: string) => ({
  id: `demo-s-${n}-${h}`,
  session_date: daysAgo(n, h),
  created_at: daysAgo(n, h),
  duration_hours: dur,
  laps_count: laps,
  rpm_max: 13800 + ((n * 37 + h * 11) % 400),
  water_temp_max: 52 + ((n + h) % 6),
  circuit_name: circuit,
});

export const DEMO_DATA: KartProfileResponse = {
  profile: DEMO_PROFILE,
  recent_sessions: [
    ...[9, 10, 11, 14, 15, 16].map((h, i) => session(5, h, 0.2, 11 + (i % 3), "Karting de Varennes-sur-Allier")),
    ...[10, 11, 14, 15, 16].map((h, i) => session(12, h, 0.19, 12 + (i % 2), "Circuit d'Ancenis")),
  ],
  history: [
    { id: "demo-h1", component_type: "brakes", notes: "[chain] Graissage et tension de la chaîne", created_at: daysAgo(4), previous_hours: null, previous_sessions: null },
    { id: "demo-h2", component_type: "brakes", notes: "[general] Bougie : NGK BR10ECM neuve", created_at: daysAgo(12), previous_hours: null, previous_sessions: null },
    { id: "demo-h3", component_type: "engine", notes: "Révision haut moteur (piston, segments)", created_at: daysAgo(48), previous_hours: 19.6, previous_sessions: null },
  ],
};
