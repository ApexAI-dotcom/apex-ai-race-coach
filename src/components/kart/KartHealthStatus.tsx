import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { KartProfile } from "@/lib/api";
import { Flame, Disc, Loader2, HeartPulse } from "lucide-react";

export function KartHealthStatus({ profile }: { profile: KartProfile }) {
  // Simple health score calculation based on current wear vs life
  const maxEngine = profile.engine_hours_life || 15;
  const currentEngine = profile.engine_hours_current || 0;
  const engineHealth = Math.max(0, 100 - (currentEngine / maxEngine) * 100);

  const maxTires = profile.tires_sessions_life || 50;
  const currentTires = profile.tires_sessions_current || 0;
  const tiresHealth = Math.max(0, 100 - (currentTires / maxTires) * 100);

  const maxBrakes = profile.brakes_sessions_life || 100;
  const currentBrakes = profile.brakes_sessions_current || 0;
  const brakesHealth = Math.max(0, 100 - (currentBrakes / maxBrakes) * 100);

  const globalHealth = Math.round((engineHealth + tiresHealth + brakesHealth) / 3);

  let healthColor = "text-green-500";
  let healthBg = "bg-green-500";
  if (globalHealth < 50) {
    healthColor = "text-red-500";
    healthBg = "bg-red-500";
  } else if (globalHealth < 80) {
    healthColor = "text-orange-500";
    healthBg = "bg-orange-500";
  }

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-muted">
        <div className={`h-full ${healthBg} transition-all duration-1000`} style={{ width: `${globalHealth}%` }}></div>
      </div>
      <CardHeader className="py-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <HeartPulse className={`w-5 h-5 ${healthColor} animate-pulse`} /> 
          Bilan Santé Global
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center mb-6">
          <span className={`text-5xl font-black ${healthColor} tracking-tighter`}>{globalHealth}</span>
          <span className="text-muted-foreground text-sm font-medium mt-1 uppercase tracking-widest">Score d'État</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50 border border-border">
            <Flame className="w-4 h-4 text-red-500 mb-1" />
            <span className="text-xs font-semibold">{Math.round(engineHealth)}%</span>
            <span className="text-[10px] text-muted-foreground uppercase">Moteur</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50 border border-border">
            <Disc className="w-4 h-4 text-purple-500 mb-1" />
            <span className="text-xs font-semibold">{Math.round(tiresHealth)}%</span>
            <span className="text-[10px] text-muted-foreground uppercase">Pneus</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50 border border-border">
            <Loader2 className="w-4 h-4 text-orange-500 mb-1" />
            <span className="text-xs font-semibold">{Math.round(brakesHealth)}%</span>
            <span className="text-[10px] text-muted-foreground uppercase">Freins</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
