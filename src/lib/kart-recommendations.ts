import { KartProfile } from "./api";

export type DrivingProfile = "longevity" | "performance" | "balanced" | "leisure";

export interface SetupRecommendations {
  target_pressure: string;
  sprocket_ratio: string;
  notes: string;
}

export function getSetupRecommendations(profile: KartProfile): SetupRecommendations {
  const drivingProfile = profile.driving_profile || "balanced";
  const engine = profile.engine_model?.toLowerCase() || "";
  const tires = profile.tires_model?.toLowerCase() || "";

  let basePresF = 0.55;
  let basePresR = 0.55;
  let ratio = "12/82";
  let notes = "Setup équilibré standard.";

  // Ajustement Pneus
  if (tires.includes("komet") || tires.includes("k2h")) {
    basePresF = 0.60; basePresR = 0.60;
  } else if (tires.includes("vega")) {
    basePresF = 0.45; basePresR = 0.45;
  }

  // Ajustement Moteur
  if (engine.includes("x30") || engine.includes("iame")) {
    ratio = "11/80";
  } else if (engine.includes("rotax")) {
    ratio = "12/82";
  } else if (engine.includes("ok")) {
    ratio = "10/86";
  }

  // Ajustement Profil de Pilotage
  switch (drivingProfile) {
    case "longevity":
      notes = "Privilégie une pression légèrement plus haute pour limiter l'usure de la gomme. Évite les sur-régimes.";
      basePresF += 0.05; basePresR += 0.05;
      break;
    case "performance":
      notes = "Pression optimale pour le grip max (chrono). Surveille la montée en température. Rapport agressif.";
      basePresF -= 0.05; basePresR -= 0.05;
      // Optionnel: baisser une dent de couronne pour plus de pointe ou inversement.
      break;
    case "leisure":
      notes = "Conduite souple. Pressions standards. Ne cherche pas la limite thermique.";
      break;
    case "balanced":
    default:
      break;
  }

  return {
    target_pressure: `AV: ${basePresF.toFixed(2)}b | AR: ${basePresR.toFixed(2)}b`,
    sprocket_ratio: ratio,
    notes,
  };
}

export function getAlertThresholds(drivingProfile: DrivingProfile = "balanced") {
  // Return warning threshold ratio, critical threshold ratio, max EGT
  switch (drivingProfile) {
    case "longevity":
      return { warnLimit: 0.70, critLimit: 0.85, maxEgt: 580 };
    case "performance":
      return { warnLimit: 0.85, critLimit: 0.95, maxEgt: 620 };
    case "leisure":
      return { warnLimit: 0.75, critLimit: 0.90, maxEgt: 550 };
    case "balanced":
    default:
      return { warnLimit: 0.80, critLimit: 0.95, maxEgt: 600 };
  }
}
