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
  ChevronRight,
  Plus,
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
  getAllFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  moveAnalysisToFolder,
  type AnalysisSummary,
  type AnalysisFolder
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
  const [folders, setFolders] = useState<AnalysisFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
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
  const [moveAnalysisId, setMoveAnalysisId] = useState<string | null>(null);
  const [moveTargetFolderId, setMoveTargetFolderId] = useState<string>("root");
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

  // Featured: latest analysis full data
  const [featuredAnalysis, setFeaturedAnalysis] = useState<AnalysisResult | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const uid = user?.id ?? undefined;
      const [allAnalyses, allFolders] = await Promise.all([
        getAllAnalyses(uid),
        getAllFolders(uid),
      ]);
      setAnalyses(allAnalyses);
      setFolders(allFolders);

      // Load the latest analysis for featured card
      if (allAnalyses.length > 0) {
        const latestId = allAnalyses[0].id;
        const latest = await getAnalysisById(latestId, uid);
        setFeaturedAnalysis(latest);
      }
    } catch (err) {
      setError("Erreur lors du chargement des données");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  // Folder Actions
  const handleCreateFolder = () => {
    const name = prompt("Nom du dossier ?");
    if (name) {
      createFolder(name, currentFolderId, user?.id);
      loadData();
    }
  };

  const handleFolderDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Voulez-vous supprimer ce dossier et tout son contenu ?")) {
      deleteFolder(id, user?.id);
      loadData();
    }
  };

  const handleMoveAnalysisRequest = (id: string) => {
    setMoveAnalysisId(id);
    const folder = folders.find(f => f.analysisIds.includes(id));
    setMoveTargetFolderId(folder?.id || "root");
    setIsMoveDialogOpen(true);
  };

  const handleConfirmMove = () => {
    if (moveAnalysisId) {
      moveAnalysisToFolder(moveAnalysisId, moveTargetFolderId === "root" ? null : moveTargetFolderId, user?.id);
      loadData();
      toast.success("Analyse déplacée");
      setIsMoveDialogOpen(false);
      setMoveAnalysisId(null);
    }
  };

  const currentFolder = useMemo(() => folders.find(f => f.id === currentFolderId), [folders, currentFolderId]);
  const visibleFolders = useMemo(() => folders.filter(f => f.parentId === currentFolderId), [folders, currentFolderId]);
  const visibleAnalyses = useMemo(() => {
    if (currentFolderId) {
      const folder = folders.find(f => f.id === currentFolderId);
      return analyses.filter(a => folder?.analysisIds.includes(a.id));
    }
    // At root, show analyses that ARE NOT in any folder
    const inFolders = new Set(folders.flatMap(f => f.analysisIds));
    return analyses.filter(a => !inFolders.has(a.id));
  }, [analyses, folders, currentFolderId]);

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
        await loadData();
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
      await loadData();
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
              <h1 className="font-display text-4xl font-bold text-foreground">Tableau de bord</h1>
              <p className="text-muted-foreground mt-1">Gère et compare tes sessions</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="bg-secondary/50 border-white/10" onClick={() => exportDashboardPDFUltra(analyses)}>
                <FileDown className="w-4 h-4 mr-2" />Rapport PDF
              </Button>
              <Button variant="hero" onClick={() => navigate("/upload")}>
                + Nouvelle analyse
              </Button>
            </div>
          </div>
        </motion.div>

        {/* ═══ FEATURED CARD ═══ */}
        {featuredAnalysis && !currentFolderId && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mb-12">
            <div 
              className="rounded-2xl p-8 border-2 border-primary/40 bg-primary/5 relative overflow-hidden group shadow-2xl shadow-primary/5"
            >
              <div className="absolute top-8 right-8 text-7xl font-display font-bold text-primary opacity-20 group-hover:opacity-30 transition-opacity">
                {featuredScore}
              </div>
              
              <Badge className="bg-red-500/20 text-red-300 border-none mb-4 px-3 py-1">
                SESSION LA PLUS RÉCENTE
              </Badge>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
                <div>
                  <h3 className="text-3xl font-bold text-foreground mb-1">
                    {featuredAnalysis.session_conditions?.session_name || featuredAnalysis.session_conditions?.circuit_name || featuredAnalysis.analysis_id || "Session"}
                  </h3>
                  <p className="text-muted-foreground text-lg mb-8 uppercase tracking-widest flex items-center gap-2">
                    {formatDate(featuredAnalysis.timestamp)} <span className="w-1 h-1 rounded-full bg-muted-foreground" /> PRACTICE
                  </p>

                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-secondary/40 p-4 rounded-xl">
                      <div className="text-xl font-bold text-foreground">{featuredAnalysis.lap_time.toFixed(2)}s</div>
                      <div className="text-[10px] text-muted-foreground uppercase mt-1 letter-spacing-wider">Best Lap</div>
                    </div>
                    <div className="bg-secondary/40 p-4 rounded-xl">
                      <div className="text-xl font-bold text-foreground">{featuredAnalysis.corners_detected}</div>
                      <div className="text-[10px] text-muted-foreground uppercase mt-1">Corners</div>
                    </div>
                    <div className="bg-secondary/40 p-4 rounded-xl">
                      <div className="text-xl font-bold text-green-500">+1.2s</div>
                      <div className="text-[10px] text-muted-foreground uppercase mt-1 font-bold">Gain AI</div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button variant="hero" className="flex-1 h-12 shadow-lg shadow-primary/20" onClick={() => handleViewAnalysis(featuredAnalysis.analysis_id)}>
                      <Eye className="w-4 h-4 mr-2" />Voir l'analyse complète
                    </Button>
                    <Button variant="heroOutline" className="flex-1 h-12" onClick={() => handleCompareAdd(featuredAnalysis.analysis_id)}>
                      <GitCompareArrows className="w-4 h-4 mr-2" />Comparer
                    </Button>
                  </div>
                </div>

                <div className="h-64 bg-secondary/10 rounded-2xl border border-white/5 p-4 relative group-hover:border-primary/20 transition-colors">
                  <TrackMap
                    corners={featuredAnalysis.plot_data?.trajectory_2d?.corners || []}
                    laps={
                      featuredAnalysis.plot_data?.trajectory_2d?.laps
                        ? [
                            featuredAnalysis.plot_data.trajectory_2d.laps.find((l: any) => l.is_best) ||
                            [...featuredAnalysis.plot_data.trajectory_2d.laps].sort((a: any, b: any) => {
                              const distA = a.distance_m?.length ? a.distance_m[a.distance_m.length - 1] : 0;
                              const distB = b.distance_m?.length ? b.distance_m[b.distance_m.length - 1] : 0;
                              return distB - distA;
                            })[0]
                          ].filter(Boolean)
                        : []
                    }
                    transparent
                    padding={100}
                    className="h-full"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/90 to-transparent flex items-end justify-center pb-3">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] opacity-50">Aperçu du tracé</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ STATS MINI CARDS ═══ */}
        <div className="grid grid-cols-3 gap-4 mb-12 opacity-70 group hover:opacity-100 transition-opacity">
          <div className="bg-secondary/20 p-4 rounded-xl border border-white/5 text-center">
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Analyses totales</div>
            <div className="text-3xl font-bold text-foreground">{statistics.total}</div>
          </div>
          <div className="bg-secondary/20 p-4 rounded-xl border border-white/5 text-center">
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Score moyen</div>
            <div className="text-3xl font-bold text-foreground">{statistics.averageScore}/100</div>
          </div>
          <div className="bg-secondary/20 p-4 rounded-xl border border-white/5 text-center">
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Meilleur score</div>
            <div className="text-3xl font-bold text-foreground text-primary">{statistics.bestScore}/100</div>
          </div>
        </div>

        {/* ═══ FOLDERS SYSTEM ═══ */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Mes Dossiers</h2>
              {currentFolderId && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <span className="font-bold">{currentFolder?.name}</span>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-primary gap-1" onClick={handleCreateFolder}>
              <Plus className="w-3 h-3" /> Nouveau dossier
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentFolderId && (
              <Card className="glass-card p-6 flex flex-col items-center justify-center cursor-pointer border-dashed border-white/10 hover:border-primary/50 transition-all hover:bg-white/5 active:scale-95" onClick={() => setCurrentFolderId(null)}>
                <ArrowLeft className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="font-bold text-foreground text-sm uppercase">Retour</span>
              </Card>
            )}
            {visibleFolders.map(folder => (
              <Card key={folder.id} className="glass-card p-6 cursor-pointer hover:border-primary/50 transition-all group relative hover:translate-y-[-4px]" onClick={() => setCurrentFolderId(folder.id)}>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-lg shadow-primary/0 group-hover:shadow-primary/20">
                    <FolderInput className="w-6 h-6" />
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8" onClick={(e) => handleFolderDelete(folder.id, e)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <h3 className="font-bold text-xl text-foreground mb-1 group-hover:text-primary transition-colors">{folder.name}</h3>
                <p className="text-sm text-muted-foreground">{folder.analysisIds.length} analyses</p>
                <div className="flex gap-2 mt-4">
                  <Badge variant="secondary" className="bg-white/5 text-[9px] py-0 px-2 uppercase border-none">Practice</Badge>
                  <Badge variant="secondary" className="bg-white/5 text-[9px] py-0 px-2 uppercase border-none">2026</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* ═══ COMPARATOR SLOT-BASED ═══ */}
        <div className="mb-12">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground mb-6">Comparateur</h2>
          <div className="flex flex-col md:flex-row items-center gap-1">
            <div className={`flex-1 w-full h-16 rounded-2xl border-2 flex items-center justify-between px-6 transition-all ${compareSlot1 ? "border-primary bg-primary/5 shadow-inner" : "border-dashed border-white/10 bg-secondary/10"}`}>
               <span className={compareSlot1 ? "font-bold text-foreground" : "text-muted-foreground italic text-sm"}>
                  {compareSlot1 ? (
                    (() => {
                      const a = analyses.find(x => x.id === compareSlot1);
                      return `${a?.score}/100 — ${a?.session_name || a?.circuit_name || "Session"}`;
                    })()
                  ) : "Choisir une analyse (cliquez ⇆)"}
               </span>
               {compareSlot1 && <Button variant="ghost" size="icon" onClick={() => setCompareSlot1("")}><X className="w-4 h-4" /></Button>}
            </div>
            
            <div className="px-4 py-2 flex items-center justify-center">
              <span className="text-xl font-black text-primary italic">VS</span>
            </div>

            <div className={`flex-1 w-full h-16 rounded-2xl border-2 flex items-center justify-between px-6 transition-all ${compareSlot2 ? "border-primary bg-primary/5 shadow-inner" : "border-dashed border-white/10 bg-secondary/10"}`}>
               <span className={compareSlot2 ? "font-bold text-foreground" : "text-muted-foreground italic text-sm"}>
                  {compareSlot2 ? (
                    (() => {
                      const a = analyses.find(x => x.id === compareSlot2);
                      return `${a?.score}/100 — ${a?.session_name || a?.circuit_name || "Session"}`;
                    })()
                  ) : "Deuxième analyse..."}
               </span>
               {compareSlot2 && <Button variant="ghost" size="icon" onClick={() => setCompareSlot2("")}><X className="w-4 h-4" /></Button>}
            </div>
            
            <Button variant="hero" className="w-full md:w-40 h-16 md:ml-4 rounded-2xl font-bold shadow-xl shadow-primary/10" disabled={!compareSlot1 || !compareSlot2} onClick={() => setShowCompare(true)}>
              COMPARER
            </Button>
          </div>
        </div>

        {/* ═══ ALL ANALYSES TABLE ═══ */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground mb-6">Toutes les analyses</h2>
          <Card className="glass-card overflow-hidden">
            <Table>
              <TableHeader className="bg-secondary/30">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="py-5">Session</TableHead>
                  <TableHead>Dossier</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Temps</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleAnalyses.map(analysis => (
                  <TableRow key={analysis.id} className="hover:bg-white/5 border-white/5 transition-colors group">
                    <TableCell className="py-5">
                      <div className="font-bold text-foreground">{formatDate(analysis.date)}</div>
                      <div className="text-xs text-muted-foreground group-hover:text-primary transition-colors">{analysis.session_name || analysis.circuit_name || "Session"} — Practice</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase border-white/10 bg-white/5">
                        {folders.find(f => f.analysisIds.includes(analysis.id))?.name || "Racine"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                         <span className="font-black text-lg text-primary">{analysis.score}</span>
                         <Badge className={`${getGradeColor(analysis.grade)} border-none text-[10px]`}>{analysis.grade}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-foreground font-bold">{analysis.lap_time.toFixed(2)}s</TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" title="Voir" className="h-10 w-10 hover:bg-primary/20 hover:text-primary" onClick={() => handleViewAnalysis(analysis.id)}><Eye className="w-5 h-5" /></Button>
                        <Button variant="ghost" size="icon" title="Comparer" className="h-10 w-10 hover:bg-primary/20 hover:text-primary" onClick={() => handleCompareAdd(analysis.id)}><GitCompareArrows className="w-5 h-5" /></Button>
                        <Button variant="ghost" size="icon" title="Changer de dossier" className="h-10 w-10 hover:bg-primary/20 hover:text-primary" onClick={() => handleMoveAnalysisRequest(analysis.id)}><FolderInput className="w-5 h-5" /></Button>
                        <Button variant="ghost" size="icon" title="Supprimer" className="h-10 w-10 hover:bg-red-500/20 hover:text-red-500" onClick={() => handleDeleteClick(analysis.id)}><Trash2 className="w-5 h-5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* ═══ DETAIL OVERLAY ═══ */}
        <AnimatePresence>
          {showDetailOverlay && selectedAnalysis && (
            <motion.div 
              initial={{ opacity: 0, x: 100 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 100 }}
              className="fixed inset-0 z-[100] bg-background flex flex-col md:flex-row shadow-2xl overflow-hidden"
            >
              <div className="w-full h-full flex flex-col overflow-y-auto custom-scrollbar bg-background">
                <div className="sticky top-0 z-10 p-6 flex items-center justify-between border-b border-white/5 bg-background/80 backdrop-blur-xl">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="hover:bg-white/5" onClick={handleCloseOverlay}><ArrowLeft className="w-6 h-6" /></Button>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Détails de l'analyse</h2>
                      <p className="text-sm text-muted-foreground uppercase tracking-widest">{selectedAnalysis.session_conditions?.session_name || selectedAnalysis.session_conditions?.circuit_name || selectedAnalysis.analysis_id || "Session"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={`${getGradeColor(selectedAnalysis.performance_score.grade)} border-none py-1.5 px-4 text-sm font-black`}>
                      {selectedAnalysis.performance_score.grade} ({getDisplayScore(selectedAnalysis.performance_score)})
                    </Badge>
                    <Button variant="hero" onClick={() => window.print()}><FileDown className="w-4 h-4 mr-2" /> PDF</Button>
                  </div>
                </div>

                <div className="p-8 pb-32 max-w-7xl mx-auto w-full">
                   <AnalysisDashboardContent analysis={mapApiResultToResponse(selectedAnalysis)} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ COMPARISON OVERLAY ═══ */}
        <AnimatePresence>
          {showCompare && compareResult1 && compareResult2 && (
            <motion.div 
              initial={{ opacity: 0, y: "100%" }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: "100%" }}
              className="fixed inset-0 z-[110] bg-background flex flex-col overflow-hidden"
            >
              <div className="p-6 flex items-center justify-between bg-secondary/50 border-b border-white/5 backdrop-blur-xl">
                <div className="flex items-center gap-4 text-foreground">
                  <GitCompareArrows className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold">Comparaison Side-by-Side</h2>
                </div>
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full border border-white/10" onClick={() => setShowCompare(false)}><X className="w-6 h-6" /></Button>
              </div>

              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 md:p-8 border-r border-white/5 custom-scrollbar bg-background">
                   <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-primary block mb-1">Session A</span>
                        <h3 className="font-bold text-lg">{compareResult1.session_conditions?.session_name || compareResult1.session_conditions?.circuit_name || compareResult1.analysis_id || "Session A"}</h3>
                      </div>
                      <div className="text-right">
                         <div className="text-2xl font-black text-primary">{getDisplayScore(compareResult1.performance_score)}</div>
                         <div className="text-[10px] text-muted-foreground">{compareResult1.lap_time.toFixed(2)}s</div>
                      </div>
                   </div>
                   <AnalysisDashboardContent analysis={mapApiResultToResponse(compareResult1)} embedded />
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-background">
                   <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-primary block mb-1">Session B</span>
                        <h3 className="font-bold text-lg">{compareResult2.session_conditions?.session_name || compareResult2.session_conditions?.circuit_name || compareResult2.analysis_id || "Session B"}</h3>
                      </div>
                      <div className="text-right">
                         <div className="text-2xl font-black text-primary">{getDisplayScore(compareResult2.performance_score)}</div>
                         <div className="text-[10px] text-muted-foreground">{compareResult2.lap_time.toFixed(2)}s</div>
                      </div>
                   </div>
                   <AnalysisDashboardContent analysis={mapApiResultToResponse(compareResult2)} embedded />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ MOVE FOLDER DIALOG ═══ */}
        <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>Déplacer l'analyse</DialogTitle>
              <DialogDescription>Choisissez le dossier de destination.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select value={moveTargetFolderId} onValueChange={setMoveTargetFolderId}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Choisir un dossier..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-white/10">
                  <SelectItem value="root">Racine (Aucun dossier)</SelectItem>
                  {folders.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsMoveDialogOpen(false)}>Annuler</Button>
              <Button variant="hero" onClick={handleConfirmMove}>Déplacer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ═══ DELETE DIALOG ═══ */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="glass-card border-red-500/20">
            <DialogHeader>
              <DialogTitle>Supprimer l'analyse ?</DialogTitle>
              <DialogDescription>Cette action est irréversible.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>Supprimer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
