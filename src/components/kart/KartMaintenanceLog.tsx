import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { History, Wrench, Flame, Disc, Loader2 } from "lucide-react";

export function KartMaintenanceLog({ history }: { history: any[] }) {
  if (!history || history.length === 0) {
    return (
      <Card className="glass-card border-white/5 bg-black/40">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="w-5 h-5 text-primary" /> Journal d'Entretien
          </CardTitle>
        </CardHeader>
        <CardContent>
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
    <Card className="glass-card border-white/5 bg-black/40 h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="w-5 h-5 text-primary" /> Maintenance Récente
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
        <div className="space-y-4">
          {history.map((log) => (
            <div key={log.id} className="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="p-2 rounded-full bg-black/50">
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
                  <p className="text-xs text-gray-400 mt-1">"{log.notes}"</p>
                )}
                {log.previous_hours !== null && log.previous_hours > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Moteur remis à zéro à {log.previous_hours.toFixed(1)}h</p>
                )}
                {log.previous_sessions !== null && log.previous_sessions > 0 && log.component_type !== "engine" && (
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Durée : {log.previous_sessions} sessions</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
