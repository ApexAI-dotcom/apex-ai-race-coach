import { useState, useEffect } from "react";
import { Wrench, UploadCloud, Trash2, Battery, Disc, Flame, Loader2, Lock, Sparkles, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Link } from "react-router-dom";
import api, {
  KartProfileResponse,
  KartProfile,
  addKartHistoryEntry,
  deleteKartHistoryEntry,
  deleteKartSessionDay,
} from "@/lib/api";
import { AlertBanner } from "@/components/kart/AlertBanner";
import { KartSchematic } from "@/components/kart/KartSchematic";
import { KartSetupWizard } from "@/components/kart/KartSetupWizard";
import { KartMaintenanceLog } from "@/components/kart/KartMaintenanceLog";
import { GarageHeader } from "@/components/kart/GarageHeader";
import { KartIdentityCard } from "@/components/kart/KartIdentityCard";
import { TireStockCard } from "@/components/kart/TireStockCard";
import { WeightCard } from "@/components/kart/WeightCard";
import { WearGauge } from "@/components/kart/WearGauge";
import { Layout } from "@/components/layout/Layout";
import { PageMeta } from "@/components/seo/PageMeta";
import { DrivingProfile } from "@/lib/kart-recommendations";
import { KartHealthStatus } from "@/components/kart/KartHealthStatus";

import { motion } from "framer-motion";

export default function MonKart() {
  const { session, isAuthenticated } = useAuth();
  const { tier } = useSubscription();
  const [data, setData] = useState<KartProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [tireSets, setTireSets] = useState<any[]>([]);

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

  const fetchTireSets = async () => {
    if (!session?.access_token) return;
    try {
      const res = await api.getTireSets(session.access_token);
      setTireSets(res.tire_sets || []);
    } catch {
      setTireSets([]);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchTireSets();
  }, [session, tier]);

  const mountedTire = tireSets.find((t) => t.is_mounted) || null;

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated || tier === "rookie" || tier === "visitor") {
    return (
      <Layout>
        <PageMeta
          title="Mon Kart - Garage Virtuel & Suivi d'Usure | ApexAI"
          description="Gérez votre karting, suivez l'usure de votre moteur, pneus et freins automatiquement depuis vos sessions de télémétrie."
          path="/mon-kart"
        />

        <div className="container max-w-6xl mx-auto py-8 px-4 relative min-h-[85vh] flex flex-col justify-center">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
              <Wrench className="w-3.5 h-3.5 text-primary" />
              <span>Garage & Maintenance Virtuelle</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-3">
              Mon <span className="text-gradient-primary">Kart</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
              Suivez automatiquement l'usure de votre moteur, pneus, freins et batterie à partir de vos fichiers de télémétrie.
            </p>
          </motion.div>

          {/* Main Interactive Showcase Container */}
          <div className="relative rounded-3xl overflow-hidden border border-border bg-card/40 p-4 md:p-8">
            {/* MOCK BACKGROUND (Blurred & Non-interactive) */}
            <div
              className="filter blur-md opacity-30 pointer-events-none select-none grid grid-cols-1 md:grid-cols-3 gap-6"
              aria-hidden="true"
            >
              {/* Fake Identity Card & Engine Status */}
              <div className="space-y-6">
                <div className="glass-card p-5 space-y-4">
                  <div className="flex items-center gap-3 border-b border-border pb-3">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center font-bold text-white">
                      42
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">Tony Kart 401R</h3>
                      <p className="text-xs text-muted-foreground">Moteur IAME X30 125cc</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-foreground">Usure Moteur (12.5h / 15h)</span>
                        <span className="text-amber-500 font-bold">83%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 w-[83%]" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-foreground">Freins Avant</span>
                        <span className="text-emerald-500 font-bold">65%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[65%]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-5 space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Stock de Pneus</h4>
                  <div className="p-2.5 rounded-lg bg-background/80 border border-border text-xs flex justify-between text-foreground">
                    <span>Set #1 Vegas Red (Rodé)</span>
                    <span className="font-semibold text-primary">3 sessions</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background/80 border border-border text-xs flex justify-between text-foreground">
                    <span>Set #2 Mojo D5 (Neuf)</span>
                    <span className="font-semibold text-emerald-500">0 session</span>
                  </div>
                </div>
              </div>

              {/* Fake Center/Right Panels: Maintenance & Health */}
              <div className="md:col-span-2 space-y-6">
                <div className="glass-card p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <h3 className="font-bold text-sm text-foreground">Santé Globale & Alertes</h3>
                    <Badge variant="destructive" className="text-xs">1 Révision Requise</Badge>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs">
                    ⚠️ Révision piston recommandée dans 2h30 de roulage.
                  </div>

                  <div className="space-y-2 pt-2">
                    <h4 className="font-bold text-xs text-muted-foreground">Historique d'entretien récent</h4>
                    <div className="p-3 rounded-xl bg-background/60 border border-border flex justify-between text-xs text-foreground">
                      <span>Vidange huile de boîte</span>
                      <span className="text-muted-foreground">Il y a 3 jours</span>
                    </div>
                    <div className="p-3 rounded-xl bg-background/60 border border-border flex justify-between text-xs text-foreground">
                      <span>Remplacement bougie NGK R7282</span>
                      <span className="text-muted-foreground">Il y a 10 jours</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FOREGROUND OVERLAY (Crisp Net Information & CTA) */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-background/70 backdrop-blur-md">
              <div className="max-w-3xl w-full text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary font-semibold text-xs uppercase tracking-wider animate-pulse">
                  <Lock className="w-4 h-4" />
                  <span>Fonctionnalité Déblocable</span>
                </div>

                <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground">
                  Gérez votre <span className="text-gradient-primary">Garage Virtuel</span>
                </h2>

                <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
                  Anticipez l'usure mécanique de votre matériel et optimisez vos performances en toute sécurité.
                </p>

                {/* Feature Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left my-6">
                  <div className="p-4 rounded-xl bg-card border border-border/80 shadow-lg flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">Suivi Moteur & Freins</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Calcul automatique des heures de fonctionnement et des taux d'usure calculés à chaque fichier CSV uploadé.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-card border border-border/80 shadow-lg flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                      <Disc className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">Gestion du Stock de Pneus</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Déclarez vos trains de pneus (neufs, rodés, pluie) et suivez le nombre exact de sessions effectuées par chaque train.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-card border border-border/80 shadow-lg flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">Journal d'Entretien</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Consignez les vidanges, changements de chaînes, bougies et révisions pour conserver un historique limpide.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-card border border-border/80 shadow-lg flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                      <Battery className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">Alertes Mécaniques Préventives</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recevez des avertissements personnalisés avant l'atteinte des seuils critiques de maintenance moteur.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Call to Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                  <Link to="/login?mode=signup" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full gradient-primary text-primary-foreground font-semibold px-8 gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                      <Sparkles className="w-4 h-4" />
                      Créer mon compte
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/pricing" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full border-border hover:bg-muted text-foreground font-medium">
                      Découvrir les plans
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
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
    return (
      <Layout>
        <KartSetupWizard token={session!.access_token} onComplete={fetchProfile} initialProfile={prof} />
      </Layout>
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

  const handleReset = async (component: "engine" | "tires" | "brakes" | "chain") => {
    if (!confirm(`Es-tu sûr de vouloir réinitialiser l'usure pour : ${component} ?`)) return;
    if (!session?.access_token) return;
    try {
      console.log(`Resetting ${component}...`);
      
      // Update profile counters to 0 to bypass potential backend issues with custom fields
      const updates: any = {};
      if (component === "engine") {
        updates.engine_hours_current = 0;
      } else if (component === "tires") {
        updates.tires_sessions_current = 0;
        updates.tires_laps_current = 0;
      } else if (component === "brakes") {
        updates.brakes_sessions_current = 0;
        updates.brakes_hours_current = 0;
      } else if (component === "chain") {
        updates.chain_hours_current = 0;
      }
      
      await api.updateKartProfile(session.access_token, updates);

      if (component !== "chain") {
        await api.resetKartComponent(session.access_token, component, "Remplacement et remise à zéro");
      } else {
        await addKartHistoryEntry(session.access_token, "brakes", "[chain] Remplacement / Graissage de la chaîne", new Date().toISOString());
      }
      
      toast.success("Compteur réinitialisé.");
      fetchProfile();
    } catch (e: any) {
      console.error("Reset component failed:", e);
      toast.error("Erreur réinitialisation : " + e.message);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Supprimer cette session et recalculer les temps ?")) return;
    if (!session?.access_token) return;
    try {
      console.log(`[MonKart] Deleting session with ID: ${id}`);
      await api.deleteKartSession(session.access_token, id);
      toast.success("Session supprimée.");
      fetchProfile();
    } catch (e: any) {
      console.error("[MonKart] Delete session failed:", id, e);
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
    if (!sess) return acc;
    const dateVal = sess.session_date || sess.created_at;
    if (!dateVal) return acc;
    try {
      const dateObj = new Date(dateVal);
      if (isNaN(dateObj.getTime())) return acc;
      const dateStr = dateObj.toISOString().split("T")[0]; // yyyy-MM-dd
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
      acc[dateStr].totalDuration += sess.duration_hours || 0;
      if (sess.rpm_max > acc[dateStr].rpmMax) acc[dateStr].rpmMax = sess.rpm_max;
      if (sess.g_lateral_max > acc[dateStr].gLatMax) acc[dateStr].gLatMax = sess.g_lateral_max;
      if (sess.exhaust_temp_max && sess.exhaust_temp_max > acc[dateStr].tempMax)
        acc[dateStr].tempMax = sess.exhaust_temp_max;
      if (!acc[dateStr].circuit || acc[dateStr].circuit === "Mixte")
        acc[dateStr].circuit = sess.circuit_name;
    } catch (e) {
      console.error("Failed to parse session date", e);
    }
    return acc;
  }, {});

  const dailyLogs = Object.values(sessionsByDay).sort(
    (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

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
      let finalType = type;
      let finalNotes = notes;
      if (type !== "engine" && type !== "tires" && type !== "brakes") {
        finalType = "brakes"; // Map to brakes to bypass DB check constraint
        finalNotes = `[${type}] ${notes}`;
      }
      await addKartHistoryEntry(session.access_token, finalType, finalNotes, date);
      toast.success("Intervention ajoutée au journal.");
      fetchProfile();
    } catch (e: any) {
      toast.error("Erreur d'ajout à l'historique : " + e.message);
    }
  };

  const handleDeleteHistoryEntry = async (entryId: string) => {
    if (!confirm("Supprimer cette entrée d'entretien ?")) return;
    if (!session?.access_token) return;
    try {
      console.log(`[MonKart] Deleting history entry: ${entryId}`);
      await deleteKartHistoryEntry(session.access_token, entryId);
      toast.success("Entrée d'entretien supprimée.");
      fetchProfile();
    } catch (e: any) {
      console.error("[MonKart] Delete history entry failed:", entryId, e);
      toast.error("Erreur suppression : " + e.message);
    }
  };

  const handleDeleteDay = async (date: string) => {
    if (
      !confirm(
        `Supprimer toutes les sessions du ${new Date(date).toLocaleDateString("fr-FR")} ? Cette action est irréversible.`
      )
    )
      return;
    if (!session?.access_token) return;
    try {
      console.log(`[MonKart] Deleting all sessions for day: ${date}`);
      await deleteKartSessionDay(session.access_token, date);
      toast.success("Journée supprimée.");
      fetchProfile();
    } catch (e: any) {
      console.error("[MonKart] Delete day failed:", date, e);
      toast.error("Erreur suppression : " + e.message);
    }
  };

  const handleIgnoreAlert = async (alertId: string) => {
    if (!prof || !session?.access_token) return;
    const ignored = prof.setup_json?.ignored_alerts || [];
    const newIgnored = ignored.includes(alertId)
      ? ignored.filter((id: string) => id !== alertId)
      : [...ignored, alertId];
    
    try {
      await api.updateKartProfile(session.access_token, {
        setup_json: {
          ...(prof.setup_json || {}),
          ignored_alerts: newIgnored,
        }
      });
      toast.success("Statut de l'alerte mis à jour.");
      fetchProfile();
    } catch (e: any) {
      toast.error("Erreur de mise à jour de l'alerte : " + e.message);
    }
  };

  return (
    <Layout>
      <PageMeta
        title="Mon Kart | ApexAI"
        description="Suivi de l'usure de ton kart (cockpit interactif)."
        path="/kart"
      />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <GarageHeader
          profile={prof}
          onUpdate={handleUpdateCounter}
        />

        {prof && (
          <AlertBanner 
            profile={prof} 
            recent_sessions={sessions} 
            onUpdate={handleUpdateCounter} 
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* COLONNE GAUCHE — Schéma, Santé et Identité (Informations du Kart) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 order-1 h-fit">
            <div className="flex items-center justify-center p-4 bg-card border border-border shadow-sm rounded-2xl">
              {prof && (
                <KartSchematic 
                  profile={prof} 
                  recent_sessions={sessions} 
                  onUpdate={handleUpdateCounter} 
                />
              )}
            </div>
            {prof && <KartHealthStatus profile={prof} />}

            {prof && (
              <KartIdentityCard
                profile={prof}
                mountedTire={mountedTire}
                onRelaunchConfig={() => handleUpdateCounter("engine_model", null)}
              />
            )}

            {session?.access_token && (
              <TireStockCard
                token={session.access_token}
                tireSets={tireSets}
                onRefresh={fetchTireSets}
              />
            )}
          </div>

          {/* COLONNE DROITE — Actions, Alertes et Historique */}
          <div className="lg:col-span-7 xl:col-span-8 order-2 space-y-6">
            {/* Importer ma journée */}
            <Card className="bg-card border border-border shadow-sm rounded-2xl">
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

            {/* LIGNE 2 : les 4 jauges d'usure en 2×2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <WearGauge 
                component="engine" 
                label="Moteur" 
                unit="h"
                icon={<Flame className="w-5 h-5 text-red-500" />}
                current={prof?.engine_hours_current} 
                max={prof?.engine_hours_life}
                field="engine_hours_current" 
                onUpdate={handleUpdateCounter}
                onAction={() => handleReset("engine")} 
                actionLabel="Réviser le moteur" 
              />
              <WearGauge 
                component="tires" 
                label="Pneus" 
                unit="tours"
                icon={<Disc className="w-5 h-5 text-purple-500" />}
                current={prof?.tires_laps_current} 
                max={prof?.tires_laps_life}
                field="tires_laps_current" 
                onUpdate={handleUpdateCounter}
                onAction={() => handleReset("tires")} 
                actionLabel="Remplacer le train" 
              />
              <WearGauge 
                component="brakes" 
                label="Freins" 
                unit="tours"
                icon={<Loader2 className="w-5 h-5 text-orange-500" />}
                current={prof?.brakes_sessions_current} 
                max={prof?.brakes_sessions_life}
                field="brakes_sessions_current" 
                onUpdate={handleUpdateCounter}
                onAction={() => handleReset("brakes")} 
                actionLabel="Changer plaquettes" 
              />
              <WearGauge 
                component="chain" 
                label="Chaîne" 
                unit="h"
                icon={<Wrench className="w-5 h-5 text-blue-500" />}
                current={prof?.chain_hours_current} 
                max={prof?.chain_hours_life}
                field="chain_hours_current" 
                onUpdate={handleUpdateCounter}
                onAction={() => handleReset("chain")} 
                actionLabel="Graisser / Changer" 
              />
            </div>

            {/* Journal d'Entretien */}
            <div className="mt-6">
              {prof && (
                <KartMaintenanceLog
                  history={history}
                  profile={prof}
                  onAddEntry={handleAddHistory}
                  onDeleteEntry={handleDeleteHistoryEntry}
                  onResetComponent={handleReset}
                  onIgnoreAlert={handleIgnoreAlert}
                />
              )}
            </div>

            {/* Historique des Journées de Roulage - Déplacé dans la colonne de droite pour combler le vide */}
            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle>Historique des Journées de Roulage</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Résumé agrégé de vos sorties en piste. Chaque ligne rassemble les sessions d'une même
                  journée.
                </p>
              </CardHeader>
              <CardContent>
                {dailyLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucune journée enregistrée.
                  </p>
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
                          <th className="pb-3 font-medium text-right">Temp Échap. Max</th>
                          <th className="pb-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyLogs.map((log: any, i: number) => (
                          <tr
                            key={i}
                            className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                          >
                            <td className="py-3 font-medium">
                              {new Date(log.date).toLocaleDateString()}
                            </td>
                            <td className="py-3">{log.circuit || "Inconnu"}</td>
                            <td className="py-3 text-center">
                              <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-semibold">
                                {log.sessionsCount}
                              </span>
                            </td>
                            <td className="py-3 text-muted-foreground">
                              {log.totalDuration.toFixed(2)} h
                            </td>
                            <td className="py-3 text-right">
                              {log.rpmMax ? `${Math.round(log.rpmMax)} tr/min` : "-"}
                            </td>
                            <td className="py-3 text-right">
                              {log.gLatMax ? `${log.gLatMax.toFixed(2)} G` : "-"}
                            </td>
                            <td className="py-3 text-right">
                              {log.tempMax ? `${Math.round(log.tempMax)} °C` : "-"}
                            </td>
                            <td className="py-3 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                onClick={() => handleDeleteDay(log.date)}
                                title="Supprimer cette journée"
                              >
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
        </div>
      </div>
    </Layout>
  );
}
