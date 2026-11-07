/**
 * « À faire » de Mon Kart : une seule source pour tout ce que le pilote doit
 * faire sur son kart (avant : trois listes d'alertes qui se contredisaient).
 *
 * Chaque composant garde SON référentiel, choisi avec les pilotes :
 * - moteur et chaîne : heures de roulage (intervalles constructeurs) ;
 * - pneus : tours, sur le TRAIN MONTÉ (chaque train a sa propre vie) ;
 * - freins : tours (les plaquettes s'usent au freinage, donc aux tours).
 * Les seuils dépendent du profil de pilotage déclaré (longévité, équilibré,
 * performance, loisir).
 */
import type { KartProfile } from "./api";
import { getAlertThresholds } from "./kart-recommendations";

export type KartComponent = "engine" | "tires" | "brakes" | "chain";
export type TaskLevel = "critical" | "warning";

export interface KartTask {
  id: string;
  level: TaskLevel;
  component?: KartComponent;
  title: string;
  detail: string;
  /** Action principale : remet le compteur à zéro (après confirmation). */
  action?: KartComponent;
  actionLabel?: string;
}

/** Train de pneus tel que renvoyé par /api/kart/tire-sets. */
export interface TireSetLite {
  id: string;
  label?: string | null;
  is_mounted?: boolean;
  laps_current?: number | null;
  laps_life?: number | null;
}

const n1 = (v: number) => (Math.round(v * 10) / 10).toString().replace(".", ",");

/** Pneus : le train monté s'il existe, sinon le compteur global du profil. */
export function tireGauge(profile: KartProfile | null | undefined, mounted: TireSetLite | null) {
  if (mounted) {
    return {
      current: Number(mounted.laps_current ?? 0),
      life: Number(mounted.laps_life ?? 250),
      label: mounted.label ? `Train « ${mounted.label} »` : "Train monté",
      perSet: true,
    };
  }
  return {
    current: Number(profile?.tires_laps_current ?? 0),
    life: Number(profile?.tires_laps_life ?? 0) || 250,
    label: profile?.tires_model || null,
    perSet: false,
  };
}

/** Ce qui reste avant l'entretien, dans l'unité du composant. */
export function remainingLabel(current: number, life: number, unit: "h" | "tours"): string {
  const left = life - current;
  if (!life) return "";
  if (left <= 0) {
    const over = -left;
    return unit === "h" ? `Dépassé de ${n1(over)} h` : `Dépassé de ${Math.round(over)} tours`;
  }
  return unit === "h" ? `Encore ${n1(left)} h` : `Encore ${Math.round(left)} tours`;
}

export function computeKartTasks(
  profile: KartProfile,
  mountedTire: TireSetLite | null,
  recentSessions: { battery_voltage_min?: number | null; exhaust_temp_max?: number | null }[] = []
): KartTask[] {
  const { warnLimit, critLimit, maxEgt } = getAlertThresholds(profile.driving_profile);
  const ignored: string[] = profile.setup_json?.ignored_alerts || [];
  const tasks: KartTask[] = [];
  const level = (ratio: number): TaskLevel | null => (ratio >= critLimit ? "critical" : ratio >= warnLimit ? "warning" : null);

  // Moteur (heures)
  const eCur = Number(profile.engine_hours_current ?? 0);
  const eLife = Number(profile.engine_hours_life ?? 0);
  if (eLife > 0 && !ignored.includes("engine_wear")) {
    const lv = level(eCur / eLife);
    if (lv) {
      tasks.push({
        id: "engine_wear",
        level: lv,
        component: "engine",
        title: lv === "critical" ? "Révision moteur à faire" : "Révision moteur à prévoir",
        detail: `${n1(eCur)} h sur ${n1(eLife)} h · ${remainingLabel(eCur, eLife, "h").toLowerCase()}`,
        action: "engine",
        actionLabel: "Révision faite",
      });
    }
  }

  // Pneus (tours, train monté)
  const t = tireGauge(profile, mountedTire);
  if (t.life > 0 && !ignored.includes("tires_wear")) {
    const lv = level(t.current / t.life);
    if (lv) {
      tasks.push({
        id: "tires_wear",
        level: lv,
        component: "tires",
        title: lv === "critical" ? "Pneus en fin de vie" : "Pneus : l'adhérence baisse",
        detail: `${t.label ? `${t.label} · ` : ""}${Math.round(t.current)} tours sur ${Math.round(t.life)}`,
        action: "tires",
        actionLabel: "Train remplacé",
      });
    }
  }

  // Freins (tours)
  const bCur = Number(profile.brakes_sessions_current ?? 0);
  const bLife = Number(profile.brakes_sessions_life ?? 0);
  if (bLife > 0 && !ignored.includes("brakes_wear")) {
    const lv = level(bCur / bLife);
    if (lv) {
      tasks.push({
        id: "brakes_wear",
        level: lv,
        component: "brakes",
        title: lv === "critical" ? "Plaquettes à changer" : "Plaquettes à contrôler",
        detail: `${Math.round(bCur)} tours sur ${Math.round(bLife)} · ${remainingLabel(bCur, bLife, "tours").toLowerCase()}`,
        action: "brakes",
        actionLabel: "Plaquettes changées",
      });
    }
  }

  // Chaîne (heures)
  const cCur = Number(profile.chain_hours_current ?? 0);
  const cLife = Number(profile.chain_hours_life ?? 0);
  if (cLife > 0 && !ignored.includes("chain_wear")) {
    const lv = level(cCur / cLife);
    if (lv) {
      tasks.push({
        id: "chain_wear",
        level: lv,
        component: "chain",
        title: lv === "critical" ? "Chaîne à remplacer" : "Chaîne : contrôle et tension",
        detail: `${n1(cCur)} h sur ${n1(cLife)} h · ${remainingLabel(cCur, cLife, "h").toLowerCase()}`,
        action: "chain",
        actionLabel: "Chaîne remplacée",
      });
    }
  }

  // Batterie du kart (12 V). Une valeur sous 8 V n'est pas une batterie de
  // kart (pile interne du boîtier lue à tort par d'anciens imports) : ignorée.
  const plausible = (v?: number | null) => v != null && v >= 8 && v <= 16;
  if (plausible(profile.battery_voltage_last) && profile.battery_voltage_last! < 11.5 && !ignored.includes("battery_low")) {
    tasks.push({
      id: "battery_low",
      level: "critical",
      title: "Batterie faible",
      detail: `${n1(profile.battery_voltage_last!)} V à la dernière journée : recharge-la avant de rouler.`,
    });
  }
  const last = recentSessions[0];
  if (last && plausible(last.battery_voltage_min) && last.battery_voltage_min! < 11.2 && !ignored.includes("battery_chute")) {
    tasks.push({
      id: "battery_chute",
      level: "critical",
      title: "Chute de tension en roulage",
      detail: `Descendue à ${n1(last.battery_voltage_min!)} V pendant la dernière séance : vérifie la charge et les connexions.`,
    });
  }
  if (last?.exhaust_temp_max && last.exhaust_temp_max > maxEgt && !ignored.includes("exhaust_surchauffe")) {
    tasks.push({
      id: "exhaust_surchauffe",
      level: "warning",
      title: "Échappement trop chaud",
      detail: `${Math.round(last.exhaust_temp_max)} °C à la dernière séance (repère : ${maxEgt} °C). Carburation trop pauvre ?`,
    });
  }

  const rank = { critical: 0, warning: 1 } as const;
  return tasks.sort((a, b) => rank[a.level] - rank[b.level]);
}
