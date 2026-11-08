import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { History, Wrench, Flame, Disc, Loader2, Plus, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KartProfile, searchParts, type CatalogPart } from "@/lib/api";
import { partLabel, wearComponentOf } from "./parts/partComponent";
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
  prefillPart,
  onPrefillConsumed,
  onPartFitted,
  onPartMounted,
  embedded = false,
}: {
  history: any[];
  profile?: KartProfile;
  onAddEntry?: (type: string, notes: string, date: string) => void;
  onDeleteEntry?: (entryId: string) => void;
  onResetComponent?: (component: "engine" | "tires" | "brakes" | "chain") => void;
  onIgnoreAlert?: (alertId: string) => void;
  /** Pièce choisie dans le catalogue (« Je monte cette pièce ») : ouvre le formulaire pré-rempli. */
  prefillPart?: CatalogPart | null;
  onPrefillConsumed?: () => void;
  /** Pièce montée : remise à zéro du compteur et durée de vie du catalogue. */
  onPartFitted?: (component: "engine" | "tires" | "brakes" | "chain", part: CatalogPart) => void;
  /** Toute pièce du catalogue montée : historique « Pièces montées ». */
  onPartMounted?: (part: CatalogPart, date: string) => void;
  /** Dans le carnet d'entretien (onglet) : sans cadre ni titre. */
  embedded?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("general");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  // Boucle mécano : la pièce montée vient du catalogue.
  const [part, setPart] = useState<CatalogPart | null>(null);
  const [partQ, setPartQ] = useState("");
  const [partResults, setPartResults] = useState<CatalogPart[]>([]);
  const [resetCounter, setResetCounter] = useState(true);

  const choosePart = (p: CatalogPart) => {
    setPart(p);
    setPartQ("");
    setPartResults([]);
    const c = wearComponentOf(p.category);
    setType(c === "chain" ? "general" : c);
    setNotes((n) => n || `Montage : ${partLabel(p)}`);
  };

  useEffect(() => {
    if (!prefillPart) return;
    choosePart(prefillPart);
    setOpen(true);
    onPrefillConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillPart]);

  useEffect(() => {
    const q = partQ.trim();
    if (q.length < 2) {
      setPartResults([]);
      return;
    }
    let alive = true;
    const t = window.setTimeout(() => {
      searchParts(q, undefined, 6)
        .then((r) => alive && setPartResults(r.parts))
        .catch(() => alive && setPartResults([]));
    }, 220);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [partQ]);

  const handleSubmit = () => {
    if (onAddEntry && notes) {
      onAddEntry(type, notes, new Date(date).toISOString());
      const c = part ? wearComponentOf(part.category) : "general";
      if (part && resetCounter && c !== "general") onPartFitted?.(c, part);
      if (part) onPartMounted?.(part, new Date(date).toISOString());
      setOpen(false);
      setNotes("");
      setPart(null);
      setResetCounter(true);
    }
  };

  const renderHeader = () => (
    <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
      {embedded ? (
        <p className="text-sm text-muted-foreground">Révisions, réglages, pièces montées : tout ce que tu fais sur le kart.</p>
      ) : (
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="w-5 h-5 text-primary" /> Journal d'Entretien
        </CardTitle>
      )}
      {onAddEntry && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 gap-1">
              <Plus className="w-3.5 h-3.5" /> Ajouter une intervention
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nouvelle intervention</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pièce montée (optionnel)</label>
                {part ? (
                  <>
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">
                      <span className="min-w-0 truncate font-medium">{partLabel(part)}</span>
                      <button type="button" className="shrink-0 text-xs text-muted-foreground hover:text-foreground" onClick={() => setPart(null)}>
                        Changer
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Cette intervention est notée ici, et la pièce rejoint « Mes pièces » avec son entretien.</p>
                  </>
                ) : (
                  <>
                    <Input placeholder="Chercher dans le catalogue (ex. bougie, Mojo, IAME)" value={partQ} onChange={(e) => setPartQ(e.target.value)} />
                    {partResults.length > 0 && (
                      <ul className="max-h-48 divide-y divide-border overflow-y-auto rounded-lg border border-border">
                        {partResults.map((p) => (
                          <li key={p.id}>
                            <button type="button" onClick={() => choosePart(p)} className="w-full px-3 py-2 text-left text-sm hover:bg-secondary/60">
                              <span className="font-medium">{partLabel(p)}</span>
                              <span className="ml-2 text-xs text-muted-foreground">{p.category_label ?? p.category}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
                {part && wearComponentOf(part.category) !== "general" && (
                  <label className="flex items-start gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" className="mt-0.5" checked={resetCounter} onChange={(e) => setResetCounter(e.target.checked)} />
                    <span>
                      Remettre le compteur d'usure à zéro
                      {part.default_life && part.life_ref ? ` (durée conseillée par le manuel : ${part.default_life} ${part.life_unit === "laps" ? "tours" : part.life_unit === "hours" ? "h" : part.life_unit ?? ""})` : ""}
                    </span>
                  </label>
                )}
              </div>
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
                    <SelectItem value="chain">Chaîne</SelectItem>
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
        return <Flame className="w-4 h-4 text-primary" />;
      case "tires":
        return <Disc className="w-4 h-4 text-primary" />;
      case "brakes":
        return <Loader2 className="w-4 h-4 text-primary" />;
      case "chain":
        return <Wrench className="w-4 h-4 text-primary" />;
      default:
        return <Wrench className="w-4 h-4 text-muted-foreground" />;
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
      case "chain":
        return "Chaîne";
      case "general":
        return "Général";
      default:
        return type;
    }
  };

  const list = (

        <div className="overflow-y-auto max-h-[360px] pr-1 custom-scrollbar space-y-3">
          {!history || history.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-2 text-center">
              Aucune réparation ou révision consignée pour le moment.
            </p>
          ) : (
            history.map((log) => {
              let displayType = log.component_type;
              let displayNotes = log.notes || "";
              if (log.notes?.startsWith("[general] ")) {
                displayType = "general";
                displayNotes = log.notes.substring(10);
              } else if (log.notes?.startsWith("[chain] ")) {
                displayType = "chain";
                displayNotes = log.notes.substring(8);
              }

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-3 rounded-xl bg-muted border border-border hover:bg-muted/80 transition-colors group"
                >
                  <div className="p-2 rounded-full bg-background border border-border shadow-sm">
                    {getIcon(displayType)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">
                        {displayType === "general" ? displayNotes.split(":")[0] || "Entretien général" : getName(displayType)}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    {displayNotes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        "{displayType === "general" ? displayNotes.substring(displayNotes.indexOf(":") + 1).trim() : displayNotes}"
                      </p>
                    )}
                    {log.previous_hours !== null && log.previous_hours > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                        Compteur remis à zéro à {log.previous_hours.toFixed(1).replace(".", ",")} h
                      </p>
                    )}
                    {log.previous_sessions !== null &&
                      log.previous_sessions > 0 &&
                      log.component_type !== "engine" && (
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                          Compteur remis à zéro à {log.previous_sessions} tours
                        </p>
                      )}
                  </div>
                  {onDeleteEntry && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 sm:h-7 sm:w-7 shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-100 can-hover:opacity-0 can-hover:group-hover:opacity-100 transition-opacity"
                      onClick={() => onDeleteEntry(log.id)}
                      title="Supprimer cette entrée"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
  );

  return (
    embedded ? (
      <div className="space-y-3">
        {renderHeader()}
        {list}
      </div>
    ) : (
      <Card className="bg-card border-border shadow-sm h-full flex flex-col">
        <CardHeader className="pb-0">{renderHeader()}</CardHeader>
        <CardContent className="flex-1 pr-2 mt-4 space-y-4">{list}</CardContent>
      </Card>
    )
  );
}