import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { KartComponent } from "@/lib/kartTasks";

export type ComponentActionMode = "reset" | "log";

const n1 = (v: number) => (Math.round(v * 10) / 10).toString().replace(".", ",");

/**
 * Confirmation d'une intervention depuis une jauge ou la liste « À faire » :
 * ce qui va se passer est dit en clair (compteur remis à zéro, ligne au
 * carnet). La chaîne distingue graissage (au carnet, compteur conservé) et
 * remplacement ; les pneus renvoient au stock quand des trains existent.
 */
export function ComponentActionDialog({
  component,
  current,
  unit,
  tireSetLabel,
  onClose,
  onConfirm,
  onGoToTireStock,
}: {
  component: KartComponent | null;
  current: number;
  unit: "h" | "tours";
  tireSetLabel?: string | null;
  onClose: () => void;
  onConfirm: (component: KartComponent, mode: ComponentActionMode) => void;
  onGoToTireStock?: () => void;
}) {
  if (!component) return null;
  const amount = unit === "h" ? `${n1(current)} h` : `${Math.round(current)} tours`;
  const copy: Record<KartComponent, { title: string; body: string; confirm: string }> = {
    engine: {
      title: "Révision moteur faite ?",
      body: `Le compteur moteur repart de zéro. Les ${amount} actuelles sont gardées dans le carnet d'entretien.`,
      confirm: "Révision faite",
    },
    brakes: {
      title: "Plaquettes changées ?",
      body: `Le compteur des freins repart de zéro (${amount} gardés dans le carnet).`,
      confirm: "Plaquettes changées",
    },
    chain: {
      title: "Qu'as-tu fait sur la chaîne ?",
      body: `Un graissage s'inscrit au carnet sans toucher au compteur. Une chaîne neuve remet le compteur à zéro (${amount} gardées dans le carnet).`,
      confirm: "Chaîne remplacée",
    },
    tires: {
      title: tireSetLabel ? `${tireSetLabel} usé ?` : "Train de pneus remplacé ?",
      body: tireSetLabel
        ? "Chaque train garde son propre compteur : monte un autre train dans le Stock de pneus. Tu peux aussi remettre ce train à zéro s'il a été regommé ou si le compteur était faux."
        : `Le compteur des pneus repart de zéro (${amount} gardés dans le carnet). Astuce : déclare tes trains dans le Stock de pneus pour suivre chacun séparément.`,
      confirm: tireSetLabel ? "Remettre ce train à zéro" : "Train remplacé",
    },
  };
  const c = copy[component];

  return (
    <AlertDialog open onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{c.title}</AlertDialogTitle>
          <AlertDialogDescription>{c.body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:flex-wrap">
          <AlertDialogCancel className="mt-0">Annuler</AlertDialogCancel>
          {component === "chain" && (
            <Button variant="outline" onClick={() => onConfirm("chain", "log")}>
              Graissée et tendue
            </Button>
          )}
          {component === "tires" && tireSetLabel && onGoToTireStock && (
            <Button variant="outline" onClick={onGoToTireStock}>
              Monter un autre train
            </Button>
          )}
          <AlertDialogAction onClick={() => onConfirm(component, "reset")}>{c.confirm}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
