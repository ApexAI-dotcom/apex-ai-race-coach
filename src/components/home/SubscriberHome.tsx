import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  AlertTriangle, 
  Plus, 
  Zap, 
  ChevronRight,
  RotateCcw,
  Lightbulb,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  getAllAnalyses, 
  getObjectives, 
  saveObjectives, 
  type AnalysisSummary, 
  type UserObjective 
} from "@/lib/storage";
import { 
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchHomeTips,
  fetchHomeInsights,
  resetHomeInsights,
  type HomeTip,
  type HomeInsightsResponse,
} from "@/lib/api";

// Badge color map
const BADGE_COLORS: Record<string, string> = {
  blue: "bg-blue-500/20 text-blue-300 border-none",
  purple: "bg-purple-500/20 text-purple-300 border-none",
  green: "bg-green-500/20 text-green-300 border-none",
  orange: "bg-orange-500/20 text-orange-300 border-none",
};

export default function SubscriberHome() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { tier, fetchSubscription, isLoading: subLoading } = useSubscription();

  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [objectives, setObjectives] = useState<UserObjective[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingObjective, setEditingObjective] = useState<UserObjective | null>(null);
  const [tempValue, setTempValue] = useState("");

  // Dynamic data
  const [tips, setTips] = useState<HomeTip[]>([]);
  const [tipsLoading, setTipsLoading] = useState(true);
  const [insights, setInsights] = useState<HomeInsightsResponse | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Pilote";
  const accessToken = session?.access_token;

  // Load analyses + objectives (localStorage)
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getAllAnalyses(user?.id);
        setAnalyses(data);
        setObjectives(getObjectives(user?.id));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.id]);

  const handleRefreshStatus = async () => {
    toast.promise(fetchSubscription(), {
      loading: "Vérification de l'abonnement...",
      success: "Statut mis à jour",
      error: "Erreur lors de la mise à jour"
    });
  };

  // Load tips (public)
  useEffect(() => {
    setTipsLoading(true);
    fetchHomeTips()
      .then((res) => setTips(res.tips))
      .catch(() => setTips([]))
      .finally(() => setTipsLoading(false));
  }, []);

  // Load insights (JWT)
  const loadInsights = useCallback(async () => {
    if (!accessToken) return;
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const res = await fetchHomeInsights(accessToken);
      setInsights(res);
    } catch (err) {
      setInsightsError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setInsightsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  // Chart data: last 7 sessions
  const chartData = useMemo(() => {
    return [...analyses].reverse().slice(-7).map((a, i) => ({
      name: `S${i + 1}`,
      score: a.score,
      fullDate: new Date(a.date).toLocaleDateString(),
    }));
  }, [analyses]);

  // Color logic for bars
  const getBarColor = (score: number) => {
    if (score >= 85) return "#ff4444";
    if (score >= 70) return "#e63946";
    if (score >= 50) return "#cc2936";
    return "#991b1b";
  };

  // Objectives logic (unchanged from existing except for baseline tracking)
  // We compute bestScore and bestLapTime dynamically per objective inside the render loop now.

  const handleEditObjective = (obj: UserObjective) => {
    setEditingObjective(obj);
    setTempValue(obj.targetValue.toString());
  };

  const handleSaveObjective = () => {
    if (!editingObjective || isNaN(Number(tempValue))) return;
    
    const updated = objectives.map(obj => 
      obj.id === editingObjective.id ? { ...obj, targetValue: Number(tempValue) } : obj
    );
    setObjectives(updated);
    saveObjectives(updated, user?.id);
    setEditingObjective(null);
    toast.success("Objectif mis à jour");
  };

  // Reset objectives
  const handleReset = async () => {
    if (!accessToken) return;
    setResetting(true);
    try {
      await resetHomeInsights(accessToken);

      // Reset local objectives baseline
      const now = Date.now();
      const updated = objectives.map(obj => ({
        ...obj,
        baselineTimestamp: now
      }));
      setObjectives(updated);
      saveObjectives(updated, user?.id);

      toast.success("Objectifs réinitialisés");
      // Refresh insights immediately
      await loadInsights();
    } catch (err) {
      toast.error("Erreur lors de la réinitialisation");
    } finally {
      setResetting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Zap className="animate-pulse text-primary w-12 h-12" /></div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-secondary/10 p-5 rounded-2xl border border-white/5 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20 shrink-0">
            {firstName.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Salut {firstName}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className={`text-[10px] uppercase border-white/10 ${tier === 'racer' || tier === 'team' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-white/5 text-muted-foreground'}`}>
                {tier === 'racer' ? 'RACER' : tier === 'team' ? 'TEAM' : 'ROOKIE'}
              </Badge>
              <button 
                onClick={handleRefreshStatus}
                className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors group"
                disabled={subLoading}
              >
                <RotateCcw className={`w-3 h-3 ${subLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                Rafraîchir
              </button>
            </div>
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-xs text-muted-foreground">Analyses ce mois</p>
          <p className="text-xl font-bold text-foreground">{analyses.length}</p>
        </div>
      </div>

      {/* Progression Chart */}
      <Card className="glass-card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Ta Progression</CardTitle>
            <CardDescription className="text-lg font-bold text-foreground mt-1">Évolution du score</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/dashboard")}>
            Voir le tableau de bord <ChevronRight className="w-3 h-3" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#ffffff", opacity: 0.6, fontSize: 12 }}
                  dy={10}
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{ backgroundColor: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  itemStyle={{ color: "#ffffff" }}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quick Insights — Dynamic */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Time Gained */}
        <Card className="glass-card p-6 flex flex-col justify-between">
          {insightsLoading ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-8 w-20" />
              </div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          ) : insightsError ? (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Erreur</h3>
                <p className="text-sm text-muted-foreground">{insightsError}</p>
              </div>
            </div>
          ) : insights?.insufficient_data ? (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Temps gagné</h3>
                <p className="text-sm text-muted-foreground">Données insuffisantes — lance au moins 2 analyses pour voir ta progression.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-2xl font-bold text-green-500">
                  {insights && insights.time_gained !== null 
                    ? `${insights.time_gained > 0 ? "+" : ""}${insights.time_gained}s`
                    : "—"
                  }
                </span>
              </div>
              <div>
                <h3 className="font-bold text-foreground">Temps gagné</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {insights && insights.time_gained !== null && insights.time_gained > 0
                    ? "Tu progresses régulièrement, continue comme ça !"
                    : insights && insights.time_gained !== null && insights.time_gained < 0
                      ? "Petit recul — analyse tes dernières sessions pour identifier les régressions."
                      : "Progression stable, maintiens tes efforts !"
                  }
                </p>
              </div>
            </>
          )}
        </Card>

        {/* Weak Point */}
        <Card className="glass-card p-6 flex flex-col justify-between border-red-500/20">
          {insightsLoading ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-8 w-32" />
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-52" />
            </div>
          ) : insightsError ? (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Erreur</h3>
                <p className="text-sm text-muted-foreground">{insightsError}</p>
              </div>
            </div>
          ) : insights?.insufficient_data ? (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Ton point faible</h3>
                <p className="text-sm text-muted-foreground">Données insuffisantes — continue à analyser pour identifier tes axes d'amélioration.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-2xl font-bold text-red-500">
                  {insights?.weak_point?.label || "—"}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-foreground">Ton point faible</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {insights?.weak_point?.corners && insights.weak_point.corners.length > 0
                    ? `Virages ${insights.weak_point.corners.join(", ")} — travaille ces passages pour progresser.`
                    : "Continue à analyser tes sessions pour affiner ce diagnostic."
                  }
                </p>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Main CTA */}
      <Button 
        variant="hero" 
        size="lg" 
        className="w-full h-16 text-lg font-bold uppercase tracking-wider shadow-xl shadow-primary/20"
        onClick={() => navigate("/upload")}
      >
        <Plus className="w-6 h-6 mr-2" /> Analyser une session
      </Button>

      {/* Objectives */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Mes Objectifs</h2>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground hover:text-foreground" disabled={resetting}>
                <RotateCcw className={`w-3.5 h-3.5 ${resetting ? "animate-spin" : ""}`} />
                Réinitialiser
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-background border-white/10">
              <AlertDialogHeader>
                <AlertDialogTitle>Réinitialiser mes objectifs ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ton score de référence et ton temps de référence seront mis à jour avec tes meilleurs résultats actuels.
                  L'historique de progression sera recalculé à partir de ce nouveau point de départ.
                  Tes analyses brutes ne seront pas supprimées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  className="bg-primary hover:bg-primary/90"
                >
                  Confirmer la réinitialisation
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {objectives.map((obj) => {
            const relevantAnalyses = obj.baselineTimestamp 
              ? analyses.filter(a => a.timestamp >= obj.baselineTimestamp!) 
              : analyses;
            
            const objBestScore = relevantAnalyses.length > 0 ? Math.max(...relevantAnalyses.map(a => a.score)) : 0;
            const validTimes = relevantAnalyses.map(a => a.lap_time).filter(t => t > 0);
            const objBestLapTime = validTimes.length > 0 ? Math.min(...validTimes) : 0;

            const current = obj.id === "score" ? objBestScore : 
                            obj.id === "laptime" ? objBestLapTime : obj.currentValue;
            
            let progress = 0;
            if (obj.id === "laptime") {
              progress = current > 0 ? (obj.targetValue / current) * 100 : 0;
            } else {
              progress = obj.targetValue > 0 ? (current / obj.targetValue) * 100 : 0;
            }
            
            return (
              <Card key={obj.id} className="glass-card p-5">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-lg text-foreground">{obj.label} {obj.targetValue}{obj.unit}</span>
                  <Button variant="ghost" size="sm" className="text-primary text-xs h-9 px-3 rounded-lg hover:bg-primary/10 transition-colors" onClick={() => handleEditObjective(obj)}>
                    Modifier
                  </Button>
                </div>
                <Progress value={Math.min(100, progress)} className="h-2 bg-secondary" />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{current > 0 ? current.toFixed(2) : "—"}{obj.unit} actuel</span>
                  <span>{obj.targetValue}{obj.unit} cible</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Tips — Dynamic */}
      <div>
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">Tips de pilotage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tipsLoading ? (
            <>
              <Card className="glass-card p-5">
                <Skeleton className="h-5 w-16 mb-3" />
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4 mt-1" />
              </Card>
              <Card className="glass-card p-5">
                <Skeleton className="h-5 w-16 mb-3" />
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4 mt-1" />
              </Card>
            </>
          ) : tips.length === 0 ? (
            <Card className="glass-card p-5 col-span-full">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Lightbulb className="w-5 h-5" />
                <p className="text-sm">Aucun tip disponible pour le moment.</p>
              </div>
            </Card>
          ) : (
            tips.map((tip, i) => (
              <Card key={i} className="glass-card p-5 group cursor-pointer hover:border-primary/30 transition-colors">
                <Badge className={BADGE_COLORS[tip.badge_color] || BADGE_COLORS.blue + " mb-3"}>
                  {tip.badge}
                </Badge>
                <h3 className="font-bold text-xl text-foreground mb-2 group-hover:text-primary transition-colors">{tip.title}</h3>
                <p className="text-sm text-muted-foreground">{tip.body}</p>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Objective Edit Drawer */}
      <Drawer open={!!editingObjective} onOpenChange={(open) => !open && setEditingObjective(null)}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Modifier l'objectif</DrawerTitle>
              <DrawerDescription>
                Définis ta nouvelle cible pour {editingObjective?.label.toLowerCase()}
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4 pb-0">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="target">Valeur cible ({editingObjective?.unit})</Label>
                    <Input
                      id="target"
                      type="number"
                      value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    placeholder="Ex: 85"
                    className="text-lg h-12 bg-secondary/20 border-white/10"
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveObjective()}
                  />
                </div>
              </div>
            </div>
            <DrawerFooter className="pt-8">
              <Button variant="hero" className="h-12 text-lg font-bold" onClick={handleSaveObjective}>
                Sauvegarder
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="h-12">Annuler</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
