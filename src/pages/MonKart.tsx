import { useEffect, useMemo, useState } from "react";
import { Disc, Flame, Loader2, Wrench, CircleDot } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import api, { KartProfileResponse, KartProfile, addKartHistoryEntry, deleteKartHistoryEntry, deleteKartSessionDay } from "@/lib/api";
import type { CatalogPart } from "@/lib/api";
import { KartSchematic } from "@/components/kart/KartSchematic";
import { KartSetupWizard } from "@/components/kart/KartSetupWizard";
import { KartMaintenanceLog } from "@/components/kart/KartMaintenanceLog";
import { GarageHeader } from "@/components/kart/GarageHeader";
import { KartIdentityCard } from "@/components/kart/KartIdentityCard";
import { TireStockCard } from "@/components/kart/TireStockCard";
import { EngineMaintenanceCard } from "@/components/kart/parts/EngineMaintenanceCard";
import { MountedPartsCard, toMountedPart, type MountedParts } from "@/components/kart/parts/MountedPartsCard";
import { WearGauge } from "@/components/kart/WearGauge";
import { KartHealthStatus } from "@/components/kart/KartHealthStatus";
import { KartTodoCard } from "@/components/kart/KartTodoCard";
import { DayImportCard } from "@/components/kart/DayImportCard";
import { KartLogbook, type DayLog } from "@/components/kart/KartLogbook";
import { ComponentActionDialog, type ComponentActionMode } from "@/components/kart/ComponentActionDialog";
import { Layout } from "@/components/layout/Layout";
import { PageMeta } from "@/components/seo/PageMeta";
import { computeKartTasks, remainingLabel, tireGauge, type KartComponent, type TireSetLite } from "@/lib/kartTasks";
import { getAlertThresholds } from "@/lib/kart-recommendations";

const n1 = (v: number) => (Math.round(v * 10) / 10).toString().replace(".", ",");

/**
 * Mon Kart : le carnet de santé du kart.
 *
 * - Une seule porte d'entrée : « Importer ma journée » (l'analyse d'une
 *   séance n'alimente plus Mon Kart : rien n'est compté deux fois).
 * - Les jauges gardent leur référentiel : heures pour le moteur et la chaîne,
 *   tours pour les pneus (par train monté) et les freins.
 * - « À faire » rassemble tout ce qui demande une action, et le carnet
 *   d'entretien tout l'historique (interventions, pièces, journées).
 * - Réservé à Racer et Team : les comptes gratuits et les visiteurs voient
 *   MonKartPreviewPage (aiguillage dans App.tsx).
 */
export default function MonKart() {
  const { session } = useAuth();
  const { tier } = useSubscription();

  const [data, setData] = useState<KartProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tireSets, setTireSets] = useState<TireSetLite[]>([]);
  // Pièce choisie dans le catalogue -> formulaire d'intervention pré-rempli.
  const [fitPart, setFitPart] = useState<CatalogPart | null>(null);
  const [logTab, setLogTab] = useState("interventions");
  const [action, setAction] = useState<KartComponent | null>(null);

  const token = session?.access_token;

  const fetchProfile = async () => {
    if (!token) return;
    try {
      setData(await api.getKartProfile(token));
    } catch (e) {
      if (!String((e as Error)?.message || "").match(/403|Forbidden/)) toast.error("Impossible de charger Mon Kart. Réessaie dans un instant.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTireSets = async () => {
    if (!token) return;
    try {
      const res = await api.getTireSets(token);
      setTireSets(res.tire_sets || []);
    } catch {
      setTireSets([]);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchTireSets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tier]);

  const view = data;
  const sets = tireSets;
  const prof = view?.profile;
  const sessions = useMemo(() => view?.recent_sessions || [], [view]);
  const history = view?.history || [];
  const mountedTire = sets.find((t) => t.is_mounted) || null;
  const tires = tireGauge(prof, mountedTire);

  // Même lecture des pneus partout (schéma, bilan, jauges, « À faire ») : le train monté.
  const tCur = tires.current;
  const tLife = tires.life;
  const effProf = useMemo<KartProfile | undefined>(
    () => (prof ? ({ ...prof, tires_laps_current: tCur, tires_laps_life: tLife } as KartProfile) : undefined),
    [prof, tCur, tLife]
  );
  const tasks = useMemo(() => (effProf ? computeKartTasks(effProf, mountedTire, sessions) : []), [effProf, mountedTire, sessions]);

  const days = useMemo<DayLog[]>(() => {
    const by: Record<string, DayLog> = {};
    for (const s of sessions) {
      const raw = s?.session_date || s?.created_at;
      const d = raw ? new Date(raw) : null;
      if (!d || isNaN(d.getTime())) continue;
      const key = d.toISOString().slice(0, 10);
      const day = (by[key] ??= { date: key, sessionsCount: 0, totalDuration: 0, totalLaps: 0, rpmMax: 0, waterMax: 0, circuit: null });
      day.sessionsCount += 1;
      day.totalDuration += Number(s.duration_hours) || 0;
      day.totalLaps += Number(s.laps_count) || 0;
      day.rpmMax = Math.max(day.rpmMax, Number(s.rpm_max) || 0);
      day.waterMax = Math.max(day.waterMax, Number(s.water_temp_max) || 0);
      if (!day.circuit && s.circuit_name) day.circuit = s.circuit_name;
    }
    return Object.values(by).sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions]);

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Premier passage d'un abonné : configuration du kart.
  if (prof && !prof.engine_model) {
    return (
      <Layout>
        <KartSetupWizard token={token!} onComplete={fetchProfile} initialProfile={prof} />
      </Layout>
    );
  }

  /* ───────────── Actions (verrouillées en aperçu) ───────────── */

  const handleUpdateCounter = async (field: keyof KartProfile, value: unknown) => {
    if (!token) return;
    try {
      await api.updateKartProfile(token, { [field]: value } as Partial<KartProfile>);
      toast.success("Compteur mis à jour.");
      fetchProfile();
    } catch (e) {
      toast.error("Modification impossible : " + (e as Error).message);
    }
  };

  // Jauge des pneus ajustée à la main : sur le train monté s'il existe.
  const handleTireCounter = async (_field: string, value: number) => {
    if (!token) return;
    if (mountedTire) {
      try {
        await api.updateTireSet(token, mountedTire.id, { laps_current: Math.max(0, Math.round(value)) });
        toast.success("Compteur du train mis à jour.");
        fetchTireSets();
      } catch (e) {
        toast.error("Modification impossible : " + (e as Error).message);
      }
    } else {
      await handleUpdateCounter("tires_laps_current", value);
    }
  };

  const setIgnored = async (next: string[]) => {
    if (!prof || !token) return;
    try {
      await api.updateKartProfile(token, { setup_json: { ...(prof.setup_json || {}), ignored_alerts: next } });
      fetchProfile();
    } catch (e) {
      toast.error("Mise à jour impossible : " + (e as Error).message);
    }
  };
  const ignored: string[] = prof?.setup_json?.ignored_alerts || [];

  /** Intervention confirmée : compteur à zéro et ligne au carnet. */
  const applyAction = async (component: KartComponent, mode: ComponentActionMode) => {
    setAction(null);
    if (!token || !prof) return;
    try {
      if (component === "chain") {
        const h = Number(prof.chain_hours_current ?? 0);
        if (mode === "log") {
          await addKartHistoryEntry(token, "brakes", "[chain] Graissage et tension de la chaîne", new Date().toISOString());
          toast.success("Graissage inscrit au carnet.");
        } else {
          await api.updateKartProfile(token, { chain_hours_current: 0 } as Partial<KartProfile>);
          await addKartHistoryEntry(token, "brakes", `[chain] Chaîne remplacée (après ${n1(h)} h)`, new Date().toISOString());
          toast.success("Chaîne remplacée : compteur remis à zéro.");
        }
      } else if (component === "tires" && mountedTire) {
        await api.updateTireSet(token, mountedTire.id, { laps_current: 0 });
        await addKartHistoryEntry(token, "tires", `Train « ${mountedTire.label ?? "monté"} » remis à zéro (après ${Math.round(tires.current)} tours)`, new Date().toISOString());
        toast.success("Train remis à zéro.");
        fetchTireSets();
      } else {
        const updates: Partial<KartProfile> =
          component === "engine"
            ? { engine_hours_current: 0 }
            : component === "tires"
              ? ({ tires_sessions_current: 0, tires_laps_current: 0 } as Partial<KartProfile>)
              : ({ brakes_sessions_current: 0 } as Partial<KartProfile>);
        // Le carnet garde la valeur atteinte (reset_component la lit avant la remise à zéro).
        await api.resetKartComponent(token, component, component === "engine" ? "Révision moteur" : component === "brakes" ? "Plaquettes changées" : "Train de pneus remplacé");
        await api.updateKartProfile(token, updates);
        toast.success("C'est noté : compteur remis à zéro.");
      }
      // L'alerte éventuellement masquée redevient active pour le prochain cycle.
      const id = `${component}_wear`;
      if (ignored.includes(id)) await api.updateKartProfile(token, { setup_json: { ...(prof.setup_json || {}), ignored_alerts: ignored.filter((x) => x !== id) } });
      fetchProfile();
    } catch (e) {
      toast.error("Enregistrement impossible : " + (e as Error).message);
    }
  };

  // Pièce montée depuis le carnet : sa durée de vie du catalogue devient celle de la jauge.
  const handlePartFitted = async (component: KartComponent, part: CatalogPart) => {
    if (!token) return;
    const field = ({ "engine|hours": "engine_hours_life", "tires|laps": "tires_laps_life", "brakes|laps": "brakes_sessions_life", "chain|hours": "chain_hours_life" } as Record<string, string>)[
      `${component}|${part.life_unit}`
    ];
    if (field && part.default_life) {
      try {
        await api.updateKartProfile(token, { [field]: part.default_life } as Partial<KartProfile>);
      } catch {
        /* la jauge garde sa durée actuelle */
      }
    }
    await applyAction(component, "reset");
  };

  const handlePartMounted = async (part: CatalogPart, date: string) => {
    if (!prof || !token) return;
    const current: MountedParts = prof.setup_json?.mounted_parts || {};
    const list = [toMountedPart(part, date), ...(current[part.category] || [])]
      .sort((a, b) => new Date(b.fitted_at).getTime() - new Date(a.fitted_at).getTime())
      .slice(0, 12);
    try {
      await api.updateKartProfile(token, { setup_json: { ...(prof.setup_json || {}), mounted_parts: { ...current, [part.category]: list } } });
      fetchProfile();
    } catch {
      /* le carnet garde la trace du montage */
    }
  };

  const handleAddHistory = async (type: string, notes: string, date: string) => {
    if (!token) return;
    try {
      const known = type === "engine" || type === "tires" || type === "brakes";
      await addKartHistoryEntry(token, known ? type : "brakes", known ? notes : `[${type}] ${notes}`, date);
      toast.success("Intervention ajoutée au carnet.");
      fetchProfile();
    } catch (e) {
      toast.error("Ajout impossible : " + (e as Error).message);
    }
  };

  const handleDeleteHistoryEntry = async (entryId: string) => {
    if (!token || !confirm("Supprimer cette intervention du carnet ?")) return;
    try {
      await deleteKartHistoryEntry(token, entryId);
      fetchProfile();
    } catch (e) {
      toast.error("Suppression impossible : " + (e as Error).message);
    }
  };

  const handleDeleteDay = async (date: string) => {
    if (!token) return;
    if (!confirm(`Supprimer la journée du ${new Date(date).toLocaleDateString("fr-FR")} ? Ses heures et ses tours sont retirés des compteurs.`)) return;
    try {
      await deleteKartSessionDay(token, date);
      toast.success("Journée supprimée.");
      fetchProfile();
    } catch (e) {
      toast.error("Suppression impossible : " + (e as Error).message);
    }
  };

  const openFit = (p: CatalogPart) => {
    setFitPart(p);
    setLogTab("interventions");
    document.getElementById("carnet-entretien")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goToTireStock = () => {
    setAction(null);
    document.getElementById(window.matchMedia("(min-width: 1024px)").matches ? "stock-pneus" : "stock-pneus-mobile")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  /* ───────────── Rendu ───────────── */

  const engineCur = Number(effProf?.engine_hours_current ?? 0);
  const engineLife = Number(effProf?.engine_hours_life ?? 0) || 100;
  const brakesCur = Number(effProf?.brakes_sessions_current ?? 0);
  const brakesLife = Number(effProf?.brakes_sessions_life ?? 0) || 100;
  const chainCur = Number(effProf?.chain_hours_current ?? 0);
  const chainLife = Number(effProf?.chain_hours_life ?? 0) || 100;
  const { warnLimit, critLimit } = getAlertThresholds(effProf?.driving_profile);

  const identityAndStock = (suffix: string) => (
    <>
      {effProf && (
        <KartIdentityCard profile={effProf} mountedTire={mountedTire} onRelaunchConfig={() => handleUpdateCounter("engine_model", null)} />
      )}
      <div id={`stock-pneus${suffix}`}>
        {token && <TireStockCard token={token} tireSets={sets} onRefresh={fetchTireSets} />}
      </div>
    </>
  );

  return (
    <Layout>
      <PageMeta
        title="Mon Kart - Carnet de santé du kart | ApexAI"
        description="Moteur, pneus, freins, chaîne : l'usure de ton kart suivie journée après journée, et ce qu'il faut faire avant ta prochaine sortie."
        path="/mon-kart"
      />
      <div className="container mx-auto space-y-6 px-4 py-8">
        <GarageHeader profile={effProf} onUpdate={handleUpdateCounter} />

        {effProf && (
          <KartTodoCard
            tasks={tasks}
            ignored={ignored}
            onDone={(c) => setAction(c)}
            onIgnore={(id) => setIgnored([...ignored, id])}
            onUnignore={(id) => setIgnored(ignored.filter((x) => x !== id))}
          />
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Colonne gauche : schéma, bilan de santé, identité, stock de pneus */}
          <div className="order-1 flex h-fit flex-col gap-4 lg:col-span-5 xl:col-span-4">
            <div className="flex items-center justify-center rounded-2xl border border-border bg-card p-4 shadow-sm">
              {effProf && <KartSchematic profile={effProf} recent_sessions={sessions} onUpdate={handleUpdateCounter} />}
            </div>
            {effProf && <KartHealthStatus profile={effProf} />}
            <div className="hidden flex-col gap-4 lg:flex">{identityAndStock("")}</div>
          </div>

          {/* Colonne droite : importer, jauges, carnet d'entretien */}
          <div className="order-2 space-y-6 lg:col-span-7 xl:col-span-8">
            <DayImportCard
              token={token}
              firstTime={days.length === 0}
              mountedTireLabel={mountedTire ? `${mountedTire.label ?? "Train monté"}` : null}
              onImported={() => {
                fetchProfile();
                fetchTireSets();
              }}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <WearGauge
                component="engine"
                label="Moteur"
                unit="h"
                icon={<Flame className="h-5 w-5 text-primary" />}
                sublabel={effProf?.engine_model}
                current={engineCur}
                max={engineLife}
                hint={remainingLabel(engineCur, engineLife, "h")}
                field="engine_hours_current"
                onUpdate={(f, v) => handleUpdateCounter(f as keyof KartProfile, v)}
                onAction={() => setAction("engine")}
                actionLabel="Réviser le moteur"
                warnAt={warnLimit}
                critAt={critLimit}
              />
              <WearGauge
                component="tires"
                label="Pneus"
                unit="tours"
                icon={<Disc className="h-5 w-5 text-primary" />}
                sublabel={tires.perSet ? tires.label : effProf?.tires_model}
                current={tires.current}
                max={tires.life}
                hint={remainingLabel(tires.current, tires.life, "tours")}
                field="tires_laps_current"
                onUpdate={handleTireCounter}
                onAction={() => setAction("tires")}
                actionLabel={tires.perSet ? "Changer de train" : "Remplacer le train"}
                warnAt={warnLimit}
                critAt={critLimit}
              />
              <WearGauge
                component="brakes"
                label="Freins"
                unit="tours"
                icon={<CircleDot className="h-5 w-5 text-primary" />}
                sublabel={effProf?.brakes_model}
                current={brakesCur}
                max={brakesLife}
                hint={remainingLabel(brakesCur, brakesLife, "tours")}
                field="brakes_sessions_current"
                onUpdate={(f, v) => handleUpdateCounter(f as keyof KartProfile, v)}
                onAction={() => setAction("brakes")}
                actionLabel="Changer les plaquettes"
                warnAt={warnLimit}
                critAt={critLimit}
              />
              <WearGauge
                component="chain"
                label="Chaîne"
                unit="h"
                icon={<Wrench className="h-5 w-5 text-primary" />}
                current={chainCur}
                max={chainLife}
                hint={remainingLabel(chainCur, chainLife, "h")}
                field="chain_hours_current"
                onUpdate={(f, v) => handleUpdateCounter(f as keyof KartProfile, v)}
                onAction={() => setAction("chain")}
                actionLabel="Graisser / Changer"
                warnAt={warnLimit}
                critAt={critLimit}
              />
            </div>

            {/* Téléphone : identité et stock de pneus après les jauges (à gauche sur ordinateur). */}
            <div className="flex flex-col gap-4 lg:hidden">{identityAndStock("-mobile")}</div>

            <div id="carnet-entretien" className="scroll-mt-24">
              <KartLogbook
                tab={logTab}
                onTabChange={setLogTab}
                days={days}
                onDeleteDay={handleDeleteDay}
                onFitPart={openFit}
                interventions={
                  prof && (
                    <KartMaintenanceLog
                      embedded
                      history={history}
                      profile={prof}
                      onAddEntry={handleAddHistory}
                      onDeleteEntry={handleDeleteHistoryEntry}
                      onPartMounted={handlePartMounted}
                      prefillPart={fitPart}
                      onPrefillConsumed={() => setFitPart(null)}
                      onPartFitted={handlePartFitted}
                    />
                  )
                }
                parts={
                  prof && (
                    <>
                      <EngineMaintenanceCard
                        embedded
                        engineLabel={prof.engine_model}
                        hoursLife={prof.engine_hours_life}
                        onApplyLife={(h) => handleUpdateCounter("engine_hours_life", h)}
                      />
                      <MountedPartsCard embedded parts={prof.setup_json?.mounted_parts || {}} onFit={openFit} />
                    </>
                  )
                }
              />
            </div>
          </div>
        </div>
      </div>

      <ComponentActionDialog
        component={action}
        current={action === "engine" ? engineCur : action === "tires" ? tires.current : action === "brakes" ? brakesCur : chainCur}
        unit={action === "engine" || action === "chain" ? "h" : "tours"}
        tireSetLabel={tires.perSet ? tires.label : null}
        onClose={() => setAction(null)}
        onConfirm={applyAction}
        onGoToTireStock={goToTireStock}
      />
    </Layout>
  );
}
