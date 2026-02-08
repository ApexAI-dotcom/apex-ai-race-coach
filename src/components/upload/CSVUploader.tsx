import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  Loader2,
  X,
  AlertCircle,
  Download,
  ExternalLink,
  TrendingUp,
  Target,
  Zap,
  Clock,
  Save,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  uploadAndAnalyzeCSV,
  checkBackendConnection,
  API_BASE_URL,
  type AnalysisResult,
  type ApiError,
} from "@/lib/api";
import { saveAnalysis, getAnalysesCount } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

interface CSVUploaderProps {
  onUploadComplete?: (data: AnalysisResult) => void;
}

export const CSVUploader = ({ onUploadComplete }: CSVUploaderProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, canUploadFree, guestUsed, guestUpload, consumeGuestSlot } = useAuth();
  const canUpload = isAuthenticated || canUploadFree;
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);
  const [analysesCount, setAnalysesCount] = useState<number>(0);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.name.endsWith(".csv")) {
      setFile(droppedFile);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.name.endsWith(".csv")) {
      setFile(selectedFile);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!file) return;
    if (!canUpload) {
      if (guestUsed) {
        toast({
          title: "Connexion requise",
          description: "Connectez-vous pour plus d'analyses.",
          action: (
            <ToastAction altText="Se connecter" onClick={() => navigate("/login")}>
              Se connecter
            </ToastAction>
          ),
        });
      } else {
        toast({
          title: "1 analyse gratuite",
          description: "Cliquez Essayer pour analyser sans compte.",
          action: (
            <ToastAction altText="Essayer" onClick={guestUpload}>
              Essayer
            </ToastAction>
          ),
        });
      }
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setStatusMessage("Vérification de la connexion au serveur...");

    try {
      // 1. Vérifier la connexion au backend
      const isConnected = await checkBackendConnection();
      if (!isConnected) {
        throw {
          success: false,
          error: "backend_unavailable",
          message: `Le serveur backend n'est pas accessible. Vérifiez qu'il est démarré (${API_BASE_URL})`,
        } as ApiError;
      }

      setStatusMessage("Upload du fichier CSV...");

      // 2. Upload et analyse
      const analysisResult = await uploadAndAnalyzeCSV(file);

      setResult(analysisResult);
      setIsAnalyzing(false);
      setIsComplete(true);
      setStatusMessage("");

      // Sauvegarder automatiquement l'analyse
      try {
        const analysisId = await saveAnalysis(analysisResult);
        setSavedAnalysisId(analysisId);
        setSaveSuccess(`Analyse sauvegardée avec ID: ${analysisId}`);

        // Mettre à jour le compteur
        const count = await getAnalysesCount();
        setAnalysesCount(count);

        // Effacer le message après 5 secondes
        setTimeout(() => {
          setSaveSuccess(null);
        }, 5000);
      } catch (saveError) {
        console.warn("Failed to auto-save analysis:", saveError);
        // Ne pas bloquer l'affichage des résultats si la sauvegarde échoue
      }

      if (!isAuthenticated && canUploadFree) consumeGuestSlot();
      onUploadComplete?.(analysisResult);
    } catch (err) {
      const apiError = err as ApiError;
      setIsAnalyzing(false);
      setIsComplete(false);
      setStatusMessage("");

      // Afficher message d'erreur user-friendly
      if (apiError.message) {
        setError(apiError.message);
      } else {
        setError("Une erreur inattendue s'est produite lors de l'analyse.");
      }
    }
  };

  // Charger le nombre d'analyses sauvegardées au montage
  useEffect(() => {
    const loadAnalysesCount = async () => {
      const count = await getAnalysesCount();
      setAnalysesCount(count);
    };
    loadAnalysesCount();
  }, []);

  const handleReset = () => {
    setFile(null);
    setIsComplete(false);
    setIsAnalyzing(false);
    setError(null);
    setResult(null);
    setStatusMessage("");
    setSavedAnalysisId(null);
    setSaveSuccess(null);
    // Recharger le compteur
    getAnalysesCount().then((count) => setAnalysesCount(count));
  };

  const handleSaveAnalysis = async () => {
    if (!result) return;

    try {
      setStatusMessage("Sauvegarde de l'analyse...");
      const analysisId = await saveAnalysis(result);
      setSavedAnalysisId(analysisId);
      setSaveSuccess(`Analyse sauvegardée avec ID: ${analysisId}`);

      // Mettre à jour le compteur
      const count = await getAnalysesCount();
      setAnalysesCount(count);

      // Effacer le message après 5 secondes
      setTimeout(() => {
        setSaveSuccess(null);
      }, 5000);
    } catch (error) {
      console.error("Error saving analysis:", error);
      setError(
        `Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : "Erreur inconnue"}`
      );
    } finally {
      setStatusMessage("");
    }
  };

  const handleViewInDashboard = () => {
    if (savedAnalysisId) {
      navigate(`/dashboard?analysisId=${savedAnalysisId}`);
    } else if (result?.analysis_id) {
      navigate(`/dashboard?analysisId=${result.analysis_id}`);
    }
  };

  const handleDownloadResults = () => {
    if (!result) return;

    const jsonString = JSON.stringify(result, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `apex-ai-analysis-${result.analysis_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-8"
    >
      {/* Storage Info */}
      {analysesCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center justify-center gap-2 text-sm text-muted-foreground"
        >
          <Database className="w-4 h-4" />
          <span>
            {analysesCount} analyse{analysesCount > 1 ? "s" : ""} sauvegardée
            {analysesCount > 1 ? "s" : ""} localement
          </span>
        </motion.div>
      )}

      {/* Success Save Alert */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            <Alert className="bg-green-500/10 border-green-500/50">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-200">Sauvegarde réussie</AlertTitle>
              <AlertDescription className="text-green-300">{saveSuccess}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isComplete && result ? (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-6"
          >
            {/* Success Header */}
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full gradient-success flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-success-foreground" />
              </div>
              <h3 className="text-2xl font-display font-bold text-foreground mb-2">
                Analyse terminée !
              </h3>
              <p className="text-muted-foreground mb-6">
                Votre session a été analysée avec succès.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button variant="heroOutline" onClick={handleReset}>
                  Nouvelle analyse
                </Button>
                <Button variant="hero" onClick={handleDownloadResults}>
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger JSON
                </Button>
                {(savedAnalysisId || result?.analysis_id) && (
                  <Button variant="heroOutline" onClick={handleViewInDashboard}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Voir dans le Dashboard
                  </Button>
                )}
                {!savedAnalysisId && result && (
                  <Button variant="outline" onClick={handleSaveAnalysis}>
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </Button>
                )}
              </div>
            </div>

            {/* Performance Score */}
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
                    {Math.round(result.performance_score.overall_score)}/100
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Percentile: {result.performance_score.percentile || "N/A"}%
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg bg-secondary/50">
                    <div className="text-xs text-muted-foreground mb-1">Précision Apex</div>
                    <div className="text-lg font-bold text-foreground">
                      {Math.round(result.performance_score.breakdown.apex_precision)}/30
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/50">
                    <div className="text-xs text-muted-foreground mb-1">Régularité</div>
                    <div className="text-lg font-bold text-foreground">
                      {Math.round(result.performance_score.breakdown.trajectory_consistency)}/20
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/50">
                    <div className="text-xs text-muted-foreground mb-1">Vitesse Apex</div>
                    <div className="text-lg font-bold text-foreground">
                      {Math.round(result.performance_score.breakdown.apex_speed)}/25
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/50">
                    <div className="text-xs text-muted-foreground mb-1">Temps Secteurs</div>
                    <div className="text-lg font-bold text-foreground">
                      {Math.round(result.performance_score.breakdown.sector_times)}/25
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
                    {result.corners_detected}
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
                    {result.lap_time.toFixed(2)}s
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
                    {result.statistics.data_points}
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
                    {result.statistics.processing_time_seconds.toFixed(1)}s
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Coaching Advice */}
            {result.coaching_advice && result.coaching_advice.length > 0 && (
              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Conseils de Coaching (Top {result.coaching_advice.length})
                  </CardTitle>
                  <CardDescription>
                    Conseils prioritaires pour améliorer votre performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.coaching_advice.map((advice, index) => (
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
                        <div className="mt-2">
                          <Badge variant="secondary" className="text-xs">
                            Difficulté: {advice.difficulty}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Corner Analysis */}
            {result.corner_analysis && result.corner_analysis.length > 0 && (
              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Analyse des Virages
                  </CardTitle>
                  <CardDescription>
                    Détails de performance pour chaque virage détecté
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="px-4 py-2 text-left text-muted-foreground">Virage</th>
                          <th className="px-4 py-2 text-left text-muted-foreground">Type</th>
                          <th className="px-4 py-2 text-left text-muted-foreground">
                            Vitesse Réelle
                          </th>
                          <th className="px-4 py-2 text-left text-muted-foreground">
                            Vitesse Optimale
                          </th>
                          <th className="px-4 py-2 text-left text-muted-foreground">G Latéral</th>
                          <th className="px-4 py-2 text-left text-muted-foreground">Temps Perdu</th>
                          <th className="px-4 py-2 text-left text-muted-foreground">Score</th>
                          <th className="px-4 py-2 text-left text-muted-foreground">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.corner_analysis.slice(0, 10).map((corner, index) => (
                          <tr key={index} className="border-b border-white/5 hover:bg-white/2">
                            <td className="px-4 py-2 text-foreground font-medium">
                              #{corner.corner_number}
                            </td>
                            <td className="px-4 py-2 text-foreground capitalize">
                              {corner.corner_type}
                            </td>
                            <td className="px-4 py-2 text-foreground">
                              {corner.apex_speed_real.toFixed(1)} km/h
                            </td>
                            <td className="px-4 py-2 text-foreground">
                              {corner.apex_speed_optimal.toFixed(1)} km/h
                            </td>
                            <td className="px-4 py-2 text-foreground">
                              {corner.lateral_g_max.toFixed(2)}G
                            </td>
                            <td className="px-4 py-2 text-foreground">
                              {corner.time_lost.toFixed(3)}s
                            </td>
                            <td className="px-4 py-2 text-foreground">
                              {Math.round(corner.score)}/100
                            </td>
                            <td className="px-4 py-2">
                              <Badge className={getGradeColor(corner.grade)}>{corner.grade}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Plots */}
            {result.plots && Object.keys(result.plots).length > 0 && (
              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-primary" />
                    Graphiques Générés
                  </CardTitle>
                  <CardDescription>Visualisations de votre performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(result.plots).map(([plotName, plotUrl]) => {
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
          </motion.div>
        ) : isAnalyzing ? (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-muted" />
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
            </div>
            <h3 className="text-xl font-display font-bold text-foreground mb-2">
              Analyse en cours...
            </h3>
            <p className="text-muted-foreground mb-2">Notre IA analyse vos données de course</p>
            {statusMessage && <p className="text-sm text-primary font-medium">{statusMessage}</p>}
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : file
                    ? "border-success bg-success/5"
                    : "border-border hover:border-primary/50 hover:bg-primary/5"
              }`}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {file ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-xl gradient-success flex items-center justify-center mb-4">
                    <FileSpreadsheet className="w-8 h-8 text-success-foreground" />
                  </div>
                  <p className="text-lg font-medium text-foreground mb-1">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium text-foreground mb-1">
                    Glissez votre fichier CSV ici
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">ou cliquez pour sélectionner</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-2 py-1 rounded bg-secondary">MyChron5</span>
                    <span className="px-2 py-1 rounded bg-secondary">AiM</span>
                    <span className="px-2 py-1 rounded bg-secondary">RaceBox</span>
                  </div>
                </div>
              )}
            </div>

            {file && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex flex-col items-center gap-4"
              >
                {!canUpload && !isAuthenticated && (
                  <Alert className="bg-primary/10 border-primary/30 w-full max-w-md">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <AlertTitle>{guestUsed ? "Connexion requise" : "1 analyse gratuite"}</AlertTitle>
                    <AlertDescription className="flex items-center gap-2 flex-wrap">
                      {guestUsed ? (
                        <>
                          Connectez-vous pour continuer.
                          <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
                            Se connecter
                          </Button>
                        </>
                      ) : (
                        <>
                          Testez sans compte. Cliquez Essayer puis Analyser.
                          <Button variant="outline" size="sm" onClick={guestUpload}>
                            Essayer
                          </Button>
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                <Button variant="hero" size="lg" onClick={handleAnalyze} disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyse en cours...
                    </>
                  ) : (
                    "Analyser le fichier"
                  )}
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
