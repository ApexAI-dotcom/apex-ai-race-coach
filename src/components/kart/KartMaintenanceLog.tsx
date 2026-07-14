import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { History, Wrench, Flame, Disc, Loader2, Plus, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { KartProfile } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function KartMaintenanceLog({
  history,
  profile,
  onAddEntry,
  onDeleteEntry,
  onResetComponent,
  onIgnoreAlert,
}: {
  history: any[];
  profile?: KartProfile;
  onAddEntry?: (type: string, notes: string, date: string) => void;
  onDeleteEntry?: (entryId: string) => void;
  onResetComponent?: (component: "engine" | "tires" | "brakes") => void;
  onIgnoreAlert?: (alertId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("general");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const handleSubmit = () => {
    if (onAddEntry && notes) {
      onAddEntry(type, notes, new Date(date).toISOString());
      setOpen(false);
      setNotes("");
    }
  };

  const ignoredAlerts = profile?.setup_json?.ignored_alerts || [];
  const recommendations: {
    id: string;
    component: "engine" | "tires" | "brakes";
    message: string;
    actionLabel: string;
    severity: "warning" | "critical";
  }[] = [];

  if (profile) {
    // Engine Wear
    if (profile.engine_hours_life && profile.engine_hours_current !== undefined && !ignoredAlerts.includes("engine_wear")) {
      const ratio = profile.engine_hours_current / profile.engine_hours_life;
      if (ratio >= 0.95) {
        recommendations.push({
          id: "engine_wear",
          component: "engine",
          message: `Révision haut-moteur critique requise (${profile.engine_hours_current.toFixed(1)}h / ${profile.engine_hours_life}h).`,
          actionLabel: "Marquer comme Révisé",
          severity: "critical",
        });
      } else if (ratio >= 0.80) {
        recommendations.push({
          id: "engine_wear",
          component: "engine",
          message: `Prévoir une révision haut-moteur prochainement (${profile.engine_hours_current.toFixed(1)}h / ${profile.engine_hours_life}h).`,
          actionLabel: "Marquer comme Révisé",
          severity: "warning",
        });
      }
    }

    // Tires Wear
    if (profile.tires_laps_life && profile.tires_laps_current !== undefined && !ignoredAlerts.includes("tires_wear")) {
      const ratio = profile.tires_laps_current / profile.tires_laps_life;
      if (ratio >= 0.95) {
        recommendations.push({
          id: "tires_wear",
          component: "tires",
          message: `Le train de pneus (${profile.tires_model || 'Standard'}) est usé (${profile.tires_laps_current} / ${profile.tires_laps_life} tours).`,
          actionLabel: "Remplacer le train",
          severity: "critical",
        });
      } else if (ratio >= 0.80) {
        recommendations.push({
          id: "tires_wear",
          component: "tires",
          message: `Le train de pneus (${profile.tires_model || 'Standard'}) approche de sa limite (${profile.tires_laps_current} / ${profile.tires_laps_life} tours).`,
          actionLabel: "Remplacer le train",
          severity: "warning",
        });
      }
    }

    // Brakes Wear
    if (profile.brakes_sessions_life && profile.brakes_sessions_current !== undefined && !ignoredAlerts.includes("brakes_wear")) {
      const ratio = profile.brakes_sessions_current / profile.brakes_sessions_life;
      if (ratio >= 0.95) {
        recommendations.push({
          id: "brakes_wear",
          component: "brakes",
          message: `Contrôle et remplacement urgent des plaquettes de freins (${profile.brakes_sessions_current} / ${profile.brakes_sessions_life} sessions).`,
          actionLabel: "Remplacer plaquettes",
          severity: "critical",
        });
      } else if (ratio >= 0.80) {
        recommendations.push({
          id: "brakes_wear",
          component: "brakes",
          message: `Vérifier l'usure des plaquettes de freins (${profile.brakes_sessions_current} / ${profile.brakes_sessions_life} sessions).`,
          actionLabel: "Remplacer plaquettes",
          severity: "warning",
        });
      }
    }
  }

  const renderHeader = () => (
    <div className="flex items-center justify-between pb-4">
      <CardTitle className="flex items-center gap-2 text-lg">
        <History className="w-5 h-5 text-primary" /> Journal d'Entretien
      </CardTitle>
      {onAddEntry && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 gap-1">
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nouvelle intervention</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type de composant</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Entretien général</SelectItem>
                    <SelectItem value="engine">Moteur</SelectItem>
                    <SelectItem value="tires">Pneus</SelectItem>
                    <SelectItem value="brakes">Freins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes / Détails</label>
                <Input
                  placeholder="ex: Nettoyage carbu, bougie neuve..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={!notes}>
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  const getIcon = (type: string) => {
    switch (type) {
      case "engine":
        return <Flame className="w-4 h-4 text-red-500" />;
      case "tires":
        return <Disc className="w-4 h-4 text-purple-500" />;
      case "brakes":
        return <Loader2 className="w-4 h-4 text-orange-500" />;
      default:
        return <Wrench className="w-4 h-4 text-gray-500" />;
    }
  };

  const getName = (type: string) => {
    switch (type) {
      case "engine":
        return "Moteur";
      case "tires":
        return "Train de Pneus";
      case "brakes":
        return "Freins";
      default:
        return type;
    }
  };

  return (
    <Card className="bg-card border-border shadow-sm h-full flex flex-col">
      <CardHeader className="pb-0">{renderHeader()}</CardHeader>
      <CardContent className="flex-1 pr-2 mt-4 space-y-4">
        {recommendations.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Recommandations d'Entretien ApexAI
            </h3>
            <div className="space-y-2">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border text-xs",
                    rec.severity === "critical"
                      ? "bg-red-500/10 border-red-500/20 text-red-200"
                      : "bg-orange-500/10 border-orange-500/20 text-orange-200"
                  )}
                >
                  <span className="font-medium">{rec.message}</span>
                  <div className="flex gap-2 items-center self-end sm:self-auto shrink-0">
                    {onResetComponent && (
                      <Button
                        size="sm"
                        variant="outline"
                        className={cn(
                          "h-7 text-[10px] px-2.5",
                          rec.severity === "critical"
                            ? "border-red-500/30 hover:bg-red-500/20 text-red-400 hover:text-red-300"
                            : "border-orange-500/30 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300"
                        )}
                        onClick={() => onResetComponent(rec.component)}
                      >
                        {rec.actionLabel}
                      </Button>
                    )}
                    {onIgnoreAlert && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[10px] px-2 text-muted-foreground hover:text-white"
                        onClick={() => onIgnoreAlert(rec.id)}
                      >
                        Ignorer
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-y-auto max-h-[300px] pr-2 custom-scrollbar space-y-4 pt-2">
          {!history || history.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-2 text-center">
              Aucune réparation ou révision consignée pour le moment.
            </p>
          ) : (
            history.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-3 rounded-xl bg-muted border border-border hover:bg-muted/80 transition-colors group"
              >
                <div className="p-2 rounded-full bg-background border border-border shadow-sm">
                  {getIcon(log.component_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">
                      Changement {getName(log.component_type)}
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), "dd MMM yyyy")}
                    </span>
                  </div>
                  {log.notes && <p className="text-xs text-muted-foreground mt-1">"{log.notes}"</p>}
                  {log.previous_hours !== null && log.previous_hours > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                      Moteur remis à zéro à {log.previous_hours.toFixed(1)}h
                    </p>
                  )}
                  {log.previous_sessions !== null &&
                    log.previous_sessions > 0 &&
                    log.component_type !== "engine" && (
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                        Durée : {log.previous_sessions} sessions
                      </p>
                    )}
                </div>
                {onDeleteEntry && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onDeleteEntry(log.id)}
                    title="Supprimer cette entrée"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
