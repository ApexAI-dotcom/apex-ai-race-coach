import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { History, Wrench, Flame, Disc, Loader2, Plus, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function KartMaintenanceLog({ history, onAddEntry, onDeleteEntry }: { history: any[], onAddEntry?: (type: string, notes: string, date: string) => void, onDeleteEntry?: (entryId: string) => void }) {
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
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes / Détails</label>
                <Input placeholder="ex: Nettoyage carbu, bougie neuve..." value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={!notes}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  if (!history || history.length === 0) {
    return (
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-0">
          {renderHeader()}
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground italic">Aucune réparation ou révision consignée pour le moment.</p>
        </CardContent>
      </Card>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "engine": return <Flame className="w-4 h-4 text-red-500" />;
      case "tires": return <Disc className="w-4 h-4 text-purple-500" />;
      case "brakes": return <Loader2 className="w-4 h-4 text-orange-500" />;
      default: return <Wrench className="w-4 h-4 text-gray-500" />;
    }
  };

  const getName = (type: string) => {
    switch (type) {
      case "engine": return "Moteur";
      case "tires": return "Train de Pneus";
      case "brakes": return "Freins";
      default: return type;
    }
  };

  return (
    <Card className="bg-card border-border shadow-sm h-full flex flex-col">
      <CardHeader className="pb-0">
        {renderHeader()}
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto max-h-[300px] pr-2 mt-4 custom-scrollbar">
        <div className="space-y-4">
          {history.map((log) => (
            <div key={log.id} className="flex items-start gap-4 p-3 rounded-xl bg-muted border border-border hover:bg-muted/80 transition-colors group">
              <div className="p-2 rounded-full bg-background border border-border shadow-sm">
                {getIcon(log.component_type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Changement {getName(log.component_type)}</h4>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(log.created_at), "dd MMM yyyy")}
                  </span>
                </div>
                {log.notes && (
                  <p className="text-xs text-muted-foreground mt-1">"{log.notes}"</p>
                )}
                {log.previous_hours !== null && log.previous_hours > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Moteur remis à zéro à {log.previous_hours.toFixed(1)}h</p>
                )}
                {log.previous_sessions !== null && log.previous_sessions > 0 && log.component_type !== "engine" && (
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Durée : {log.previous_sessions} sessions</p>
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
