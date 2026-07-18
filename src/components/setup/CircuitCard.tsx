import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, Sparkles, Plus, Edit2, RefreshCw, Zap, 
  RotateCw, RotateCcw, Mountain, Navigation, TrendingUp, Loader2, Upload
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CircuitPicker } from './CircuitPicker';
import { TrackSignatureForm } from './TrackSignatureForm';
import { SetupState } from '@/pages/SetupPage';
import { api, uploadAndAnalyzeCSV } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

interface CircuitCardProps {
  state: SetupState;
  onChange: (updates: Partial<SetupState>) => void;
}

export function CircuitCard({ state, onChange }: CircuitCardProps) {
  const { session } = useAuth();
  const { toast } = useToast();
  
  // Data lists
  const [circuits, setCircuits] = useState<any[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMagicLoading, setIsMagicLoading] = useState(false);

  // Dialog triggers
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMagicOpen, setIsMagicOpen] = useState(false);
  const [editingCircuit, setEditingCircuit] = useState<any | null>(null);

  // Fetch data
  const fetchData = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const [circuitsRes, sessionsRes] = await Promise.all([
        api.getCircuits(session.access_token).catch(() => ({ circuits: [] })),
        api.getLastSessions(session.access_token, 3).catch(() => ({ sessions: [] }))
      ]);
      
      if (circuitsRes && circuitsRes.circuits) {
        setCircuits(circuitsRes.circuits);
      }
      if (sessionsRes && sessionsRes.sessions) {
        setRecentSessions(sessionsRes.sessions);
      }
    } catch (err) {
      console.error("Error fetching circuits and sessions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.access_token) {
      fetchData();
    }
  }, [session]);

  const handleSelect = (circuit: any) => {
    onChange({ circuit });
  };

  const handleReset = () => {
    onChange({ circuit: null });
  };

  const handleCreateNew = () => {
    setEditingCircuit(null);
    setIsFormOpen(true);
  };

  const handleEditActive = () => {
    if (!state.circuit) return;
    setEditingCircuit(state.circuit);
    setIsFormOpen(true);
  };

  const handleSaveSignature = async (signatureData: any) => {
    if (!session?.access_token) return;
    try {
      let savedCircuit;
      if (editingCircuit?.id) {
        // Edit mode
        const res = await api.updateCircuit(session.access_token, editingCircuit.id, signatureData);
        savedCircuit = res.circuit;
        toast({
          title: "Circuit mis à jour",
          description: `Les caractéristiques de "${savedCircuit.name}" ont été modifiées.`,
        });
      } else {
        // Create mode
        const res = await api.createCircuit(session.access_token, signatureData);
        savedCircuit = res.circuit;
        toast({
          title: "Circuit créé",
          description: `Le circuit "${savedCircuit.name}" a été ajouté à votre compte.`,
        });
      }

      const sessionUpdates: any = {};
      if (editingCircuit?._sessionInfo) {
        const { weather, trackTemp, airTemp, mode } = editingCircuit._sessionInfo;
        sessionUpdates.weather = weather;
        sessionUpdates.trackTemp = trackTemp;
        sessionUpdates.airTemp = airTemp;
        sessionUpdates.mode = mode;
      }

      onChange({
        circuit: savedCircuit,
        ...sessionUpdates
      });

      // Refresh list
      fetchData();
    } catch (err) {
      console.error("Error saving circuit:", err);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le circuit.",
        variant: "destructive"
      });
    } finally {
      setIsFormOpen(false);
      setEditingCircuit(null);
    }
  };

  const handleMagicSessionSelect = (s: any) => {
    setIsMagicLoading(true);
    setIsMagicOpen(false);
    
    setTimeout(() => {
      const trackTemp = s.track_temperature || '';
      const airTemp = s.air_temp || '';
      const weather = s.weather || 'sec';
      const mode = s.session_type || 'course';
      
      const circuitData = {
        id: s.circuit_id || undefined,
        name: s.track_name || 'Circuit Importé',
        speedRatio: s.speed_ratio || 'mixte',
        rotation: s.rotation || 'horaire',
        elevation: s.elevation || 'plat',
        bumpiness: s.bumpiness || 'lisse',
        hairpinsCount: s.hairpins_count ?? 2,
        fastCornersCount: s.fast_corners_count ?? 3,
        imported: true,
        _sessionInfo: {
          weather: weather as any,
          trackTemp: trackTemp ? Number(trackTemp) : '',
          airTemp: airTemp ? Number(airTemp) : '',
          mode: mode as any
        }
      };

      setEditingCircuit(circuitData);
      setIsMagicLoading(false);
      setIsFormOpen(true);
      
      toast({
        title: "Télémétrie chargée",
        description: `Caractéristiques détectées par ApexAI prêtes pour validation.`,
      });
    }, 800);
  };

  const handleFileUploadAndAnalyze = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.name.endsWith(".csv")) {
      toast({
        title: "Format invalide",
        description: "Seuls les fichiers de télémétrie .csv sont acceptés.",
        variant: "destructive"
      });
      return;
    }

    setIsMagicLoading(true);
    setIsMagicOpen(false);

    try {
      const result = await uploadAndAnalyzeCSV(selectedFile, {
        accessToken: session?.access_token ?? undefined,
      });

      const trackTemp = result.session_conditions?.track_temperature || '';
      const airTemp = result.session_conditions?.air_temp || '';
      const weather = result.session_conditions?.track_condition || 'sec';
      
      const speedRatio = result.track_features?.speed_ratio || 'mixte';
      const rotation = result.track_features?.rotation || 'horaire';
      const elevation = result.track_features?.elevation || 'plat';
      const bumpiness = result.track_features?.bumpiness || 'lisse';
      const hairpinsCount = result.track_features?.hairpins_count ?? 2;
      const fastCornersCount = result.track_features?.fast_corners_count ?? 3;

      const circuitData = {
        name: result.session_conditions?.circuit_name || 'Circuit Analysé',
        speedRatio,
        rotation,
        elevation,
        bumpiness,
        hairpinsCount,
        fastCornersCount,
        imported: true,
        _sessionInfo: {
          weather: (weather === 'dry' ? 'sec' : weather === 'wet' ? 'pluie' : 'humide') as any,
          trackTemp: trackTemp ? Number(trackTemp) : '',
          airTemp: airTemp ? Number(airTemp) : '',
          mode: 'course' as any
        }
      };

      setEditingCircuit(circuitData);
      setIsFormOpen(true);

      toast({
        title: "Télémétrie analysée !",
        description: "Les caractéristiques du tracé ont été extraites avec succès.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erreur d'analyse",
        description: err.message || "Impossible d'analyser le fichier de télémétrie.",
        variant: "destructive"
      });
    } finally {
      setIsMagicLoading(false);
    }
  };

  const getSourceBadge = (c: any) => {
    if (!c) return null;
    if (c.imported || c.created_by === 'telemetry') {
      return <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full">Importé</Badge>;
    }
    if (c.created_by) {
      return <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full">Perso</Badge>;
    }
    return <Badge className="bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full">Officiel</Badge>;
  };

  const activeCircuit = state.circuit;

  return (
    <Card className="bg-card border-border rounded-2xl shadow-md hover:shadow-primary/5 transition-all overflow-visible">
      <CardHeader className="bg-muted/30 border-b border-border pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Circuit
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        {isMagicLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-muted-foreground text-sm">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            Extraction et analyse des données de piste...
          </div>
        ) : !activeCircuit ? (
          /* STATE 1: SELECTION */
          <div className="space-y-6">
            <CircuitPicker 
              value={null}
              onChange={handleSelect}
              circuits={circuits}
              loading={loading}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="gap-2 h-12 bg-background/50 border-primary/20 text-primary hover:bg-primary/5 rounded-xl"
                onClick={() => setIsMagicOpen(true)}
              >
                <Sparkles className="w-4 h-4 text-primary" />
                Depuis la Télémétrie
              </Button>
              <Button
                variant="outline"
                className="gap-2 h-12 bg-background/50 border-border hover:bg-muted/50 rounded-xl"
                onClick={handleCreateNew}
              >
                <Plus className="w-4 h-4" />
                Nouveau Circuit
              </Button>
            </div>
          </div>
        ) : (
          /* STATE 2: ACTIVE */
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
                  {activeCircuit.name || activeCircuit.label}
                </h3>
                <div className="mt-2">
                  {getSourceBadge(activeCircuit)}
                </div>
              </div>
            </div>

            {/* Visual badges for signature */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="secondary" className="gap-1.5 py-1 px-3 bg-muted/60 text-foreground border border-border rounded-lg">
                <Zap className="w-3.5 h-3.5 text-primary" />
                Ratio : {activeCircuit.speedRatio || 'Mixte'}
              </Badge>
              <Badge variant="secondary" className="gap-1.5 py-1 px-3 bg-muted/60 text-foreground border border-border rounded-lg">
                {activeCircuit.rotation === 'anti-horaire' ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 text-primary" /> Anti-Horaire
                  </>
                ) : (
                  <>
                    <RotateCw className="w-3.5 h-3.5 text-primary" /> Horaire
                  </>
                )}
              </Badge>
              <Badge variant="secondary" className="gap-1.5 py-1 px-3 bg-muted/60 text-foreground border border-border rounded-lg">
                <Mountain className="w-3.5 h-3.5 text-primary" />
                Relief : {activeCircuit.elevation === 'vallonne' ? 'Vallonné' : 'Plat'}
              </Badge>
              <Badge variant="secondary" className="gap-1.5 py-1 px-3 bg-muted/60 text-foreground border border-border rounded-lg">
                <Navigation className="w-3.5 h-3.5 text-primary" />
                Revêtement : {activeCircuit.bumpiness === 'bossele' ? 'Bosselé' : 'Lisse'}
              </Badge>
              <Badge variant="secondary" className="gap-1.5 py-1 px-3 bg-muted/60 text-foreground border border-border rounded-lg">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                {activeCircuit.hairpinsCount ?? 2} Épingles
              </Badge>
              <Badge variant="secondary" className="gap-1.5 py-1 px-3 bg-muted/60 text-foreground border border-border rounded-lg">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                {activeCircuit.fastCornersCount ?? 3} Courbes Rapides
              </Badge>
            </div>

            {/* Card Actions Panel */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-10 border-border hover:bg-muted/50 rounded-xl"
                onClick={handleEditActive}
              >
                <Edit2 className="w-4 h-4 text-muted-foreground" />
                Modifier / Renommer
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-10 border-primary/20 text-primary hover:bg-primary/5 rounded-xl"
                onClick={handleReset}
              >
                <RefreshCw className="w-4 h-4 text-primary" />
                Changer de piste
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* dialog forms */}
      <TrackSignatureForm 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveSignature}
        circuitName={editingCircuit?.name || ""}
        initialData={editingCircuit}
      />

      <Dialog open={isMagicOpen} onOpenChange={setIsMagicOpen}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="w-5 h-5 text-primary" />
              Charger depuis la Télémétrie
            </DialogTitle>
            <DialogDescription className="text-xs">
              Sélectionnez une session existante ou importez directement un fichier CSV pour en extraire les caractéristiques de la piste.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">
                Sessions de télémétrie récentes
              </label>
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                {recentSessions.length > 0 ? (
                  recentSessions.map((s) => (
                    <div 
                      key={s.id} 
                      className="p-3 bg-muted/30 border border-border hover:bg-primary/5 hover:border-primary/30 rounded-xl cursor-pointer transition-all flex flex-col gap-0.5 group"
                      onClick={() => handleMagicSessionSelect(s)}
                    >
                      <span className="font-semibold text-foreground group-hover:text-primary transition-colors text-xs">
                        Session sur {s.track_name || 'Circuit Inconnu'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Date : {s.session_date ? new Date(s.session_date).toLocaleDateString() : 'Inconnue'}
                      </span>
                      {s.session_type && (
                        <Badge variant="secondary" className="w-fit mt-1 text-[9px] px-1.5 py-0">
                          {s.session_type}
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">Aucune session trouvée.</p>
                )}
              </div>
            </div>

            <div className="border-t border-border/50 pt-3">
              <label className="block text-xs font-semibold text-muted-foreground mb-2">
                Ou analyser un nouveau fichier de télémétrie (.csv)
              </label>
              <div className="relative border border-dashed border-border rounded-xl p-4 hover:border-primary/55 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer group text-center">
                <input 
                  type="file" 
                  accept=".csv"
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={handleFileUploadAndAnalyze}
                />
                <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-xs font-bold text-foreground">Importer et analyser un CSV</span>
                <span className="text-[9px] text-muted-foreground">MyChron5, AiM, RaceBox standard</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
