import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench } from 'lucide-react';
import { SetupState } from '@/pages/SetupPage';

interface ChassisSetupCardProps {
  state: SetupState;
  onChange: (updates: Partial<SetupState>) => void;
}

export function ChassisSetupCard({ state, onChange }: ChassisSetupCardProps) {
  const inputClass = "bg-background/50 border-border focus-visible:ring-primary focus-visible:border-primary transition-all duration-300 hover:border-primary/50";
  const selectClass = "bg-background/50 border-border focus:ring-primary focus:border-primary transition-all duration-300 hover:border-primary/50";

  return (
    <Card className="bg-card border-border rounded-2xl shadow-md hover:shadow-primary/5 transition-all overflow-hidden h-full">
      <CardHeader className="bg-muted/30 border-b border-border pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wrench className="w-5 h-5 text-primary" />
          Châssis & Géométrie
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Voies (mm)</h4>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Avant</Label>
              <Input 
                type="number" 
                placeholder="Ex: 120" 
                value={state.trackWidthFront}
                onChange={(e) => onChange({ trackWidthFront: e.target.value ? Number(e.target.value) : '' })}
                className={inputClass}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Arrière</Label>
              <Input 
                type="number" 
                placeholder="Ex: 1400" 
                value={state.trackWidthRear}
                onChange={(e) => onChange({ trackWidthRear: e.target.value ? Number(e.target.value) : '' })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Hauteurs</h4>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Avant</Label>
              <Select value={state.rideHeightFront} onValueChange={(val) => onChange({ rideHeightFront: val })}>
                <SelectTrigger className={selectClass}>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basse">Basse</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="haute">Haute</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Arrière</Label>
              <Select value={state.rideHeightRear} onValueChange={(val) => onChange({ rideHeightRear: val })}>
                <SelectTrigger className={selectClass}>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basse">Basse</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="haute">Haute</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Géométrie & Arbre</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Carrossage (Camber)</Label>
              <Input 
                type="text" 
                placeholder="Ex: Neutre, -1 barre..." 
                value={state.camber}
                onChange={(e) => onChange({ camber: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Chasse (Caster)</Label>
              <Input 
                type="text" 
                placeholder="Ex: Standard, max..." 
                value={state.caster}
                onChange={(e) => onChange({ caster: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">Dureté de l'arbre arrière</Label>
            <Input 
              type="text" 
              placeholder="Ex: Médium, Dur, H, M..." 
              value={state.rearAxle}
              onChange={(e) => onChange({ rearAxle: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
        
      </CardContent>
    </Card>
  );
}
