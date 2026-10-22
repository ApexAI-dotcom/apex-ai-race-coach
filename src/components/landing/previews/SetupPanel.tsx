import { useState } from "react";
import { TireSetupCard } from "@/components/setup/TireSetupCard";
import type { SetupState } from "@/pages/SetupPage";
import { generateRecommendations } from "@/utils/advisorEngine";

/**
 * « Réglages » : la carte Pneumatiques de la vraie page, avec ses pastilles
 * « Recommandation » (cliquables : elles ouvrent la fiche d'analyse). Les
 * champs restent modifiables.
 */

// Les recommandations viennent du VRAI moteur de conseils de l'app (même texte,
// mêmes valeurs) pour une piste sèche, sans pneu ni circuit renseigné.
const RECOMMENDATIONS = generateRecommendations({
  weather: "sec",
  trackTemp: "",
  grip: "normal",
  circuit: null,
  totalWeight: 0,
});

const val = (field: string) => Number(RECOMMENDATIONS[field]?.suggestedValue ?? RECOMMENDATIONS[field]?.value ?? "");

const INITIAL: SetupState = {
  weather: "sec",
  grip: "normal",
  airTemp: "",
  trackTemp: "",
  mode: "course",
  circuit: null,
  tireModel: "Pneu sec",
  coldPressureFront: val("coldPressureFront"),
  coldPressureRear: val("coldPressureRear"),
  hotPressureFront: val("hotPressureFront"),
  hotPressureRear: val("hotPressureRear"),
  trackWidthFront: "",
  trackWidthRear: "",
  rideHeightFront: "",
  rideHeightRear: "",
  camber: "",
  caster: "",
  rearAxle: "",
  sprocketFront: "",
  sprocketRear: "",
  carbConfig: null,
  driverWeight: "",
  kartWeight: "",
  targetWeight: "",
  ballast: "",
};

const TIRE_SETS = [{ id: "demo-1", label: "Train 1", custom_model: "Pneu sec", is_mounted: true }];

export default function SetupPanel() {
  const [state, setState] = useState<SetupState>(INITIAL);
  return (
    <TireSetupCard
      state={state}
      onChange={(u) => setState((s) => ({ ...s, ...u }))}
      recommendations={RECOMMENDATIONS}
      tireSets={TIRE_SETS}
    />
  );
}
