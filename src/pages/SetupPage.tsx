import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SetupContextCard } from '@/components/setup/SetupContextCard';
import { TireSetupCard } from '@/components/setup/TireSetupCard';
import { ChassisSetupCard } from '@/components/setup/ChassisSetupCard';
import { DrivetrainSetupCard } from '@/components/setup/DrivetrainSetupCard';
import { SavedSetupsCard } from '@/components/setup/SavedSetupsCard';
import { CircuitCard } from '@/components/setup/CircuitCard';
import { WeightCard } from '@/components/setup/WeightCard';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Layout } from '@/components/layout/Layout';
import { PageMeta } from '@/components/seo/PageMeta';
import { ENGINE_PRESETS } from '@/constants/kart-presets';
import { generateRecommendations, AdvisorInput, Recommendation } from '@/utils/advisorEngine';
import { exportSetupSheetPDF } from '@/lib/pdf/setupSheet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Sparkles, Save, Loader2, Wrench, Zap, Disc3, Shield, Cpu, FileDown } from 'lucide-react';

export interface SetupState {
  id?: string;
  setupName?: string;
  weather: 'sec' | 'humide' | 'pluie';
  grip: 'faible' | 'normal' | 'gommée';
  airTemp: number | '';
  trackTemp: number | '';
  mode: 'course' | 'qualif' | 'warmup';
  circuit: any | null;
  tireModel: string;
  coldPressureFront: number | '';
  coldPressureRear: number | '';
  hotPressureFront: number | '';
  hotPressureRear: number | '';
  trackWidthFront: number | '';
  trackWidthRear: number | '';
  rideHeightFront: string;
  rideHeightRear: string;
  camber: string;
  caster: string;
  rearAxle: string;
  sprocketFront: number | '';
  sprocketRear: number | '';
  carbConfig: any;
  driverWeight: number | '';
  kartWeight: number | '';
  targetWeight: number | '';
  ballast: number | '';
  // Recommandations figées au moment de la génération (sauvegardées avec le réglage)
  recommendations?: Record<string, Recommendation> | null;
}

const defaultSetupState: SetupState = {
  setupName: '',
  weather: 'sec',
  grip: 'normal',
  airTemp: '',
  trackTemp: '',
  mode: 'course',
  circuit: null,
  tireModel: '',
  coldPressureFront: '',
  coldPressureRear: '',
  hotPressureFront: '',
  hotPressureRear: '',
  trackWidthFront: '',
  trackWidthRear: '',
  rideHeightFront: '',
  rideHeightRear: '',
  camber: '',
  caster: '',
  rearAxle: '',
  sprocketFront: '',
  sprocketRear: '',
  carbConfig: {},
  driverWeight: '',
  kartWeight: '',
  targetWeight: '',
  ballast: '',
};

export default function SetupPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [setupState, setSetupState] = useState<SetupState>(defaultSetupState);
  const [refreshKey, setRefreshKey] = useState(0);
  const [recommendations, setRecommendations] = useState<Record<string, Recommendation>>({});
  const [tireSetAdvice, setTireSetAdvice] = useState<any | null>(null);
  const [tireSets, setTireSets] = useState<any[]>([]);
  const [hasGeneratedRecs, setHasGeneratedRecs] = useState(false);
  
  // États pour l'animation IA Math Engine
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisText, setAnalysisText] = useState("");

  // Référence pour défilement fluide
  const recsRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.access_token) return;
      try {
        const [profRes, tireRes] = await Promise.all([
          api.getKartProfile(session.access_token),
          api.getTireSets(session.access_token).catch(() => ({ tire_sets: [] })),
        ]);
        setTireSets(tireRes.tire_sets || []);
        if (profRes && profRes.profile) {
          setProfile(profRes.profile);
          // Le modèle de pneus affiché suit le PNEU MONTÉ (Stock de Pneus),
          // avec repli sur le profil. Le Bilan Poids reste vide (pas de
          // pré-remplissage fantôme).
          const mounted = (tireRes.tire_sets || []).find((t: any) => t.is_mounted);
          const mountedModel = mounted?.custom_model || mounted?.component_label || profRes.profile.tires_model;
          setSetupState(prev => {
            if (prev.tireModel || !mountedModel) return prev;
            return { ...prev, tireModel: mountedModel };
          });
        }
      } catch (err) {
        console.error("Erreur de récupération profil:", err);
      }
    };
    fetchProfile();
  }, [session]);

  const handleContextChange = (updates: Partial<SetupState>) => {
    setSetupState((prev) => ({ ...prev, ...updates }));
    if (hasGeneratedRecs && (updates.weather || updates.trackTemp || updates.grip || updates.circuit || updates.driverWeight || updates.kartWeight)) {
      // Les conditions ont changé, on peut prévenir l'utilisateur ou régénérer automatiquement
      setHasGeneratedRecs(false);
      setRecommendations({});
    }
  };

  const isFormReadyToRecommend = 
    setupState.circuit !== null &&
    setupState.weather !== '' &&
    setupState.grip !== '' &&
    setupState.airTemp !== '' &&
    setupState.trackTemp !== '' &&
    setupState.driverWeight !== '' &&
    setupState.kartWeight !== '';

  const handleSaveWeightProfile = async (name: string) => {
    if (!session?.access_token) return;
    const newProfile = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      driverWeight: setupState.driverWeight,
      kartWeight: setupState.kartWeight,
      ballast: setupState.ballast,
      targetWeight: setupState.targetWeight
    };
    const updatedProfiles = [...(profile?.setup_json?.weight_profiles || []), newProfile];
    const updatedSetupJson = {
      ...(profile?.setup_json || {}),
      weight_profiles: updatedProfiles
    };
    try {
      const res = await api.updateKartProfile(session.access_token, { setup_json: updatedSetupJson });
      if (res && res.profile) {
        setProfile(res.profile);
        toast({
          title: "Profil de poids enregistré",
          description: `Le profil de poids "${name}" a été enregistré.`
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible d'enregistrer le profil de poids.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteWeightProfile = async (id: string) => {
    if (!session?.access_token) return;
    const updatedProfiles = (profile?.setup_json?.weight_profiles || []).filter((p: any) => p.id !== id);
    const updatedSetupJson = {
      ...(profile?.setup_json || {}),
      weight_profiles: updatedProfiles
    };
    try {
      const res = await api.updateKartProfile(session.access_token, { setup_json: updatedSetupJson });
      if (res && res.profile) {
        setProfile(res.profile);
        toast({
          title: "Profil de poids supprimé",
          description: "Le profil a été supprimé avec succès."
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur de suppression",
        description: "Impossible de supprimer le profil.",
        variant: "destructive"
      });
    }
  };

  const handleGenerateRecommendations = () => {
    if (!isFormReadyToRecommend) return;
    
    setIsAnalyzing(true);
    setHasGeneratedRecs(false); // Reset to enable animation
    setAnalysisText("Analyse de la signature de la piste...");

    setTimeout(() => {
      setAnalysisText(`Modélisation thermique des ${profile?.tires_model || 'pneus'}...`);
    }, 500);

    setTimeout(() => {
      setAnalysisText("Optimisation des rapports de transmission...");
    }, 1000);

    setTimeout(async () => {
      const totalWeight = (Number(setupState.driverWeight) || 0) + (Number(setupState.kartWeight) || 0) + (Number(setupState.ballast) || 0);

      const input: AdvisorInput = {
        weather: setupState.weather as 'sec' | 'humide' | 'pluie',
        trackTemp: setupState.trackTemp ? Number(setupState.trackTemp) : '',
        grip: setupState.grip as 'faible' | 'normal' | 'gommée',
        circuit: setupState.circuit,
        totalWeight,
        profile: profile,
        setupState: setupState
      };

      const recs = generateRecommendations(input);

      // Advisor backend : les pressions issues des abaques du catalogue
      // (kart_components) priment sur l'heuristique locale. Fallback silencieux.
      try {
        if (session?.access_token) {
          const advisorRes = await api.getKartAdvisor(session.access_token, {
            tireModel: setupState.tireModel || profile?.tires_model || '',
            weather: setupState.weather,
            trackTemp: setupState.trackTemp !== '' ? Number(setupState.trackTemp) : null,
            airTemp: setupState.airTemp !== '' ? Number(setupState.airTemp) : null,
            grip: setupState.grip,
            circuit: setupState.circuit,
            mode: setupState.mode,
            totalWeight,
            sprocketFront: setupState.sprocketFront !== '' ? Number(setupState.sprocketFront) : null,
            sprocketRear: setupState.sprocketRear !== '' ? Number(setupState.sprocketRear) : null,
          });
          if (advisorRes?.recommendations) {
            Object.assign(recs, advisorRes.recommendations);
          }
          setTireSetAdvice(advisorRes?.tire_set_advice || null);
        }
      } catch {
        // L'heuristique locale reste en place si le backend est injoignable
      }

      // Auto-remplissage des champs
      const autoFillUpdates: Partial<SetupState> = {};
      Object.entries(recs).forEach(([key, rec]) => {
        if (rec.suggestedValue !== undefined) {
          if (key === 'carbConfig' && typeof rec.suggestedValue === 'object') {
            autoFillUpdates.carbConfig = {
              ...(setupState.carbConfig || {}),
              ...rec.suggestedValue
            };
          } else {
            (autoFillUpdates as any)[key] = rec.suggestedValue;
          }
        }
      });

      setSetupState(prev => ({ ...prev, ...autoFillUpdates }));
      setRecommendations(recs);
      setIsAnalyzing(false);
      setHasGeneratedRecs(true);
      
      toast({
        title: "Recommandations appliquées",
        description: "Le Cerveau ApexAI a pré-rempli vos réglages optimaux.",
      });

      // Défilement fluide
      setTimeout(() => {
        recsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }, 1500);
  };

  const handleSave = async () => {
    if (!session?.access_token) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour sauvegarder un réglage.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const sanitizedState = Object.fromEntries(
        Object.entries(setupState).map(([key, value]) => [
          key,
          value === "" ? null : value
        ])
      );

      if (setupState.circuit && typeof setupState.circuit === 'object') {
        sanitizedState.circuit_id = setupState.circuit.id || setupState.circuit.value;
      }
      sanitizedState.setupName = setupState.setupName || `Réglage ${new Date().toLocaleDateString()}`;
      if (setupState.id) {
        sanitizedState.id = setupState.id;
      }

      // Figer les recommandations générées avec ce réglage : elles seront
      // restaurées à l'identique au rechargement, même si le pilote a
      // modifié les valeurs des champs.
      sanitizedState.recommendations =
        recommendations && Object.keys(recommendations).length > 0 ? recommendations : null;

      await api.saveKartSetup(session.access_token, sanitizedState);
      toast({
        title: setupState.id ? "Réglage mis à jour !" : "Réglage sauvegardé !",
        description: setupState.id ? "Le réglage a été mis à jour avec succès." : "Vos réglages ont été enregistrés avec succès."
      });
      
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible d'enregistrer le réglage.",
        variant: "destructive"
      });
    }
    setIsSaving(false);
  };

  const handleExportPdf = () => {
    const mounted = tireSets.find((t: any) => t.is_mounted);
    const mountedLabel = mounted
      ? `${mounted.label} · ${mounted.custom_model || mounted.component_label || ''}`
      : undefined;
    // Note ingénieur : la reco de train + la justification des pressions figées
    const noteParts: string[] = [];
    if (tireSetAdvice?.message) noteParts.push(tireSetAdvice.message);
    if (recommendations?.coldPressureFront?.message) noteParts.push(recommendations.coldPressureFront.message);
    exportSetupSheetPDF(setupState, {
      circuitName: setupState.circuit?.name,
      mountedTireLabel: setupState.tireModel || mountedLabel,
      engineerNote: noteParts.join(' ') || undefined,
    });
  };

  const handleNewSetup = () => {
    setSetupState({
      ...defaultSetupState,
      tireModel: profile?.tires_model || '',
      kartWeight: profile?.kart_weight ? Number(profile.kart_weight) : '',
      driverWeight: profile?.driver_weight ? Number(profile.driver_weight) : '',
    });
    setHasGeneratedRecs(false);
    setRecommendations({});
  };

  const enginePreset = ENGINE_PRESETS.find(p => p.name === profile?.engine_model);
  const engineCategory = enginePreset ? enginePreset.category : (profile?.engine_model || 'X30 Senior');

  return (
    <Layout>
      <PageMeta 
        title="Carnet d'Ingénieur | ApexAI" 
        description="Gérez et optimisez les setups techniques de votre kart avec le Cerveau ApexAI." 
      />
      
      <div className="min-h-screen bg-background text-foreground pb-20">
        <div className="container max-w-7xl mx-auto pt-8 px-4 space-y-8">
          
          <header className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Carnet d'Ingénieur Digital</h1>
            <p className="text-muted-foreground">
              Configuration pour la catégorie <span className="font-semibold text-primary">{engineCategory}</span>
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Colonne Gauche (6 colonnes) : Mes réglages, Poids et Mon Kart */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
              {/* Pas de contrainte de hauteur ici : la carte gère son propre
                  défilement interne (ScrollArea), sinon double scroll et liste tronquée. */}
              <div>
                <SavedSetupsCard
                  refreshKey={refreshKey}
                  onSelectSetup={(setup) => {
                    // Récupération des poids du profil en fallback si vides dans le setup sauvegardé
                    const loadedSetup = {
                      ...setup,
                      driverWeight: setup.driverWeight || profile?.setup_json?.driver_weight_kg || profile?.driver_weight_kg || '',
                      kartWeight: setup.kartWeight || profile?.setup_json?.weight_empty_kg || profile?.weight_empty_kg || '',
                      ballast: setup.ballast || profile?.setup_json?.ballast_kg || profile?.ballast_kg || '',
                      targetWeight: setup.targetWeight || profile?.setup_json?.category_min_weight_kg || profile?.category_min_weight_kg || '',
                    };

                    setSetupState(loadedSetup);

                    // Recommandations FIGÉES : si le réglage a été sauvegardé avec
                    // ses recommandations d'origine, on les restaure telles quelles.
                    // On ne recalcule (fallback anciens réglages) que si absentes.
                    const storedRecs = (setup as any).recommendations;
                    if (storedRecs && Object.keys(storedRecs).length > 0) {
                      setRecommendations(storedRecs);
                    } else {
                      const totalWeight = (Number(loadedSetup.driverWeight) || 0) + (Number(loadedSetup.kartWeight) || 0) + (Number(loadedSetup.ballast) || 0);
                      const input: AdvisorInput = {
                        weather: loadedSetup.weather as 'sec' | 'humide' | 'pluie',
                        trackTemp: loadedSetup.trackTemp ? Number(loadedSetup.trackTemp) : '',
                        grip: loadedSetup.grip as 'faible' | 'normal' | 'gommée',
                        circuit: loadedSetup.circuit,
                        totalWeight,
                        profile: profile,
                        setupState: loadedSetup
                      };
                      setRecommendations(generateRecommendations(input));
                    }
                    setHasGeneratedRecs(true);
                    
                    // Notification verte opaque et lisible de succès (disparaît plus rapidement)
                    toast({
                      title: "Réglage appliqué avec succès",
                      description: `Le setup "${setup.setupName || 'Réglage'}" et ses configurations ont été chargés.`,
                      className: "bg-emerald-600 border-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/20 z-[99999]",
                      duration: 1000
                    });

                    // Défilement fluide très léger vers le bas
                    setTimeout(() => {
                      recsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 250);
                  }} 
                  onNewSetup={handleNewSetup} 
                  onSaveSetup={handleSave}
                  onExportPdf={handleExportPdf}
                  isSaving={isSaving}
                />
              </div>
              <WeightCard
                driverWeight={setupState.driverWeight}
                kartWeight={setupState.kartWeight}
                targetWeight={setupState.targetWeight}
                ballast={setupState.ballast}
                onChange={handleContextChange}
                weightProfiles={profile?.setup_json?.weight_profiles || []}
                onSaveProfile={handleSaveWeightProfile}
                onDeleteProfile={handleDeleteWeightProfile}
                token={session?.access_token}
              />
              {profile && (
                <Card 
                  onClick={() => navigate('/mon-kart')}
                  className="bg-card border border-border shadow-sm rounded-2xl p-5 cursor-pointer hover:border-primary/50 hover:bg-primary/5 hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300 group text-left space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-border/80 pb-3">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-primary" />
                      <h4 className="font-semibold text-sm">Mon Kart</h4>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full transition-colors group-hover:bg-primary/20">
                      Garage →
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 text-xs">
                    {/* Chassis */}
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-background border border-border text-muted-foreground shrink-0">
                        <Wrench className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground text-[10px] uppercase tracking-wider leading-none">Châssis</p>
                        <p className="font-semibold text-foreground mt-0.5">
                          {profile.setup_json?.chassis_brand || 'Non défini'} {profile.setup_json?.chassis_model || ''}
                          <span className="text-muted-foreground font-normal ml-1">({profile.setup_json?.chassis_year || 'N/A'})</span>
                        </p>
                      </div>
                    </div>

                    {/* Moteur */}
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-background border border-border text-muted-foreground shrink-0">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground text-[10px] uppercase tracking-wider leading-none">Motorisation</p>
                        <p className="font-semibold text-foreground mt-0.5">
                          {profile.engine_model || 'Non défini'}
                          {profile.engine_hours_life !== undefined && (
                            <span className="text-primary font-mono ml-2 text-[10px] bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">
                              Potentiel: {profile.engine_hours_life}h
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Pneus */}
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-background border border-border text-muted-foreground shrink-0">
                        <Disc3 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground text-[10px] uppercase tracking-wider leading-none">Pneu monté</p>
                        <p className="font-semibold text-foreground mt-0.5">
                          {(() => {
                            const mounted = tireSets.find((t: any) => t.is_mounted);
                            if (!mounted) return profile.tires_model || 'Non défini';
                            const model = mounted.custom_model || mounted.component_label || 'Pneu';
                            return `${mounted.label} · ${model}`;
                          })()}
                          {(() => {
                            const mounted = tireSets.find((t: any) => t.is_mounted);
                            const laps = mounted ? mounted.laps_current : profile.tires_laps_current;
                            return laps !== undefined && laps !== null ? (
                              <span className="text-muted-foreground font-normal ml-2 text-[10px]">
                                ({laps} tours usure)
                              </span>
                            ) : null;
                          })()}
                        </p>
                      </div>
                    </div>

                    {/* Freins */}
                    {profile.brakes_model && (
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-background border border-border text-muted-foreground shrink-0">
                          <Shield className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground text-[10px] uppercase tracking-wider leading-none">Système de Freinage</p>
                          <p className="font-semibold text-foreground mt-0.5">
                            {profile.brakes_model}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Acquisition */}
                    {profile.setup_json?.acquisition_device && (
                      <div className="flex items-start gap-2.5 border-t border-border/50 pt-2 mt-1">
                        <div className="p-1.5 rounded-lg bg-background border border-border text-muted-foreground shrink-0">
                          <Cpu className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground text-[10px] uppercase tracking-wider leading-none">Acquisition de données</p>
                          <p className="font-semibold text-foreground mt-0.5">
                            {profile.setup_json.acquisition_device}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* Colonne Droite (6 colonnes) : Circuit et Contexte & Piste */}
            <div className="lg:col-span-6 flex flex-col h-full justify-between space-y-8">
              <CircuitCard state={setupState} onChange={handleContextChange} />
              
              <SetupContextCard 
                state={setupState}
                onChange={handleContextChange}
                className="flex-1"
              />
            </div>

          </div>

          {/* Section Milieu : L'ingénieur ApexAI (Pleine Largeur) */}
          <Card className="bg-primary/5 border-primary/20 shadow-lg overflow-hidden relative max-w-4xl mx-auto">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-500"></div>
            <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
              <div className="bg-primary/10 p-3 rounded-full mb-1">
                <Brain className={`w-8 h-8 text-primary ${isAnalyzing ? 'animate-pulse scale-110' : ''}`} />
              </div>
              <h3 className="text-xl font-bold">L'ingénieur ApexAI est prêt</h3>
              <p className="text-muted-foreground text-xs max-w-md">
                Laissez notre moteur d'intelligence analyser vos conditions de piste et votre matériel pour obtenir une configuration de base optimale.
              </p>
              
              <Button 
                size="lg" 
                onClick={handleGenerateRecommendations}
                disabled={!isFormReadyToRecommend || isAnalyzing || hasGeneratedRecs}
                className="mt-2 font-bold gap-2 text-md shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all min-w-[280px] disabled:opacity-80"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Calcul d'ingénierie...
                  </>
                ) : hasGeneratedRecs ? (
                  <>
                    <Brain className="w-5 h-5 text-primary" />
                    Configuration Active
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Générer les recommandations ApexAI
                  </>
                )}
              </Button>

              {/* Micro-texte dynamique d'IA Math Engine */}
              {isAnalyzing && (
                <div className="text-xs font-mono text-primary/80 bg-primary/5 border border-primary/10 px-4 py-1.5 rounded-full animate-pulse mt-1">
                  {analysisText}
                </div>
              )}

              {!isFormReadyToRecommend && !isAnalyzing && !hasGeneratedRecs && (
                <div className="text-xs text-amber-500/80 bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 max-w-sm mt-1 text-left space-y-1">
                  <p className="font-semibold flex items-center gap-1.5"><Brain className="w-3.5 h-3.5" /> Informations requises :</p>
                  <ul className="list-disc list-inside text-muted-foreground text-[11px] space-y-0.5">
                    {setupState.circuit === null && <li>Sélectionner un circuit</li>}
                    {(setupState.weather === '' || setupState.grip === '' || setupState.airTemp === '' || setupState.trackTemp === '') && <li>Remplir le contexte de piste (Météo/Temp/Grip)</li>}
                    {(setupState.driverWeight === '' || setupState.kartWeight === '') && <li>Indiquer les poids du pilote et du kart</li>}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section Bas : Cartes techniques côte-à-côte (3 colonnes) */}
          <div ref={recsRef} className={`space-y-8 transition-all duration-700 transform ${
            !hasGeneratedRecs || isAnalyzing
              ? 'opacity-0 translate-y-8 pointer-events-none' 
              : 'opacity-100 translate-y-0'
          }`}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <TireSetupCard
                state={setupState}
                onChange={handleContextChange}
                recommendations={recommendations}
                tireSetAdvice={tireSetAdvice}
                tireSets={tireSets}
              />
              <ChassisSetupCard
                state={setupState}
                onChange={handleContextChange}
                recommendations={recommendations}
              />
              <DrivetrainSetupCard
                state={setupState}
                onChange={handleContextChange}
                engineCategory={engineCategory}
                recommendations={recommendations}
              />
            </div>

            {hasGeneratedRecs && !isAnalyzing && (
              <div className="flex justify-end gap-3 pt-4 pb-8">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleExportPdf}
                  className="gap-2 px-6 border-border hover:border-primary/40 hover:text-primary"
                >
                  <FileDown className="w-5 h-5" />
                  Fiche PDF
                </Button>
                <Button size="lg" onClick={handleSave} disabled={isSaving} className="gap-2 px-8">
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {setupState.id ? "Mettre à jour le réglage" : "Enregistrer le réglage"}
                </Button>
              </div>
            )}

          </div>
        </div>
      </div>
    </Layout>
  );
}
