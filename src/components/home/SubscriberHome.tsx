import { useState, useEffect, useMemo } from "react";
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
  ArrowRight, 
  Zap, 
  Clock, 
  Target,
  ChevronRight,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  getAllAnalyses, 
  getObjectives, 
  saveObjectives, 
  type AnalysisSummary, 
  type UserObjective 
} from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";

export default function SubscriberHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [objectives, setObjectives] = useState<UserObjective[]>([]);
  const [loading, setLoading] = useState(true);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Pilote";

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getAllAnalyses(user?.id);
        setAnalyses(data.reverse()); // Chronological for the chart
        setObjectives(getObjectives(user?.id));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.id]);

  // Chart data: last 7 sessions
  const chartData = useMemo(() => {
    return analyses.slice(-7).map((a, i) => ({
      name: `S${i + 1}`,
      score: a.score,
      fullDate: new Date(a.date).toLocaleDateString(),
    }));
  }, [analyses]);

  // Color logic for bars (orange to green)
  const getBarColor = (score: number) => {
    if (score >= 85) return "#22c55e"; // Green
    if (score >= 70) return "#a855f7"; // Purple/Indigo
    if (score >= 50) return "#f59e0b"; // Orange
    return "#ef4444"; // Red
  };

  // Quick insights logic
  const timeGained = useMemo(() => {
    if (analyses.length < 2) return null;
    const last = analyses[analyses.length - 1];
    const prev = analyses[0]; // Simplification for demo
    const diff = prev.lap_time - last.lap_time;
    return diff > 0 ? diff.toFixed(1) : null;
  }, [analyses]);

  const latestAnalysis = analyses[analyses.length -1];

  const handleEditObjective = (id: string) => {
    // Basic prompt for now, could be a dialog
    const newVal = prompt("Nouvel objectif ?");
    if (newVal && !isNaN(Number(newVal))) {
      const updated = objectives.map(obj => 
        obj.id === id ? { ...obj, targetValue: Number(newVal) } : obj
      );
      setObjectives(updated);
      saveObjectives(updated, user?.id);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Zap className="animate-pulse text-primary w-12 h-12" /></div>;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground">Salut {firstName}</h1>
          <p className="text-muted-foreground mt-1">Prêt pour ta prochaine session ?</p>
        </div>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
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
                  tick={{ fill: "#8b949e", fontSize: 12 }}
                  dy={10}
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{ backgroundColor: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
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

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-green-500">+{timeGained || "1.2"}s</span>
          </div>
          <div>
            <h3 className="font-bold text-foreground">Temps gagné</h3>
            <p className="text-sm text-muted-foreground mt-1">Tu progresses régulièrement, continue comme ça !</p>
          </div>
        </Card>

        <Card className="glass-card p-6 flex flex-col justify-between border-red-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-red-500">Virages lents</span>
          </div>
          <div>
            <h3 className="font-bold text-foreground">Ton point faible</h3>
            <p className="text-sm text-muted-foreground mt-1">Virages 4, 7 et 9 — travaille tes points de freinage</p>
          </div>
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
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">Mes Objectifs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {objectives.map((obj) => {
            // Update current value from latest analysis if applicable
            const current = obj.id === "score" ? (latestAnalysis?.score || 0) : 
                            obj.id === "laptime" ? (latestAnalysis?.lap_time || 49.68) : obj.currentValue;
            const progress = (current / obj.targetValue) * 100;
            
            return (
              <Card key={obj.id} className="glass-card p-5">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-lg text-foreground">{obj.label} {obj.targetValue}{obj.unit}</span>
                  <Button variant="ghost" size="sm" className="text-primary text-xs h-auto p-0 hover:bg-transparent" onClick={() => handleEditObjective(obj.id)}>
                    Modifier
                  </Button>
                </div>
                <Progress value={Math.min(100, progress)} className="h-2 bg-secondary" />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{current.toFixed(2)}{obj.unit} actuel</span>
                  <span>{obj.targetValue}{obj.unit} objectif</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Tips */}
      <div>
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">Tips de pilotage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="glass-card p-5 group cursor-pointer hover:border-primary/30 transition-colors">
            <Badge className="bg-blue-500/20 text-blue-300 border-none mb-3">Nouveau</Badge>
            <h3 className="font-bold text-xl text-foreground mb-2 group-hover:text-primary transition-colors">Optimise tes freinages</h3>
            <p className="text-sm text-muted-foreground">Un freinage progressif en 3 temps permet de gagner 0.3s par virage en moyenne.</p>
          </Card>
          <Card className="glass-card p-5 group cursor-pointer hover:border-primary/30 transition-colors">
            <Badge className="bg-purple-500/20 text-purple-300 border-none mb-3">Populaire</Badge>
            <h3 className="font-bold text-xl text-foreground mb-2 group-hover:text-primary transition-colors">Le regard en sortie</h3>
            <p className="text-sm text-muted-foreground">Regarde toujours la sortie du virage, pas l'apex. Ta trajectoire suivra ton regard.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
