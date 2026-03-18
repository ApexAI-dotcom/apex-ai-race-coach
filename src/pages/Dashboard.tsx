import { useState, useEffect, useCallback, Fragment, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Trash2,
  Eye,
  GitCompareArrows,
  BarChart3,
  Zap,
  AlertCircle,
  X,
  ArrowLeft,
  ArrowRight,
  FileDown,
  CheckCircle2,
  ExternalLink,
  Save,
  Database,
  RefreshCw,
  Download,
  FolderInput,
  Trophy,
  MapPin,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAllAnalyses,
  getAnalysisById,
  deleteAnalysis,
  clearAllAnalyses,
  type AnalysisSummary,
} from "@/lib/storage";
import { getDisplayScore, type AnalysisResult, type CornerAnalysis, type CoachingAdvice } from "@/lib/api";
import { useSubscriptionLegacy } from "@/hooks/useSubscriptionLegacy";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { mapApiResultToResponse } from "@/hooks/useAnalysis";
import { AnalysisDashboardContent } from "@/components/analysis/AnalysisDashboardContent";
import { TrackMap } from "@/components/analysis/TrackMap";
import { PageMeta } from "@/components/seo/PageMeta";
import { Helmet } from "react-helmet-async";
import { ADMIN_EMAIL } from "@/constants";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const analysisIdParam = searchParams.get("analysisId");
  const { subscription, limits: legacyLimits, isPro } = useSubscriptionLegacy();
  const { tier, status, limits: backendLimits, isLoading: subscriptionLoading } = useSubscription();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const isPaidTier = tier === "team" || tier === "racer" || (tier as string) === "pro";
  const isFreeTier = !isPaidTier;
  const subscriptionReady = !subscriptionLoading;
  const freeLimitReached =
    backendLimits?.analyses_per_month != null &&
    typeof backendLimits.analyses_used === "number" &&
    backendLimits.analyses_used >= backendLimits.analyses_per_month;
  const showFreeBanner = subscriptionReady && isFreeTier && freeLimitReached;
  const freeAnalysesRemaining =
    isFreeTier && backendLimits?.analyses_per_month != null && typeof backendLimits.analyses_used === "number"
      ? Math.max(0, backendLimits.analyses_per_month - backendLimits.analyses_used)
      : 0;

  // States
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null);
  const [showDetailOverlay, setShowDetailOverlay] = useState(false);
  const [compareSlot1, setCompareSlot1] = useState<string>("");
  const [compareSlot2, setCompareSlot2] = useState<string>("");
  const [compareResult1, setCompareResult1] = useState<AnalysisResult | null>(null);
  const [compareResult2, setCompareResult2] = useState<AnalysisResult | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Featured: latest analysis full data
  const [featuredAnalysis, setFeaturedAnalysis] = useState<AnalysisResult | null>(null);

  // Load analyses
  const loadAnalyses = useCallback(async () => {
    try {
      setLoading(true);
      const allAnalyses = await getAllAnalyses(user?.id ?? undefined);
      setAnalyses(allAnalyses);

      // Load the latest analysis for featured card
      if (allAnalyses.length > 0) {
        const latestId = allAnalyses[0].id;
        const latest = await getAnalysisById(latestId, user?.id ?? undefined);
        setFeaturedAnalysis(latest);
      }
    } catch (err) {
      setError("Erreur lors du chargement des analyses");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadAnalyses(); }, [loadAnalyses]);

  // Load specific analysis from query param
  useEffect(() => {
    if (analysisIdParam) {
      handleViewAnalysis(analysisIdParam);
    }
  }, [analysisIdParam, user?.id]);

  // Close overlay on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowDetailOverlay(false);
        setSelectedAnalysis(null);
        setSearchParams({});
      }
    };
    if (showDetailOverlay) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [showDetailOverlay]);

  const handleViewAnalysis = async (id: string) => {
    try {
      const analysis = await getAnalysisById(id, user?.id ?? undefined);
      if (analysis) {
        setSelectedAnalysis(analysis);
        setShowDetailOverlay(true);
        setSearchParams({ analysisId: id });
      } else {
        toast.error(`Analyse ${id} non trouvée`);
      }
    } catch (err) {
      toast.error(`Erreur lors du chargement de l'analyse`);
      console.error(err);
    }
  };

  const handleCloseOverlay = () => {
    setShowDetailOverlay(false);
    setSelectedAnalysis(null);
    setSearchParams({});
  };

  const handleDeleteClick = (id: string) => {
    setAnalysisToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!analysisToDelete) return;
    try {
      const success = await deleteAnalysis(analysisToDelete, user?.id ?? undefined);
      if (success) {
        await loadAnalyses();
        if (selectedAnalysis?.analysis_id === analysisToDelete) handleCloseOverlay();
        if (compareSlot1 === analysisToDelete) { setCompareSlot1(""); setCompareResult1(null); }
        if (compareSlot2 === analysisToDelete) { setCompareSlot2(""); setCompareResult2(null); }
      }
    } catch (err) {
      toast.error("Erreur lors de la suppression");
      console.error(err);
    } finally {
      setDeleteDialogOpen(false);
      setAnalysisToDelete(null);
    }
  };

  const handleCompareAdd = (id: string) => {
    if (!compareSlot1) {
      setCompareSlot1(id);
      toast.info("Analyse ajoutée au slot 1. Sélectionnez une 2e analyse.");
    } else if (!compareSlot2 && id !== compareSlot1) {
      setCompareSlot2(id);
      toast.success("2 analyses sélectionnées ! Cliquez 'Comparer' pour voir la comparaison.");
    } else {
      toast.info("Les 2 slots sont déjà remplis. Videz un slot d'abord.");
    }
  };

  // Load compare results when both slots are filled
  useEffect(() => {
    const loadCompare = async () => {
      if (compareSlot1 && compareSlot2) {
        const uid = user?.id ?? undefined;
        const [r1, r2] = await Promise.all([
          getAnalysisById(compareSlot1, uid),
          getAnalysisById(compareSlot2, uid),
        ]);
        setCompareResult1(r1);
        setCompareResult2(r2);
      }
    };
    loadCompare();
  }, [compareSlot1, compareSlot2, user?.id]);

  // Statistics
  const statistics = useMemo(() => ({
    total: analyses.length,
    averageScore: analyses.length > 0 ? Math.round(analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length) : 0,
    bestScore: analyses.length > 0 ? Math.max(...analyses.map((a) => a.score)) : 0,
  }), [analyses]);

  const getGradeColor = (grade: string) => {
    switch (grade.toUpperCase()) {
      case "A+": case "A": return "bg-green-500/20 text-green-200 border-green-500/50";
      case "B": return "bg-blue-500/20 text-blue-200 border-blue-500/50";
      case "C": return "bg-yellow-500/20 text-yellow-200 border-yellow-500/50";
      case "D": return "bg-red-500/20 text-red-200 border-red-500/50";
      default: return "bg-gray-500/20 text-gray-200 border-gray-500/50";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  // Admin actions
  const handleAdminClearCache = async () => {
    try {
      const count = await clearAllAnalyses(user?.id ?? undefined);
      await loadAnalyses();
      setSelectedAnalysis(null);
      setCompareResult1(null); setCompareResult2(null);
      setCompareSlot1(""); setCompareSlot2("");
      toast.success(`Cache vidé : ${count} analyse(s) supprimée(s).`);
    } catch (e) { console.error(e); toast.error("Erreur lors du vidage du cache."); }
  };

  const handleAdminResetTestUsers = () => {
    try {
      localStorage.removeItem("apex_guest_mode");
      localStorage.removeItem("apex_guest_used");
      toast.success("Flags guest / test réinitialisés.");
    } catch { toast.error("Erreur réinitialisation."); }
  };

  const handleAdminExportStats = () => {
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        totalAnalyses: analyses.length,
        analyses: analyses.map((a) => ({ id: a.id, date: a.date, score: a.score, grade: a.grade, corner_count: a.corner_count, lap_time: a.lap_time })),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `apex-admin-stats-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Stats exportées en JSON.");
    } catch (e) { console.error(e); toast.error("Erreur export."); }
  };

  const exportDashboardPDFUltra = async (analyses: AnalysisSummary[]) => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      doc.setFillColor(239, 68, 68); doc.rect(0, 0, 210, 45, "F");
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(28);
      doc.text("APEX AI", 20, 25); doc.setFontSize(18); doc.text("TABLEAU DE BORD COMPLET", 20, 35);
      let yPos = 55;
      doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 0);
      doc.text("STATISTIQUES GLOBALES", 20, yPos); yPos += 10;
      const avgScore = (analyses.reduce((a, b) => a + b.score, 0) / analyses.length).toFixed(1);
      const bestScore = Math.max(...analyses.map((a) => a.score));
      doc.setFontSize(12); doc.setFont("helvetica", "normal");
      doc.text(`Total analyses: ${analyses.length}`, 20, yPos); yPos += 7;
      doc.text(`Score moyen: ${avgScore}/100`, 20, yPos); yPos += 7;
      doc.text(`Meilleur score: ${bestScore}/100`, 20, yPos); yPos += 15;
      doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.text("HISTORIQUE", 20, yPos); yPos += 10;
      autoTable(doc, {
        startY: yPos,
        head: [["Date", "Score", "Grade", "Virages", "Temps"]],
        body: analyses.map((a) => [new Date(a.date).toLocaleDateString("fr-FR"), `${a.score}/100`, a.grade, String(a.corner_count), `${a.lap_time.toFixed(1)}s`]),
        theme: "grid", styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: "bold" },
        margin: { left: 15, right: 15 },
      });
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i); doc.setFillColor(30, 58, 138); doc.rect(0, doc.internal.pageSize.height - 30, 210, 30, "F");
        doc.setTextColor(255); doc.setFontSize(10); doc.setFont("helvetica", "normal");
        doc.text("Apex AI - contact@apexai.run", 20, doc.internal.pageSize.height - 15);
        doc.text(`Page ${i}/${pageCount}`, 180, doc.internal.pageSize.height - 15, { align: "right" });
      }
      doc.save(`Apex-Dashboard-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("PDF error:", error);
      toast.error("Erreur PDF: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Chargement des analyses...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Empty state ──
  if (analyses.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto text-center py-16">
            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">Aucune analyse sauvegardée</h2>
            <p className="text-muted-foreground mb-8">Téléversez un fichier CSV pour commencer.</p>
            <Button variant="hero" size="lg" onClick={() => navigate("/upload")}>Analyser une session</Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  const latestAnalysis = analyses[0];
  const featuredScore = featuredAnalysis ? Math.round(getDisplayScore(featuredAnalysis.performance_score)) : latestAnalysis.score;
  const featuredGrade = featuredAnalysis?.performance_score?.grade || latestAnalysis.grade;
  const featuredSessionName = (featuredAnalysis as any)?.session_conditions?.session_name;
  const featuredPlotData = (featuredAnalysis as any)?.plot_data;

  return (
    <Layout>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <PageMeta title="Tableau de bord | ApexAI" description="Historique de vos analyses et comparaison de sessions." path="/dashboard" />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-2">Tableau de bord</h1>
              <p className="text-muted-foreground">Gérez et comparez vos analyses de performance</p>
            </div>
            <div className="flex gap-3">
              {analyses.length > 0 && (
                <Button className="gradient-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 active:scale-100" onClick={() => exportDashboardPDFUltra(analyses)}>
                  <FileDown className="w-4 h-4 mr-2" />Rapport PDF
                </Button>
              )}
              <Button variant="heroOutline" onClick={() => navigate("/upload")} disabled={subscriptionReady && isFreeTier && freeLimitReached}>
                Nouvelle analyse
              </Button>
            </div>
          </div>

          {/* Limit Warning */}
          {subscriptionReady && isFreeTier && (
            <Alert className="mb-6 border-primary/30 bg-primary/5">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertTitle>Plan Gratuit</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{freeLimitReached ? "Vous avez atteint la limite de 3 analyses ce mois-ci." : `${freeAnalysesRemaining} analyse${freeAnalysesRemaining !== 1 ? "s" : ""} restante${freeAnalysesRemaining !== 1 ? "s" : ""} ce mois-ci.`}</span>
                <Button variant="hero" size="sm" onClick={() => navigate("/pricing")} className="ml-4">Passer à PRO</Button>
              </AlertDescription>
            </Alert>
          )}
        </motion.div>

        {/* ═══ FEATURED LATEST ANALYSIS ═══ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div
            className="rounded-2xl p-6 mb-8"
            style={{
              border: "2px solid rgba(226, 75, 74, 0.4)",
              background: "rgba(226, 75, 74, 0.04)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-red-500/20 text-red-300 border-red-500/40">
                <Trophy className="w-3 h-3 mr-1" />Session la plus récente
              </Badge>
              <span className="text-sm text-muted-foreground">{formatDate(latestAnalysis.date)}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Score */}
              <div className="md:col-span-3 flex flex-col items-center justify-center">
                <div className="text-6xl font-display font-bold text-foreground mb-1">{featuredScore}</div>
                <div className="text-lg text-muted-foreground">/100</div>
                <Badge className={`mt-2 text-lg px-3 py-1 ${getGradeColor(featuredGrade)}`}>{featuredGrade}</Badge>
                {featuredSessionName && (
                  <div className="mt-2 text-sm text-muted-foreground">{featuredSessionName}</div>
                )}
              </div>

              {/* Mini-stats */}
              <div className="md:col-span-3 space-y-3">
                <div className="rounded-lg bg-secondary/50 p-3 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="text-xs text-muted-foreground">Meilleur tour</div>
                    <div className="font-bold text-foreground">{latestAnalysis.lap_time.toFixed(2)}s</div>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-xs text-muted-foreground">Virages détectés</div>
                    <div className="font-bold text-foreground">{latestAnalysis.corner_count}</div>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3 flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-xs text-muted-foreground">Tendance</div>
                    <div className="font-bold text-foreground">
                      {analyses.length >= 2 ? (analyses[0].score >= analyses[1].score ? "↑ En progrès" : "↓ Régression") : "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mini Track Map */}
              <div className="md:col-span-3">
                {featuredPlotData?.trajectory_2d?.corners?.length > 0 ? (
                  <div className="rounded-lg bg-secondary/30 p-2 h-[200px]">
                    <TrackMap
                      corners={featuredPlotData.trajectory_2d.corners}
                      margins={featuredPlotData.apex_margin?.corners}
                      laps={featuredPlotData.trajectory_2d.laps ? [featuredPlotData.trajectory_2d.laps[0]] : undefined}
                    />
                  </div>
                ) : (
                  <div className="rounded-lg bg-secondary/30 p-4 h-[200px] flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Carte non disponible</p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="md:col-span-3 flex flex-col gap-3 justify-center">
                <Button variant="hero" className="w-full" onClick={() => handleViewAnalysis(latestAnalysis.id)}>
                  <Eye className="w-4 h-4 mr-2" />Voir l'analyse complète
                </Button>
                <Button variant="heroOutline" className="w-full" onClick={() => handleCompareAdd(latestAnalysis.id)}>
                  <GitCompareArrows className="w-4 h-4 mr-2" />Comparer
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══ DISCRETE KPI CARDS ═══ */}
        <div className="grid grid-cols-3 gap-3 mb-8 opacity-80">
          <div className="rounded-lg bg-secondary/40 p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Analyses totales</div>
            <div className="text-lg font-bold text-foreground">{statistics.total}</div>
          </div>
          <div className="rounded-lg bg-secondary/40 p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Score moyen</div>
            <div className="text-lg font-bold text-foreground">{statistics.averageScore}/100</div>
          </div>
          <div className="rounded-lg bg-secondary/40 p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Meilleur score</div>
            <div className="text-lg font-bold text-foreground">{statistics.bestScore}/100</div>
          </div>
        </div>

        {/* ═══ COMPARATOR BAR ═══ */}
        {(compareSlot1 || compareSlot2) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-6">
            <Card className="glass-card border-primary/20">
              <CardContent className="py-4">
                <div className="flex items-center gap-4 justify-center">
                  <div className={`flex-1 rounded-lg p-3 text-center ${compareSlot1 ? "bg-primary/10 border border-primary/30" : "bg-secondary/50 border border-dashed border-white/10"}`}>
                    {compareSlot1 ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{analyses.find(a => a.id === compareSlot1)?.score}/100 — {formatDate(analyses.find(a => a.id === compareSlot1)?.date || "")}</span>
                        <Button variant="ghost" size="icon" onClick={() => { setCompareSlot1(""); setCompareResult1(null); }}><X className="w-3 h-3" /></Button>
                      </div>
                    ) : <span className="text-sm text-muted-foreground">Slot 1 — Cliquez ⇆ sur une analyse</span>}
                  </div>
                  <div className="text-lg font-bold text-primary">VS</div>
                  <div className={`flex-1 rounded-lg p-3 text-center ${compareSlot2 ? "bg-primary/10 border border-primary/30" : "bg-secondary/50 border border-dashed border-white/10"}`}>
                    {compareSlot2 ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{analyses.find(a => a.id === compareSlot2)?.score}/100 — {formatDate(analyses.find(a => a.id === compareSlot2)?.date || "")}</span>
                        <Button variant="ghost" size="icon" onClick={() => { setCompareSlot2(""); setCompareResult2(null); }}><X className="w-3 h-3" /></Button>
                      </div>
                    ) : <span className="text-sm text-muted-foreground">Slot 2</span>}
                  </div>
                  {compareSlot1 && compareSlot2 && (
                    <Button variant="hero" size="sm" onClick={() => setShowCompare(true)}>Comparer</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* ═══ ANALYSIS LIST ═══ */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle>Toutes les analyses</CardTitle>
            <CardDescription>
              {analyses.length} analyse{analyses.length > 1 ? "s" : ""} sauvegardée{analyses.length > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Virages</TableHead>
                    <TableHead>Temps tour</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyses.map((analysis) => (
                    <TableRow key={analysis.id} className="hover:bg-white/5">
                      <TableCell className="font-medium">{formatDate(analysis.date)}</TableCell>
                      <TableCell><span className="font-bold">{analysis.score}/100</span></TableCell>
                      <TableCell><Badge className={getGradeColor(analysis.grade)}>{analysis.grade}</Badge></TableCell>
                      <TableCell>{analysis.corner_count}</TableCell>
                      <TableCell>{analysis.lap_time.toFixed(2)}s</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" title="Voir l'analyse" onClick={() => handleViewAnalysis(analysis.id)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Comparer" onClick={() => handleCompareAdd(analysis.id)}>
                            <GitCompareArrows className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Déplacer (bientôt)" onClick={() => toast.info("Système de dossiers bientôt disponible !")}>
                            <FolderInput className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Supprimer" onClick={() => handleDeleteClick(analysis.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Admin Panel */}
        {isAdmin && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-6 bg-gradient-to-r from-red-600 to-red-700 rounded-2xl border border-red-500/30 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6">Panel Admin</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 rounded-xl p-6 text-center border border-white/20"><div className="text-3xl font-bold text-white">{analyses.length}</div><div className="text-white/90 text-sm">Analyses totales</div></div>
              <div className="bg-white/10 rounded-xl p-6 text-center border border-white/20"><div className="text-3xl font-bold text-white">—</div><div className="text-white/90 text-sm">Utilisateurs actifs</div></div>
              <div className="bg-white/10 rounded-xl p-6 text-center border border-white/20"><div className="text-3xl font-bold text-white">—</div><div className="text-white/90 text-sm">CA généré</div></div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <Button type="button" onClick={handleAdminClearCache} className="p-4 h-auto flex items-center justify-center gap-3 bg-white/15 border border-white/30 text-white hover:bg-white/25"><RefreshCw className="w-5 h-5" />Vider cache IA</Button>
              <Button type="button" onClick={handleAdminResetTestUsers} className="p-4 h-auto flex items-center justify-center gap-3 bg-white/15 border border-white/30 text-white hover:bg-white/25"><Trash2 className="w-5 h-5" />Reset users test</Button>
              <Button type="button" onClick={handleAdminExportStats} className="p-4 h-auto flex items-center justify-center gap-3 bg-white/15 border border-white/30 text-white hover:bg-white/25"><Download className="w-5 h-5" />Exporter stats</Button>
            </div>
          </motion.div>
        )}

        {/* Delete Confirmation */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer l'analyse</DialogTitle>
              <DialogDescription>Cette action est irréversible.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>Supprimer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ═══ FULL-SCREEN ANALYSIS OVERLAY ═══ */}
        <AnimatePresence>
          {showDetailOverlay && selectedAnalysis && createPortal(
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-background overflow-y-auto"
            >
              <div className="container mx-auto px-4 py-6 max-w-6xl">
                {/* Top bar */}
                <div className="flex items-center justify-between mb-6 sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4 border-b border-white/5">
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={handleCloseOverlay}>
                    <ArrowLeft className="w-4 h-4 mr-2" />Retour au tableau de bord
                  </Button>
                  <div className="flex items-center gap-2">
                    <Badge className={getGradeColor(selectedAnalysis.performance_score.grade)}>
                      {selectedAnalysis.performance_score.grade}
                    </Badge>
                    <span className="text-lg font-bold text-foreground">
                      {Math.round(getDisplayScore(selectedAnalysis.performance_score))}/100
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="heroOutline" size="sm" onClick={() => { handleCompareAdd(selectedAnalysis.analysis_id); handleCloseOverlay(); }}>
                      <GitCompareArrows className="w-4 h-4 mr-2" />Comparer
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(selectedAnalysis.analysis_id)}>
                      <Trash2 className="w-4 h-4 mr-2" />Supprimer
                    </Button>
                  </div>
                </div>

                {/* Full analysis content */}
                <AnalysisDashboardContent analysis={mapApiResultToResponse(selectedAnalysis)} embedded />
              </div>
            </motion.div>,
            document.body
          )}
        </AnimatePresence>

        {/* ═══ COMPARE OVERLAY ═══ */}
        <AnimatePresence>
          {showCompare && compareResult1 && compareResult2 && createPortal(
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-background overflow-y-auto"
            >
              <div className="container mx-auto px-4 py-6 max-w-7xl">
                <div className="flex items-center justify-between mb-6 sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4 border-b border-white/5">
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => setShowCompare(false)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />Retour
                  </Button>
                  <h2 className="text-xl font-bold text-foreground">Comparaison de sessions</h2>
                  <div />
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 items-center">
                  <Card className="glass-card md:col-span-2">
                    <CardContent className="pt-6 text-center">
                      <Badge className={getGradeColor(compareResult1.performance_score.grade)}>{compareResult1.performance_score.grade}</Badge>
                      <div className="text-4xl font-bold text-foreground mt-2">{Math.round(getDisplayScore(compareResult1.performance_score))}/100</div>
                      <div className="text-sm text-muted-foreground mt-1">{compareResult1.corners_detected} virages • {compareResult1.lap_time.toFixed(2)}s</div>
                    </CardContent>
                  </Card>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">VS</div>
                    <div className={`text-lg font-bold mt-1 ${getDisplayScore(compareResult2.performance_score) > getDisplayScore(compareResult1.performance_score) ? "text-green-400" : getDisplayScore(compareResult2.performance_score) < getDisplayScore(compareResult1.performance_score) ? "text-red-400" : "text-foreground"}`}>
                      {getDisplayScore(compareResult2.performance_score) > getDisplayScore(compareResult1.performance_score) ? "+" : ""}
                      {(getDisplayScore(compareResult2.performance_score) - getDisplayScore(compareResult1.performance_score)).toFixed(1)} pts
                    </div>
                    <div className={`text-sm ${compareResult2.lap_time < compareResult1.lap_time ? "text-green-400" : "text-red-400"}`}>
                      {compareResult2.lap_time < compareResult1.lap_time ? "-" : "+"}{Math.abs(compareResult2.lap_time - compareResult1.lap_time).toFixed(2)}s
                    </div>
                  </div>

                  <Card className="glass-card md:col-span-2">
                    <CardContent className="pt-6 text-center">
                      <Badge className={getGradeColor(compareResult2.performance_score.grade)}>{compareResult2.performance_score.grade}</Badge>
                      <div className="text-4xl font-bold text-foreground mt-2">{Math.round(getDisplayScore(compareResult2.performance_score))}/100</div>
                      <div className="text-sm text-muted-foreground mt-1">{compareResult2.corners_detected} virages • {compareResult2.lap_time.toFixed(2)}s</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Side-by-side charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Session 1</h3>
                    <AnalysisDashboardContent analysis={mapApiResultToResponse(compareResult1)} embedded />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Session 2</h3>
                    <AnalysisDashboardContent analysis={mapApiResultToResponse(compareResult2)} embedded />
                  </div>
                </div>
              </div>
            </motion.div>,
            document.body
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
