import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Target, TrendingUp, Zap } from "lucide-react";
import { getDisplayScore, type AnalysisResult } from "@/lib/api";

const getGradeColor = (grade: string) => {
  switch (grade.toUpperCase()) {
    case "A+":
    case "A":
      return "bg-green-500/20 text-green-200 border-green-500/50";
    case "B":
      return "bg-blue-500/20 text-blue-200 border-blue-500/50";
    case "C":
      return "bg-yellow-500/20 text-yellow-200 border-yellow-500/50";
    case "D":
      return "bg-red-500/20 text-red-200 border-red-500/50";
    default:
      return "bg-gray-500/20 text-gray-200 border-gray-500/50";
  }
};

/**
 * Résumé de la session : note, quatre sous-notes et chiffres clés.
 *
 * Un seul composant pour l'analyse qui vient d'être faite ET pour celle qu'on
 * rouvre depuis le tableau de bord : avant, ces blocs n'existaient qu'à la
 * sortie de l'analyse, et la revue montrait « autre chose ».
 */
export function SessionSummary({ result }: { result: AnalysisResult }) {
  return (
    <div className="space-y-6">
      {/* Score de performance */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Score de Performance
            </span>
            <Badge className={getGradeColor(result.performance_score.grade)}>
              {result.performance_score.grade}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="text-6xl font-display font-bold bg-gradient-to-r from-primary to-pink-500 text-transparent bg-clip-text mb-2">
              {Math.round(getDisplayScore(result.performance_score))}/100
            </div>
            {/* Le « centile » affiché ici n'était qu'une transformation
                linéaire du score : aucune base de comparaison entre
                pilotes n'existe. On ne peut pas laisser un chiffre qui
                suggère un classement inexistant. */}
            <p className="text-sm text-muted-foreground">
              Note de pilotage sur cette session
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Précision point de corde",
                value: result.performance_score.breakdown.apex_precision,
                max: 30,
              },
              {
                label: "Régularité",
                value: result.performance_score.breakdown.trajectory_consistency,
                max: 25,
              },
              {
                label: "Vitesse point de corde",
                value: result.performance_score.breakdown.apex_speed,
                max: 25,
              },
              {
                label: "Temps Secteurs",
                value: result.performance_score.breakdown.sector_times,
                max: 20,
              },
            ].map(({ label, value, max }) => (
              <div key={label} className="text-center p-3 rounded-lg bg-secondary/50">
                <div className="text-xs text-muted-foreground mb-1">{label}</div>
                <div className="text-lg font-bold text-foreground">
                  {Math.round(value)}/{max}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats rapides (Mise à jour) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Tour le plus rapide */}
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-green-500" />
              <div className="text-xs text-muted-foreground">Tour le plus rapide</div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-green-500">
                {(result.statistics.fastest_lap_number != null
                  ? (result.lap_times?.[result.statistics.fastest_lap_number - 1] ??
                    result.best_lap_time)
                  : result.best_lap_time
                )?.toFixed(3) ?? "—"}
                s
              </span>
              <span className="text-sm text-muted-foreground">
                {result.statistics.fastest_lap_number
                  ? `Tour ${result.statistics.fastest_lap_number}`
                  : ""}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Vitesse maximale */}
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-primary" />
              <div className="text-xs text-muted-foreground">Vitesse maximale</div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">
                {(() => {
                  // Backend stat
                  if (result.statistics.max_speed != null && result.statistics.max_speed > 0)
                    return `${result.statistics.max_speed.toFixed(1)} km/h`;
                  // Frontend fallback: compute from speed_trace plot data
                  const laps: { speed_kmh?: number[] }[] | undefined = result.plot_data?.speed_trace?.laps;
                  if (laps && Array.isArray(laps)) {
                    let maxV = 0;
                    for (const lap of laps) {
                      if (lap.speed_kmh && Array.isArray(lap.speed_kmh)) {
                        for (const v of lap.speed_kmh) {
                          if (v > maxV) maxV = v;
                        }
                      }
                    }
                    if (maxV > 0) return `${maxV.toFixed(1)} km/h`;
                  }
                  return "— km/h";
                })()}
              </span>
              <span className="text-sm text-muted-foreground">
                {result.statistics.max_speed_lap
                  ? `Tour ${result.statistics.max_speed_lap}`
                  : ""}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Cohérence */}
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-primary" />
              <div className="text-xs text-muted-foreground">Cohérence</div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">
                {result.statistics.consistency_gap?.toFixed(2) ?? "—"} s
              </span>
              <span className="text-sm text-muted-foreground">Écart moyen</span>
            </div>
          </CardContent>
        </Card>

        {/* Amélioration */}
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <div className="text-xs text-muted-foreground">Amélioration</div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">
                {result.statistics.improvement_gap?.toFixed(2) ?? "—"} s
              </span>
              <span className="text-sm text-muted-foreground">Pire au meilleur</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
