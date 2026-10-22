import { useState } from "react";
import { Cloud, CloudRain, Sun } from "lucide-react";
import { ChassisSetupCard } from "@/components/setup/ChassisSetupCard";
import { TireSetupCard } from "@/components/setup/TireSetupCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { SetupState } from "@/pages/SetupPage";
import { generateRecommendations, type Recommendation } from "@/utils/advisorEngine";

/**
 * « Réglages » : les cartes Pneumatiques et Châssis de la vraie page, remplies
 * par le VRAI moteur de conseils de l'app. Change la météo et les valeurs se
 * recalculent (pressions, voies, hauteurs, géométrie, arbre) ; les pastilles
 * « Recommandation » ouvrent l'explication. Piste normale, sans circuit ni
 * matériel renseigné : ce sont les valeurs de base.
 */

type Weather = SetupState["weather"];

const RECS: Record<Weather, Record<string, Recommendation>> = {
  sec: recsFor("sec"),
  humide: recsFor("humide"),
  pluie: recsFor("pluie"),
};

function recsFor(weather: Weather) {
  return generateRecommendations({ weather, trackTemp: "", grip: "normal", circuit: null, totalWeight: 0 });
}

function stateFor(weather: Weather): SetupState {
  const r = RECS[weather];
  const v = (field: string) => r[field]?.suggestedValue ?? r[field]?.value ?? "";
  const n = (field: string) => (v(field) === "" ? "" : Number(v(field)));
  return {
    weather,
    grip: "normal",
    airTemp: "",
    trackTemp: "",
    mode: "course",
    circuit: null,
    tireModel: "Pneu sec",
    coldPressureFront: n("coldPressureFront"),
    coldPressureRear: n("coldPressureRear"),
    hotPressureFront: n("hotPressureFront"),
    hotPressureRear: n("hotPressureRear"),
    trackWidthFront: n("trackWidthFront"),
    trackWidthRear: n("trackWidthRear"),
    rideHeightFront: String(v("rideHeightFront")),
    rideHeightRear: String(v("rideHeightRear")),
    camber: String(v("camber")),
    caster: String(v("caster")),
    rearAxle: String(v("rearAxle")),
    sprocketFront: "",
    sprocketRear: "",
    carbConfig: {},
    driverWeight: "",
    kartWeight: "",
    targetWeight: "",
    ballast: "",
  };
}

const TIRE_SETS = [{ id: "demo-1", label: "Train 1", custom_model: "Pneu sec", is_mounted: true }];

const TAB =
  "-mb-px rounded-none border-b-2 border-transparent bg-transparent px-1 pb-2.5 pt-0 text-sm font-medium text-muted-foreground shadow-none transition-colors " +
  "hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none";

export default function SetupPanel() {
  const [state, setState] = useState<SetupState>(() => stateFor("sec"));
  const weather = state.weather;

  // Une nouvelle météo = de nouvelles recommandations, appliquées aux champs.
  const onWeather = (w: string) => {
    if (w && w !== weather) setState(stateFor(w as Weather));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-sm text-muted-foreground">Conditions météo</span>
        <ToggleGroup type="single" value={weather} onValueChange={onWeather} className="justify-start">
          <ToggleGroupItem value="sec" aria-label="Sec" className="gap-2">
            <Sun className="h-4 w-4" /> Sec
          </ToggleGroupItem>
          <ToggleGroupItem value="humide" aria-label="Humide" className="gap-2">
            <Cloud className="h-4 w-4" /> Humide
          </ToggleGroupItem>
          <ToggleGroupItem value="pluie" aria-label="Pluie" className="gap-2">
            <CloudRain className="h-4 w-4" /> Pluie
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Tabs defaultValue="pneus">
        <TabsList className="flex h-auto w-full justify-start gap-6 rounded-none border-b border-white/10 bg-transparent p-0">
          <TabsTrigger value="pneus" className={TAB}>
            Pneumatiques
          </TabsTrigger>
          <TabsTrigger value="chassis" className={TAB}>
            Châssis & géométrie
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pneus" className="mt-4">
          <TireSetupCard
            state={state}
            onChange={(u) => setState((s) => ({ ...s, ...u }))}
            recommendations={RECS[weather]}
            tireSets={TIRE_SETS}
          />
        </TabsContent>
        <TabsContent value="chassis" className="mt-4">
          <ChassisSetupCard
            state={state}
            onChange={(u) => setState((s) => ({ ...s, ...u }))}
            recommendations={RECS[weather]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
