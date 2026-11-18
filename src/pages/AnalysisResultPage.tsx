import { useParams, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAnalysis, mapApiResultToResponse } from "@/hooks/useAnalysis";
import { Layout } from "@/components/layout/Layout";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AnalysisDashboardContent } from "@/components/analysis/AnalysisDashboardContent";
import type { AnalysisResponse } from "@/types/analysis";

export default function AnalysisResultPage() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  // Espace Team : le coach ouvre la séance d'un de ses pilotes, en lecture.
  const [search] = useSearchParams();
  const asCoach = search.get("coach") === "1";
  const coachStructure = search.get("s");
  const backTo = asCoach && coachStructure ? `/equipe?s=${coachStructure}` : "/dashboard";

  const stateAnalysisRaw = location.state?.analysis;
  const stateAnalysis = stateAnalysisRaw
    ? mapApiResultToResponse(stateAnalysisRaw as Parameters<typeof mapApiResultToResponse>[0])
    : undefined;
  const {
    analysis: fetchedAnalysis,
    loading,
    error,
  } = useAnalysis(stateAnalysis ? null : (analysisId ?? null), user?.id, asCoach);

  const analysis = stateAnalysis ?? fetchedAnalysis;

  if (loading && !analysis) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-[#e6edf3]">
          <Loader2 className="w-10 h-10 text-[#f97316] animate-spin" />
          <span className="ml-3">Chargement de l'analyse...</span>
        </div>
      </Layout>
    );
  }

  if (error || !analysis) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center text-[#e6edf3] p-4">
          <p className="text-[#8b949e] mb-4">{error ?? "Analyse introuvable."}</p>
          <Button variant="outline" onClick={() => navigate(backTo)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {asCoach ? "Retour à mon équipe" : "Retour aux sessions"}
          </Button>
        </div>
      </Layout>
    );
  }

  const data = analysis as AnalysisResponse;

  return (
    <Layout>
      <PageMeta
        title="Résultat d'analyse | ApexAI"
        description="Résultats détaillés de ta session."
        path={`/analysis/${data.analysis_id}`}
      />
      <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] py-4 md:p-6">
        <div className="container mx-auto">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 text-[#8b949e] hover:text-[#e6edf3]"
            onClick={() => navigate(backTo)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {asCoach ? "Mon équipe" : "Sessions"}
          </Button>
          {asCoach && (
            <p className="mb-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
              Séance d'un pilote de ton équipe, en lecture seule.
            </p>
          )}

          <AnalysisDashboardContent analysis={data} />
        </div>
      </div>
    </Layout>
  );
}
