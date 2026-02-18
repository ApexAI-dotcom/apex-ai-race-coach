import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Target,
  Clock,
  Download,
  Trash2,
  Eye,
  Compare,
  BarChart3,
  Zap,
  AlertCircle,
  X,
  ArrowLeft,
  FileDown,
  CheckCircle2,
  ExternalLink,
  Save,
  Database,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  downloadAnalysis,
  type AnalysisSummary,
} from "@/lib/storage";
import type { AnalysisResult, CornerAnalysis, CoachingAdvice } from "@/lib/api";
import { useSubscription } from "@/hooks/useSubscription";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const analysisIdParam = searchParams.get("analysisId");
  const { subscription, limits, isPro } = useSubscription();

  // States
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null);
  const [compareAnalysis1, setCompareAnalysis1] = useState<string>("");
  const [compareAnalysis2, setCompareAnalysis2] = useState<string>("");
  const [compareResult1, setCompareResult1] = useState<AnalysisResult | null>(null);
  const [compareResult2, setCompareResult2] = useState<AnalysisResult | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculer les analyses du mois actuel
  const getCurrentMonthAnalyses = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return analyses.filter((analysis) => {
      const analysisDate = new Date(analysis.date);
      return (
        analysisDate.getMonth() === currentMonth &&
        analysisDate.getFullYear() === currentYear
      );
    });
  };

  const currentMonthAnalyses = getCurrentMonthAnalyses();
  const analysesRemaining =
    limits.maxAnalysesPerMonth === Infinity
      ? Infinity
      : Math.max(0, limits.maxAnalysesPerMonth - currentMonthAnalyses.length);
  const hasReachedLimit = !isPro && currentMonthAnalyses.length >= limits.maxAnalysesPerMonth;

  // Load analyses on mount
  useEffect(() => {
    loadAnalyses();
  }, []);

  // Load specific analysis from query param
  useEffect(() => {
    if (analysisIdParam) {
      loadAnalysis(analysisIdParam);
    }
  }, [analysisIdParam]);

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      const allAnalyses = await getAllAnalyses();
      setAnalyses(allAnalyses);
    } catch (err) {
      setError("Erreur lors du chargement des analyses");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysis = async (id: string) => {
    try {
      const analysis = await getAnalysisById(id);
      if (analysis) {
        setSelectedAnalysis(analysis);
      } else {
        setError(`Analyse ${id} non trouvée`);
      }
    } catch (err) {
      setError(`Erreur lors du chargement de l'analyse ${id}`);
      console.error(err);
    }
  };

  const handleViewAnalysis = async (id: string) => {
    await loadAnalysis(id);
    setSearchParams({ analysisId: id });
  };

  const handleDeleteClick = (id: string) => {
    setAnalysisToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!analysisToDelete) return;

    try {
      const success = await deleteAnalysis(analysisToDelete);
      if (success) {
        // Reload analyses
        await loadAnalyses();

        // Clear selected if deleted
        if (selectedAnalysis?.analysis_id === analysisToDelete) {
          setSelectedAnalysis(null);
          setSearchParams({});
        }

        // Clear compare if deleted
        if (compareAnalysis1 === analysisToDelete) {
          setCompareAnalysis1("");
          setCompareResult1(null);
        }
        if (compareAnalysis2 === analysisToDelete) {
          setCompareAnalysis2("");
          setCompareResult2(null);
        }
      }
    } catch (err) {
      setError("Erreur lors de la suppression");
      console.error(err);
    } finally {
      setDeleteDialogOpen(false);
      setAnalysisToDelete(null);
    }
  };

  const handleCompareLoad = async () => {
    if (!compareAnalysis1 || !compareAnalysis2) return;

    try {
      const [result1, result2] = await Promise.all([
        getAnalysisById(compareAnalysis1),
        getAnalysisById(compareAnalysis2),
      ]);

      setCompareResult1(result1);
      setCompareResult2(result2);
    } catch (err) {
      setError("Erreur lors du chargement de la comparaison");
      console.error(err);
    }
  };

  useEffect(() => {
    if (compareAnalysis1 && compareAnalysis2) {
      handleCompareLoad();
    }
  }, [compareAnalysis1, compareAnalysis2]);

  // Statistics
  const statistics = {
    total: analyses.length,
    averageScore:
      analyses.length > 0
        ? Math.round(analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length)
        : 0,
    bestScore: analyses.length > 0 ? Math.max(...analyses.map((a) => a.score)) : 0,
    bestAnalysis:
      analyses.length > 0
        ? analyses.reduce((best, a) => (a.score > best.score ? a : best), analyses[0])
        : null,
  };

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

  if (analyses.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center py-16"
          >
            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">
              Aucune analyse sauvegardée
            </h2>
            <p className="text-muted-foreground mb-8">
              Vous n'avez pas encore d'analyses sauvegardées. Téléversez un fichier CSV pour
              commencer.
            </p>
            <Button variant="hero" size="lg" onClick={() => navigate("/upload")}>
              Aller au téléchargement
            </Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-2">
                Tableau de bord
              </h1>
              <p className="text-muted-foreground">Gérez et comparez vos analyses de performance</p>
            </div>
            <Button
              variant="heroOutline"
              onClick={() => navigate("/upload")}
              disabled={hasReachedLimit}
            >
              Nouvelle analyse
            </Button>
          </div>

          {/* Limit Warning for Free Plan */}
          {!isPro && (
            <Alert className="mb-6 border-primary/30 bg-primary/5">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertTitle>Plan Gratuit</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>
                  {hasReachedLimit
                    ? "Vous avez atteint la limite de 3 analyses ce mois-ci."
                    : `${analysesRemaining} analyse${analysesRemaining > 1 ? "s" : ""} restante${analysesRemaining > 1 ? "s" : ""} ce mois-ci.`}
                </span>
                <Button
                  variant="hero"
                  size="sm"
                  onClick={() => navigate("/pricing")}
                  className="ml-4"
                >
                  Passer à PRO
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <div className="text-xs text-muted-foreground">Analyses totales</div>
                </div>
                <div className="text-2xl font-bold text-foreground">{statistics.total}</div>
                {!isPro && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {currentMonthAnalyses.length}/{limits.maxAnalysesPerMonth} ce mois
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <div className="text-xs text-muted-foreground">Score moyen</div>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {statistics.averageScore}/100
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-primary" />
                  <div className="text-xs text-muted-foreground">Meilleur score</div>
                </div>
                <div className="text-2xl font-bold text-foreground">{statistics.bestScore}/100</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <div className="text-xs text-muted-foreground">Tendance</div>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {analyses.length >= 2
                    ? analyses[0].score >= analyses[1].score
                      ? "↗️"
                      : "↘️"
                    : "—"}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue="list" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Liste</TabsTrigger>
            <TabsTrigger value="compare">Comparer</TabsTrigger>
            {selectedAnalysis && <TabsTrigger value="details">Détails</TabsTrigger>}
          </TabsList>

          {/* List Tab */}
          <TabsContent value="list" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Toutes les analyses</CardTitle>
                <CardDescription>
                  {analyses.length} analyse{analyses.length > 1 ? "s" : ""} sauvegardée
                  {analyses.length > 1 ? "s" : ""}
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
                        <TableRow
                          key={analysis.id}
                          className="cursor-pointer hover:bg-white/5"
                          onClick={() => handleViewAnalysis(analysis.id)}
                        >
                          <TableCell className="font-medium">{formatDate(analysis.date)}</TableCell>
                          <TableCell>
                            <span className="font-bold">{analysis.score}/100</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={getGradeColor(analysis.grade)}>
                              {analysis.grade}
                            </Badge>
                          </TableCell>
                          <TableCell>{analysis.corner_count}</TableCell>
                          <TableCell>{analysis.lap_time.toFixed(2)}s</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewAnalysis(analysis.id);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadAnalysis(analysis.id);
                                }}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(analysis.id);
                                }}
                              >
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
          </TabsContent>

          {/* Compare Tab */}
          <TabsContent value="compare" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Comparer deux analyses</CardTitle>
                <CardDescription>
                  Sélectionnez deux analyses pour les comparer côte à côte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Analyse 1</label>
                    <Select value={compareAnalysis1} onValueChange={setCompareAnalysis1}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une analyse" />
                      </SelectTrigger>
                      <SelectContent>
                        {analyses.map((analysis) => (
                          <SelectItem key={analysis.id} value={analysis.id}>
                            {formatDate(analysis.date)} - {analysis.score}/100 ({analysis.grade})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Analyse 2</label>
                    <Select value={compareAnalysis2} onValueChange={setCompareAnalysis2}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une analyse" />
                      </SelectTrigger>
                      <SelectContent>
                        {analyses
                          .filter((a) => a.id !== compareAnalysis1)
                          .map((analysis) => (
                            <SelectItem key={analysis.id} value={analysis.id}>
                              {formatDate(analysis.date)} - {analysis.score}/100 ({analysis.grade})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {compareResult1 && compareResult2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Analysis 1 */}
                    <Card className="glass-card">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Analyse 1</span>
                          <Badge className={getGradeColor(compareResult1.performance_score.grade)}>
                            {compareResult1.performance_score.grade}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {formatDate(new Date(compareResult1.timestamp).toISOString())}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-foreground mb-2">
                            {Math.round(compareResult1.performance_score.overall_score)}/100
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {compareResult1.corners_detected} virages •{" "}
                            {compareResult1.lap_time.toFixed(2)}s
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Analysis 2 */}
                    <Card className="glass-card">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Analyse 2</span>
                          <Badge className={getGradeColor(compareResult2.performance_score.grade)}>
                            {compareResult2.performance_score.grade}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {formatDate(new Date(compareResult2.timestamp).toISOString())}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-foreground mb-2">
                            {Math.round(compareResult2.performance_score.overall_score)}/100
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {compareResult2.corners_detected} virages •{" "}
                            {compareResult2.lap_time.toFixed(2)}s
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Comparison */}
                    <Card className="glass-card md:col-span-2">
                      <CardHeader>
                        <CardTitle>Comparaison</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 rounded-lg bg-secondary/50">
                            <div className="text-xs text-muted-foreground mb-1">
                              Différence score
                            </div>
                            <div
                              className={`text-2xl font-bold ${
                                compareResult2.performance_score.overall_score >
                                compareResult1.performance_score.overall_score
                                  ? "text-green-400"
                                  : compareResult2.performance_score.overall_score <
                                      compareResult1.performance_score.overall_score
                                    ? "text-red-400"
                                    : "text-foreground"
                              }`}
                            >
                              {compareResult2.performance_score.overall_score >
                              compareResult1.performance_score.overall_score
                                ? "+"
                                : ""}
                              {(
                                compareResult2.performance_score.overall_score -
                                compareResult1.performance_score.overall_score
                              ).toFixed(1)}
                            </div>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-secondary/50">
                            <div className="text-xs text-muted-foreground mb-1">
                              Différence temps
                            </div>
                            <div
                              className={`text-2xl font-bold ${
                                compareResult2.lap_time < compareResult1.lap_time
                                  ? "text-green-400"
                                  : compareResult2.lap_time > compareResult1.lap_time
                                    ? "text-red-400"
                                    : "text-foreground"
                              }`}
                            >
                              {compareResult2.lap_time < compareResult1.lap_time ? "-" : "+"}
                              {Math.abs(compareResult2.lap_time - compareResult1.lap_time).toFixed(
                                2
                              )}
                              s
                            </div>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-secondary/50">
                            <div className="text-xs text-muted-foreground mb-1">
                              Différence virages
                            </div>
                            <div className="text-2xl font-bold text-foreground">
                              {compareResult2.corners_detected - compareResult1.corners_detected}
                            </div>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-secondary/50">
                            <div className="text-xs text-muted-foreground mb-1">Amélioration</div>
                            <div className="text-2xl font-bold text-foreground">
                              {compareResult2.performance_score.overall_score >
                              compareResult1.performance_score.overall_score
                                ? "✅"
                                : compareResult2.performance_score.overall_score <
                                    compareResult1.performance_score.overall_score
                                  ? "❌"
                                  : "➡️"}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Details Tab */}
          {selectedAnalysis && (
            <TabsContent value="details" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedAnalysis(null);
                    setSearchParams({});
                  }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à la liste
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => downloadAnalysis(selectedAnalysis.analysis_id)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger JSON
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteClick(selectedAnalysis.analysis_id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </div>

              {/* Score Card */}
              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Score de Performance
                    </span>
                    <Badge className={getGradeColor(selectedAnalysis.performance_score.grade)}>
                      {selectedAnalysis.performance_score.grade}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div className="text-6xl font-display font-bold bg-gradient-to-r from-primary to-pink-500 text-transparent bg-clip-text mb-2">
                      {Math.round(selectedAnalysis.performance_score.overall_score)}/100
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Percentile: {selectedAnalysis.performance_score.percentile || "N/A"}%
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-lg bg-secondary/50">
                      <div className="text-xs text-muted-foreground mb-1">Précision Apex</div>
                      <div className="text-lg font-bold text-foreground">
                        {Math.round(selectedAnalysis.performance_score.breakdown.apex_precision)}/30
                      </div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-secondary/50">
                      <div className="text-xs text-muted-foreground mb-1">Régularité</div>
                      <div className="text-lg font-bold text-foreground">
                        {Math.round(
                          selectedAnalysis.performance_score.breakdown.trajectory_consistency
                        )}
                        /20
                      </div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-secondary/50">
                      <div className="text-xs text-muted-foreground mb-1">Vitesse Apex</div>
                      <div className="text-lg font-bold text-foreground">
                        {Math.round(selectedAnalysis.performance_score.breakdown.apex_speed)}/25
                      </div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-secondary/50">
                      <div className="text-xs text-muted-foreground mb-1">Temps Secteurs</div>
                      <div className="text-lg font-bold text-foreground">
                        {Math.round(selectedAnalysis.performance_score.breakdown.sector_times)}/25
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="glass-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-primary" />
                      <div className="text-xs text-muted-foreground">Virages détectés</div>
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {selectedAnalysis.corners_detected}
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <div className="text-xs text-muted-foreground">Temps du tour</div>
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {selectedAnalysis.lap_time.toFixed(2)}s
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <div className="text-xs text-muted-foreground">Points de données</div>
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {selectedAnalysis.statistics.data_points}
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <div className="text-xs text-muted-foreground">Temps traitement</div>
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {selectedAnalysis.statistics.processing_time_seconds.toFixed(1)}s
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Coaching Advice */}
              {selectedAnalysis.coaching_advice && selectedAnalysis.coaching_advice.length > 0 && (
                <Card className="glass-card border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      Conseils de Coaching
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedAnalysis.coaching_advice.map((advice, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-lg bg-secondary/50 border border-white/5"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Priorité {advice.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs capitalize">
                                {advice.category}
                              </Badge>
                              {advice.corner && (
                                <Badge variant="outline" className="text-xs">
                                  Virage {advice.corner}
                                </Badge>
                              )}
                            </div>
                            {advice.impact_seconds > 0 && (
                              <span className="text-xs text-muted-foreground">
                                Gain potentiel: {advice.impact_seconds.toFixed(2)}s
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-foreground mb-1">{advice.message}</p>
                          <p className="text-sm text-muted-foreground">{advice.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Corner Analysis */}
              {selectedAnalysis.corner_analysis && selectedAnalysis.corner_analysis.length > 0 && (
                <Card className="glass-card border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Analyse des Virages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Virage</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Vitesse Réelle</TableHead>
                            <TableHead>Vitesse Optimale</TableHead>
                            <TableHead>G Latéral</TableHead>
                            <TableHead>Temps Perdu</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Grade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedAnalysis.corner_analysis.map((corner, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">#{corner.corner_number}</TableCell>
                              <TableCell className="capitalize">{corner.corner_type}</TableCell>
                              <TableCell>{corner.apex_speed_real.toFixed(1)} km/h</TableCell>
                              <TableCell>{corner.apex_speed_optimal.toFixed(1)} km/h</TableCell>
                              <TableCell>{corner.lateral_g_max.toFixed(2)}G</TableCell>
                              <TableCell>{corner.time_lost.toFixed(3)}s</TableCell>
                              <TableCell>{Math.round(corner.score)}/100</TableCell>
                              <TableCell>
                                <Badge className={getGradeColor(corner.grade)}>
                                  {corner.grade}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Plots */}
              {selectedAnalysis.plots && Object.keys(selectedAnalysis.plots).length > 0 && (
                <Card className="glass-card border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileDown className="w-5 h-5 text-primary" />
                      Graphiques Générés
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(selectedAnalysis.plots).map(([plotName, plotUrl]) => {
                        if (!plotUrl) return null;
                        const displayName = plotName
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase());
                        return (
                          <a
                            key={plotName}
                            href={plotUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-4 rounded-lg bg-secondary/50 border border-white/5 hover:border-primary/50 transition-colors group"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-foreground">
                                {displayName}
                              </span>
                              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <img
                              src={plotUrl}
                              alt={displayName}
                              className="w-full h-32 object-cover rounded border border-white/5"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          </a>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer l'analyse</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer cette analyse ? Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
