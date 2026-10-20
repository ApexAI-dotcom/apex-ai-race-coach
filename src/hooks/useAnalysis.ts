import { useState, useEffect, useCallback } from "react";
import { getAnalysisById } from "@/lib/storage";
import type { AnalysisResponse } from "@/types/analysis";
import type { AnalysisResult } from "@/lib/api";

/**
 * Passage unique du résultat brut (serveur ou base) à ce que affiche la vue
 * d'analyse. Utilisé PARTOUT : à la sortie de l'analyse, en rouvrant une
 * session depuis le tableau de bord, sur la page de résultat.
 *
 * Règle d'or : on garde TOUS les champs (`...r`) et on ne fait que combler les
 * trous. L'ancienne version recopiait une liste de champs à la main et oubliait
 * `ideal_lap` et `racing_line` : la carte des mini-secteurs et le Tour Parfait IA
 * disparaissaient dès qu'on rouvrait une analyse.
 */
export function mapApiResultToResponse(r: AnalysisResult): AnalysisResponse {
  const ps = r.performance_score;
  return {
    ...(r as unknown as AnalysisResponse),
    success: r.success,
    analysis_id: r.analysis_id,
    corners_detected: r.corners_detected,
    lap_time: r.lap_time,
    best_lap_time: r.best_lap_time ?? r.lap_time ?? 0,
    lap_times: r.lap_times ?? (r.lap_time != null ? [r.lap_time] : []),
    performance_score: {
      overall_score: ps?.overall_score ?? 0,
      grade: ps?.grade ?? "—",
      breakdown: (ps?.breakdown as unknown as Record<string, number>) ?? {},
      percentile: ps?.percentile ?? 0,
    },
    corner_analysis: r.corner_analysis ?? [],
    coaching_advice: r.coaching_advice ?? [],
    plots: r.plots ?? {},
    plot_data: r.plot_data as AnalysisResponse["plot_data"],
    statistics: r.statistics ?? {},
    session_conditions: (r.session_conditions ?? undefined) as AnalysisResponse["session_conditions"],
    ideal_lap: (r.ideal_lap ?? undefined) as AnalysisResponse["ideal_lap"],
    racing_line: (r.racing_line ?? undefined) as AnalysisResponse["racing_line"],
  };
}

export function useAnalysis(analysisId: string | null, userId: string | undefined) {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(!!analysisId);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async () => {
    if (!analysisId) {
      setAnalysis(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const raw = await getAnalysisById(analysisId, userId);
      if (raw) setAnalysis(mapApiResultToResponse(raw));
      else setAnalysis(null);
    } catch {
      setError("Erreur chargement analyse");
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }, [analysisId, userId]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  return { analysis, loading, error, refetch: fetchAnalysis };
}
