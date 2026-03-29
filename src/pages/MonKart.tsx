import { useState, useEffect } from "react";
import { Wrench, UploadCloud, Trash2, Battery, Disc, Flame, Loader2, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Link } from "react-router-dom";
import api, { KartProfileResponse, KartProfile } from "@/lib/api";

export default function MonKart() {
  const { session } = useAuth();
  const { plan, tier } = useSubscription();
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
        // Handled by plan check
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
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (tier === "rookie" || tier === "visitor") {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 container max-w-4xl mx-auto">
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
    );
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
  
  const handleUpdateCounter = async (field: keyof KartProfile, value: number) => {
    if (!session?.access_token) return;
    try {
      await api.updateKartProfile(session.access_token, { [field]: value });
      toast.success("Compteur mis à jour.");
      fetchProfile();
    } catch (e: any) {
      toast.error("Erreur modification : " + e.message);
    }
  };

  const prof = data?.profile;
  const sessions = data?.recent_sessions || [];

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 container max-w-5xl mx-auto space-y-8 absolute-children">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Mon Kart</h1>
          <p className="text-muted-foreground mt-2">Suivi mécanique et usure des composants</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card bg-black/40 border-white/5 relative overflow-hidden">
          <CardHeader className="pb-2">
            <Flame className="w-6 h-6 text-red-500 mb-2" />
            <CardTitle>Moteur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{prof?.engine_hours_current?.toFixed(1) || 0} h</div>
            <p className="text-sm text-muted-foreground mb-4">{prof?.engine_sessions || 0} sessions</p>
            <Button variant="outline" size="sm" onClick={() => handleReset("engine")} className="w-full">Réviser</Button>
          </CardContent>
        </Card>

        <Card className="glass-card bg-black/40 border-white/5 relative overflow-hidden">
          <CardHeader className="pb-2">
            <Disc className="w-6 h-6 text-purple-500 mb-2" />
            <CardTitle>Pneus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{prof?.tires_sessions_current || 0}</div>
            <p className="text-sm text-muted-foreground mb-4">sessions roulées</p>
            <Button variant="outline" size="sm" onClick={() => handleReset("tires")} className="w-full">Changer</Button>
          </CardContent>
        </Card>

        <Card className="glass-card bg-black/40 border-white/5 relative overflow-hidden">
          <CardHeader className="pb-2">
            <AlertCircle className="w-6 h-6 text-orange-500 mb-2" />
            <CardTitle>Freins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{prof?.brakes_sessions_current || 0}</div>
            <p className="text-sm text-muted-foreground mb-4">sessions roulées</p>
            <Button variant="outline" size="sm" onClick={() => handleReset("brakes")} className="w-full">Plaquettes neuves</Button>
          </CardContent>
        </Card>

        <Card className="glass-card bg-black/40 border-white/5 relative overflow-hidden">
          <CardHeader className="pb-2">
            <Battery className="w-6 h-6 text-blue-500 mb-2" />
            <CardTitle>Batterie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{prof?.battery_voltage_last || "--"} V</div>
            <p className="text-sm text-muted-foreground mb-4">Min histo: {prof?.battery_voltage_min_ever || "--"} V</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="glass-card border-white/5 bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-primary" />
              Importer ma journée
            </CardTitle>
            <CardDescription>Uploade plusieurs logs CSV à la fois pour mettre à jour tes compteurs (sans lancer d'analyse individuelle).</CardDescription>
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

        <Card className="glass-card border-white/5 bg-black/40">
          <CardHeader>
            <CardTitle>Ajustement Manuel</CardTitle>
            <CardDescription>Corrige manuellement tes heures moteur si tu as oublié d'enregistrer une journée.</CardDescription>
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
  );
}
