import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { isWatched, onTaskDone, useBackgroundAnalysis } from "@/lib/backgroundAnalysis";

/**
 * Prévient le pilote quand une analyse lancée en arrière-plan se termine
 * alors qu'il navigue ailleurs dans l'app. Monté une fois, au niveau de l'app.
 */
export function BackgroundAnalysisNotifier() {
  const navigate = useNavigate();
  const { single } = useBackgroundAnalysis();

  useEffect(
    () =>
      onTaskDone((kind) => {
        if (isWatched(kind)) return;
        if (kind === "compare") {
          toast({
            title: "Comparaison prête",
            duration: 20000,
            description: "Les deux séances sont analysées.",
            action: (
              <ToastAction altText="Voir la comparaison" onClick={() => navigate("/upload?tab=compare")}>
                Voir
              </ToastAction>
            ),
          });
        }
      }),
    [navigate]
  );

  // Analyse simple : la séance est enregistrée dans Sessions, on y mène directement.
  useEffect(() => {
    if (!single || single.status === "running" || isWatched("single")) return;
    if (single.status === "done") {
      toast({
        title: "Ton analyse est prête",
        duration: 20000,
        description: single.sessionName || single.fileName,
        action: single.savedId ? (
          <ToastAction altText="Voir l'analyse" onClick={() => navigate(`/analysis/${single.savedId}`)}>
            Voir
          </ToastAction>
        ) : (
          <ToastAction altText="Voir l'analyse" onClick={() => navigate("/upload")}>
            Voir
          </ToastAction>
        ),
      });
    } else if (single.status === "error") {
      toast({
        title: "L'analyse n'a pas abouti",
        description: single.error,
        variant: "destructive",
        action: (
          <ToastAction altText="Revenir à Analyser" onClick={() => navigate("/upload")}>
            Revenir
          </ToastAction>
        ),
      });
    }
    // Une seule notification par analyse.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [single?.status]);

  return null;
}
