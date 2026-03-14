import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAnalysis, mapApiResultToResponse } from "@/hooks/useAnalysis";
import { Layout } from "@/components/layout/Layout";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { SpeedTraceChart } from "@/components/analysis/SpeedTraceChart";
import { ThrottleBrakeChart } from "@/components/analysis/ThrottleBrakeChart";
import { TimeDeltaChart } from "@/components/analysis/TimeDeltaChart";
import { PerformanceRadar } from "@/components/analysis/PerformanceRadar";
import { TrackMap } from "@/components/analysis/TrackMap";
import { ApexMarginChart } from "@/components/analysis/ApexMarginChart";
import { MetricsHeader } from "@/components/analysis/MetricsHeader";
import { CornerDetailsGrid } from "@/components/analysis/CornerDetailsGrid";
import type { AnalysisResponse } from "@/types/analysis";

export default function AnalysisResultPage() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const stateAnalysisRaw = location.state?.analysis;
  const stateAnalysis = stateAnalysisRaw
    ? mapApiResultToResponse(stateAnalysisRaw as Parameters<typeof mapApiResultToResponse>[0])
    : undefined;
  const { analysis: fetchedAnalysis, loading, error } = useAnalysis(
    stateAnalysis ? null : analysisId ?? null,
    user?.id
  );

  const analysis = stateAnalysis ?? fetchedAnalysis;

  if (loading && !analysis) {
    return (
      <Layout>
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !analysis) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground mb-4">{error ?? "Analyse introuvable."}</p>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Button>
        </div>
      </Layout>
    );
  }

  const plotData = analysis.plot_data;
  const hasPlotData = !!plotData;

  return (
    <Layout>
      <PageMeta
        title="Résultat d'analyse | ApexAI"
        description="Résultats détaillés de votre session."
        path={`/analysis/${analysis.analysis_id}`}
      />
      <div className="min-h-screen bg-apex-bg text-apex-text">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 text-apex-muted hover:text-apex-text"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tableau de bord
          </Button>

          <MetricsHeader analysis={analysis} />

          {hasPlotData ? (
            <>
              {plotData.speed_trace && (
                <section className="mb-8 rounded-xl border border-apex-border bg-apex-surface p-4">
                  <h2 className="text-lg font-semibold text-apex-text mb-4">Speed Trace</h2>
                  <SpeedTraceChart data={plotData.speed_trace} />
                </section>
              )}

              {plotData.throttle_brake?.laps?.[0] && (
                <section className="mb-8 rounded-xl border border-apex-border bg-apex-surface p-4">
                  <h2 className="text-lg font-semibold text-apex-text mb-4">Throttle & Brake</h2>
                  <ThrottleBrakeChart data={plotData.throttle_brake.laps[0]} />
                </section>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {plotData.time_delta && (
                  <section className="rounded-xl border border-apex-border bg-apex-surface p-4">
                    <h2 className="text-lg font-semibold text-apex-text mb-4">Time Delta</h2>
                    <TimeDeltaChart data={plotData.time_delta} />
                  </section>
                )}
                {plotData.performance_radar && (
                  <section className="rounded-xl border border-apex-border bg-apex-surface p-4">
                    <h2 className="text-lg font-semibold text-apex-text mb-4">Performance Radar</h2>
                    <PerformanceRadar data={plotData.performance_radar} />
                  </section>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {plotData.trajectory_2d?.corners?.length > 0 && (
                  <section className="rounded-xl border border-apex-border bg-apex-surface p-4">
                    <h2 className="text-lg font-semibold text-apex-text mb-4">Track Map</h2>
                    <TrackMap
                      corners={plotData.trajectory_2d.corners}
                      margins={plotData.apex_margin?.corners}
                    />
                  </section>
                )}
                {plotData.apex_margin?.corners?.length > 0 && (
                  <section className="rounded-xl border border-apex-border bg-apex-surface p-4">
                    <h2 className="text-lg font-semibold text-apex-text mb-4">Apex Margin</h2>
                    <ApexMarginChart data={plotData.apex_margin.corners} />
                  </section>
                )}
              </div>

              {plotData.apex_margin?.corners?.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-lg font-semibold text-apex-text mb-4">Détail des virages</h2>
                  <CornerDetailsGrid corners={plotData.apex_margin.corners} />
                </section>
              )}
            </>
          ) : (
            <section className="space-y-6">
              <p className="text-apex-muted text-sm">Données graphiques non disponibles (fallback images).</p>
              {analysis.plots?.speed_trace && (
                <div className="rounded-xl border border-apex-border bg-apex-surface p-4">
                  <h2 className="text-lg font-semibold text-apex-text mb-4">Speed Trace</h2>
                  <img
                    src={analysis.plots.speed_trace}
                    alt="Speed trace"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              )}
              {analysis.plots?.throttle_brake && (
                <div className="rounded-xl border border-apex-border bg-apex-surface p-4">
                  <h2 className="text-lg font-semibold text-apex-text mb-4">Throttle & Brake</h2>
                  <img
                    src={analysis.plots.throttle_brake}
                    alt="Throttle and brake"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              )}
              {analysis.plots?.performance_radar && (
                <div className="rounded-xl border border-apex-border bg-apex-surface p-4">
                  <h2 className="text-lg font-semibold text-apex-text mb-4">Performance Radar</h2>
                  <img
                    src={analysis.plots.performance_radar}
                    alt="Performance radar"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </Layout>
  );
}
