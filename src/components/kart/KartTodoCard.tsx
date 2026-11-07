import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { KartComponent, KartTask } from "@/lib/kartTasks";

const IGNORED_LABELS: Record<string, string> = {
  engine_wear: "Moteur",
  tires_wear: "Pneus",
  brakes_wear: "Freins",
  chain_wear: "Chaîne",
  battery_low: "Batterie",
  battery_chute: "Chute de tension",
  exhaust_surchauffe: "Échappement",
};

/**
 * « À faire maintenant » : ce que le pilote doit faire sur son kart avant sa
 * prochaine sortie, trié par urgence, avec l'action en un geste (« Révision
 * faite » remet la jauge à zéro et l'inscrit au carnet). Remplace les trois
 * listes d'alertes qui existaient (bandeau, journal, recommandations).
 */
export function KartTodoCard({
  tasks,
  ignored,
  onDone,
  onIgnore,
  onUnignore,
  readOnly = false,
}: {
  tasks: KartTask[];
  ignored: string[];
  onDone: (component: KartComponent) => void;
  onIgnore: (id: string) => void;
  onUnignore: (id: string) => void;
  readOnly?: boolean;
}) {
  const hidden = ignored.filter((id) => IGNORED_LABELS[id]);

  return (
    <div className="flex flex-col gap-2">
      {tasks.length === 0 ? (
        <div className="flex items-center gap-4 rounded-xl border border-green-500/20 bg-green-500/10 px-5 py-4 shadow-sm sm:px-6">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-green-500" />
          <span className="font-medium text-green-500">Rien à faire : tous les composants sont en bon état. Prêt pour la piste.</span>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-foreground">À faire avant ta prochaine sortie</h2>
            <span className="shrink-0 text-xs text-muted-foreground">
              {tasks.length} point{tasks.length > 1 ? "s" : ""}
            </span>
          </div>
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li
                key={t.id}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
                  t.level === "critical" ? "border-red-500/25 bg-red-500/10" : "border-orange-500/25 bg-orange-500/10"
                )}
              >
                <div className="flex min-w-0 items-start gap-3">
                  {t.level === "critical" ? (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                  ) : (
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                  )}
                  <div className="min-w-0">
                    <p className={cn("font-semibold", t.level === "critical" ? "text-red-500" : "text-orange-500")}>{t.title}</p>
                    <p className="text-sm text-muted-foreground">{t.detail}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                  {t.action && t.actionLabel && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 border-white/15 bg-white/5 hover:bg-white/10"
                      onClick={() => onDone(t.action!)}
                      disabled={readOnly}
                    >
                      {t.actionLabel}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => onIgnore(t.id)}
                    disabled={readOnly}
                  >
                    Ignorer
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hidden.length > 0 && !readOnly && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <span className="font-semibold">Alertes masquées :</span>
          {hidden.map((id) => (
            <Badge
              key={id}
              variant="outline"
              className="flex cursor-pointer items-center gap-1 border-border bg-background px-2 py-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => onUnignore(id)}
            >
              {IGNORED_LABELS[id]} <span className="text-[10px] text-primary">×</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
