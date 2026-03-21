import React from "react";
import { Zap, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { CoachingAdvice as CoachingAdviceType } from "@/types/analysis";

interface CoachingAdviceProps {
  advice: CoachingAdviceType[];
  fastestLapNumber?: number;
  isLocked?: boolean;
}

export function CoachingAdvice({ advice, fastestLapNumber, isLocked }: CoachingAdviceProps) {
  const navigate = useNavigate();
  if (!advice || advice.length === 0) return null;

  return (
    <Card className="glass-card border-primary/20 mb-8 relative overflow-hidden">
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
          {advice.map((item, index) => {
            const isItemLocked = isLocked && index >= 2;
            return (
              <div 
                key={index} 
                className={`p-4 rounded-lg bg-secondary/50 border border-white/5 relative ${isItemLocked ? "blur-[6px] select-none pointer-events-none opacity-50" : ""}`}
              >
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
            );
          })}
        </div>
        
        {isLocked && advice.length > 2 && (
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 z-10 bg-gradient-to-t from-background/90 via-background/50 to-transparent">
            <div className="flex flex-col items-center max-w-sm text-center">
              <div className="bg-red-600/20 p-2 rounded-full mb-3 border border-red-500/50 backdrop-blur-sm">
                <Lock className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Débloquez tous les conseils</h3>
              <p className="text-gray-300 text-sm mb-4">
                Créez un compte gratuitement pour révéler tous les conseils de coaching personnalisés.
              </p>
              <Button 
                onClick={() => navigate("/login?mode=register")}
                className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-full w-full"
              >
                Créer un compte
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
