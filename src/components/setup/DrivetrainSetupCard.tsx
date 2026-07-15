import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Gauge } from 'lucide-react';
import { SetupState } from '@/pages/SetupPage';

interface DrivetrainSetupCardProps {
  state: SetupState;
  onChange: (updates: Partial<SetupState>) => void;
  engineCategory: string;
}

export function DrivetrainSetupCard({ state, onChange, engineCategory }: DrivetrainSetupCardProps) {
  const isX30OrMini = engineCategory.toLowerCase().includes('x30') || engineCategory.toLowerCase().includes('mini 60');
  const isRotaxOrKZ = engineCategory.toLowerCase().includes('rotax') || engineCategory.toLowerCase().includes('kz');

  const updateCarbConfig = (key: string, value: string | number) => {
    onChange({
      carbConfig: {
        ...(state.carbConfig || {}),
        [key]: value
      }
    });
  };

  return (
    <Card className="bg-card border-border rounded-2xl shadow-sm overflow-hidden h-full">
      <CardHeader className="bg-muted/30 border-b border-border pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gauge className="w-5 h-5 text-primary" />
          Moteur & Carburation
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Transmission</h4>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Pignon (Dents)</Label>
              <Input 
                type="number" 
                placeholder="Ex: 11" 
                value={state.sprocketFront}
                onChange={(e) => onChange({ sprocketFront: e.target.value ? Number(e.target.value) : '' })}
                className="bg-background"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Couronne (Dents)</Label>
              <Input 
                type="number" 
                placeholder="Ex: 82" 
                value={state.sprocketRear}
                onChange={(e) => onChange({ sprocketRear: e.target.value ? Number(e.target.value) : '' })}
                className="bg-background"
              />
            </div>
          </div>
        </div>

        {/* Logique conditionnelle pour la carburation */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Carburation ({engineCategory})</h4>
          
          <div className="grid grid-cols-2 gap-6">
            {isX30OrMini && (
              <>
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">Vis Haut (H) - Tours</Label>
                  <Input 
                    type="text" 
                    placeholder="Ex: 1T 5m" 
                    value={state.carbConfig?.highSpeedScrew || ''}
                    onChange={(e) => updateCarbConfig('highSpeedScrew', e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">Vis Bas (L) - Tours</Label>
                  <Input 
                    type="text" 
                    placeholder="Ex: 1T 15m" 
                    value={state.carbConfig?.lowSpeedScrew || ''}
                    onChange={(e) => updateCarbConfig('lowSpeedScrew', e.target.value)}
                    className="bg-background"
                  />
                </div>
              </>
            )}

            {isRotaxOrKZ && (
              <>
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">Gicleur Principal</Label>
                  <Input 
                    type="number" 
                    placeholder="Ex: 125" 
                    value={state.carbConfig?.mainJet || ''}
                    onChange={(e) => updateCarbConfig('mainJet', e.target.value ? Number(e.target.value) : '')}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">Gicleur de Ralenti</Label>
                  <Input 
                    type="number" 
                    placeholder="Ex: 60" 
                    value={state.carbConfig?.pilotJet || ''}
                    onChange={(e) => updateCarbConfig('pilotJet', e.target.value ? Number(e.target.value) : '')}
                    className="bg-background"
                  />
                </div>
              </>
            )}

            {!isX30OrMini && !isRotaxOrKZ && (
              <div className="col-span-2 text-sm text-muted-foreground italic">
                Configuration de carburation non définie pour ce type de moteur.
              </div>
            )}
          </div>
        </div>
        
      </CardContent>
    </Card>
  );
}
