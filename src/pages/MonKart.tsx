import { useState, useEffect } from "react";
import { Wrench, UploadCloud, Trash2, Battery, Disc, Flame, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Link } from "react-router-dom";
import api, { KartProfileResponse, KartProfile } from "@/lib/api";
import { AlertBanner } from "@/components/kart/AlertBanner";
import { KartSchematic } from "@/components/kart/KartSchematic";
import { WearGauge } from "@/components/kart/WearGauge";
import { KartSetupWizard } from "@/components/kart/KartSetupWizard";
import { KartTrendsChart } from "@/components/kart/KartTrendsChart";
import { KartMaintenanceLog } from "@/components/kart/KartMaintenanceLog";
import { KartSetupPanel } from "@/components/kart/KartSetupPanel";
import { Layout } from "@/components/layout/Layout";
import { PageMeta } from "@/components/seo/PageMeta";

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

  const handleUpdateSetup = async (setup: any) => {
    if (!session?.access_token) return;
    try {
      await api.updateKartProfile(session.access_token, { setup_json: setup });
      toast.success("Setup enregistré avec succès.");
      fetchProfile();
    } catch (e: any) {
      toast.error("Erreur d'enregistrement du setup : " + e.message);
    }
  };

  return (
    <Layout>
      <PageMeta title="Mon Kart | ApexAI" description="Suivi de l'usure de ton kart (cockpit interactif)." path="/kart" />
      <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Mon Kart (Cockpit)</h1>
          <p className="text-muted-foreground mt-2">Vue détaillée et usure des composants</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => handleUpdateCounter('engine_model', null as any)}>
          <Wrench className="w-4 h-4" /> Relancer la configuration
        </Button>
      </div>

      {prof && <AlertBanner profile={prof} recent_sessions={sessions} />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Cockpit Schematic (Spans 4 columns) */}
        <div className="lg:col-span-5 xl:col-span-4 flex items-center justify-center p-6 glass-card rounded-2xl border-white/5 order-1">
           {prof && <KartSchematic profile={prof} />}
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
             <Card className="glass-card border-white/5 bg-black/40">
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
                        className="bg-black/20"
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

             <Card className="glass-card border-white/5 bg-black/40">
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
                    className="bg-black/20"
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
            <KartSetupPanel setupJson={prof?.setup_json} onSave={handleUpdateSetup} />
            <KartMaintenanceLog history={history} />
          </div>

          <div className="mt-6">
            <KartTrendsChart sessions={sessions} />
          </div>
        </div>
      </div>

      <Card className="glass-card border-white/5 bg-black/40">
        <CardHeader>
          <CardTitle>Dernières Sessions Enregistrées</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune session enregistrée.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-white/10 text-muted-foreground">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Circuit</th>
                    <th className="pb-3 font-medium">Durée</th>
                    <th className="pb-3 font-medium">RPM Max</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((sess: any) => (
                    <tr key={sess.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="py-3">{new Date(sess.session_date || sess.created_at).toLocaleDateString()}</td>
                      <td className="py-3">{sess.circuit_name || "-"}</td>
                      <td className="py-3">{sess.duration_hours?.toFixed(2)} h</td>
                      <td className="py-3">{sess.rpm_max ? `${Math.round(sess.rpm_max)} tr/min` : "-"}</td>
                      <td className="py-3">
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => handleDeleteSession(sess.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
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
