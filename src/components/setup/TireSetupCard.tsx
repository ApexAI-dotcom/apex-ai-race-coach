import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Disc3 } from 'lucide-react';
import { SetupState } from '@/pages/SetupPage';

interface TireSetupCardProps {
  state: SetupState;
  onChange: (updates: Partial<SetupState>) => void;
}

export function TireSetupCard({ state, onChange }: TireSetupCardProps) {
  const inputClass = "bg-background/50 border-border focus-visible:ring-primary focus-visible:border-primary transition-all duration-300 hover:border-primary/50";

  return (
    <Card className="bg-card border-border rounded-2xl shadow-md hover:shadow-primary/5 transition-all overflow-hidden h-full">
      <CardHeader className="bg-muted/30 border-b border-border pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Disc3 className="w-5 h-5 text-primary" />
          Pneumatiques
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        
        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground">Modèle de pneus</Label>
          <Input 
            type="text" 
            placeholder="Ex: Komet K2M" 
            value={state.tireModel}
            onChange={(e) => onChange({ tireModel: e.target.value })}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Pressions à Froid</h4>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Avant (bar)</Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="0.80" 
                value={state.coldPressureFront}
                onChange={(e) => onChange({ coldPressureFront: e.target.value ? Number(e.target.value) : '' })}
                className={inputClass}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Arrière (bar)</Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="0.80" 
                value={state.coldPressureRear}
                onChange={(e) => onChange({ coldPressureRear: e.target.value ? Number(e.target.value) : '' })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Pressions à Chaud (Cible)</h4>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Avant (bar)</Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="0.95" 
                value={state.hotPressureFront}
                onChange={(e) => onChange({ hotPressureFront: e.target.value ? Number(e.target.value) : '' })}
                className={inputClass}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Arrière (bar)</Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="0.95" 
                value={state.hotPressureRear}
                onChange={(e) => onChange({ hotPressureRear: e.target.value ? Number(e.target.value) : '' })}
                className={inputClass}
              />
            </div>
          </div>
        </div>
        
      </CardContent>
    </Card>
  );
}
