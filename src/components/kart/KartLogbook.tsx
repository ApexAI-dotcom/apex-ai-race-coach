import { useState, type ReactNode } from "react";
import { BookOpen, ChevronRight, Package, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CatalogPart } from "@/lib/api";
import { PartsCatalog } from "./parts/PartsCatalog";

export interface DayLog {
  date: string;
  sessionsCount: number;
  totalDuration: number;
  totalLaps: number;
  rpmMax: number;
  waterMax: number;
  circuit?: string | null;
}

const dayLabel = (iso: string) => {
  const s = new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const hm = (h: number) => {
  const m = Math.round(h * 60);
  return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}` : `${m} min`;
};

/**
 * Carnet d'entretien : UN seul endroit pour l'historique du kart, en trois
 * onglets (interventions, mes pièces, journées de roulage), et le catalogue
 * des pièces en bas, présenté comme un outil et non comme un titre. Remplace quatre blocs séparés
 * (journal, pièces montées, entretien conseillé, historique des journées).
 */
export function KartLogbook({
  interventions,
  parts,
  days,
  onDeleteDay,
  onFitPart,
  readOnly = false,
  tab,
  onTabChange,
}: {
  tab: string;
  onTabChange: (t: string) => void;
  interventions: ReactNode;
  parts: ReactNode;
  days: DayLog[];
  onDeleteDay?: (date: string) => void;
  onFitPart?: (p: CatalogPart) => void;
  readOnly?: boolean;
}) {
  const [catalogOpen, setCatalogOpen] = useState(false);

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5 text-primary" />
          Carnet d'entretien
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={onTabChange} className="w-full">
          <TabsList className="mb-4 grid h-auto w-full grid-cols-3">
            <TabsTrigger value="interventions" className="py-2 text-xs sm:text-sm">Interventions</TabsTrigger>
            <TabsTrigger value="parts" className="py-2 text-xs sm:text-sm">Mes pièces</TabsTrigger>
            <TabsTrigger value="days" className="py-2 text-xs sm:text-sm">Journées</TabsTrigger>
          </TabsList>

          <TabsContent value="interventions" className="mt-0">{interventions}</TabsContent>

          <TabsContent value="parts" className="mt-0">{parts}</TabsContent>

          <TabsContent value="days" className="mt-0">
            {days.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucune journée importée. Utilise « Importer ma journée » après chaque sortie.
              </p>
            ) : (
              <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                {days.map((d) => (
                  <li key={d.date} className="group flex items-center gap-3 rounded-xl border border-border bg-muted px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {dayLabel(d.date)}
                        {d.circuit ? <span className="font-normal normal-case text-muted-foreground"> · {d.circuit}</span> : null}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                        {d.sessionsCount} séance{d.sessionsCount > 1 ? "s" : ""} · {hm(d.totalDuration)}
                        {d.totalLaps ? ` · ${d.totalLaps} tours` : ""}
                        {d.rpmMax ? ` · ${Math.round(d.rpmMax).toLocaleString("fr-FR")} tr/min max` : ""}
                        {d.waterMax ? ` · eau ${Math.round(d.waterMax)} °C max` : ""}
                      </p>
                    </div>
                    {onDeleteDay && !readOnly && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                        onClick={() => onDeleteDay(d.date)}
                        aria-label="Supprimer cette journée et retirer ses heures des compteurs"
                        title="Supprimer cette journée"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>

        {/* Le catalogue : un outil, pas un titre. Sous les onglets, à part. */}
        <button
          type="button"
          onClick={() => setCatalogOpen(true)}
          className="mt-5 flex w-full items-center gap-3 rounded-xl border border-dashed border-white/15 bg-muted/20 px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
        >
          <Package className="h-5 w-5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-foreground">Ouvrir le catalogue des pièces</span>
            <span className="block text-xs text-muted-foreground">Trouve une pièce, lis son entretien constructeur et ajoute-la à ton kart.</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </CardContent>

      <Dialog open={catalogOpen} onOpenChange={setCatalogOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Catalogue des pièces</DialogTitle>
          </DialogHeader>
          <PartsCatalog
            embedded
            onFit={
              onFitPart && !readOnly
                ? (p) => {
                    setCatalogOpen(false);
                    onFitPart(p);
                  }
                : undefined
            }
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
