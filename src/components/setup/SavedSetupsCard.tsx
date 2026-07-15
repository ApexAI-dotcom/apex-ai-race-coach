import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, History, MapPin, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { SetupState } from '@/pages/SetupPage';

interface SavedSetupsCardProps {
  onSelectSetup: (setup: SetupState) => void;
  onNewSetup: () => void;
}

export function SavedSetupsCard({ onSelectSetup, onNewSetup }: SavedSetupsCardProps) {
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
  }, [session]);

  return (
    <Card className="bg-card border-border rounded-2xl shadow-md h-full flex flex-col overflow-hidden">
      <CardHeader className="bg-muted/30 border-b border-border pb-4 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="w-5 h-5 text-primary" />
          Historique
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
            <p className="text-sm">Aucun setup sauvegardé</p>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="divide-y divide-border">
              {setups.map((s) => (
                <div 
                  key={s.id} 
                  className="p-4 hover:bg-primary/5 cursor-pointer transition-colors group"
                  onClick={() => {
                    const parsedSetup: SetupState = {
                      weather: s.weather || 'sec',
                      airTemp: s.air_temp || '',
                      trackTemp: s.track_temp || '',
                      mode: s.mode || 'course',
                      circuit: s.circuits ? { id: s.circuit_id, name: s.circuits.name } : (s.circuit || null),
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
                    };
                    onSelectSetup(parsedSetup);
                  }}
                >
                  <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {s.setup_name || "Setup non nommé"}
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
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
