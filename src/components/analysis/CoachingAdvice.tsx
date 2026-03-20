import React from "react";
import { Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CoachingAdvice as CoachingAdviceType } from "@/types/analysis";

interface CoachingAdviceProps {
  advice: CoachingAdviceType[];
  fastestLapNumber?: number;
}

export function CoachingAdvice({ advice, fastestLapNumber }: CoachingAdviceProps) {
  if (!advice || advice.length === 0) return null;

  return (
    <Card className="glass-card border-primary/20 mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Conseils de Coaching (Top {advice.length})
        </CardTitle>
        <CardDescription>
          Conseils prioritaires pour améliorer votre performance — Basé sur le meilleur tour
          {fastestLapNumber ? ` (Tour ${fastestLapNumber})` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {advice.map((item, index) => (
            <div key={index} className="p-4 rounded-lg bg-secondary/50 border border-white/5">
              <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs border-white/10">Priorité {item.priority}</Badge>
                  <Badge variant="outline" className="text-xs capitalize border-white/10">{item.category}</Badge>
                  {item.corner && (
                    <Badge variant="outline" className="text-xs border-white/10 text-primary">Virage {item.corner}</Badge>
                  )}
                </div>
                {item.impact_seconds > 0 && (
                  <span className="text-xs text-muted-foreground font-medium">
                    Gain potentiel : <span className="text-green-500">-{item.impact_seconds.toFixed(2)}s</span>
                  </span>
                )}
              </div>
              <p className="font-semibold text-foreground mb-1">{item.message}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.explanation}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Difficulté :</span>
                <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0">
                  {item.difficulty}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
