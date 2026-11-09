import React, { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
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
  Wifi,
  WifiOff,
  Brain,
  BarChart3,
  Sun,
  CloudSun,
  CloudRain,
  Droplets,
  CloudDrizzle,
  Flag,
  Car,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Gauge,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  API_BASE_URL,
  getDisplayScore,
  CSV_UPLOAD_HINT_SHORT,
  TELEMETRY_ACCEPT,
  telemetryFormatError,
  isTelemetryFile,
  type AnalysisResult,
  type ApiError,
} from "@/lib/api";
import { exportAnalysisReportPDF } from "@/lib/pdf/analysisReport";
import { saveAnalysis, getAnalysesCount } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription.tsx";
import { AnalysisDashboardContent } from "@/components/analysis/AnalysisDashboardContent";
import { SessionSummary } from "@/components/analysis/SessionSummary";
import { mapApiResultToResponse } from "@/hooks/useAnalysis";
import { CoachingAdvice } from "@/components/analysis/CoachingAdvice";
import { toast } from "@/hooks/use-toast";
import { AnalysisProgress } from "./AnalysisProgress";
import { clearSingle, startSingle, useBackgroundAnalysis, watchTask } from "@/lib/backgroundAnalysis";
import { ToastAction } from "@/components/ui/toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CSVUploaderProps {
  onUploadComplete?: (data: AnalysisResult) => void;
}

function formatLapTime(seconds: number): string {
  if (seconds <= 0 || !Number.isFinite(seconds)) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const ms = Math.round((s % 1) * 1000);
  const sec = Math.floor(s);
  if (m > 0) return `${m}:${sec.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
  return `${sec}.${ms.toString().padStart(3, "0")}s`;
}

// Étapes de progression affichées pendant l'analyse

// ─── Composant ────────────────────────────────────────────────────────────────
export const CSVUploader = ({ onUploadComplete }: CSVUploaderProps) => {
  const navigate = useNavigate();
  const {
    user,
    session,
    isAuthenticated,
    canUploadFree,
    guestUsed,
    guestUpload,
    consumeGuestSlot,
  } = useAuth();
  const { tier, status, limits, fetchSubscription, incrementAnalysesUsed } = useSubscription();
  const canUpload = isAuthenticated || canUploadFree;
  const storageUserId = user?.id ?? undefined;

  const isPaidTier = tier === "racer" || tier === "team";

  // Bloqué si Rookie (ou visitor) & limite atteinte
  const isFreeAtLimit =
    !isPaidTier &&
    limits?.analyses_per_month != null &&
    limits.analyses_used >= limits.analyses_per_month;

  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Nouveaux champs pour la session
  const [sessionName, setSessionName] = useState<string>(() => {
    const today = new Date();
    return `Session du ${today.toLocaleDateString("fr-FR")}`;
  });

  const [trackCondition, setTrackCondition] = useState<"auto" | "dry" | "damp" | "wet" | "rain">("auto");
  const [sessionType, setSessionType] = useState<string>("roulage");
  const [trackTemperature, setTrackTemperature] = useState<number | "">("");

  // États analyse : le calcul tourne hors de la page (tâche de fond), on
  // peut partir et revenir ; la jauge suit la progression réelle du serveur.
  const { single } = useBackgroundAnalysis();
  useEffect(() => watchTask("single"), []);
  const isAnalyzing = single?.status === "running";
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLimitReachedModal, setShowLimitReachedModal] = useState(false);

  // Résultats
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [analysesCount, setAnalysesCount] = useState<number>(0);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string>("");
  const [expandedCorner, setExpandedCorner] = useState<number | null>(null);
  const [showCircuitLockModal, setShowCircuitLockModal] = useState(false);

  // Fermeture modal par ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalImage(null);
    };
    if (modalImage) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [modalImage]);

  // ─── Chargement initial du compteur ──────────────────────────────────────

  useEffect(() => {
    getAnalysesCount(storageUserId)
      .then(setAnalysesCount)
      .catch(() => {});
  }, [storageUserId]);

  // ─── Fin d'analyse (y compris si le pilote était parti entre-temps) ──────

  useEffect(() => {
    if (!single || single.status === "running") return;
    if (single.status === "error") {
      if (single.errorCode === "limit_reached") setShowLimitReachedModal(true);
      else setError(single.error ?? "Une erreur inattendue s'est produite. Réessaie dans quelques instants.");
      clearSingle();
      return;
    }
    const analysisResult = single.result;
    if (!analysisResult) return;
    if (single.savedId) {
      setSavedAnalysisId(single.savedId);
      setSaveSuccess(`Analyse sauvegardée automatiquement.`);
      setTimeout(() => setSaveSuccess(null), 5000);
    }
    getAnalysesCount(storageUserId).then(setAnalysesCount).catch(() => {});
    setResult(analysisResult);
    setIsComplete(true);
    onUploadComplete?.(analysisResult);
    clearSingle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [single?.status]);

  // ─── Drag & drop ──────────────────────────────────────────────────────────

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
    if (droppedFile && isTelemetryFile(droppedFile.name)) {
      setFile(droppedFile);
      setError(null);
    } else if (droppedFile) {
      setError(telemetryFormatError(droppedFile.name));
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && isTelemetryFile(selectedFile.name)) {
      setFile(selectedFile);
      setError(null);
    } else if (selectedFile) {
      setError(telemetryFormatError(selectedFile.name));
    }
    // Reset l'input pour permettre de re-sélectionner le même fichier
    e.target.value = "";
  }, []);

  /*
   * Retour en haut après le choix du fichier.
   *
   * Sur téléphone, le sélecteur de fichiers d'iOS rend la main en laissant la
   * page là où elle était — souvent tout en bas, après avoir fait défiler pour
   * trouver la zone d'import. Le bouton « Analyser » se retrouve alors hors de
   * l'écran, et rien n'indique qu'il faut remonter.
   *
   * `scroll-mt-24` sur la cible compense la barre de navigation fixe.
   */
  useEffect(() => {
    if (!file) return;
    dropZoneRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [file]);

  // ─── Reset complet ────────────────────────────────────────────────────────

  const handleReset = () => {
    setFile(null);
    setIsComplete(false);
    setError(null);
    setResult(null);
    setSavedAnalysisId(null);
    setSaveSuccess(null);
    getAnalysesCount(storageUserId)
      .then(setAnalysesCount)
      .catch(() => {});
  };

  // ─── Sauvegarde manuelle (si l'auto-save a échoué) ───────────────────────

  const handleSaveAnalysis = async () => {
    if (!result || savedAnalysisId) return; // déjà sauvegardé

    try {
      const analysisId = await saveAnalysis(result, storageUserId);
      setSavedAnalysisId(analysisId);
      setSaveSuccess(`Analyse sauvegardée (ID : ${analysisId})`);
      const count = await getAnalysesCount(storageUserId);
      setAnalysesCount(count);
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err) {
      setError(
        `Erreur lors de la sauvegarde : ${err instanceof Error ? err.message : "Erreur inconnue"}`
      );
    }
  };

  // ─── Navigation Dashboard ────────────────────────────────────────────────

  const handleViewInDashboard = () => {
    const id = savedAnalysisId ?? result?.analysis_id;
    if (id) navigate(`/dashboard?analysisId=${id}`);
  };

  // ─── Download JSON ────────────────────────────────────────────────────────

  const handleDownloadResults = async () => {
    if (!result || isExportingPdf) return;
    // Rapport d'analyse PDF « Esprit Paddock » : capture les graphiques
    // affichés à l'écran pour les embarquer tels quels dans le document.
    // La capture prend quelques secondes -> on prévient le pilote.
    setIsExportingPdf(true);
    toast({
      title: "Préparation du rapport…",
      description: "Capture des graphiques et mise en page — le téléchargement démarre dans quelques instants.",
    });
    try {
      // Laisse le toast s'afficher avant le travail synchrone lourd
      await new Promise((r) => setTimeout(r, 50));
      exportAnalysisReportPDF(result);
    } catch (e) {
      toast({
        title: "Erreur PDF",
        description: "Le rapport n'a pas pu être généré.",
        variant: "destructive",
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // ─── Analyse principale ───────────────────────────────────────────────────

  const handleAnalyze = async () => {
    if (!file) return;

    if (isFreeAtLimit) {
      setShowLimitReachedModal(true);
      return;
    }

    // Gestion accès
    if (!canUpload) {
      if (guestUsed) {
        toast({
          title: "Connexion requise",
          description: "Connecte-toi pour effectuer d'autres analyses.",
          action: (
            <ToastAction altText="Se connecter" onClick={() => navigate("/login")}>
              Se connecter
            </ToastAction>
          ),
        });
      } else {
        toast({
          title: "1 analyse gratuite disponible",
          description: "Clique sur Essayer pour analyser sans compte.",
          action: (
            <ToastAction altText="Essayer" onClick={guestUpload}>
              Essayer
            </ToastAction>
          ),
        });
      }
      return;
    }

    setError(null);
    setSaveSuccess(null);
    const tempNum = trackTemperature === "" || trackTemperature == null ? undefined : Number(trackTemperature);
    const guest = !isAuthenticated && canUploadFree;
    startSingle(
      file,
      {
        track_condition: trackCondition,
        track_temperature: tempNum ?? undefined,
        session_name: sessionName,
        accessToken: session?.access_token ?? undefined,
      },
      {
        userId: storageUserId,
        // Fonctions des fournisseurs de l'app : valables même si la page a été quittée.
        onSaved: () => {
          if (tier === "rookie") incrementAnalysesUsed();
          if (guest) consumeGuestSlot();
        },
      }
    );
  };

  // ─── Helpers UI ──────────────────────────────────────────────────────────

  const getGradeColor = (grade: string) => {
    switch (grade.toUpperCase()) {
      case "A+":
      case "A":
        return "bg-green-500/20 text-green-200 border-green-500/50";
      case "B":
        return "bg-green-300/15 text-green-200 border-green-300/40";
      case "C":
        return "bg-yellow-500/20 text-yellow-200 border-yellow-500/50";
      case "D":
        return "bg-red-500/20 text-red-200 border-red-500/50";
      default:
        return "bg-gray-500/20 text-gray-200 border-gray-500/50";
    }
  };


  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-8"
    >
      {/* Compteur d'analyses (Rookie/Visitor) */}
      {(isAuthenticated || canUploadFree) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex flex-col items-center justify-center gap-1 text-sm text-muted-foreground"
        >
          {tier === "rookie" && limits && (
            <div className="flex flex-col items-center gap-2 w-full max-w-xs mb-2">
              <div className="flex justify-between w-full text-xs">
                <span>Analyses ce mois</span>
                <span className="font-bold text-primary">
                  {limits.analyses_used}/{limits.analyses_per_month}
                </span>
              </div>
              <Progress
                value={(limits.analyses_used / (limits.analyses_per_month || 1)) * 100}
                className="h-1"
              />
              {limits.analyses_per_month != null &&
                limits.analyses_per_month - limits.analyses_used > 0 && (
                  <span className="text-[10px] italic">
                    {limits.analyses_per_month - limits.analyses_used} analyse
                    {limits.analyses_per_month - limits.analyses_used > 1 ? "s" : ""} restante
                    {limits.analyses_per_month - limits.analyses_used > 1 ? "s" : ""}
                  </span>
                )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span>
              {analysesCount} analyse{analysesCount > 1 ? "s" : ""} sauvegardée
              {analysesCount > 1 ? "s" : ""} total
            </span>
          </div>
        </motion.div>
      )}

      {/* Alerte sauvegarde réussie */}
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

      {/* Modal limite Rookie atteinte */}
      <Dialog open={showLimitReachedModal} onOpenChange={setShowLimitReachedModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Limite atteinte</DialogTitle>
            <DialogDescription>Passe à Racer pour des analyses illimitées.</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tu as utilisé tes 3 analyses du mois. Passe au plan Racer pour analyser sans
            limite.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLimitReachedModal(false)}>
              Fermer
            </Button>
            <Button asChild>
              <Link to="/pricing">Voir les offres Racer</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alerte erreur */}
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
              <AlertDescription className="flex flex-col gap-2">
                <span>{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit border-destructive/50 text-destructive hover:bg-destructive/10"
                  onClick={() => setError(null)}
                >
                  Fermer
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Contenu principal ── */}
      <AnimatePresence mode="wait">
        {/* État : Résultats affichés */}
        {isComplete && result ? (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="space-y-6"
          >
            {/* Header succès */}
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full gradient-success flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-success-foreground" />
              </div>
              <h3 className="text-2xl font-display font-bold text-foreground mb-2">
                Analyse terminée !
              </h3>
              <p className="text-muted-foreground mb-4">
                Ta session a été analysée avec succès.
              </p>
              {result.session_conditions && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-muted-foreground mb-6">
                  <span>
                    {result.session_conditions.track_condition === "dry" && "☀️"}
                    {result.session_conditions.track_condition === "damp" && "🌦️"}
                    {result.session_conditions.track_condition === "wet" && "💧"}
                    {result.session_conditions.track_condition === "rain" && "🌧️"}
                  </span>
                  <span>
                    Conditions : {result.session_conditions.track_condition === "dry" && "Sec"}
                    {result.session_conditions.track_condition === "damp" && "Humide"}
                    {result.session_conditions.track_condition === "wet" && "Mouillée"}
                    {result.session_conditions.track_condition === "rain" && "Pluie"}
                    {result.session_conditions.track_temperature != null &&
                    Number.isFinite(result.session_conditions.track_temperature)
                      ? ` — piste ${Math.round(result.session_conditions.track_temperature)} °C${(result.session_conditions as any).track_temperature_estimated ? " (estimée)" : ""}`
                      : ""}
                    {(result.session_conditions as any).weather?.summary && (
                      <span className="block text-xs text-muted-foreground">
                        Météo de la séance : {(result.session_conditions as any).weather.summary}
                      </span>
                    )}
                  </span>
                </div>
              )}
              {(result as any).import_diagnostics && (() => {
                const diag = (result as any).import_diagnostics;
                const isComplete = diag.quality === 'complete';
                const missing = [
                  ...(diag.channels?.required_missing || []),
                  ...(diag.channels?.core_missing || []),
                ];
                return (
                  <div className="max-w-md mx-auto mb-6 text-left rounded-xl border border-border bg-card/60 overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                        <Cpu className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">
                          Acquisition détectée
                        </p>
                        <p className="text-sm font-semibold text-foreground truncate mt-0.5">
                          {diag.device}
                          {diag.sample_rate_hz ? (
                            <span className="ml-2 font-mono text-xs text-primary">
                              {diag.sample_rate_hz} Hz
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                    <div className="px-4 py-2.5 flex items-center gap-2 text-xs">
                      {isComplete ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="text-emerald-500 font-medium">
                            Tous les canaux essentiels détectés
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="text-amber-500">
                            Analyse partielle — manquants : {missing.join(', ') || 'canaux bonus absents'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}
              {!result.session_conditions && <div className="mb-6" />}
              <div className="flex flex-col sm:flex-row justify-center gap-3 flex-wrap">
                <Button variant="heroOutline" onClick={handleReset}>
                  Nouvelle analyse
                </Button>
                <Button variant="hero" onClick={handleDownloadResults} disabled={isExportingPdf}>
                  {isExportingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Préparation du PDF…
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Rapport PDF
                    </>
                  )}
                </Button>
                {/* Bouton sauvegarde manuelle si auto-save a échoué */}
                {!savedAnalysisId && (
                  <Button variant="outline" onClick={handleSaveAnalysis}>
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </Button>
                )}
              </div>
            </div>

            <SessionSummary result={result} />

            {/* Analyse des virages — tableau (SUPPRIMÉ au profit du composant Recharts/CornerDetailsGrid) */}

            {/* ─── Séparateur Graphiques détaillés ─── */}
            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-4 text-sm text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Graphiques détaillés
                </span>
              </div>
            </div>

            {/* Graphiques Recharts — sans wrapper Card */}
            <AnalysisDashboardContent analysis={mapApiResultToResponse(result)} embedded />
          </motion.div>
        ) : isAnalyzing && single ? (
          /* ── État : Analyse en cours (progression réelle du serveur) ── */
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AnalysisProgress progress={single.progress} startedAt={single.startedAt} />
          </motion.div>
        ) : (
          /* ── État : Upload ── */
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative scroll-mt-24 border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : file
                    ? "border-green-500/60 bg-green-500/5"
                    : "border-border hover:bg-slate-800/50 hover:border-orange-400"
              }`}
            >
              <input
                type="file"
                accept={TELEMETRY_ACCEPT}
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
                    aria-label="Supprimer le fichier"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>{" "}
                  <p className="text-lg font-medium text-foreground mb-1">
                    Glisse le fichier de ta session ici
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">ou clique pour sélectionner</p>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-3">
                    {["AiM MyChron (.xrk, .xrz)", "Export Race Studio", "Alfano (.zip ou Excel ADA)"].map((label) => (
                      <span key={label} className="px-2 py-1 rounded bg-secondary">
                        {label}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground/80 max-w-sm text-balance">
                    {CSV_UPLOAD_HINT_SHORT}
                  </p>
                </div>
              )}
            </div>

            {/* Remplacement du composant de la sélection de tours par les conditions de piste & Nom de Session */}
            {file && (
              <Card className="mt-6 glass-card border-white/10 w-full max-w-2xl mx-auto">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Informations de Session</CardTitle>
                  <CardDescription>Configure l'analyse avant le lancement</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-6">
                  {/* Nom de Session */}
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Nom de la session (Optionnel)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Track Day Le Mans"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-secondary/50 border border-white/10 text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-[#ff6b35]/50 focus:outline-none focus:ring-1 focus:ring-[#ff6b35]/50"
                    />
                  </div>

                  {/* Conditions de piste */}
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-3">
                      Conditions de piste
                    </label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(
                        [
                          { value: "auto" as const, label: "Auto (météo)", Icon: CloudSun },
                          { value: "dry" as const, label: "Sec", Icon: Sun },
                          { value: "damp" as const, label: "Humide", Icon: CloudDrizzle },
                          { value: "wet" as const, label: "Mouillée", Icon: Droplets },
                          { value: "rain" as const, label: "Pluie", Icon: CloudRain },
                        ] as const
                      ).map(({ value, label, Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setTrackCondition(value)}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border-2 ${
                            trackCondition === value
                              ? "bg-signature text-white border-transparent"
                              : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                          }`}
                        >
                          <Icon className="w-4 h-4" /> {label}
                        </button>
                      ))}
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground block mb-1">
                        Température piste (°C) (optionnel : estimée d'après la météo si vide)
                      </label>
                      <input
                        type="number"
                        placeholder="ex. 28"
                        value={trackTemperature === "" ? "" : trackTemperature}
                        onChange={(e) => {
                          const v = e.target.value;
                          setTrackTemperature(v === "" ? "" : parseFloat(v) || 0);
                        }}
                        className="w-full max-w-[150px] p-2 rounded-lg bg-secondary/50 border border-white/10 text-foreground placeholder:text-muted-foreground"
                      />
                    </div>

                    {/* Type de session */}
                    <div className="mt-6">
                      <label className="text-sm font-medium text-foreground block mb-3">
                        Type de session
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: "roulage", label: "Roulage", Icon: Gauge },
                          { value: "practice", label: "Essais", Icon: Car },
                          { value: "qualifying", label: "Qualifications", Icon: Clock },
                          { value: "race", label: "Course", Icon: Flag },
                        ].map(({ value, label, Icon }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setSessionType(value)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border-2 ${
                              sessionType === value
                                ? "bg-signature text-white border-transparent"
                                : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                            }`}
                          >
                            <Icon className="w-4 h-4" /> {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bouton analyser + avertissement accès */}
            {file && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex flex-col items-center gap-4"
              >
                {isFreeAtLimit && (
                  <Alert className="bg-amber-500/10 border-amber-500/30 w-full max-w-md">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <AlertTitle>Limite du plan gratuit atteinte</AlertTitle>
                    <AlertDescription className="flex items-center gap-2 flex-wrap">
                      Tu as utilisé tes {limits?.analyses_per_month ?? 3} analyses du mois.
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/pricing">Passer à Racer</Link>
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {!canUpload && !isAuthenticated && !isFreeAtLimit && (
                  <Alert className="bg-primary/10 border-primary/30 w-full max-w-md">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <AlertTitle>
                      {guestUsed ? "Connexion requise" : "1 analyse gratuite"}
                    </AlertTitle>
                    <AlertDescription className="flex items-center gap-2 flex-wrap">
                      {guestUsed ? (
                        <>
                          Connecte-toi pour continuer.
                          <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
                            Se connecter
                          </Button>
                        </>
                      ) : (
                        <>
                          Teste sans compte — clique sur Essayer puis Analyser.
                          <Button variant="outline" size="sm" onClick={guestUpload}>
                            Essayer
                          </Button>
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  variant="hero"
                  size="lg"
                  onClick={() => {
                    if (isFreeAtLimit) setShowLimitReachedModal(true);
                    else handleAnalyze();
                  }}
                  disabled={isAnalyzing}
                  className="min-w-[200px]"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyse en cours…
                    </>
                  ) : isFreeAtLimit ? (
                    "Passer à Racer"
                  ) : (
                    "Analyser le fichier"
                  )}
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal lightbox pour graphiques */}
      {modalImage &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99999,
              backgroundColor: "rgba(0, 0, 0, 0.88)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => setModalImage(null)}
          >
            <div
              style={{
                position: "relative",
                maxWidth: "95vw",
                maxHeight: "92vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                padding: "16px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Barre titre + bouton fermer */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                  minWidth: "300px",
                }}
              >
                <p
                  style={{
                    color: "#e2e8f0",
                    fontWeight: 600,
                    fontSize: "15px",
                    margin: 0,
                    flex: 1,
                  }}
                >
                  {modalTitle}
                </p>
                <button
                  style={{
                    background: "#374151",
                    border: "none",
                    color: "white",
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    cursor: "pointer",
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: "12px",
                    flexShrink: 0,
                  }}
                  onClick={() => setModalImage(null)}
                >
                  ✕
                </button>
              </div>
              {/* Image */}
              <img
                src={modalImage}
                alt={modalTitle}
                style={{
                  maxWidth: "100%",
                  maxHeight: "80vh",
                  objectFit: "contain",
                  borderRadius: "8px",
                  boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <p style={{ color: "#64748b", fontSize: "11px", margin: 0 }}>
                Cliquer en dehors pour fermer · ESC pour fermer
              </p>
            </div>
          </div>,
          document.body
        )}
    </motion.div>
  );
};
