import { TrackMapPro } from "@/components/analysis/TrackMapPro";
import {
  DEMO_IDEAL_LAP,
  DEMO_RACING_LINE_META,
  DEMO_TRACK_EDGES,
  DEMO_TRAJECTORY_CORNERS,
  DEMO_TRAJECTORY_LAPS,
} from "../data/demoTrajectory";

/**
 * Étape 3 — « Tu sais quoi corriger ». Rien n'est redessiné ici : c'est la
 * « Carte du circuit » de l'app elle-même (bandeau Tour parfait IA, piste
 * colorée par la vitesse, virages numérotés, trajectoire jaune), alimentée par
 * la session de démo. Seule la vue Vitesse est proposée, et la carte est fixe
 * pour ne pas capter le défilement de la page.
 */
export default function MapScene(_props: { play?: boolean }) {
  return (
    <div className="mx-auto w-full max-w-[640px] py-2">
      <TrackMapPro
        corners={DEMO_TRAJECTORY_CORNERS}
        laps={DEMO_TRAJECTORY_LAPS}
        bestLapNumber={4}
        trackEdges={DEMO_TRACK_EDGES}
        racingLineMeta={DEMO_RACING_LINE_META}
        idealLap={DEMO_IDEAL_LAP}
        profiles={["speed"]}
        readOnly
      />
    </div>
  );
}
