import { useState, useEffect } from "react";
import { Wrench, UploadCloud, Trash2, Battery, Disc, Flame, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Link } from "react-router-dom";
import api, { KartProfileResponse, KartProfile, addKartHistoryEntry } from "@/lib/api";
import { AlertBanner } from "@/components/kart/AlertBanner";
import { KartSchematic } from "@/components/kart/KartSchematic";
import { WearGauge } from "@/components/kart/WearGauge";
import { KartSetupWizard } from "@/components/kart/KartSetupWizard";
import { KartTrendsChart } from "@/components/kart/KartTrendsChart";
import { KartMaintenanceLog } from "@/components/kart/KartMaintenanceLog";
import { KartSetupPanel } from "@/components/kart/KartSetupPanel";
import { Layout } from "@/components/layout/Layout";
import { PageMeta } from "@/components/seo/PageMeta";
import { DrivingProfile } from "@/lib/kart-recommendations";
import { KartHealthStatus } from "@/components/kart/KartHealthStatus";

export default function MonKart() {
  const { session } = useAuth();
  const { tier } = useSubscription();
  const [data, setData] = useState<KartProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);

  const fetchProfile = async () => {
    if (!session?.access_token) return;
    try {
      const res = await api.getKartProfile(session.access_token);
      setData(res);
    } catch (e: any) {
      if (e.message?.includes("403") || e.message?.includes("Forbidden") || tier === "rookie") {
        // Handled by tier check
      } else {
        toast.error("Erreur lors de la récupération du profil Mon Kart.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [session, tier]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (tier === "rookie" || tier === "visitor") {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto py-12 px-4">
          <div className="glass-card p-12 text-center flex flex-col items-center justify-center rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent blur-3xl -z-10" />
          <Wrench className="w-16 h-16 text-primary mb-6 animate-pulse" />
          <h1 className="text-3xl font-display font-bold mb-4">Mon Kart</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            La fonctionnalité "Mon Kart" permet de tracker l'usure de ton moteur, tes pneus, 
            tes freins et ta batterie automatiquement depuis tes logs. 
            Débloque-la en passant au plan Racer !
          </p>
          <Link to="/pricing">
            <Button size="lg" className="gradient-primary text-primary-foreground font-semibold">
              Découvrir les plans
            </Button>
          </Link>
        </div>
        </div>
      </Layout>
    );
  }

  const prof = data?.profile;
  const sessions = data?.recent_sessions || [];
  const history = data?.history || [];

  // Show Wizard if profile not fully configured
  if (prof && !prof.engine_model) {
    return <KartSetupWizard token={session!.access_token} onComplete={fetchProfile} />;
  }

  const handleBulkImport = async () => {
    if (!files || files.length === 0 || !session?.access_token) return;
    setImporting(true);
    let successCount = 0;
    try {
      const fileArray = Array.from(files);
      const res = await api.bulkImportKartSessions(session.access_token, fileArray);
      res.results.forEach((r: any) => {
        if (r.success && r.is_new) successCount++;
      });
      toast.success(`${successCount} sessions importées avec succès.`);
      setFiles(null);
      fetchProfile();
    } catch (error: any) {
      toast.error("Erreur lors de l'importation de masse : " + error.message);
    } finally {
      setImporting(false);
    }
  };

  const handleReset = async (component: "engine" | "tires" | "brakes") => {
    if (!confirm(`Es-tu sûr de vouloir réinitialiser l'usure pour : ${component} ?`)) return;
    if (!session?.access_token) return;
    try {
      await api.resetKartComponent(session.access_token, component, "Réinitialisation manuelle");
      toast.success("Compteur réinitialisé.");
      fetchProfile();
    } catch (e: any) {
      toast.error("Erreur réinitialisation : " + e.message);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Supprimer cette session et recalculer les temps ?")) return;
    if (!session?.access_token) return;
    try {
      await api.deleteKartSession(session.access_token, id);
      toast.success("Session supprimée.");
      fetchProfile();
    } catch (e: any) {
      toast.error("Erreur suppression : " + e.message);
    }
  };
  
  const handleUpdateCounter = async (field: keyof KartProfile, value: number | any) => {
    if (!session?.access_token) return;
    try {
      await api.updateKartProfile(session.access_token, { [field]: value });
      toast.success("Mise à jour effectuée.");
      fetchProfile();
    } catch (e: any) {
      toast.error("Erreur modification : " + e.message);
    }
  };

  const sessionsByDay = sessions.reduce((acc: any, sess: any) => {
    const dateObj = new Date(sess.session_date || sess.created_at);
    const dateStr = dateObj.toISOString().split('T')[0]; // yyyy-MM-dd
    if (!acc[dateStr]) {
      acc[dateStr] = {
        date: dateStr,
        sessionsCount: 0,
        totalDuration: 0,
        rpmMax: 0,
        gLatMax: 0,
        tempMax: 0,
        circuit: sess.circuit_name || "Mixte",
      };
    }
    acc[dateStr].sessionsCount += 1;
    acc[dateStr].totalDuration += (sess.duration_hours || 0);
    if (sess.rpm_max > acc[dateStr].rpmMax) acc[dateStr].rpmMax = sess.rpm_max;
    if (sess.g_lateral_max > acc[dateStr].gLatMax) acc[dateStr].gLatMax = sess.g_lateral_max;
    if (sess.exhaust_temp_max && sess.exhaust_temp_max > acc[dateStr].tempMax) acc[dateStr].tempMax = sess.exhaust_temp_max;
    if (!acc[dateStr].circuit || acc[dateStr].circuit === "Mixte") acc[dateStr].circuit = sess.circuit_name;
    return acc;
  }, {});
  
  const dailyLogs = Object.values(sessionsByDay).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleUpdateSetup = async (setup: any, saved_setups?: any[]) => {
    if (!session?.access_token) return;
    try {
      const updates: any = { setup_json: setup };
      if (saved_setups) updates.saved_setups = saved_setups;
      
      await api.updateKartProfile(session.access_token, updates);
      toast.success("Setup enregistré avec succès.");
      fetchProfile();
    } catch (e: any) {
      toast.error("Erreur d'enregistrement du setup : " + e.message);
    }
  };

  const handleAddHistory = async (type: string, notes: string, date: string) => {
    if (!session?.access_token) return;
    try {
      await addKartHistoryEntry(session.access_token, type, notes, date);
      toast.success("Intervention ajoutée au journal.");
      fetchProfile();
    } catch (e: any) {
      toast.error("Erreur d'ajout à l'historique : " + e.message);
    }
  };

  return (
    <Layout>
      <PageMeta title="Mon Kart | ApexAI" description="Suivi de l'usure de ton kart (cockpit interactif)." path="/kart" />
      <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Mon Kart</h1>
            <p className="text-muted-foreground mt-2">Vue détaillée, usure et recommandations</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-[200px]">
              <Select 
                value={prof?.driving_profile || "balanced"} 
                onValueChange={(val) => handleUpdateCounter('driving_profile', val)}
              >
                <SelectTrigger className="bg-black/40 border-white/10">
                  <SelectValue placeholder="Profil de pilotage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="longevity">Longévité / Économie</SelectItem>
                  <SelectItem value="balanced">Équilibré</SelectItem>
                  <SelectItem value="performance">Performance Max</SelectItem>
                  <SelectItem value="leisure">Loisir / Rodage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => handleUpdateCounter('engine_model', null as any)}>
              <Wrench className="w-4 h-4" /> Relancer la config
            </Button>
          </div>
      </div>

      <div className="text-xs text-muted-foreground/80 mb-2 italic">
        * Les recommandations affichées ci-dessous sont indicatives et s'adaptent au profil de pilotage sélectionné. La responsabilité finale des réglages t'appartient.
      </div>

      {prof && <AlertBanner profile={prof} recent_sessions={sessions} />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Cockpit Schematic (Spans 4 columns) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 order-1 h-fit">
          <div className="flex items-center justify-center p-4 bg-card border border-border shadow-sm rounded-2xl">
            {prof && <KartSchematic profile={prof} />}
          </div>
          
          {prof && <KartHealthStatus profile={prof} />}
        </div>

        {/* Right Column: Gauges & Actions (Spans 8 columns) */}
        <div className="lg:col-span-7 xl:col-span-8 order-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <WearGauge 
              current={prof?.engine_hours_current || 0} 
              max={prof?.engine_hours_life || 15} 
              icon={<Flame className="w-5 h-5 text-red-500" />} 
              label={`Moteur (${prof?.engine_model || "NC"})`}
              unit="h"
              onAction={() => handleReset("engine")}
              actionLabel="Réviser le moteur"
            />
            <WearGauge 
              current={prof?.tires_sessions_current || 0} 
              max={prof?.tires_sessions_life || 50} 
              icon={<Disc className="w-5 h-5 text-purple-500" />} 
              label={`Pneus (${prof?.tires_model || "NC"})`}
              unit="sess."
              onAction={() => handleReset("tires")}
              actionLabel="Remplacer le train"
            />
            <WearGauge 
              current={prof?.brakes_sessions_current || 0} 
              max={prof?.brakes_sessions_life || 100} 
              icon={<Loader2 className="w-5 h-5 text-orange-500" />} 
              label={`Freins (${prof?.brakes_model || "NC"})`}
              unit="sess."
              onAction={() => handleReset("brakes")}
              actionLabel="Changer plaquettes"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Card className="bg-card border-border shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Ajustement Manuel (Moteur)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                      <Input 
                        type="number" 
                        step="0.1" 
                        defaultValue={prof?.engine_hours_current || 0} 
                        id="engine-hours-input"
                        className="bg-background border-border"
                      />
                      <Button 
                        variant="secondary"
                        onClick={() => {
                          const val = parseFloat((document.getElementById("engine-hours-input") as HTMLInputElement).value);
                          if (!isNaN(val)) handleUpdateCounter("engine_hours_current", val);
                        }}
                      >
                        Mettre à jour
                      </Button>
                  </div>
                </CardContent>
             </Card>

             <Card className="bg-card border-border shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <UploadCloud className="w-5 h-5 text-primary" />
                    Importer ma journée
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input 
                    type="file" 
                    multiple 
                    accept=".csv" 
                    onChange={(e) => setFiles(e.target.files)} 
                    disabled={importing}
                    className="bg-background border-border"
                  />
                  <Button 
                    className="w-full" 
                    onClick={handleBulkImport} 
                    disabled={importing || !files || files.length === 0}
                  >
                    {importing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {importing ? "Importation..." : "Intégrer les sessions"}
                  </Button>
                </CardContent>
              </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <KartSetupPanel profile={prof} onSave={handleUpdateSetup} />
            <KartMaintenanceLog history={history} onAddEntry={handleAddHistory} />
          </div>

          <div className="mt-6">
            <KartTrendsChart sessions={sessions} />
          </div>
        </div>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle>Historique des Journées de Roulage</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Résumé agrégé de vos sorties en piste. Chaque ligne rassemble les sessions d'une même journée.</p>
        </CardHeader>
        <CardContent>
          {dailyLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune journée enregistrée.</p>
          ) : (
            <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
              <table className="w-full min-w-[600px] text-sm text-left whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Circuit</th>
                    <th className="pb-3 font-medium text-center">Sessions</th>
                    <th className="pb-3 font-medium">Durée Cumulée</th>
                    <th className="pb-3 font-medium text-right">RPM Max</th>
                    <th className="pb-3 font-medium text-right">G Lat Max</th>
                    <th className="pb-3 font-medium text-right">Temp Max</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyLogs.map((log: any, i: number) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-3 font-medium">{new Date(log.date).toLocaleDateString()}</td>
                      <td className="py-3">{log.circuit || "Inconnu"}</td>
                      <td className="py-3 text-center">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-semibold">{log.sessionsCount}</span>
                      </td>
                      <td className="py-3 text-muted-foreground">{log.totalDuration.toFixed(2)} h</td>
                      <td className="py-3 text-right">{log.rpmMax ? `${Math.round(log.rpmMax)} tr/min` : "-"}</td>
                      <td className="py-3 text-right">{log.gLatMax ? `${log.gLatMax.toFixed(2)} G` : "-"}</td>
                      <td className="py-3 text-right">{log.tempMax ? `${Math.round(log.tempMax)} °C` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </Layout>
  );
}
