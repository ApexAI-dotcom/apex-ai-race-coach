import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, History, MapPin, Calendar, Save, Trash2 } from 'lucide-react';
import { api, normalizeCircuit } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { SetupState } from '@/pages/SetupPage';

interface SavedSetupsCardProps {
  refreshKey: number;
  onSelectSetup: (setup: SetupState) => void;
  onNewSetup: () => void;
  onSaveSetup: () => void;
  isSaving: boolean;
}

export function SavedSetupsCard({ refreshKey, onSelectSetup, onNewSetup, onSaveSetup, isSaving }: SavedSetupsCardProps) {
  const { session } = useAuth();
  const [setups, setSetups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSetups = async () => {
      if (!session?.access_token) return;
      try {
        const res = await api.getKartSetups(session.access_token);
        if (res && res.setups) {
          setSetups(res.setups);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des setups:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSetups();
  }, [session, refreshKey]);

  const handleDelete = async (setupId: string) => {
    if (!session?.access_token) return;
    if (!confirm("Voulez-vous vraiment supprimer ce réglage ?")) return;
    try {
      await api.deleteKartSetup(session.access_token, setupId);
      setSetups(prev => prev.filter(s => s.id !== setupId));
    } catch (err) {
      console.error("Erreur de suppression:", err);
      alert("Impossible de supprimer le réglage.");
    }
  };

  return (
    <Card className="bg-card border-border rounded-2xl shadow-md h-full flex flex-col overflow-hidden">
      <CardHeader className="bg-muted/30 border-b border-border pb-4 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="w-5 h-5 text-primary" />
          Mes Réglages
        </CardTitle>
        <Button size="sm" variant="outline" className="gap-2 rounded-full border-primary/20 text-primary hover:bg-primary/10" onClick={onNewSetup}>
          <Plus className="w-4 h-4" /> Nouveau
        </Button>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 flex flex-col">
        {loading ? (
          <div className="flex justify-center items-center p-8 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : setups.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <History className="w-6 h-6 text-primary/50" />
            </div>
            <p className="text-sm">Aucun réglage sauvegardé</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 max-h-[480px]">
            <div className="divide-y divide-border">
              {setups.map((s) => (
                <div 
                  key={s.id} 
                  className="p-4 hover:bg-primary/5 cursor-pointer transition-colors group flex items-center justify-between"
                  onClick={() => {
                    const parsedSetup: SetupState = {
                      id: s.id,
                      setupName: s.setup_name || '',
                      weather: s.weather || 'sec',
                      grip: s.grip || 'normal',
                      airTemp: s.air_temp || '',
                      trackTemp: s.track_temp || '',
                      mode: s.mode || 'course',
                      circuit: s.circuits ? normalizeCircuit({ ...s.circuits, id: s.circuit_id }) : (s.circuit || null),
                      recommendations: s.recommendations || null,
                      tireModel: s.tire_model || '',
                      coldPressureFront: s.cold_pressure_front || '',
                      coldPressureRear: s.cold_pressure_rear || '',
                      hotPressureFront: s.hot_pressure_front || '',
                      hotPressureRear: s.hot_pressure_rear || '',
                      trackWidthFront: s.track_width_front || '',
                      trackWidthRear: s.track_width_rear || '',
                      rideHeightFront: s.ride_height_front || 'standard',
                      rideHeightRear: s.ride_height_rear || 'standard',
                      camber: s.camber || '',
                      caster: s.caster || '',
                      rearAxle: s.rear_axle || '',
                      sprocketFront: s.sprocket_front || '',
                      sprocketRear: s.sprocket_rear || '',
                      carbConfig: s.carb_config || {},
                      driverWeight: s.driver_weight || '',
                      kartWeight: s.kart_weight || '',
                      targetWeight: s.target_weight || '',
                      ballast: s.ballast || '',
                    };
                    onSelectSetup(parsedSetup);
                  }}
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {s.setup_name || "Réglage non nommé"}
                    </h4>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {s.circuits ? s.circuits.name : (s.circuit?.name || "Circuit Inconnu")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(s.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(s.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      
      <CardFooter className="p-4 border-t border-border bg-muted/10">
        <Button onClick={onSaveSetup} disabled={isSaving} className="w-full gap-2 rounded-full h-11 shadow-lg shadow-primary/20">
          <Save className="w-4 h-4" />
          {isSaving ? "Enregistrement..." : "Enregistrer le réglage"}
        </Button>
      </CardFooter>
    </Card>
  );
}
