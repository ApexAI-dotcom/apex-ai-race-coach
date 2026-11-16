import React from "react";
import { Zap, Lock, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { CoachingAdvice as CoachingAdviceType } from "@/types/analysis";

interface CoachingAdviceProps {
  advice: CoachingAdviceType[];
  fastestLapNumber?: number;
  isLocked?: boolean;
  hideCta?: boolean;
  /** Ouvre le virage concerné sur la carte du circuit. */
  onFocusCorner?: (cornerId: number) => void;
}

export function CoachingAdvice({
  advice,
  fastestLapNumber,
  isLocked,
  hideCta = false,
  onFocusCorner,
}: CoachingAdviceProps) {
  const navigate = useNavigate();
  if (!advice || advice.length === 0) return null;

  // Le contexte de session (tours retenus, conditions) n'est pas un conseil :
  // il décrit sur quoi les conseils s'appuient. Il a donc sa place en
  // sous-titre, pas dans une carte numérotée « Priorité 0 ».
  const sessionInfo = advice.filter((a) => a.category === "info" && !a.corner);
  const actionable = advice.filter((a) => !(a.category === "info" && !a.corner));
  if (actionable.length === 0) return null;

  return (
    <Card className="glass-card border-primary/20 mb-8 relative overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Conseils de Coaching
        </CardTitle>
        <CardDescription className="space-y-1">
          <span className="block">
            Classés par temps réellement perdu, mesuré sur tes chronos
            {fastestLapNumber ? ` — référence : ton meilleur tour (tour ${fastestLapNumber})` : ""}.
            Les numéros de virage sont ceux de la carte du circuit.
          </span>
          {sessionInfo.map((info, i) => (
            <span key={`info-${i}`} className="block text-[11px] opacity-80">
              {info.message}
            </span>
          ))}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {actionable.map((item, index) => {
            const isItemLocked = isLocked && index >= 2;
            const canFocus = !!onFocusCorner && !!item.corner && !isItemLocked;
            return (
              <div
                key={index}
                role={canFocus ? "button" : undefined}
                tabIndex={canFocus ? 0 : undefined}
                aria-label={
                  canFocus ? `Voir le virage ${item.corner} sur la carte du circuit` : undefined
                }
                title={canFocus ? "Voir ce virage sur la carte du circuit" : undefined}
                onClick={canFocus ? () => onFocusCorner!(item.corner as number) : undefined}
                onKeyDown={
                  canFocus
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onFocusCorner!(item.corner as number);
                        }
                      }
                    : undefined
                }
                className={`p-4 rounded-lg bg-secondary/50 border relative transition-all duration-200 ${
                  isItemLocked ? "blur-[6px] select-none pointer-events-none opacity-50" : ""
                } ${
                  canFocus
                    ? "cursor-pointer border-white/5 hover:border-primary/40 hover:bg-secondary/70 hover:shadow-[0_0_18px_-4px_hsl(var(--primary)/0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                    : "border-white/5"
                }`}
              >
                <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs border-white/10">
                      Priorité {item.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize border-white/10">
                      {item.category}
                    </Badge>
                    {item.corner && (
                      <Badge
                        variant="outline"
                        className={`text-xs border-white/10 text-primary ${canFocus ? "gap-1" : ""}`}
                      >
                        Virage {item.corner}
                        {canFocus && <MapPin className="w-3 h-3" />}
                      </Badge>
                    )}
                  </div>
                  {item.impact_seconds > 0 && (
                    <span
                      className="text-xs text-muted-foreground font-medium"
                      title="Temps perdu mesuré sur ce virage, par tour — écart entre ton meilleur tour et ton tour idéal"
                    >
                      Temps perdu ici :{" "}
                      <span className="text-green-500 tabular-nums">
                        {item.impact_seconds.toFixed(2)}s
                      </span>
                      <span className="text-muted-foreground"> / tour</span>
                    </span>
                  )}
                </div>
                <p className="font-semibold text-foreground mb-1">{item.message}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.explanation}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                    Difficulté :
                  </span>
                  <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0">
                    {item.difficulty}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {isLocked && actionable.length > 2 && (
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 z-10 bg-gradient-to-t from-background/90 via-background/50 to-transparent">
            {!hideCta && (
              <div className="flex flex-col items-center max-w-sm text-center">
                <div className="bg-red-600/20 p-2 rounded-full mb-3 border border-red-500/50 backdrop-blur-sm">
                  <Lock className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Débloquez tous les conseils</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Créez un compte gratuitement pour révéler tous les conseils de coaching
                  personnalisés.
                </p>
                <Button
                  onClick={() => navigate("/login?mode=register")}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-full w-full"
                >
                  Créer un compte
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
