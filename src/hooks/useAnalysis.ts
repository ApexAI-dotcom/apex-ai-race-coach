import { useState, useEffect, useCallback } from "react";
import { getAnalysisById } from "@/lib/storage";
import type { AnalysisResponse } from "@/types/analysis";
import type { AnalysisResult } from "@/lib/api";

export function mapApiResultToResponse(r: AnalysisResult): AnalysisResponse {
  return {
    success: r.success,
    analysis_id: r.analysis_id,
    corners_detected: r.corners_detected,
    lap_time: r.lap_time,
    best_lap_time: r.best_lap_time ?? r.lap_time,
    lap_times: r.lap_times ?? [],
    performance_score: {
      overall_score: r.performance_score?.overall_score ?? 0,
      grade: r.performance_score?.grade ?? "—",
      breakdown: r.performance_score?.breakdown ?? {},
      percentile: r.performance_score?.percentile ?? 0,
    },
    corner_analysis: r.corner_analysis ?? [],
    coaching_advice: r.coaching_advice ?? [],
    plots: r.plots ?? {},
    plot_data: (r as Record<string, unknown>).plot_data as AnalysisResponse["plot_data"] ?? undefined,
    statistics: r.statistics ?? {},
    session_conditions: r.session_conditions
      ? {
          track_condition: r.session_conditions.track_condition,
          track_temperature: r.session_conditions.track_temperature ?? undefined,
        }
      : undefined,
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
